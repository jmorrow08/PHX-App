# Recommendation Engine Research — Verified Findings & PHX Roadmap

> STATUS: current as of 2026-08-07 — reference (linked from README)

*Deep research run: 2026-07-01 · 23 sources fetched · 112 claims extracted · 25 adversarially verified (3-vote panels) · 24 confirmed, 1 refuted*

## The Big Insight

TikTok, Instagram, YouTube, and Spotify all converge on **one architecture**: a multi-stage funnel — candidate retrieval from millions of items → progressively heavier ranking models → final list of dozens. Nobody ranks everything with one big model. The differences are infrastructure, not exotic algorithms.

## Verified Platform Findings (all high confidence, primary sources)

### TikTok / ByteDance (Monolith paper, arXiv 2209.07663)
- The edge is **infrastructure, not algorithms**: collisionless embedding tables + **online streaming training** — the model updates from user feedback in near real time (minute-level), not batch retrains.
- Caveat: ByteDance ties Monolith publicly to BytePlus Recommend, not explicitly TikTok's ranker.

### YouTube (Covington et al., RecSys 2016 — the canonical paper)
- Two stages: candidate generation (millions → hundreds, softmax "predict the next watch") → separate ranking network.
- **Ranks by expected watch time, NOT click-through rate** — explicitly because CTR optimization promotes clickbait. For PHX: rank by listen-through, not taps.
- **Cold-start fix any platform can copy**: feed the age of the training example as a feature during training, set it to zero at serving. Corrects the bias toward old popular content so fresh uploads surface. (Superseded in production by 2019 multitask MMoE, but the pattern stands.)

### Instagram Explore (Meta engineering, 2019 + 2023 posts)
- Funnel: retrieval → first-stage ranker → second-stage → rerank. 2019 sizes: 500 sampled → 150 → 50 → 25.
- **Two-Tower retrieval**: user embedding and item embedding computed separately; item embeddings precomputed + cached in an ANN index → inference is extremely cheap. This is the standard v2 upgrade path (TensorFlow Recommenders has small-team tooling).
- **The final score is a formula PHX can copy today**:
  `score = w_like·P(Like) + w_save·P(Save) − w_negative·P(SeeFewerLikeThis)`
  Multi-task neural net predicts each action probability; the weights are **hand-tuned by engineers, not learned**. Trivially expressible as SQL over engagement rates.
- Retrieval mixes multiple candidate sources with tunable weights: interaction history, trending heuristics, ML, real-time.
- ❌ Refuted (1-2 vote): the "ig2vec account embeddings + FAISS KNN" description of Explore's candidate generation. Don't carry it forward.

### Music-specific (peer-reviewed)
- **Pure collaborative filtering mathematically cannot recommend zero-history tracks** (item cold-start). Every proven music recsys for sparse data is hybrid: content features (audio, tags, titles, lyrics) layered on CF. (NCACF, Data Mining & Knowledge Discovery 2022.)
- **RecSys Challenge 2018** (Spotify Million Playlist Dataset) is the canonical benchmark for exactly PHX's problem: recommend tracks given a few seeds — cold-start buckets built into the evaluation.

## The Proven V1→V2→V3 Ladder for PHX

**Rung 1 — SQL co-occurrence (build when we have real listening data):**
The 4th-place RecSys 2018 Creative Track system's heuristic half was just a **track co-occurrence proximity matrix**: count track pairs appearing within a ±10-position window of the same playlist/session, weight by distance decay `S_ij = Σ(1 − |Δpos|/10)`, popularity fallback for zero-seed users. This alone nearly matched their full hybrid. It's a windowed self-join in SQL — runs fine in Supabase. Independent meta-analyses (Ludewig & Jannach 2018, Dacrema et al. 2019) confirm heuristic kNN/co-occurrence often beats neural models.

**Rung 2 — LightFM matrix factorization with content features:**
Published hyperparameters from the 4th-place system: WARP loss, 200 latent dims, L2=1e-6, 150 epochs, playlist titles + 13-genre audio probabilities as content features (the cold-start fix). Fused with co-occurrence at 0.7 MF / 0.3 co-occurrence weights. Code is public (github.com/andrebola/creative-recsys-cocoplaya). Caveats: tuned on 1M playlists — PHX's optima will differ; lean harder on content features at small scale; LightFM is in maintenance mode.

**Rung 3 — Two-Tower neural retrieval (Instagram's current pattern):**
Only when PHX has real scale. TensorFlow Recommenders makes this feasible for a small team. Item embeddings precomputed + cached.

**What PHX has already:** the `user_events` table (play_30s, likes, session data) is exactly the training data all three rungs consume. The current For You rail (artist-affinity heuristic) is a legitimate rung-0.

## Design Principles Verified From the Big Platforms

1. **Optimize listen-through, not clicks** (YouTube's clickbait lesson).
2. **Subtract negative signals explicitly** (Instagram's −w·P(SeeFewer)) — PHX's report/hide data should demote content, not just moderate it.
3. **Fresh-content boost** (YouTube's example-age trick) — give new local drops a freshness bonus or they'll never beat established tracks.
4. **Mix candidate sources with tunable weights** — trending + personal history + editorial, not one algorithm.
5. **Hand-tuned weights are production-grade** — Instagram ships engineer-tuned scoring weights. Don't wait for ML to tune what a human can.

## Gaps — NOT Covered by Surviving Evidence

Two research angles produced zero claims that survived adversarial verification. Treat as **unresearched, not settled**:

1. **ML stream-fraud detection** — unverified leads from fetched sources (Spotify-style detection reportedly uses listen-time uniformity — bots cluster at exactly 30–31s while humans have messy skip distributions — plus device/IP entropy). Directionally useful for PHX's fraud roadmap but not verified. Open question: what's a proven v1 for a fan-powered platform where fraud directly moves money? (Note: PHX's fan-powered model already caps fraud damage at the fraudster's own subscription.)
2. **Regulatory wellbeing guardrails** — unverified leads: EU DSA Article 27 requires disclosing recommender parameters in plain language; EDPB treats collaborative filtering as GDPR "profiling"; EU minors guidelines (July 2025) require feed-reset options; Digital Fairness Act (addictive design) draft expected Q3/Q4 2026. A US-only platform has lighter exposure today, but the direction is clear: transparency about ranking + a non-personalized feed option (PHX's "Latest" toggle already satisfies the spirit of this).

## Open Questions for a Future Research Pass
- Proven v1 stream-fraud ML for payout platforms
- Minimal US compliance set for a small music/social platform
- Spotify's live production ranker (BaRT/bandits) — the challenge literature covers the dataset, not their live system
- Minimum-data thresholds where each ladder rung starts beating the previous one

## Primary Sources
- arxiv.org/abs/2209.07663 (ByteDance Monolith)
- research.google/pubs/deep-neural-networks-for-youtube-recommendations (YouTube, RecSys 2016)
- engineering.fb.com 2023 + instagram-engineering.com 2019 (Explore architecture)
- arxiv.org/abs/2102.12369 (NCACF cold-start), arxiv.org/abs/2110.01001 (multimodal sequential)
- arxiv.org/pdf/1901.00450 (4th-place RecSys 2018 system — the PHX v1 blueprint)
- arxiv.org/abs/1808.04288 + research.atspotify.com (RecSys Challenge 2018)
