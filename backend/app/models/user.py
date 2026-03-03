"""User model."""
from datetime import datetime
from sqlalchemy import String, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    """User account."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    study_sessions: Mapped[list["StudySession"]] = relationship(
        "StudySession", back_populates="user", cascade="all, delete-orphan"
    )
    sent_friend_requests: Mapped[list["FriendRequest"]] = relationship(
        "FriendRequest", foreign_keys="FriendRequest.from_user_id", back_populates="from_user"
    )
    received_friend_requests: Mapped[list["FriendRequest"]] = relationship(
        "FriendRequest", foreign_keys="FriendRequest.to_user_id", back_populates="to_user"
    )
    friendships_as_user: Mapped[list["Friendship"]] = relationship(
        "Friendship", foreign_keys="Friendship.user_id", back_populates="user"
    )
    friendships_as_friend: Mapped[list["Friendship"]] = relationship(
        "Friendship", foreign_keys="Friendship.friend_id", back_populates="friend"
    )
