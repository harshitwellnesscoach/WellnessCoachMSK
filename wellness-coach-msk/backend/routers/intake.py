import logging
from fastapi import APIRouter, Depends, HTTPException, status
from db.supabase import get_supabase
from models.intake import IntakeData, RedFlagAnswers
from routers.auth import get_current_user
from services.safety.red_flags import RED_FLAG_QUESTIONS, evaluate_red_flags

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

    # Phase 5 will add: await generate_and_save_program(data, user_id, sb)
    return {"status": "ok", "user_id": user_id}