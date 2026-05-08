from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from db.supabase import get_supabase

router = APIRouter(prefix="/auth", tags=["auth"])

_bearer = HTTPBearer()


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(_bearer)],
) -> str:
    """
    FastAPI dependency. Verifies the token via Supabase's /auth/v1/user endpoint
    and returns the user_id. Avoids any local JWT secret mismatch issues.
    """
    token = credentials.credentials
    sb = get_supabase()
    try:
        response = sb.auth.get_user(token)
        if response.user is None:
            raise ValueError("No user returned")
        return response.user.id
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc