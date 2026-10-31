from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from app.core.security import verify_password, create_access_token, decode_access_token
from app.core.database import get_db_connection

router = APIRouter(prefix="/auth", tags=["Authentication"])


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]


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

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, full_name, role, department FROM users WHERE email = ?", (payload["sub"],))
    user = cursor.fetchone()
    conn.close()

    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")

    return dict(user)


@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest):
    """Authenticate with email and password, returning JWT access token."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (req.email.lower().strip(),))
    user_row = cursor.fetchone()
    conn.close()

    if not user_row:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    user = dict(user_row)
    if not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = create_access_token({
        "sub": user["email"],
        "role": user["role"],
        "name": user["full_name"],
        "dept": user.get("department")
    })

    user_info = {
        "id": user["id"],
        "email": user["email"],
        "full_name": user["full_name"],
        "role": user["role"],
        "department": user["department"]
    }

    return LoginResponse(access_token=token, user=user_info)


@router.get("/me")
def me(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Retrieve currently authenticated user profile."""
    return current_user


@router.get("/demo-accounts")
def get_demo_accounts():
    """Retrieve demo login accounts for one-click authentication in the UI."""
    return DEMO_ACCOUNTS
