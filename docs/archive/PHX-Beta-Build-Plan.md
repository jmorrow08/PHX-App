# PHX — Beta Build Plan

> STATUS: superseded by PHX-Master-Status-and-Loose-Ends.md — most gaps listed here have since closed (auth roles, bootstrap, invite gate)
### Everything it takes to get real users signed up and the first artist live
*Prepared July 30, 2026 · Based on a full audit of the phx codebase, the live Supabase project (dnzvtathfpjelffjnqrc), the Lytbub Technologies stack, and deep research into streaming law, payout rails, audio infra, and merch integrations.*

---

## 1. Where the app actually stands (audit results)

The good news: PHX is **much closer to beta than a prototype**. 28 migrations are applied, RLS is enabled on all 26 tables, real Supabase Auth (signup/login/session) is wired, the social layer (feed, likes, comments, reposts, follows, notifications, push) is live, the wallet+pot royalty engine is built and simulation-verified, track submission → admin approval → live catalog works end to end, and the DB has seed data (3 artists, 5 tracks).

What stands between today and a real beta is a short, specific list — not a rebuild:

| # | Gap | Why it blocks beta |
|---|---|---|
| 1 | **Demo role bar still drives identity** | Anyone can switch to Admin/Super in the UI. Roles must come only from `profiles.role` via auth. |
| 2 | **Bootstrap mode is still open** | Until the first `super` profile exists, admin RPCs (approve tracks, payout settings, `set_user_role`) are callable with just the anon key. This is the single most urgent security item. |
| 3 | **No Stripe billing** | Nobody can actually pay $15/$29. Wallets stay empty; the whole model is theoretical until this lands. |
| 4 | **No payout execution** | Engine calculates, but Stripe Connect transfers don't exist. Artists can see earnings but never receive money. |
| 5 | **Audio bucket is public** | Any track (including future exclusives) is downloadable by URL. Needs signed URLs. |
| 6 | **Guest-UUID identity everywhere** | Streams, likes, posts key off `phx_guest_id`. Payout math needs streams tied to the paying auth user. |
| 7 | **Artist onboarding is admin-manual** | No flow to invite an artist, have them claim their page, accept the artist agreement, and get their dashboard. |
| 8 | **No merch at all** | Listed on the landing page, nothing behind it. |
| 9 | **Legal/compliance basics** | DMCA agent, clickwrap artist license agreement, ROSCA-compliant cancel, Stripe Tax. |
| 10 | **Secrets hygiene** | VAPID private key + push secret sit in `.env.local` and the edge function body; rotate and move to Supabase secrets. |

---

## 2. Security hardening (do this first — 1–2 days)

Ran Supabase's security advisors against the live project. Findings and fixes:

**Critical / before any real user:**
- **Close bootstrap mode.** Sign Jaye up through the real auth flow, run `SELECT set_user_role('<his-auth-uid>','super')`, then verify every admin RPC (`set_user_role`, `approve_track`, `reject_track`, `update_payout_settings`, `resolve_report`, `set_post_hidden`, `run_monthly_payout`) rejects the bare anon key. Add a migration that **revokes EXECUTE from `anon`** on all admin RPCs outright — don't rely on the in-function guard alone. The advisor flags all 25 SECURITY DEFINER functions as anon-executable.
- **Rotate the VAPID keypair and PUSH_INTERNAL_SECRET** (they're in a file that's been shared/synced) and store them as Supabase Edge Function secrets, not in code. Set `verify_jwt` appropriately on `send-push` (it's currently `false` — fine only if the internal secret check is solid, better to lock both).
- **Make `track-audio` private.** Serve audio via `createSignedUrl` (60–300s TTL) minted per authenticated request. Both buckets (`track-audio`, `post-media`) currently allow public listing — disable listing at minimum. This also becomes your per-user play log (fraud evidence).
- **Fix the 3 SECURITY DEFINER views** (`artist_stats`, `top_tracks`, `user_payout_breakdown`) — recreate with `security_invoker = true` or wrap in guarded RPCs. These are ERROR-level advisories: they bypass RLS for whoever queries them.

**High / before launch week:**
- **Set `search_path`** on all 25 flagged functions (`SET search_path = public, pg_temp` in each definition) — standard SECURITY DEFINER hygiene.
- **Tighten the 7 always-true RLS policies** (`feed_posts`, `tracks`, `notify_interest`, `push_subscriptions`, `user_events`). Writes already go through RPCs, so direct-table INSERT/UPDATE policies can be dropped or scoped to `auth.uid()`.
- **Enable leaked-password protection** in Supabase Auth settings (one toggle; advisor-flagged).
- **Migrate identity from guest UUID → `auth.uid()`**: streams, likes, follows, posts, notifications should attach to the auth user when logged in (keep guest UUID only for logged-out Explorer browsing). Payouts must only count streams from authenticated, paying members — the engine's inputs depend on this.
- Add **Sentry** (you already run it in Lytbub HQ — same pattern) and Supabase log drains for the edge function.

---

## 3. The money path (the real build work — ~2 weeks)

This is the Lytbub HQ playbook applied to PHX. You've already built lead→quote→invoice→pay there; this is subscribe→stream→wallet→payout.

**3a. Stripe subscriptions (members pay in):**
- Products: Native $15/mo, Insider $29/mo (+ founding-member prices, see launch doc). Stripe Checkout + customer portal (gives you ROSCA-compliant one-click cancel for free).
- Vercel serverless webhook (`checkout.session.completed`, `customer.subscription.updated/deleted`, `invoice.payment_failed`) → upsert `subscriptions` row keyed to `auth.uid()`; tier claims flow into the app from the DB, never from the client.
- **Enable Stripe Tax** — Arizona TPT reaches digital subscriptions. Enable Radar. Run dunning (Smart Retries) — failed cards are 30–40% of all churn.
- Wallet accrual rule: credit a subscriber's wallet only after the invoice is **paid** (chargeback-aware).

**3b. Stripe Connect Express (artists get paid):**
- Artist dashboard gets a "Set up payouts" button → Express onboarding (Stripe collects SSN/bank/W-9, ~5 min per artist).
- Monthly job: `run_monthly_payout()` (already built) → review screen → execute transfers via the API → mark `artist_payouts` paid.
- Costs: $2/active-payout-month per artist + 0.25% + $0.25 per payout. So set a **$25 minimum payout with rollover** — below that, fees eat ~10%.
- 1099s through Stripe ($2.99/form e-filed). Note: streaming royalties are typically 1099-MISC Box 2 with a **$10** threshold (not the new $2,000 services threshold) — one CPA question to confirm. Net-60 (already implemented) doubles as your fraud-review window.

**3c. Fraud hardening for real money:**
Your model already has the right bones (30s threshold, session dedup, 60 tracks/hr, device fingerprint, and self-streaming has negative ROI by design). Add two cheap Deezer-style caps before real payouts: **max counted streams per user per month** (e.g., 1,000 — a user streaming 5,000× counts each as 0.2) and a **flag queue** for review before each payout run (>20h/day listening, single-artist-only accounts, many accounts per device/card fingerprint). Stolen-card + self-stream is the one profitable attack; Radar + paid-invoice-only accrual + Net-60 closes it.

---

## 4. Artist onboarding — "create the first artist page and give him access"

The exact flow to build (~3–4 days), designed so Murkemz can be live artist #1:

1. **Admin creates/claims-links an artist.** Admin panel: "Invite artist" → creates `artists` row (or picks existing, e.g. Murkemz who's already seeded) + generates a one-time invite link tied to that artist_id.
2. **Artist claims.** Invite link → real Supabase signup → `profiles.role = 'artist'`, profile linked to `artists.id` (add `artists.owner_user_id` column + RLS so an artist can only edit their own row/tracks).
3. **Clickwrap the Artist Agreement** at claim time (versioned acceptance record — you already have the legal center + clickwrap pattern; the agreement needs the clauses in §6).
4. **Artist lands on their dashboard**: profile editor (bio, photo, links), track submission, My Tracks with live counts, analytics, earnings, **top-fans list** (the data artists actually act on — build the simple version: top 10 listeners by 30s plays), payout setup (Connect), merch settings (§5).
5. **Public artist page** at `/a/<slug>` — hero, tracks, feed posts, merch, follow button, share/QR. This page is also the marketing asset artists push to their fans. (Pages/slugs infra already exists — this is wiring, not new architecture.)

---

## 5. Merch — the Spotify pattern first, native later

Research verdict (full details in the research appendix below): **don't build checkout for beta.** Even Spotify doesn't — artists connect a store and Spotify renders products. Do the same with **Fourthwall** (built for musicians, $0/mo, artist keeps 100% above base cost, and — critically — **Fourthwall is the merchant of record**, so sales tax, refunds, chargebacks, and customer support are all their problem, not yours).

Also decisive: because PHX is an **Arizona-based** company, the moment you run native merch checkout you're a marketplace facilitator under AZ law and must collect TPT **from dollar one** — no $100K remote-seller threshold for in-state platforms. Letting Fourthwall be MoR during beta sidesteps that entirely.

**Beta build (2–5 days):**
- `artists` gets `merch_external_url`, `fourthwall_storefront_token`, `merch_enabled`.
- Artists with any existing store: link-out button (ship day 1).
- Artists onboarded through PHX: create a free Fourthwall shop, paste their Storefront API token → a Vercel proxy fetches their products and PHX renders the merch grid natively on the artist page in PHX styling; Buy goes to Fourthwall checkout (`/cart/checkout?products=...`). Print-on-demand (tees from ~$11.75 base, hoodies ~$27, delivered in 7–10 days), plus they can add their own items. Fourthwall publishes an open-source headless reference implementation.
- Track merch clicks per artist in `user_events` so you can show artists "PHX drove N sales."
- **Beta terms: PHX takes 0% on merch.** Strongest possible artist pitch, zero liability. Announce the future native store carries ~10% (Bandcamp parity).

**V2 (post-traction, ~3–6 weeks):** native `merch_products/orders` tables + Stripe Checkout with Connect **destination charges** (`application_fee_amount` = your 10%) + Stripe Tax + **Printful Orders API** for fulfillment (DistroKid's exact model) + AZ TPT registration. Dropshipping "like Shopify" = this: customer pays PHX, webhook posts the order to Printful, Printful prints/ships under the artist's brand, you keep the spread. Skip artist-shipped inventory (vinyl, handmade) in beta — link those out to Bandcamp/Big Cartel.

---

## 6. Legal & compliance checklist (cheap, but mandatory before artist #1)

Your licensing posture is clean **because artists upload only their own originals and license you directly** — no MLC, no PRO blanket licenses needed at your scale. Protect that posture:

- ☐ **DMCA agent registration** — $6, copyright.gov, 10 minutes. Publish a /copyright page (takedown + counter-notice process) and a **repeat-infringer policy** (3 strikes) in ToS. This is your safe harbor; without it one uncleared sample could be an expensive problem.
- ☐ **Artist Upload & License Agreement** (clickwrap, versioned): non-exclusive worldwide license covering master + composition **including mechanical and public-performance rights** (US PRO affiliations are non-exclusive, so self-published writers can grant this directly); warranty of 100% ownership **including co-writers**; **no covers, no uncleared samples** (contractually ban covers at launch — cheapest legal posture); indemnification; payout terms (50% wallet mechanics, Net-60, $25 min, fraud clawback); takedown rights; **no-AI-training clause** (2026's #1 artist trust signal — put it in marketing too).
- ☐ Member ToS + Privacy: 13+ age gate, clear subscription terms pre-charge, easy cancel (Stripe portal covers it). Your existing legal center holds these.
- ☐ **Tripwires to calendar** (not needed now): >4,000 tracks or >$40K/mo revenue → MLC "significant nonblanket licensee" analysis; adding covers → MLC blanket license ($2,500/yr min); adding **ticketing → FTC Junk Fees all-in pricing** applies.
- ☐ CPA: AZ TPT registration for subscriptions, royalty-vs-services 1099 characterization.
- ☐ Human listen-through of every beta upload (feasible at your scale; it's also your best infringement screen until fingerprinting).
- One structural note from your own master plan docs: the Plug City deal + entity/IP paperwork was flagged as the gate before real money flows. Signing artists and taking subscriptions is that threshold — worth an attorney pass on the artist agreement (~$1.5–4K) before launch, not after.

---

## 7. Audio infrastructure

- **Now (0–50 artists):** stay on Supabase Storage but switch to signed URLs (§2). Progressive MP3/AAC with Range requests is correct for a vanilla-JS `<audio>` app — you don't need HLS at this scale.
- **Ingest upgrade (1 week, can follow launch):** small transcode worker (a $5/mo Fly.io/Railway container polling a jobs table — Supabase Edge Functions can't run ffmpeg): normalize uploads to 128kbps AAC + measure loudness (`ffmpeg loudnorm`, store LUFS, apply playback gain client-side toward −14 LUFS — the Spotify convention; never destructively normalize the master), generate a 30s preview clip + waveform peaks, cover-art resize. This also fixes the missing **cover art upload** roadmap item.
- **At ~1–2K listeners:** move audio files to **Cloudflare R2** (zero egress fees) behind a Worker that verifies the Supabase JWT and mints short-lived URLs. At 3TB/mo of listening, Supabase egress ≈ $100–250 vs R2 ≈ $7. Audio blobs are immutable — migration is a weekend, so deferring is safe.
- **Exclusives (Insider tier):** step up those tracks to HLS + AES-128 encryption later; signed short-TTL URLs are enough for beta.

## 8. Ops & platform

- Custom domain (phx.app / getphx.com / whatever's cleared) on Vercel; PWA already installable.
- Transactional email (Resend — already in the Lytbub stack): welcome, receipts (Stripe sends its own), payout statements, "your track was approved."
- Swap the regex content filter for a managed moderation API before public launch (README already flags this; OpenAI moderation endpoint is free-tier friendly).
- Backups: enable Supabase PITR ($100/mo tier) *or* nightly `pg_dump` via GitHub Action to R2 (free-ish) — money tables demand one of them.
- Monitoring: Sentry + a #phx-alerts channel; the smoke-test-script pattern from Lytbub HQ (scripts/smoke.ts) ports directly.

## 9. Cost picture at beta scale

| Item | Monthly |
|---|---|
| Supabase Pro | $25 |
| Vercel | $0–20 |
| Transcode worker (Fly/Railway) | $5 |
| Resend | $0–20 |
| Stripe | 2.9% + 30¢ on subs; ~$2.33/artist payout month |
| Fourthwall / merch | $0 |
| Sentry | $0 (dev tier) |
| One-time: DMCA $6 · attorney review $1.5–4K · CPA consult ~$300 | — |
| **Fixed burn** | **≈ $50–75/mo** |

## 10. Build sequence — fastest path to "first artist live with access"

**Week 1 — Lock the doors, wire identity**
1. Close bootstrap mode; revoke anon on admin RPCs; rotate VAPID/push secrets. (Day 1)
2. Fix SECURITY DEFINER views, search_path, always-true policies, leaked-password toggle. (Day 2)
3. Private audio bucket + signed-URL playback. (Day 2–3)
4. Auth-first identity: role from `profiles`, remove demo bar behind a `?dev` flag, bind streams/likes/posts/follows to `auth.uid()`. (Day 3–5)

**Week 2 — Money in**
5. Stripe Checkout + portal + webhooks → `subscriptions`; Stripe Tax + Radar; paid-invoice wallet accrual. (Day 6–9)
6. Signup/upgrade UI: Explorer free → Native/Insider checkout; founding-member pricing flags. (Day 9–10)

**Week 3 — Artist #1**
7. Artist invite → claim → clickwrap → dashboard flow (§4); public artist page + QR. (Day 11–14)
8. Merch: link-out + Fourthwall headless grid. (Day 14–15)
9. Legal: DMCA agent, artist agreement live, /copyright page. (parallel, Day 11+)
10. **Onboard Murkemz for real**: claim link, agreement, 2–3 tracks through the real pipeline, Connect payout setup, Fourthwall shop, artist page live. He can log in and watch streams the same day.

**Week 4 — Money out + polish**
11. Connect Express onboarding + payout execution + review screen; fraud caps + flag queue. (Day 16–19)
12. Transcode/loudness/cover-art worker; Sentry; backups; moderation API swap. (Day 19–21)
13. Closed beta invite wave #1 (see launch strategy doc).

Three to four focused weeks to a real, secured, billing-enabled beta with artist #1 live — the app itself is already most of the way there.
