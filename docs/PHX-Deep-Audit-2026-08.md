# PHX — The Deep Audit (August 27, 2026)

> The full OCD pass Jaye asked for. Surface by surface, screen by screen —
> bugs I know exist, states that are missing, inconsistencies a perfectionist
> would catch, risks before scale, and tweaks that separate "works" from
> "finished." Severity: 🔴 fix before open signup · 🟠 fix soon · 🟡 polish.
> Honest throughout: several items are rough edges in things *I* built this
> week. Research only — nothing here is applied.

---

## 1. Boot, auth & onboarding

- 🔴 **Google sign-in bypasses the invite gate** (Jaye's own find; currently disabled behind the DB flip). Before re-enabling: OAuth callback must land new users in `access_pending` state and route them into the code/claim flow, not the app. The fix belongs in `applyAccountRole`'s new-user branch.
- 🔴 **No bot protection on Create Account / Request Access** — invite-only shields us today; the day codes circulate publicly, scripted signups begin. Cloudflare Turnstile is free and invisible.
- 🟠 **Password reset flow**: "Forgot password?" sends the Supabase email — but the redirect-back experience into the app (set new password screen) has never been QA'd end-to-end on mobile PWA. Test it; PWA redirect handling is a classic breakage point.
- 🟠 **No email-change flow** in settings. Users are stuck with their signup email.
- 🟡 Boot veil covers the load, but on slow connections there's no progress indication — a 4-second black screen reads as broken. A subtle pulse on the mark would buy patience.
- 🟡 The wizard asks members for genre tastes but artists never get asked (that's why DubsUpEnt's genre was null). The artist claim flow should collect genre + city + links in one pass.

## 2. City Feed

- 🟠 **No pagination** — hard 30-post cap. An active week scrolls to a cliff with no "load more." Cursor pagination (`created_at < last`) is the standard fix; same for Clips (30) and comments (80).
- 🟠 **No post editing** — typo means delete-and-repost (and deleting your own post: verify the ⋯ menu actually offers it for authors, not just admins).
- 🟠 **Feed images ship at original size** — a 4MB photo downloads 4MB into a 400px slot. Supabase's image transform API (`/render/image/...?width=800`) is a one-line change per `<img>` and probably the single biggest scroll-speed win available.
- 🟡 Reposts of reposts: the embed renderer shows one level; a repost *of a repost* shows "🔁" with a bare snippet. Decide the rule (flatten to the original, like Twitter did) and enforce it.
- 🟡 Link previews: pasted URLs are dead text. Unfurling (title+image card) needs a tiny edge function (fetch + og-tags) — cheap, feed feels alive.
- 🟡 The hashtag lens queries `ilike '%#tag%'` — matches #phoenix inside #phoenixrising. Word-boundary matching or a proper `post_tags` table when volume grows.
- 🟡 `content-visibility` is on posts, but the mobile feed still re-renders wholesale on every `loadCityFeed(true)` (post → full repaint → scroll jump risk). Diff-render or at least preserve scroll position.
- 🟡 Alt text: no way to add image descriptions (accessibility + FB parity).

## 3. Composer & media pipeline

- 🟠 **In-browser video re-encode is wall-clock** — a 90s clip takes 90s to bake, screen must stay on. It's honest (we show progress) but the real fix is server-side transcoding (Mux/Cloudflare Stream) once billing is live. That also solves the black-first-frame flash and gives HLS streaming.
- 🟠 The caption editor (new): text overlays don't preview *with* the video's letterbox bars — landscape clips bake text over the video area only. Jaye's "text on the black bars" idea needs a 9:16 compose canvas (bars become real pixels). Queued design decision.
- 🟡 Drafts save text+song but not media (browser limitation, disclosed) — IndexedDB could actually persist the file blob. Medium effort, real payoff.
- 🟡 The trim sheet re-encodes in real time — same wall-clock note as above; fine for 15s hero loops, painful at 90s.
- 🟡 No "scheduled post" or clip drafts queue (creators batch content).
- 🟡 Multi-photo posts (carousels) don't exist — IG's most-used format.

## 4. Clips

- 🟠 Sound-attribution filter reloads the whole reel list — entering/exiting "this sound" loses your scroll position.
- 🟡 No double-tap-to-like (muscle memory from every other app).
- 🟡 No speed control, no captions display (watch-muted accessibility).
- 🟡 Watch analytics (views/30s/completion) are logged but **artists can't see them** — a "Clips" tab in artist analytics is nearly free (data exists).
- 🟡 The "end of the road" card is honest but a "follow more artists" CTA there would convert dead-ends into graph growth.

## 5. Music & player

- 🔴 **One track with real audio** (catalog-wide). Everything music-side is throttled by this — 602 Rotation hides until 3+, AutoMix rarely fires, playlists feel empty. The single highest-leverage content task on the platform.
- 🟠 Lyrics are plain text — synced lyrics (LRC format) is the Apple-karaoke standard; the column could store LRC and the panel could highlight lines. V2.
- 🟠 Recently Played caps at 10 in localStorage; a real listening-history page (from stream_events) is a query away.
- 🟡 Crossfade duration is fixed at 6s — Spotify exposes a 0–12s slider; ours is one localStorage value away.
- 🟡 Queue: drag-to-reorder Up Next doesn't exist (add/remove does).
- 🟡 Shareable playlists open behind the auth wall for guests — decide: are playlist links a growth surface (make public like event links) or member content? Currently inconsistent with event pages.
- 🟡 `artist_city_now` shows on artist pages but not in the expanded player (the player knows the track's artist — same chip would fit under the title).

## 6. Plug Map & events

- 🟠 **The weekend/"tonight" cold-start problem**: filters can return near-empty for niche categories. When a filter returns <3 results, suggest the nearest non-empty filter ("Nothing for Family tonight — 6 things this weekend →").
- 🟠 Rebel Lounge (and any JS-rendered calendar) is invisible to page readers — needs per-venue RSS/ICS discovery (many venues publish ICS feeds; an ICS parser source type would be more reliable than HTML+LLM for those).
- 🟠 Event submissions by members: the flyer-submission flow exists in the composer sheet path? Verify the member-facing "put it on the map" form still matches the new event fields (description, image) — it predates them.
- 🟡 Map fullscreen mode doesn't rotate to landscape or remember state.
- 🟡 Venue pages have no photos (venues table has no image column — could pull the most recent event flyer as a header).
- 🟡 Time-slider ("tonight at 10pm") from the outshine list — still the most defensible map feature nobody local has.
- 🟡 ICS *feed* subscription for the whole Plug Map (subscribe once in Apple/Google Calendar, auto-updates) — promoters and superfans would live off this.

## 7. DMs

- 🟠 Realtime channel per thread but the **inbox list** doesn't live-update (new thread while staring at inbox = wait for reopen). Subscribe to dm_threads updates or refresh inbox on notification.
- 🟠 Voice notes on iOS Safari: MediaRecorder audio support is version-sensitive (14.5+, mp4). Needs a real-device test pass; the fallback (unsupported → hide mic button) isn't wired.
- 🟡 No image compression before DM upload (15MB cap, but a 12MB photo uploads raw — downscale to 1600px first like the feed does via bake).
- 🟡 Read receipts (with privacy toggle) and typing indicators — deliberately not built; decide if wanted.
- 🟡 Message deletion (delete-for-me / unsend window) doesn't exist.
- 🟡 Frozen-thread notice appears only when you try to send — a passive banner in the thread would be kinder.

## 8. Profiles & identity

- 🟠 Identity switcher long-press has no discoverability — nothing tells you it exists. One-time tooltip on the My tab ("hold to switch profiles") for accounts with 2+ voices.
- 🟡 QR profile share (IG nametag) — cheap, perfect at shows.
- 🟡 Verification request flow (flag exists, no ask path).
- 🟡 Member profile banner upload exists? Verify members can actually set banner_url (artists can; member edit flow may not expose it).
- 🟡 Hero videos: only artist pages; pages (venues/brands) tier could want it later — the column pattern generalizes.

## 9. Studio / ops

- 🟠 **Analytics view is thin** while user_events is rich: DAU/WAU curve, retention cohorts, funnel (signup→first play→first post), top content — all queryable today. The venue-impact table is the pattern; repeat it for the platform.
- 🟠 Feature flags: platform_settings exists but there's no generic kill-switch pattern for shipping dark (e.g., AutoMix rollout). Cheap insurance.
- 🟡 Venue impact: add a per-event drilldown + a date-range picker (7/30/90) + CSV export for sending to venues.
- 🟡 Ash could draft the venue pitch email from the impact table ("write the pitch for Valley Bar") — the data's a read_data call away.
- 🟡 Reports queue has no pagination and no resolved-history view.

## 10. Notifications & comms

- 🟠 **Per-type notification preferences** (mute likes, keep DMs) — promised in roadmap, now urgent because volume grew (mentions, venue pings, price alerts). One `notification_prefs` jsonb on profiles + checks in the insert paths.
- 🟠 Web push on iOS PWA requires the A2HS install + iOS 16.4+; reliability is fair, not great. The Capacitor wrapper (tucked) is the real fix for push.
- 🟡 Emails: SPF/DKIM/DMARC on thephx.app — verify the Resend domain records are all green (deliverability + spoof-protection). Five-minute check, big consequences.
- 🟡 Notification grouping ("3 people liked your post") — inserts are per-actor now; volume will make this needed.

## 11. Performance

- 🟠 **app.html is ~900KB** and growing ~25KB/feature. Parse cost on cheap Androids is real. Split: vendor (supabase/leaflet already CDN), studio-only code behind dynamic import, or accept and monitor. Decision point approaching.
- 🟠 **No service worker** — every cold open re-downloads everything. An SW with stale-while-revalidate on the shell = near-instant boots + groundwork for offline. The single biggest "feels native" unlock left.
- 🟠 Image CDN transforms (again — it belongs on both lists). Feed, avatars, event flyers, venue rows: all serve originals.
- 🟡 Feed videos `preload="metadata"` still fetch moov atoms for every post on load — consider `preload="none"` + poster-only until near-viewport.
- 🟡 Sentry (client error tracking) — reportFailure logs locally; nobody sees production errors. Free tier exists.
- 🟡 Uptime monitor on thephx.app + the edge functions (UptimeRobot free).

## 12. Security & integrity

- 🔴 **2FA on founder/admin** — paused per Jaye pending the OAuth-gate fix; the two are separate (TOTP MFA runs *after* any login, Google included). Revisit deliberately.
- 🟠 Rate limiting on edge functions: sign-audio, moderate-media, ash are per-JWT but unthrottled — a hostile member could hammer them. Cheap counters in the functions.
- 🟠 The vision moderation **fails open** (logged) — correct for invite-only beta, must flip to fail-closed at open signup. Calendar it with the signup flip.
- 🟠 Avatar/banner/hero-video uploads skip moderation (only feed + DM media are scanned). Extend the same check.
- 🟡 CSP is report-only (tucked item) — YouTube frame-src sorted, then enforce.
- 🟡 Backup drill: point-in-time recovery has never been *tested*. One dry run.
- 🟡 `agent_run_write` (Ash's approved-SQL executor) runs arbitrary SQL post-approval — correct by covenant, but approvals should show a diff-style preview of affected row counts before Jaye taps approve (SELECT count first).

## 13. Legal / compliance

- 🟠 DMCA agent registration — the $6 copyright.gov filing, still pending, ToS references it.
- 🟠 Age gate: ToS says 13+, signup never asks DOB (COPPA exposure at open signup).
- 🟡 Data export self-serve (deletion is in-app now; export is still email-only).
- 🟡 Accessibility pass: icon buttons missing aria-labels in places, contrast on `--faint` text borders on failing WCAG AA, focus states invisible on custom buttons. One dedicated sweep.

## 14. The attribution/leverage system — where it goes next

Built today: UTM-tagged outbound links, CTA click tracking, Venue Impact table.
The escalation path:
1. **Per-event impact cards** — "this show: 89 views, 23 ticket clicks, 14 going" — screenshot-sized, brandable, send-to-promoter ready.
2. **Monthly venue email** — auto-send each venue their PHX numbers ("claim your page to see this live") — the pitch that sends itself. Needs venue contact emails (collect during claim outreach).
3. **Check-ins (geofenced)** — the endgame receipt: not clicks, *bodies through the door*. "41 PHX members checked in at your show." Pairs with points/badges/Recap.
4. **Affiliate conversion** — Ticketmaster/SeatGeek affiliate programs pay per sale AND report conversions — actual dollars attributed, not just clicks (see API section in chat).
5. **Promoter dashboard** — when native ticketing lands, impact reporting becomes the free tier and ticketing the paid tier of the same product.

---

*Companion docs: PHX-Gap-Analysis-2026-08.md (competitive parity), roadmap-post-launch.md. This document is the micro-level pass; the gap analysis is the market-level pass.*
