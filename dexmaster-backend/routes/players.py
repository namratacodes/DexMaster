from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import Player, QuestionAttempt, GameSession
from schemas import PlayerCreate, PlayerResponse, PlayerUpdate, PlayerStats
from collections import defaultdict

router = APIRouter(prefix="/api/players", tags=["players"])

@router.post("/", response_model=PlayerResponse)
def create_player(player: PlayerCreate, db: Session = Depends(get_db)):
    # Check if this device + name combo already exists
    existing = db.query(Player).filter(
        Player.device_id == player.device_id,
        Player.name == player.name
    ).first()
    if existing:
        return existing

    new_player = Player(name=player.name, device_id=player.device_id)
    db.add(new_player)
    db.commit()
    db.refresh(new_player)
    return new_player

@router.get("/{player_id}", response_model=PlayerResponse)
def get_player(player_id: str, db: Session = Depends(get_db)):
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return player

@router.get("/by-name/{name}", response_model=PlayerResponse)
def get_player_by_name(name: str, db: Session = Depends(get_db)):
    player = db.query(Player).filter(Player.name == name).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return player

@router.put("/{player_id}", response_model=PlayerResponse)
def update_player(player_id: str, update: PlayerUpdate, db: Session = Depends(get_db)):
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    for field, value in update.dict(exclude_none=True).items():
        setattr(player, field, value)

    db.commit()
    db.refresh(player)
    return player

@router.get("/{player_id}/stats", response_model=PlayerStats)
def get_player_stats(player_id: str, db: Session = Depends(get_db)):
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    attempts = db.query(QuestionAttempt).filter(
        QuestionAttempt.player_id == player_id
    ).all()

    if not attempts:
        return PlayerStats(
            total_games=0, total_questions=0, correct_answers=0,
            accuracy=0.0, avg_time=0.0, best_streak=0,
            regions_completed=player.regions_completed,
            skill_score=player.skill_score, rank=player.rank,
            personality=player.personality,
            strongest_category="N/A", weakest_category="N/A",
            category_breakdown={}
        )

    total = len(attempts)
    correct = sum(1 for a in attempts if a.answered_correctly)
    accuracy = correct / total if total > 0 else 0
    times = [a.time_taken_seconds for a in attempts if a.time_taken_seconds]
    avg_time = sum(times) / len(times) if times else 0

    # Category accuracy
    cat_correct = defaultdict(int)
    cat_total = defaultdict(int)
    for a in attempts:
        cat_total[a.category] += 1
        if a.answered_correctly:
            cat_correct[a.category] += 1

    cat_accuracy = {
        cat: round(cat_correct[cat] / cat_total[cat], 3)
        for cat in cat_total
    }

    strongest = max(cat_accuracy, key=cat_accuracy.get) if cat_accuracy else "N/A"
    weakest = min(cat_accuracy, key=cat_accuracy.get) if cat_accuracy else "N/A"

    # Best streak
    streak = 0
    best_streak = 0
    for a in sorted(attempts, key=lambda x: x.answered_at):
        if a.answered_correctly:
            streak += 1
            best_streak = max(best_streak, streak)
        else:
            streak = 0

    total_games = db.query(GameSession).filter(
        GameSession.player_id == player_id
    ).count()

    return PlayerStats(
        total_games=total_games,
        total_questions=total,
        correct_answers=correct,
        accuracy=round(accuracy, 3),
        avg_time=round(avg_time, 2),
        best_streak=best_streak,
        regions_completed=player.regions_completed,
        skill_score=player.skill_score,
        rank=player.rank,
        personality=player.personality,
        strongest_category=strongest,
        weakest_category=weakest,
        category_breakdown=cat_accuracy,
    )

@router.get("/leaderboard/top")
def get_leaderboard(db: Session = Depends(get_db)):
    players = db.query(Player).order_by(
        Player.skill_score.desc()
    ).limit(10).all()

    return [
        {
            "rank": i + 1,
            "name": p.name,
            "skill_score": p.skill_score,
            "rank_title": p.rank,
            "regions_completed": p.regions_completed,
            "personality": p.personality,
        }
        for i, p in enumerate(players)
    ]