# PHX — Launch Strategy
### How to take over Phoenix culture, starting from one artist
*July 30, 2026 · Built from competitor teardowns (EVEN, Audiomack, Bandcamp, SoundCloud FPR, UnitedMasters, Partiful/Dice) and Phoenix-scene research. Aligned with the atomic-network plan in your PHX strategy docs.*

---

## 1. Why the timing is genuinely good

Three doors opened in the last 18 months that PHX walks straight through:

1. **Bandcamp's trust collapse.** Post-Songtradr layoffs gutted it; artists are actively looking for an artist-first home. "Transparent pay, owned by no one" is a real recruiting pitch in 2026.
2. **UnitedMasters killed free distribution** (Oct 2025). "Free to upload, and your fans' money actually reaches you" now stands out.
3. **The superfan economy got validated at the top** — Spotify's Music Pro superfan add-on, UMG's deal with EVEN, a16z's $10M into EVEN. Everyone now agrees superfans pay more; nobody is doing it *for one city*.

And the structural advantage nobody can copy: SoundCloud's fan-powered royalties route ~$1–2/user/month to artists. **PHX routes $7.50–$14.50.** At 1,000 members that's a ~$9K/month pool concentrated on maybe 50–150 local artists — $60–180/artist/month, which is *visibly life-changing versus streaming pennies*. Tidal tried user-centric and failed because it paid only each fan's #1 artist; SoundCloud proved the split-across-everyone version works. You have SoundCloud's mechanic at 10x the dollars, in a market small enough for the numbers to feel personal.

## 2. Pricing reality check

Spotify is $12.99 now, so $15 buys *less catalog for more money* — PHX must never be sold as a streaming service. It's a **scene membership that happens to include streaming**: the music, the feed, the parties, the perks, the identity. Superhuman held $30/mo with a waitlist; Patreon fans pay $5–25/mo for a single artist. 1,000 members is 0.02% of metro Phoenix — you need superfans, not median listeners.

**Recommended beta pricing:**
- Free 60-day closed "Founding Beta" for the first wave (artists' day-ones). Don't launch free-forever — an empty wallet kills the whole story.
- Then **numbered founding memberships**: "PHX Native #047" — $9.99/mo locked for life (cap 500), Insider founding $19.99 (cap 100). The number is the status object; the cap does the selling. Full $15/$29 only after caps fill.
- Push the **$99 founding annual** hard: prefunds the artist wallet and skips the month-3 churn cliff (60–70% of cancellers are gone by cycle 3; annual billing cuts churn 60–80%).
- Student rate ($7.99) for the ASU push.

## 3. The 90-day plan

**Phase 0 — Days 1–15: Sign the scene, not users.**
- Lock Murkemz as the anchor (he's carrying real heat — New Times Best Hip-Hop 2025, "We Outside" viral, Ice-T/Inspectah Deck co-signs). Consider a modest wallet floor guarantee for 6 months (e.g., $1K/mo minimum) — cheap insurance, huge story.
- Personally recruit 20–30 artists max — through Plug City, and one meeting with Justus Samuel / Respect The Underground (AZ Hip Hop Fest = 3 stages, ~100 performers, several times a year; one relationship reaches the whole underground roster). Pitch: Bandcamp collapsed, UnitedMasters killed free, your fans' money reaches you monthly with receipts, no AI training on your music.
- Waitlist page live: numbered founding memberships, visible queue position, jump the line by referring or attending IRL.

**Phase 1 — Days 16–45: The Drop.**
- Beta opens **only as an event**: a Murkemz exclusive live in PHX 72 hours before DSPs, premiered at a listening party (Valley Bar / Monarch). Entry = scan the QR, activate on the spot. Never a generic "sign up" launch. (This is EVEN's whole playbook — monetize moments.)
- Every artist gets a referral code + QR merch-table cards. **First-month wallet share of every referred member routes to the referring artist** — in a user-centric model, the artist's income literally equals fans they bring, so make them your sales force.
- Personal onboarding (DM/call) for the first 200 members, Superhuman style.
- Weekly "PHX Report": total paid to Phoenix artists so far. Make that number the brand.

**Phase 2 — Days 46–75: Density + ritual.**
- Monthly listening-party ritual, rotating venues/neighborhoods (Crescent, Valley Bar, a barbershop, a sneaker shop).
- ASU push via the AMP student org (they exist to bridge campus and the Tempe scene); campus reps get founding invites.
- **Wallet Day #1**: pay artists publicly — on feed and on stage. Screenshots everywhere. Your cost of revenue *is* the marketing engine, and it's a recurring local-press story (New Times, PhxSoul).
- Start converting free beta users at day 60 (annual pushed hardest).

**Phase 3 — Days 76–90: Prove the tip, or shrink and rerun.**
- Gates: 500+ activated members, ≥40% week-4 retention, ≥50% free→paid among engaged users, DAU/WAU ≥40%, members following 3+ artists, and — the real signal — **artists you didn't recruit asking to get in**.
- Hit → open memberships 501–1,000 with a second anchor drop (Futuristic-tier artist; he's already in your seed data). Miss → shrink to the best-retaining artist cluster and rerun. Don't widen.

## 4. What to CUT for beta (and what to keep)

The app has grown a lot of surface area. Keep the spine, mothball the rest:

**Keep:** streaming + wallet with real-time "where your money went," City Feed (it's built — but see below), artist dashboard + top-fans, follows, notifications/push, search/discover, admin/moderation, merch (link-out + Fourthwall), PWA.

**Cut / defer:**
1. **Eats, Cuts, Drops verticals** — one static "PHX Perks" page with 3–5 hand-negotiated partner discounts at most. No infrastructure. (Your own strategy docs say this; the app's coming-soon tabs are fine as teasers.)
2. **Reels** — a vertical-video feed is a content treadmill you can't feed at 300 users, and engagement-mechanic litigation (the addiction MDL — AZ is a bellwether district) makes autoplay-infinite-video the riskiest surface in the app. Hide the tab for beta.
3. **The $29 Insider tier as a feature set** — sell it as founding badge + listening-party priority + exclusives access only. Don't build more tier gates yet.
4. **Open self-serve artist signup** — curated, invite-only roster for beta. Scene credibility is the moat; an open firehose kills it. (Also keeps your human listen-through review workable.)
5. **Native app wrappers** — PWA only; app-store review would kill drop cadence. Capacitor doc stays on the shelf until post-beta.
6. **ML recommendations** — the heuristic For You is plenty; run the LightFM pipeline when there's a month of real data (as your own docs already say).
7. **Ads** — revisit at 5K MAU, as planned.

One honest consideration on the feed: your strategy research argued for running community on Discord first. You've already built the feed, so ship it — but treat Discord/group-chat as a complement for the artist-side back-channel (artists coordinating drops with you), not a user-facing thing to build more of.

## 5. Five differentiators that could make PHX own the city

1. **The Receipt.** Monthly shareable card: "You put $7.50 into Phoenix this month: $4.10 → Murkemz, $2.15 → Alexcis…" plus a citywide ticker ("PHX members have paid Phoenix artists $84,312"). No platform on earth shows fans this. It's your wallet engine's output turned into the brand — and structurally impossible for Spotify to copy.
2. **Numbered civic membership.** "PHX Native #047" on the profile — and eventually a physical card that doubles as line-skip at partner venues. Scarcity + city pride; the card is the merch.
3. **Wallet Day as public ritual.** Monthly, on-feed and on-stage. Recurring press story, recurring screenshot moment, recurring proof the model is real.
4. **"Signed to the city."** Announce the 20–30 Founding Artists like a draft class (New Times/PhxSoul coverage), with the year-one floor guarantee. PHX becomes the scene's label-that-isn't-a-label — exactly the infrastructure gap Bandcamp Daily says the AZ scene has.
5. **The Plug Map.** One map of the week in Phoenix music — every show, open mic, listening party, with QR check-in that earns invites/queue jumps. It's the one concrete utility (the Partiful/Dice lesson), it feeds Discover, and it's the bridge to Eats/Cuts/Events later because you'll know where members actually go. (Buildable in days on your existing stack; also the natural home for ticketing later — just remember FTC all-in pricing when you get there.)

## 6. Metrics dashboard for the beta (what "working" means)

- DAU/WAU ≥ 40%, WAU/MAU ≥ 60% (founding cohort)
- Week-4 retention ≥ 40%; watch every cohort at month 3
- ≥ 20 local streams/member/week; ≥ 3 artists followed/member
- ≥ 60% of artists posting weekly; ≥ 80% of wallet dollars claimed in 30 days
- Organic invite coefficient ≥ 0.5 new members/member/month
- Merch clicks per artist page (prove the "PHX drove N sales" story)
- Failed-payment recovery rate (dunning working)

All of these are computable from tables you already have (`user_events`, `stream_events`, `follows`, `subscriptions`) — a one-page admin "Beta Health" view is a day of work and worth it.
