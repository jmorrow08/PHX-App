# PHX DB Hardening + Gap Fixes — Applied 2026-07-30

> STATUS: shipped — kept for reference (migrations 029–033 applied 2026-07-30)

Migrations 029–033 applied directly to Supabase project `dnzvtathfpjelffjnqrc` (README's migration table ends at 028; this documents what changed since).

## 029 — function_search_path + view hardening
- Pinned `search_path = public, pg_temp` on all 26 public functions (closes the advisor's `function_search_path_mutable` warning on all 25 flagged).
- `artist_stats`, `top_tracks`, `user_payout_breakdown` views switched to `security_invoker = true` (clears all 3 ERROR-level `security_definer_view` findings; verified the app doesn't query these views, so no client impact).

## 030 — RLS tightening
- Dropped `feed_posts` INSERT/UPDATE always-true policies (all social writes already go through SECURITY DEFINER RPCs; verified no direct client writes in app.html). Direct REST edits of other people's posts are no longer possible.
- Dropped `push_subscriptions` DELETE-true policy (anyone could delete all push subscriptions).
- `tracks` INSERT now requires `status='pending' AND is_active=false` — the submit form still works, but nobody can self-publish a live track via the REST API.

## 031 — Monthly stream cap (fraud) + merch schema
- `stream_events.counted` boolean added. `record_stream()` now applies a Deezer-style cap: max **1,000 payout-counted streams per user per calendar month**; overflow streams still log for analytics/recs but carry `counted=false`.
- `artists` gains merch fields for the beta merch plan: `merch_enabled`, `merch_external_url`, `fourthwall_shop_url`, `fourthwall_storefront_token`.

## 032 — Payout engine respects the cap
- `run_monthly_payout()` now filters `counted = true` in all four stream queries (subscriber wallets, per-artist allocations, free-tier fund totals and splits). Stream farms past the cap earn $0.

## 033 — Execute-grant lockdown
- `run_monthly_payout`, `notify_push`, `handle_new_user`: EXECUTE revoked from `PUBLIC`, `anon`, and `authenticated`. Verified: calling `run_monthly_payout` as `anon` now returns `permission denied`. Only service role / postgres (i.e., the payout cron and admin tooling) can run payouts.

## Verified after changes
- `record_stream()` sanity check passes (`track_not_found` on bogus id — function healthy).
- Advisor re-run: **0 ERROR findings** (was 3). Remaining WARNs, all intentional or pending client-side work:
  - `anon_security_definer_function_executable` on client-facing RPCs — by design; they're internally guarded (`require_admin`/rate limits). Revisit after bootstrap mode closes.
  - `rls_policy_always_true` on 3 INSERT-only policies (`notify_interest` signup, `push_subscriptions` registration, `user_events` analytics) — intentional public writes.
  - `public_bucket_allows_listing` on `track-audio` / `post-media` — fixing requires the signed-URL playback change in app.html (client-side work).
  - `auth_leaked_password_protection` — one toggle in Supabase Dashboard → Authentication → Passwords (can't be set via SQL). **Do this in the dashboard.**

## Still open (needs app.html changes or human steps)
1. **Close bootstrap mode**: Jaye signs up through the real auth UI → `SELECT set_user_role('<auth-uid>','super');` — until then admin RPCs are open by design.
2. Enable leaked-password protection (dashboard toggle, 30 seconds).
3. Rotate VAPID keypair + PUSH_INTERNAL_SECRET → Supabase Edge Function secrets (values currently in `.env.local`).
4. Private buckets + signed-URL playback (app.html change).
5. Demo role bar removal / auth-derived roles (app.html change).
6. Stripe billing + Connect (needs Stripe account keys).
7. Merch UI: artist dashboard fields + artist-page merch grid reading the new columns (app.html change; Vercel proxy for the Fourthwall Storefront API).
