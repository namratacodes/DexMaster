from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import QuestionAttempt
from schemas import AttemptCreate

router = APIRouter(prefix="/api/attempts", tags=["attempts"])

@router.post("/log")
def log_attempt(data: AttemptCreate, db: Session = Depends(get_db)):
    attempt = QuestionAttempt(**data.dict())
    db.add(attempt)
    db.commit()
    return {"message": "Attempt logged"}

@router.get("/hardest")
def get_hardest_questions(db: Session = Depends(get_db)):
    from sqlalchemy import func
    results = db.query(
        QuestionAttempt.question_id,
        QuestionAttempt.question_text,
        QuestionAttempt.category,
        QuestionAttempt.difficulty,
        func.count(QuestionAttempt.id).label("total"),
        func.sum(
            func.cast(QuestionAttempt.answered_correctly == False, db.bind.dialect.name == 'mysql' and 'UNSIGNED' or 'INTEGER')
        ).label("wrong"),
    ).group_by(
        QuestionAttempt.question_id,
        QuestionAttempt.question_text,
        QuestionAttempt.category,
        QuestionAttempt.difficulty,
    ).having(func.count(QuestionAttempt.id) >= 3
    ).order_by(func.count(QuestionAttempt.id).desc()
    ).limit(10).all()

    return [
        {
            "question_id": r.question_id,
            "question_text": r.question_text,
            "category": r.category,
            "difficulty": r.difficulty,
            "total_attempts": r.total,
        }
        for r in results
    ]