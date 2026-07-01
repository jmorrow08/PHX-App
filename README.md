# PHX App — Platform Documentation

PHX is a fan-powered music streaming platform built for Phoenix city culture. Artists earn directly from their fans' subscriptions — no pool, no middlemen, no label cuts.

**Stack:** Vanilla JS · Supabase (Postgres + Storage + RLS) · Vercel · Chart.js  
**Live:** phx-app.vercel.app  
**DB:** Supabase project `dnzvtathfpjelffjnqrc` (us-west-1, AktivOrbit org)

---

## Pages

| File | URL | Purpose |
|---|---|---|
| `index.html` | `/` | Landing page — marketing, pass pricing, artist roster |
| `app.html` | `/app` | Main member + artist + admin app (all roles) |
| `admin.html` | `/admin` | Redirect/placeholder |
| `partner.html` | `/partner` | Partner business info page |

---

## Roles & Access

The app has 6 roles, switchable via the demo bar at the bottom (dev only — will be replaced by real auth).

### Explorer (Free)
- Browse PHX Music catalog
- 5 free plays per session on non-exclusive tracks
- No fan-powered payouts generated
- Can see City Feed and Discover
- Upgrade prompts on exclusive content

### Native — $15/mo
- Full access to all non-exclusive tracks
- Streams generate fan-powered payouts
- City Feed, Discover, all member features
- $12 of their $15 goes to artists they actually listen to

### Insider — $29/mo
- Everything in Native
- Access to exclusive and time-locked tracks
- Higher payout allocation ($23.20 to artists)
- First access to Eats, Cuts, Drops perks when live

### Artist
- Submit tracks for review (upload to Supabase Storage)
- View My Tracks catalog with live stream counts
- Analytics: stream history chart (Chart.js)
- Earnings: fan-powered payout breakdown
- Profile management
- Artists are free to list — platform earns from subscriber side

### Admin
- Platform Dashboard: KPI cards (members, MRR, streams, artists)
- Live Stream Activity feed (real-time from Supabase `stream_events`)
- Members table
- Artists roster + pending submission approvals
- Content: approve/reject track submissions with optional rejection notes
- Financials (hidden behind Super Admin gate)

### Super Admin
- Everything in Admin
- Financial dashboard: MRR breakdown, payout queue, revenue history
- System settings: per-stream rate, subscription prices, fraud thresholds, payout day
- Full system access warnings

---

## How Streaming Works

**30-Second Threshold**  
A stream only counts after the user has listened for 30 continuous seconds. The timer is JS-side (`startStreamTimer`) and resets on track change or pause.

**Deduplication**  
The `record_stream()` Postgres function uses a unique index on `(track_id, session_id)` — one count per session per track. Session ID is generated fresh each page load.

**Device UUID + Fingerprint**  
Each browser gets a persistent UUID stored in localStorage (`phx_guest_id`). This UUID is sent as `p_user_id` to rate-limit streams per device. A canvas-based device fingerprint (`DEVICE_FP`) is computed alongside it and attached to every behavioral event — harder to spoof than a UUID alone since clearing localStorage doesn't change it.

**Behavioral Analytics**  
Every `session_start`, `play_start`, and `play_30s` event writes to the `user_events` table via `trackEvent()`, with metadata (screen size, timezone, language, role, device fingerprint). This is the raw data future recommendation and fraud-detection systems will read from — nothing consumes it yet, but it's being collected from day one.

**Fraud Rate Limit**  
DB-level: `record_stream()` checks that the device UUID hasn't streamed more than 60 unique tracks in the past hour. Returns `{ok: false, reason: 'rate_limited'}` if exceeded.

**DB Write**  
On qualifying stream: inserts into `stream_events`, increments `tracks.stream_count` and `artists.total_streams` atomically. Only works on `status = 'live'` tracks.

---

## Search

Search bar lives in the Discover tab. Debounced 300ms, queries Supabase directly:
- Matches track title (`ilike`) OR artist name (`ilike`), merged and de-duped client-side
- **Search is available to every tier** — Explorer, Native, Insider can all search and see results, including exclusive tracks (shown with a tier badge)
- **Playback is what's gated**, not search — clicking a locked result shows an upgrade toast instead of playing, matching how Spotify/Apple Music handle free-tier search
- Results are stored in `_lastSearchResults` and referenced by index in click handlers (avoids injecting track data into `onclick` HTML attributes, which would break on titles containing quotes/apostrophes)

## Playback Controls

- **Previous / Next**: cycles through `TRACK_META` (the 5 legacy catalog tracks) in order. Tracks played via search don't currently have next/prev context — falls back to the first catalog track.
- **±15s skip**: seeks real `<audio>` currentTime when a track has an `audio_url`; nudges the demo progress bar percentage otherwise.
- **Media Session API**: registers `play`, `pause`, `previoustrack`, `nexttrack`, `seekbackward`, `seekforward` handlers once on page load. `updateMediaSessionMetadata()` runs on every track change to update the lock-screen/Bluetooth display (title, artist, artwork). `setPositionState()` keeps the OS scrubber in sync via the `<audio>` `timeupdate` event.

## Fan-Powered Royalties

```
Subscriber pays $15/mo
  └─ 20% platform ($3) → operating costs
  └─ 80% to artists ($12) → proportional to that subscriber's listening
       └─ If you listened 86% Murkemz → Murkemz gets $10.32 of your $12
       └─ If you listened 14% other artists → they split $1.68
```

**Rate:** $0.012 / qualifying stream (3× Spotify's ~$0.0038)  
**Payout day:** 1st of every month  
**Tables:** `payout_periods` → `payout_allocations` → `artist_payouts`  
**Status:** Schema exists, automated calculation job not yet built

---

## Track Submission Flow

1. Artist fills out submit form (`/app` → Artist role → Submit Track)
2. Audio file uploads to Supabase Storage bucket `track-audio` (public, 100MB limit)
3. Track record inserted into `tracks` table with `status = 'pending'`, `is_active = false`
4. Admin sees the submission in Content → Pending Review
5. Admin can preview audio (direct link to Storage URL), then **Approve** or **Reject**
6. **Approve**: sets `status = 'live'`, `is_active = true` → track immediately appears in catalog
7. **Reject**: sets `status = 'rejected'`, optionally stores `rejection_reason`

---

## Database Schema (13 tables)

| Table | Purpose |
|---|---|
| `profiles` | Member profiles (extends auth.users) |
| `artists` | Artist roster — name, bio, total_streams |
| `albums` | Albums/EPs |
| `tracks` | Songs — title, audio_url, status (pending/live/rejected), exclusive_tier, stream_count |
| `stream_events` | Per-stream log — track_id, user_id, session_id, user_tier, listened_at |
| `subscriptions` | Stripe-linked subscription records |
| `payout_periods` | Monthly payout windows |
| `payout_allocations` | Fan-powered: per-user per-artist earnings per period |
| `artist_payouts` | Aggregated artist earnings per period |
| `partner_businesses` | Future Eats/Cuts/Drops partners |
| `partner_perks` | Perks each partner offers per tier |
| `perk_redemptions` | Member perk usage log |
| `notify_interest` | "Notify Me" signups for coming-soon sections |
| `feed_posts` | City Feed posts (admin/artist authored) |

**Key DB function:** `record_stream(track_id, user_id, session_id, user_tier)` — SECURITY DEFINER, rate-limited, deduped, atomically increments counters.

---

## Storage

**Bucket:** `track-audio` (public, 100MB file limit)  
**Accepted types:** mp3, wav, ogg, m4a, aac  
**Path structure:** `{guest_id_prefix}/{timestamp}_{safe_title}.{ext}`  
**Public URLs:** `https://dnzvtathfpjelffjnqrc.supabase.co/storage/v1/object/public/track-audio/{path}`

Audio plays in the app via a hidden `<audio>` element. If `audio_url` is set on a track, real audio plays. If not (seeded demo tracks), the visual progress bar animates as a demo.

---

## City Feed

Powered by `feed_posts` table. Posts load dynamically from Supabase on page load. Admin/artists post via Supabase dashboard (UI posting panel planned for v2). Supports `post_type`: update, drop, event, spotlight, poll.

---

## Environment Variables

```bash
# phx/.env.local (gitignored)
SUPABASE_URL=https://dnzvtathfpjelffjnqrc.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

The anon key is embedded in `app.html` for client-side use. All sensitive operations go through SECURITY DEFINER functions or will move to Edge Functions.

---

## Deployment

**Host:** Vercel (auto-deploys from GitHub `jmorrow08/PHX-App`)  
**Build:** None — static HTML/CSS/JS  
**`vercel.json`:** Rewrites all paths to `.html` equivalents for clean URLs

```bash
# Push to deploy
git push origin main
```

---

## Feature Status

| Feature | Status |
|---|---|
| Music streaming (UI + 30s threshold) | ✅ Live |
| Fan-powered royalty display | ✅ Live (calculation pending) |
| Real audio playback | ✅ (plays from audio_url when present) |
| Stream tracking → Supabase | ✅ Live |
| Fraud protection (60/hr rate limit + device fingerprint) | ✅ DB-enforced |
| Admin stream activity dashboard | ✅ Live (real Supabase data) |
| Track submission + Storage upload | ✅ Live |
| Admin approve/reject submissions | ✅ Live |
| City Feed from DB | ✅ Live |
| Mobile responsive (all 6 roles) | ✅ Live |
| Bottom tab navigation (role-aware) | ✅ Live |
| Behavioral event tracking (user_events) | ✅ Live |
| Media Session API (lock screen + Bluetooth controls) | ✅ Live |
| Prev/Next/±15s player controls | ✅ Live |
| Music search (title + artist) | ✅ Live, all tiers |
| PWA install prompt (Android) + iOS instructions | ✅ Live |
| Service worker (installability) | ✅ Live |
| Supabase Auth (real login) | 🔲 Planned |
| Stripe subscriptions (live mode) | 🔲 Planned |
| Payout calculation job | 🔲 Planned |
| Audio upload cover art | 🔲 Planned |
| City Feed admin post UI | 🔲 Planned |
| Push notifications | 🔲 Planned |
| Recommendation engine (reads user_events) | 🔲 Planned |
| PHX Eats / Cuts / Drops verticals | 🔲 Q3 2026 |
| Events calendar | 🔲 Q3 2026 |

---

## Background Playback — Known Limitation

PHX is a web app, not a native app, which has a real ceiling:

- **Android (Chrome):** Media Session API + service worker gets audio to survive screen lock and app switching reliably, especially once installed to home screen.
- **iOS (Safari):** Apple suspends `<audio>` in background browser tabs aggressively. Media Session API helps once the app is **added to Home Screen** (standalone mode) — a plain Safari tab will still get suspended. We show iOS users a one-time banner with manual "Add to Home Screen" instructions since Safari doesn't support the `beforeinstallprompt` API Android/Chrome use.
- **Bluetooth / hardware media keys (AirPods, car stereo):** Wired via `navigator.mediaSession.setActionHandler()` for play/pause/next/previous/seek — these will work once the OS considers PHX the active media app, which requires the metadata + action handlers we've set up.
- **True parity with Spotify/Apple Music** (bulletproof background audio in every scenario) requires a native app wrapper (Capacitor/React Native). Not needed yet, but the ceiling to know about.

---

## Migrations Applied

| # | Name | What it does |
|---|---|---|
| 001–005 | Core schema | All 13 tables, RLS, indexes |
| 006 | Views + seed data | artist_stats, top_tracks, user_payout_breakdown views; Murkemz/Futuristic/Mega Ran + 5 tracks |
| 007 | stream_events nullable user_id | Drop FK to auth.users, allow anonymous streams |
| 008 | Fix user_tier column | Corrected column name in record_stream() |
| 009 | artist_id lookup in record_stream | Function now resolves artist_id from track |
| 010 | tracks public SELECT policy | Anon users can read track stream counts |
| 011 | stream_events anon read | Admin dashboard can display stream events |
| 012 | Track submission + storage | status/release_type columns, track-audio bucket, insert/update policies |
| 013 | record_stream rate limit + jsonb return | 60 unique tracks/hr cap, only counts live tracks |
| 014 | feed_posts table | City Feed from DB, seeded 2 posts |
| 015 | user_events analytics table | Behavioral event log (session_start, play_start, play_30s) + indexes; profiles gets device_fingerprints/genre_affinities columns for future personalization |

---

## Local Dev

```bash
cd phx
npx serve .
# Open http://localhost:3000/app
```

Use the demo bar at the bottom to switch between roles.
