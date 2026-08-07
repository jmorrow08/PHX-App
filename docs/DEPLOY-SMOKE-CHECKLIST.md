> STATUS: current as of 2026-08-07

# PHX — Deploy Smoke Checklist

Three production bugs have shipped by editing `app.html` and pushing straight
to `main`. All three parsed cleanly and only failed at runtime. This checklist
is the cheapest thing that would have caught them.

## The rule

**Never push straight to `main` for anything beyond a copy change.**

```bash
git checkout -b fix/whatever
# ...edit...
git push -u origin fix/whatever
```

Vercel builds a preview URL for every branch. Run the checklist there, then
merge. After merging, run it once more against `thephx.app`.

## Before you push — 10 seconds, catches syntax

```bash
python3 - <<'EOF'
import re, subprocess, tempfile, os
s = open('app.html').read()
b = re.findall(r'<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>', s, re.S)[0]
f = tempfile.NamedTemporaryFile('w', suffix='.js', delete=False); f.write(b); f.close()
r = subprocess.run(['node', '--check', f.name], capture_output=True, text=True)
print('SYNTAX OK' if r.returncode == 0 else r.stderr[:800]); os.unlink(f.name)
EOF
```

This only proves it *parses*. It would not have caught any of the three real
bugs — that's what the browser pass below is for.

## On the preview URL — the browser pass

Open DevTools console first. **Any red error is a blocker.**

| # | Check | Passing looks like |
|---|---|---|
| 1 | Load `/app` signed out | Feed renders, no console errors |
| 2 | Sign in | Lands on your role's view, sidebar populated — **not a blank shell** |
| 3 | City Feed | Posts render as cards, avatars load, author names clickable |
| 4 | Play a track | Audio starts, mini player fills in, artist name links out |
| 5 | Open an artist page | Hero photo, avatar tile, album sections, About tab |
| 6 | `/<artist-slug>` vanity link | Redirects into the app on the right artist |
| 7 | Every admin view | Each loads; no view is empty or stuck on "Loading…" |
| 8 | Mobile at 375px | Bottom tabs visible, no horizontal scroll, mini player not covering content |
| 9 | Sign out | Feed still readable; member actions prompt to join |

## Money-visibility spot check (never skip)

Scan every member-facing surface for `$`. The only places a dollar figure may
appear are the artist's own portal and admin. Receipts are percentage-only.
The Community Pot is admin-only.

## After merging to `main`

Re-run rows 1–5 against `https://thephx.app`. Deploys take ~45 seconds.

```bash
until curl -s https://thephx.app/app | grep -q "<a-string-from-your-change>"; do sleep 6; done; echo LIVE
```

## If you changed the database

Verify as an anonymous caller — RLS bugs do not show up while you are signed
in as an admin:

```bash
ANON=$(grep -o 'eyJ[A-Za-z0-9_.-]*' app.html | head -1)
SB=https://dnzvtathfpjelffjnqrc.supabase.co
# Should be empty or denied:
curl -s -H "apikey: $ANON" -H "Authorization: Bearer $ANON" "$SB/rest/v1/<table>?select=*" | head -c 200
```

Clean up any rows a test created. Verification data in production is still
production data.
