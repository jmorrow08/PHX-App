# PHX — Redesign Prompt for Claude

> STATUS: historical one-shot prompt — kept for reference
*Paste everything below the line into a fresh Claude session (ideally with the phx folder connected so it can see app.html, index.html, shared.css). It contains the full context, constraints, and direction needed to redesign the app end to end without you having to explain anything.*

---

You are redesigning **PHX**, a fan-powered music streaming + city-culture web app for Phoenix, Arizona. The product is real and functional; the problem is the design has grown feature-by-feature into a cluttered dashboard that doesn't feel like a music product or a culture brand. Your job is a full visual and information-architecture redesign, delivered as updated HTML/CSS/JS in the existing files (vanilla JS, single-page `app.html` with view switching — keep that architecture, no frameworks, no build step).

## What PHX is (positioning that must drive the design)

- Members pay a monthly pass; **their pass pays the Phoenix artists they actually stream** (the internal split is company knowledge — never state a percentage in UI or marketing; see README "Royalty Model"). The killer feature is "The Receipt" — showing each member exactly which artists their money reached. The design should make money-flow-to-artists feel like the heartbeat of the product.
- It is a **scene membership, not a streaming service**. Closer to a fan club + city identity card than Spotify. Members get numbered founding memberships ("PHX Native #047"). Local pride, hip-hop culture, desert city energy — think Phoenix at night: warm neon against darkness, not corporate SaaS.
- Users: Explorers (free), Native/Insider members (paid), Artists (upload, analytics, earnings, merch), Admin/Super (ops). One app serves all of them via role-aware navigation.

## Current state (read the files, but here's the map)

- `index.html` — marketing/landing page (pricing, artist roster).
- `app.html` (~250KB) — the entire app: views `home` (City Feed), `music` (catalog + player), `discover` (search, For You), `reels` (hide for now), `mypass` (membership/receipt), artist views (`artist-tracks`, `artist-submit`, `artist-analytics`, `artist-earnings`), admin views (`admin-dashboard`, `admin-members`, `admin-content`, `admin-system`).
- Existing tokens: bg `#07070F`, orange `#F97316` (+ `#FB923C`, `#EA580C`), white `#F1F1F8`, muted `#6B7280`, accents (purple `#7C3AED`, gold, teal, green), font Space Grotesk, persistent bottom player bar, role-aware bottom tab nav on mobile, sidebar on desktop.
- Keep all functionality intact: Supabase calls, `data-view` switching, the player, RPC wiring, IDs and event hooks. This is a reskin + IA cleanup, not a rewrite — do not break `onclick` handlers or element IDs that JS depends on.

## Design direction

**Brand feel:** "Phoenix at night." Deep near-black backgrounds, sunset-orange as the single hero accent (use the existing orange family), generous darkness between elements. One display personality (Space Grotesk is fine — use it with more confidence: bigger, tighter, heavier for headings) + a quieter system font for body/UI. Kill the rainbow: purple/teal/gold/blue only for semantic status (success/warning/error/tier badges), never decoration. The current design uses too many colors, too many borders, too many boxes.

**Principles:**
1. **Music first.** The player and artwork should feel like the center of gravity. Big artwork, clear now-playing state, a full-screen player view on mobile (tap the mini-player to expand). Give tracks and artists real visual weight — the current cards are small and uniform.
2. **The money story is UI.** Design a beautiful "Receipt" component (member: where my money went this month) and an artist Earnings view that feels like getting paid, not like accounting. These two screens are the brand — invest the most polish here. Shareable-screenshot quality.
3. **Hierarchy through space, not boxes.** Replace nested bordered cards with spacing, type scale, and section rhythm. Max ~2 levels of surface elevation.
4. **Role clarity.** Members never see ops chrome; artists get a clean "studio" area visually distinct (subtle, e.g., section header treatment) from the community side; admin views can stay utilitarian but consistent with the system.
5. **Mobile is primary.** Most users arrive from an Instagram bio link at a show. Every view must be excellent at 390px. Bottom tab nav (max 5 tabs per role), thumb-reachable actions, the mini-player above the tab bar. PWA — safe-area insets respected.
6. **Feed that breathes.** City Feed posts: avatar, @handle, role/page badge, text, optional media or playable track card, like/comment/repost/share row. Instagram-density, not data-table density. The attached-track card should look like a music sticker, inviting a tap to play.
7. **Empty states sell.** Beta means thin data. Every empty state should recruit: empty feed → "Be the first to post from the scene tonight"; no merch → "Set up your shop in 15 minutes"; no streams yet → what to share to get your first fans.

**Specific screens to redesign (priority order):**
1. Full-screen player + mini-player
2. My Pass / The Receipt (member money view)
3. Artist page (public): hero, play-all, tracks, merch grid, feed, follow — this is the page artists share, make it poster-quality
4. Home / City Feed
5. Artist dashboard (tracks, submit flow, analytics with Chart.js restyled to match, earnings)
6. Music catalog + Discover/search
7. Onboarding: landing → claim @username → choose tier (founding numbers prominent) → first-follow suggestions
8. Admin (consistency pass only)

**Deliverables:**
- A short design-tokens block (CSS custom properties) at the top of a shared stylesheet: color system, type scale, spacing scale, radii, shadows, motion (150–250ms ease, subtle).
- Updated `app.html` + `index.html` + `shared.css` with the redesign applied, all JS functionality preserved.
- The landing page (`index.html`) rewritten around the pitch: "Your money goes to Phoenix artists. With receipts." — hero, how-it-works (3 steps), founding membership counter, artist roster, FAQ, legal links.

**Do NOT:** add frameworks or a build step; introduce localStorage-breaking changes; rename IDs/functions; use stock-photo aesthetics or generic gradients-on-cards SaaS style; add light mode (dark only for v1); use more than one accent color per screen.

Work screen by screen in the priority order above. Before writing code for each screen, state in one or two sentences what you're changing and why, then implement it.
