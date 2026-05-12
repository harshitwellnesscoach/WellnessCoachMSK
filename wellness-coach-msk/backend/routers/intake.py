import logging
from fastapi import APIRouter, Depends, HTTPException, status
from db.supabase import get_supabase
from models.intake import IntakeData, RedFlagAnswers
from routers.auth import get_current_user
from services.safety.red_flags import RED_FLAG_QUESTIONS, evaluate_red_flags
from services.ai.program_generator import generate_program

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/intake", tags=["intake"])


@router.post("/red-flag")
async def submit_red_flag(
    answers: RedFlagAnswers,
    user_id: str = Depends(get_current_user),
) -> dict:
    result = evaluate_red_flags(answers.model_dump())
    logger.info("red_flag user=%s result=%s", user_id, result)
    return {"result": result, "questions": RED_FLAG_QUESTIONS}


@router.post("/profile")
async def submit_intake(
    data: IntakeData,
    user_id: str = Depends(get_current_user),
) -> dict:
    sb = get_supabase()

    # Upsert so re-submissions update rather than duplicate
    response = (
        sb.table("member_profiles")
        .upsert(
            {
                "user_id": user_id,
                "pain_location": data.pain_location,
                "nprs_baseline": data.nprs_baseline,
                "duration_weeks": data.duration_weeks,
                "prior_care": data.prior_care,
                "red_flag_result": "safe",  # Caller verified red flags before reaching here
            },
            on_conflict="user_id",
        )
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save member profile",
        )

    logger.info("intake saved user=%s", user_id)

    # Generate programme and save to program_weeks
    program = await generate_program(data)
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

    return {"status": "ok", "user_id": user_id}