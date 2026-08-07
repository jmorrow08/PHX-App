# PHX — Master QA Prompt

> STATUS: current as of 2026-08-07

Paste the block below into a fresh Claude Code session (or a Cowork agent) pointed at this repo. It runs a full adversarial audit of the live app.

**Run it as super admin.** Sign in first at https://thephx.app/app with the `alijayem1` account — admin surfaces are removed from the DOM for anyone else, so an unauthenticated run cannot test them.

---

## The prompt

```
You are QA-auditing PHX, a live music + social platform at https://thephx.app/app
(repo: this directory; main file phx/app.html; backend: Supabase project dnzvtathfpjelffjnqrc).

Read phx/README.md first — it documents the role model, money-visibility rules and
migration history. Those rules are the spec you are testing against.

## How to test

Drive the REAL app in a browser (preview_start on the phx-app config, then navigate,
click, type, read the DOM and console). Do NOT audit by reading source alone —
the last three production bugs all parsed cleanly and only failed at runtime:
  · a removed variable still referenced in a return expression (blanked a whole page)
  · a NOT NULL column with no default (every signup failed)
  · destructive DOM removal racing an async auth check (locked admins out)
Read the source to form a hypothesis, then PROVE it in the running app.

Log in as super admin before testing admin surfaces.

## What to cover

1. NAVIGATION — every sidebar item, every bottom tab, every in-page link and
   back-link, for each role you can reach. Confirm each lands on the right view
   with the right title. Note anything that dead-ends or leaves the user stuck.

2. EVERY CLICKABLE — buttons, chips, tabs, cards, avatars, names, filters, sort
   toggles, share/report/like/follow controls, modal open+close (including the ✕
   and Escape and click-outside). Anything that LOOKS clickable must either do
   something or not look clickable. Flag look-alikes that do nothing.

3. FORMS — post composer, comments, track submit, page editor, profile editor,
   show editor, auth (sign in / create account / Google), invite + claim codes,
   report modal, merch connection. For each: submit empty, submit invalid,
   submit oversized, submit twice fast (double-click), and cancel mid-way.
   Nothing should silently fail or leave a spinner forever.

4. ROLE + PRIVACY BOUNDARIES — the highest-value area. Verify:
   · A signed-out visitor and a plain member CANNOT reach admin views. Try
     `setRole('super')`, `setRole('admin')` from the console; try navigating
     directly to admin view ids; check whether admin nodes exist in the DOM.
   · No dollar amount appears on ANY member-facing surface: receipts, artist
     pages, feed, discover, search, profiles. Scan rendered text for `$`.
   · The Community Pot is invisible to non-admins everywhere.
   · Artists in beta see plays/listeners, never earnings.
   · A member cannot edit another member's profile, page, or shows.
   Report the exact reproduction for anything that leaks.

5. DATA INTEGRITY — do names resolve everywhere, or do you see raw UUIDs,
   "guest-a1b2c3", "undefined", "null", "NaN", "Invalid Date", or empty states
   where content should be? Check the activity log, feed, receipts, admin roster
   and search results specifically.

6. EMPTY + ERROR STATES — a brand-new account with no plays, no follows, no
   posts. Every surface should explain itself rather than showing a blank box or
   a stuck "Loading…". Also test: offline, a slow network, and a deliberately
   bad deep link (e.g. #artist/does-not-exist, ?post=<bad-uuid>).

7. MOBILE — repeat the core flows at 375px. Check tap targets, that the mini
   player and bottom tabs don't cover content, horizontal overflow, and that
   modals are reachable and dismissible.

8. LINKS + MEDIA — every external link opens the right destination with
   rel="noopener". Ticket links go to the real event. Images load (no broken
   icons). Audio plays and the 30s stream counter behaves.

9. THINK ADVERSARIALLY — beyond checklists, hunt for what could actually hurt:
   · Race conditions between async loads and UI that depends on them
   · Anything destructive that runs before the thing it depends on resolves
   · State that persists when it shouldn't (stale role, stale filter, stale URL
     param overriding a user's navigation)
   · Actions that can be double-fired
   · Anything that shows money, someone else's data, or internal config to the
     wrong audience
   · Copy that promises something the product doesn't do

## How to report

Return a single table ordered by severity:

| Severity | Area | What happens | Exact repro steps | Suggested fix |

Severity: CRITICAL (data leak, money exposure, privilege escalation, blocks
signup/login), HIGH (feature broken for real users), MEDIUM (confusing or
degraded), LOW (cosmetic).

Then list, separately:
  · Anything you could NOT test and why
  · Anything that looks intentional but you'd argue against

Do not fix anything. Report only. Be specific — every finding needs steps I can
follow to see it myself.
```

---

## Notes for whoever runs it

- **Sign in first.** Admin surfaces are DOM-removed for non-admins by design; an unauthenticated run will report them "missing" and that's a false positive.
- **Beta mode is on.** Dollar figures are deliberately hidden from artists — that's the spec, not a bug.
- **Shows** currently contains one real event (Albuquerque, Aug 8). Its ticket link must resolve to the real HoldMyTicket page.
- **Simulated data exists** (beta members, plays, pot ledger). Rows flagged `is_simulated` are expected and are purgeable from Admin → Community Pot.
