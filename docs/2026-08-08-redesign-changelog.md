# PHX Redesign — 2026-08-08 changelog + SOPs

## What shipped
1. **Typed onboarding codes.** Admin → Roster → "+ Generate code" opens a modal: pick **Member** or **Artist**, an optional starting tier, label, and uses. The code's type sets the account's lane at redemption (never the user's choice). Artist codes auto-create a pending artist page so the artist can claim a handle and submit immediately. Personal referral codes on My Pass are always member codes.
2. **Single identity.** New users are one identity — member or artist. "Add a Page" and the `create_page` RPC are gated by `profiles.allow_multi_page` (Jaye + Bryce only; Bryce's flag arrives automatically with his multi-page claim bundle). Reversible flag, nothing deleted.
3. **Tiers.** `public.tiers` table: member `free/native/insider`, artist `basic/full/headline`, business `basic/full`, each with a capabilities JSON. Murkemz = Headline Artist; Bryce = Insider (top member). Free rungs include posting + clips; Basic Artist has a monthly post cap (enforcement wiring lands with billing).
4. **Business categories.** `Food & Drink / Style & Care / Fitness & Wellness / Retail & Brands / Nightlife & Events / Other` — every category pre-mapped to a future vertical; legacy types migrated.
5. **Clips.** "Reels" renamed everywhere. One immersive player, reached from the bottom tab or by tapping any video card (feed + reposts). Instrumentation: `clip_view` (deduped/session), `clip_watch` seconds, `clip_watch_30s`, `clip_complete`. Honest "You're all caught up" end marker. Reposts render the full original inline.
6. **Profiles.** Artist pages: Posts tab (with Clips strip) — **Music stays the default landing tab**. Posts shown = posts made *as that artist* (their artist Page or artist voice). Member pages: Clips strip above Posts.
7. **Pre-billing open listening.** Until `platform_settings.billing_live = true`, every signed-in **active** member streams the full catalog (client + `sign-audio` edge function both enforce). This is the stream-monitoring window before payments go live. Flip the flag → tier gates re-arm everywhere, no deploy needed.
8. **Verification.** Admin → Artists table has a per-artist **Verify** toggle (`admin_set_artist_verified`, admin-only, notifies the artist).
9. **/studio.** The admin door: same login, `thephx.app/studio` opens straight into the ops dashboard for admin accounts (members land on home). The full separate admin surface + analytics build is the next track.
10. **Prices.** Canon: founding **$9.99 / $19.99**, post-founding **$15 / $29**. App copy swept to founding-first.

## SOPs
### Handing out codes (tonight)
1. Admin → Roster → **+ Generate code** → pick Member or Artist → label it with the person's name → Generate → **Copy link** (the `?ref=` link prefills their signup).
2. Special codes already minted: **`R4MSRV`** = Bryce (3 pages + Insider + multi-page), **`XMWR7X`** = Murkemz (artist page + Headline), **`QVRPRA`** = Murkemz's fan referral code, **`JAYEMALI`** = Jaye's fan referral code.
3. Artist codes → the person lands in the artist lane with a pending artist page. Their page appears in Admin → Artists; **Verify** them after the check below.

### Verifying an artist (the ✓)
Verified means PHX confirmed: **(1)** a real person you can reach (IG/DM cross-check), **(2)** a Phoenix connection, **(3)** they own/control the catalog they upload, **(4)** at least one live track. Then Admin → Artists → **Verify**. The artist gets a notification; the ✓ shows on their public page.

### Monitoring streams before billing
Admin → Activity = every play (who, what, seconds listened, counted/capped) + all app events. Admin → Financials → Formula Lab compares per-stream vs time-weighted splits on live data. When streams look right and Stripe is wired, flip `billing_live` and gates re-arm.

## Deferred to the next pass (deliberate, not forgotten)
Comment replies (one level), PHX reactions set (🔥 Heat, 🐦‍🔥 Risen, 🌵 City Love, 🥶 Chills, 🔁 On Repeat), PHX Points ledger, watermark Clip & Share export (share = link today), Favorites shelf, 20-second logged-out previews on artist pages, full tier-aware My Pass, wiring `tiers.capabilities` into UI gating, the full admin-surface split. Rationale: none block the code handout, and social-schema changes hours before first users is how launches break.

## Late addition — payout engine v2 (same day)
- **Time-weighted payouts live:** each counted play = `min(seconds listened, 240)/240` of a full play (30s floor). Deep listening pays more; skims pay a fraction; 4-min cap kills length-farming.
- **Tier-aware rate cap:** per-full-play ceiling = wallet ÷ 1000 → Native 0.75¢, Insider **1.45¢** — the bigger pass genuinely pays artists more.
- **Bugfix:** the engine now honors `counted` (previously uncounted/farmed streams could earn).
- **Landing split sweep:** every public "50%" removed per the README internal-only policy; design prompt patched so it can't regenerate.
- **Open:** platform-share % (50 today) — founder decision; `update payout_settings set platform_share_pct = …` when called.

## Social + growth pass (same day, later)
- **PHX Reactions live:** tap = 🔥 Heat; press-and-hold opens the five-reaction bar (🔥 Heat, 🐦‍🔥 Risen, 🌵 City Love, 🥶 Chills, 🔁 On Repeat). One reaction per member per post; switching keeps the like; the owner's notification carries the chosen emoji. Works in the feed and on Clips.
- **Favorites shelf live:** ☆ Favorite on artist pages (separate from Follow), tier-capped (Free 3 / Native 6 / Insider 12), public "★ Favorite artists" shelf on member profiles. This is the pre-wired priority list for Drops.
- **Comment replies live:** one level (IG model), Reply links, reply notifications.
- **Referrals pay PHX Points, never free months** (+50 referrer / +25 referee on qualification; perk milestones unchanged). Free-months machinery removed from `process_referral_rewards`.
- **Welcome wizard is now 4 steps:** handle → photo → follow artists & people → **Points primer + 30-second tour** (shows the member's real, already-earned balance; explains earn paths; tours City Feed / Music / Clips / Favorites / My Pass; every step skippable).
- **First-party analytics:** landing beacon (views/CTA/UTM/referrer → `user_events`), `profiles.signup_attrib` first-touch attribution, screen_view events, Admin → Growth (funnel, sources, D1/W1 retention). Meta Pixel deliberately NOT installed until IG ad spend begins (landing page only, when it does).

### SOP — reading Growth (add to weekly ops)
Admin → Growth once a week: funnel conversion step-to-step (where people drop), sources (which artist codes/UTMs actually convert), retention vs the ≥40% week-4 gate. Admin → Financials → pot ledger for every beta dollar. Admin → Activity for per-user behavior and capped/farmed plays.

## Evening launch-prep pass (same day, night before codes go out)
- **Claim codes proven end-to-end.** Rollback-tested both partner codes through the real redemption path. Found + fixed: XMWR7X granted no tier (now `headline`), and `redeem_claim_code` wrote artist tiers into `profiles.tier` where the CHECK rejects them — tier grants now route artist tiers to `artists.tier`, member tiers to `profiles.tier` (`claim_code_tier_routing`).
- **Artist approval is a button now.** Admin → Artists: pending artists show **Approve — go live** (`admin_set_artist_status`): flips status, mints their permanent unlimited fan code, notifies them. Previously pending→active had no UI path.
- **Artist handle sync.** Artist rows are created at code redemption (before the wizard), so they carried placeholder name/slug. `mark_onboarded` now renames pending placeholder rows from the finished profile (live pages never renamed).
- **Email pipeline live.** `email_queue` → Resend via pg_net + Vault (`RESEND_API_KEY`), pg_cron `phx-email-drainer` every 5 min, ≤3 retries, branded HTML (`_email_html`). New-access-request alert to all admins; approve/deny/waitlist emails deliver; **codegen has an "email it to them" field** (`admin_email_code`). `queue_email` EXECUTE revoked from clients (was a spam vector).
- **Feed UX pass (Facebook mechanics).** Inline muted autoplay videos (IntersectionObserver + scroll fallback; sound never follows you down the feed; tap video → Clips), labeled reaction picker (bigger, names under emoji, iOS copy-callout suppressed), 44px action-row tap targets, `html`-level overflow clip (stops sideways panning on iPhone).
- **Clips cap: 90 seconds** (IG Reels standard) — enforced at file-pick and re-checked at post time. File cap stays 50 MB.
- **Studio installs as its own app.** `/studio` swaps manifest + apple-touch-icon + canonical + og:url in-head → saves to home screen as "Studio" with the platinum phoenix, launching `/studio`. Member app at `/app` unaffected.
- **Plug City album restored** (featured, art = the PHX single's cover). Reversible `albums.hidden` flag + `tracks.status='hidden'` state exist for future takedowns; the audio signer refuses non-live tracks.
- **Studio shell rebuilt.** Nav renders from a sections × role-capability map (Operate / Understand / Money / Configure); Roster is now **Launch Desk**. Future scoped logins (Bryce as partner manager, employees) = one row in `ROLE_CAPS` — server-side RPC guards remain the real gate. Full deep-analytics build still queued.
- **Trim sheet.** Videos over 90s open a dual-handle selector (selection loops in preview); the chosen span re-encodes in the browser (canvas.captureStream + WebAudio + MediaRecorder — the same machinery the watermark export will reuse) and attaches as the clip. Real-time encode: a 90s trim takes 90s.
- **RLS fix: invite_codes had RLS on with zero policies** — every direct read returned empty, which is why admin codegen's list said "no codes yet" while codes worked fine. Now: admins read all, owners read their own, everyone else nothing. Same admin-read gap fixed on `referrals` (who-invited-whom was owner-scoped).
