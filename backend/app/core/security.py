import os
import hashlib
import secrets
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import jwt

logger = logging.getLogger(__name__)

# Resolve secret from environment:
# 1. Primary: CIT_SECRET_KEY
# 2. Backward compatibility fallback: TECH_ZEPHYR_SECRET_KEY
_secret = os.getenv("CIT_SECRET_KEY") or os.getenv("TECH_ZEPHYR_SECRET_KEY")
_app_env = (os.getenv("APP_ENV") or "").lower().strip()

if _secret:
    SECRET_KEY = _secret
elif _app_env == "production":
    raise RuntimeError(
        "Production startup failure: Neither CIT_SECRET_KEY nor TECH_ZEPHYR_SECRET_KEY is configured in production environment (APP_ENV=production). "
        "A secure random secret must be configured for JWT signing in production deployments. "
        "Generate one using: python -c \"import secrets; print(secrets.token_urlsafe(48))\" and set CIT_SECRET_KEY."
    )
else:
    SECRET_KEY = secrets.token_urlsafe(48)
    logger.warning(
        "WARNING: Neither CIT_SECRET_KEY nor TECH_ZEPHYR_SECRET_KEY is set. "
        "Generated an ephemeral random secret at import time for development/test mode. "
        "All active authentication tokens will be invalidated on server restart. "
        "Set CIT_SECRET_KEY to persist tokens across restarts."
    )

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours


def hash_password(password: str, salt: Optional[str] = None) -> str:
    """Hash password using standard PBKDF2-HMAC-SHA256 with 100,000 iterations."""
    if not salt:
        salt = secrets.token_hex(16)
    hashed = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100000,
    ).hex()
    return f"{salt}${hashed}"


def verify_password(plain_password: str, password_hash: str) -> bool:
    """Verify password against salt$hash string."""
    try:
        salt, hashed = password_hash.split("$", 1)
        expected = hash_password(plain_password, salt=salt)
        return secrets.compare_digest(f"{salt}${hashed}", expected)
    except Exception:
        return False


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate JWT access token."""
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except Exception:
        return None

