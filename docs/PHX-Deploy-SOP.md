# PHX — Deploy SOP

The safety net. Three prod bugs shipped by editing a 543KB file and pushing to `main`;
this exists so that stops.

## The rule

**Nothing reaches `main` without a preview and a green check.** Not "usually." Not
"unless it's a small change." The three bugs that shipped were all small changes.

## Setup (once)

1. **Add the workflows** — `.github/workflows/ci.yml` and `smoke.yml` are in this package.
   `ci.yml` runs static checks on every PR. `smoke.yml` fires when Vercel finishes a
   deploy and tests the real URL. Neither needs a Vercel token.

2. **Protect `main`** — GitHub → Settings → Branches → Add rule for `main`:
   - Require a pull request before merging
   - Require status checks to pass → select **Static checks**
   - (Leave "require approvals" off — you're solo; the check is the reviewer.)

3. **Install Playwright locally** so you can smoke-test without waiting on CI:
   ```
   npm i -D playwright && npx playwright install chromium
   ```

4. **Baseline it** — run the smoke against production once, today, so you know what
   green looks like before you change anything:
   ```
   BASE_URL=https://thephx.app node scripts/smoke.mjs
   ```

## Every change

```bash
git checkout -b fix/whatever
# ... edit ...
node scripts/check-app.mjs          # 2 seconds, catches the dumb stuff
git commit && git push -u origin HEAD
gh pr create --fill
```

Vercel comments a preview URL on the PR. Then:

```bash
BASE_URL=<preview-url> node scripts/smoke.mjs
```

Green + green → merge. Then re-run the smoke against production once it's live.

## What the automated checks cover

`check-app.mjs` — inline JS parses · no `onclick` calling an undefined function ·
no duplicate top-level declarations · `getElementById` targets exist ·
`shared.css?v=` matches between `app.html` and `sw.js` · no committed secrets ·
no new silent `catch {}`.

`smoke.mjs` — landing page 200 + no console errors · `/app` renders (not blank) ·
vanity URL serves OG tags to a crawler UA · security headers present ·
service worker registers · no horizontal scroll at 390px ·
`push_subscriptions` not anon-readable.

## What they don't cover — check these by hand

Automation can't tell you a thing looks wrong. Before merging anything that touches
the app shell, on a **real phone**, signed in:

- [ ] Sign out and back in — no blank screen
- [ ] City Feed loads and shows posts
- [ ] Play a track; mini-player works; expand to full-screen player
- [ ] My Pass / Receipt renders with real numbers
- [ ] A public artist page loads
- [ ] Every admin view opens
- [ ] Console is clean after all of the above

Seven items, about three minutes. That's the whole cost of never shipping a blank
screen again.

## When you're about to skip this

You will, eventually — a one-line fix at midnight. The three bugs that shipped
were all one-line fixes. Run `node scripts/check-app.mjs` at minimum; it takes
two seconds and catches the exact class of bug that has bitten this repo.
