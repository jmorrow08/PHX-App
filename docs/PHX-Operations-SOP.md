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
