# PHX — Operations SOP

> STATUS: current as of 2026-08-07 — living document
_How PHX is run day-to-day, and what gets monitored where, so nothing falls through the cracks. Living document — update as the app changes._

---

> **Start here if you're new (human or agent):** `PHX-Operating-Manual.md` is the full map of the business and app — this file is the day-to-day checklists that hang off it.

## 1. What PHX is (one line for anyone new)

An invite-only, fan-powered music membership for Phoenix: members stream local artists, and their pass pays the artists they actually play — with a receipt. Music first; events/perks (Eats/Cuts/Drops) later. Built and operated by Lightbulb Studios.

## 2. The stack (who/what runs the thing)

| Layer | What | Where it lives |
|---|---|---|
| App | Static HTML/JS (`app.html`, `index.html`, `legal.html`) | Vercel, auto-deploys from GitHub `main` |
| Backend | Supabase (Postgres + RLS + Storage + Edge Functions) | project `dnzvtathfpjelffjnqrc` |
| Auth | Supabase Auth (email/password + Google), invite-gated | — |
| Merch | Fourthwall (merchant of record) | per-artist shops |
| Domain | `thephx.app` (primary), `thephxapp.com` (redirect) | — |
| Monitoring | Ops digest agent (planned) + Supabase logs/advisors | admin surface |

## 3. Operating rhythm

**Daily**
- Clear the **moderation queue** (reported posts/comments) — hide or dismiss.
- Clear the **event-ingestion approve queue** (once the Plug Map agent is live) — approve/reject flagged events.
- Glance at the **ops digest** — errors, failed uploads, source breakage, anomaly flags.
- Approve/review new **artist applications / claim codes**.

**Weekly**
- Review **beta-health metrics** (DAU/WAU, retention, invite coefficient, artists posting).
- Review **new-artist recruiting** progress (goal: 20–30 founding artists).
- Post the **Plug Map / "what's happening" rollup**; keep the feed alive.
- Check **source health** for the event agent (any scraper returning zero?).

**Monthly**
- **Wallet Day** — run the payout period, publish "PHX paid Phoenix artists $X" on feed + stage, send each member their receipt, press-release to New Times/PhxSoul.
- Reconcile **platform financials** (MRR, payouts, pot, costs) — see Financials SOP.
- Review **security advisors** (Supabase) + rotate anything needed.
- Back up / snapshot the DB.

## 4. What's monitored, and where it must live (all in Admin)

Everything below needs a home in the admin surface (see the Admin & Analytics spec):
- **Platform health** — errors, uptime, upload success, storage, last-write timestamps.
- **Moderation** — report queue + count badge.
- **Event ingestion** — approve queue + source health.
- **Members** — signups, activation, tier, retention cohorts.
- **Artists** — roster, plays, applications.
- **Analytics** — post/track/artist performance, funnel, cohorts (Meta-Business-Suite-style).
- **Financials** — MRR, payout queue, community pot, revenue history, costs.
- **Settings** — payout knobs, phase (founding/public), caps, fraud thresholds.

**Rule:** if it needs watching, it must be viewable in admin — no "check the database" operational steps.

## 5. Content moderation SOP

1. Automated filter (`moderate_content()`) blocks extreme content at write time (threats, hate, CSAM, doxxing).
2. Users report → report lands in the admin queue (category + preview + author).
3. Admin action: **Hide** (removes for everyone via RLS, closes all reports on that target) or **Dismiss**.
4. Nothing is hard-deleted — hidden content is restorable.
5. Repeat offenders → account action (documented, not ad-hoc).

## 6. Artist / partner onboarding SOP

1. Vet: real person, Phoenix connection, listenable catalog (5-min check — this is the scene moat).
2. Pre-built artists → **claim code** (hands them their finished page). Ordinary artists → invite code + wizard.
3. They sign up + finish the wizard → their artist page sits **pending** (invisible to the public). When vetted: Admin → Artists → **Approve — go live**. That one click puts them on the roster, makes them streamable, mints their permanent unlimited fan code, and notifies them.
4. Verify (✓) is separate and comes after the four-point check in the redesign changelog.
5. Set up merch (Fourthwall shop, admin-managed) if applicable.
6. Give them their **fan code** + QR cards (their code = their payroll) — it was auto-minted at approval; codegen's "email it to them" field sends it in one step.
7. Add their real photo/banner (fixes link previews).

## 7. Release / deploy SOP (tighten this — it's a known weak spot)

Current: edit `app.html` → push to `main` → Vercel auto-deploys. Three prod bugs already shipped this way ("parsed clean, failed at runtime").
**Adopt:**
1. Work in a **branch**, deploy to a **Vercel preview** first.
2. Run a **smoke checklist** on the preview: sign in, load feed, play a track, open each admin view, no console errors.
3. Only then merge to `main`.
4. After deploy, re-run the smoke checklist on prod.

## 8. Incident response (basics)

- **Security (data exposure):** revoke/lock the surface first (RLS or execute grant), verify with a query as `anon`, then communicate. (This is how the recent leaks were handled.)
- **Outage:** check Vercel + Supabase status; the app-shell service worker serves a cached shell offline.
- **Payout error:** payouts are idempotent and recalc pending periods — never pay a "paid" period twice; fix inputs, re-run.

## 9. Support SOP

- Single inbox/DM channel for member + artist issues.
- Common: can't sign in, invite code, missing payout, merch order (→ Fourthwall handles fulfillment/returns).
- Track recurring issues → they become product fixes.

## 10. Keep-this-updated triggers

Update this SOP whenever: a new vertical launches, the payout model changes, the admin surface changes, or a new monitored system is added (e.g., the event agent going live).

## Weekly growth review (added 2026-08-08)
1. **Admin → Growth** — funnel (landing → session → account → redeemed → played), sources, D1/W1 retention (gate: ≥40% wk-4).
2. **Admin → Financials** — pot balance + ledger (every beta dollar in/out), payout queue, Formula Lab.
3. **Admin → Activity** — listening log (capped chip = farmed plays), Clips performance, per-user drill-down.
4. Points are the only referral reward (never free months). Reactions/favorites/replies are live social surface — watch reports queue after drops.


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
