# PHX — Five Questions, Answered
_2026-08-03. Research-backed; sources at the end of each section. Companion to `phx-algorithm-decisions.md`._

---

## 1. Shareable artist pages (the Instagram bio link)

**Verdict: ungate everything at launch, and fix the link previews first — they're broken right now.**

### The bug nobody has noticed yet
Social crawlers — Instagram, iMessage, X, Discord, WhatsApp, Slack — **do not run JavaScript**. PHX is a static HTML app that renders artist pages client-side, so when Murkemz puts `phx.app/a/murkemz` in his IG bio, the preview card is blank or generic. Your single most important distribution channel is leaking on every tap, silently.

**Fix — build-time page generation (recommended over edge functions):** at deploy, query Supabase for all artists and emit a real `/artist/<slug>/index.html` per artist with baked-in `og:title`, `og:description`, `og:image`, and `twitter:card=summary_large_image`. A Supabase webhook → Vercel Deploy Hook makes new artists automatic. At Phoenix scale (tens of artists, not thousands) this beats runtime injection: zero cold start, fully CDN-cached, trivially debuggable, and no `vercel.json` route ordering to get wrong.

Use the artist's real press photo as `og:image` — a face outperforms a generated card for click-through and costs nothing.

### Logged-out vs logged-in
Three states on the same URL:

| Visitor | What they get |
|---|---|
| **Logged out (from IG)** | Full artist page: bio, photo, **full track playback**, merch, upcoming shows. Soft prompt after ~3 tracks. |
| **Explorer (free account)** | Same, plus follow, save, the feed, and their play counting toward the artist's free-tier pot |
| **Native / Insider** | Full app experience, exclusive tracks unlocked, streams generating wallet payouts |

**Do not gate playback at launch.** The benchmark is Bandcamp: **3 full plays for logged-out visitors**, artist-configurable, and note both design choices — the limit is *generous* (a full listen, not a 30-second clip) and the *artist* controls it. But Bandcamp can afford friction because fans arrive already wanting Bandcamp. A visitor tapping Murkemz's bio has never heard of PHX and has about three seconds of patience. Any wall in front of the first play spends the artist's audience and returns nothing.

**Never gate merch.** That's revenue; a signup wall in front of a checkout button is pure loss.

Make the account *offer* something rather than tax them: not "sign up to continue" but "know when Murkemz plays next." Follow, save, show alerts.

Add JSON-LD `MusicGroup` schema while you're in there — free search surface.

*Sources: [Bandcamp streaming limits](https://get.bandcamp.help/en/articles/15263360-what-are-streaming-limits-on-bandcamp) · [Vercel OG image generation](https://vercel.com/docs/og-image-generation)*

---

## 2. Running a beta, then launching for real

**Verdict: don't build a "beta mode." Build an invite system and a founding-member flag — the same machinery becomes your permanent growth loop.**

A `beta_mode` boolean is a switch you eventually have to rip out, and every feature written against it accumulates debt. What you actually want is three durable things:

1. **`invite_codes` table** — code, issued_by, max_uses, uses, expires_at. Artists get unlimited-use codes (their code = their audience = their payout). Members get 3 each. This never gets deleted; it's how PHX grows forever.
2. **`profiles.founding_number`** — assigned sequentially on signup while a cap is open. "PHX Native #047" is permanent identity, not a beta artifact. The cap is a row in settings, not a code branch.
3. **A public/private toggle per surface** — signup open or invite-only, artist applications open or closed. One settings row, admin-controlled.

**The rollout, in three phases:**

| Phase | Signup | Pricing | Who |
|---|---|---|---|
| **Closed beta** (~60 days) | Invite code required | Free — "Founding Beta" | Artists + their day-ones, hand-onboarded. Target ~100–300 |
| **Founding launch** | Invite or waitlist | $9.99 Native / $19.99 Insider, **locked for life**, capped at 500/100 | The scene. The cap does the selling |
| **Public** | Open | $15 / $29 | Everyone. Founding members keep their rate forever |

Nothing about that requires a beta flag. You flip settings rows and the caps fill. And "founding member #47 at a price locked for life" is a better story than "we're out of beta" — it converts, and it never expires.

**One thing to add now:** a visible `BETA` chip in the app header, driven by that settings row. Sets expectations, forgives rough edges, and disappears with one toggle.

---

## 3. Merch — admin-managed, dropshipping

**Verdict: your instinct to keep it admin-managed is right, and Fourthwall has a product built for exactly that. Do not become the merchant of record.**

### Why not Printful direct (even though the API is better)
Printful/Printify are perfectly capable multi-store platforms — one account, many stores, `X-PF-Store-Id` header, account-level tokens. But with them **you are the merchant of record**, which means you personally own sales-tax nexus determination, registration, and remittance in every state you cross a threshold in, plus returns, chargebacks, and customer service. Printify states this outright. For a one-person pre-launch company, taking on 50-state nexus to save a few points of margin is a bad trade — it's an accountant, a filing calendar, and unbounded liability in exchange for money you aren't making yet.

### The actual answer: Fourthwall Partner Dashboard
Purpose-built for "agencies, managers, and service providers" running **multiple creator stores** — one place to see all managed shops, combined analytics and products, and the partner earns **commission on net sales** paid via Stripe Connect. That is a literal description of PHX.

**Fourthwall is merchant of record**, so they absorb: sales tax (Avalara, registered + remitted), chargebacks and disputes, customer service (~12hr replies, nights and weekends), and payment methods. Costs: $0/mo free, Pro $19/mo per shop, **0% on physical POD**, 2.9% + $0.30 processing. Base costs: Gildan tee $9.50, Bella+Canvas tee $11.75, Comfort Colors hoodie $26.95.

**Action order:**
1. Create Murkemz's Fourthwall shop (you run it — he never logs in).
2. **Then** apply for the Partner Dashboard — you need one live shop to qualify. Email support with the shop URL.
3. Meanwhile, multiple storefronts on one login already works today (same credentials, switch from the profile menu; each shop has its own Stripe Connect and its own $19 Pro).

**Where PHX's cut comes from:** partner commission from Fourthwall, not a Stripe fee you build. Skip Stripe Connect for merch entirely — keep it for tips, subscriptions, and ticketing, which PHX actually owns.

**Should artists self-serve later?** Yes, eventually — but you're right to hold. Admin-managed means every store meets a quality bar, which is the whole point of a curated scene platform. Open it when the setup is boring and repeatable, probably around artist #15.

*Sources: [Fourthwall Partner Dashboard](https://help.fourthwall.com/getting-started/setting-up-your-shop/go-further/partner-dashboard) · [multiple storefronts](https://help.fourthwall.com/getting-started/setting-up-your-shop/go-further/manage-multiple-storefronts-on-fourthwall) · [Fourthwall merchant of record](https://fourthwall.com/blog/what-is-a-merchant-of-record-a-deep-dive-into-sales-tax-management-for-creators) · [Printify MoR responsibilities](https://help.printify.com/hc/en-us/articles/37390535647889-What-am-I-responsible-for-as-the-Merchant-of-Record)*

### murkmerch.com
**Leave it. Link out. Revisit at artist #5.**

Pointing the apex domain at Vercel requires his GoDaddy credentials and — if he has email on that domain — **switching nameservers will break his email**. Asking your first artist for registrar access before you've sold him a shirt is the wrong opening move. Also note Vercel changed the mechanics: don't hardcode `76.76.21.21`, and CNAME targets are now project-unique (`d1d4….vercel-dns-017.com`), so most blog posts about this are wrong.

Free thing to do today: make murkmerch.com link **back** to his PHX artist page. Bidirectional, zero risk, starts the flywheel in the direction you want.

---

## 4. Monitoring — build in PHX, or use Lytbub HQ?

**Verdict: the thin middle path. PHX emits, Lytbub HQ watches. 2–4 days, no shared credentials.**

I had the Lytbub codebase investigated. Real finding: **the Ops Monitor is fully built and running in production**, despite `docs/ai-operations-monitor.md` still saying "DESIGN ONLY — not built" (that header is stale by six weeks; fix it before it misleads a future decision). What exists:

- `src/lib/ops/rules.ts` — 839 lines, **27 deterministic rules** across 8 departments, zero LLM in the detection path ("a sweep costs $0 in tokens and can never hallucinate a problem")
- `runOpsSweep()` with open/refresh/reopen/auto-resolve reconciliation against an `ops_flags` table
- **Four live Vercel crons**, including `/api/cron/uptime` every 30 min that already HTTP-probes external client sites and opens `site_down` flags
- Morning digest email, an `/app/ops` operator UI, a public status page, Sentry wired through a canonical `reportFailure` escalation path
- A **real Claude tool-calling agent** (Elby) with 24 tools including `get_ops_flags`, `get_dashboard_summary`, `get_agent_performance`

What's *not* built: the `lytbub-os-vision.md` agent org-chart (no Inngest, Langfuse, Mastra, or MCP dependencies exist), and the MCP server route.

**Why the middle path wins.** Extending HQ to query PHX's database directly (option b) means HQ holds PHX's **service-role key**, which bypasses all RLS — inside an app that already holds live Stripe keys and runs an LLM with a 24-tool loop calling `createAdminClient()`. A prompt-injection or tool bug becomes a PHX user-data incident. It also couples deploys: a PHX migration would require an HQ deploy, and a renamed column makes a rule silently return "all clear."

**Instead:**
- **PHX pushes events** → HQ's `POST /api/site-event` **already accepts** arbitrary `{event_type, client_identifier, title, payload}` authenticated by an `lhq_` bearer token. PHX can emit `phx.upload_failed`, `phx.playback_error`, `phx.heartbeat` **today with zero HQ code changes** — just mint a token at `/app/settings/tokens`.
- **PHX exposes one read-only `/metrics` endpoint** (Supabase edge function): DAU, plays/24h, upload success rate, error counts, storage bytes, last-write timestamp. HQ adds a `cron/phx-metrics` route — a near-copy of the existing uptime cron — plus threshold rules and a `phx` department.

Trust boundary is a revocable scoped token, not a database key. Failures are loud (missing key → flag), not silent. And Elby can answer "how's PHX doing" from the same tools.

**Free thing right now:** add PHX's production URL to a `clients` row and the existing uptime cron monitors it every 30 minutes with zero code.

**Two prerequisites in HQ, ~1–2 days:** there's no "Needs attention" panel on the dashboard, and **snooze doesn't work** — `ops_flags.status` supports `snoozed` and the UI renders the pill, but nothing ever writes it. Adding PHX flags to a board with no snooze means one chronic condition sits there forever and trains you to ignore the page.

---

## 5. "Top-tier ecom" product views — is it fluff?

**Verdict: mostly yes, but you're right that presentation matters. The winning version is cheaper *and* more on-brand than the technically impressive one.**

### Virtual try-on: skip it, and here's the specific reason
The tech is real. FASHN v1.6 is $0.075/generation, Kling $0.07, cheapest cleared option $0.04. But three things kill it for you:

1. **The open-source models are legally unusable.** IDM-VTON, OOTDiffusion, StableVITON, CatVTON are all CC BY-NC-SA or research-only. The "self-host it for 2.4¢" path is closed; you must pay for a cleared model.
2. **The documented failure mode is hallucinated text on printed graphics.** Band merch is *nothing but* text and graphics. A blank tee renders beautifully; a hoodie that says MURKEMZ renders with a garbled logo. You'd be paying to show fans a misspelled version of the artist's name on their own body — that's brand damage on the one asset he cares most about.
3. **The evidence base is hollow.** I could not find a single peer-reviewed RCT or independent A/B test of try-on on conversion. Every circulating number ("40% fewer returns," "94% lift") traces to vendor blogs citing each other. Meanwhile **Google shut down Doppl on April 30, 2026**, less than a year after launch — a standalone try-on destination couldn't sustain itself with Google's distribution.

Also: POD returns are structurally low (made-to-order, restrictive return policies, and fan merch is an identity purchase, not a wardrobe purchase). Your baseline will be far under the 19.3% online-apparel return rate before you do anything. There's little to win.

**Free consolation prize:** Google auto-enrolls merchants with a shopping feed into clothing virtual try-on. If you ever push a product feed to Merchant Center, you get try-on as a side effect, on Google's surface, for $0 engineering.

### Size recommendation: skip
3DLOOK, True Fit, Bold Metrics are enterprise sales motions (3DLOOK publishes no pricing at all — "Book a Demo"), priced for thousands of SKUs with inconsistent grading. Your catalog is ~5 SKUs of Bella+Canvas 3001 and Gildan 18500 — decades-old blanks with published measurements. One sentence does the whole job:

> *Murkemz is 6'1", wearing a Large. Runs true to size — size up for oversized.*

### 360° spin and 3D/AR: skip
The famous "3D/AR converts 94% better" is **a 2020 Shopify tweet** comparing users who *tapped* AR against products without it — self-selection, never published as an experiment, still recycled six years later as though causal. The "360° lifts 47%" figure comes from a 360-photography vendor, phrased "up to," attributed to unnamed Gartner analysts. Real costs are concrete: 360 spin $35–90/SKU, AR-ready assets $200–600/SKU. At 5 SKUs that's $1,000–3,000 chasing a tweet — and a t-shirt is the flattest, floppiest object in the category where spin adds least.

### ✅ What to actually build, ranked by evidence

| Rank | Thing | Evidence | Cost |
|---|---|---|---|
| **1** | **Real photos of Murkemz wearing the merch** | Baymard: human-model images are a documented deficiency on 23% of apparel sites | ~$0 — a phone, good light, an afternoon |
| **2** | **Fit context line** (height + size worn) | Baymard: **42% of users judge size from images** | ~$0 |
| **3** | **Fan/UGC photos** | Baymard: 63% navigation gap; users treat these as objective proof | Low — a repost pipeline |
| **4** | Multiple angles + real zoom | Product-page baseline | ~$0 |
| **5** | Short video of the artist in it | Reuse IG content | Low |

**And one genuinely worthwhile use of the AI:** not customer try-on, but **product-to-model generation for your catalog** — same underlying tech, run once at admin time to turn flat mockups into on-model photography. ~20 images at 1–5 credits each, **under $10 total, one time**, and *you* review every output before publishing, so the logo-hallucination problem becomes a retry instead of a customer-facing defect.

**The strategic point:** every POD store on earth has identical Printful mockups. Nobody else has photos of Phoenix artists in Phoenix. A slightly imperfect shot of Murkemz in his own hoodie on a Phoenix street beats a flawless ghost-mannequin render, because the purchase is parasocial — the fan is buying proximity to the artist. A generic mockup signals "dropshipped," which is exactly the perception a local-artist platform can't afford.

*Sources: [fal VTO pricing](https://fal.ai/learn/tools/best-virtual-try-on-apis-2026) · [FASHN API pricing](https://help.fashn.ai/plans-and-pricing/api-pricing) · [open-source VTON licensing](https://fashiolabs.com/blog/open-source-virtual-try-on-compared) · [Google Doppl shutdown](https://support.google.com/labs/answer/16537062?hl=en) · [Google Merchant Center try-on](https://support.google.com/merchants/answer/14096369?hl=en-GB) · [Baymard product page UX](https://baymard.com/blog/current-state-ecommerce-product-page-ux) · [NRF 2025 returns](https://nrf.com/media-center/press-releases/consumers-expected-to-return-nearly-850-billion-in-merchandise-in-2025) · [the 2020 Shopify AR tweet](https://x.com/Shopify/status/1306973590814949376)*

---

## What I'd do next, in order

1. **Per-artist OG meta tags** (build-time generation + deploy hook) — your IG link previews are broken today
2. **Murkemz's Fourthwall shop**, then apply for the Partner Dashboard
3. **Shoot real photos** of him in the merch, add the fit line
4. **Merch UI** reading `merch_mode` (link-out or headless Fourthwall)
5. **PHX → HQ event push** (0.5 day, zero HQ changes) + add PHX's URL to a `clients` row for free uptime monitoring
6. **Wire the client to the Stage 0 ranking** (impression logging + `get_ranked_tracks`) — the database side is already live
