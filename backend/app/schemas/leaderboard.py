"""Leaderboard schemas."""
from pydantic import BaseModel


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: int
    username: str
    total_study_seconds: int
