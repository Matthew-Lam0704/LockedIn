"""Study session schemas."""
from datetime import datetime
from pydantic import BaseModel


class StudySessionCreate(BaseModel):
    pass  # start session, no body needed


class StudySessionInProgress(BaseModel):
    id: int
    user_id: int
    started_at: datetime

    model_config = {"from_attributes": True}


class StudySessionResponse(BaseModel):
    id: int
    user_id: int
    started_at: datetime
    ended_at: datetime | None
    duration_seconds: int | None

    model_config = {"from_attributes": True}
