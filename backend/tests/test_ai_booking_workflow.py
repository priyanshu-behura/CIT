import sys
import json
import sqlite3
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent.parent.parent.parent / "PERSONAL PROJECT" / "Tech-Zephyr" / "backend"
if not backend_dir.exists():
    backend_dir = Path("d:/PERSONAL PROJECT/Tech-Zephyr/backend")
sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from app.main import app
from app.core.mongo import get_mongo_db

client = TestClient(app)
DB_PATH = backend_dir / "tech_zephyr.db"


def run_checks():
    print("=" * 70)
    print("CAMPUS AI VENUE BOOKING WORKFLOW VERIFICATION SUITE")
    print("=" * 70)

    # 0. Initial SQLite check
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM bookings")
    initial_sqlite_count = cur.fetchone()[0]
    conn.close()
    print(f"[INIT] Initial SQLite bookings count (read-only baseline): {initial_sqlite_count}")

    # 1. Login accounts
    club_login = client.post("/api/v1/auth/login", json={"email": "club.robotics@cit.edu", "password": "Club@123"})
    assert club_login.status_code == 200, "Club login failed"
    club_token = club_login.json()["access_token"]

    admin_login = client.post("/api/v1/auth/login", json={"email": "admin@cit.edu", "password": "Admin@123"})
    assert admin_login.status_code == 200, "Admin login failed"
    admin_token = admin_login.json()["access_token"]
    print("[AUTH] Successfully authenticated Club Lead and Admin accounts.")

    # 2. Step 1 & 2: User queries Campus AI for a venue booking
    print("\n--- TEST 1: Campus AI Query & Draft Extraction ---")
    chat_payload = {
        "query": "Humein Friday ko SH-1 chahiye 50 students ke workshop ke liye 2 PM to 5 PM",
        "role": "club",
        "user_email": "club.robotics@cit.edu"
    }
    chat_res = client.post("/api/v1/chat/query", json=chat_payload)
    assert chat_res.status_code == 200, f"Chat query failed: {chat_res.text}"
    chat_data = chat_res.json()
    print(f"Campus AI answered: {chat_data['answer'][:80]}...")
    print(f"Is booking intent: {chat_data.get('is_booking_intent')}")
    print(f"Draft booking: {chat_data.get('draft_booking')}")
    assert chat_data["is_booking_intent"] is True
    draft = chat_data["draft_booking"]
    assert draft is not None
    assert draft.get("day") == "FRI"
    assert draft.get("start_period") == 6
    assert draft.get("end_period") == 8
    print("[PASS] Campus AI accurately extracted booking parameters into draft.")

    # 3. Step 3 & 4 & 5 & 6 & 7: User confirms draft booking -> submitted to backend
    print("\n--- TEST 2: User Confirmation & Authoritative Persistence ---")
    booking_payload = {
        "title": draft.get("title") or "Robotics Workshop",
        "description": "Booking requested via CIT Campus AI",
        "requested_category": draft.get("category") or "club_event",
        "attendance": draft.get("attendance") or 50,
        "duration_periods": 3,
        "day": draft.get("day") or "FRI",
        "start_period": draft.get("start_period") or 6,
        "end_period": draft.get("end_period") or 8,
        "room_types": draft.get("room_types") or ["seminar_hall"],
        "needs": draft.get("needs") or ["projector", "ac"],
        "preferred_room_id": draft.get("preferred_room_id") or "SH-1"
    }
    create_res = client.post("/api/v1/bookings", json=booking_payload, headers={"Authorization": f"Bearer {club_token}"})
    assert create_res.status_code == 200, f"Booking creation failed: {create_res.text}"
    created_data = create_res.json()
    booking_id = created_data["id"]
    print(f"Booking created with ID: {booking_id}")
    assert created_data["status"] == "pending"
    assert booking_id.startswith("REQ-")

    # 4. Verify MongoDB Atlas holds authoritative record
    mongo_db = get_mongo_db()
    saved_doc = mongo_db.bookings.find_one({"id": booking_id})
    assert saved_doc is not None, "Booking must exist in MongoDB bookings collection!"
    assert saved_doc["title"] == booking_payload["title"]
    assert saved_doc["requester_name"] == "Rohan Das (Robotics & AI Club Lead)"
    assert saved_doc["requester_email"] == "club.robotics@cit.edu"
    assert saved_doc["role"] == "club"
    assert saved_doc["status"] == "pending"
    assert saved_doc["preferred_room_id"] == "SH-1"
    assert saved_doc["windows"][0]["day"] == "FRI"
    print(f"[PASS] MongoDB Atlas holds authoritative record for {booking_id}.")

    # 5. Verify SQLite historical archive remains strictly untouched
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM bookings WHERE id = ?", (booking_id,))
    sqlite_matches = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM bookings")
    final_sqlite_count = cur.fetchone()[0]
    conn.close()
    assert sqlite_matches == 0, "SQLite MUST NOT contain the new booking!"
    assert final_sqlite_count == initial_sqlite_count, "SQLite bookings row count must not change!"
    print(f"[PASS] SQLite strictly unchanged: row count={final_sqlite_count} (matches baseline {initial_sqlite_count}).")

    # 6. Step 8 & 9: Booking Requests API retrieval
    print("\n--- TEST 3: Booking Requests API Retrieval ---")
    list_res = client.get("/api/v1/bookings")
    assert list_res.status_code == 200
    all_bookings = list_res.json()
    matching = [b for b in all_bookings if b["id"] == booking_id]
    assert len(matching) == 1, f"Booking {booking_id} must appear in GET /api/v1/bookings!"
    retrieved = matching[0]
    assert retrieved["requester_name"] == "Rohan Das (Robotics & AI Club Lead)"
    assert retrieved["status"] == "pending"
    print(f"[PASS] GET /api/v1/bookings retrieved {len(all_bookings)} bookings including new {booking_id}.")

    # 7. Step 10: Administrator Decision & Approval Workflow
    print("\n--- TEST 4: Administrator Approval Workflow ---")
    decision_payload = {
        "decision": "approved",
        "reason": "Approved for Robotics & AI student workshop in SH-1",
        "assigned_room_id": "SH-1",
        "assigned_day": "FRI",
        "assigned_start_period": 6,
        "assigned_end_period": 8
    }
    decision_res = client.post(
        f"/api/v1/bookings/{booking_id}/decision",
        json=decision_payload,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert decision_res.status_code == 200, f"Decision failed: {decision_res.text}"
    print(f"Admin approved booking: {decision_res.json()}")

    # Verify updated in MongoDB Atlas
    updated_doc = mongo_db.bookings.find_one({"id": booking_id})
    assert updated_doc["status"] == "approved"
    assert updated_doc["assigned_room_id"] == "SH-1"
    assert updated_doc["decided_by"] == "admin@cit.edu"
    print(f"[PASS] Booking {booking_id} status updated to 'approved' in MongoDB Atlas.")

    # 8. Step 11: Self-Approval Prohibition Enforcement
    print("\n--- TEST 5: Self-Approval Prohibition Enforcement ---")
    self_appr = client.post(
        f"/api/v1/bookings/{booking_id}/decision",
        json={"decision": "approved", "reason": "Attempted self-approval", "assigned_room_id": "SH-1"},
        headers={"Authorization": f"Bearer {club_token}"}
    )
    assert self_appr.status_code == 403
    print(f"[PASS] Self-approval blocked with 403 Forbidden: {self_appr.json()['detail']}")

    # 9. Step 12: Duplicate Submission Protection (Rapid Double Click)
    print("\n--- TEST 6: Duplicate Submission Protection (Rapid Click) ---")
    dup_res = client.post("/api/v1/bookings", json=booking_payload, headers={"Authorization": f"Bearer {club_token}"})
    assert dup_res.status_code == 200
    dup_data = dup_res.json()
    assert dup_data["id"] == booking_id, f"Must return existing booking ID {booking_id}, got {dup_data['id']}"
    assert "duplicate" in dup_data.get("message", "").lower()
    print(f"[PASS] Duplicate submission safely intercepted. Reused existing ID: {dup_data['id']}.")

    # 10. Step 13: Incomplete Details Validation (Attendance = 0)
    print("\n--- TEST 7: Incomplete Details Validation ---")
    invalid_payload = {**booking_payload, "attendance": 0}
    inv_res = client.post("/api/v1/bookings", json=invalid_payload, headers={"Authorization": f"Bearer {club_token}"})
    assert inv_res.status_code == 422
    print(f"[PASS] Invalid attendance=0 rejected with 422 Unprocessable Entity.")

    # Clean up test booking from MongoDB
    mongo_db.bookings.delete_one({"id": booking_id})
    print(f"\n[CLEANUP] Deleted test booking {booking_id} from MongoDB Atlas.")

    # Final SQLite count verification
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM bookings")
    final_cnt = cur.fetchone()[0]
    conn.close()
    assert final_cnt == initial_sqlite_count, "SQLite historical archive count changed!"
    print(f"[CLEANUP] Final SQLite count remains exact: {final_cnt} == {initial_sqlite_count}.")

    print("\n" + "=" * 70)
    print("ALL 7 CRITICAL WORKFLOW TESTS PASSED PERFECTLY!")
    print("=" * 70)


if __name__ == "__main__":
    run_checks()

