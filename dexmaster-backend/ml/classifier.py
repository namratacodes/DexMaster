import numpy as np
from collections import defaultdict

PERSONALITY_PROFILES = {
    "Mewtwo": {
        "title": "Strategic Mastermind",
        "description": "Cold, calculated, devastatingly accurate.",
        "strength": "Exceptional accuracy across all categories",
        "weakness": "May overthink simple questions",
        "types": ["Psychic"],
        "color": "#9B59B6",
        "hp": 195,
        "pokemon_id": 150,
    },
    "Charizard": {
        "title": "The Risk Taker",
        "description": "Fast, bold, and fearless.",
        "strength": "Lightning-fast responses under pressure",
        "weakness": "Speed sometimes beats out accuracy",
        "types": ["Fire", "Flying"],
        "color": "#E74C3C",
        "hp": 178,
        "pokemon_id": 6,
    },
    "Snorlax": {
        "title": "The Steady Giant",
        "description": "Unhurried and methodical.",
        "strength": "High accuracy, rarely makes mistakes",
        "weakness": "Slow response time under pressure",
        "types": ["Normal"],
        "color": "#7F8C8D",
        "hp": 160,
        "pokemon_id": 143,
    },
    "Pikachu": {
        "title": "The Energetic Trainer",
        "description": "Quick, enthusiastic, always ready.",
        "strength": "Consistent energy and fast responses",
        "weakness": "Relies on lifelines when unsure",
        "types": ["Electric"],
        "color": "#F1C40F",
        "hp": 155,
        "pokemon_id": 25,
    },
    "Psyduck": {
        "title": "The Confused Scholar",
        "description": "Brilliant but inconsistent.",
        "strength": "Surprisingly correct on random tough questions",
        "weakness": "High lifeline dependency",
        "types": ["Water", "Psychic"],
        "color": "#3498DB",
        "hp": 130,
        "pokemon_id": 54,
    },
    "Piplup": {
        "title": "The Determined Beginner",
        "description": "Still learning but never giving up.",
        "strength": "Improving accuracy over time",
        "weakness": "Early stage trainer",
        "types": ["Water"],
        "color": "#5DADE2",
        "hp": 125,
        "pokemon_id": 393,
    },
    "Gengar": {
        "title": "The Unpredictable Ghost",
        "description": "Nobody knows what you will do next.",
        "strength": "Clutch correct answers on hardest questions",
        "weakness": "Wildly inconsistent performance",
        "types": ["Ghost", "Poison"],
        "color": "#8E44AD",
        "hp": 145,
        "pokemon_id": 94,
    },
    "Eevee": {
        "title": "The Balanced Trainer",
        "description": "Jack of all trades, pure potential.",
        "strength": "Consistent across all categories",
        "weakness": "Yet to find their specialization",
        "types": ["Normal"],
        "color": "#D4AC0D",
        "hp": 140,
        "pokemon_id": 133,
    },
}

def classify_from_db(player_id: str, db_session) -> str:
    """
    Classify player personality from actual database records.
    More accurate than frontend rule-based since it uses all historical data.
    """
    from models import QuestionAttempt

    attempts = db_session.query(QuestionAttempt).filter(
        QuestionAttempt.player_id == player_id
    ).all()

    if not attempts:
        return "Eevee"

    total = len(attempts)
    correct = sum(1 for a in attempts if a.answered_correctly)
    accuracy = correct / total if total > 0 else 0.5

    times = [a.time_taken_seconds for a in attempts if a.time_taken_seconds]
    avg_time = sum(times) / len(times) if times else 10

    lifelines_used = sum(1 for a in attempts if a.lifeline_used)

    # Category accuracy variance
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

    variance = np.std(cat_accuracies) if len(cat_accuracies) > 1 else 0

    from models import Player
    player = db_session.query(Player).filter(Player.id == player_id).first()
    regions_completed = player.regions_completed if player else 0

    # Classification logic
    if accuracy > 0.78 and regions_completed >= 3 and lifelines_used <= 2:
        return "Mewtwo"
    if avg_time < 7 and lifelines_used <= 1 and accuracy > 0.55:
        return "Charizard"
    if accuracy > 0.70 and avg_time > 13:
        return "Snorlax"
    if accuracy < 0.45 and lifelines_used >= 3:
        return "Psyduck"
    if variance > 0.3 and total >= 10:
        return "Gengar"
    if regions_completed == 0 and total < 15:
        return "Piplup"
    if avg_time < 10 and lifelines_used >= 2:
        return "Pikachu"

    return "Eevee"

def calculate_skill_score(player_id: str, db_session) -> int:
    """
    Calculate ELO-style skill score from database records.
    """
    from models import QuestionAttempt, Player

    attempts = db_session.query(QuestionAttempt).filter(
        QuestionAttempt.player_id == player_id
    ).all()

    player = db_session.query(Player).filter(Player.id == player_id).first()

    if not attempts:
        return 0

    total = len(attempts)
    correct = sum(1 for a in attempts if a.answered_correctly)
    accuracy = correct / total if total > 0 else 0

    times = [a.time_taken_seconds for a in attempts if a.time_taken_seconds]
    avg_time = sum(times) / len(times) if times else 10

    regions_completed = player.regions_completed if player else 0

    # Streak calculation
    streak = 0
    best_streak = 0
    for a in sorted(attempts, key=lambda x: x.answered_at):
        if a.answered_correctly:
            streak += 1
            best_streak = max(best_streak, streak)
        else:
            streak = 0

    accuracy_score = accuracy * 40
    speed_score = max(0, 10 - avg_time) * 2
    region_score = regions_completed * 8
    streak_bonus = min(best_streak * 2, 10)

    total_score = accuracy_score + speed_score + region_score + streak_bonus
    return round(total_score * 40)

def get_rank(skill_score: int) -> str:
    if skill_score >= 3000:
        return "Pokémon Master"
    if skill_score >= 1800:
        return "Elite Trainer"
    if skill_score >= 800:
        return "Gym Challenger"
    return "Beginner Trainer"