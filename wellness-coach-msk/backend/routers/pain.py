import logging
from fastapi import APIRouter, Depends

from db.supabase import get_supabase
from models.outcomes import PainLog
from routers.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/pain", tags=["pain"])


@router.post("/log")
async def log_pain(
    payload: PainLog,
    user_id: str = Depends(get_current_user),
) -> dict:
    sb = get_supabase()
    sb.table("pain_logs").insert(
        {
            "user_id": user_id,
            "nprs": payload.nprs,
            "context": payload.context,
            "session_id": payload.session_id,
        }
    ).execute()
    logger.info("pain_log user=%s nprs=%d", user_id, payload.nprs)
    return {"ok": True}


@router.get("/trend")
async def get_pain_trend(user_id: str = Depends(get_current_user)) -> dict:
    """
    Phase 4: returns 14 zeros.
    Phase 9: replace with real query from services/outcomes/pain_trend.py
    """
    return {
        "trend": [{"date": None, "avg_nprs": 0.0} for _ in range(14)],
    }