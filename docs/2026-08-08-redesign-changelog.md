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
