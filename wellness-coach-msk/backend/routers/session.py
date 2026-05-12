import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from db.supabase import get_supabase
from models.session import CompleteSessionPayload
from routers.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/session", tags=["session"])


@router.post("/start")
async def start_session(
    week_number: int = 1,
    user_id: str = Depends(get_current_user),
) -> dict:
    sb = get_supabase()
    result = (
        sb.table("sessions")
        .insert(
            {
                "user_id": user_id,
                "week_number": week_number,
                "status": "in_progress",
            }
        )
        .execute()
    )
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create session",
        )
    session_id = result.data[0]["id"]
    logger.info("session_start user=%s session=%s", user_id, session_id)
    return {"session_id": session_id}


@router.post("/{session_id}/complete")
async def complete_session(
    session_id: str,
    payload: CompleteSessionPayload,
    user_id: str = Depends(get_current_user),
) -> dict:
    sb = get_supabase()

    # Verify session belongs to this user
    check = (
        sb.table("sessions")
        .select("id")
        .eq("id", session_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not check.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    # Update session
    sb.table("sessions").update(
        {
            "status": "completed",
            "completed_at": datetime.now(timezone.utc).isoformat(),
            "pre_pain_nprs": payload.pre_pain_nprs,
            "post_pain_nprs": payload.post_pain_nprs,
        }
    ).eq("id", session_id).execute()

    # Insert rep data
    if payload.reps:
        rep_rows = [
            {
                "session_id": session_id,
                "user_id": user_id,
                "exercise_id": rep.exercise_id,
                "set_number": rep.set_number,
                "rep_number": rep.rep_number,
                "form_score": rep.form_score,
                "landmarks_snapshot": rep.landmarks_snapshot,
            }
            for rep in payload.reps
        ]
        sb.table("session_reps").insert(rep_rows).execute()

    # Insert pain logs for pre/post
    sb.table("pain_logs").insert(
        [
            {
                "user_id": user_id,
                "session_id": session_id,
                "nprs": payload.pre_pain_nprs,
                "context": "pre_session",
            },
            {
                "user_id": user_id,
                "session_id": session_id,
                "nprs": payload.post_pain_nprs,
                "context": "post_session",
            },
        ]
    ).execute()

    logger.info(
        "session_complete user=%s session=%s reps=%d",
        user_id,
        session_id,
        len(payload.reps),
    )
    return {"ok": True}