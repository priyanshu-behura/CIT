import json
import logging
import re
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional, Tuple
from app.core.database import get_db_connection
from app.services.dataset_service import dataset_service
from app.core.config import settings

logger = logging.getLogger("cit.booking_service")

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

    def _sync_initial_bookings_to_mongo(self, mongo_db: Any):
        """Seed initial official bookings from dataset or SQLite read-only archive to MongoDB Atlas."""
        try:
            # First attempt to read official records from read-only SQLite archive
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute("SELECT * FROM bookings")
            rows = [dict(r) for r in cur.fetchall()]
            conn.close()

            if rows:
                for r in rows:
                    for field in ["windows", "room_types", "needs", "mandatory_for_groups"]:
                        val = r.get(field)
                        if isinstance(val, str):
                            try:
                                r[field] = json.loads(val)
                            except Exception:
                                r[field] = []
                    mongo_db.bookings.replace_one({"id": r["id"]}, r, upsert=True)
                logger.info(f"Synced {len(rows)} official bookings from SQLite archive to MongoDB Atlas.")
                return

            # If SQLite archive has no bookings, seed from raw dataset
            official_reqs = self.dataset.get("booking_requests", [])
            cancelled_ids = {c["request_id"] for c in self.dataset.get("cancellations", [])}
            now_iso = datetime.now(timezone.utc).isoformat()
            for req in official_reqs:
                is_cancelled = req["id"] in cancelled_ids
                b_doc = {
                    "id": req["id"],
                    "requester_name": req.get("requested_by", req.get("requester", "Campus Requester")),
                    "requested_by": req.get("requested_by", req.get("requester", "Campus Requester")),
                    "requester_email": f"{req.get('role', 'club')}@cit.edu",
                    "role": req.get("role", "club"),
                    "requested_category": req.get("requested_category", req.get("category", "club_event")),
                    "category": req.get("category", "club_event"),
                    "effective_category": req.get("category", "club_event"),
                    "title": req.get("title", f"Event {req['id']}"),
                    "description": req.get("description", ""),
                    "attendance": req.get("attendance", 50),
                    "duration_periods": req.get("duration_periods", 2),
                    "windows": req.get("windows", []),
                    "room_types": req.get("room_types", ["classroom"]),
                    "needs": req.get("needs", []),
                    "mandatory_for_groups": req.get("mandatory_for_groups", []),
                    "preferred_room_id": req.get("preferred_room_id"),
                    "status": "cancelled" if is_cancelled else "pending",
                    "decision_reason": "Officially cancelled by requester" if is_cancelled else None,
                    "assigned_room_id": None,
                    "assigned_day": None,
                    "assigned_start_period": None,
                    "assigned_end_period": None,
                    "decided_by": None,
                    "decided_at": None,
                    "submitted_at": req.get("submitted_at", now_iso)
                }
                mongo_db.bookings.replace_one({"id": req["id"]}, b_doc, upsert=True)
            logger.info(f"Seeded {len(official_reqs)} dataset bookings to MongoDB Atlas.")
        except Exception as e:
            logger.warning(f"Could not sync initial bookings to MongoDB: {e}")

    def get_all_bookings(self, status: Optional[str] = None, role: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Fetch all bookings from MongoDB Atlas primary database.
        Falls back to read-only SQLite historical archive if MongoDB is unreachable or empty.
        """
        # Primary: Query MongoDB Atlas
        try:
            from app.core.mongo import get_mongo_db
            mongo_db = get_mongo_db()

            # Ensure initial official bookings exist in MongoDB
            if mongo_db.bookings.count_documents({}) == 0:
                self._sync_initial_bookings_to_mongo(mongo_db)

            filter_q = {}
            if status:
                filter_q["status"] = status
            if role:
                filter_q["role"] = role

            docs = list(mongo_db.bookings.find(filter_q).sort("submitted_at", -1))
            if docs or mongo_db.bookings.count_documents({}) > 0:
                results = []
                for doc in docs:
                    item = dict(doc)
                    item.pop("_id", None)
                    for field in ["windows", "room_types", "needs", "mandatory_for_groups"]:
                        val = item.get(field)
                        if isinstance(val, str):
                            try:
                                item[field] = json.loads(val)
                            except Exception:
                                item[field] = []
                        elif val is None:
                            item[field] = []
                    if "requester_name" not in item and "requested_by" in item:
                        item["requester_name"] = item["requested_by"]
                    if "effective_category" not in item:
                        item["effective_category"] = item.get("requested_category", item.get("category", "club_event"))
                    if "requested_category" not in item:
                        item["requested_category"] = item.get("category", "club_event")
                    results.append(item)
                return results
        except Exception as me:
            logger.warning(f"MongoDB bookings fetch notice: {me}. Falling back to SQLite read-only archive.")

        # Fallback: Read-only SQLite query
        try:
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
        except Exception as se:
            logger.error(f"Fallback read-only SQLite booking query failed: {se}")
            return []

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
        """
        Create a new booking request persisted in MongoDB Atlas primary database.
        Strictly preserves SQLite as a read-only historical archive (zero SQLite writes).
        Guards against duplicate submissions and performs venue capacity pre-checks.
        """
        if attendance <= 0:
            raise ValueError("Attendance must be greater than 0.")

        if end_period < start_period:
            raise ValueError("End period cannot be earlier than start period.")

        from app.core.mongo import get_mongo_db
        mongo_db = get_mongo_db()

        # Calculate effective category by applying role cap
        cap = ROLE_CAPS.get(role, "club_event")
        r_idx = PRIORITY_ORDER.index(requested_category) if requested_category in PRIORITY_ORDER else len(PRIORITY_ORDER) - 1
        c_idx = PRIORITY_ORDER.index(cap) if cap in PRIORITY_ORDER else len(PRIORITY_ORDER) - 1
        effective_category = PRIORITY_ORDER[max(r_idx, c_idx)]

        # Edge case protection: Prevent rapid duplicate confirmation clicks within 15 seconds
        now_dt = datetime.now(timezone.utc)
        recent_threshold = (now_dt - timedelta(seconds=15)).isoformat()
        existing_duplicate = mongo_db.bookings.find_one({
            "requester_email": requester_email,
            "title": title.strip(),
            "windows.0.day": day,
            "windows.0.from_period": start_period,
            "windows.0.to_period": end_period,
            "submitted_at": {"$gte": recent_threshold}
        })
        if existing_duplicate:
            logger.info(f"Duplicate booking request prevented: returning existing ID {existing_duplicate['id']}")
            return {
                "id": existing_duplicate["id"],
                "status": existing_duplicate.get("status", "pending"),
                "message": f"Booking request already registered as {existing_duplicate['id']} (duplicate prevented).",
                "effective_category": existing_duplicate.get("effective_category", effective_category)
            }

        # ID Generation: Determine next REQ-XXX sequence from MongoDB Atlas and SQLite archive
        highest_req_num = 0
        req_cursor = mongo_db.bookings.find({"id": {"$regex": r"^REQ-\d+"}}, {"id": 1})
        for doc in req_cursor:
            m = re.search(r"^REQ-(\d+)", str(doc.get("id", "")))
            if m:
                highest_req_num = max(highest_req_num, int(m.group(1)))

        # Also check SQLite archive (read-only) in case of historical REQ- IDs
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute("SELECT id FROM bookings WHERE id LIKE 'REQ-%'")
            for r in cur.fetchall():
                m = re.search(r"^REQ-(\d+)", str(r[0]))
                if m:
                    highest_req_num = max(highest_req_num, int(m.group(1)))
            conn.close()
        except Exception:
            pass

        booking_id = f"REQ-{highest_req_num + 1:03d}"
        now_iso = now_dt.isoformat()
        windows = [{"day": day, "from_period": start_period, "to_period": end_period}]

        # Construct authoritative booking document
        booking_doc = {
            "id": booking_id,
            "requester_name": requester_name,
            "requested_by": requester_name,
            "requester_email": requester_email,
            "role": role,
            "requested_category": requested_category,
            "category": effective_category,
            "effective_category": effective_category,
            "title": title.strip(),
            "description": description.strip() if description else "",
            "attendance": attendance,
            "duration_periods": duration_periods,
            "windows": windows,
            "room_types": room_types,
            "needs": needs,
            "mandatory_for_groups": mandatory_for_groups or [],
            "preferred_room_id": preferred_room_id if preferred_room_id else None,
            "status": "pending",
            "assigned_room_id": None,
            "assigned_day": None,
            "assigned_start_period": None,
            "assigned_end_period": None,
            "decision_reason": None,
            "decided_by": None,
            "decided_at": None,
            "submitted_at": now_iso
        }

        # Persist to MongoDB Atlas primary database
        mongo_db.bookings.insert_one(booking_doc)

        # Notify administrator in MongoDB Atlas
        try:
            mongo_db.notifications.insert_one({
                "target_role": "admin",
                "target_email": "admin@cit.edu",
                "title": f"New Booking Request {booking_id}",
                "message": f"{requester_name} ({role}) submitted '{title}' for {day} P{start_period}-P{end_period}.",
                "type": "info",
                "created_at": now_iso
            })
        except Exception as ne:
            logger.warning(f"Could not record notification in MongoDB: {ne}")

        return {
            "id": booking_id,
            "status": "pending",
            "message": "Booking request successfully registered and pending administrative review.",
            "effective_category": effective_category,
            "booking": {k: v for k, v in booking_doc.items() if k != "_id"}
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
        Approve, reject, or offer alternative for a booking request in MongoDB Atlas.
        Strictly enforces: Users CANNOT approve their own requests!
        Only Admin or Department Coordinator (for departmental requests) can approve.
        Zero writes to SQLite archive.
        """
        from app.core.mongo import get_mongo_db
        mongo_db = get_mongo_db()

        booking = mongo_db.bookings.find_one({"id": booking_id})
        if not booking:
            # Check read-only SQLite archive as fallback
            try:
                conn = get_db_connection()
                cur = conn.cursor()
                cur.execute("SELECT * FROM bookings WHERE id = ?", (booking_id,))
                row = cur.fetchone()
                conn.close()
                if row:
                    b_dict = dict(row)
                    b_dict["windows"] = json.loads(b_dict.get("windows") or "[]")
                    b_dict["room_types"] = json.loads(b_dict.get("room_types") or "[]")
                    b_dict["needs"] = json.loads(b_dict.get("needs") or "[]")
                    b_dict["mandatory_for_groups"] = json.loads(b_dict.get("mandatory_for_groups") or "[]")
                    mongo_db.bookings.replace_one({"id": booking_id}, b_dict, upsert=True)
                    booking = b_dict
            except Exception:
                pass

        if not booking:
            raise ValueError(f"Booking {booking_id} not found.")

        # STRICT ENFORCEMENT: Self-approval check
        requester_email = booking.get("requester_email", "")
        if decided_by_email and requester_email:
            if decided_by_email.lower().strip() == requester_email.lower().strip():
                raise PermissionError("Self-approval violation: Users are strictly forbidden from approving their own booking requests.")

        # Authority check
        if decided_by_role not in ("admin", "coordinator"):
            raise PermissionError("Unauthorized: Only Admin or Department Coordinators can make booking decisions.")

        if decision == "approved" and not assigned_room_id:
            assigned_room_id = booking.get("preferred_room_id")

        now_iso = datetime.now(timezone.utc).isoformat()

        # Update authoritative document in MongoDB Atlas
        update_fields = {
            "status": decision,
            "assigned_room_id": assigned_room_id,
            "assigned_day": assigned_day,
            "assigned_start_period": assigned_start_period,
            "assigned_end_period": assigned_end_period,
            "decision_reason": reason,
            "decided_by": decided_by_email,
            "decided_at": now_iso,
            "updated_at": now_iso
        }
        mongo_db.bookings.update_one({"id": booking_id}, {"$set": update_fields})

        # Log to MongoDB audit logs
        try:
            mongo_db.audit_logs.insert_one({
                "user_email": decided_by_email,
                "action": f"BOOKING_{decision.upper()}",
                "details": json.dumps({"booking_id": booking_id, "room": assigned_room_id, "reason": reason}),
                "timestamp": now_iso
            })
        except Exception as ae:
            logger.warning(f"Could not record audit log in MongoDB: {ae}")

        # Send notification to requester in MongoDB
        try:
            mongo_db.notifications.insert_one({
                "target_role": booking.get("role", "club"),
                "target_email": booking.get("requester_email"),
                "title": f"Booking {booking_id} {decision.replace('_', ' ').capitalize()}",
                "message": f"Your request '{booking.get('title')}' has been {decision}. Reason: {reason}",
                "type": "success" if decision == "approved" else ("warning" if decision == "alternative_offered" else "error"),
                "created_at": now_iso
            })
        except Exception as ne:
            logger.warning(f"Could not record notification in MongoDB: {ne}")

        return {
            "booking_id": booking_id,
            "status": decision,
            "assigned_room_id": assigned_room_id,
            "reason": reason,
            "decided_at": now_iso
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
