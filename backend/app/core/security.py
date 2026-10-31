import os
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import jwt

SECRET_KEY = os.getenv("TECH_ZEPHYR_SECRET_KEY", "tech-zephyr-cit-secret-key-2026-hackathon-token")
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

