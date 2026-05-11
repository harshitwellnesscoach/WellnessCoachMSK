from pydantic import BaseModel, Field
from typing import Literal


class PainLog(BaseModel):
    nprs: int = Field(..., ge=0, le=10)
    context: Literal["pre_session", "post_session", "daily_log"] = "daily_log"
    session_id: str | None = None