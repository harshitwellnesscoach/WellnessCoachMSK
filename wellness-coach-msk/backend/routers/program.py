import logging

from fastapi import APIRouter, Depends, HTTPException, status

from db.supabase import get_supabase
from models.intake import IntakeData
from models.program import GeneratedProgram
from routers.auth import get_current_user
from services.ai.program_generator import generate_program

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/program", tags=["program"])


@router.post("/generate", response_model=GeneratedProgram)
async def generate_and_save(
    intake: IntakeData,
    user_id: str = Depends(get_current_user),
) -> GeneratedProgram:
    """Generate a Week 1 programme for the given intake and save to program_weeks."""
    program = await generate_program(intake)
    sb = get_supabase()
    sb.table("program_weeks").upsert(
        {
            "user_id": user_id,
            "week_number": program.week_number,
            "exercises": [e.model_dump() for e in program.exercises],
            "program_notes": program.program_notes,
            "generated_by": program.generated_by,
        },
        on_conflict="user_id,week_number",
    ).execute()
    logger.info("program saved user=%s week=%d by=%s", user_id, program.week_number, program.generated_by)
    return program


@router.get("/current", response_model=GeneratedProgram)
async def get_current_program(
    user_id: str = Depends(get_current_user),
) -> GeneratedProgram:
    """Return the member's most recent program week."""
    sb = get_supabase()
    resp = (
        sb.table("program_weeks")
        .select("*")
        .eq("user_id", user_id)
        .order("week_number", desc=True)
        .limit(1)
        .execute()
    )
    if not resp.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No programme found. Complete onboarding first.",
        )
    row = resp.data[0]
    return GeneratedProgram(
        week_number=row["week_number"],
        exercises=row["exercises"],
        program_notes=row.get("program_notes"),
        generated_by=row.get("generated_by", "fallback"),
    )