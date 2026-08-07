# Docs Cleanup Changelog — 2026-08-07

> STATUS: current as of 2026-08-07 — record of the documentation phase of the cleanup plan (`PHX-Cleanup-and-Docs-Plan.md`, Phase 2)

## Added (copied from working drafts into `docs/`)

- `PHX-Identity-Migration-Scope.md` — with a status update noting the migration was COMPLETED (migration 059: `_effective_user()`, anon EXECUTE revoked on member-only writes)
- `PHX-Master-Status-and-Loose-Ends.md` — same status update added
- `PHX-Cleanup-and-Docs-Plan.md`
- `PHX-Admin-and-Analytics-Spec.md`
- `PHX-Operations-SOP.md`
- `PHX-Ownership-and-Partnership-Framework.md`
- `CHANGELOG-cleanup.md` (this file)

## README.md — rewritten to match reality

- Migration count corrected: **94 migrations** applied to the live Supabase project (verified via `list_migrations`). Noted there is no local `supabase/migrations/` directory and that numeric prefixes restarted mid-history (two independent 030–051 series), so timestamps are the real ordering. The stale per-migration table (which ended at 041) was removed in favor of the live source of truth.
- Feature-Status table re-marked with three honest states: **✅ Live / 🧪 Simulated / 📋 Planned**. Payouts, wallet money, subscriptions, and beta plays moved from "Live" to Simulated; Stripe billing and payout execution marked Planned (unbuilt); email pipeline marked built-but-dormant (awaiting Resend API key + domain DNS); web push marked built-but-unverified. Duplicate/contradictory rows from the old table removed (e.g. "Supabase Auth: Live" and "Supabase Auth: Planned" both appeared; Reels appeared as both Live and Roadmap).
- Live domain stated as **thephx.app** with vanity URLs (`thephx.app/<artist-slug>`) and the `/a/<slug>` static OG pages + `scripts/build-artist-pages.mjs` build step documented.
- Money-visibility section tightened to the current rules: receipts are **percentage-only** (no dollar amounts on any member-facing surface); earnings visible only to the artist themselves and admins; **Community Pot is admin-only**.
- Security section updated: identity migration complete, bootstrap closed, roles server-only, invite-only signup, Google sign-in disabled.
- Stale content removed: demo role bar (replaced by real auth), `admin.html`/`partner.html` page rows (files don't exist), "13 tables" (now 47, all RLS-enabled), pricing-tier marketing copy that duplicated the landing page.
- Accurate content preserved (condensed): streaming mechanics, submission flow, storage buckets, social layer, ranking, moderation, background-playback limitation, env vars, deployment, local dev.

## Archived (moved to `docs/archive/` — superseded, kept for history)

- `PHX-Beta-Build-Plan.md` → superseded by `PHX-Master-Status-and-Loose-Ends.md`; most gaps it listed (server-side roles, bootstrap closure, invite gate) have since closed
- `2026-07-30-db-hardening-changelog.md` → shipped changelog for migrations 029–033; historical record

## Status headers added (docs left in place)

Every remaining doc in `docs/` now carries a one-line `> STATUS:` header (HTML docs get an equivalent `<!-- STATUS: ... -->` comment):

- Current: `PHX-Launch-Strategy.md`, `QA-MASTER-PROMPT.md`, `phx-algorithm-decisions.md`, `phx-open-questions-answered.md`, `recommendation-engine-research.md`, `phx-algorithm-guide.html`, `phx-payout-math.html`, `phx-membership-and-merch.html`
- Current, spec/roadmap not yet built: `PHX-Admin-and-Analytics-Spec.md`, `PHX-Event-Ingestion-Agent.md`, `native-app-capacitor.md`, `PHX-Ownership-and-Partnership-Framework.md`, `PHX-Operations-SOP.md`, `PHX-Cleanup-and-Docs-Plan.md`
- Superseded in part (kept in place): `phx-open-decisions.md` — referenced by code comments in `app.html`, so not archived
- Superseded (kept in place): `phx-build-board.html` — historical build-board snapshot, superseded by `PHX-Master-Status-and-Loose-Ends.md`
- Historical: `PHX-Design-Prompt.md` — one-shot redesign prompt

## Removed

- `_to_delete/` directory — contained only three zero-byte git lock files (`HEAD.lock`, `index.lock`, `maintenance.lock`), nothing else. Deleted.
