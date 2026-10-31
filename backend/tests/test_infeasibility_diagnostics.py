import json
import pytest
from pathlib import Path
from fastapi.testclient import TestClient

from app.main import app
from app.core.config import settings
from app.core.database import get_db_connection
from app.api.auth import create_access_token

client = TestClient(app)


def get_token_for(email: str, role: str) -> str:
    return create_access_token({"sub": email, "role": role})


def test_infeasible_scenario_1_laboratory_closed_all_week():
    """Scenario 1: All eligible computing laboratories closed for the entire week."""
    token = get_token_for("admin@cit.edu", "admin")
    payload = {
        "id": "infeasible-lab-closed",
        "title": "All Computing Labs Closed for Maintenance",
        "description": "CS-LAB-1 and CS-LAB-2 closed Monday through Friday.",
        "changes": [
            {
                "type": "room_unavailable",
                "room_id": "CS-LAB-1",
                "days": ["MON", "TUE", "WED", "THU", "FRI"],
                "periods": [1, 2, 3, 4, 5, 6, 7, 8, 9]
            },
            {
                "type": "room_unavailable",
                "room_id": "CS-LAB-2",
                "days": ["MON", "TUE", "WED", "THU", "FRI"],
                "periods": [1, 2, 3, 4, 5, 6, 7, 8, 9]
            }
        ]
    }

    # Upload using json body
    res = client.post(
        "/api/v1/disruptions/upload",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        content=json.dumps(payload)
    )
    assert res.status_code == 200

    # Simulate
    sim_res = client.post(
        "/api/v1/disruptions/infeasible-lab-closed/simulate",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert sim_res.status_code == 200
    data = sim_res.json()
    assert data["status"] == "infeasible"
    assert data["schedule_applied"] is False
    assert data["baseline_untouched"] is True
    assert "dominant_blocking_constraints" in data
    # Assert room unavailable constraint eliminated options
    assert data["candidate_elimination_counts"].get("room_unavailable_maintenance", 0) > 0


def test_infeasible_scenario_2_faculty_unavailable_all_week():
    """Scenario 2: Faculty F01 is completely unavailable Monday through Friday."""
    token = get_token_for("admin@cit.edu", "admin")
    payload = {
        "id": "infeasible-faculty-leave",
        "title": "Faculty F01 Emergency Leave",
        "description": "Faculty F01 unavailable every teaching day.",
        "changes": [
            {
                "type": "faculty_unavailable",
                "faculty_id": "F01",
                "days": ["MON", "TUE", "WED", "THU", "FRI"],
                "periods": [1, 2, 3, 4, 5, 6, 7, 8, 9]
            }
        ]
    }

    res = client.post(
        "/api/v1/disruptions/upload",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        content=json.dumps(payload)
    )
    assert res.status_code == 200

    sim_res = client.post(
        "/api/v1/disruptions/infeasible-faculty-leave/simulate",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert sim_res.status_code == 200
    data = sim_res.json()
    assert data["status"] == "infeasible"
    assert data["schedule_applied"] is False
    assert data["baseline_untouched"] is True
    # Assert faculty unavailable constraint named in eliminations
    assert data["candidate_elimination_counts"].get("faculty_unavailable_leave", 0) > 0


def test_infeasible_scenario_3_capacity_exceeds_all_eligible_rooms():
    """Scenario 3: Added lecture session with size 5000 exceeding campus venues."""
    token = get_token_for("admin@cit.edu", "admin")
    payload = {
        "id": "infeasible-huge-capacity",
        "title": "Massive Joint Session Exceeds Campus",
        "description": "Joint session with size 5000.",
        "changes": [
            {
                "type": "add_session",
                "session": {
                    "id": "MEGA-L1",
                    "course_id": "CS101",
                    "kind": "lecture",
                    "groups": ["CSE-1", "CSE-2"],
                    "faculty_id": "F01",
                    "size": 5000,
                    "duration": 1,
                    "room_types": ["classroom", "lecture_hall", "auditorium"],
                    "needs_accessible": False,
                    "basket_slot": None,
                    "fixed_slot": None
                }
            }
        ]
    }

    res = client.post(
        "/api/v1/disruptions/upload",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        content=json.dumps(payload)
    )
    assert res.status_code == 200

    sim_res = client.post(
        "/api/v1/disruptions/infeasible-huge-capacity/simulate",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert sim_res.status_code == 200
    data = sim_res.json()
    assert data["status"] == "infeasible"
    assert data["schedule_applied"] is False
    assert data["baseline_untouched"] is True
    # Assert room capacity insufficient named
    assert data["candidate_elimination_counts"].get("room_capacity_insufficient", 0) > 0
    assert "exceeds every eligible room on campus" in data["primary_explanation"]


def test_infeasible_simulation_leaves_database_untouched():
    """Assert that failed simulations never insert or mutate baseline schedules in database."""
    token = get_token_for("admin@cit.edu", "admin")
    payload = {
        "id": "infeasible-db-check",
        "title": "Infeasible DB Isolation Test",
        "description": "Joint session with size 5000.",
        "changes": [
            {
                "type": "add_session",
                "session": {
                    "id": "MEGA-L2",
                    "course_id": "CS101",
                    "kind": "lecture",
                    "groups": ["CSE-1", "CSE-2"],
                    "faculty_id": "F01",
                    "size": 5000,
                    "duration": 1,
                    "room_types": ["classroom", "lecture_hall", "auditorium"],
                    "needs_accessible": False,
                    "basket_slot": None,
                    "fixed_slot": None
                }
            }
        ]
    }

    # Upload
    client.post(
        "/api/v1/disruptions/upload",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        content=json.dumps(payload)
    )

    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT id, schedule_type FROM schedules ORDER BY id DESC LIMIT 1")
    last_row = c.fetchone()
    conn.close()

    # Call simulation on infeasible scenario
    sim_res = client.post(
        "/api/v1/disruptions/infeasible-db-check/simulate",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert sim_res.status_code == 200
    assert sim_res.json()["status"] == "infeasible"

    # Verify database schedules table row was NOT modified
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT id, schedule_type FROM schedules ORDER BY id DESC LIMIT 1")
    new_last_row = c.fetchone()
    conn.close()

    assert last_row[0] == new_last_row[0]
    assert last_row[1] == new_last_row[1]
