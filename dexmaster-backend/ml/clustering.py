import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from collections import defaultdict

# Map cluster behavioral profile -> personality name
# Determined by analyzing centroid characteristics after clustering
PERSONALITY_NAMES = [
    "Mewtwo", "Charizard", "Snorlax", "Pikachu",
    "Psyduck", "Piplup", "Gengar", "Eevee"
]

def extract_player_features(player_id: str, db_session):
    """
    Build the feature vector for one player from their attempt history.
    """
    from models import QuestionAttempt, Player

    attempts = db_session.query(QuestionAttempt).filter(
        QuestionAttempt.player_id == player_id
    ).all()

    if len(attempts) < 5:
        return None  # not enough data to cluster meaningfully

    total = len(attempts)
    correct = sum(1 for a in attempts if a.answered_correctly)
    accuracy = correct / total

    times = [a.time_taken_seconds for a in attempts if a.time_taken_seconds]
    avg_time = sum(times) / len(times) if times else 10

    lifeline_count = sum(1 for a in attempts if a.lifeline_used)
    lifeline_rate = lifeline_count / total

    # Category variance — how inconsistent the player is across categories
    cat_stats = defaultdict(lambda: {"total": 0, "correct": 0})
    for a in attempts:
        cat_stats[a.category]["total"] += 1
        if a.answered_correctly:
            cat_stats[a.category]["correct"] += 1

    cat_accuracies = [
        v["correct"] / v["total"]
        for v in cat_stats.values()
        if v["total"] > 0
    ]
    category_variance = float(np.std(cat_accuracies)) if len(cat_accuracies) > 1 else 0.0

    player = db_session.query(Player).filter(Player.id == player_id).first()
    regions_completed = player.regions_completed if player else 0

    return {
        "player_id": player_id,
        "player_name": player.name if player else "Unknown",
        "accuracy": accuracy,
        "avg_time": avg_time,
        "lifeline_rate": lifeline_rate,
        "category_variance": category_variance,
        "regions_completed": regions_completed,
    }


def run_clustering(db_session, n_clusters=8):
    """
    Run K-Means on all players with enough data.
    Returns cluster assignments and maps each cluster to a personality
    based on the behavioral characteristics of its centroid.
    """
    from models import Player

    all_players = db_session.query(Player).all()

    feature_rows = []
    for p in all_players:
        features = extract_player_features(p.id, db_session)
        if features:
            feature_rows.append(features)

    if len(feature_rows) < n_clusters:
        return {
            "status": "insufficient_data",
            "message": f"Need at least {n_clusters} players with 5+ attempts each. Currently have {len(feature_rows)}.",
            "total_players_clustered": len(feature_rows),
            "clusters": [],
            "cluster_centroids": {},
        }

    df = pd.DataFrame(feature_rows)

    feature_cols = ["accuracy", "avg_time", "lifeline_rate", "category_variance"]
    X = df[feature_cols]

    # Scale features so they're comparable (accuracy is 0-1, avg_time might be 0-30)
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Run K-Means
    actual_k = min(n_clusters, len(feature_rows))
    kmeans = KMeans(n_clusters=actual_k, random_state=42, n_init=10)
    cluster_labels = kmeans.fit_predict(X_scaled)

    df["cluster_id"] = cluster_labels

    # Map each cluster to a personality based on its centroid characteristics
    centroids_original_scale = scaler.inverse_transform(kmeans.cluster_centers_)
    cluster_personality_map = assign_personalities_to_clusters(
        centroids_original_scale, feature_cols, actual_k
    )

    df["personality"] = df["cluster_id"].map(cluster_personality_map)

    # Build response
    clusters = []
    for _, row in df.iterrows():
        clusters.append({
            "player_id": row["player_id"],
            "player_name": row["player_name"],
            "cluster_id": int(row["cluster_id"]),
            "personality": row["personality"],
            "accuracy": round(row["accuracy"], 3),
            "avg_time": round(row["avg_time"], 2),
            "lifeline_rate": round(row["lifeline_rate"], 3),
            "category_variance": round(row["category_variance"], 3),
        })

    centroid_summary = {}
    for cluster_id in range(actual_k):
        centroid_summary[str(cluster_id)] = {
            "personality": cluster_personality_map[cluster_id],
            "avg_accuracy": round(float(centroids_original_scale[cluster_id][0]), 3),
            "avg_time": round(float(centroids_original_scale[cluster_id][1]), 2),
            "avg_lifeline_rate": round(float(centroids_original_scale[cluster_id][2]), 3),
            "avg_variance": round(float(centroids_original_scale[cluster_id][3]), 3),
            "player_count": int((df["cluster_id"] == cluster_id).sum()),
        }

    return {
        "status": "success",
        "total_players_clustered": len(feature_rows),
        "clusters": clusters,
        "cluster_centroids": centroid_summary,
    }


def assign_personalities_to_clusters(centroids, feature_cols, k):
    """
    Looks at each cluster's centroid (average accuracy, speed, lifeline use, variance)
    and assigns the personality whose profile best matches that behavioral pattern.
    """
    acc_idx = feature_cols.index("accuracy")
    time_idx = feature_cols.index("avg_time")
    lifeline_idx = feature_cols.index("lifeline_rate")
    variance_idx = feature_cols.index("category_variance")

    cluster_profiles = []
    for i in range(k):
        cluster_profiles.append({
            "cluster_id": i,
            "accuracy": centroids[i][acc_idx],
            "avg_time": centroids[i][time_idx],
            "lifeline_rate": centroids[i][lifeline_idx],
            "variance": centroids[i][variance_idx],
        })

    # Sort clusters by accuracy descending to assign personalities meaningfully
    sorted_by_accuracy = sorted(cluster_profiles, key=lambda x: x["accuracy"], reverse=True)

    mapping = {}
    used_personalities = set()

    for profile in sorted_by_accuracy:
        cid = profile["cluster_id"]
        acc = profile["accuracy"]
        speed = profile["avg_time"]
        lifeline = profile["lifeline_rate"]
        variance = profile["variance"]

        # High accuracy, low lifeline use, multiple regions -> Mewtwo
        if acc > 0.7 and lifeline < 0.2 and "Mewtwo" not in used_personalities:
            mapping[cid] = "Mewtwo"
        # Fast + decent accuracy + low lifeline -> Charizard
        elif speed < 7 and lifeline < 0.25 and "Charizard" not in used_personalities:
            mapping[cid] = "Charizard"
        # High accuracy + slow -> Snorlax
        elif acc > 0.65 and speed > 12 and "Snorlax" not in used_personalities:
            mapping[cid] = "Snorlax"
        # Low accuracy + high lifeline -> Psyduck
        elif acc < 0.45 and lifeline > 0.3 and "Psyduck" not in used_personalities:
            mapping[cid] = "Psyduck"
        # High variance -> Gengar
        elif variance > 0.25 and "Gengar" not in used_personalities:
            mapping[cid] = "Gengar"
        # Fast + uses lifelines a lot -> Pikachu
        elif speed < 10 and lifeline > 0.25 and "Pikachu" not in used_personalities:
            mapping[cid] = "Pikachu"
        # Low everything -> Piplup
        elif acc < 0.5 and "Piplup" not in used_personalities:
            mapping[cid] = "Piplup"
        else:
            mapping[cid] = "Eevee"

        used_personalities.add(mapping[cid])

    # Fill any remaining clusters with unused personalities, fallback to Eevee
    remaining = [p for p in PERSONALITY_NAMES if p not in used_personalities]
    for cid in range(k):
        if cid not in mapping:
            mapping[cid] = remaining.pop(0) if remaining else "Eevee"

    return mapping