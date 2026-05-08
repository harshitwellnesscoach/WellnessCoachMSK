from pydantic import BaseModel, Field
from typing import Literal


class RedFlagAnswers(BaseModel):
    bowel_bladder: bool = False
    saddle_numbness: bool = False
    progressive_weakness: bool = False
    unexplained_weight_loss: bool = False
    night_pain: bool = False
    fever: bool = False


class IntakeData(BaseModel):
    pain_location: Literal[
        "lower_back_central",
        "lower_back_left",
        "lower_back_right",
        "bilateral_leg",
        "left_leg",
        "right_leg",
    ]
    nprs_baseline: int = Field(..., ge=0, le=10)
    duration_weeks: int = Field(..., ge=0, description="How many weeks they have had pain")
    prior_care: bool = Field(default=False, description="Has seen physio or GP for this episode")
    occupation: Literal["desk", "manual", "mixed", "retired_student_other"] | None = None
    notes: str | None = Field(default=None, max_length=500)