#!/usr/bin/env python3
"""
PHX Recommendation Engine — Rung 2: LightFM matrix factorization
=================================================================
Implements the RecSys Challenge 2018 4th-place pattern (Ferraro et al.,
arXiv:1901.00450) documented in docs/recommendation-engine-research.md:
WARP loss, 200 latent dims, content features for cold-start.

RUN THIS once there's ~a month of real listening data (a few thousand
stream_events across dozens of users). Below that, the SQL co-occurrence
recommender (get_cooccurrence_recs) and artist-affinity heuristic already
running in the app will outperform it.

Setup:
    pip install -r requirements.txt
    export SUPABASE_URL=https://dnzvtathfpjelffjnqrc.supabase.co
    export SUPABASE_SERVICE_KEY=<service role key — Dashboard → Settings → API>
    python train_lightfm.py

Schedule monthly (cron, GitHub Action, or a laptop reminder). Output lands
in the `recommendations` table; the app's For You rail reads it automatically
and falls back to the heuristics for users with no rows.
"""
import os
import sys
from collections import defaultdict

import numpy as np
from lightfm import LightFM
from lightfm.data import Dataset
from supabase import create_client

# Hyperparameters straight from the published 4th-place system.
# NOTE: these were tuned on 1M playlists — with PHX-scale data expect to
# re-tune (fewer dims, more epochs). Start here, adjust by holdout precision.
LATENT_DIMS = 200
EPOCHS = 150
L2 = 1e-6
LOSS = "warp"
TOP_N = 10           # recommendations stored per user
MIN_USER_EVENTS = 3  # skip users with fewer interactions (heuristics cover them)

STREAM_WEIGHT = 1.0
LIKE_WEIGHT = 3.0    # same like:stream ratio as the in-app affinity heuristic


def main():
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not url or not key:
        sys.exit("Set SUPABASE_URL and SUPABASE_SERVICE_KEY env vars.")
    sb = create_client(url, key)

    # ── Pull interaction data ────────────────────────────────────────
    streams = sb.table("stream_events").select("user_id,track_id").execute().data
    likes = sb.table("track_likes").select("user_id,track_id").execute().data
    tracks = (
        sb.table("tracks")
        .select("id,artist_id,release_type,exclusive_tier")
        .eq("status", "live")
        .execute()
        .data
    )
    print(f"streams={len(streams)} likes={len(likes)} live_tracks={len(tracks)}")

    weights = defaultdict(float)
    for s in streams:
        if s["user_id"] and s["track_id"]:
            weights[(s["user_id"], s["track_id"])] += STREAM_WEIGHT
    for l in likes:
        weights[(l["user_id"], l["track_id"])] += LIKE_WEIGHT

    per_user = defaultdict(int)
    for (u, _t), _w in weights.items():
        per_user[u] += 1
    users = [u for u, n in per_user.items() if n >= MIN_USER_EVENTS]
    if len(users) < 5:
        sys.exit(
            f"Only {len(users)} users have ≥{MIN_USER_EVENTS} interactions — "
            "not enough signal yet. Keep collecting; the in-app heuristics have this covered."
        )

    track_ids = [t["id"] for t in tracks]

    # Content features fix item cold-start (the documented CF weakness):
    # artist identity + release type + tier gate stand in for the paper's
    # genre probabilities until audio analysis exists.
    feature_names = set()
    track_feats = {}
    for t in tracks:
        feats = [
            f"artist:{t['artist_id']}",
            f"type:{t.get('release_type') or 'single'}",
            f"tier:{t.get('exclusive_tier') or 'free'}",
        ]
        track_feats[t["id"]] = feats
        feature_names.update(feats)

    ds = Dataset()
    ds.fit(users=users, items=track_ids, item_features=sorted(feature_names))
    (interactions, weight_mat) = ds.build_interactions(
        (u, t, w) for (u, t), w in weights.items() if u in set(users) and t in set(track_ids)
    )
    item_features = ds.build_item_features(
        (tid, feats) for tid, feats in track_feats.items()
    )

    model = LightFM(no_components=LATENT_DIMS, loss=LOSS, item_alpha=L2, user_alpha=L2)
    model.fit(
        interactions,
        sample_weight=weight_mat,
        item_features=item_features,
        epochs=EPOCHS,
        verbose=True,
    )

    # ── Score & upsert top-N unheard tracks per user ────────────────
    user_map, _, item_map, _ = ds.mapping()
    inv_item = {v: k for k, v in item_map.items()}
    n_items = len(item_map)

    rows = []
    for u in users:
        uid = user_map[u]
        scores = model.predict(uid, np.arange(n_items), item_features=item_features)
        heard = {t for (uu, t) in weights if uu == u}
        ranked = [
            (inv_item[i], float(scores[i]))
            for i in np.argsort(-scores)
            if inv_item[i] not in heard
        ][:TOP_N]
        for tid, sc in ranked:
            rows.append({"user_id": u, "track_id": tid, "score": sc, "model": "lightfm"})

    sb.table("recommendations").delete().eq("model", "lightfm").execute()
    for i in range(0, len(rows), 500):
        sb.table("recommendations").insert(rows[i : i + 500]).execute()
    print(f"wrote {len(rows)} recommendations for {len(users)} users")


if __name__ == "__main__":
    main()
