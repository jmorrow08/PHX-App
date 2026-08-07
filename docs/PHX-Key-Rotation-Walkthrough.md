# PHX — Key Rotation Walkthrough

Three secrets need rotating. Do them in this order. Each section says what breaks if you get it wrong, so you can stop and ask before doing damage.

**One piece of good news first:** `push_subscriptions` has **0 rows** right now. Nobody has ever subscribed to push notifications. That means rotating the VAPID keys costs you *nothing* — no member loses their subscription, because there are no subscriptions. This is the cheapest this job will ever be. After you have real members, rotating VAPID silently unsubscribes every one of them.

---

# 1. GitHub token
**Time: 10 minutes. Risk: low — worst case you re-authenticate.**

The token `gho_WiYB…` is sitting in plaintext in two files on your Mac:

```
Murkemz Website/phx/.git/config
Murkemz Website/plug-city/.git/config
```

Same token in both, so one leak takes both repos. `gho_` means it's an **OAuth token** — almost certainly created when you ran `gh auth login` or authorized GitHub in an editor.

### Step 1a — Revoke it

Go to **github.com → Settings → Applications → Authorized OAuth Apps**. You'll see something like "GitHub CLI" or your editor. Click it → **Revoke access**.

The moment you do this, `git push` from those two folders stops working. That's expected. Steps 1b and 1c fix it.

### Step 1b — Set up SSH instead

SSH keys don't get embedded in config files, so this problem can't come back. You don't have one yet (I checked — `~/.ssh` has no public key).

In Terminal:

```bash
ssh-keygen -t ed25519 -C "alijayem1@gmail.com"
```

Press Enter three times to accept the defaults. When it asks for a passphrase you can leave it blank, or set one — if you set one, macOS Keychain will remember it.

Then copy the public key:

```bash
pbcopy < ~/.ssh/id_ed25519.pub
```

Go to **github.com → Settings → SSH and GPG keys → New SSH key**. Title it "MacBook Pro". Paste. Save.

Test it:

```bash
ssh -T git@github.com
```

You want to see: `Hi jmorrow08! You've successfully authenticated…`

### Step 1c — Point both repos at SSH

```bash
cd ~/Desktop/"Murkemz Website"/phx
git remote set-url origin git@github.com:jmorrow08/PHX-App.git

cd ~/Desktop/"Murkemz Website"/plug-city
git remote set-url origin git@github.com:jmorrow08/Plug-City-Records.git
```

Verify no token remains anywhere:

```bash
cd ~/Desktop/"Murkemz Website"
grep -r "gho_" */.git/config 2>/dev/null && echo "STILL THERE" || echo "clean"
```

You want `clean`. Then confirm push still works:

```bash
cd phx && git push
```

---

# 2. PUSH_INTERNAL_SECRET
**Time: 20 minutes. Risk: low right now (0 subscribers), high later.**

This is the shared password between your database and the `send-push` edge function. Right now it's `e46ac85c…`, typed directly into the body of the `notify_push()` database function — which means anyone who can read your database catalog can read it.

Two things are wrong and both get fixed here: the value is exposed, and it's stored in the wrong place.

**Order matters.** The database sends this secret; the edge function checks it. If they disagree, push silently stops. Since there are no subscribers, nothing is actually at risk today — but build the habit now: **update the receiver first, then the sender.**

### Step 2a — Generate a new secret

```bash
openssl rand -hex 32
```

Copy the output. That's your new secret. Keep the Terminal window open.

### Step 2b — Update the edge function (the receiver)

Go to **Supabase Dashboard → Project `phx-app` → Edge Functions → Secrets** (also reachable at Settings → Edge Functions).

Find `PUSH_INTERNAL_SECRET`. Update it to the new value. Save.

Redeploy `send-push` so it picks up the new value — Supabase does not always hot-reload secrets.

### Step 2c — Put it in Vault, not in the function body (the sender)

Your project already has the `supabase_vault` extension installed, so there's somewhere proper to keep this.

In **Dashboard → SQL Editor**, run this — replacing `PASTE_NEW_SECRET_HERE` with the value from 2a:

```sql
select vault.create_secret(
  'PASTE_NEW_SECRET_HERE',
  'push_internal_secret',
  'Shared secret between notify_push() and the send-push edge function'
);
```

Then rewrite `notify_push()` to read from Vault instead of carrying the secret in its source:

```sql
create or replace function public.notify_push()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_verbs jsonb := '{"like":"liked your post","comment":"commented on your post","repost":"reposted your post","follow":"followed you","system":"","report_update":"update on your report","track_share":"shared your track"}';
  v_title  text;
  v_secret text;
begin
  select decrypted_secret into v_secret
    from vault.decrypted_secrets
   where name = 'push_internal_secret';

  if v_secret is null then
    raise warning 'notify_push: push_internal_secret missing from vault; skipping';
    return new;
  end if;

  v_title := new.actor_name || ' ' || coalesce(v_verbs->>new.type, 'sent you a notification');

  perform net.http_post(
    url  := 'https://dnzvtathfpjelffjnqrc.supabase.co/functions/v1/send-push',
    body := jsonb_build_object(
      'secret',       v_secret,
      'recipient_id', new.recipient_id,
      'title',        v_title,
      'message',      coalesce(new.preview, ''),
      'url',          case when new.target_id is not null
                           then '/app?post=' || new.target_id else '/app' end
    ),
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  return new;
end;
$function$;
```

Note the `if v_secret is null` guard. Without it, a missing Vault entry would send the literal string "null" as the secret and you'd have no idea why push stopped.

### Step 2d — Confirm the old value is gone from the source

```sql
select position('e46ac85c' in pg_get_functiondef(oid)) = 0 as old_secret_gone
from pg_proc where proname = 'notify_push';
```

You want `true`.

### Step 2e — Update `.env.local`

Open `phx/.env.local` and replace the `PUSH_INTERNAL_SECRET=` line with the new value. This file is correctly gitignored and has never been committed — I verified that — so it's just for your own reference.

---

# 3. VAPID keys
**Time: 15 minutes. Risk: zero today, real later. Do it now.**

VAPID is the keypair that proves to Chrome/Safari/Firefox that a push notification genuinely came from you. The public half is embedded in your app; the private half signs each send.

**Do this today specifically because you have 0 subscribers.** Rotating VAPID invalidates every existing subscription — every subscriber would silently stop receiving notifications and would have to re-subscribe. At 0 subscribers that costs nothing. At 500 it's a real incident.

### Step 3a — Generate a new pair

```bash
npx web-push generate-vapid-keys
```

You'll get:

```
Public Key:
BN...long string...

Private Key:
...shorter string...
```

Keep both. The public one goes in your app; the private one never leaves Supabase.

### Step 3b — Update the edge function

**Dashboard → Edge Functions → Secrets:**

- `VAPID_PRIVATE_KEY` → the new private key
- `VAPID_PUBLIC_KEY` → the new public key

Redeploy `send-push`.

### Step 3c — Update the app

Open `phx/app.html` and go to **line 6990**. You'll find:

```js
var PUSH_PUBLIC_KEY = 'BE4MIUP0n3nN6XQD2MHXoOCJwQnz4NTDw987srpOFtVRPAzTUyreht-OHQtfHcfRhd1w0FzDB15hfjAKcX5KwGc';
```

Replace that string with your new **public** key. The public key is meant to be in client code — that's not a leak, it's how web push works. The private key must never appear here.

### Step 3d — Clear out any stale subscriptions

It should already be empty, but confirm and clear:

```sql
delete from public.push_subscriptions;
select count(*) from public.push_subscriptions;   -- expect 0
```

### Step 3e — Update `.env.local`

Replace both `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`.

### Step 3f — Test it end to end

Deploy, open the app on your phone, allow notifications, then check that a row actually appeared:

```sql
select user_id, left(endpoint, 50) as endpoint, created_at
from public.push_subscriptions;
```

If a row appears, trigger something that creates a notification (have someone follow you, or insert a test notification) and confirm the push lands. If the row appears but no notification arrives, the secret in step 2 and the edge function disagree — recheck 2b.

---

# Afterwards

Run the checker to confirm nothing sensitive slipped into a tracked file:

```bash
cd ~/Desktop/"Murkemz Website"/phx
node scripts/check-app.mjs
```

And the one thing I'd add while you're in the neighbourhood — your `.claude/settings.local.json` carries a standing `Bash(python3 -c ' *)` grant, which pre-approves running arbitrary Python in this project without asking. That's broader than anything else in the file. It also has permissions for an unrelated client project and a standing `apply_migration` grant for a different Supabase project. I'd delete all three entries.

---

## If something breaks

**`git push` fails after step 1** — you revoked the token before setting up SSH. Finish 1b and 1c; nothing is lost.

**Push notifications stop working** — the database and the edge function are using different secrets. Check that step 2b actually saved and that you redeployed `send-push`. Run the 2d query to see what the database thinks it's sending.

**"applicationServerKey does not match"** in the browser console — the public key in `app.html` doesn't match the one in the edge function. Recheck 3b and 3c, then clear `push_subscriptions` again, since browsers cache the old subscription.

Nothing in this list can lose data. The worst outcome at every step is that push stops working — and push currently reaches zero people, so you have a completely free window to get this right.
