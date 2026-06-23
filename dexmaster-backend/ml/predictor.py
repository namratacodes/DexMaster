import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, classification_report
from sklearn.preprocessing import StandardScaler
import joblib
import os

MODEL_PATH = "ml/difficulty_model.pkl"
SCALER_PATH = "ml/scaler.pkl"

def extract_features(attempt: dict) -> list:
    """
    Extract features from a question attempt dict.
    Used both for training and real-time prediction.
    """
    return [
        attempt.get("accuracy_so_far", 0.5),
        attempt.get("current_streak", 0),
        attempt.get("avg_response_time", 10),
        attempt.get("question_difficulty", 5),
        attempt.get("lifelines_remaining", 2),
        attempt.get("category_accuracy", 0.5),
        attempt.get("questions_attempted", 0),
        attempt.get("gym_level", 1),
    ]

def train_model(db_session):
    """
    Train the difficulty prediction model from database data.
    Call this after enough data is collected (500+ attempts recommended).
    """
    from models import QuestionAttempt, GameSession

    attempts = db_session.query(QuestionAttempt).all()

    if len(attempts) < 50:
        return {"error": "Not enough data to train. Need at least 50 attempts.", "count": len(attempts)}

    # Build training data
    rows = []
    for a in attempts:
        rows.append({
            "accuracy_so_far": 0.5,        # placeholder — real value needs session context
            "current_streak": 0,            # placeholder
            "avg_response_time": a.time_taken_seconds or 10,
            "question_difficulty": a.difficulty,
            "lifelines_remaining": 2,       # placeholder
            "category_accuracy": 0.5,       # placeholder
            "questions_attempted": 1,       # placeholder
            "gym_level": a.gym_level,
            "answered_correctly": int(a.answered_correctly),
        })

    df = pd.DataFrame(rows)

    feature_cols = [
        "accuracy_so_far", "current_streak", "avg_response_time",
        "question_difficulty", "lifelines_remaining", "category_accuracy",
        "questions_attempted", "gym_level"
    ]

    X = df[feature_cols]
    y = df["answered_correctly"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Train Random Forest
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=6,
        random_state=42,
        class_weight="balanced"
    )
    model.fit(X_train_scaled, y_train)

    # Evaluate
    y_pred = model.predict(X_test_scaled)
    y_proba = model.predict_proba(X_test_scaled)[:, 1]

    try:
        auc = roc_auc_score(y_test, y_proba)
    except:
        auc = 0.0

    # Save model and scaler
    os.makedirs("ml", exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)

    return {
        "status": "trained",
        "total_samples": len(df),
        "roc_auc": round(auc, 3),
        "report": classification_report(y_test, y_pred, output_dict=True),
    }

def predict_success(player_stats: dict, question_difficulty: int) -> int:
    """
    Predict probability of success for next question.
    Uses ML model if available, falls back to rule-based formula.
    """

    # Try ML model first
    if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
        try:
            model = joblib.load(MODEL_PATH)
            scaler = joblib.load(SCALER_PATH)

            features = extract_features({
                **player_stats,
                "question_difficulty": question_difficulty,
            })

            features_scaled = scaler.transform([features])
            prob = model.predict_proba(features_scaled)[0][1]
            return int(round(prob * 100))

        except Exception as e:
            print(f"ML prediction failed, using rule-based: {e}")

    # Rule-based fallback
    accuracy = player_stats.get("accuracy_so_far", 0.5)
    if np.isnan(accuracy):
        accuracy = 0.5

    streak = player_stats.get("current_streak", 0)
    lifelines = player_stats.get("lifelines_remaining", 2)
    avg_time = player_stats.get("avg_response_time", 10)
    cat_accuracy = player_stats.get("category_accuracy", 0.5)

    prob = accuracy * 40
    prob += min(streak * 3, 15)
    prob += (10 - question_difficulty) * 4
    prob += max(0, 10 - avg_time) * 1.5
    prob += cat_accuracy * 20
    prob += lifelines * 3

    return int(min(95, max(5, round(prob))))