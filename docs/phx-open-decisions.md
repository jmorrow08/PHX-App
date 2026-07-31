# PHX — Open Product Decisions
_Drafted 2026-07-30 for Jaye. These are the calls only the founder can make; each has a recommendation and what it takes to build._

## 1. Payout weighting: per-stream vs listen-time

**Today:** a stream "qualifies" at 30 seconds of continuous play (same threshold Spotify/Apple use). Your wallet splits across artists by *count of qualifying streams*, with anti-fraud caps (max 1,000 counted streams/user/month, hourly distinct-track gate).

**The tension you spotted is real, and it cuts both ways:**
- Pure stream-counting under-rewards artists people listen to *deeply* (4-minute songs count the same as a 31-second skim).
- Pure time-weighting over-rewards *long songs* — an artist making tight 2-minute records earns half of what a 4-minute artist earns from the exact same fan devotion. It also invites "sleep-stream" padding (10-minute ambient loops farming minutes).

**Recommendation — capped time-weighting:**
- Keep the 30-second qualification gate and the anti-fraud caps.
- Weight each play by `min(seconds_listened, 240)` (4-minute cap per play).
- Effect: a full listen of a 2-min song = 120 points, full listen of a 4-min song = 240, a 10-min song still = 240. Skims barely count, devotion counts, nobody games it with long tracks.
- This is roughly YouTube/Twitch watch-time economics with a music-shaped cap; no major DSP does this yet — it's a genuinely defensible differentiator for the "with receipts" brand.

**Build path (2 steps, no risk to current data):**
1. **Now:** add `seconds_listened` to `stream_events` + a `finalize_stream()` RPC the player calls when a track ends/changes. Start *collecting* the data while payouts stay per-stream.
2. **At a month boundary (before real money flows):** flip `run_monthly_payout()` to the capped-time formula. Because we collected data first, you can preview both formulas side-by-side on real listening before committing.

## 2. Song submissions: authenticity + AI policy

**Today:** submission requires a signed-in account with a linked artist page, a clickwrap Artist Distribution Agreement, server-side content moderation on text, and your manual listen-and-approve in the admin queue. That's the right shape at this scale — your ear is the verification layer.

**Recommended policy (add to the Artist Agreement):**
1. **Rights attestation** — submitter warrants they own/control the master + composition, and indemnifies PHX. (Standard; mostly already in the agreement.)
2. **AI disclosure, not AI ban** — "AI-assisted production tools are fine. Fully AI-generated vocals/likeness of another person, or works you didn't meaningfully author, are not. Undisclosed AI-generated submissions are removal + forfeiture of unpaid earnings."
   - Why not a ban: producers already use AI tools everywhere; unenforceable and alienates legit artists.
   - Why not open door: PHX's whole pitch is *real Phoenix artists, real scene*. A flood of AI catalog spam would poison the payout pool and the brand. Deezer-style AI-detection APIs exist if volume ever demands automation; overkill today.
3. **Scene verification** — keep artist onboarding invite/apply-based: a real person, a Phoenix connection, a listenable catalog. At your scale this is a 5-minute check per artist and it's also your fraud defense.

## 3. AI monitoring / "Bub for PHX"

What you described (talk to it freely, it watches streams/users/anomalies, drafts changes, maintains SOPs) is the Lytbub-OS pattern applied to PHX. Sensible build order once the platform has real activity:
1. **Digest first:** a daily/weekly agent that reads `stream_events`, `user_events`, signups, reports, and payout math, and posts a plain-English ops digest (+ anomaly flags: stream-farming patterns, error spikes, moderation queue depth).
2. **Chat second:** same data access, conversational ("how many listeners did Jaye Mali get this week?").
3. **Actions last:** guarded write-paths (hide post, flag account, draft copy change → you approve). Never auto-change payout settings.
This lives in the post-launch backlog with the Lytbub comms backbone — worth building *after* Stripe, when there's real activity to monitor.

## 4. The "30-second stream" banner
Shown to **everyone**, not just admins — it's transparency copy in the music view, part of the "with receipts" trust story. Keep it; wording updates if the payout formula changes (see #1).
