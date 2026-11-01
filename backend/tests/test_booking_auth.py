import pytest
import sqlite3
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token
from datetime import timedelta
from pathlib import Path

client = TestClient(app)

DB_PATH = Path(__file__).resolve().parent.parent / "tech_zephyr.db"



def get_token(email: str, password: str) -> str:
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed for {email}"
    return res.json()["access_token"]


def get_booking_row_count() -> int:
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM bookings")
    cnt = cur.fetchone()[0]
    conn.close()
    return cnt


def get_mongo_booking(booking_id: str):
    from app.core.mongo import get_mongo_db
    mongo_db = get_mongo_db()
    return mongo_db.bookings.find_one({"id": booking_id})


def cleanup_test_bookings(created_ids):
    if not created_ids:
        return
    try:
        from app.core.mongo import get_mongo_db
        mongo_db = get_mongo_db()
        mongo_db.bookings.delete_many({"id": {"$in": list(created_ids)}})
    except Exception:
        pass


def test_booking_anonymous_rejected():
    """Case a: Anonymous POST /api/v1/bookings -> 401, no row created in DB."""
    start_count = get_booking_row_count()

    payload = {
        "title": "Anonymous Fest Activity",
        "requested_category": "club_event",
        "attendance": 50,
        "day": "MON",
        "start_period": 6,
        "end_period": 7,
        "room_types": ["classroom"]
    }
    # No Authorization header
    res = client.post("/api/v1/bookings", json=payload)
    assert res.status_code == 401
    assert "detail" in res.json()
    assert res.headers.get("www-authenticate") == "Bearer"

    # Confirm no row was created in SQLite DB
    end_count = get_booking_row_count()
    assert end_count == start_count


def test_booking_invalid_and_expired_token():
    """Case b: Invalid/garbage token and expired token -> 401."""
    payload = {
        "title": "Unauthorized Booking Attempt",
        "attendance": 30,
        "day": "TUE",
        "start_period": 6,
        "end_period": 7
    }

    # Garbage token
    res1 = client.post(
        "/api/v1/bookings",
        json=payload,
        headers={"Authorization": "Bearer garbage.invalid.token"}
    )
    assert res1.status_code == 401
    assert res1.headers.get("www-authenticate") == "Bearer"

    # Expired token
    expired_token = create_access_token(
        data={"sub": "admin@cit.edu", "role": "admin"},
        expires_delta=timedelta(seconds=-60)  # expired 1 minute ago
    )
    res2 = client.post(
        "/api/v1/bookings",
        json=payload,
        headers={"Authorization": f"Bearer {expired_token}"}
    )
    assert res2.status_code == 401
    assert res2.headers.get("www-authenticate") == "Bearer"


def test_booking_club_user_success_and_identity_derived_from_token():
    """Case c: Authenticated club user submits valid booking -> success, requester equals token user."""
    created_ids = set()
    try:
        club_token = get_token("club.robotics@cit.edu", "Club@123")
        payload = {
            "title": "Robotics Club Weekly Meet",
            "requested_category": "club_event",
            "attendance": 45,
            "day": "WED",
            "start_period": 6,
            "end_period": 7,
            "room_types": ["classroom"]
        }
        res = client.post(
            "/api/v1/bookings",
            json=payload,
            headers={"Authorization": f"Bearer {club_token}"}
        )
        assert res.status_code == 200
        data = res.json()
        assert "id" in data
        created_ids.add(data["id"])

        # Verify identity in MongoDB primary database came strictly from token
        doc = get_mongo_booking(data["id"])
        assert doc is not None
        assert doc["requester_name"] == "Rohan Das (Robotics & AI Club Lead)"
        assert doc["requester_email"] == "club.robotics@cit.edu"
        assert doc["role"] == "club"
        assert doc["status"] == "pending"

        # Verify SQLite archive remained strictly read-only
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM bookings WHERE id = ?", (data["id"],))
        assert cur.fetchone()[0] == 0, "SQLite archive must remain untouched"
        conn.close()
    finally:
        cleanup_test_bookings(created_ids)


def test_booking_role_capping_club():
    """Case d: Club user submitting requested_category='institute_event' -> capped to club_event."""
    created_ids = set()
    try:
        club_token = get_token("club.robotics@cit.edu", "Club@123")
        payload = {
            "title": "Robotics Club Convocation Claim",
            "requested_category": "institute_event",  # Attempting to claim highest priority
            "attendance": 100,
            "day": "FRI",
            "start_period": 6,
            "end_period": 8,
            "room_types": ["auditorium"]
        }
        res = client.post(
            "/api/v1/bookings",
            json=payload,
            headers={"Authorization": f"Bearer {club_token}"}
        )
        assert res.status_code == 200
        data = res.json()
        created_ids.add(data["id"])

        # Check MongoDB record
        doc = get_mongo_booking(data["id"])
        assert doc is not None
        assert doc["requested_category"] == "institute_event"  # requested category stored as requested
        assert doc["effective_category"] == "club_event"       # effective category server-side capped
        assert doc["role"] == "club"
    finally:
        cleanup_test_bookings(created_ids)


def test_booking_forged_payload_ignored():
    """Case e: Forged role ('admin'), forged email or status in payload are ignored; values come from token."""
    created_ids = set()
    try:
        club_token = get_token("club.robotics@cit.edu", "Club@123")
        payload = {
            "title": "Forged Admin Booking",
            "requested_category": "institute_event",
            "role": "admin",                              # Forged role in body
            "requester_email": "dean@cit.edu",            # Forged email in body
            "requester_name": "Dean Admin",               # Forged name in body
            "status": "approved",                         # Forged status in body
            "attendance": 80,
            "day": "THU",
            "start_period": 6,
            "end_period": 7,
            "room_types": ["seminar_hall"]
        }
        res = client.post(
            "/api/v1/bookings",
            json=payload,
            headers={"Authorization": f"Bearer {club_token}"}
        )
        assert res.status_code == 200
        data = res.json()
        created_ids.add(data["id"])

        doc = get_mongo_booking(data["id"])
        assert doc is not None
        assert doc["requester_name"] == "Rohan Das (Robotics & AI Club Lead)"   # NOT "Dean Admin"
        assert doc["requester_email"] == "club.robotics@cit.edu"               # NOT "dean@cit.edu"
        assert doc["role"] == "club"                                 # NOT "admin"
        assert doc["status"] == "pending"                              # NOT "approved"
        assert doc["effective_category"] == "club_event"                           # Capped to club_event
    finally:
        cleanup_test_bookings(created_ids)


def test_booking_role_capping_coordinator_and_faculty():
    """Case f: Coordinator and faculty bookings keep their existing correct role-cap behaviour."""
    created_ids = set()
    try:
        coord_token = get_token("coordinator.cse@cit.edu", "Coord@123")
        faculty_token = get_token("faculty.sm@cit.edu", "Faculty@123")

        # Coordinator requesting institute_event -> capped to department_event
        res_coord = client.post(
            "/api/v1/bookings",
            json={
                "title": "CSE Department Research Day",
                "requested_category": "institute_event",
                "attendance": 60,
                "day": "MON",
                "start_period": 6,
                "end_period": 7
            },
            headers={"Authorization": f"Bearer {coord_token}"}
        )
        assert res_coord.status_code == 200
        c_id = res_coord.json()["id"]
        created_ids.add(c_id)

        # Faculty requesting institute_event -> capped to guest_lecture
        res_fac = client.post(
            "/api/v1/bookings",
            json={
                "title": "Special AI Guest Seminar",
                "requested_category": "institute_event",
                "attendance": 50,
                "day": "TUE",
                "start_period": 6,
                "end_period": 7
            },
            headers={"Authorization": f"Bearer {faculty_token}"}
        )
        assert res_fac.status_code == 200
        f_id = res_fac.json()["id"]
        created_ids.add(f_id)

        doc_c = get_mongo_booking(c_id)
        assert doc_c is not None
        assert doc_c["effective_category"] == "department_event"

        doc_f = get_mongo_booking(f_id)
        assert doc_f is not None
        assert doc_f["effective_category"] == "guest_lecture"
    finally:
        cleanup_test_bookings(created_ids)


def test_booking_self_approval_and_permissions():
    """Case g: User who created booking cannot approve -> 403. Club cannot approve -> 403. Admin approving works."""
    created_ids = set()
    try:
        admin_token = get_token("admin@cit.edu", "Admin@123")
        club_token = get_token("club.robotics@cit.edu", "Club@123")

        # Admin creates booking
        adm_create = client.post(
            "/api/v1/bookings",
            json={
                "title": "Dean Staff Review Meeting",
                "requested_category": "institute_event",
                "attendance": 25,
                "day": "MON",
                "start_period": 8,
                "end_period": 9
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert adm_create.status_code == 200
        adm_b_id = adm_create.json()["id"]
        created_ids.add(adm_b_id)

        # Admin tries to approve their own booking -> 403
        self_appr = client.post(
            f"/api/v1/bookings/{adm_b_id}/decision",
            json={"decision": "approved", "reason": "Self approval", "assigned_room_id": "SH-1"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert self_appr.status_code == 403
        assert "Self-approval violation" in self_appr.json()["detail"]

        # Club creates booking
        club_create = client.post(
            "/api/v1/bookings",
            json={
                "title": "Club General Meeting",
                "requested_category": "club_event",
                "attendance": 30,
                "day": "WED",
                "start_period": 6,
                "end_period": 7
            },
            headers={"Authorization": f"Bearer {club_token}"}
        )
        assert club_create.status_code == 200
        club_b_id = club_create.json()["id"]
        created_ids.add(club_b_id)

        # Club user tries to approve any booking -> 403
        club_appr = client.post(
            f"/api/v1/bookings/{club_b_id}/decision",
            json={"decision": "approved", "reason": "Club approval attempt", "assigned_room_id": "CR-101"},
            headers={"Authorization": f"Bearer {club_token}"}
        )
        assert club_appr.status_code == 403

        # Admin approving someone else's booking (club_b_id) -> 200
        admin_appr = client.post(
            f"/api/v1/bookings/{club_b_id}/decision",
            json={"decision": "approved", "reason": "Approved by Admin for verified club activity", "assigned_room_id": "CR-101"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert admin_appr.status_code == 200
        assert admin_appr.json()["status"] == "approved"
    finally:
        cleanup_test_bookings(created_ids)


def test_booking_priority_ordering_unchanged():
    """Case h: Official Spectra Week booking priority ordering and cancellation are unchanged."""
    res = client.get("/api/v1/bookings/spectra")
    assert res.status_code == 200
    data = res.json()
    assert data["total_requests"] == 25
    assert data["cancelled_count"] == 1
    assert data["active_count"] == 24
