"""Study session endpoints."""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.study_session import StudySession
from app.schemas.session import StudySessionResponse, StudySessionInProgress
from app.api.deps import get_current_user

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("", response_model=StudySessionInProgress)
async def start_session(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Check for existing in-progress session
    result = await db.execute(
        select(StudySession).where(
            StudySession.user_id == current_user.id,
            StudySession.ended_at.is_(None),
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have a session in progress. End it before starting a new one.",
        )
    session = StudySession(user_id=current_user.id)
    db.add(session)
    await db.flush()
    await db.refresh(session)
    return session


@router.patch("/{session_id}/end", response_model=StudySessionResponse)
async def end_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(StudySession).where(
            StudySession.id == session_id,
            StudySession.user_id == current_user.id,
            StudySession.ended_at.is_(None),
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found or already ended")
    now = datetime.now(timezone.utc)
    session.ended_at = now
    session.duration_seconds = int((now - session.started_at).total_seconds())
    await db.flush()
    await db.refresh(session)
    return session


@router.get("", response_model=list[StudySessionResponse])
async def list_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = 50,
):
    result = await db.execute(
        select(StudySession)
        .where(StudySession.user_id == current_user.id)
        .order_by(StudySession.started_at.desc())
        .limit(limit)
    )
    return list(result.scalars().all())


@router.get("/current", response_model=StudySessionInProgress | None)
async def get_current_session(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(StudySession).where(
            StudySession.user_id == current_user.id,
            StudySession.ended_at.is_(None),
        )
    )
    return result.scalar_one_or_none()
