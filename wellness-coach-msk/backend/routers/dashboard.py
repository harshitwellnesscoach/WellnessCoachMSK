import logging
from fastapi import APIRouter, Depends

from db.supabase import get_supabase
from routers.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats")
async def get_dashboard_stats(user_id: str = Depends(get_current_user)) -> dict:
    """
    Returns stats for the dashboard.
    Phase 4: returns zeros.
    Phase 9: replace with real queries.
    """
    sb = get_supabase()

    # --- Session count ---
    sessions_resp = (
        sb.table("sessions")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .eq("status", "completed")
        .execute()
    )
    total_sessions = sessions_resp.count or 0

    # --- Current week number ---
    weeks_resp = (
        sb.table("program_weeks")
        .select("week_number")
        .eq("user_id", user_id)
        .order("week_number", desc=True)
        .limit(1)
        .execute()
    )
    current_week = weeks_resp.data[0]["week_number"] if weeks_resp.data else 1

    return {
        "total_sessions": total_sessions,
        "streak_days": 0,          # Phase 9: calculate from pain_logs dates
        "avg_form_score": None,    # Phase 9: avg from session_reps
        "latest_odi_score": None,  # Phase 9: from odi_submissions
        "current_week": current_week,
    }