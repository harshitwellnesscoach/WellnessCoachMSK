from pydantic import BaseModel, Field
from typing import Literal


class ProgramExercise(BaseModel):
    exercise_id: str
    name: str
    type: Literal["cv", "self_paced"]
    sets: int = Field(..., ge=1, le=5)
    reps: int = Field(..., ge=1, le=30)
    hold_seconds: int | None = None
    rest_seconds: int = Field(default=30, ge=0, le=120)
    rationale: str | None = None


class GeneratedProgram(BaseModel):
    week_number: int = 1
    exercises: list[ProgramExercise]
    program_notes: str | None = None
    generated_by: Literal["claude", "fallback"] = "claude"