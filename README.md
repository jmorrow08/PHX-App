# PHX App — Platform Documentation

PHX is an invite-only, fan-powered music membership for Phoenix city culture. Members stream local artists and their pass supports the artists they actually play — with a receipt.

**Stack:** Vanilla JS (single-page `app.html`, no build framework) · Supabase (Postgres + Auth + Storage + RLS) · Vercel · Chart.js
**Live:** https://thephx.app — vanity URLs work (`thephx.app/<artist-slug>` rewrites to the app; static OG pages live under `/a/<slug>`)
**DB:** Supabase project `dnzvtathfpjelffjnqrc` (us-west-1, AktivOrbit org)

> Last reconciled against the live database: 2026-08-08 (redesign pass — see docs/2026-08-08-redesign-changelog.md). Companion docs live in `docs/` — every doc there carries a `> STATUS:` header; superseded material is in `docs/archive/`.

---

## Pages

| File | URL | Purpose |
|---|---|---|
| `index.html` | `/` | Landing page — marketing, pass pricing, artist roster |
| `app.html` | `/app` | The entire app — member, artist, and admin surfaces (role-aware) |
| `legal.html` | `/legal` | ToS / Privacy / DMCA / Artist Agreement |
| `a/<slug>/index.html` | `/a/<slug>` | Static per-artist pages with real OG tags (social crawlers don't run JS). Built at deploy by `scripts/build-artist-pages.mjs` |
| — | `/<artist-slug>` | Vanity URL — `vercel.json` rewrites `/:slug` to `/app`, which resolves the slug client-side |

---

## Identity, Auth & Roles

- **Real Supabase Auth** (email/password). Signup is **invite-only** (`signup_requires_invite`), with an explicit terms checkbox persisted as `terms_accepted_at` + `terms_version`. Google sign-in is disabled.
- **Roles come only from the server** (`profiles.role`). `setRole()` from the console is inert; Super can step *down* via View-As, never anyone up. Admin surfaces are **removed from the DOM** (not hidden) for non-admin accounts, gated behind `_roleResolved` so removal never races auth.
- **Identity migration COMPLETE:** all SECURITY DEFINER functions derive identity from `auth.uid()` via `_effective_user()` instead of trusting a client-passed device ID; anon `EXECUTE` is revoked on member-only writes (migration 059, 2026-08-06). The device UUID (`phx_guest_id`) survives only as a guest-playback fallback and analytics key for logged-out visitors.
- **Single identity (2026-08-08):** a new account is EITHER a member or an artist — decided by the typed code they redeem, never self-selected. Multi-page is gated behind `profiles.allow_multi_page` (Jaye + Bryce only; reversible flag, the pages machinery is intact). If an account owns an artist page, the artist IS its public voice — no separate personal handle. Business page categories: Food & Drink / Style & Care / Fitness & Wellness / Retail & Brands / Nightlife & Events / Other. `member_profiles` is guests only.
- **Typed codes (2026-08-08):** every code carries `grants_role` (member|artist) + optional `grants_tier`, enforced by `redeem_invite_code` — an artist code sets `role='artist'` and auto-creates a pending artist row (`ensure_artist_row_for`). Admin mints via `admin_mint_code` (modal in Admin → Roster). Claim codes additionally hand over pre-built pages/artist records, skip the wizard, and grant multi-page automatically when the bundle holds >1 page. Tiers live in `public.tiers` (member free/native/insider · artist basic/full/headline · business basic/full).
- **Bootstrap is closed.** The first `super` profile exists (Jaye); every admin/money RPC requires an authenticated admin JWT.

---

## How Streaming Works

- **Pre-billing open listening (2026-08-08)** — until `platform_settings.billing_live = true`, every signed-in ACTIVE member streams the full catalog (client `canPlayTrack` + the `sign-audio` edge function both check the flag). This is the monitoring window for validating stream tracking before payments go live; flipping the flag re-arms every tier gate with no deploy.
- **30-second threshold** — a stream counts after 30 continuous seconds (JS timer, resets on track change/pause).
- **Deduplication** — `record_stream()` enforces one count per session per track via a unique index on `(track_id, session_id)`.
- **Rate limits** — DB-level: max 60 unique tracks per device per hour; max **1,000 payout-counted streams per user per calendar month** (overflow still logs with `counted=false` for analytics/recs).
- **Listen-seconds collection** — per-play listen time is recorded, feeding the future capped time-weighted payout formula (`docs/phx-open-decisions.md` #1).
- **Behavioral analytics** — `session_start` / `play_start` / `play_30s` events write to `user_events` with device fingerprint metadata; `impression_events` logs what users were shown. Feeds ranking and future fraud detection.
- **DB write** — qualifying streams insert into `stream_events` and atomically increment `tracks.stream_count` and `artists.total_streams`. Live tracks only.

---

## Royalty Model — Wallet + Pot (INTERNAL ONLY — never shown in UI)

The split is company knowledge; no member/artist surface states it. The pass funds the whole city platform, not just streaming.

```
Subscriber pays $15/mo
  └─ 50% platform share → funds the platform
  └─ 50% artist WALLET → drawn per qualifying stream
       ├─ Each stream draws min($0.0075, wallet ÷ their total streams)
       └─ Unused wallet balance → COMMUNITY POT at month end
            ├─ free-tier fund → pays artists for Explorer/anonymous streams
            │    (capped per-user-per-artist — bot protection)
            └─ platform share
```

**Engine:** `run_monthly_payout()` — SECURITY DEFINER, idempotent, writes the full ledger (`payout_periods` → `payout_allocations` → `artist_payouts`), respects the `counted` flag, credits unused wallets to the pot and pays free-tier plays from it, capped by the real pot balance (`pot_ledger`, admin-only). Knobs in `payout_settings` via `update_payout_settings()`.

**Current state: SIMULATION MODE.** No real money moves. Subscriptions, wallet balances, pot funding, and payout runs are simulated (`simulation_mode`, `seed_simulated_subscribers`, `simulate_listening`, `purge_simulation`). Stripe billing and Stripe Connect payout execution are **not built**. Sim rows must be purged before real launch.

## Money Visibility (the rules)

| Surface | Sees |
|---|---|
| Member receipt (`my_receipt()`) | Artists supported, ranked by **listening share — percentages only**. No dollar amounts on any member-facing surface. |
| Artist page (public) | Fan-powered message, supporter count, plays. **No earnings.** |
| Artist portal | Earnings visible **only to the artist themselves** (and withheld entirely while beta/simulation mode is on — plays + listeners + a "payouts haven't started" notice). |
| Admin | Everything: pot ledger, splits, per-artist payouts. **Community Pot is admin-only.** |

The public split is never stated. Copy says "your pass supports the artists you play" — accurate — never that every dollar reaches artists.

---

## Track Submission Flow

1. Artist submits via `/app` → Submit Track; audio uploads to the `track-audio` bucket, cover art to `track-covers`
2. Track row inserted with `status='pending'`, `is_active=false` (DB policy: nobody can self-publish a live track)
3. Admin reviews in Content → Pending Review (audio preview), then Approve (→ live, in catalog) or Reject (optional reason)
4. Submission and approval decisions generate notifications

## Storage

Buckets: `track-audio` (audio, locked down — no public listing), `track-covers` (cover art), `post-media` (feed video/photo, 50MB cap, video ≤90s). Audio plays via a hidden `<audio>` element when `audio_url` is set.

## Transactional Email

Two independent pipelines, both through Resend on the `thephx.app` domain:
1. **Auth emails** (confirm, reset, magic link) — Supabase Auth SMTP, configured in the dashboard.
2. **App emails** — anything the app queues into `email_queue` (`queue_email()`, server-side only): access-request alerts to admins, approve/deny/waitlist decisions, "email this code" from admin codegen. Drained every 5 min by pg_cron `phx-email-drainer` → `drain_email_queue()` → Resend API via pg_net; the key lives in Vault as `RESEND_API_KEY`; ≤3 retries then `failed` with the error stored on the row. Branded HTML lives in `_email_html()`. If Vault has no key the drainer no-ops and mail just waits.

---

## Social Layer (City Feed)

Feed posts with track attachments (playable cards), photo/video posts (camera capture + baked-in filters; **videos cap at 90 seconds / 50 MB** and autoplay muted inline as the feed scrolls — FB-style, sound on tap, tap video → Clips player), **PHX Reactions** (tap = 🔥 Heat; hold to pick 🔥 Heat / 🐦‍🔥 Risen / 🌵 City Love / 🥶 Chills / 🔁 On Repeat — one per member per post, stored on `post_likes.reaction`), **threaded comments** (one reply level, `parent_comment_id`, guarded in `add_post_comment`), quote reposts, native share sheet + `/app?post=<id>` deep links, song hearts (`track_likes`), **Favorite artists** (`favorite_artists`, tier-capped shelf 3/6/12, shown on member profiles, future Drops priority), follows (artists/pages/users) + Following feed, notifications with deep links, @usernames, official PHX App posting (admin-only), Clips vertical video feed.

All social writes flow through SECURITY DEFINER RPCs — never direct table writes — so validation and rate limits (5 posts/10min, 10 comments/min) can't be bypassed via the REST API.

**Ranking:** Popular/Latest/Music feed views (engagement × age-decay, freshness bonus, report demotion); Discover For You runs session co-listening (`get_cooccurrence_recs()`) + artist affinity + freshness; server-side feed assembler with editorial shelves and tunable `ranking_weights`. Locked weight decisions: `docs/phx-algorithm-decisions.md`. Ladder to ML models: `docs/recommendation-engine-research.md` (LightFM pipeline ready in `ml/`, run at ~1 month of data).

**Moderation:** user reporting (9 categories, deduped, rate-limited) → admin queue; `moderate_content()` regex filter blocks extreme content pre-insert (swap for a managed moderation API before public launch); admin hide/unhide via RLS, nothing deleted.

## Merch & Shows

Per-artist merch with **dual sources** — Fourthwall and/or Shopify (`artist_merch_secrets` admin-only, UNIQUE per artist). Product catalog (`merch_products`), fan-photo product tagging with review, merch reviews, click tracking (`merch_events`). `shows` table with artist/page-owner/admin upsert. Genres taxonomy + onboarding wizard.

---

## Database

- **94 migrations** applied to the live project (verify with Supabase MCP `list_migrations` — there is **no local `supabase/migrations/` directory**; migrations were applied remotely). Caveat: the numeric prefixes restarted mid-history (two independent `030`–`051` series exist), so migration *names* are not unique — the timestamp is the real ordering.
- **47 tables** in `public`, RLS enabled on all of them.
- Core: profiles, artists, albums, tracks, stream_events, user_events, impression_events, subscriptions, payout_* (periods/allocations/settings + artist_payouts + pot_ledger), feed_posts + post_likes/post_comments/track_likes, follows, notifications, pages, member_profiles (guests only), reports, invite_codes + claim_bundles + access_requests + referrals, merch_* tables, shows, genres, shelves + ranking_weights, email_queue, push_subscriptions, job_runs, partner_* (dormant).
- Key RPCs: `record_stream()`, `run_monthly_payout()`, `create_feed_post()`, `my_receipt()`, `search_all()`, `get_cooccurrence_recs()` — all SECURITY DEFINER with pinned `search_path`, identity from `_effective_user()`.

## Environment Variables

```bash
# phx/.env.local (gitignored)
SUPABASE_URL=https://dnzvtathfpjelffjnqrc.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

The anon key is embedded in `app.html` for client-side use; sensitive operations go through SECURITY DEFINER functions or edge functions.

## Deployment

**Host:** Vercel (auto-deploys from GitHub `jmorrow08/PHX-App`) · **Domain:** thephx.app
**Build:** `node scripts/build-artist-pages.mjs` (generates `/a/<slug>` OG pages) — otherwise static
**`vercel.json`:** clean URLs, `/:slug` → `/app` vanity rewrite, cache headers

---

## Feature Status

Three honest states: **✅ Live** (works in production with real data) · **🧪 Simulated** (engine built and verified, but the data/money is simulated) · **📋 Planned** (not built, or built-but-dormant as noted).

| Feature | Status |
|---|---|
| Music streaming (30s threshold, dedup, rate limits, monthly cap) | ✅ Live |
| Stream tracking + listen-seconds → Supabase | ✅ Live |
| Supabase Auth — invite-only signup, terms clickwrap, server-side roles | ✅ Live |
| Identity migration (auth.uid() via `_effective_user()`, anon EXECUTE revoked) | ✅ Live |
| Track submission → admin approval → live catalog | ✅ Live |
| City Feed: posts, likes, comments, reposts, media, track cards | ✅ Live |
| Follows + Following feed, notifications w/ deep links | ✅ Live |
| Multi-page accounts, claim codes, invite/referral codes | ✅ Live |
| @usernames, official PHX posting, View-As | ✅ Live |
| Reporting + admin queue + automated extreme-content filter | ✅ Live |
| Admin dashboards (streams, members, content, financials) | ✅ Live |
| Artist vanity URLs (`thephx.app/<slug>`) + static OG pages | ✅ Live |
| Merch (Fourthwall/Shopify dual-source, catalog, fan photos) | ✅ Live |
| Shows, genres + onboarding wizard, people search | ✅ Live |
| Member receipt (percentage-only) | ✅ Live |
| Feed ranking + Discover For You (heuristic rungs) | ✅ Live |
| Mobile responsive, bottom tabs, PWA install, Media Session API | ✅ Live |
| Legal center (ToS/Privacy/DMCA/Artist Agreement + clickwrap) | ✅ Live |
| Wallet + Pot payout engine (`run_monthly_payout`) | 🧪 Simulated — engine verified, simulation mode ON, no real money |
| Subscriptions / wallet balances / pot funding | 🧪 Simulated — no Stripe billing exists |
| Beta plays & artist earnings figures | 🧪 Simulated — dollars withheld from artist UI while in beta |
| Stripe billing (live subscriptions) | 📋 Planned — unbuilt |
| Payout execution (Stripe Connect transfers) | 📋 Planned — unbuilt |
| Email pipeline (`email_queue` → Resend) | 📋 Built but dormant — awaiting Resend API key + domain DNS |
| Web push (VAPID + edge function + pg_net trigger) | 📋 Built, unverified end-to-end in production |
| LightFM rung-2 recommender (`ml/train_lightfm.py`) | 📋 Ready — run at ~1 month of data |
| Admin split into separate surface | 📋 Planned — `docs/PHX-Admin-and-Analytics-Spec.md` |
| Event ingestion agent (Plug Map) | 📋 Planned — `docs/PHX-Event-Ingestion-Agent.md` |
| Capacitor native wrapper | 📋 Planned — `docs/native-app-capacitor.md` |
| PHX Eats / Cuts / Drops verticals | 📋 Planned — teaser tabs only |
| Ads | 📋 Revisit at ~5K MAU |

---

## Background Playback — Known Limitation

Web app ceiling: Android/Chrome background audio is solid once installed to home screen; iOS Safari suspends background tabs — Media Session API helps only in standalone (Add to Home Screen) mode, and users get a one-time instruction banner. Bluetooth/hardware keys are wired via `navigator.mediaSession`. True Spotify-grade background audio requires the Capacitor wrapper (documented, not built).

## Local Dev

```bash
cd phx
npx serve .
# Open http://localhost:3000/app
```

Sign in with a real account — the demo role bar is gone; roles come from `profiles.role`.
