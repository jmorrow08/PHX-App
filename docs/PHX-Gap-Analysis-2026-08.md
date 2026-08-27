# PHX — Gap Analysis vs. the Top Dogs (August 2026)

> RESEARCH ONLY — nothing here is built or scheduled. This is the "what Jaye's
> detail-eye would catch next" list, benchmarked against Meta (FB/IG), TikTok,
> Spotify, Apple Music, Ticketmaster, Eventbrite, Dice, Partiful, and Discord.
> Ordered inside each section by (impact ÷ effort), best first. Items marked
> ⚠️ are compliance/safety gaps that matter before scale, not just polish.

---

## 1. Feed & social (vs. Instagram / Facebook)

| Gap | Why it matters | Effort |
|---|---|---|
| **@mentions + hashtags** in posts/comments (tappable, notify the mentioned) | The connective tissue of every social feed; PHX text is inert | M |
| **Comment replies (threading) + comment reactions** | Comments are flat one-level today; conversations die | M |
| **Saved posts / bookmarks** | IG's most-used quiet feature; zero-risk retention | S |
| **Post editing** (with "edited" label) + delete for own posts | Typo → delete → repost is the current path | S |
| **Pinned post** on profiles | Artists want a billboard slot | S |
| **Polls** in the composer | Cheap engagement machine; city questions already exist (Bub prompts) | M |
| **Stories / 24-hour posts** | THE retention loop at Meta; huge but transformative — a "Tonight" story rail feeding off Plug Map events could be PHX-flavored | L |
| **Link previews (unfurl)** in posts | Pasted links are plain text now | M |
| **Share a post INTO a DM** | We built DMs; the #1 DM content on IG is posts. Deep integration = retention | S–M |
| **Infinite scroll pagination** | Feed/clips load a fixed cap (30–50); heavy users hit the floor. Cursor pagination everywhere | M |
| **Per-type notification controls** (mute likes, keep DMs, etc.) | Roadmap already lists notif toggles; DMs make it urgent | M |
| **Alt text on images** | Accessibility + FB does it automatically | S |

## 2. Music (vs. Spotify / Apple Music)

| Gap | Why it matters | Effort |
|---|---|---|
| **"PHX Wrapped" / 602 Recap (yearly)** | Spotify's single biggest marketing day of the year, free. We have all the data. City-flavored + shareable cards | M |
| **Queue management UI** — add-to-queue on any track row, drag-to-reorder Up Next | Table stakes in both big apps | M |
| **Lyrics** (even unsynced; synced later) | Apple's karaoke lyrics are a top-3 feature; start with artist-submitted text | M |
| **Sleep timer** | 10 lines of code, beloved feature | S |
| **Crossfade duration setting** | AutoMix exists; Spotify exposes 0–12s slider | S |
| **Listening history page** (full, searchable) | Recently Played shows 10; Spotify shows everything | S |
| **Shareable playlists** (public link, collaborative later) | Playlists exist but private-only; sharing playlists = free acquisition | M |
| **Track credits page** | Writers/producers/features — we already have feature-credit claims; surface them per track | S |
| **Drop countdown pages + pre-save-style "remind me"** | Drops exist; a countdown page with a notify button turns a drop into an event | M |
| **Artist radio / smart shuffle** ("more like this artist") | Needs the LightFM rec work already tucked | L |
| **Spotify-Canvas-style track loops** | We just built artist hero videos — same asset per track behind the player is a natural extension | M |
| **EQ / volume normalization** | Nice-to-have; WebAudio conflicts with iOS background audio — needs the native wrapper first | L |

## 3. Events / Plug Map (vs. Ticketmaster / Eventbrite / Dice / Partiful)

| Gap | Why it matters | Effort |
|---|---|---|
| **"Interested" vs "Going"** (two-tier RSVP, FB events) | Low-commitment tap doubles engagement data; "interested" feeds reminders | S–M |
| **Who's going / friends going on event pages** | Social proof is THE convert-to-attend lever; we have RSVP + follows data | M |
| **Venue pages** (profile per venue: calendar, map, follow) | Dice/RA do this well; venues are already first-class rows with geodata. Follow-a-venue → new-event notifications is spec'd in the ingestion doc, unbuilt | M |
| **Event reminders for RSVPs/interested** (day-before + day-of push) | Show reminders exist for artist shows; extend to all events | S |
| **Apple Calendar (.ics) alongside Google** | iPhone city = Apple Calendar city | S |
| **On-sale / price-drop alerts** | Ticketmaster's watch feature; we already re-sync TM nightly — diff the price | M |
| **Native ticketing with QR check-in + finders fee** | The revenue play Jaye already named; Stripe + a door-scanner page. Big but it's the moat | XL |
| **Promoter tools** (guest lists, promo codes, event analytics) | Comes with native ticketing; Partiful/Posh made this feel light | L |
| **Personalized weekly "your weekend" push** (from follows + favorites + location) | The Thursday auto-post exists; a personalized push version is the habit-builder | M |
| **Map heatmap / "tonight at 10pm" time slider** | Differentiator nobody local has; data already there | M–L |
| **Check-in at the venue** (geofenced → points + attendance badge) | PHX-unique: proof-of-scene culture, feeds Wrapped ("14 shows this year") | M |

## 4. Clips / video (vs. TikTok / Reels)

| Gap | Why it matters | Effort |
|---|---|---|
| **Comments inside the clips player** (overlay sheet, don't leave) | Currently jumps out to the post; kills the scroll session | M |
| **Captions / text overlay in the clip editor** (incl. on landscape letterbox bars — Jaye's idea) | Watch-muted is the norm; text = watchable | L |
| **Sound attribution page** ("this sound" → all clips using a track) | We already mix tracks into clips; the reverse index is the viral loop | M |
| **Clip drafts + scheduled posting** | Creators batch content | M |
| **Creator analytics surfaced to artists** (views/completion per clip — data already logged) | We track clip_view/30s/complete; nobody can see it yet | S–M |
| **Speed controls + double-tap-to-like in player** | Small polish parity | S |

## 5. DMs (vs. IG Direct / Messenger)

| Gap | Why it matters | Effort |
|---|---|---|
| **Message requests folder** ⚠️ | Strangers land in the same inbox as friends today. IG's request inbox is a safety feature, not a luxury | M |
| **Share track / event / post into a DM** | The integration that makes DMs the app's glue | M |
| **Emoji reactions on messages** | Expected everywhere now | S–M |
| **Photos in DMs** | Text-only today | M |
| **Realtime delivery** (Supabase Realtime channel vs 5s poll) + typing indicator | Feels instant; also cheaper than polling at scale | M |
| **Read receipts (with a privacy toggle)** | Note: ship WITH the off-switch — that's the lesson from others' mistakes | S–M |
| **Voice notes** | Music app + voice notes = natural | M |
| **Group chats** | Big; wait for user demand | L |

## 6. Profiles & identity

- **QR code / share card for profiles** (IG nametag) — cheap, great at shows. (S)
- **Verification request flow** (flag exists; no way to ask). (S)
- **Private member insights** ("your posts got X likes this month"). (M)
- **Profile completeness nudges** (add a photo → 3× follows, etc.). (S)

## 7. Platform, performance & infrastructure ⚠️ = pre-scale must

| Gap | Why it matters | Effort |
|---|---|---|
| **⚠️ Image/video moderation** | The text filter doesn't see media. NCMEC/zero-tolerance promises in the ToS need actual scanning (e.g., AWS Rekognition / Hive / Microsoft PhotoDNA-class) before open signup | M–L |
| **⚠️ In-app account deletion + data export self-serve** | ToS points at an email; App Store REQUIRES in-app deletion the day we wrap with Capacitor | M |
| **⚠️ 2FA on founder/admin accounts** (Supabase MFA) | One phished password = the whole platform today | S |
| **⚠️ Email auth: SPF/DKIM/DMARC on thephx.app** | Deliverability + spoofing protection; verify Resend domain records | S |
| **⚠️ Bot protection on signup/request-access** (Turnstile/hCaptcha) | Invite-only shields us now; won't after launch | S–M |
| **Image CDN transforms** (Supabase render API: serve 600px thumbs, not 4MB originals) | Probably the single biggest feed speed win available | M |
| **Server-side video transcoding** (Mux / Cloudflare Stream → HLS + instant posters) | Properly kills the black-frame flash, big files, and battery burn from in-browser re-encoding. Costs money — the right move once billing is live | L |
| **Service worker** (offline shell + cached assets → near-instant boot) | The PWA has no SW; this is the "app feels native" unlock | M |
| **Split the 830KB single file** (or at least defer non-critical JS) | Parse time on cheap Androids is real | L |
| **Realtime channels** for notifications + DMs (replace polling) | Snappier + cheaper at scale | M |
| **Client error tracking** (Sentry) + uptime monitor on thephx.app | reportFailure logs locally; nobody is watching | S |
| **Studio analytics dashboards** (DAU/WAU, retention curves, funnels from user_events) | The data is all collected; decisions are still vibes | M |
| **Feature flags / kill switches** (platform_settings-driven) | Ship risky features dark, flip on per-account | S–M |
| **Backup/restore drill** (documented point-in-time recovery test) | One bad migration away from needing it | S |

## 8. Legal / compliance (beyond what's shipped) ⚠️

- **DMCA agent registration** — still the $6 copyright.gov filing (tucked, not done).
- **Age gate enforcement** — ToS says 13+; signup should actually ask DOB (COPPA).
- **State privacy laws** (CPRA-style rights) — deletion/export self-serve covers most of it.
- **Accessibility pass** (WCAG-ish): focus states, contrast on muted text, aria labels on icon buttons, reduced-motion coverage (started with hero videos), captions on clips (see §4).
- **SMS/TCPA** — already tucked, blocked on EIN.

## 9. Where PHX can OUTSHINE them (nobody's lane)

1. **The transparency receipt** — no major platform shows fans "your money → these artists." Lean in: public artist-support leaderboards, shareable receipt cards, "founding backer #" culture. This is the brand.
2. **City Pulse** — a live map layer of what the city is playing/attending *right now* (aggregated, anonymous). Spotify can't do local; Ticketmaster can't do social.
3. **Scene check-ins** — geofenced show check-ins → badges, points, Wrapped stats ("you were at 14 shows"). Proof-of-scene becomes status.
4. **602 Recap (Wrapped, but for a city)** — personal AND citywide ("Phoenix streamed 1.2M minutes of local music this year").
5. **The underground layer** — flyer submissions + curator partnerships already outpace what TM/Eventbrite index. Double down: curator profiles with credit ("via PhxSoul"), fastest last-minute adds in the city.
6. **Artist video headers + track canvases** — at local-artist scale we can make EVERY artist look Apple-Music-premium, which the big apps reserve for majors.
7. **One-app city loop** — stream the artist → see their show on the map → RSVP → check in → clip it → the artist gets paid. No competitor owns the full loop; each of them owns one arc.

---

*Written 2026-08-26 as research for Jaye. Priorities are suggestions; nothing is scheduled. Companion docs: roadmap-post-launch.md, lytbub-os-vision.md, PHX-Event-Ingestion-Agent.md.*
