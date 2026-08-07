# PHX — Admin & Analytics Surface (spec)

> STATUS: current as of 2026-08-07 — spec, not yet built
_The separate admin/analytics surface, modeled on Meta Business Suite. Decision + build spec; execute when the repo is reachable._

---

## The decision: yes, make admin its own surface

Facebook keeps the consumer app clean and pushes analytics/ops/money into a **separate product** (Meta Business Suite) behind its own login. PHX should do the same. Three reasons:

1. **No clash with the user side.** The consumer app stays simple; operators get a purpose-built cockpit.
2. **Security.** Admin/money lives behind its own gate instead of being conditionally hidden inside the consumer app — which is exactly where the recent leaks came from. A separate surface is a cleaner, safer boundary.
3. **It's the natural home** for analytics, moderation, the event-ingestion approve queue, financials, and the ops digest.

**Shape:** a separate route/app — `admin.thephx.app` (or `/studio`) — reachable **only** by `super`/`admin` logins, server-checked, not just DOM-hidden. Consumer `app.html` keeps only the member/artist experience.

## Sections (the left-nav)

1. **Overview** — the at-a-glance dashboard: today's signups, DAU/WAU, plays, MRR, pending reports, pending events, health status.
2. **Analytics** — the Meta-Business-Suite-grade page (detailed below).
3. **Members** — table, cohorts, activation funnel, tier, access status, search.
4. **Artists & roster** — artists, plays, applications/claim codes, approvals.
5. **Content / moderation** — report queue (category, preview, author) → Hide / Dismiss; hidden-content restore.
6. **Events (Plug Map)** — the ingestion approve queue + source health (from the Event Ingestion Agent).
7. **Financials** — MRR, payout queue, community pot, revenue history, **costs vs revenue** (Supabase/Fourthwall/domain/Stripe fees). Super-only.
8. **Settings** — payout knobs, phase (founding/public), founding caps, fraud thresholds, feature flags.
9. **Ops / health** — the digest: errors, uptime, upload success, storage, source breakage, anomaly flags.

## The Analytics page ("like Facebook, or better")

You already collect the raw data (`user_events`, `stream_events`, `follows`, `post_likes`, etc.), so this is mostly presentation. Build it with the **dataviz** design system so it reads as one clean system in dark mode.

**Four levels of analytics:**

| Level | Metrics | Charts |
|---|---|---|
| **Platform** | DAU/WAU/MAU, retention cohorts, invite coefficient, free→paid conversion, MRR trend | line + cohort heatmap + funnel |
| **Content (post/track)** | reach, plays, 30s-completions, saves, follows-gained, shares, likes/comments — per post & per track | sortable table + sparklines + per-item detail |
| **Artist** | monthly listeners, plays, top tracks, followers, wallet earned, top fans | artist detail cards |
| **Funnel** | invite → signup → activated → 3+ follows → paying, with drop-off at each step | funnel + weekly cohort retention curves |

**Facebook-parity features worth copying:**
- **Per-post insights** (tap any post/track → its full performance) — this is the core of what makes Business Suite useful.
- **Date-range picker** + compare-to-previous-period.
- **Audience** view (where members are, what tiers, activity times).
- **Reach vs engagement** framing (impressions logged via `log_impressions` already exists).
- **Export** (CSV) for anything.

**Better-than-Facebook angle (on-brand):** a **"Money reached artists"** analytics view — the citywide Wallet ticker, per-artist payout history, and the Receipt data as first-class analytics. No mainstream platform shows this; it's your differentiator turned into a dashboard.

## Data sources (already live)

`user_events` (behavioral), `stream_events` (plays + seconds + counted), `follows`, `post_likes`/`post_comments`/`track_likes`, `feed_posts`, `subscriptions`, `payout_periods`/`artist_payouts`, `impressions` (via `log_impressions`). Most of the analytics is queries + charts, not new instrumentation.

## Build approach

1. Stand up the separate admin route with a hard server-side `is_admin()` gate.
2. Move the existing admin views (Dashboard, Members, Artists, Content, Reports, Financials, Settings, Activity) out of `app.html` into it — this also shrinks the consumer bundle.
3. Build the Analytics page on the dataviz system, platform level first, then per-post/artist.
4. Wire the ops digest + event approve queue in as they come online.

**Sequencing note:** this pairs naturally with the identity migration and the cleanup — moving admin out of `app.html` is also *part of* slimming the 500KB consumer file.
