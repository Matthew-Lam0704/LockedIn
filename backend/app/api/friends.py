"""Friends and friend requests endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.friend import FriendRequest, Friendship, FriendRequestStatus
from app.schemas.friend import FriendRequestCreate, FriendRequestResponse, FriendRequestStatusUpdate, FriendshipResponse
from app.schemas.user import UserPublic
from app.api.deps import get_current_user

router = APIRouter(prefix="/friends", tags=["friends"])


@router.post("/requests", response_model=FriendRequestResponse)
async def send_friend_request(
    data: FriendRequestCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if data.to_user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot send request to yourself")
    result = await db.execute(select(User).where(User.id == data.to_user_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    # Check existing request or friendship
    existing = await db.execute(
        select(FriendRequest).where(
            FriendRequest.from_user_id == current_user.id,
            FriendRequest.to_user_id == data.to_user_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Friend request already sent")
    # Check friendship
    existing_f = await db.execute(
        select(Friendship).where(
            or_(
                (Friendship.user_id == current_user.id) & (Friendship.friend_id == data.to_user_id),
                (Friendship.user_id == data.to_user_id) & (Friendship.friend_id == current_user.id),
            )
        )
    )
    if existing_f.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already friends")
    req = FriendRequest(from_user_id=current_user.id, to_user_id=data.to_user_id)
    db.add(req)
    await db.flush()
    await db.refresh(req)
    return req


@router.get("/requests", response_model=list[FriendRequestResponse])
async def list_received_requests(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(FriendRequest).where(
            FriendRequest.to_user_id == current_user.id,
            FriendRequest.status == FriendRequestStatus.PENDING.value,
        ).order_by(FriendRequest.created_at.desc())
    )
    return list(result.scalars().all())


@router.patch("/requests/{request_id}", response_model=FriendRequestResponse)
async def respond_to_friend_request(
    request_id: int,
    data: FriendRequestStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(FriendRequest).where(
            FriendRequest.id == request_id,
            FriendRequest.to_user_id == current_user.id,
            FriendRequest.status == FriendRequestStatus.PENDING.value,
        )
    )
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    req.status = data.status
    if data.status == FriendRequestStatus.ACCEPTED.value:
        db.add(Friendship(user_id=current_user.id, friend_id=req.from_user_id))
        db.add(Friendship(user_id=req.from_user_id, friend_id=current_user.id))
    await db.flush()
    await db.refresh(req)
    return req


@router.get("", response_model=list[UserPublic])
async def list_friends(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).join(Friendship, Friendship.friend_id == User.id).where(
            Friendship.user_id == current_user.id
        )
    )
    return [UserPublic.model_validate(u) for u in result.scalars().all()]
