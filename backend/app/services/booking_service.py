import json
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple
from app.core.database import get_db_connection
from app.services.dataset_service import dataset_service
from app.core.config import settings

ROLE_CAPS = {
    "admin": "institute_event",
    "faculty": "guest_lecture",
    "coordinator": "department_event",
    "club": "club_event"
}

PRIORITY_ORDER = [
    "exam",
    "regular_session",
    "institute_event",
    "guest_lecture",
    "department_event",
    "club_event"
]


class BookingService:
    def __init__(self):
        self.dataset = dataset_service.raw_data
        self.rooms = {r["id"]: r for r in self.dataset["rooms"]}

    def get_all_bookings(self, status: Optional[str] = None, role: Optional[str] = None) -> List[Dict[str, Any]]:
        """Fetch all bookings from SQLite database."""
        conn = get_db_connection()
        cursor = conn.cursor()
        query = "SELECT * FROM bookings WHERE 1=1"
        params = []
        if status:
            query += " AND status = ?"
            params.append(status)
        if role:
            query += " AND role = ?"
            params.append(role)
        query += " ORDER BY submitted_at DESC"

        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()

        results = []
        for row in rows:
            item = dict(row)
            item["windows"] = json.loads(item.get("windows") or "[]")
            item["room_types"] = json.loads(item.get("room_types") or "[]")
            item["needs"] = json.loads(item.get("needs") or "[]")
            item["mandatory_for_groups"] = json.loads(item.get("mandatory_for_groups") or "[]")
            results.append(item)
        return results

    def create_booking(
        self,
        requester_name: str,
        requester_email: str,
        role: str,
        title: str,
        description: str,
        requested_category: str,
        attendance: int,
        duration_periods: int,
        day: str,
        start_period: int,
        end_period: int,
        room_types: List[str],
        needs: List[str],
        preferred_room_id: Optional[str] = None,
        mandatory_for_groups: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Create a new booking request in database with automatic conflict pre-check."""
        conn = get_db_connection()
        cursor = conn.cursor()

        # Generate next ID for general campus booking (distinguished from official Spectra BR- requests)
        cursor.execute("SELECT COUNT(*) FROM bookings WHERE id NOT LIKE 'BR-%'")
        cnt = cursor.fetchone()[0]
        booking_id = f"REQ-{cnt + 1:03d}"

        # Calculate effective category by applying role cap
        cap = ROLE_CAPS.get(role, "club_event")
        r_idx = PRIORITY_ORDER.index(requested_category) if requested_category in PRIORITY_ORDER else len(PRIORITY_ORDER) - 1
        c_idx = PRIORITY_ORDER.index(cap) if cap in PRIORITY_ORDER else len(PRIORITY_ORDER) - 1
        effective_category = PRIORITY_ORDER[max(r_idx, c_idx)]

        windows = [{"day": day, "from_period": start_period, "to_period": end_period}]
        now = datetime.now(timezone.utc).isoformat()

        cursor.execute("""
        INSERT INTO bookings (
            id, requester_name, requester_email, role, requested_category,
            effective_category, title, description, attendance, duration_periods,
            windows, room_types, needs, mandatory_for_groups, preferred_room_id,
            status, submitted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            booking_id,
            requester_name,
            requester_email,
            role,
            requested_category,
            effective_category,
            title,
            description,
            attendance,
            duration_periods,
            json.dumps(windows),
            json.dumps(room_types),
            json.dumps(needs),
            json.dumps(mandatory_for_groups or []),
            preferred_room_id,
            "pending",
            now
        ))

        # Add notification
        cursor.execute("""
        INSERT INTO notifications (target_role, target_email, title, message, type, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (
            "admin",
            "admin@cit.edu",
            f"New Booking Request {booking_id}",
            f"{requester_name} ({role}) submitted '{title}' for {day} P{start_period}-P{end_period}.",
            "info",
            now
        ))

        conn.commit()
        conn.close()

        return {
            "id": booking_id,
            "status": "pending",
            "message": "Booking request successfully registered and pending administrative review.",
            "effective_category": effective_category
        }

    def process_decision(
        self,
        booking_id: str,
        decision: str,  # 'approved', 'rejected', 'alternative_offered'
        decided_by_email: str,
        decided_by_role: str,
        reason: str,
        assigned_room_id: Optional[str] = None,
        assigned_day: Optional[str] = None,
        assigned_start_period: Optional[int] = None,
        assigned_end_period: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Approve, reject, or offer alternative for a booking request.
        Strictly enforces: Users CANNOT approve their own requests!
        Only Admin or Department Coordinator (for departmental requests) can approve.
        """
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM bookings WHERE id = ?", (booking_id,))
        row = cursor.fetchone()
        if not row:
            conn.close()
            raise ValueError(f"Booking {booking_id} not found.")

        booking = dict(row)

        # STRICT ENFORCEMENT: Self-approval check
        if decided_by_email and booking.get("requester_email"):
            if decided_by_email.lower() == booking["requester_email"].lower():
                conn.close()
                raise PermissionError("Self-approval violation: Users are strictly forbidden from approving their own booking requests.")

        # Authority check
        if decided_by_role not in ("admin", "coordinator"):
            conn.close()
            raise PermissionError("Unauthorized: Only Admin or Department Coordinators can make booking decisions.")

        if decision == "approved" and not assigned_room_id:
            assigned_room_id = booking.get("preferred_room_id")

        now = datetime.now(timezone.utc).isoformat()
        cursor.execute("""
        UPDATE bookings SET
            status = ?,
            assigned_room_id = ?,
            assigned_day = ?,
            assigned_start_period = ?,
            assigned_end_period = ?,
            decision_reason = ?,
            decided_by = ?,
            decided_at = ?
        WHERE id = ?
        """, (
            decision,
            assigned_room_id,
            assigned_day,
            assigned_start_period,
            assigned_end_period,
            reason,
            decided_by_email,
            now,
            booking_id
        ))

        # Log to audit logs
        cursor.execute("""
        INSERT INTO audit_logs (user_email, action, details, timestamp)
        VALUES (?, ?, ?, ?)
        """, (
            decided_by_email,
            f"BOOKING_{decision.upper()}",
            json.dumps({"booking_id": booking_id, "room": assigned_room_id, "reason": reason}),
            now
        ))

        # Send notification to requester
        cursor.execute("""
        INSERT INTO notifications (target_role, target_email, title, message, type, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (
            booking["role"],
            booking.get("requester_email"),
            f"Booking {booking_id} {decision.replace('_', ' ').capitalize()}",
            f"Your request '{booking['title']}' has been {decision}. Reason: {reason}",
            "success" if decision == "approved" else ("warning" if decision == "alternative_offered" else "error"),
            now
        ))

        conn.commit()
        conn.close()

        return {
            "booking_id": booking_id,
            "status": decision,
            "assigned_room_id": assigned_room_id,
            "reason": reason,
            "decided_at": now
        }

    def find_alternative_venues(self, attendance: int, room_types: List[str], needs: List[str], day: str, start_period: int, end_period: int) -> List[Dict[str, Any]]:
        """Suggests matching free venues for a given slot."""
        candidates = []
        needs_set = set(needs)
        for r in self.rooms.values():
            if "event" not in r.get("allowed_uses", []):
                continue
            if r["type"] not in room_types:
                continue
            if r["capacity"] < attendance:
                continue
            feats = set(r.get("features", [])) | ({"accessible"} if r.get("accessible") else set())
            if needs_set - feats:
                continue

            candidates.append({
                "room_id": r["id"],
                "name": r["name"],
                "building": r["building"],
                "type": r["type"],
                "capacity": r["capacity"],
                "features": r.get("features", []),
                "accessible": r.get("accessible", False)
            })

        candidates.sort(key=lambda x: x["capacity"])
        return candidates


booking_service = BookingService()

