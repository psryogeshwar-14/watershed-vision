"""
app/api/auth.py
────────────────
JWT authentication router (placeholder with full working implementation).

Endpoints
─────────
POST /auth/register    Create a new user account
POST /auth/login       Exchange credentials for a JWT access token
GET  /auth/me          Return current user info (requires Bearer token)
"""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr

from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])

# ── Password hashing ──────────────────────────────────────────────────────────

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def _hash_password(password: str) -> str:
    return pwd_context.hash(password)


def _verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# ── In-memory user store (replace with DB model in production) ────────────────
# For a production system: create a User SQLAlchemy model and query the DB.

_USERS: dict[str, dict] = {}  # keyed by email


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    created_at: str


# ── JWT helpers ───────────────────────────────────────────────────────────────

def _create_access_token(subject: str) -> tuple[str, datetime]:
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": subject, "exp": expire, "iat": datetime.utcnow()}
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return token, expire


def _decode_token(token: str) -> str:
    """Decode JWT and return the subject (email)."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        sub: Optional[str] = payload.get("sub")
        if sub is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
            )
        return sub
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """FastAPI dependency: resolve Bearer token to user dict."""
    email = _decode_token(token)
    user = _USERS.get(email)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return user


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest) -> Any:
    """Register a new user account."""
    if body.email in _USERS:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )
    user_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    _USERS[body.email] = {
        "id": user_id,
        "email": body.email,
        "full_name": body.full_name,
        "hashed_password": _hash_password(body.password),
        "created_at": now,
    }
    return UserResponse(
        id=user_id,
        email=body.email,
        full_name=body.full_name,
        created_at=now,
    )


@router.post("/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends()) -> Any:
    """Exchange email + password for a JWT access token."""
    user = _USERS.get(form_data.username)
    if user is None or not _verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token, expire = _create_access_token(user["email"])
    return TokenResponse(
        access_token=token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: dict = Depends(get_current_user)) -> Any:
    """Return the authenticated user's profile."""
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        full_name=current_user["full_name"],
        created_at=current_user["created_at"],
    )
