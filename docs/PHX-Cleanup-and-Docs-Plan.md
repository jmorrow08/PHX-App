# PHX — Cleanup & Docs Rewrite Plan

> STATUS: current as of 2026-08-07 — docs phase executed 2026-08-07 (see CHANGELOG-cleanup.md); code phases pending
_A **safe** plan to tighten the codebase, remove what's dormant, and bring every doc current — executed carefully once the repo is reachable. No blind deletes._

---

## The rule for this whole effort

**Nothing gets deleted without being proven unreferenced first.** The app is one ~500KB `app.html` with no tests; three prod bugs already shipped because code "parsed clean and failed at runtime." So every removal goes: **inventory → classify → prove-unused → remove in a branch → smoke-test on a preview → merge.** Deleting on a hunch is how you take the app down.

## Phase 1 — Inventory & classify

Walk the code + DB + docs and tag everything one of three ways:
- **LIVE** — in use, keep.
- **DORMANT** — built but not currently used; decide keep-as-teaser vs remove.
- **DEAD** — superseded/orphaned; safe to remove once proven unreferenced.

### Likely DEAD (remove candidates — verify unreferenced first)
- `grant_access_on_redeem()` — orphaned, already execute-revoked; the real redeem functions don't call it → drop after confirming nothing references it.
- Any duplicate/legacy RPCs left from the device-era → auth migration (check for two functions doing the same job).
- Unused columns / tables from abandoned experiments (cross-check against `app.html` queries).
- Dead client functions in `app.html` never called from any handler.

### Likely DORMANT (decide, don't reflexively delete)
- **Reels as a destination** — reframe to Clips + Clip-&-Share (per the build direction), don't delete video.
- **Simulation mode + sim data** — keep the *engine* (useful to test payouts), **purge the sim rows before launch** (`purge_simulation()`), and make sure sim numbers never leak to member/public surfaces.
- **Coming-soon vertical infra** (Eats/Cuts/Drops tabs) — keep as teasers, no deeper build.
- **Device-era identity paths** — do NOT delete yet; they're being *migrated* (see Identity Migration Scope). Remove only after the migration lands.
- **Native/Capacitor guide, LightFM pipeline** — keep as docs/backlog, not active code.

### Definitely LIVE (keep + protect)
Streaming + wallet + Receipt, City Feed + social RPCs (now auth-guarded), artist pages, merch (Fourthwall), follows/notifications, invite/claim codes, admin/moderation.

## Phase 2 — Docs & READMEs rewrite

The docs are strong but partly aspirational — bring them to truth:
- **README.md** — the Feature-Status table lists things as ✅ Live that are simulated or partial (payouts, billing, some verticals). Re-mark honestly: Live / Simulated / Planned. Fix the money-visibility section to match the now-percentage-only receipt.
- **The `docs/` set** — mark each doc's status (current / superseded / done). The stale "DESIGN ONLY" style headers should be corrected (same lesson flagged for Lytbub HQ).
- **Add the new specs** already written this session: Event Ingestion Agent, Identity Migration Scope, Operations SOP, Admin & Analytics Spec, Ownership Framework.
- **Retire** docs for abandoned directions into an `docs/archive/` folder (don't delete history — archive it).

## Phase 3 — Code tightening (beyond deletion)

- **Split `app.html`.** Moving admin out (per the Admin spec) is the biggest single win — shrinks the consumer bundle and isolates the risky surface.
- **Finish the identity migration** (per that scope doc) — this removes a whole class of dormant device-era branches *safely*, as part of a coordinated change.
- **Add a smoke-test checklist** (even a manual one) to the deploy SOP so "parses clean, fails at runtime" stops happening.

## Phase 4 — Execution guardrails

1. All of this in a **branch**, never directly on `main`.
2. Each change → **Vercel preview** → smoke checklist (sign in, feed, play, every admin view, no console errors).
3. Merge only when green; re-verify on prod.
4. Keep a short **changelog** of what was removed and why (so a future you doesn't wonder where something went).

## Order of operations (recommended)

1. **Security first** — finish the identity migration (it removes device-era dead paths safely).
2. **Purge sim data** (`purge_simulation()`), confirm no sim leakage.
3. **Split admin out** of `app.html` into the separate surface (removes the biggest chunk of the consumer file + fixes the security boundary).
4. **Remove proven-DEAD code/RPCs/columns** (branch + preview + test).
5. **Rewrite the docs/READMEs** to match the tightened reality.
6. **Adopt the deploy smoke-checklist** so it stays tight.

Cleanup, the admin split, and the identity migration are **the same project viewed three ways** — doing them together is how the whole app gets tight in one coordinated pass instead of scattered risky edits.
