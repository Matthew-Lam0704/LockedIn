"""Friend and friend request schemas."""
from datetime import datetime
from pydantic import BaseModel


class FriendRequestCreate(BaseModel):
    to_user_id: int


class FriendRequestStatusUpdate(BaseModel):
    status: str  # "accepted" | "rejected"


class FriendRequestResponse(BaseModel):
    id: int
    from_user_id: int
    to_user_id: int
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class FriendshipResponse(BaseModel):
    id: int
    user_id: int
    friend_id: int
    created_at: datetime

    model_config = {"from_attributes": True}
