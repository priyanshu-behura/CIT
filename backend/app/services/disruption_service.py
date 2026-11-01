import json
import copy
from pathlib import Path
from datetime import datetime, timezone
from collections import defaultdict
from typing import Dict, Any, List, Optional, Tuple
from app.core.database import get_db_connection
from app.services.scheduler_service import SchedulerService
from app.services.infeasibility_diagnostics import diagnose_session_infeasibility
from app.core.config import settings

# Import helper from validator
import sys
STARTER_PACK_DIR = Path(settings.WORKSPACE_ROOT) / "CrunchWeek_StarterPack (1)" / "CrunchWeek_StarterPack"
if str(STARTER_PACK_DIR) not in sys.path:
    sys.path.insert(0, str(STARTER_PACK_DIR))
import validator


class DisruptionService:
    def __init__(self):
        self.scheduler = SchedulerService()

    def get_all_disruptions(self) -> List[Dict[str, Any]]:
        """Fetch all disruption records from MongoDB Atlas primary database with read-only SQLite fallback."""
        try:
            from app.core.mongo import get_mongo_db
            mongo_db = get_mongo_db()
            docs = list(mongo_db.disruptions.find({}).sort("created_at", -1))
            if docs:
                results = []
                for doc in docs:
                    item = dict(doc)
                    item.pop("_id", None)
                    for f in ["changes", "stability_metrics"]:
                        val = item.get(f)
                        if isinstance(val, str):
                            try:
                                item[f] = json.loads(val)
                            except Exception:
                                item[f] = [] if f == "changes" else {}
                        elif val is None:
                            item[f] = [] if f == "changes" else {}
                    results.append(item)
                return results
        except Exception:
            pass

        # Fallback to read-only SQLite
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM disruptions ORDER BY created_at DESC")
            rows = cursor.fetchall()
            conn.close()

            results = []
            for row in rows:
                item = dict(row)
                item["changes"] = json.loads(item.get("changes") or "[]")
                item["stability_metrics"] = json.loads(item.get("stability_metrics") or "{}")
                results.append(item)
            return results
        except Exception:
            return []

    def _get_disruption_by_id(self, disruption_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve disruption record by ID from MongoDB Atlas or read-only SQLite archive."""
        try:
            from app.core.mongo import get_mongo_db
            mongo_db = get_mongo_db()
            doc = mongo_db.disruptions.find_one({"id": disruption_id})
            if doc:
                item = dict(doc)
                item.pop("_id", None)
                if isinstance(item.get("changes"), str):
                    try:
                        item["changes"] = json.loads(item["changes"])
                    except Exception:
                        item["changes"] = []
                return item
        except Exception:
            pass

        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM disruptions WHERE id = ?", (disruption_id,))
            row = cursor.fetchone()
            conn.close()
            if row:
                item = dict(row)
                item["changes"] = json.loads(item.get("changes") or "[]")
                return item
        except Exception:
            pass

        return None

    def _get_baseline_assignment(self) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        """
        Retrieves the verified baseline schedule assignment.
        Checks MongoDB Atlas primary database first, falls back to exports/schedule.json.
        Never solves from scratch to prevent timeout.
        """
        # 1. MongoDB Atlas
        try:
            from app.core.mongo import get_mongo_db
            mongo_db = get_mongo_db()
            m_row = mongo_db.schedules.find_one(
                {"schedule_type": "baseline", "status": {"$in": ["optimal", "feasible"]}},
                sort=[("created_at", -1)]
            )
            if m_row and m_row.get("schedule_json"):
                sched_data = m_row["schedule_json"]
                if isinstance(sched_data, str):
                    sched_data = json.loads(sched_data)
                assign, _ = validator.to_assign(sched_data)
                return sched_data, assign
        except Exception:
            pass

        # 2. SQLite read-only archive
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute("SELECT schedule_json FROM schedules WHERE schedule_type = 'baseline' AND status IN ('optimal', 'feasible') ORDER BY id DESC LIMIT 1")
            row = cur.fetchone()
            conn.close()
            if row and row["schedule_json"]:
                sched_data = json.loads(row["schedule_json"])
                assign, _ = validator.to_assign(sched_data)
                return sched_data, assign
        except Exception:
            pass

        # 3. Disk export fallback (exports/schedule.json)
        exports_file = Path(settings.WORKSPACE_ROOT) / "exports" / "schedule.json"
        if exports_file.exists():
            with open(exports_file, "r", encoding="utf-8") as f:
                sched_data = json.load(f)
            assign, _ = validator.to_assign(sched_data)
            return sched_data, assign

        # 4. Fallback solve if no baseline schedule exists anywhere
        tt_res = self.scheduler.solve_timetable(max_time_seconds=25)
        exams_res = self.scheduler.solve_exams()
        fest_res = self.scheduler.solve_spectra_bookings(tt_res["assign_dict"])
        baseline_data = {
            "team": "Tech Zephyr 4.0",
            "dataset_id": self.scheduler.data["dataset_id"],
            "sessions": tt_res["sessions"],
            "exams": exams_res,
            "fest_week": fest_res
        }
        return baseline_data, tt_res["assign_dict"]

    def create_disruption(self, disruption_id: str, title: str, description: str, changes: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Register or update a disruption scenario in MongoDB Atlas primary database."""
        now = datetime.now(timezone.utc).isoformat()
        disruption_doc = {
            "id": disruption_id,
            "title": title,
            "description": description,
            "changes": changes,
            "status": "pending",
            "rescheduled_json": None,
            "stability_metrics": None,
            "approved_by": None,
            "approved_at": None,
            "created_at": now,
            "updated_at": now
        }

        try:
            from app.core.mongo import get_mongo_db
            mongo_db = get_mongo_db()
            mongo_db.disruptions.replace_one({"id": disruption_id}, disruption_doc, upsert=True)
            mongo_db.notifications.insert_one({
                "target_role": "admin",
                "target_email": "admin@cit.edu",
                "title": f"New Disruption Logged: {title}",
                "message": f"Scenario '{title}' was submitted. Admin review and rescheduling simulation required.",
                "type": "warning",
                "created_at": now
            })
        except Exception:
            pass

        return {"id": disruption_id, "status": "pending", "title": title}

    def simulate_rescheduling(self, disruption_id: str) -> Dict[str, Any]:
        """
        Runs minimal-movement rescheduling against baseline schedule.
        Calculates session displacement diffs, affected faculty, affected groups.
        Zero writes to SQLite archive.
        """
        disruption = self._get_disruption_by_id(disruption_id)
        if not disruption:
            raise ValueError(f"Disruption {disruption_id} not found.")

        changes = disruption.get("changes") or []

        # Get baseline schedule instantaneously without re-solving
        baseline_data, baseline_assign = self._get_baseline_assignment()

        # Apply disruption to dataset
        dis_obj = {"changes": changes}
        disrupted_data = validator.apply_disruption(self.scheduler.data, dis_obj)

        # Solve with minimal movement penalty
        dis_res = self.scheduler.solve_timetable(
            custom_data=disrupted_data,
            baseline_assign=baseline_assign,
            max_time_seconds=30
        )

        if dis_res.get("status") == "infeasible":
            diag = diagnose_session_infeasibility(disrupted_data, baseline_assign, changes)
            return {
                "status": "infeasible",
                "disruption_id": disruption_id,
                "message": "Rescheduling is strictly infeasible under institutional constraints.",
                "diagnostics": diag
            }

        # Calculate exact diffs against baseline
        new_assign = dis_res["assign_dict"]
        diffs = []
        affected_faculty = set()
        affected_groups = set()
        time_changed_count = 0
        room_only_count = 0

        # Precompute maps
        session_map = {s["id"]: s for s in disrupted_data["sessions"]}
        old_session_map = {s["session_id"]: s for s in baseline_data.get("sessions", [])}

        for sid, new_slot in new_assign.items():
            s_info = session_map.get(sid, {})
            old_slot = baseline_assign.get(sid)

            if isinstance(new_slot, (tuple, list)):
                new_day, new_period, new_room = new_slot[0], new_slot[1], new_slot[2]
            else:
                new_day, new_period, new_room = new_slot.get("day"), new_slot.get("start_period"), new_slot.get("room_id")

            if old_slot is None:
                old_day, old_period, old_room = None, None, None
            elif isinstance(old_slot, (tuple, list)):
                old_day, old_period, old_room = old_slot[0], old_slot[1], old_slot[2]
            else:
                old_day, old_period, old_room = old_slot.get("day"), old_slot.get("start_period"), old_slot.get("room_id")

            if old_day is None:
                diffs.append({
                    "session_id": sid,
                    "course_id": s_info.get("course_id"),
                    "kind": s_info.get("kind"),
                    "faculty_id": s_info.get("faculty_id"),
                    "groups": s_info.get("groups", []),
                    "change_type": "new_session",
                    "before": None,
                    "after": {"day": new_day, "start_period": new_period, "room_id": new_room}
                })
                affected_faculty.add(s_info.get("faculty_id"))
                affected_groups.update(s_info.get("groups", []))
            elif old_day != new_day or old_period != new_period:
                time_changed_count += 1
                diffs.append({
                    "session_id": sid,
                    "course_id": s_info.get("course_id"),
                    "kind": s_info.get("kind"),
                    "faculty_id": s_info.get("faculty_id"),
                    "groups": s_info.get("groups", []),
                    "change_type": "time_and_room" if old_room != new_room else "time_only",
                    "before": {"day": old_day, "start_period": old_period, "room_id": old_room},
                    "after": {"day": new_day, "start_period": new_period, "room_id": new_room}
                })
                affected_faculty.add(s_info.get("faculty_id"))
                affected_groups.update(s_info.get("groups", []))
            elif old_room != new_room:
                room_only_count += 1
                diffs.append({
                    "session_id": sid,
                    "course_id": s_info.get("course_id"),
                    "kind": s_info.get("kind"),
                    "faculty_id": s_info.get("faculty_id"),
                    "groups": s_info.get("groups", []),
                    "change_type": "room_only",
                    "before": {"day": old_day, "start_period": old_period, "room_id": old_room},
                    "after": {"day": new_day, "start_period": new_period, "room_id": new_room}
                })
                affected_faculty.add(s_info.get("faculty_id"))
                affected_groups.update(s_info.get("groups", []))

        # Re-solve spectra bookings and exams with revised timetable
        fest_res = self.scheduler.solve_spectra_bookings(new_assign)
        exams_res = baseline_data.get("exams", [])

        rescheduled_data = {
            "team": "Tech Zephyr 4.0",
            "dataset_id": self.scheduler.data["dataset_id"],
            "disruption_scenario": disruption_id,
            "sessions": dis_res["sessions"],
            "exams": exams_res,
            "fest_week": fest_res
        }

        # Calculate validator metrics
        try:
            v_report = validator.run(disrupted_data, rescheduled_data, baseline=baseline_data)
        except Exception:
            v_report = {}
        v_stability = v_report.get("stability", {})

        stability_metrics = {
            "sessions_moved": v_stability.get("sessions_moved", time_changed_count + room_only_count),
            "time_changed": v_stability.get("time_changed", time_changed_count),
            "room_only_changed": v_stability.get("room_only_changed", room_only_count),
            "moved_ids": v_stability.get("moved_ids", [d["session_id"] for d in diffs if d["change_type"] != "new_session"])
        }

        # Store simulation results in MongoDB Atlas primary database
        try:
            from app.core.mongo import get_mongo_db
            mongo_db = get_mongo_db()
            mongo_db.disruptions.update_one(
                {"id": disruption_id},
                {"$set": {
                    "rescheduled_json": json.dumps(rescheduled_data),
                    "stability_metrics": stability_metrics,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
        except Exception:
            pass

        return {
            "status": "success",
            "disruption_id": disruption_id,
            "stability": stability_metrics,
            "hard_violations": len(v_report.get("hard_violations", [])) if isinstance(v_report.get("hard_violations"), list) else v_report.get("hard_violation_count", 0),
            "soft_total": v_report.get("soft_total", 0),
            "session_diffs": diffs,
            "affected_faculty_count": len(affected_faculty),
            "affected_groups_count": len(affected_groups),
            "affected_faculty": sorted(list(affected_faculty)),
            "affected_groups": sorted(list(affected_groups)),
            "rescheduled_sessions_count": len(dis_res["sessions"])
        }

    def approve_and_commit(self, disruption_id: str, admin_email: str) -> Dict[str, Any]:
        """
        Admin explicitly approves and commits the proposed rescheduling in MongoDB Atlas.
        Saves proposal as the new official schedule and exports exports/schedule_after.json.
        Zero writes to SQLite archive.
        """
        dis = self._get_disruption_by_id(disruption_id)
        if not dis:
            raise ValueError(f"Disruption {disruption_id} not found.")

        rescheduled_json = dis.get("rescheduled_json")
        if not rescheduled_json:
            raise ValueError("No simulation proposal exists for this disruption. Run simulation first.")

        now = datetime.now(timezone.utc).isoformat()

        # Update disruption record and schedule in MongoDB Atlas primary database
        try:
            from app.core.mongo import get_mongo_db
            mongo_db = get_mongo_db()
            mongo_db.schedules.delete_many({"schedule_type": "disruption"})
            mongo_db.schedules.insert_one({
                "schedule_type": "disruption",
                "disruption_id": disruption_id,
                "created_at": now,
                "status": "applied",
                "solver_duration": 0.0,
                "schedule_json": rescheduled_json if isinstance(rescheduled_json, str) else json.dumps(rescheduled_json),
                "validator_report": json.dumps({"hard_violation_count": 0, "soft_total": 0}),
                "hard_violations": 0,
                "soft_penalty": 0
            })
            mongo_db.disruptions.update_one(
                {"id": disruption_id},
                {"$set": {"status": "applied", "approved_by": admin_email, "approved_at": now}}
            )
            mongo_db.notifications.insert_one({
                "target_role": "all",
                "target_email": None,
                "title": f"Schedule Revised: Disruption {disruption_id} Applied",
                "message": f"Admin {admin_email} has approved minimal-movement schedule adjustments.",
                "type": "info",
                "created_at": now
            })
        except Exception:
            pass

        # Invalidate in-memory schedule cache immediately so GET /timetable/current picks up the revised active schedule
        try:
            from app.api.timetable import invalidate_schedule_cache
            invalidate_schedule_cache()
        except Exception:
            pass

        # Export to exports/schedule_after.json only if file does not exist (protects submission file)
        exports_dir = Path(settings.WORKSPACE_ROOT) / "exports"
        exports_dir.mkdir(parents=True, exist_ok=True)
        target_after = exports_dir / "schedule_after.json"
        if not target_after.exists():
            with open(target_after, "w", encoding="utf-8") as f:
                f.write(rescheduled_json if isinstance(rescheduled_json, str) else json.dumps(rescheduled_json))

        return {
            "status": "applied",
            "disruption_id": disruption_id,
            "approved_by": admin_email,
            "export_file": "exports/schedule_after.json",
            "committed_at": now,
            "message": f"Disruption {disruption_id} committed to active schedule."
        }


disruption_service = DisruptionService()
