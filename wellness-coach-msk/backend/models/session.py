from pydantic import BaseModel, Field
from typing import Optional


class RepData(BaseModel):
    exercise_id: str
    set_number: int = Field(..., ge=1)
    rep_number: int = Field(..., ge=1)
    form_score: Optional[int] = Field(default=None, ge=0, le=100)
    landmarks_snapshot: Optional[dict] = None


class CompleteSessionPayload(BaseModel):
    pre_pain_nprs: int = Field(..., ge=0, le=10)
    post_pain_nprs: int = Field(..., ge=0, le=10)
    reps: list[RepData]