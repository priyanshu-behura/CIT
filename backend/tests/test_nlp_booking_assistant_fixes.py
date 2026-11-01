import pytest
import sqlite3
from fastapi.testclient import TestClient
from app.main import app
from app.services.nlp_booking_service import nlp_booking_service
from app.core.config import settings

client = TestClient(app)


def get_token(email: str = "club.robotics@cit.edu", password: str = "Club@123") -> str:
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200
    return res.json()["access_token"]


def test_prompt_1_robotics_workshop():
    """
    Prompt 1: 'Book seminar hall for robotics workshop on Friday from 2 PM to 5 PM.'
    Verifies:
    - Title: Robotics Workshop
    - Category: club_event
    - Day: FRI
    - Period conversion: 2 PM = P6, 5 PM = P8 (14:00 to 17:00)
    - Room: seminar_hall (SH-1)
    - Attendance is NOT specified -> must be None, NOT defaulted to 150 or 60!
    - needs_input=True, 'attendance' in needs_input_fields
    """
    res = nlp_booking_service.parse_booking_prompt("Book seminar hall for robotics workshop on Friday from 2 PM to 5 PM.")
    assert res["title"] == "Robotics Workshop"
    assert res["category"] == "club_event"
    assert res["day"] == "FRI"
    assert res["start_period"] == 6
    assert res["end_period"] == 8
    assert res["preferred_room_id"] == "SH-1"
    assert "seminar_hall" in res["room_types"]
    assert res["attendance"] is None  # Must NOT be 150 or 60!
    assert res["needs_input"] is True
    assert "attendance" in res["needs_input_fields"]
    assert any("attend" in q.lower() for q in res["follow_up_questions"])


def test_prompt_2_cultural_event_hinglish():
    """
    Prompt 2: 'Humein Saturday ko auditorium chahiye cultural event ke liye.'
    Verifies:
    - Title: Cultural Event
    - Category: club_event
    - Day: SAT
    - Room: AUD (auditorium)
    - Time is NOT specified -> start_period=None, end_period=None
    - Attendance is NOT specified -> attendance=None (NOT 150 or 60!)
    - needs_input=True with both 'time' and 'attendance' in needs_input_fields
    """
    res = nlp_booking_service.parse_booking_prompt("Humein Saturday ko auditorium chahiye cultural event ke liye.")
    assert res["title"] == "Cultural Event"
    assert res["category"] == "club_event"
    assert res["day"] == "SAT"
    assert res["preferred_room_id"] == "AUD"
    assert "auditorium" in res["room_types"]
    assert res["start_period"] is None
    assert res["end_period"] is None
    assert res["attendance"] is None
    assert res["needs_input"] is True
    assert "time" in res["needs_input_fields"]
    assert "attendance" in res["needs_input_fields"]


def test_prompt_3_classroom_relative_date():
    """
    Prompt 3: 'Book a classroom for 80 students tomorrow morning.'
    Verifies:
    - Attendance: 80 (explicitly extracted)
    - Room: CR-101 (classroom)
    - Time: morning -> P2 to P4 (09:00 to 12:00)
    - Day: relative date (tomorrow from ref date 2026-11-01 Sun -> MON)
    """
    res = nlp_booking_service.parse_booking_prompt("Book a classroom for 80 students tomorrow morning.", reference_date="2026-11-01")
    assert res["title"] in ["Classroom Booking", "Classroom Session", "Morning Event", "Campus Event"]
    assert res["attendance"] == 80
    assert res["preferred_room_id"] == "CR-101"
    assert "classroom" in res["room_types"]
    assert res["day"] == "MON"
    assert res["start_period"] == 2
    assert res["end_period"] == 4
    assert res["is_relative_day"] is True


def test_prompt_4_python_bootcamp_all_fields_present():
    """
    Prompt 4: 'Reserve computing lab 1 on Wednesday 10 AM to 1 PM for Python bootcamp with 60 students.'
    Verifies:
    - Title: Python Bootcamp
    - Category: club_event
    - Day: WED
    - Time: 10 AM to 1 PM -> P3 to P5 (10:00 to 13:00)
    - Room: CS-LAB-1 (lab_cs)
    - Attendance: 60
    - Needs: computers
    - needs_input: False (all required fields supplied)
    """
    res = nlp_booking_service.parse_booking_prompt("Reserve computing lab 1 on Wednesday 10 AM to 1 PM for Python bootcamp with 60 students.")
    assert res["title"] == "Python Bootcamp"
    assert res["category"] == "club_event"
    assert res["day"] == "WED"
    assert res["start_period"] == 3
    assert res["end_period"] == 5
    assert res["attendance"] == 60
    assert res["preferred_room_id"] == "CS-LAB-1"
    assert "lab_cs" in res["room_types"]
    assert "computers" in res["needs"]
    assert res["needs_input"] is False
    assert len(res["needs_input_fields"]) == 0


def test_missing_attendance_never_invented():
    """
    Prove that missing attendance is never silently set to 150 or 60.
    """
    prompts_without_attendance = [
        "Book auditorium for annual drama fest on Friday 4 to 7 pm",
        "Need seminar hall on Monday morning for faculty orientation",
        "Classroom chahiye kal dopehar ko meeting ke liye"
    ]
    for p in prompts_without_attendance:
        res = nlp_booking_service.parse_booking_prompt(p)
        assert res["attendance"] is None, f"Attendance was unexpectedly defaulted in prompt: {p}"
        assert "attendance" in res["needs_input_fields"]


def test_booking_submission_and_period_conversion_lifecycle():
    """
    Lifecycle test:
    1. Parse Prompt 1: extracts title, day, periods, but attendance=None
    2. Attempting to submit to /api/v1/bookings without attendance fails with 422
    3. Supplying attendance=50 submits successfully and creates booking
    4. Clean up test booking to maintain clean database state
    """
    token = get_token()

    # 1. Parse prompt
    extracted = nlp_booking_service.parse_booking_prompt("Book seminar hall for robotics workshop on Friday from 2 PM to 5 PM.")
    assert extracted["attendance"] is None

    # 2. Invalid submission without attendance
    res_invalid = client.post("/api/v1/bookings", headers={"Authorization": f"Bearer {token}"}, json={
        "title": extracted["title"],
        "requested_category": extracted["category"],
        "day": extracted["day"],
        "start_period": extracted["start_period"],
        "end_period": extracted["end_period"],
        "attendance": 0,  # Invalid
        "room_types": extracted["room_types"],
        "preferred_room_id": extracted["preferred_room_id"]
    })
    assert res_invalid.status_code == 422
    err_detail = res_invalid.json().get("detail", [])
    # Verify readable error structure
    assert any("attendance" in str(e) for e in err_detail)

    # 3. Valid submission with user-supplied attendance=50
    res_valid = client.post("/api/v1/bookings", headers={"Authorization": f"Bearer {token}"}, json={
        "title": extracted["title"],
        "description": "User confirmed NLP draft",
        "requested_category": extracted["category"],
        "day": extracted["day"],
        "start_period": extracted["start_period"],  # 6
        "end_period": extracted["end_period"],      # 8
        "duration_periods": extracted["end_period"] - extracted["start_period"] + 1,  # 3
        "attendance": 50,
        "room_types": extracted["room_types"],
        "preferred_room_id": extracted["preferred_room_id"]
    })
    assert res_valid.status_code == 200
    created = res_valid.json()
    assert "id" in created
    created_id = created["id"]
    assert created["status"] == "pending"
    assert created["effective_category"] == "club_event"

    # 4. Clean up test record to maintain exact 25 official bookings
    db_path = settings.BACKEND_DIR + "/tech_zephyr.db"
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute("DELETE FROM bookings WHERE id = ?", (created_id,))
    conn.commit()
    conn.close()
