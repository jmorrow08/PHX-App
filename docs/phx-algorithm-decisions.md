# PHX — Algorithm Decisions (locked)
_Decided by Jaye, 2026-08-03. These set the `V` weights in the ranking formula. Revisit only deliberately._

---

## 1. What the feed optimizes for

**Chosen:** artists discovered **+** time spent listening **+** time spent scrolling/engaging in the app.

**How this gets implemented — a blended objective, not raw time-on-app:**

```
score =  1.20 × p_complete            -- finished the track (the "real listen")
       + 1.30 × p_follow              -- deepest conversion on a music platform
       + 0.90 × p_save_or_like
       + 0.80 × expected_listen_secs  -- capped per play (see below)
       + 0.70 × p_engage              -- comment / share / post / merch click
       + 0.60 × discovery_bonus       -- artist this user hasn't heard before
       + 0.80 × freshness             -- decays over ~21 days
       + 0.70 × locality              -- playing live soon / same scene
       + 0.50 × exploration           -- uncertainty bonus (bandit)
       - 1.50 × p_skip_under_10s      -- strongest negative signal
       - 0.60 × shown_and_ignored     -- YouTube's churn trick
```

**Two guardrails that make the engagement half safe:**

1. **Listen time is capped per play** (`min(seconds, 240)`), same cap as the payout formula. Time counts, but a 10-minute ambient loop can't out-earn a 3-minute song, and nobody can farm the feed with length.
2. **Session quality, not session length, is the reported metric.** Track *artists discovered per session*, *follows per session*, and *completion rate* — not "minutes in app." Same engagement in practice; a completely different thing to be optimizing on paper if this is ever examined.

**The honest note (see §5 of the algorithm guide):** raw time-in-app is the objective currently being litigated in MDL 3047, and Arizona is a bellwether district. The blended formula above gets Jaye what he actually wants — people enjoying the app and staying in it — without the platform's stated objective being "maximize time spent." What creates legal exposure is the *mechanics* (infinite scroll, variable-reward notifications, autoplay defaults, streaks), not wanting an engaging product. Those mechanics stay off the build list.

## 2. New-artist exposure floor

**Chosen: every track gets its first 200 listeners guaranteed** before the algorithm is allowed to judge it (TikTok's test-audience mechanic).

- Implemented as reserved explore slots: ~4 of every 20 feed slots.
- Marketable as a promise: *"Every track gets its first 200 listeners."*
- After the floor, tracks whose completion rate clears the catalog median get promoted to a wider pool (successive elimination).

## 3. Pay-to-rank

**Chosen: never — and say so publicly.**

- No Discovery-Mode equivalent. No reduced-royalty-for-promotion. No paid placement in music discovery.
- Publish it as an explicit commitment on the transparency page.
- *Note:* this covers **music ranking**. Sponsored placement for local businesses in future non-music surfaces (Eats/Perks) is a separate question and does not violate this.

## 4. Explainability

**Chosen: yes — show the real arithmetic.**

- Every recommendation carries a "why you're seeing this" string built from the actual scorer terms:
  *"0.7 similar to [track you played] · +0.8 new this week · +0.7 playing at Rebel Lounge Friday · −0.2 you skipped this artist once"*
- Only possible because the algorithm is interpretable — Spotify cannot do this honestly at their scale. Extends the "with receipts" brand from money into discovery.
- Build at Stage 1 (~1.5 days).

---

## What this implies for the build

- `ranking_weights` table holding every `V` above, versioned, changeable without a deploy.
- Every impression stamped with the weight-version that produced it (audit trail + A/B capability).
- Public transparency page publishing the weights and the no-pay-to-rank commitment.
- Design defaults locked: no autoplay by default, finite named feeds that end, deterministic notifications, no streaks, chronological/Following toggle always available.
