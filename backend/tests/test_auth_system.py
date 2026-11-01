import pytest
import sqlite3
import hashlib
import time
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import get_db_connection, init_db
from app.core.security import verify_password

client = TestClient(app)


@pytest.fixture(autouse=True)
def ensure_database():
    """Ensure database tables and migrations are initialized before test run."""
    init_db()


def test_scenario_1_register_valid_student_account():
    """Scenario 1: Register a valid new student account."""
    unique_email = f"student.test.{int(time.time()*1000)}@cit.edu"
    payload = {
        "full_name": "Priyanka Mishra",
        "email": unique_email,
        "registration_no": f"CIT-{int(time.time()*1000)}",
        "department": "CSE",
        "password": "Password@123",
        "confirm_password": "Password@123"
    }

    resp = client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 201, f"Failed: {resp.text}"
    data = resp.json()
    assert "user" in data
    assert data["user"]["email"] == unique_email
    assert data["user"]["role"] == "student"
    assert data["user"]["department"] == "CSE"
    assert data["user"]["registration_no"] == payload["registration_no"]

    # Verify user in database
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT email, role, password_hash, registration_no FROM users WHERE email = ?", (unique_email,))
    row = cursor.fetchone()
    conn.close()
    assert row is not None
    assert row["role"] == "student"
    assert verify_password("Password@123", row["password_hash"])


def test_scenario_2_attempt_duplicate_email():
    """Scenario 2: Attempt registration using an already registered email."""
    # admin@cit.edu is an existing seeded account
    payload = {
        "full_name": "Imposter Student",
        "email": "admin@cit.edu",
        "registration_no": "CIT-DUPL-001",
        "department": "CSE",
        "password": "Password@123",
        "confirm_password": "Password@123"
    }

    resp = client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 400
    assert "already registered" in resp.json()["detail"].lower()


def test_scenario_3_invalid_email_and_mismatched_password():
    """Scenario 3: Submit invalid email and mismatched passwords."""
    # 3A: Invalid email format
    resp_bad_email = client.post("/api/v1/auth/register", json={
        "full_name": "Bad Email User",
        "email": "not-a-valid-email",
        "department": "ECE",
        "password": "Password@123",
        "confirm_password": "Password@123"
    })
    assert resp_bad_email.status_code == 400
    assert "valid email" in resp_bad_email.json()["detail"].lower()

    # 3B: Mismatched passwords
    resp_mismatch = client.post("/api/v1/auth/register", json={
        "full_name": "Mismatch User",
        "email": f"mismatch.{int(time.time())}@cit.edu",
        "department": "ECE",
        "password": "Password@123",
        "confirm_password": "DifferentPassword@456"
    })
    assert resp_mismatch.status_code == 400
    assert "do not match" in resp_mismatch.json()["detail"].lower()

    # 3C: Weak password (no special char, no digit)
    resp_weak = client.post("/api/v1/auth/register", json={
        "full_name": "Weak Pwd User",
        "email": f"weak.{int(time.time())}@cit.edu",
        "department": "ME",
        "password": "password",
        "confirm_password": "password"
    })
    assert resp_weak.status_code == 400
    assert "special character" in resp_weak.json()["detail"].lower() or "uppercase" in resp_weak.json()["detail"].lower()


def test_scenario_4_privilege_escalation_denied():
    """Scenario 4: Attempt to register with a privileged role through a modified API request."""
    privileged_roles = ["admin", "coordinator", "faculty", "club", "superadmin"]
    for priv_role in privileged_roles:
        payload = {
            "full_name": "Malicious Attacker",
            "email": f"attacker.{priv_role}.{int(time.time()*1000)}@cit.edu",
            "department": "ADMIN",
            "password": "Password@123",
            "confirm_password": "Password@123",
            "role": priv_role  # Attempting privilege escalation
        }
        resp = client.post("/api/v1/auth/register", json=payload)
        # Must be rejected with 403 Forbidden
        assert resp.status_code == 403, f"Expected 403 for role {priv_role}, got {resp.status_code}: {resp.text}"
        assert "privilege escalation denied" in resp.json()["detail"].lower()


def test_scenario_5_login_with_demo_accounts():
    """Scenario 5: Log in with an existing demo account."""
    demo_creds = [
        ("admin@cit.edu", "Admin@123", "admin"),
        ("coordinator.cse@cit.edu", "Coord@123", "coordinator"),
        ("faculty.sm@cit.edu", "Faculty@123", "faculty"),
        ("club.robotics@cit.edu", "Club@123", "club"),
    ]
    for email, password, expected_role in demo_creds:
        resp = client.post("/api/v1/auth/login", json={"email": email, "password": password})
        assert resp.status_code == 200, f"Login failed for {email}: {resp.text}"
        data = resp.json()
        assert "access_token" in data
        assert data["user"]["role"] == expected_role
        assert data["user"]["email"] == email


def test_scenario_6_password_reset_request_registered_email():
    """Scenario 6: Request a password reset for a registered email."""
    test_email = "faculty.sm@cit.edu"
    resp = client.post("/api/v1/auth/forgot-password", json={"email": test_email})
    assert resp.status_code == 200
    data = resp.json()
    assert "password reset link" in data["message"].lower()

    # Verify a hashed token record was stored in the database
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT t.id, t.token_hash, t.expires_at, t.used_at
        FROM password_reset_tokens t
        JOIN users u ON u.id = t.user_id
        WHERE u.email = ? AND t.used_at IS NULL
        ORDER BY t.id DESC LIMIT 1
    """, (test_email,))
    row = cursor.fetchone()
    conn.close()

    assert row is not None
    assert len(row["token_hash"]) == 64  # SHA-256 hex length
    assert row["used_at"] is None


def test_scenario_7_password_reset_request_unregistered_email():
    """Scenario 7: Request a password reset for an unregistered email without revealing account existence."""
    unregistered_email = f"nonexistent.{int(time.time()*1000)}@cit.edu"
    resp = client.post("/api/v1/auth/forgot-password", json={"email": unregistered_email})
    assert resp.status_code == 200
    data = resp.json()
    # Confirmation message MUST be neutral and identical to scenario 6
    assert "if an account with that email exists" in data["message"].lower()

    # Ensure no token was generated in database
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE email = ?", (unregistered_email,))
    assert cursor.fetchone() is None
    conn.close()


def test_scenario_8_reset_password_with_valid_token():
    """Scenario 8: Reset a password using a valid token."""
    # 1. Create a dedicated test student
    reset_test_email = f"reset.user.{int(time.time()*1000)}@cit.edu"
    client.post("/api/v1/auth/register", json={
        "full_name": "Reset Test User",
        "email": reset_test_email,
        "department": "CSE",
        "password": "OldPassword@123",
        "confirm_password": "OldPassword@123"
    })

    # 2. Trigger forgot-password
    client.post("/api/v1/auth/forgot-password", json={"email": reset_test_email})

    # 3. Retrieve generated token hash from database and inject a known plain token for test
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE email = ?", (reset_test_email,))
    user_id = cursor.fetchone()["id"]

    test_plain_token = f"secret-token-xyz-{int(time.time()*1000)}-abcdef"
    test_token_hash = hashlib.sha256(test_plain_token.encode("utf-8")).hexdigest()
    expires_at = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()

    cursor.execute("""
        INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, used_at, created_at)
        VALUES (?, ?, ?, NULL, ?)
    """, (user_id, test_token_hash, expires_at, datetime.now(timezone.utc).isoformat()))
    conn.commit()
    conn.close()

    # 4. Verify token endpoint
    verify_resp = client.post("/api/v1/auth/verify-reset-token", json={"token": test_plain_token})
    assert verify_resp.status_code == 200
    assert verify_resp.json()["valid"] is True

    # 5. Perform password reset
    reset_resp = client.post("/api/v1/auth/reset-password", json={
        "token": test_plain_token,
        "new_password": "BrandNewPassword@999",
        "confirm_password": "BrandNewPassword@999"
    })
    assert reset_resp.status_code == 200
    assert "successfully reset" in reset_resp.json()["message"].lower()

    # 6. Verify token is marked as used
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT used_at FROM password_reset_tokens WHERE token_hash = ?", (test_token_hash,))
    token_row = cursor.fetchone()
    conn.close()
    assert token_row["used_at"] is not None


def test_scenario_9_prevent_reuse_of_used_and_expired_tokens():
    """Scenario 9: Attempt to reuse an expired or already-used token."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE email = 'admin@cit.edu'")
    admin_id = cursor.fetchone()["id"]

    # 9A: Already used token
    used_token = f"already-used-token-{int(time.time()*1000)}"
    used_hash = hashlib.sha256(used_token.encode("utf-8")).hexdigest()
    cursor.execute("""
        INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, used_at, created_at)
        VALUES (?, ?, ?, ?, ?)
    """, (admin_id, used_hash, (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat(),
          datetime.now(timezone.utc).isoformat(), datetime.now(timezone.utc).isoformat()))

    # 9B: Expired token
    expired_token = f"expired-token-{int(time.time()*1000)}"
    expired_hash = hashlib.sha256(expired_token.encode("utf-8")).hexdigest()
    cursor.execute("""
        INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, used_at, created_at)
        VALUES (?, ?, ?, NULL, ?)
    """, (admin_id, expired_hash, (datetime.now(timezone.utc) - timedelta(minutes=5)).isoformat(),
          datetime.now(timezone.utc).isoformat()))

    conn.commit()
    conn.close()

    # Attempt reuse on used token
    resp_used = client.post("/api/v1/auth/reset-password", json={
        "token": used_token,
        "new_password": "NewAttemptPassword@123",
        "confirm_password": "NewAttemptPassword@123"
    })
    assert resp_used.status_code == 400
    assert "already been used" in resp_used.json()["detail"].lower()

    # Attempt use on expired token
    resp_expired = client.post("/api/v1/auth/reset-password", json={
        "token": expired_token,
        "new_password": "NewAttemptPassword@123",
        "confirm_password": "NewAttemptPassword@123"
    })
    assert resp_expired.status_code == 400
    assert "expired" in resp_expired.json()["detail"].lower()


def test_scenario_10_login_with_newly_updated_password():
    """Scenario 10: Log in using the newly updated password."""
    # User was updated in scenario 8 with password 'BrandNewPassword@999'
    # Let's create an explicit test user, reset password, and log in
    email = f"scenario10.{int(time.time()*1000)}@cit.edu"
    client.post("/api/v1/auth/register", json={
        "full_name": "Scenario Ten User",
        "email": email,
        "department": "ECE",
        "password": "InitialPassword@111",
        "confirm_password": "InitialPassword@111"
    })

    # Verify old password works
    old_login = client.post("/api/v1/auth/login", json={"email": email, "password": "InitialPassword@111"})
    assert old_login.status_code == 200

    # Inject reset token
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
    u_id = cursor.fetchone()["id"]
    token = f"token-for-scenario-10-{int(time.time()*1000)}"
    t_hash = hashlib.sha256(token.encode()).hexdigest()
    cursor.execute("""
        INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, used_at, created_at)
        VALUES (?, ?, ?, NULL, ?)
    """, (u_id, t_hash, (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat(), datetime.now(timezone.utc).isoformat()))
    conn.commit()
    conn.close()

    # Reset password
    res = client.post("/api/v1/auth/reset-password", json={
        "token": token,
        "new_password": "UpdatedPassword@222",
        "confirm_password": "UpdatedPassword@222"
    })
    assert res.status_code == 200

    # Old password must now fail
    failed_login = client.post("/api/v1/auth/login", json={"email": email, "password": "InitialPassword@111"})
    assert failed_login.status_code == 401

    # New password must succeed
    succ_login = client.post("/api/v1/auth/login", json={"email": email, "password": "UpdatedPassword@222"})
    assert succ_login.status_code == 200
    assert succ_login.json()["user"]["email"] == email


def test_scenario_11_role_based_permissions_intact():
    """Scenario 11: Verify existing role-based permissions still work."""
    # Admin login -> has admin role
    admin_login = client.post("/api/v1/auth/login", json={"email": "admin@cit.edu", "password": "Admin@123"})
    admin_token = admin_login.json()["access_token"]

    # Student cannot approve bookings (requires admin/coordinator)
    student_email = f"student.perm.{int(time.time()*1000)}@cit.edu"
    client.post("/api/v1/auth/register", json={
        "full_name": "Permission Student",
        "email": student_email,
        "department": "CSE",
        "password": "Password@123",
        "confirm_password": "Password@123"
    })
    student_login = client.post("/api/v1/auth/login", json={"email": student_email, "password": "Password@123"})
    student_token = student_login.json()["access_token"]

    # Test me endpoint with tokens
    admin_me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {admin_token}"})
    assert admin_me.status_code == 200
    assert admin_me.json()["role"] == "admin"

    student_me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {student_token}"})
    assert student_me.status_code == 200
    assert student_me.json()["role"] == "student"
