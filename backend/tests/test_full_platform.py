import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_auth_demo_accounts():
    """Verify all 4 demo accounts are accessible."""
    res = client.get("/api/v1/auth/demo-accounts")
    assert res.status_code == 200
    accounts = res.json()
    assert len(accounts) == 4
    roles = [a["role"] for a in accounts]
    assert "admin" in roles
    assert "coordinator" in roles
    assert "faculty" in roles
    assert "club" in roles


def test_auth_login_success():
    """Verify authentication for admin."""
    res = client.post("/api/v1/auth/login", json={
        "email": "admin@cit.edu",
        "password": "Admin@123"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["role"] == "admin"


def test_auth_login_invalid():
    """Verify rejection of wrong credentials."""
    res = client.post("/api/v1/auth/login", json={
        "email": "admin@cit.edu",
        "password": "WrongPassword"
    })
    assert res.status_code == 401


def test_current_timetable_and_exams():
    """Verify active timetable and exam endpoints."""
    res_tt = client.get("/api/v1/timetable/current")
    assert res_tt.status_code == 200
    tt = res_tt.json()
    assert "sessions" in tt
    assert len(tt["sessions"]) > 0

    res_ex = client.get("/api/v1/timetable/exams")
    assert res_ex.status_code == 200
    exams = res_ex.json()
    assert exams["total_exams"] == 41


def test_spectra_week_and_cancellation():
    """Verify Spectra week requests and BR-04 cancellation."""
    res = client.get("/api/v1/bookings/spectra")
    assert res.status_code == 200
    data = res.json()
    assert data["total_requests"] == 25
    assert data["cancelled_count"] >= 1
    # Check BR-04 specifically
    br04 = next((b for b in data["bookings"] if b["id"] == "BR-04"), None)
    assert br04 is not None
    assert br04["status"] == "cancelled"


def test_nlp_booking_parser_english_and_hinglish():
    """Verify English & Hinglish extraction."""
    res1 = client.post("/api/v1/bookings/nlp-parse", json={
        "prompt": "Book seminar hall for robotics workshop on Friday from 2 PM to 5 PM."
    })
    assert res1.status_code == 200
    d1 = res1.json()
    assert d1["day"] == "FRI"
    assert "seminar_hall" in d1["room_types"]

    res2 = client.post("/api/v1/bookings/nlp-parse", json={
        "prompt": "Humein Saturday ko auditorium chahiye cultural event ke liye."
    })
    assert res2.status_code == 200
    d2 = res2.json()
    assert d2["day"] == "SAT"
    assert "auditorium" in d2["room_types"]


def test_self_approval_prevention():
    """Verify strict backend rule: users cannot approve their own requests."""
    # Login as club rep
    login_res = client.post("/api/v1/auth/login", json={
        "email": "club.robotics@cit.edu",
        "password": "Club@123"
    })
    token = login_res.json()["access_token"]

    # Try to approve a booking
    res = client.post(
        "/api/v1/bookings/BR-01/decision",
        json={"decision": "approved", "reason": "Self approved"},
        headers={"Authorization": f"Bearer {token}"}
    )
    # Club role cannot approve -> 403 Forbidden
    assert res.status_code == 403


def test_analytics_overview():
    """Verify real analytics calculations."""
    res = client.get("/api/v1/analytics/overview")
    assert res.status_code == 200
    data = res.json()
    assert "room_utilization" in data
    assert "department_workload" in data
    assert "cohort_workload" in data
    assert len(data["room_utilization"]) == 27


def test_ai_campus_assistant_queries():
    """Verify AI assistant grounded responses."""
    res = client.post("/api/v1/chat/query", json={
        "query": "What are the rules for lunch break?"
    })
    assert res.status_code == 200
    assert "lunch" in res.json()["answer"].lower()

    res2 = client.post("/api/v1/chat/query", json={
        "query": "How many venues are there on campus?"
    })
    assert res2.status_code == 200
    assert "27" in res2.json()["answer"]

