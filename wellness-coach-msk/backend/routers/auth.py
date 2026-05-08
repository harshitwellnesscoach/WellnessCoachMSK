import os
from typing import Annotated

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

router = APIRouter(prefix="/auth", tags=["auth"])

load_dotenv()

_bearer = HTTPBearer()


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(_bearer)],
) -> str:
    """
    FastAPI dependency. Validates the Supabase JWT and returns the user_id (sub claim).

    Usage in a route:
        @router.get("/me")
        async def me(user_id: str = Depends(get_current_user)):
            return {"user_id": user_id}
    """
    token = credentials.credentials
    jwt_secret = os.environ["SUPABASE_JWT_SECRET"]

    try:
        payload = jwt.decode(
            token,
            jwt_secret,
            algorithms=["HS256"],
            options={"verify_aud": False},  # Supabase JWTs have no standard audience
        )
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise ValueError("No sub claim in token")
        return user_id
    except (JWTError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc