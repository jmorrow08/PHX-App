# PHX — Event Ingestion Agent (spec)

> STATUS: current as of 2026-08-07 — spec, not yet built
_Drafted for Jaye. Powers the Plug Map: keep Phoenix events fresh daily/hourly without a listings staff. Companion to the Plug Map build direction._

---

## 1. What it does (one paragraph)

A scheduled agent that reads events from many sources (APIs, listing sites, venue calendars, flyers, submissions), uses an LLM to normalize each into one clean event record, geocodes the venue, merges duplicates, and gates by confidence — **auto-publishing trusted sources and routing messy ones to a 1-tap human approve queue.** It runs nightly plus fast "tonight / last-minute" passes. It doubles as a discovery engine: a new event for an artist or venue a member follows becomes a notification.

**Design principle:** machine seeds, AI extracts, humans verify the messy edge, community fills the gaps. Fully-autonomous produces a map full of wrong dates; the hybrid stays trustworthy. **A wrong date costs more than a missed show.**

---

## 2. Architecture (fits the existing stack)

- **Postgres (Supabase)** — new tables below; reuses the existing `shows` table as the artist-authored input.
- **Scheduled edge functions** (pg_cron or Vercel cron) — trigger sweeps per source cadence.
- **LLM** — extraction + dedupe reasoning (cheap; a few hundred events/day is pennies).
- **Geocoder** (Mapbox or Google) — venue name/address → lat/lng, cached in `venues`.
- **Admin queue UI** — 1-tap approve/edit/reject for low-confidence items.

```
 pg_cron ──► fetch(source) ──► raw_items ──► LLM extract ──► resolve venue+geocode
                                                                     │
   map ◄── events(published) ◄── confidence gate ◄── dedupe/merge ◄──┘
                    │                    │
              notifications        ingest_queue (human 1-tap)
```

---

## 3. Data model

### `sources` — the config that makes adding a site a row, not a project
| column | type | notes |
|---|---|---|
| id | uuid | |
| name | text | "Ticketmaster", "Crescent Ballroom", "PhxSoul" |
| url | text | endpoint or page to read |
| method | enum | `api` · `affiliate` · `page_read` · `browser` · `submission` · `partner_feed` |
| category | enum | `shows` · `perks` |
| trust | numeric(3,2) | 0–1 (see §6) |
| cadence | enum | `nightly` · `fast` (2–3h) · `weekly` |
| parser_hint | text | freeform note to the extractor ("events under .event-card; date in header") |
| robots_ok | bool | robots.txt / terms cleared |
| terms_note | text | per-source ToS caution |
| enabled | bool | kill-switch |
| last_run_at | timestamptz | |

### `venues` — geocoded, deduped by alias
`id, name, slug, address, lat, lng, neighborhood, aliases[], source, follower_count`

### `events` — canonical record the map renders
`id, title, kind(show|open_mic|drop|listening_party|ticketed|perk), venue_id, starts_at, ends_at, price_text, ticket_url, cover_url, description, status(draft|published|rejected|expired|canceled), confidence, primary_source_id, dedupe_key, created_at, updated_at`

### `event_artists` — links to PHX roster when matched
`event_id, artist_id (nullable), artist_name` — `artist_id` set when fuzzy-matched to a PHX artist so the map card can show inline play/follow.

### `event_sources` — provenance + multi-source merge
`event_id, source_id, source_url, raw_item_id` — every source that contributed to a merged event. Powers "via PhxSoul" credit and the curator relationships.

### `raw_items` — staging (idempotency)
`id, source_id, fetched_at, content_hash, payload(jsonb/text/image_url), status(new|parsed|error)` — hash so unchanged items aren't re-parsed (cost control).

### `ingest_runs` — audit + health
`id, source_id, started_at, finished_at, fetched, created, updated, queued, errors` — feeds source-health alerts.

**Relation to existing `shows`:** artist-authored shows (via `upsert_show`) flow in as a first-party, high-trust source (auto-publish). The map renders `events`; `shows` is one input, not a separate surface. (Option: make the map read a `UNION` view of `events` + `shows`, or migrate `shows` writes to `events` with `source='artist'`.)

---

## 4. Pipeline stages

1. **Fetch** — per `method`: call API / pull affiliate feed / GET the public page / (rarely) headless-browser a JS-heavy page / accept a submission. Store to `raw_items` with a content hash; skip if hash unchanged.
2. **Extract** — LLM turns the raw item into the event schema **with per-field confidence** (see §7). Unknown fields stay null — never hallucinated.
3. **Resolve venue** — fuzzy-match to `venues` (aliases); if new, geocode and insert (flag new venues to the queue).
4. **Match artists** — fuzzy-match names to the PHX `artists` table; link in `event_artists`.
5. **Dedupe / merge** — `dedupe_key = normalize(venue + date + headliner)`. Merge across sources: keep the highest-trust value per field, attach all `event_sources`.
6. **Confidence gate** — auto-publish or queue (see §6).
7. **Publish / maintain** — set `status=published`; expire past events; reconcile `canceled`/`postponed` from source status codes.
8. **Notify** — new/updated event matching a member's followed artist or venue → `notifications` row (reuses the existing pipeline).

---

## 5. Cadence

- **Nightly** full sweep of all sources.
- **Fast pass every 2–3h** on high-velocity sources only (venue socials, submissions, Eventbrite "recent", curator feeds) — this is what catches last-minute adds.
- **Weekly** deep re-crawl + expire/cleanup + venue-directory reconciliation.
- Geocode + dedupe run after every fetch.

---

## 6. Confidence & trust rules (the trust valve)

**Per-source trust (seed):** API `0.95` · venue-direct `0.90` · established listing site `0.75` · aggregator `0.70` · flyer/IG caption `0.55` · community submission `0.45`.

**Auto-publish only if ALL:** `source.trust ≥ 0.85` · date **and** venue parsed with high field-confidence · event is future-dated · venue geocoded.

**Route to human 1-tap queue if ANY:** below threshold · sources disagree on date/venue · new venue not in directory · price or date ambiguous · flyer-derived.

**Never publish:** past date · missing venue · overall confidence below floor.

**Human queue:** admin sees a card — parsed fields + source link + flyer image — and taps **Approve / Edit / Reject** in ~10s. Rejections feed a per-source pattern blocklist. Any published event has a **"report wrong"** control that flips it back to review.

---

## 7. LLM extraction contract

The extractor is called per `raw_item` and must return **only** this JSON (no prose), with `null` for anything not clearly present and a `confidence` 0–1 per ambiguous field:

```json
{
  "title": "string",
  "kind": "show|open_mic|drop|listening_party|ticketed|perk|unknown",
  "artists": ["string"],
  "venue_name": "string|null",
  "venue_address": "string|null",
  "starts_at": "ISO-8601|null",
  "ends_at": "ISO-8601|null",
  "price_text": "string|null",
  "ticket_url": "string|null",
  "cover_image_url": "string|null",
  "city_is_phoenix_metro": true,
  "field_confidence": { "starts_at": 0.0, "venue_name": 0.0 },
  "overall_confidence": 0.0,
  "notes": "anything ambiguous the human should check"
}
```

System-prompt guardrails: *"Extract only what is explicitly stated. Never guess a date or venue — if unclear, null it and lower confidence. Phoenix-metro events only. Return JSON only."* Vision variant reads flyer images with the same schema.

---

## 8. Seed source list (starter config)

**Shows (now):**

| source | method | trust | note |
|---|---|---|---|
| Ticketmaster Discovery API | api | 0.95 | free, geo-radius, lat/lng + ticket URL |
| Bandsintown | api | 0.90 | your onboarded artists' dates |
| Venue sites (Crescent, Valley Bar, Rebel Lounge, Van Buren, Nash, Last Exit, Yucca, Rhythm Room, Club Red, Nile) | page_read | 0.90 | authoritative; ~no dedupe |
| Eventbrite | page_read | 0.70 | public event pages (search API deprecated); DIY/open-mic heavy — verify terms |
| Dice | page_read | 0.70 | indie shows; no open API — verify terms |
| Meetup | api | 0.75 | open mics, jams, community |
| PHX `shows` table (artists) | first_party | 0.95 | already built |
| Member/curator submissions | submission | 0.45 | flyer image or link |

**Perks (later — same pipeline, `category='perks'`):** Groupon (affiliate feed), Yelp deals, restaurant/barber sites → seeds the Eats/Cuts discount map when those verticals launch.

---

## 9. Legal / ToS guardrails

- **Prefer official APIs and affiliate feeds** (Ticketmaster, Meetup, Bandsintown, Groupon affiliate) — stable and clean.
- **Venue-direct is best** — authoritative, low-risk, minimal dedupe.
- **Reading public pages** is common but a gray area: respect `robots.txt` and rate limits, keep it polite, store provenance, and don't build anything load-bearing on a source whose terms forbid it. Per-source `terms_note` + `enabled` kill-switch.
- **Event facts aren't copyrightable, but flyer images have rights** — link/attribute and obtain via submission/partnership rather than hotlinking scraped graphics.
- Instagram/Facebook: do **not** brute-scrape (login-walled, ToS, anti-bot). Get that layer via **flyer submission + curator partnerships** instead.
- *Not legal advice — verify current terms per source before relying on it.*

---

## 10. Health, failure modes, mitigations

| failure | mitigation |
|---|---|
| scraper breaks (site redesign) → 0 items | `ingest_runs` flags a source returning 0 vs baseline → ops alert (never silently go stale) |
| wrong date/venue | confidence gate + human queue + "report wrong" |
| duplicate event across sources | `dedupe_key` + merge |
| anti-bot / IP block | prefer API/partner; polite backoff; disable source |
| runaway cost | content-hash skip; token caps; only re-parse changed items |

Wire source-health + queue-depth into the existing ops/digest agent (Bub-for-PHX) so a broken source or a growing approval backlog surfaces in the daily digest.

---

## 11. Build order

- **v1 (days):** `sources` + `events` + Ticketmaster API + ~10 venue sites + geocode → render on the Plug Map alongside existing `shows`. Trusted sources only, **no human queue yet.** Map is alive.
- **v2:** add listing sites + Eventbrite/Dice/Meetup + flyer submission + the **1-tap approve queue** + followed-artist/venue notifications.
- **v3:** `category='perks'` (Groupon et al.) for the verticals map + curator partner feeds + report-wrong corrections.

**Ongoing cost:** minutes/day of human approvals + occasional source gardening. LLM spend is negligible.

---

## 12. Why this is the leverage

Anyone can pull Ticketmaster — that's not the moat. The moat is the **underground + last-minute layer** no API has, and this agent is what makes *maintaining* that layer feasible for a solo founder. Its real job isn't "get events," it's "keep the messy 20% that makes PHX indispensable from rotting" — and turn every new date into a reason to open the app.
