from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class Player(Base):
    __tablename__ = "players"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    device_id = Column(String(60), nullable=True)
    name = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    skill_score = Column(Integer, default=0)
    rank = Column(String(50), default="Beginner Trainer")
    personality = Column(String(30), default="Eevee")
    regions_completed = Column(Integer, default=0)
    wcs_completed = Column(Boolean, default=False)

    sessions = relationship("GameSession", back_populates="player")
    attempts = relationship("QuestionAttempt", back_populates="player")


class GameSession(Base):
    __tablename__ = "game_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    player_id = Column(String(36), ForeignKey("players.id"))
    region = Column(String(30), nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    questions_attempted = Column(Integer, default=0)
    questions_correct = Column(Integer, default=0)
    lifelines_used = Column(Integer, default=0)
    result = Column(String(10), default="ongoing")
    # result: "win", "loss", "ongoing"

    player = relationship("Player", back_populates="sessions")
    attempts = relationship("QuestionAttempt", back_populates="session")


class QuestionAttempt(Base):
    __tablename__ = "question_attempts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("game_sessions.id"))
    player_id = Column(String(36), ForeignKey("players.id"))
    question_id = Column(String(50), nullable=False)
    question_text = Column(Text, nullable=False)
    category = Column(String(50), nullable=False)
    region = Column(String(30), nullable=False)
    difficulty = Column(Integer, nullable=False)
    gym_level = Column(Integer, nullable=False)
    answered_correctly = Column(Boolean, nullable=False)
    time_taken_seconds = Column(Float, nullable=True)
    lifeline_used = Column(Boolean, default=False)
    selected_option = Column(Integer, nullable=True)
    correct_option = Column(Integer, nullable=False)
    answered_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("GameSession", back_populates="attempts")
    player = relationship("Player", back_populates="attempts")