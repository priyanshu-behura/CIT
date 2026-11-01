import re
import time
import secrets
import hashlib
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, Depends, Header, Request, status
from pydantic import BaseModel, Field, EmailStr
from app.core.security import verify_password, hash_password, create_access_token, decode_access_token
from app.core.database import get_db_connection
from app.core.mongo import get_mongo_db
from app.services.email_service import send_password_reset_email

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Rate limit tracking stores (in-memory sliding window)
_failed_login_attempts: Dict[str, List[float]] = {}
_reset_request_attempts: Dict[str, List[float]] = {}

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
SPECIAL_CHARS = set("!@#$%^&*()_+-=[]{}|;:,.<>?")


def validate_password_strength(password: str) -> Optional[str]:
    """Validate password against institutional security policy."""
    if len(password) < 8:
        return "Password must be at least 8 characters long."
    if not any(c.isupper() for c in password):
        return "Password must contain at least one uppercase letter (A-Z)."
    if not any(c.islower() for c in password):
        return "Password must contain at least one lowercase letter (a-z)."
    if not any(c.isdigit() for c in password):
        return "Password must contain at least one numeric digit (0-9)."
    if not any(c in SPECIAL_CHARS for c in password):
        return "Password must contain at least one special character (!@#$%^&* etc.)."
    return None


def check_rate_limit(store: Dict[str, List[float]], key: str, max_attempts: int, window_seconds: float) -> bool:
    """Return True if under rate limit, False if rate limit exceeded."""
    now = time.time()
    attempts = [t for t in store.get(key, []) if now - t < window_seconds]
    if len(attempts) >= max_attempts:
        store[key] = attempts
        return False
    attempts.append(now)
    store[key] = attempts
    return True


# ----------------------------------------------------
# Request & Response Models
# ----------------------------------------------------

class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]


class RegisterRequest(BaseModel):
    full_name: str
    email: str
    registration_no: Optional[str] = None
    department: str
    password: str
    confirm_password: str
    role: Optional[str] = None  # Strictly validated against privilege escalation


class RegisterResponse(BaseModel):
    message: str
    user: Dict[str, Any]


class ForgotPasswordRequest(BaseModel):
    email: str


class VerifyTokenRequest(BaseModel):
    token: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
    confirm_password: str


class MessageResponse(BaseModel):
    message: str


# Demo accounts for one-click reviewer convenience
DEMO_ACCOUNTS = [
    {
        "role": "admin",
        "role_label": "Dean & Administrator",
        "email": "admin@cit.edu",
        "password": "Admin@123",
        "full_name": "Dr. Rajeshwar Jena",
        "department": "ADMIN",
        "badge_color": "rose",
        "description": "Full institutional authority, timetable generation, official approvals & exports."
    },
    {
        "role": "coordinator",
        "role_label": "Department Coordinator",
        "email": "coordinator.cse@cit.edu",
        "password": "Coord@123",
        "full_name": "Prof. Ananya Patra",
        "department": "CSE",
        "badge_color": "blue",
        "description": "Department timetable view, faculty allocation, student group tracking."
    },
    {
        "role": "faculty",
        "role_label": "Faculty Member",
        "email": "faculty.sm@cit.edu",
        "password": "Faculty@123",
        "full_name": "Dr. Smruti Mohapatra",
        "department": "CSE",
        "badge_color": "emerald",
        "description": "Personal teaching schedule, classroom assignments, availability preferences."
    },
    {
        "role": "club",
        "role_label": "Club Representative",
        "email": "club.robotics@cit.edu",
        "password": "Club@123",
        "full_name": "Rohan Das",
        "department": "CLUBS",
        "badge_color": "amber",
        "description": "Spectra week event booking requests, venue status, alternative suggestions."
    }
]


def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """Dependency to retrieve and authenticate user from Authorization Bearer token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Missing or invalid authentication token.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    token = authorization.split(" ", 1)[1]
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=401,
            detail="Token expired or invalid signature.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    email = payload["sub"]

    # 1. Primary: Retrieve user from MongoDB Atlas
    try:
        mongo_db = get_mongo_db()
        m_user = mongo_db.users.find_one({"email": email})
        if m_user:
            return {
                "id": m_user.get("id", 1),
                "email": m_user["email"],
                "full_name": m_user.get("full_name", ""),
                "role": m_user.get("role", "student"),
                "department": m_user.get("department", "CSE"),
                "registration_no": m_user.get("registration_no")
            }
    except Exception as me:
        logger.warning(f"MongoDB Atlas user fetch notice: {me}")

    # 2. Resilient Fallback: Historical SQLite archive
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, email, full_name, role, department, registration_no FROM users WHERE email = ?",
        (email,)
    )
    user = cursor.fetchone()
    conn.close()

    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")

    return dict(user)


# ----------------------------------------------------
# 1. Login Endpoint (with brute-force abuse protection)
# ----------------------------------------------------

@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest, request: Request):
    """Authenticate with email and password, returning JWT access token."""
    client_ip = request.client.host if request.client else "unknown"
    normalized_email = req.email.lower().strip()
    rate_key = f"{client_ip}:{normalized_email}"

    # Check for excessive failed login attempts (max 10 failed attempts within 5 minutes)
    now = time.time()
    recent_failures = [t for t in _failed_login_attempts.get(rate_key, []) if now - t < 300]
    if len(recent_failures) >= 10:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed login attempts. Please wait 5 minutes before trying again."
        )

    user: Optional[Dict[str, Any]] = None

    # 1. Primary: Lookup in MongoDB Atlas
    try:
        mongo_db = get_mongo_db()
        m_user = mongo_db.users.find_one({"email": normalized_email})
        if m_user and m_user.get("password_hash"):
            user = {
                "id": m_user.get("id", 1),
                "email": m_user["email"],
                "password_hash": m_user["password_hash"],
                "full_name": m_user.get("full_name", ""),
                "role": m_user.get("role", "student"),
                "department": m_user.get("department", "CSE"),
                "registration_no": m_user.get("registration_no")
            }
    except Exception as me:
        logger.warning(f"MongoDB Atlas login query notice: {me}")

    # 2. Resilient Fallback: Historical SQLite archive
    if not user:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE email = ?", (normalized_email,))
        user_row = cursor.fetchone()
        conn.close()
        if user_row:
            user = dict(user_row)
            # Sync user back to MongoDB Atlas
            try:
                mongo_db = get_mongo_db()
                mongo_db.users.replace_one({"email": normalized_email}, user, upsert=True)
            except Exception:
                pass

    if not user:
        # Record failed attempt
        recent_failures.append(now)
        _failed_login_attempts[rate_key] = recent_failures
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if not verify_password(req.password, user["password_hash"]):
        # Record failed attempt
        recent_failures.append(now)
        _failed_login_attempts[rate_key] = recent_failures
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    # Successful login: clear failed attempts
    if rate_key in _failed_login_attempts:
        del _failed_login_attempts[rate_key]

    token = create_access_token({
        "sub": user["email"],
        "role": user["role"],
        "name": user["full_name"],
        "dept": user.get("department")
    })

    user_info = {
        "id": user.get("id", 1),
        "email": user["email"],
        "full_name": user["full_name"],
        "role": user["role"],
        "department": user["department"],
        "registration_no": user.get("registration_no")
    }

    return LoginResponse(access_token=token, user=user_info)


# ----------------------------------------------------
# 2. Register Endpoint (Strict student role security)
# ----------------------------------------------------

@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest):
    """
    Register a new student account.
    Strictly forbids self-registration as admin, coordinator, faculty, or club.
    """
    # 1. Full name validation
    full_name = req.full_name.strip()
    if len(full_name) < 2:
        raise HTTPException(status_code=400, detail="Full name must be at least 2 characters long.")

    # 2. Email format validation
    normalized_email = req.email.lower().strip()
    if not EMAIL_REGEX.match(normalized_email):
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")

    # 3. Department validation
    dept = req.department.strip().upper()
    if not dept:
        raise HTTPException(status_code=400, detail="Please select a valid academic department.")

    # 4. Role Security Enforcement
    # Never allow public users to self-register with privileged roles
    if req.role and req.role.lower().strip() not in ("", "student"):
        logger.warning(
            "Privilege escalation attempt blocked: Registration payload attempted to specify privileged role '%s' for email '%s'",
            req.role, normalized_email
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Privilege escalation denied: Public self-registration is strictly restricted to student accounts. Contact institutional administration for privileged access."
        )

    assigned_role = "student"

    # 5. Password match validation
    if req.password != req.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match. Please re-enter matching passwords.")

    # 6. Password strength validation
    strength_error = validate_password_strength(req.password)
    if strength_error:
        raise HTTPException(status_code=400, detail=strength_error)

    # 7. Registration Number validation (optional, where applicable)
    reg_no = req.registration_no.strip().upper() if req.registration_no and req.registration_no.strip() else None

    # Check duplicate email in MongoDB Atlas
    try:
        mongo_db = get_mongo_db()
        if mongo_db.users.find_one({"email": normalized_email}):
            raise HTTPException(
                status_code=400,
                detail="An account with this email address is already registered. Please sign in or use the Forgot Password link."
            )
        if reg_no and mongo_db.users.find_one({"registration_no": reg_no}):
            raise HTTPException(
                status_code=400,
                detail=f"An account with registration number '{reg_no}' is already registered."
            )
    except HTTPException:
        raise
    except Exception as me:
        logger.warning(f"MongoDB duplicate check notice: {me}")

    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if email is already registered in SQLite
    cursor.execute("SELECT id FROM users WHERE email = ?", (normalized_email,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(
            status_code=400,
            detail="An account with this email address is already registered. Please sign in or use the Forgot Password link."
        )

    # Check if registration number is already registered in SQLite
    if reg_no:
        cursor.execute("SELECT id FROM users WHERE registration_no = ?", (reg_no,))
        if cursor.fetchone():
            conn.close()
            raise HTTPException(
                status_code=400,
                detail=f"An account with registration number '{reg_no}' is already registered."
            )

    # 8. Create user with hashed password
    now_iso = datetime.now(timezone.utc).isoformat()
    pwd_hash = hash_password(req.password)

    cursor.execute("""
        INSERT INTO users (email, password_hash, full_name, role, department, registration_no, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (normalized_email, pwd_hash, full_name, assigned_role, dept, reg_no, now_iso))

    new_user_id = cursor.lastrowid

    # Log audit entry
    cursor.execute("""
        INSERT INTO audit_logs (user_email, action, details, timestamp)
        VALUES (?, 'USER_REGISTRATION', ?, ?)
    """, (normalized_email, f"New student account registered (dept: {dept}, reg: {reg_no or 'N/A'})", now_iso))

    conn.commit()
    conn.close()

    # Save to MongoDB Atlas users collection
    try:
        mongo_db = get_mongo_db()
        mongo_user_doc = {
            "id": new_user_id,
            "email": normalized_email,
            "password_hash": pwd_hash,
            "full_name": full_name,
            "role": assigned_role,
            "department": dept,
            "registration_no": reg_no,
            "created_at": now_iso
        }
        mongo_db.users.replace_one({"email": normalized_email}, mongo_user_doc, upsert=True)
    except Exception as me:
        logger.warning(f"MongoDB user save notice: {me}")

    logger.info("New student account successfully registered and saved to MongoDB & SQLite: %s (dept: %s)", normalized_email, dept)

    return RegisterResponse(
        message="Account created successfully. You can now log in with your credentials.",
        user={
            "id": new_user_id,
            "email": normalized_email,
            "full_name": full_name,
            "role": assigned_role,
            "department": dept,
            "registration_no": reg_no
        }
    )


# ----------------------------------------------------
# 3. Forgot Password Endpoint (Neutral response, no user enumeration)
# ----------------------------------------------------

@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(req: ForgotPasswordRequest, request: Request):
    """
    Initiate a secure password reset process.
    Always returns a neutral confirmation message to prevent user account enumeration.
    """
    normalized_email = req.email.lower().strip()
    client_ip = request.client.host if request.client else "unknown"
    rate_key = f"{client_ip}:{normalized_email}"

    # Rate limiting: Max 5 requests per 10 minutes
    if not check_rate_limit(_reset_request_attempts, rate_key, max_attempts=5, window_seconds=600):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many password reset requests. Please wait a few minutes before trying again."
        )

    # Validate email format
    if not EMAIL_REGEX.match(normalized_email):
        # Even on malformed email, we return a 400 so the user corrects their typo
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, full_name FROM users WHERE email = ?", (normalized_email,))
    user_row = cursor.fetchone()

    if user_row:
        user = dict(user_row)
        now_utc = datetime.now(timezone.utc)

        # Invalidate any prior unused tokens for this user
        cursor.execute("""
            UPDATE password_reset_tokens
            SET used_at = ?
            WHERE user_id = ? AND used_at IS NULL
        """, (now_utc.isoformat(), user["id"]))

        # Generate cryptographically secure single-use token (32 bytes url-safe)
        plain_token = secrets.token_urlsafe(32)
        # Store only SHA-256 hash of token in the database
        token_hash = hashlib.sha256(plain_token.encode("utf-8")).hexdigest()

        # Set 15-minute expiration
        expires_at = (now_utc + timedelta(minutes=15)).isoformat()

        cursor.execute("""
            INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, used_at, created_at)
            VALUES (?, ?, ?, NULL, ?)
        """, (user["id"], token_hash, expires_at, now_utc.isoformat()))

        conn.commit()

        # Dispatch email (or log link in development mode)
        send_password_reset_email(user["email"], user["full_name"], plain_token)

    conn.close()

    # Always return a neutral confirmation message that never reveals whether an account exists
    return MessageResponse(
        message="If an account with that email exists, we have sent a secure password reset link to your inbox."
    )


# ----------------------------------------------------
# 4. Verify Reset Token Endpoint
# ----------------------------------------------------

@router.post("/verify-reset-token")
def verify_reset_token(req: VerifyTokenRequest):
    """Verify whether a password reset token is valid, unused, and unexpired."""
    token = req.token.strip()
    if not token:
        raise HTTPException(status_code=400, detail="Reset token is required.")

    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT t.id, t.user_id, t.expires_at, t.used_at, u.email
        FROM password_reset_tokens t
        JOIN users u ON u.id = t.user_id
        WHERE t.token_hash = ?
        ORDER BY t.id DESC LIMIT 1
    """, (token_hash,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=400, detail="Invalid or unrecognized password reset token.")

    record = dict(row)
    if record["used_at"] is not None:
        raise HTTPException(
            status_code=400,
            detail="This password reset token has already been used. Please request a new link."
        )

    expires_at = datetime.fromisoformat(record["expires_at"])
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=400,
            detail="This password reset token has expired. Reset links are valid for 15 minutes. Please request a new link."
        )

    # Return masked email for confirmation display
    email = record["email"]
    parts = email.split("@")
    if len(parts) == 2:
        user_part = parts[0]
        masked = user_part[0] + "***" + (user_part[-1] if len(user_part) > 1 else "") + "@" + parts[1]
    else:
        masked = "***@cit.edu"

    return {
        "valid": True,
        "email_masked": masked
    }


# ----------------------------------------------------
# 5. Reset Password Endpoint
# ----------------------------------------------------

@router.post("/reset-password", response_model=MessageResponse)
def reset_password(req: ResetPasswordRequest):
    """
    Reset account password using a validated single-use token.
    Invalidates the token immediately upon successful password update.
    """
    token = req.token.strip()
    if not token:
        raise HTTPException(status_code=400, detail="Reset token is required.")

    if req.new_password != req.confirm_password:
        raise HTTPException(status_code=400, detail="New passwords do not match. Please ensure both fields match.")

    # Validate password strength
    strength_error = validate_password_strength(req.new_password)
    if strength_error:
        raise HTTPException(status_code=400, detail=strength_error)

    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT t.id, t.user_id, t.expires_at, t.used_at, u.email
        FROM password_reset_tokens t
        JOIN users u ON u.id = t.user_id
        WHERE t.token_hash = ?
        ORDER BY t.id DESC LIMIT 1
    """, (token_hash,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid or unrecognized password reset token.")

    record = dict(row)
    if record["used_at"] is not None:
        conn.close()
        raise HTTPException(
            status_code=400,
            detail="This password reset token has already been used. Please request a new link."
        )

    expires_at = datetime.fromisoformat(record["expires_at"])
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        conn.close()
        raise HTTPException(
            status_code=400,
            detail="This password reset token has expired. Reset links are valid for 15 minutes. Please request a new link."
        )

    # Hash the new password with salt
    now_iso = datetime.now(timezone.utc).isoformat()
    new_password_hash = hash_password(req.new_password)

    # Update password in SQLite
    cursor.execute("UPDATE users SET password_hash = ? WHERE id = ?", (new_password_hash, record["user_id"]))

    # Update password in MongoDB Atlas
    try:
        mongo_db = get_mongo_db()
        mongo_db.users.update_one(
            {"$or": [{"id": record["user_id"]}, {"email": record["email"]}]},
            {"$set": {"password_hash": new_password_hash}}
        )
    except Exception as me:
        logger.warning(f"MongoDB password update notice: {me}")

    # Invalidate token by setting used_at
    cursor.execute("UPDATE password_reset_tokens SET used_at = ? WHERE id = ?", (now_iso, record["id"]))

    # Log audit entry
    cursor.execute("""
        INSERT INTO audit_logs (user_email, action, details, timestamp)
        VALUES (?, 'PASSWORD_RESET', 'Password successfully updated via single-use reset token', ?)
    """, (record["email"], now_iso))

    conn.commit()
    conn.close()

    logger.info("Password successfully reset for user %s via token id %s", record["email"], record["id"])

    return MessageResponse(
        message="Your password has been successfully reset. You may now sign in with your new credentials."
    )


# ----------------------------------------------------
# 6. Profile & Demo Account Info
# ----------------------------------------------------

@router.get("/me")
def me(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Retrieve currently authenticated user profile."""
    return current_user


@router.get("/demo-accounts")
def get_demo_accounts():
    """Retrieve demo login accounts for one-click authentication in the UI."""
    return DEMO_ACCOUNTS


@router.get("/departments")
def get_departments():
    """Retrieve list of valid academic departments for registration."""
    return [
        {"code": "CSE", "name": "Computer Science & Engineering"},
        {"code": "ECE", "name": "Electronics & Communication Engineering"},
        {"code": "EE", "name": "Electrical Engineering"},
        {"code": "ME", "name": "Mechanical Engineering"},
        {"code": "CE", "name": "Civil Engineering"},
        {"code": "COMMON", "name": "First Year Common Engineering"},
        {"code": "HSS", "name": "Humanities & Social Sciences"},
        {"code": "MA", "name": "Mathematics"},
        {"code": "PH", "name": "Physics"},
    ]
