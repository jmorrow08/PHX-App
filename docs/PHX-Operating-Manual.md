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


---

## Update — August 22–24, 2026 (the media + map build)

_Everything below is live in production. Recorded here so Ash, future hires, and future sessions inherit the truth._

### Media pipeline (the composer is now a camera app)
- **Video posting fixed at the root**: caption optional with media (client + server), oversize videos auto-compress through the trim re-encoder instead of silently dying, upload failures toast AND log to `user_events`, poster frames captured & stored (`feed_posts.media_poster`).
- **Feed video renders IG-style**: portrait 4:5 crop, landscape ≤1.91:1, poster-first paint, no letterbox.
- **Filter rack** (photos AND video, baked in on post via offscreen re-encode): PHX Heat, Camelback, Ember, Monsoon, Desert Night, The 602, Vivid, Fade. Swipe across the preview to change; 🐦‍🔥 PHX stamp add-on; cover-frame picker drives the poster.
- **Song + video sound modes**: Video sound / Song only / Both (with song-volume slider) — baked into the file. Full-track only; snippet picker is future work.
- **PHX Lens** — in-app camera (`openPhxLens`): live swipe filters while framing, tap = photo, hold = video (90s cap), flip camera, filter bakes into the capture. Falls back to the OS camera if permission/API unavailable. Legal camera section updated (camera/mic only while Lens is open, on-device, nothing stored until the shutter).
- **Trim sheet**: dragging scrubs paused; release replays the selection.

### Boot & app-shell discipline
- **Boot veil**: covers first paint until identity + role + final view are settled; failsafe 4.5s. No intermediate layouts ever visible.
- **No throwaway paint**: with a stored session the explorer pre-paint is skipped entirely.
- **Resume veil**: on backgrounding, the screen is covered with the PHX mark so iOS's app-switcher snapshot never replays a stale page on reopen.
- **Navigation guard**: a role RE-run (token refresh/resume) never yanks navigation; only a genuine role change or boot navigates. Admin/super land on the Studio dashboard; members and artists land on Home.
- **Pull-to-refresh** on Home, Discover, Music, Plug Map, My Pass, artist + admin dashboards.
- Service worker precache refreshed (phx-shell-v6); asset URLs are version-bumped on change (standing rule).

### Feature credits & "Featured on"
- `artist_aliases` + `feature_claims`: artists claim the name they're credited under (My Tracks → 🪪 card); Studio → Artists → **Feature claims** approves; approval links every matching "ft." credit app-wide, past and future. Seeded: Jaye Mali, Murkemz, Timbawolf Bleez → DubsUpEnt.
- All feature credits render as underlined artist links wherever tracks render (catalog, albums, search, track manager) — audio or not.
- **"Featured on" stats** (`artist_featured_stats`): plays your credits earned on other artists' songs, all-time + 30d, on the artist dashboard. STATS ONLY — a stream counts once, to the track owner. **Money splits: deliberately deferred** until billing; recorded direction = owner-set optional splits.

### Plug Map (city calendar)
- Live view (🗺️ nav): list + dark map (Leaflet/CARTO), range chips, RSVP inline, kind tags. `city_events` view = artist shows ∪ published `events`.
- **Ingestion pipeline live and dormant-safe** (`ingest-events` edge function, spec: PHX-Event-Ingestion-Agent.md): pg_cron nightly 09:10 UTC + fast pass 23:00 UTC, auth via `internal_secrets.INGEST_SECRET`. Pass 1 geocodes artist-added shows (Nominatim, polite rate). Pass 2 syncs Ticketmaster Phoenix music events (auto-publish, trust .95) — **no-ops until** `TICKETMASTER_API_KEY` is inserted into `internal_secrets`. Past events auto-expire. Runs logged to `ingest_runs`.
- **Studio → Launch Desk → Event queue**: draft (low-trust) events wait for 1-tap publish/reject.
- Weekly "🗺️ This week in the city" auto-post (Thu 9am PHX) from the PHX page; skips quiet weeks.
- **To finish v2**: Ticketmaster key (developer.ticketmaster.com → insert into internal_secrets), venue page_read sources + flyer submissions → queue, followed-artist/venue event notifications.

### Community & catalog
- DubsUpEnt (Timbawolf Bleez) full discography seeded from Apple Music data: Love As A Verb EP (2026), Damage: Hits n Cuts (2021), Fully Loaded (2018) — 29 tracks, real art, features credited (Murkemz, Jaye Mali, Zae Stone et al.), audio pending upload.
- Artist approval now: in-app notification + email + **City Feed broadcast from the PHX page** (first approval only).
- Weekly artist listener-report email (Mon), personalized Friday digest, day-before show reminders to RSVPs — all cron.
- Drops: First Listen (favorites early) / Favorites only / Open, track picker, auto-drop when a gated track goes live; favorites gates enforced server-side in sign-audio v3.
- Long-press discipline (nothing selects except posts/comments/bios/inputs), horizontal overflow clipped app-wide, admin tables scroll inside cards.


---

## Update — August 25, 2026 (Ash grows up, the feed grows up)

- **Ash v5**: key self-healing (env secret → internal_secrets fallback, malformed values rejected); full audit trail in `agent_tool_log` (every SQL read, page fetch, proposal — timestamped); event-queue duty (review_events + fetch_page tools, LEGIT/LIKELY/SUSPICIOUS verdicts, one-tap "Ash, review these" button in Launch Desk); **morning digest** cron 6:15am PHX (`phx-ash-morning-digest`) → agent_chat + push to supers. Auth: founder JWT enforced in code for chat/execute; digest op uses INGEST_SECRET (verify_jwt off at platform, gates in code).
- **Cancellation watch**: Ticketmaster status codes → canceled events leave the map automatically; rescheduled/postponed get status_note chips.
- **Launch Desk**: accordion cards (pending queues auto-open), rich event-queue rows (art, date/time, venue-known ✓, source, submitter). Admin sidebar no longer carries My Pages/My Artist (those live at /app).
- **Feed, FB-grade on mobile**: posts edge-to-edge with hairline separators, full-bleed media, brighter text, redundant Home title bar hidden; composer collapses to one calm line until touched; photo lightbox with swipe-down dismiss; Clips exits with a right-swipe or the ‹ chevron.
- **Fixes**: /studio routing deterministic (transient signed-out resolution can't strand it on Home); artist genre inherits from first live track (DubsUpEnt backfilled Hip-Hop).

---

## Update — August 26, 2026 (the player learns to DJ)

- **Tap-to-play lag fixed at the root**: the track-row fetch and the sign-audio signed-URL mint used to run in *series* — now they run in parallel (`playTrackById` warms the URL while the metadata loads), in-flight mints are deduped (`_signedAudioPending`), and `PHX_AUDIO` preloads `auto` instead of `metadata`.
- **Song-to-song gap gone**: while a track plays, the *next* queue track's signed URL is minted and its bytes pre-buffered in a muted throwaway element (`_prefetchNextInQueue`, 1.5s after playback starts). The hop costs zero network.
- **AutoMix crossfade** (Apple-Music-DJ style): last ~6 seconds, the outgoing tail keeps playing on a disposable "ghost" audio element fading down while the incoming song fades up on the real player. Stream counting, listen-time and lock-screen stay bound to PHX_AUDIO — rules identical to a manual skip. Toggle lives under the transport controls in the expanded player (`phx_automix` in localStorage, default ON). **iOS caveat, by design**: Safari ignores `.volume` on media elements, so iPhones get the instant gapless hop instead of the fade — feature-detected (`_canFade`), and we deliberately do NOT route through WebAudio (it would enable fades but break background/lock-screen playback). Skipped for tracks under 45s and under shuffle (next is unknowable).
- **Ash digest is now a door**: tapping the morning-digest notification (type `system`, target `digest`) opens Studio → Ash for admins. `openNotification` now receives `target_type`; system rows read "sent a briefing".
- **Profile hero revamp** (FB-inspired, PHX-toned): taller banner (220px / 158px mobile), bigger avatar with deeper overlap and an ember ring (108px / 88px mobile), full-bleed hero on mobile matching the feed, larger display name. Applies to artists, members and pages — one shared `profileHeroHtml`.
- **PWA identity fix**: both manifests now declare explicit `id` + `scope` (`/app.html` + `/`, `/studio` + `/studio`). Without ids the two installs could collide as "the same app" in Chromium. iOS installs saved before the /studio routing fix should be deleted and re-added from thephx.app/studio.

---

## Update — August 26, 2026 (second drop: post flow, Lens v2, DMs, flare)

- **Full-screen post flow (FB pattern)**: the feed box is now a trigger — tapping it opens a dedicated New Post page. Step 1: voice selector, big writing area, attach options (Lens / camera roll / song). **Next** → step 2: a true feed preview with the last-minute tweaks (filters, PHX stamp, cover frame, soundtrack mix all live there), then Post. Leaving with work in progress asks **Save draft / Discard / Keep editing**; drafts (text + song) persist in localStorage and restore with a toast. All composer element ids unchanged → the whole media/bake/submit pipeline untouched.
- **PHX Lens v2**: the "zoomed in" bug was the getUserMedia constraint asking for portrait 1280×1920 — the browser center-cropped the landscape sensor. Now sensor-shaped 1920×1080 (phones rotate frames themselves). Photos capture at native resolution (cap 2560, JPEG .95, was 1280/.9); video canvas is 1080p-class. Added **pinch-to-zoom** riding the camera's real zoom capability (never a fake CSS blow-up; hidden when unsupported), a rule-of-thirds **grid toggle** (persisted), and a zoom badge.
- **DM system live**: `dm_threads`/`dm_messages`/`user_blocks` (RLS reads, SECURITY DEFINER writes). Server-side: moderation via `moderate_content`, blocks both directions, 30 msgs/5min rate limit, notification+push throttled to 1/thread/10min. Client: ✉️ topbar with unread badge, inbox + chat (5s poll, day separators, optimistic-ish send with reasons), action sheet (view profile / block / report — `reports.target_type` widened for `dm_thread`), entry buttons on member pages, page profiles (owner), and artist pages (artist.user_id). DM notifications deep-link into the thread.
- **Identity switcher (IG pattern)**: long-press the My Pass tab (or artist Tracks tab) → sheet of every voice the account owns (personal / artist page / other pages / PHX App for staff). Switching sets `phx_persona_choice` (the composer's existing voice), refreshes the feed, and opens that identity's own profile.
- **Flare bundle**: city-light theming (`data-daypart` dawn/day/sunset/night shifts the ember palette on Phoenix hours, refreshed 15-min); haptic taps (play/next/like/send — Android; iOS has no vibrate API); **Your 602 Rotation** (`my_602_rotation()` RPC — weekly-deterministic personal mixtape, seed flips Fridays PHX time, most-played artists first; card on Music view hides until ≥3 tracks have real audio); **listening ember** (canvas sparks behind the expanded player, playing-state-synced; deliberately no WebAudio analyser — it kills iOS background playback); **"in the city right now"** (`artist_city_now()` RPC — distinct listeners last hour / today under the artist name, signed-in only).

---

## Update — August 26, 2026 (third drop: Studio watches everything + event pages)

- **Post sheet escape bug fixed** (Jaye's live report): the sheet's ✕/Next header was buried under `#mob-appbar` (z-index 1100 vs the sheet's 535). The whole composer overlay stack now sits above it (sheet 1150, track sheet + trim 1160, bake modal 1170, Lens 1180). Added the two missing escapes: swipe-down on the header, and phone back-gesture/back-button (history.pushState on open; the draft guard intercepts and re-arms the entry so back never dumps you out of the app mid-draft).
- **Studio monitors the DM layer**:
  - Reports queue: `dm_thread` reports get a real review path — "💬 Review thread" opens `admin_dm_thread_messages` (admin-only, keyed to the report row so no report = no admin eyes on private messages; every open is audit-logged to user_events as `admin_dm_review`). Actions: ❄️ Freeze thread (both sides blocked from sending; `dm_threads.frozen`, unfreeze available), ✓ Dismiss. `resolve_report` v2 routes per target type (the old ELSE hit post_comments for everything non-post).
  - Dashboard: fifth KPI tile "DMs (24h)" from the new `dm_health` view (aggregate-only: threads, messages 24h, blocks, frozen, pending DM reports) — turns red when DM reports are pending.
  - **Ash v6 + privacy wall**: `agent_run_select` now refuses any query touching dm_messages/dm_threads/user_blocks — Ash physically cannot read private messages; `dm_health` is its one DM surface. Snapshot + morning digest now carry pending reports by type (DM reports flagged loudest) and DM aggregates.
- **Event detail pages**: every Plug Map card and map-popup opens a dedicated page — cover (or generated ember art), kind/status/members-only chips, artist link, full date + doors, venue + address + Directions, price, 🎟️ Get tickets, RSVP with count (shows), ↗ Share, 📅 Google Calendar link, mini-map pin, full description. Deep-linkable at `#event/<src>/<id>` and **public** (added to PUBLIC_VIEWS + the deep-link allowlists) so shared event links open without an account — city info is the funnel, the wall stays on member surfaces.

---

## Update — August 26, 2026 (fourth drop: the everywhere pass)

- **Messages in the app bar** (shared.js v12): envelope between search and the bell, unread badge mirrored live from the DM badge, taps straight into the inbox.
- **Heads-up notifications**: any new notification (Ash digest, DM, like, comment) now lands as a tappable banner at the top of the screen wherever you are in the app — fed by the existing 45s poll, first poll only baselines so old news never re-announces. Tap opens the exact target (digests → Studio → Ash for admins). No new Ash access involved.
- **Event pages got their meat**: ingest-events v6 maps Ticketmaster `info` + `pleaseNote` + support acts into `events.description`; the LLM page readers now extract a stated-only blurb too. Manual run backfilled all 80 TM events (59 published events now carry descriptions; the rest have none at the source). Event pages are also **swipe-right-to-exit**.
- **Feed trigger simplified**: the Lens/Photo/Song row is gone (those live in the post sheet now) — just the pill + one 📸 camera shortcut straight into the Lens.
- **Lens permission prompts split**: camera prompt on open, mic prompt only on first hold-to-record (photos never touch the mic). Denied mic = silent clip, not a dead Lens.
- **Plug Map "Near me"**: location requested ONLY on chip tap (never at boot), distance-sorts the list with mile labels, drops a you-are-here dot on the map, never stored or sent anywhere (Privacy Policy updated to say exactly that).
- **Premium artist video headers**: `artists.banner_video_url` — full/headline tiers (Jaye Mali, Murkemz today; DubsUpEnt is basic — flip their tier in Studio to unlock) get a silent looping video behind their name. Banner photo stays as poster + fallback; reduced-motion users get the photo; loop pauses off-page. Upload lives in the artist editor (40MB cap, 5–15s guidance, remove link); basic-tier editors see the locked upsell card — payment wiring later just changes who's in which tier.
- **Clips full immersion**: in Clips, EVERYTHING else disappears — app bar, logo, bottom tabs, mini player. Full-viewport player; portrait clips fill the screen (cover), landscape letterboxes (contain). Exit = swipe right or ‹. **Music auto-pauses** whenever a clip plays or a feed video is unmuted.
- **Screen usage + perf**: `viewport-fit=cover` (content extends under the notch/home bar like FB), Supabase preconnect, `content-visibility:auto` on feed posts (offscreen posts skip layout/paint).
- **Legal v1.2**: Direct Messages privacy section (participants-only, automated check at send only, human review ONLY on report + audit-logged, blocks/freeze), community rules extended to DMs, optional location spelled out (used on-device, never stored), camera/mic split-prompt language.

---

## Update — August 26, 2026 (fifth drop: edges, pins, silent heroes)

- **The edge-to-edge bug, actually found**: `.view{overflow-x:clip}` had been silently clipping every negative-margin full-bleed element (feed posts, media, profile heroes) at the view boundary — nothing ever truly touched the screen edge. Mobile views now span the viewport themselves (margin cancels the content gutter, view padding restores it), so full-bleed children reach real edges while sideways-scroll protection stays.
- **Follow button removed from feed cards** — tap the name/avatar, follow from their page (IG/FB pattern).
- **Hero videos route through the trimmer, always**: picking any file opens the trim sheet in hero mode (15s cap, "exports silent" in the title) — output is guaranteed ≤15s, audio-free by construction (no audio track attached at encode), and normalized to ≤1280p/4Mbps. Trimmed loop uploads on Save.
- **Plug Map redesign**: 📍 Near me now LEADS the filter row + a floating locate button lives on the map itself; **one pin per venue** (a venue with 6 shows was 6 stacked bubbles) with a count badge and a popup listing that venue's next events, each linking to its event page; pins colored by kind (music ember, nightlife purple, food green, art pink, community blue) with a legend; taller map (46vh); tighter chips.

---

## Update — August 27, 2026 (the parity drop)

**Plug Map v3**: Near me sits WITH List/Map at the top (plus the floating 📍 on the map); activating it zooms to a ~10-mile radius around you and the list follows the map viewport — zoom out, more appears. You-are-here dot is now white-with-ember-ring (was clashing with the Food key color). Kind color dots on list cards match the pins. Single title (topbar only). Cards + event pages show "🎟️ Tickets from $X" (parsed lowest price), Free events carry an organizer info ↗ link (city_events gained source_url), event pages add "Event page & contact ↗" for no-ticket events. Right-side blank space on all pages fixed (the widened mobile view was max-width-capped — stretched left, not right).

**Social parity batch (all live)**:
- **@mentions** — linkified everywhere, tapping opens the profile; the mentioned member gets a notification (server-side in create_feed_post + add_post_comment)
- **#hashtags** — tapping filters the feed to that tag with a clear-chip
- **Comment likes** — hearts with counts, notification to the comment author (throttled)
- **Saved posts** — ⋯ menu Save/Unsave; viewer in Settings → Saved posts
- **Interested vs Going** — both buttons on every event page (shows AND city events, new event_rsvps table + set_rsvp RPC); cards count "going" only; **friends-going** line ("⭐ X, Y + 2 more going — people you follow")
- **Sleep timer** (Off/15/30/60, pauses playback) + **Add to queue** beside Play next
- **Lyrics** — artists paste them in the track editor; 📜 button in the player
- **Shareable playlists** — Share makes it public + hands out `#playlist/<id>`; recipients get a playable sheet; delete-playlist added
- **DM v2** — 📨 message-requests folder (stranger threads quarantined until Accept/Delete/Block; dm_decline only works before you've replied), **long-press reactions** (six emoji, one per person, realtime repaint), **realtime delivery** (Supabase channel per thread, 15s poll fallback)
- **Clips** — 💬 opens comments in an overlay sheet (never leaves the scroll), **♫ sound attribution** line on clips with a track → "this sound" filtered view

**Safety (the two ⚠️ items)**:
- **moderate-media edge fn**: every image (and every video's poster frame) passes a Claude-vision safety classifier before upload — sexual content, minor-safety (block on any doubt), gore, hate symbols. Verdicts audit-logged to user_events. Fails OPEN during invite-only beta but every skip is logged; flip to fail-closed at open signup.
- **delete-account edge fn + Settings row**: permanent self-serve deletion (type DELETE), erases identity + content + DMs, keeps anonymized stream aggregates for payout integrity, refuses staff/artist/page-owner accounts with clear next steps. Legal updated.

**2FA — deliberately paused** per Jaye: Google OAuth bypassed the invite-code gate. Options researched, waiting on his call (see chat).

**Still queued from the green-lit list**: venue pages + follow-venue, on-sale/price-drop alerts, realtime notifications (DMs have it; bell still polls), PHX Wrapped (December feature), native ticketing (needs Stripe live), voice notes/photos in DMs, clip captions editor.
