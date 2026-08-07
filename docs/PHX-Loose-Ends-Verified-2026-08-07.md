# PHX — Verified Loose Ends & Improvements
**Generated 2026-08-07** from a live read of the repo (95 migrations, 91 functions, 47 tables), `app.html` (9,101 lines), all 21 docs, both git repos, and the running Supabase project `dnzvtathfpjelffjnqrc`.

This supersedes the status portion of `PHX-Master-Status-and-Loose-Ends.md`. That doc was largely right about *shape* but wrong on several specifics — corrections are in §0. Every claim below was verified against source or the live DB; where something couldn't be verified, it says so.

---

## §0. Corrections to the existing master doc

Fix these in the old doc so you don't spend a week on the wrong thing.

| Old claim | Verdict | Reality |
|---|---|---|
| "Identity migration ~60% done — `my_receipt`, `create_page`, `toggle_follow`, `toggle_track_like`, `tag_product_in_post`, `submit_report`, `accept_terms`, onboarding helpers still trust app-supplied ID" | **Mostly wrong** | `_effective_user(p_claimed)` **ignores its argument entirely** (`IF auth.uid() IS NOT NULL THEN RETURN auth.uid(); END IF; RETURN NULL;`). All nine of those functions call it and use only its return value. They are already session-bound. `my_receipt` is **not** a data leak. |
| "`record_stream` is one of nine" | **Right, and it's the only one** | `record_stream` is genuinely exploitable: `v_identity := coalesce(auth.uid(), p_user_id)`. For an anon caller the client-supplied UUID is trusted outright. This is the *entire* remaining identity job, not 60% of a sweep. |
| "`grant_access_on_redeem()` is orphaned" | **Renamed, still orphaned** | No function by that name exists. Successor `grant_access(p_user_id)` exists, is orphaned (nothing calls it), and is already locked to `postgres`/`service_role`. Harmless. The security advisor still lists the old name — that's a stale lint cache, not a real object. |
| "OG pages emit the old `phx-app.vercel.app` domain" | **Already fixed** | Zero occurrences of `phx-app.vercel.app` in any source file. `build-artist-pages.mjs:43` defaults to `https://thephx.app`. |
| "Push pipeline may be dormant" | **Half right, and the real problem is different** | The send path is *live* — trigger `trg_notify_push` on `notifications` fires `net.http_post` to the `send-push` edge function. It's inert only because `push_subscriptions` has 0 rows. But that table has a critical RLS hole — see §1.1. |
| "32 silent catch blocks" | **Undercount** | 36 empty `catch` blocks + 4 no-op `.catch(function(){})`. `console.error` count: **0**. `console.log`: **0**. |
| "Simulated numbers may leak to public surfaces" | **Verified clean** | `tracks.stream_count` tracks real events exactly (e.g. "After Midnight": `stream_count`=8, 89 events, 81 simulated → 8 real). Simulation does **not** inflate public counts. Good news; stop worrying about this one. |
| "~90 migrations" | Confirmed | 95. |
| "Bootstrap closed, 1 super" | Confirmed | `member: 1, super: 1`. |
| "Duplicate migration numbering 029–058" | Confirmed, worse | Every number **029 through 051 appears twice**; `037` appears three times. 23 duplicated numbers, not two endpoints. |

---

## §1. New — security holes nobody has looked at

### 1.1 🔴 `push_subscriptions` is world-readable and world-writable
Verified live:

```
push_subs_select | SELECT | roles={public} | using = true
push_subs_insert | INSERT | roles={public} | with_check = true
```

Any unauthenticated caller can `GET /rest/v1/push_subscriptions` and read **every row**: `user_id`, `endpoint`, `p256dh`, `auth_key`. Those four fields are a complete web-push credential set — enough to send arbitrary push notifications directly to a user's browser, bypassing your app entirely. It's also a `user_id` → device-endpoint map, i.e. deanonymization. Insert is equally open (subscription stuffing → DoS on the `notify_push` → `send-push` pipeline).

It's harmless *today* only because the table has 0 rows. The moment one real user subscribes, this is live. **Fix before you ship push, not after.**

### 1.2 🔴 Plaintext shared secret hardcoded in a SQL function body
`notify_push()` contains:

```sql
body := jsonb_build_object('secret', 'e46ac85c…', …)
```

`pg_get_functiondef` is readable by any role that can query the catalog. `supabase_vault 0.3.1` is already installed — move it there. Rotate the secret after moving it, since it's been sitting in `prosrc` (and now, briefly, in this session).

### 1.3 🟠 GitHub OAuth token in cleartext, reused across both repos
`phx/.git/config` and `plug-city/.git/config` both embed the **same** `gho_…` token in their `origin` URLs. Not committed (git config is local), but it's plaintext on disk and one leak compromises both repos. Revoke it, switch to SSH or a credential helper.

### 1.4 🟠 `record_stream` spoofing — the real payout-integrity hole
`coalesce(auth.uid(), p_user_id)` means an anon POST can attribute streams to any profile UUID. Streams feed the wallet. The 60/hr and 1000/mo caps are keyed off the *spoofed* id, so they don't help. This is the one thing in §0 the old doc got right, and it's the single most important fix before money moves.

### 1.5 🟠 `user_events` accepts anything from anyone
`user_events_insert` has `with_check = true`. Anyone can inject arbitrary `user_id` / `event_type` / `metadata`. Read is correctly admin-gated, so it's not a leak — but your analytics table (523 rows) can be poisoned by a script, and analytics is what the admin surface is supposed to be built on.

### 1.6 🟡 `claim_username` device hijack
No check that the caller controls `p_device_id`. Any anon caller can pass an arbitrary device UUID and overwrite that device's `username` / `display_name`. Low impact while device-era identity is being retired, but it's free to fix.

### 1.7 🟡 Two `SECURITY DEFINER` views (advisor: ERROR)
`platform_public_settings` and `public_profiles` execute with the creator's privileges, bypassing caller RLS. Audit their column lists — anything in there is effectively public.

### 1.8 🟡 69 SECURITY DEFINER functions granted EXECUTE to `anon`
Includes `admin_remove_account`, `admin_reports`, `review_access_request`, `fund_pot`, `set_simulation_mode`, `purge_simulation`. All of them *do* call `require_admin()` internally, so none is exploitable now that bootstrap is closed — but that's defence-in-depth-of-one. A smaller set (`approve_track`, `set_user_role`, `run_monthly_payout_guarded`…) is correctly scoped to `authenticated` only, so the pattern exists; it just wasn't applied uniformly. Revoke `anon` EXECUTE on everything members-only.

### 1.9 🟡 No security headers at all
`vercel.json` sets only `Content-Type` and `Cache-Control`. Missing: CSP, X-Frame-Options, HSTS, Referrer-Policy, X-Content-Type-Options, Permissions-Policy. Cheapest win on this whole list.

### 1.10 🟡 45 functions with mutable `search_path`
Includes `fund_pot`, `run_monthly_payout`, `purge_simulation`, `admin_remove_account`. Add `SET search_path` to each.

Also: leaked-password protection (HaveIBeenPwned) is off in Auth. One toggle.

---

## §2. New — code problems

### 2.1 🔴 `approveTrack` / `rejectTrack` are each defined twice
- Dead copies: `app.html:5636-5654` and `5655-5673` — direct `_sb.from('tracks').update(…)` writes.
- Live copies: `app.html:7314-7321` and `7322-7328` — RPC `approve_track` / `reject_track`.

Later declaration wins; 37 lines of plausible-looking moderation code never runs. Edit the wrong one and your change silently does nothing. Delete the first pair.

### 2.2 🔴 Zero error visibility
36 empty catches, 4 no-op promise catches, **0 `console.error`**, 0 error-tracking integration. Failures in production are literally invisible — and the planned ops digest cannot report what it cannot see. Empty-catch lines: 2196, 2871, 3168, 3621, 3959, 4859, 5987, 5990, 5992, 6053, 6196, 6382, 6528, 6540, 6685, 6738, 6767, 6794, 6801, 6810, 6820, 6825, 6834, 6839, 6841, 6889, 6897, 7109, 7774, 7987, 8416, 8938 (+ 2772, 3017, 4075, 7146).

### 2.3 🟠 Vanity URLs never serve the crawlable OG page
`vercel.json:4-9` rewrites `/:slug` → `/app`. The generated OG pages live at `/a/<slug>`. So `thephx.app/murkemz` — the link format the app itself tells people to share (`app.html:8919`) — returns the JS shell to crawlers, which don't run JS. **Instagram/iMessage previews on the pretty link are still broken.** The build script is fine; the routing is the bug. Add a rewrite: `/:slug` → `/a/:slug` when a generated page exists, or generate at the root path instead.

### 2.4 🟠 Dead UI beyond the two known buttons
Confirmed dead (`coming soon` or no handler at all):
- `1553` Save Changes — coming soon, `1562` Save Links — coming soon *(the known pair — artists still can't edit their own profile)*
- `986` Add to queue · `995` Shuffle · `1001` Repeat — **player controls that do nothing**
- `1222-1223` Apple Wallet / Google Wallet buttons
- `1248` Receipt "History"
- `1935-1937` Admin Danger Zone: Force Payout Recalculation, Export Member CSV, Maintenance Mode — all three dead
- `1925-1930` Admin "Platform Health" panel: hardcoded `● Healthy / ● online / ● live` with no underlying check. It's decoration pretending to be monitoring.

Not dead (don't touch): the 5 "Notify Me When Live" buttons are wired at `9078-9097` and write to `notify_interest`.

Dead functions with zero call sites: `getDeviceId()` (2558), `loadArtistMerch()` (6312), `apMerchFilter()` (8781).

### 2.5 🟡 Accessibility
38 `<label class="form-label">` elements, **1** `for=` attribute in the whole file. 51 of 63 inputs already have `id`s, so this is pure wiring. 21 icon-only buttons with no accessible name (✕, 🔔, ▶, 💬, ↗, ↻). 1 `<img>` missing `alt` (3748). `lang` and viewport are correct everywhere.

### 2.6 🟡 Load performance
~10 Supabase round-trips fire at parse time (`3171-3177`), not on `DOMContentLoaded`. Two render-blocking CDN scripts in `<head>` with no `defer` (`21-22`), one pinned only to `@2` major. ~358KB of unminified inline JS (67% of the file) that can't be cached separately from the HTML shell. Only 8 of ~28 dynamic `<img>` sites use `loading="lazy"`. Notably, list hydration *is* correctly batched with `.in()` — no N+1 pattern found. The initial fan-out is the cost centre.

### 2.7 🟡 SW cache versioning is a manual footgun
Navigation is network-first (correct — no stale-shell trap). But static assets are cache-first keyed on `?v=4`, which must be bumped in **both** `app.html:693,9099` and `sw.js:12-13`. In sync today. Ship a `shared.js` change without bumping and installed PWA users get the stale file forever. Also `sw.js:82-83` hardcodes push icons to `murkmerch.com`'s Shopify CDN with no fallback.

### 2.8 🟡 Admin is ~11% of `app.html`
~1,041 of 9,101 lines / ~67.6KB of 533KB (floor estimate — excludes admin CSS and admin logic inside shared functions). HTML views: `1593-1940`. JS: 3076-3157, 5001-5076, 5319-5385, 5430-5482, 5502-5580, 5636-5680, 7314-7335, 7484-7690, 8986-9071.

### 2.9 🟡 Business constants scattered
`$15` at 1220/1298/1479/1882/5347/7521; `$29` at 1480/1887/7521; rate cap `$0.0075` at 1900; the literal string `'murkemz'` hardcoded 6× (1088, 5252, 5281, 7358, 7379, 7564). One config object.

---

## §3. New — the docs themselves are a loose end

### 3.1 🔴 Seven planning docs exist only on this Mac
`git status` in `phx/` shows these as **untracked, never committed**:

```
docs/PHX-Admin-and-Analytics-Spec.md
docs/PHX-Cleanup-and-Docs-Plan.md
docs/PHX-Event-Ingestion-Agent.md
docs/PHX-Identity-Migration-Scope.md
docs/PHX-Master-Status-and-Loose-Ends.md
docs/PHX-Operations-SOP.md
docs/PHX-Ownership-and-Partnership-Framework.md
```

Every one of them is strategy you paid real thinking time for, and a disk failure erases all of it. Commit them today. (If you'd rather the ownership/security ones stay out of GitHub, put them in a private notes repo — but not nowhere.)

### 3.2 🟠 README contradicts itself four times
The Feature Status table lists each of these as **both** ✅ Live **and** 🔲 Planned/Roadmap: Supabase Auth, Push notifications, Recommendation engine, Reels. Also `## Database Schema (13 tables)` — the exact stale number the July audit flagged — with 14 rows under it and 47 real tables. Migration table stops at #041; reality is 95.

### 3.3 🔴 The payout split contradicts itself — this one is a promise to artists
- README "Roles & Access": *"$12 of their $15 goes to artists"* and *"$23.20 to artists"* for Insider.
- README "Royalty Model", ~70 lines later: *"50% platform ($7.50) / 50% artist wallet ($7.50)"*.
- Launch Strategy: *"PHX routes $7.50–$14.50"* — agrees with the 50/50 model.
- README's own simulation note (`2 subs ($30) → $15 platform, $1.51 streamed, $13.49 pot`) also agrees with 50/50.

So $12/$23.20 is stale pre-wallet-model copy, contradicted three ways. **Fix it before an artist reads it and quotes it back to you.**

### 3.4 🟠 Four different canonical domains asserted as settled
`thephx.app` (README, Ops SOP) · `phx-app.vercel.app` (July audit) · `phx.app` (Design Prompt, open-questions doc) · `phx.app / getphx.com / whatever's cleared` (Beta Build Plan, same date as the SOP that calls it settled). Pick one, then grep-and-replace everywhere.

### 3.5 🟠 The "answered" doc doesn't answer the "open" doc
`phx-open-decisions.md` raises 4 founder-level questions. `phx-open-questions-answered.md` answers 5 **completely different** ones. The names imply a matched pair; they aren't. The only overlap is monitoring, and even there the two proposals (Bub-for-PHX digest→chat→actions vs. PHX→Lytbub-HQ event push) are **never reconciled with each other**. Rename one of these files.

### 3.6 🟡 No changelog for migrations 034–095
The only changelog stops at 033. Sixty-plus migrations of decisions with no recorded rationale.

---

## §4. Forgotten planning — designed once, never mentioned again

Ranked by how much work is sitting idle.

1. **Event Ingestion Agent / Plug Map** — 7 tables, LLM extraction contract, 3-tier confidence gate, 8 named sources, full v1/v2/v3 build order. **Zero implementation trace, zero mention in any build plan.** The Beta Build Plan's 4-week sequence never references it. Launch Strategy name-drops "The Plug Map" as a differentiator with no link back to the spec.
2. **The separate admin surface** — 9 nav sections, 4-level analytics, 4-step build approach. The Beta Build Plan's entire 4-week sequence **assumes admin stays inside `app.html`**. The two plans have never been reconciled.
3. **Ownership & partnership paperwork** — the Beta Build Plan calls it *"the gate before real money flows,"* *"before launch, not after."* No later doc mentions entity formation, IP assignment, or a signed founders' agreement as done, pending, or even scheduled. Nothing has moved.
4. **The full redesign brief** (`PHX-Design-Prompt.md`) — 8 screens, a token system, rewritten hero copy. Nothing anywhere confirms it was ever run.
5. **QA-MASTER-PROMPT results** — the prompt exists to produce a findings table. No findings table exists.
6. **"Bub for PHX" ops monitoring** — digest → chat → guarded actions. Never mentioned again; a rival architecture was proposed in a different doc and neither won.
7. **Murkemz wallet-floor guarantee** (~$1K/mo for 6 months) — raised once in Launch Strategy Phase 0, never resolved yes/no, never surfaced in the Ownership framework where it belongs.
8. **Numbered physical membership card** (line-skip at partner venues, "the card is the merch") — a real differentiator, mentioned once.
9. **AI submission-policy clause** — exact contract language was drafted, never folded into the Artist Agreement checklist, which carries a *different* AI clause (no-AI-training). Two distinct asks, never merged.
10. **Fraud flag-queue** (>20h/day listening, single-artist accounts, many accounts per device fingerprint) — the caps shipped, the review queue didn't.
11. **Transcode / loudness-normalize / cover-art worker** — described in the Beta Build Plan narrative, then given no day allocation in the actual Week 1–4 sequence, unlike every other item.
12. **Waitlist page** — Launch Strategy Phase 0 requires it; the July audit confirms there's still no email capture on the landing page.
13. **Founding pricing** (Closed beta free → $9.99/$19.99 founding → $15/$29 public) — designed in detail, UI still shows flat $15/$29.
14. **13 tables built and never used**: `recommendations`, `member_credits`, `notify_interest`, `referrals`, `perk_redemptions`, `partner_perks`, `access_requests`, `merch_reviews`, `payout_settings`, `email_queue`, `page_inquiries`, `partner_businesses`, `track_likes`. Several are whole subsystems (referrals, partner perks, member credits). Decide: seed, keep, or drop.

### On the email pipeline (correcting the old doc)
`email_queue` **is** written to — `queue_email()` is called by `review_access_request()`. Nothing **drains** it: no trigger, no cron (`run_referral_rewards_logged` is the only cron job), no DB call to the `send-emails` edge function — which exists and is ACTIVE but is invoked by nothing. So it's half-built, not dormant: writes go in and die. One small drain job finishes it.

---

## §5. Decisions still owed

| # | Decision | Blocked on | Status |
|---|---|---|---|
| 1 | Payout weighting: per-stream vs. capped listen-time (`min(seconds, 240)`) | You | Recommended, never confirmed adopted. The algorithm doc adopts `expected_listen_secs` for *ranking* — the *payout* engine was never confirmed flipped. |
| 2 | Entity type (AZ LLC vs C-corp), equity split, Bryce Breeze's role comp | Attorney + CPA | Untouched |
| 3 | Canonical domain | You | 4 variants in circulation |
| 4 | Admin route: `admin.thephx.app` vs `/studio` | You | Posed in the spec, never settled |
| 5 | 1099-MISC threshold for streaming royalties ($10 Box 2 vs $2,000 services) | CPA | Flagged as "one CPA question," never asked |
| 6 | AI submission policy — reconcile the two separate AI clauses into one agreement | You | Two competing drafts |
| 7 | Monitoring architecture — Bub-for-PHX vs PHX→Lytbub-HQ push | You | Never compared |
| 8 | Murkemz wallet-floor guarantee — yes/no, and at what number | You + Murkemz | Raised once |
| 9 | Eventbrite / Dice ToS for event ingestion | Legal read | Flagged "verify terms," never verified |
| 10 | Email pipeline: finish the drain job or shelve it explicitly | You | Limbo |
| 11 | Backups / PITR — is it actually on? | Supabase dashboard | **Unverifiable from the API.** Check Settings → Database → Backups yourself. 16MB DB, ~6 weeks old, likely on a tier without PITR. |

---

## §6. Time-sensitive

**The Albuquerque show is tomorrow.** `shows` has exactly one row: *Lil Boosie — Live in Albuquerque (special guest Murkemz)*, Oasis Event Center, `starts_at = 2026-08-09 01:00 UTC` = **Sat Aug 8, 6:00 PM Phoenix**. Two things:

- `doors_at` is identical to `starts_at` (both 01:00 UTC). Doors are almost certainly earlier — either fix it or stop displaying it.
- The QA prompt says the ticket link must resolve to a real HoldMyTicket page. It's `tickets.holdmyticket.com/tickets/463915?tc=hmt`. **Click it before tomorrow** — a dead ticket link on the one real event in the app, on the night Murkemz is on stage, is the worst possible first impression.

Also external and dateable: the EU **Digital Fairness Act** draft is expected Q3/Q4 2026 and touches feed-ranking/profiling. Not urgent at Phoenix scale — worth a calendar note, not a workstream.

---

## §7. The pitch deck is repeating numbers your own audit called fabricated

`PlugCity_Pitch_Deck.pptx` (built once, 2026-06-09, never regenerated) asserts as present-day fact:

> "THE MATH — **847 Active Members Today**" · "847 members · **$9,189 MRR**" · "**$14,887** Total Monthly Revenue" · "**92%** Fan Retention" · "**27,256** monthly listeners"

Your own `PHX-Audit-2026-07-30.md` flags the identical "847" figure on the live site as fabricated (H1: *"Reality: 1 auth user, 3 artists, 5 tracks"*). Live DB today: **2 profiles, 1 super + 1 member**. If this deck goes to Murkemz, Bryce, Plug City, or anyone with money, it's presenting known-false numbers. Regenerate it with real figures + honest projections labeled as projections, or shelve it. `build_deck.py` makes the regeneration easy.

---

## §8. `plug-city/` — resolved, no action needed beyond a decision

Checked because it looked like a second client on the same database. **It isn't.** Zero Supabase URLs, zero JWTs, zero `fetch()` calls in any of its files — it's a fully static pitch/demo mockup with hardcoded fake numbers (`admin.html` shows "PHX Streams 15.5K", "$1,393" royalty tables). No backend, no shared-DB risk. The "PHX" text in it refers to Murkemz's *track* titled "PHX," not the app.

Status: branch `main`, clean, in sync, **last touched Jun 11 — two months dead** while `phx/` got ~20 commits. Its `vercel.json` has a leftover header rule for `/phx/manifest.json`, a path that doesn't exist there. No `.gitignore` at all.

Decision owed: is it still a live pitch asset or archive material? If it's still being shown to anyone, its fake dashboard numbers carry the same problem as §7.

---

## §9. Repo hygiene

- **Root repo is orphaned.** One commit (Jun 10), **no remote**, and its working tree shows all 9 tracked files as deleted — they were moved into `plug-city/`. `phx/` and `plug-city/` are nested git repos inside it with no submodule config, so root git silently ignores them. Either delete the root `.git` or convert to proper submodules. As-is it's a trap.
- **No CI, no tests, no `.github/` anywhere.** Every deploy edits a 533KB file and pushes straight to prod. Three runtime bugs have already shipped this way. A Vercel preview + a 10-line smoke checklist is the single biggest reliability win available and costs nothing.
- `phx/.git` is **7.2MB**, driven by ~10 full-file copies of `app.html` at 450–535KB each. Every commit adds ~500KB. Not dangerous yet; another argument for splitting the file.
- `phx/.gitignore` is clean — the literal-`\n` bug from the July audit is fixed.
- **`.claude/settings.local.json` at root contains a standing `apply_migration` grant** for an unrelated project's Supabase MCP (UUID-named) plus permissions for a different client ("Meridian Management Group"). Prune it — worst case a future session applies migrations to the wrong production database without prompting.
- `_to_delete/` holds three 0-byte git lock files. Safe to remove, confirmed unreferenced.
- `ml/train_lightfm.py` — intentionally parked until ~1 month of data. Not dead. Leave it.
- `a/` generated pages are stale locally (Aug 4) vs latest commit (Aug 6), but Vercel regenerates on every build, so this self-heals. Local-testing gotcha only.
- `VAPID_PRIVATE_KEY` and `PUSH_INTERNAL_SECRET` in `.env.local`: correctly gitignored, **never committed** (verified via `git log --all --full-history`). But your own docs flag both as unrotated. Rotate them along with §1.2.

---

## §10. What to actually do, in order

**This weekend (small, high-value, mostly not code):**
1. Click the HoldMyTicket link; fix `doors_at`. *(§6 — tomorrow)*
2. `git add docs/ && git commit` the seven untracked planning docs. *(§3.1)*
3. Revoke the `gho_` GitHub token, switch to SSH. *(§1.3)*
4. Fix the `$12 / $23.20` payout numbers in README. *(§3.3)*
5. Check Supabase → Settings → Database → Backups. Answer the PITR question. *(§5.11)*
6. Prune the stray MCP grant from `.claude/settings.local.json`. *(§9)*

**Security pass — one branch, before any billing:**
7. `record_stream` → drop the `coalesce`, require `auth.uid()`. *(§1.4)*
8. `push_subscriptions` RLS → owner-scoped select/insert + a delete policy. *(§1.1)*
9. `notify_push` secret → Vault, then rotate. Rotate VAPID + `PUSH_INTERNAL_SECRET` too. *(§1.2)*
10. `user_events` insert → `with_check (auth.uid() = user_id)`. *(§1.5)*
11. Revoke `anon` EXECUTE on members-only functions; add `SET search_path` to the 45. *(§1.8, §1.10)*
12. Audit the two SECURITY DEFINER views' columns. *(§1.7)*
13. Add security headers to `vercel.json`; turn on leaked-password protection. *(§1.9)*

**Reliability — the thing that makes everything after this cheaper:**
14. Vercel preview + written smoke checklist, in the SOP. Stop pushing to prod. *(§9)*
15. `reportFailure()` helper; replace all 36 empty catches. *(§2.2)*
16. Delete the dead `approveTrack`/`rejectTrack` pair before someone edits it. *(§2.1)*

**Then the product loose ends:**
17. Fix the `/:slug` rewrite so vanity links serve OG pages. *(§2.3)* — this one directly affects marketing reach.
18. Artist profile editor: build it or remove the buttons. Same for the 8 other dead controls and the fake Platform Health panel. *(§2.4)*
19. Email pipeline: write the drain job or shelve it in writing. *(§4)*
20. Split admin out of `app.html` — reconcile the Admin spec against the Beta Build Plan first, since they currently disagree. *(§4.2, §2.8)*
21. Honest README rewrite: Live / Simulated / Planned, one row per feature, real counts. *(§3.2)*

**Parallel, not code:**
22. Ownership paperwork with an attorney. It's the stated gate before money moves and it hasn't started. *(§4.3)*
23. Ask the CPA the 1099 question. *(§5.5)*
24. Decide the domain, then grep-and-replace. *(§3.4)*
25. Regenerate or shelve the pitch deck. *(§7)*

Items 7–16 are what turn "impressive beta" into "safe to charge a card." Items 1–6 take an evening.
