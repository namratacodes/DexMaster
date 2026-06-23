from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# Player schemas
class PlayerCreate(BaseModel):
    name: str
    device_id: str

class PlayerResponse(BaseModel):
    id: str
    name: str
    skill_score: int
    rank: str
    personality: str
    regions_completed: int
    wcs_completed: bool
    created_at: datetime

    class Config:
        from_attributes = True

class PlayerUpdate(BaseModel):
    skill_score: Optional[int] = None
    rank: Optional[str] = None
    personality: Optional[str] = None
    regions_completed: Optional[int] = None
    wcs_completed: Optional[bool] = None

# Session schemas
class SessionCreate(BaseModel):
    player_id: str
    region: str

class SessionEnd(BaseModel):
    result: str
    questions_attempted: int
    questions_correct: int
    lifelines_used: int

# Question attempt schemas
class AttemptCreate(BaseModel):
    session_id: str
    player_id: str
    question_id: str
    question_text: str
    category: str
    region: str
    difficulty: int
    gym_level: int
    answered_correctly: bool
    time_taken_seconds: Optional[float] = None
    lifeline_used: bool = False
    selected_option: Optional[int] = None
    correct_option: int

# Analytics schemas
class PlayerStats(BaseModel):
    total_games: int
    total_questions: int
    correct_answers: int
    accuracy: float
    avg_time: float
    best_streak: int
    regions_completed: int
    skill_score: int
    rank: str
    personality: str
    strongest_category: str
    weakest_category: str
    category_breakdown: dict = {}

# K-Means clustering schemas
class ClusterResult(BaseModel):
    player_id: str
    player_name: str
    cluster_id: int
    personality: str
    accuracy: float
    avg_time: float
    lifeline_rate: float
    category_variance: float

class ClusteringResponse(BaseModel):
    status: str
    total_players_clustered: int
    clusters: list[ClusterResult] = []
    cluster_centroids: dict = {}
    message: Optional[str] = None