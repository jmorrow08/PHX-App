# PHX — Master Status & Loose Ends

> STATUS UPDATE (2026-08-07): The identity migration described here was COMPLETED in migration 059 — all SECURITY DEFINER functions now derive identity from auth.uid() via _effective_user(); anon EXECUTE revoked on member-only writes. See README security section.
_The single source of truth, reconciled across every chat/rabbit-hole. What's actually done, what's half-done or forgotten, what's dead, and the risks nobody's looked at yet. Generated from a live read of the repo (90 migrations, git log, app.html) + database on 2026-08-07._

---

## A. Reconciled status — what's actually DONE now
_(These correct stale items from earlier audits — a lot got fixed in the many sessions.)_

- ✅ **Security leaks closed:** reports, profiles, notifications, merch_connections all locked; **member_profiles** locked (this session); **notifications RPC** leak closed (this session); **XSS** (attribute injection) fixed; **invite-bypass helper** locked (this session).
- ✅ **Money receipt** is percentage-only (split no longer leaks).
- ✅ **Blank-screen-after-signin** fixed.
- ✅ **Instagram link previews** — `build-artist-pages.mjs` generates real per-artist OG pages (`/a/murkemz`, `/a/jaye-mali`) with og:title/description/image + twitter card. *(Two small follow-ups in §B.)*
- ✅ **Google OAuth terms-gate risk** — moot: Google sign-in is **disabled** while invite-only (migration 053).
- ✅ **Bootstrap mode closed** (1 super exists) — so the RLS policies actually enforce.
- ✅ **Identity-to-session pattern started** (migration 051 `_effective_user`) — redeem, profile edits, posts, comments, likes, referrals now use the real login.

## B. Loose ends — planned-but-unfinished / forgotten
_(These are the "came back to it?" items. Ranked by importance.)_

1. **🔴 Identity migration is ~60% done, not done.** Migration 051 bound *some* functions to the session; the rest still trust the app-supplied ID: **`my_receipt` (data leak), `create_page`, `toggle_follow`, `toggle_track_like`, `tag_product_in_post`, `submit_report`, `accept_terms`, onboarding helpers, `record_stream`.** The hardening changelog literally says "revisit `anon_security_definer_function_executable` after bootstrap closes" — **bootstrap is now closed, so this is due.** (Full plan: `PHX-Identity-Migration-Scope.md`.) *This is the #1 thing before billing.*
2. **🟠 "Require auth for writes" is partial.** Migrations 046/052 gated *some* writes; follow/like/page/report/tag still accept anonymous/again-spoofed calls. Same sweep as #1.
3. **🟠 Artist profile editing is a dead "coming soon" form.** Artists literally cannot edit their profile or social links (`Save Changes — coming soon`, `Save Links — coming soon`). Core artist feature missing.
4. **🟡 Dormant email pipeline.** An email queue exists (migration 045, commit "email pipeline (dormant)") but isn't wired to anything — invites/receipts/notifications don't actually email. Decide: finish it or shelve it explicitly.
5. **🟡 README is badly out of date.** Claims **41 migrations; reality is 90.** Feature-status table lists simulated/partial things as ✅ Live. Needs the honest rewrite (Live / Simulated / Planned).
6. **🟡 OG follow-ups:** generated pages use the **old `phx-app.vercel.app` domain** in `og:url`/`og:image` (should be `thephx.app`), and it's **unverified that the vanity URL `thephx.app/murkemz` serves the OG page to crawlers** (vs the JS app). If crawlers hit the JS app, previews still break on the pretty link.
7. **🟡 Admin is still inside `app.html`** — the separate admin/analytics surface (`PHX-Admin-and-Analytics-Spec.md`) isn't built. This is also the biggest chunk of the 533KB consumer file.
8. **🟡 Plug Map + Event Ingestion Agent** — scoped (`PHX-Event-Ingestion-Agent.md`) but not built.
9. **🟡 Push notifications** — pipeline built (migrations 027/028) but unverified it actually fires; possibly dormant.

## C. Dead / cruft — safe-to-remove candidates (verify unreferenced, then remove in a branch)
- **`_to_delete/`** — contains only stray git lock files (`HEAD.lock`, `index.lock`, `maintenance.lock`). Cruft; remove.
- **`grant_access_on_redeem()`** — orphaned, now execute-locked; the redeem functions don't call it → drop after confirming no references.
- **Duplicate migration numbering** (two 029–058 series from a rebase) — cosmetic, but note it so future migrations don't collide.
- **32 silent `catch (e) {}`** blocks in `app.html` with **0 `console.error`** — not deletion, but a real reliability hole (errors vanish; see §D).

## D. Un-explored rabbit holes — find these before it's too late
_(Nobody's audited these yet. Flagging now while cheap.)_

1. **💣 No error visibility.** 32 empty catch blocks, zero logging. When something fails in production, it fails **silently** — and your planned ops digest can't report what it can't see. Wire a `reportFailure()` that logs + optionally pings the ops agent, and stop swallowing errors.
2. **💣 No tests, no staging.** Every deploy edits a 533KB file and pushes straight to prod. Three runtime bugs already shipped this way. A preview-deploy + smoke checklist (in the SOP) is the minimum; it's the single biggest reliability win.
3. **💣 Stripe billing + payout execution don't exist yet.** The entire monetization (charge members, pay artists via Connect) is unbuilt. This is the gap between "beta" and "business." Scope it before promising anyone money.
4. **⚠️ `record_stream` spoofing → payout integrity.** Streams are the input to the wallet, and identity is client-supplied. Fraud caps exist, but this is the money-integrity soft spot; harden it in the identity sweep.
5. **⚠️ Legal/compliance not closed:** the "$9.99 locked for life" promise (binding), terms **versioning** (you have `terms_version` but no re-consent flow), artist-agreement enforceability, and **AZ TPT / sales tax on subscriptions** (Fourthwall covers merch; subscriptions are on you). Get counsel before charging.
5b. **⚠️ Privacy:** you collect device fingerprints + behavioral `user_events`. Privacy policy exists, but there's **no data-subject-request / deletion flow** — needed if you ever scale beyond AZ.
6. **⚠️ Backups / disaster recovery.** Is an automated Supabase backup actually configured, or is monthly-snapshot just written in the SOP? Confirm it exists — losing the DB loses the company.
7. **⚠️ Cost monitoring.** Supabase + Vercel + Fourthwall + domains cost money against **$0 revenue** today. No dashboard tracks burn. Add it to admin/financials.
8. **⚠️ Ownership paperwork** (separate doc) — the biggest *non-code* rabbit hole. Papered before the rollout, not after.

## E. The one path forward (so this doesn't scatter again)

Do these as **one coordinated pass**, in this order, each in a branch → preview → smoke-test → merge:

1. **Finish the identity migration** (§B1/B2) — closes `my_receipt`, the impersonation set, and "anon writes" together. *Security-critical, do first.*
2. **Purge simulation data**, confirm no sim leakage to public surfaces.
3. **Split admin out** of `app.html` into the separate surface (§B7) — shrinks the file, fixes the security boundary, and is where analytics/monitoring live.
4. **Kill the silent-error hole** (§D1) + adopt the **preview + smoke-test** deploy (§D2).
5. **Finish or shelve** the dead artist-profile form (§B3) and the dormant email pipeline (§B4) — explicitly, no more limbo.
6. **Rewrite README + docs** to match reality (§B5).
7. **Then** scope Stripe billing (§D3) and go to founding launch.

Items 1–4 are the ones that turn "impressive beta" into "safe to charge a card." Everything in the ownership/legal column runs in parallel with an attorney.
