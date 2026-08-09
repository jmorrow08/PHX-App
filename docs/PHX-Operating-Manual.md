# PHX — Operating Manual

*The everything-document. One read explains the whole business and app: what exists, how it works, and where the levers are. Kept current so Ash, future admins, and new hires all work from the same truth. Last full revision: 2026-08-09.*

---

## 1. What PHX is

A **Phoenix scene membership**, not a streaming service. Members buy a pass ($9.99 Native / $19.99 Insider, founding rates locked for life; $15/$29 after founding). Their pass pays the Phoenix artists **they actually play** — with a monthly receipt proving it. Music is live today; Events, Eats, Drops, Audio, Cuts roll out as verticals on the same pass. Invite-only: every signup redeems a code.

**The money story (internal-only numbers):** platform share % lives in `payout_settings` (50 today — open founder decision). Community Pot funds beta wallets so artists get paid real dollars before billing exists. NEVER shown publicly: split percentages, pot balance, per-member wallet math. Public-safe: "your pass pays the artists you play," artist counts, receipt percentages.

## 2. Stack & where things run

- **App**: one file — `app.html` (vanilla JS PWA) serving `/app` (members) and `/studio` (ops). Landing = `index.html`. Legal = `legal.html`. Deployed on **Vercel** (cleanUrls; `/:slug` rewrites to the app for vanity URLs; 1-year immutable cache on assets — **always bump `?v=` when editing shared.js/css or assets, and never request the new URL until the deploy finishes** or the CDN pins stale content).
- **Backend**: **Supabase** (`dnzvtathfpjelffjnqrc`, us-west-1) — Postgres + RLS, Auth, Storage (private `track-audio`, public `post-media`, covers), Edge Functions (`sign-audio`, `ash`), pg_cron, pg_net, Vault.
- **Email**: Resend, two pipelines — auth emails (Supabase SMTP) and app emails (`email_queue` → `drain_email_queue()` cron every 5 min; key = Vault secret `RESEND_API_KEY`).
- **Canonical domain**: thephx.app. Repo: github.com/jmorrow08/PHX-App.

## 3. Identity model (one person, one public face)

- **profiles** = the account (role: member/artist/admin/super; member tier explorer/native/insider; founding_number; access_status). Display name falls back to the chosen @tag — nobody is "PHX Member".
- **artists** = the artist identity (tier basic/full/headline, status pending/active, verified ✓). An account that owns an artist row IS that artist publicly: their member profile is hidden from search/rosters/people-carousels, and member-page links redirect to the artist page.
- **pages** = businesses/creators (categories map to future verticals). *Artist-type pages are internal posting voices, never listed.*
- **member_profiles** = device-era guests only (legacy).
- Multi-page (Jaye + Bryce only) via `profiles.allow_multi_page`; partner code-minting via `can_mint_codes`.
- @tag changes: Settings only, 30-day cooldown (`change_username`).

## 4. Codes & onboarding

Every signup redeems a code. Three kinds:
1. **Personal codes** (auto-minted): members get one lasting code, 3 uses (`platform_settings.member_invites_each`); artists get one lasting **unlimited** fan code at approval. One code per person — shown on My Pass only.
2. **Admin typed codes** (Studio → Launch Desk → Generate): Member or Artist lane, optional tier, uses count, optional "email it" (queued via Resend).
3. **Claim codes/bundles**: hand a pre-built identity over (pages arrays, artist rows, tier grants, multi-page + minting flags). Redeeming skips the wizard.

Flow: code/`?ref=` link → Create Account opens pre-filled → 4-step wizard (handle → photo → follows → points primer/tour) → artist signups sit **pending & invisible** until Studio → Artists → **Approve — go live** (mints fan code, notifies). Verify ✓ is separate (real person, PHX connection, owns catalog, 1+ live track). Referrals pay **PHX Points only** (+50/+25) — free months never exist anywhere.

## 5. Music system

- **Catalog**: tracks (status pending/live/rejected/hidden) — artists submit (genre required), admin reviews in Content. Albums auto-appear; New Releases includes singles with Album/EP/Single badges. Genres: `genres` table drives chips + search.
- **Player**: the bottom bar is the player — full-width top-edge draggable seek bar, tap opens the sheet (cover art, SVG controls, up next, recently played). Audio is served ONLY by the `sign-audio` edge function (private bucket, tier gates server-side; hidden/pending refused; guests get 20-second previews).
- **Playlists & library**: playlists (50/user, 500 tracks), liked songs, play-all/shuffle as real queues, play-next.
- **Streams**: count at 30s (industry standard); `stream_events` records seconds, tier, counted, is_simulated. Farming is uncounted and unpaid.
- **Artist videos**: YouTube links embedded in-app (privacy mode); artists manage their own Videos tab.
- **Payout engine v3**: time-weighted (min(sec,240)/240, 30s floor), tier-aware caps (wallet÷1000), counted-only; beta = pot funds virtual wallets, unused never leaves; runs 1st monthly (pg_cron) + Studio run-now.

## 6. Social layer

City Feed (posts, 90s/50MB clips w/ trim sheet, camera via OS-native capture — the app never touches camera/mic APIs directly), PHX Reactions (tap 🔥 / hold for labeled five-bar), one-level replies, quote reposts, ⋯ menu (copy link/report/admin-hide), follows + tappable follower/following lists, favorites (tier-capped 3/6/12), Clips vertical player with **watermarked Save-and-share export** (burned-in PHX + @author + thephx.app). Feed ranking: engagement × age-decay + follow-boost; all writes via SECURITY DEFINER RPCs with rate limits + content filter.

## 7. Tiers — capabilities are data, not code

`tiers` table: each tier carries a **capabilities JSON** that the app enforces:
- member: favorites_shelf 3/6/12 (server-enforced), exclusives access, receipt, flair/early_drops (Insider).
- artist: `analytics` basic|full (gates the deep artist dashboard), `monthly_post_cap` (10 for Basic — DB trigger enforces; friendly composer error), `tracks_cap`, merch/wallet flags.
- business: directory/links/booking flags (enforcement lands with those verticals).
Changing an entitlement = editing the JSON row. No deploy. Pre-billing, `billing_live=false` opens full listening to active members; flipping it re-arms every gate.

## 8. Analytics (three altitudes)

1. **Studio → Analytics** (`admin_analytics`): DAU/WAU/MAU + stickiness, daily pulse chart (30/60/90d), funnel with step conversion (**tap a step → the actual people**), weekly retention cohorts, top tracks/artists by real listen time (**tap an artist → drill-down sheet**), engagement chips, audience, CSV export. Simulated streams excluded everywhere.
2. **Artist → Analytics** (`artist_analytics`): Full/Headline artists get the deep dashboard (daily chart, listeners, listen minutes, top tracks, listeners' pass mix); Basic sees totals + what Full unlocks (tier-capability gate in action).
3. **First-party attribution**: landing beacon (UTM/referrer → `user_events`), `signup_attrib` first-touch, screen views. No third-party trackers; Meta Pixel deliberately absent until IG ad spend.

## 8a. Engagement engine (streaks, points economy, rhythm)

Opening the app = the daily check-in (+5 pts, one toast, nothing else). Streaks: 3 days +15, 7 days +50 — computed server-side from check-in history. Listening bonuses (DB triggers, cap-guarded, simulated streams excluded): discover a new artist +3 (5/day), finish a track ≥90% +2 (10/day). Levels by lifetime points: Ember → Flame(100) → Inferno(500) → Phoenix(1500). Points are never money and never free months.

Surfaces (deliberately sparse): one boot toast · one pinned **City Question** above the composer (set tomorrow's in Studio → Analytics; seeded rotation otherwise) · **Your Week** card on My Pass (streak, listen min, artists backed, points, Early Ears = times among a track's first 10 listeners, level + progress) · **Scene Leaders** top-5 on Discover (resets monthly).

Weekly rhythm (pg_cron): **Monday 16:00 UTC** `phx-weekly-pulse` posts to City Feed as "the PHX app" — STREAMS language, never dollars pre-billing; skips quiet weeks. **Friday 16:00 UTC** `phx-weekly-digest` emails every active member (streams/new tracks/new members) through the Resend queue.


**Spending (negative ledger rows; balance floor 0; all server-enforced):** 🚀 Boost 250 (latest post +8 feedScore for 24h via `boosted_until`) · 🔥 Flame flair 150 one-time (`profiles.flair`, shown by names feed-wide) · ⭐ Spotlight vote 100 each (`spotlight_votes`, monthly; tally in Studio Engagement = founder picks next month's Featured Artist) · 🏆 Supporters wall 200 (`supporter_walls`, monthly, per artist — names show on the artist page; EXPLICIT opt-in so listening privacy holds). Shop lives on My Pass; wall + vote buttons live on artist pages. Also: scene-love earn (+2 commenting on an artist's post, cap 10/day), show RSVPs (`show_rsvps`, "🙋 I'm going" + counts), founding # + flair chips next to names in the feed, lineage line on My Pass ("Brought into the city by …").

Studio → Analytics → **Engagement Engine**: points issued by reason (7d), check-ins today, members on 3+ day streaks, month leaderboard, current prompt + setter. Money-language rule pre-billing: member surfaces say streams/fan-powered ("Backed By Your Plays"), never $.

## 9. Ash — the ops agent

Founder-only (role=super), Studio → Configure → Ash. Reads everything (read-only SQL executor + snapshot tools); **every change is a proposal card** — exact SQL + rationale — pending until Approve-&-run (Lytbub covenant; approvals never leave the app). Chat persists (`agent_chat`). Runs on the `ash` edge function (Anthropic, needs `ANTHROPIC_API_KEY` secret). Future: `ask_elby`/`ask_phx` peer tools bridge Ash to Elby on Lytbub — designed, not built. **Ash should treat this manual + the SOPs as his ground truth for how PHX is supposed to operate.**

## 10. Email

`email_queue` → Resend drainer (5-min cron, ≤3 retries, branded `_email_html` templates). Auto-sends: admin alerts on access requests, approve/deny/waitlist decisions, codegen "email this code". From `no-reply@thephx.app`. Launch Desk shows queue health + Send-now.

## 11. Operating rhythm & SOPs

Daily-during-launch: Launch Desk (pending requests, artists awaiting approval, signups, email health). Weekly: Studio → Analytics (funnel drop-offs, retention vs the ≥40% W4 gate, top content), Growth sources, pot ledger. Detailed procedures live in `PHX-Operations-SOP.md` (artist onboarding, code handout, verification, moderation, deploy, incidents); this manual is the map, that file is the checklists.

## 12. Go-live checklist (still open)

Stripe keys + billing_live flip · real audio uploads (biggest "feels real" step) · DMCA registered agent · attorney pass on Legal v1.1 · sim-data purge · platform-share % decision · SMS/TCPA after EIN.

## 13. Standing rules (learned the hard way)

- Money internals never reach member-facing copy. Free months don't exist.
- Never commit audit files with vulnerabilities, or prompts containing credentials.
- Asset edits require `?v=` bumps; never poll the new URL mid-deploy.
- Tables read directly by the client need explicit RLS policies (RLS-on with zero policies = silently empty, not an error).
- RPC return values are authoritative; same-statement SELECTs read stale snapshots.
- Verify with rollback transactions before touching launch-critical rows; hide (status flags), don't delete.
- Every deploy: `node --check` the extracted inline script first; verify on the live site, not just locally.
