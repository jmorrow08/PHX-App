# PHX Pages Platform — every hustler in the city gets a storefront
*Drafted Aug 28, 2026 — the "rabbit hole" doc Jaye asked for. This is the planning artifact for professional pages: barbers, trainers, brands, promoters, and everything after.*

---

## 1. The one-sentence vision

**A PHX page is a Phoenix professional's whole internet presence — booking, clients, store, portfolio, reviews — living inside the app where the city already hangs out.**

Shopify gives you a store but no foot traffic. Instagram gives you traffic but no store, no booking, no client list you own. Booksy gives barbers booking but nothing else and takes a cut. PHX gives all of it, *plus a city of members whose feed you're already in*. That's the moat: **distribution + tools in one place, Phoenix-only, human-approved.**

## 2. What already exists (don't rebuild)

| Piece | State |
|---|---|
| `pages` table + 8 page types | Live (artist, creator, food_drink, retail, service, venue, community, other) |
| `page_type_capabilities` | Live, 8 rows — per-type feature switches already modeled |
| Business tiers | Live in `tiers`: **Basic Listing** (directory, 1 link) / **Full Page** (posts, clips, booking flag, merch links) — the `booking:true` capability is already reserved |
| Identity switcher | Live — one account posts as any page it owns (IG-style long-press) |
| Vanity URLs, page posts, follows, avatars | Live |
| Reviews | Live as of tonight (venue reviews open to members) — **reuse for every page type** |
| QR cards | Live — every page can already be a scannable card |
| Merch connections (Printful-style) | Live for artists — generalizes to retail pages |
| Moderation, reports, verification queue | Live — pages inherit it |

So "adding professionals" is NOT a new platform. It's **new modules on an existing chassis.**

## 3. The module architecture (build once, compose per type)

Never build "the barber page" — build modules and switch them on per type via `page_type_capabilities`:

| Module | What it is | Who gets it |
|---|---|---|
| **📅 Booking** | Services menu (name/duration/price), weekly availability grid, member taps a slot → request or auto-confirm → both get notified; reschedule/cancel windows | Barbers, trainers, tattoo, nails, photographers, studios |
| **👥 Client book (CRM-lite)** | Auto-built from bookings: who, visit history, notes field, no-show count, "book again" nudge | Every service pro |
| **🛍 Storefront** | Products/packages with photos + prices; checkout = Stripe when live, "reserve & pay in person" until then | Retail, barbers (product shelves), trainers (packages) |
| **🖼 Portfolio** | Gallery grid + before/afters + clips already in the app | Barbers, tattoo, photographers, artists |
| **📋 Menu/List** | Structured list w/ sections (food menu, service list, class schedule) | Food, gyms, studios |
| **🎟 Events** | Already built — pages post events to the Plug Map | Promoters, venues, gyms (classes ARE events) |
| **⭐ Reviews** | Already built | Everyone |
| **📊 Page analytics** | Views, follows, booking requests, product clicks — the "receipts" system generalized | Everyone (depth by tier) |
| **💳 Memberships** | Recurring packages (4 cuts/mo, 8 sessions/mo) | Barbers, trainers, gyms — *the highest-value module; Stripe-gated* |

**Page = chassis (header, posts, follows, QR, reviews, analytics) + modules per type.** A venue-page redesign then comes free: venues are just pages with events + reviews + follows on, booking off.

## 4. Per-type page blueprints (v1 set)

- **✂️ Barber/Beauty** — Portfolio hero, Book Now (chair schedule), services + prices, product shelf, client book, reviews. *Differentiator vs Booksy: no per-booking fee, and their clips hit the city feed.*
- **💪 Trainer/Fitness** — Session booking + packages, client book with per-client session count ("8 of 10 used"), transformation gallery, optional class events on the Plug Map.
- **👕 Retail/Brand** — Storefront hero, drops (the Drops mechanic generalized: notify followers at drop time), lookbook, pop-up events on the map.
- **📸 Photographer/Videographer** — Portfolio-first, inquiry/booking with deposit flag, packages.
- **🎤 Promoter** — Events roster, door QR/guest lists (planned), ticket link analytics, "presented by" credit on event pages.
- **🍽 Food truck/Restaurant** — Menu, location schedule (truck = event pins on the map!), reviews.
- **🎙 Podcast/Creator** — Episodes shelf (PHX Audio vertical seeds from here), clips, guest booking.

## 5. Tiers & the beta answer

**Members**: Free → PHX Native ($9.99/mo founding) → Insider. **Artists**: basic → full → headline. **Businesses** (already in the DB): Basic Listing → Full Page; add **Premium** later (memberships module, priority placement, deeper analytics).

**Beta answer — yes, exactly what you suspected:** everyone you onboard now goes in at the top tier for their type, **free, labeled "Founding"** (founding number, like members already get). No payment plumbing needed, no awkward conversation. When billing goes live: founders keep a permanent founder's discount (or a long free runway — decide then), and NEW signups pay from day one. Nobody who bet on you early ever gets a rug-pull. This is also the pitch line: *"You're getting the $X/mo page free for life-ish because you're founding."*

## 6. The holes in the prompt (what you didn't say, and must decide)

1. **Payments liability** — the moment a trainer sells sessions through PHX, you're in the money-flow. Stripe **Connect** (their account, their liability, PHX takes an application fee) — never hold their money yourself. Same rails as artist payouts.
2. **No-shows & disputes** — booking needs policy fields from day one (cancel window, deposit flag) even if unenforced in beta. Who eats a chargeback? (Answer: the pro, via Connect — put it in ToS.)
3. **Pro verification** — barbers/trainers are licensed trades in AZ. You approve pages by hand anyway (beta superpower). ToS line: pros self-certify licensure; PHX is a marketplace, not the provider. (Add to the attorney-review list with the Moffatt-style AI disclaimer work you did for Lytbub.)
4. **Calendar reality** — a barber lives in their calendar. If PHX booking doesn't export .ics / sync, they double-book once and never trust it again. The plug-map-ics feed pattern already exists — reuse per page.
5. **Notification urgency** — a booking request is not a like. It needs push + (later) SMS. Another reason Capacitor moves up the list.
6. **The empty-shelf problem** — a booking page with no availability set looks dead. Onboarding a pro must be concierge: you sit with them 20 minutes, load services/prices/hours/photos before handing them the login (you already planned exactly this).
7. **Data ownership** — pros will ask "can I export my client list?" Answer must be yes (export-my-data already exists; extend to pages). It's also the trust pitch: *IG owns your followers; here, your book is yours.*
8. **Capacity honesty** — every module is a support surface. V1 discipline: **booking + client book + portfolio + reviews + analytics.** Storefront-with-checkout and memberships wait for Stripe. Don't ship 9 modules at 60%.
9. **Discovery surface** — pages need a home: a **City Directory** tab on Discover ("Find a barber / trainer / photographer near you"), and the wizard interests (shipped tonight) already feed it — someone who tapped ✂️ Barbers sees barber pages recommended.
10. **What kills you** — a pro's worst outcome is a member no-showing or a booking lost in a notification void. Reliability > features, forever.

## 7. The deeper prompt (what you asked me to write)

> *"Design PHX Pages as the operating system for Phoenix's independent economy. For each trade (barber, trainer, tattoo, photographer, promoter, brand, chef, podcaster): what does their Tuesday look like, what tool do they touch every hour, what do they pay for today (Booksy $30/mo, StyleSeat cut, Shopify $39/mo, Linktree, IG ads), and which of those line items does a PHX page delete? What's the one module per trade that makes the page their DAILY tool rather than their link-in-bio? How does each page type feed the flywheel — bookings create check-ins, check-ins create reviews, reviews create discovery, discovery creates followers, followers create bookings? What does PHX take (flat page fee, never a % of bookings?) and what stays free forever? And what must NEVER be built because it turns PHX into a generic marketplace instead of the city's own network?"*

My answers to that prompt live in §3–§6; the flywheel line is the strategy: **every module must generate content or data that feeds the city feed or the map** — that's the test for building it.

## 8. Rollout plan (people you know, in order)

**Sequence: barber first.** Highest visit frequency (2–4 wks), most visual (portfolio + clips), and booking is the strongest habit-former. Trainer second (recurring sessions = retention). Retail third (needs Stripe for real checkout — start them with drops + lookbook + reserve-in-person).

1. **Build their page yourself before you talk to them.** Photos from their IG, services, prices, hours. You're not pitching an app — you're handing them a finished storefront with their name on it. ("I already built you this" beats any demo.)
2. **The ask**: "It's free — you're a founding page. Post your work here too, and put your booking link in your IG bio."
3. **Outreach channel — your instinct is right: the PHX App IG page, not your personal.** From the brand account it's "the platform chose you" (screenshot-able, flex-able); from Jaye's personal it's "my friend's app." Personal follow-up *after* they bite is where your relationship closes it. For artists already IN the app, use PHX DMs — it demos the product while you pitch.
4. **Concierge onboarding, 20 min in person**, at their shop. Load everything. Take their portrait for the page header while you're there.
5. **First win within a week**: one booking or one product inquiry from a PHX member. Engineer it if needed (book yourself in). A pro who gets one real customer tells every pro they know.
6. **Cap founding pages at ~10–15** until booking notifications are battle-tested (see hole #5).

## 9. Build order (when you say go)

1. **Migration**: `page_services`, `page_availability`, `page_bookings`, `page_clients`, `page_gallery` + capability flags per type (schema ~1 session)
2. **Booking module + client book** on the page chassis (the big one)
3. **Portfolio + directory surface on Discover** (fast)
4. Storefront/memberships (Stripe-gated), door-QR promoter kit (pairs with check-ins)
5. Venue-page redesign lands free as "page chassis v2" during step 2–3

---
*Related: business tiers already in `tiers` table; reviews/QR/identity-switcher shipped; wizard interests (Aug 28) already collect fitness/barbers/fashion signals for the directory.*
