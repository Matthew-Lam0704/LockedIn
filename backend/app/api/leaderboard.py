"""Leaderboard endpoint."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.study_session import StudySession
from app.schemas.leaderboard import LeaderboardEntry
from app.api.deps import get_current_user

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])


@router.get("", response_model=list[LeaderboardEntry])
async def get_leaderboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(50, ge=1, le=100),
):
    subq = (
        select(
            StudySession.user_id,
            func.coalesce(func.sum(StudySession.duration_seconds), 0).label("total_seconds"),
        )
        .where(StudySession.duration_seconds.isnot(None))
        .group_by(StudySession.user_id)
    ).subquery()
    stmt = (
        select(User.id, User.username, func.coalesce(subq.c.total_seconds, 0).label("total_study_seconds"))
        .select_from(User)
        .outerjoin(subq, User.id == subq.c.user_id)
        .order_by(func.coalesce(subq.c.total_seconds, 0).desc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    rows = result.all()
    return [
        LeaderboardEntry(
            rank=i + 1,
            user_id=row.id,
            username=row.username,
            total_study_seconds=int(row.total_study_seconds or 0),
        )
        for i, row in enumerate(rows)
    ]
