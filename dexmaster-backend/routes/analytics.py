from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from database import get_db
from models import Player, QuestionAttempt, GameSession
from collections import defaultdict
from ml.clustering import run_clustering
from ml.predictor import train_model

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("/leaderboard")
def get_leaderboard(db: Session = Depends(get_db)):
    players = db.query(Player).order_by(
        Player.skill_score.desc()
    ).limit(10).all()

    return [
        {
            "position": i + 1,
            "name": p.name,
            "skill_score": p.skill_score,
            "rank": p.rank,
            "regions_completed": p.regions_completed,
            "personality": p.personality,
            "wcs_completed": p.wcs_completed,
        }
        for i, p in enumerate(players)
    ]

@router.get("/hardest-questions")
def get_hardest_questions(db: Session = Depends(get_db)):
    attempts = db.query(QuestionAttempt).all()

    question_stats = defaultdict(lambda: {"total": 0, "wrong": 0, "text": "", "category": "", "difficulty": 0})

    for a in attempts:
        qid = a.question_id
        question_stats[qid]["total"] += 1
        question_stats[qid]["text"] = a.question_text
        question_stats[qid]["category"] = a.category
        question_stats[qid]["difficulty"] = a.difficulty
        if not a.answered_correctly:
            question_stats[qid]["wrong"] += 1

    results = []
    for qid, stats in question_stats.items():
        if stats["total"] >= 2:
            failure_rate = stats["wrong"] / stats["total"]
            results.append({
                "question_id": qid,
                "question_text": stats["text"],
                "category": stats["category"],
                "difficulty": stats["difficulty"],
                "total_attempts": stats["total"],
                "failure_rate": round(failure_rate, 3),
                "failure_pct": round(failure_rate * 100, 1),
            })

    results.sort(key=lambda x: x["failure_rate"], reverse=True)
    return results[:10]

@router.get("/category-performance")
def get_category_performance(db: Session = Depends(get_db)):
    attempts = db.query(QuestionAttempt).all()

    cat_stats = defaultdict(lambda: {"total": 0, "correct": 0})
    for a in attempts:
        cat_stats[a.category]["total"] += 1
        if a.answered_correctly:
            cat_stats[a.category]["correct"] += 1

    return [
        {
            "category": cat,
            "total_attempts": stats["total"],
            "correct": stats["correct"],
            "accuracy": round(stats["correct"] / stats["total"], 3) if stats["total"] > 0 else 0,
            "accuracy_pct": round((stats["correct"] / stats["total"]) * 100, 1) if stats["total"] > 0 else 0,
        }
        for cat, stats in cat_stats.items()
    ]

@router.get("/region-performance")
def get_region_performance(db: Session = Depends(get_db)):
    attempts = db.query(QuestionAttempt).all()

    region_stats = defaultdict(lambda: {"total": 0, "correct": 0, "times": []})
    for a in attempts:
        region_stats[a.region]["total"] += 1
        if a.answered_correctly:
            region_stats[a.region]["correct"] += 1
        if a.time_taken_seconds:
            region_stats[a.region]["times"].append(a.time_taken_seconds)

    return [
        {
            "region": region,
            "total_attempts": stats["total"],
            "accuracy_pct": round((stats["correct"] / stats["total"]) * 100, 1) if stats["total"] > 0 else 0,
            "avg_time": round(sum(stats["times"]) / len(stats["times"]), 2) if stats["times"] else 0,
        }
        for region, stats in region_stats.items()
    ]

@router.get("/skill-distribution")
def get_skill_distribution(db: Session = Depends(get_db)):
    players = db.query(Player).all()

    distribution = {
        "Beginner Trainer": 0,
        "Gym Challenger": 0,
        "Elite Trainer": 0,
        "Pokémon Master": 0,
    }

    for p in players:
        if p.rank in distribution:
            distribution[p.rank] += 1

    return [
        {"rank": rank, "count": count}
        for rank, count in distribution.items()
    ]

@router.get("/personality-distribution")
def get_personality_distribution(db: Session = Depends(get_db)):
    players = db.query(Player).all()

    dist = defaultdict(int)
    for p in players:
        dist[p.personality] += 1

    return [
        {"personality": k, "count": v}
        for k, v in dist.items()
    ]

@router.get("/daily-activity")
def get_daily_activity(db: Session = Depends(get_db)):
    sessions = db.query(GameSession).all()

    daily = defaultdict(int)
    for s in sessions:
        day = s.started_at.strftime("%Y-%m-%d")
        daily[day] += 1

    return [
        {"date": date, "sessions": count}
        for date, count in sorted(daily.items())
    ]

@router.get("/overview")
def get_overview(db: Session = Depends(get_db)):
    total_players = db.query(Player).count()
    total_sessions = db.query(GameSession).count()
    total_attempts = db.query(QuestionAttempt).count()
    wcs_champions = db.query(Player).filter(Player.wcs_completed == True).count()

    attempts = db.query(QuestionAttempt).all()
    overall_accuracy = 0
    if attempts:
        correct = sum(1 for a in attempts if a.answered_correctly)
        overall_accuracy = round((correct / len(attempts)) * 100, 1)

    return {
        "total_players": total_players,
        "total_sessions": total_sessions,
        "total_attempts": total_attempts,
        "wcs_champions": wcs_champions,
        "overall_accuracy_pct": overall_accuracy,
    }
    
@router.post("/run-clustering")
def trigger_clustering(db: Session = Depends(get_db)):
    result = run_clustering(db, n_clusters=8)
    return result

@router.post("/train-difficulty-model")
def trigger_training(db: Session = Depends(get_db)):
    result = train_model(db)
    return result