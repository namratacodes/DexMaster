from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import GameSession, Player
from schemas import SessionCreate, SessionEnd
from datetime import datetime

router = APIRouter(prefix="/api/sessions", tags=["sessions"])

@router.post("/start")
def start_session(data: SessionCreate, db: Session = Depends(get_db)):
    session = GameSession(
        player_id=data.player_id,
        region=data.region,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return {"session_id": session.id}

@router.put("/{session_id}/end")
def end_session(session_id: str, data: SessionEnd, db: Session = Depends(get_db)):
    session = db.query(GameSession).filter(GameSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.ended_at = datetime.utcnow()
    session.result = data.result
    session.questions_attempted = data.questions_attempted
    session.questions_correct = data.questions_correct
    session.lifelines_used = data.lifelines_used

    db.commit()
    return {"message": "Session ended"}