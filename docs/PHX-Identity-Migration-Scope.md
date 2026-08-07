# PHX — Identity Migration Scope

> STATUS UPDATE (2026-08-07): The identity migration described here was COMPLETED in migration 059 — all SECURITY DEFINER functions now derive identity from auth.uid() via _effective_user(); anon EXECUTE revoked on member-only writes. See README security section.
_The plan to finish moving from "device ID = identity" to "the login = identity," which is the root of the remaining security holes. Drafted from a live audit of the database._

---

## The core problem, in one paragraph

PHX has **two competing notions of "who you are."** The old one is a random **device ID** (`phx_guest_id`, a UUID in the browser). The new one is the **real login** (`auth.uid()` from Supabase Auth). Some data and functions key on one, some on the other. Because many `SECURITY DEFINER` database functions **trust whatever ID the app hands them** instead of the verified login, they quietly bypass the row-level security — which is how "read anyone's notifications / receipt" and "act as another member" happen. The fix is to converge on **one identity — the login — everywhere**, and treat the device ID as a *guest-only* fallback for logged-out playback.

## The data reality (why now is the moment)

| Table | Rows | Keyed on | Note |
|---|---|---|---|
| `profiles` | **2** | `auth.uid()` | the only *real* accounts |
| `member_profiles` | 37 | `device_id` | device-era + test/sim identities |
| `stream_events` | 445 | `device_id` | **payout-critical**, but ~all sim/test |
| `notifications` | 7 | `auth.uid()` | new model |
| posts/likes/comments/follows | <30 total | mixed | tiny |

**Your real data is 2 accounts.** Everything else is disposable test/sim. So the cheapest, safest path is to **finish the migration now and purge the device-era rows**, rather than build permanent device→login linking machinery for data you don't need. This gets 10× harder after real members arrive — do it before launch.

## Target model

- **`auth.uid()` is the one identity** for every member action: posting, liking, following, comments, reports, reviews, notifications, receipts, streams-that-count-for-payout, referrals.
- **`device_id` survives for exactly one thing:** anonymous, logged-out playback (a visitor from an IG link hitting play before signing up). Those streams are "guest plays" — tracked for analytics, but they don't pay a wallet (which already matches your royalty model: only members generate payouts).
- Every `SECURITY DEFINER` function resolves identity through `_effective_user()` (which returns `auth.uid()` or NULL) and **ignores any client-supplied ID**.

## Function-by-function map

**✅ Already correct (use the login):** `redeem_invite_code`, `redeem_claim_code`, `my_referral_summary`, `update_my_page`, `update_my_profile`, `create_feed_post`, `add_post_comment`, `toggle_post_like`, `my_notifications` (fixed this session), `set_user_role` (admin), `admin_remove_account` (admin).

**🔴 Leak — read functions that trust the client ID (fix priority 1):**
| Function | Risk | Fix |
|---|---|---|
| `my_receipt` | read anyone's listening history | route through `_effective_user`; **but** streams key on `device_id` — see receipt note below |

**🟠 Impersonation — write functions that trust the client ID (fix priority 2):**
| Function | What an attacker can do | Fix |
|---|---|---|
| `create_page` | make pages owned by another user | use `_effective_user` as owner |
| `toggle_follow` | follow/unfollow as anyone; **inject arbitrary text into the victim's notification** | derive follower from login |
| `toggle_track_like` | fake likes that skew recommendations | derive user from login |
| `tag_product_in_post` / `tag_post_product` | fake product reviews as anyone | derive reviewer from login |
| `submit_report` | file reports as anyone | derive reporter from login |
| `accept_terms` | accept terms on another's behalf (legal integrity) | derive user from login |
| `claim_username`, `complete_onboarding`, `ensure_invite_code` | act during onboarding as another | derive from login (user is authed during onboarding) |

**🟡 Payout-sensitive (fix priority 3, careful):**
| Function | Note |
|---|---|
| `record_stream` | keys on `device_id` by design (guest playback must work logged-out). Fix: when signed in, record under `auth.uid()`; only fall back to `device_id` for true guests. This is what makes `my_receipt` fixable. |

## The receipt knot (why `my_receipt` can't be a one-liner)

`my_receipt` reads `stream_events` — which key on `device_id`. If we just switch it to `auth.uid()`, a signed-in member's receipt goes **blank**, because their historical streams live under a device ID. So the order matters:
1. Make `record_stream` write `auth.uid()` for signed-in listeners (device_id only for guests).
2. Then `my_receipt` (and the wallet/payout engine) can safely key on `auth.uid()`.
3. Purge or ignore the old device-keyed sim/test streams (they're disposable).

## Safe migration sequence

1. **Purge the disposable device-era data** (sim listeners, test streams, test member_profiles) — you have `purge_simulation()` already; use it. Fewer rows = simpler migration, and none of it is real.
2. **`record_stream`** → record under `auth.uid()` when signed in; `device_id` only for logged-out guests.
3. **`my_receipt`** → route through `_effective_user`, key on `auth.uid()`.
4. **The impersonation write set** (create_page, toggle_follow, toggle_track_like, tag_product_*, submit_report, accept_terms, onboarding helpers) → all through `_effective_user`, ignore client ID. Do these **with the matching client change** so the app stops passing `getGuestId()` and passes nothing (the server derives identity) — otherwise a member could "like" something and not see it reflected.
5. **Revoke `EXECUTE` from `anon`** on every members-only function (posting, liking, following, etc.) so signed-out visitors truly can't write — consistent with invite-only. Keep `anon` execute only on: `record_stream` (guest playback), `get_ranked_tracks`/`get_cooccurrence_recs` (public discovery), and the public read views.
6. **Backfill/verify**, then flip on billing.

## The client side (must move in lockstep)

The app currently uses `getGuestId()` as the identity token in many calls. As each function stops trusting the client ID, the app should **stop sending it** (or send it only for guest playback). The pattern: signed-in → the server uses the session; signed-out → only playback and public reads work, everything else prompts sign-in. This is one coordinated pass, not scattered edits — which is why it's a project, not a patch.

## Bottom line

You're ~60% migrated. The remaining 40% is one focused sweep — cheapest to do **now**, while real data is two accounts. Finishing it closes the receipt leak, the impersonation set, and the "anon can write" gap in one move, and it's the last thing standing between PHX and taking a credit card.
