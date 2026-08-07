# PHX — Homepage Build Prompt (for Claude Code)

Two prompts. **Prompt 1** ships the new landing page. **Prompt 2** carries the design system inward to `app.html` — run it only after Prompt 1 is merged and verified.

Both assume the prototype folder (`index.html`, `src/hero.js`, `assets/`) has been copied into `phx/`.

---

## Prompt 1 — Ship the landing page

> You are working in the PHX repo (`phx/`), a vanilla-JS, no-build-step web app deployed on Vercel. There is no framework and no bundler in the deploy path — keep it that way.
>
> A redesigned landing page has been prototyped and is in the repo already: `index.html` (new), `src/hero.js` (the WebGL source), `assets/phx-hero.js` (the bundled output), `assets/phoenix-mark.png`, `assets/phoenix-sample.png`, `assets/og-cover.jpg`, and `assets/fonts/*.woff2`. Your job is to land it safely, not to redesign it.
>
> **Do this in a branch, deploy to a Vercel preview, and do not merge until the smoke checklist passes.** Three runtime bugs have already shipped to production from this repo by pushing straight to `main` — that is exactly what this process exists to stop.
>
> ### 1. Preserve what the old landing page did
> Before replacing `index.html`, read the current one and inventory every piece of behaviour it has: the Supabase client init, the anon key and project URL, any waitlist or email-capture handler, any analytics or event call, every outbound link, and every element ID that other code touches. Write that inventory into the PR description. Then port each item into the new page. **The new page must not silently drop a working feature** — if something in the old page has no home in the new design, say so explicitly rather than deleting it quietly.
>
> ### 2. Wire the real numbers
> The prototype hardcodes `CLAIMED = 47` and `GOAL = 500` in `src/hero.js`. Replace the constant with a real read of the founding-member count from Supabase, with the hardcoded value as the fallback if the call fails. Do not let a failed fetch render `0/500` — that reads as "nobody signed up." Same treatment for the artist roster: the prototype hardcodes Murkemz and Jaye Mali; load the live roster and keep the hardcoded pair as fallback.
>
> ### 3. Fix the vanity-URL routing while you're in here
> `vercel.json` currently rewrites `/:slug` → `/app`, which means the generated OG pages at `/a/<slug>` are never served to crawlers, and every shared `thephx.app/murkemz` link produces a blank preview. Add a rewrite so that a single-segment path matching a known artist slug serves `/a/:slug` instead, with `/app` remaining the catch-all for everything else. Verify with `curl -A "facebookexternalhit/1.1" https://<preview>/murkemz` and confirm real `og:title` and `og:image` tags come back — not the SPA shell.
>
> ### 4. Add the security headers
> `vercel.json` currently sets only `Content-Type` and `Cache-Control`. Add `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: geolocation=(), microphone=(), camera=()`, and `Strict-Transport-Security: max-age=31536000; includeSubDomains`. Add a Content-Security-Policy in **report-only mode first** — the page uses inline styles and a module script, so an enforcing CSP will break it if you guess the directives. Ship report-only, read the reports, then enforce.
>
> ### 5. Rebuilding the WebGL bundle
> `assets/phx-hero.js` is generated from `src/hero.js`. If you change the source, regenerate with:
> ```
> npx esbuild src/hero.js --bundle --format=esm --minify --target=es2020 --outfile=assets/phx-hero.js
> ```
> This runs on your machine, not in Vercel's build — the deployed artifact is the committed file. Commit both the source and the bundle together, always. A source change without a rebuilt bundle is a silent no-op and will confuse whoever looks next.
>
> ### 6. Do not break these
> - `prefers-reduced-motion` must keep bypassing WebGL entirely and showing the static mark.
> - The adaptive-quality guard in `src/hero.js` (it sheds particles when measured FPS is low) must stay.
> - Mobile must stay at the reduced particle count. Do not raise it "because it looks better on my laptop."
> - Every video slot must keep its poster frame, so an unfilled or failed slot never renders as an empty box.
>
> ### 7. Smoke checklist — all must pass on the preview before merge
> 1. Desktop: hero phoenix assembles within ~3s, scroll morphs cleanly through city → receipt, no stutter.
> 2. iPhone (real device, not the simulator): all three beats render, page scrolls at full rate, phone doesn't get hot.
> 3. Reduced motion on: no canvas, static mark shows, all content readable.
> 4. Zero console errors on load and after a full scroll to the footer.
> 5. Every nav link, CTA, and footer link resolves — no 404s.
> 6. Founding counter shows a real number.
> 7. Crawler check on the vanity URL returns real OG tags.
> 8. Lighthouse on mobile: performance ≥ 70, accessibility ≥ 95.
>
> Report what you changed, what you had to compromise on, and anything from the old page you could not port.

---

## Prompt 2 — Carry the system into the app

Run this **only after Prompt 1 is merged and live.** This is where the risk is, because `app.html` is a 533KB single file with live Supabase wiring.

> You are restyling the `home` (City Feed) view inside `phx/app.html` to match the new landing page. This is a **reskin, not a rewrite.** `app.html` is one 533KB file with no tests, and it holds all the app's live Supabase wiring.
>
> ### Hard constraints — violating any of these breaks production
> - **Do not rename or remove any element ID, class used by JS, `data-view` attribute, or `onclick` handler.** Add classes; never swap them out.
> - Do not touch any `_sb.` / RPC call, any auth logic, or any role-gating code.
> - Do not add a framework, a build step, or a bundler.
> - Work in a branch. Preview. Smoke-test. Then merge.
>
> ### 1. Extract the token block
> The new `index.html` opens with a `:root{}` block of design tokens under the comment `PHX DESIGN TOKENS`. Move that block verbatim into `shared.css`, then delete it from `index.html` and have both pages load `shared.css`. Single source of truth from here on.
>
> Bump the cache-busting query string in **both** places it appears — `app.html` (the `shared.css?v=` and `shared.js?v=` tags) **and** the `SHELL` array in `sw.js`. The service worker is cache-first on static assets keyed by that exact URL, so a bump in one place and not the other serves users a stale stylesheet indefinitely.
>
> ### 2. Restyle the home view against the tokens
> Replace hardcoded colours, spacing, radii, and font sizes in the `home` view with the token variables. Follow the landing page's rules: darkness carries the hierarchy, one accent colour per screen, spacing does the work instead of nested bordered boxes, and a maximum of two levels of surface elevation.
>
> ### 3. No WebGL in the app
> The particle system belongs to the landing page only. The app home gets the *visual language* — the palette, the type scale, the motion timings, the ember accent — not a 3D canvas. Members open this view many times a day; a persistent WebGL context is a battery cost with no payoff. If you want warmth in the app, use a static CSS gradient.
>
> ### 4. While you're in the file — two things worth fixing
> - `approveTrack` and `rejectTrack` are each **defined twice** (dead copies around lines 5636–5673, live RPC copies around 7314–7328). JS takes the later declaration, so the first pair never runs. Delete the dead pair.
> - The artist profile editor has two dead buttons: `Save Changes — coming soon` (~line 1553) and `Save Links — coming soon` (~line 1562). Either wire them to a real update RPC or remove the card. Artists cannot currently edit their own profile, which is a core missing feature — do not leave it in limbo a third time.
>
> ### 5. Smoke checklist before merge
> Sign in · City Feed renders · play a track · mini-player and full-screen player · My Pass / Receipt · a public artist page · every admin view · zero console errors · check at 390px and at desktop width · confirm the service worker picked up the new asset version (hard-reload, then check the cache name).
>
> Report every file you touched and every element ID you were tempted to rename but didn't.

---

## What I'd hold back

Two things worth *not* doing yet, so they don't quietly become the next round of forgotten planning:

**Don't fill all five video slots at once.** Ship with V1 and V2 only. A page with two matched plates reads more expensive than one with five that don't quite agree on colour — and you'll learn more from seeing one in place than from a folder of clips.

**Don't run Prompt 2 in the same week as Prompt 1.** The landing page is standalone and can't break the app. `app.html` can break everything. Let the landing page sit live for a few days first — partly to catch anything the smoke test missed, and partly because the security fixes from the audit should land before anyone starts rearranging that file.
