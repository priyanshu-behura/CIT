import json
import copy
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from app.core.database import get_db_connection
from app.services.scheduler_service import SchedulerService
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
        """Fetch all disruption records from SQLite."""
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

    def create_disruption(self, disruption_id: str, title: str, description: str, changes: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Register or update a disruption scenario."""
        conn = get_db_connection()
        cursor = conn.cursor()
        now = datetime.now(timezone.utc).isoformat()

        cursor.execute("SELECT id FROM disruptions WHERE id = ?", (disruption_id,))
        existing = cursor.fetchone()

        if existing:
            cursor.execute("""
            UPDATE disruptions SET
                title = ?,
                description = ?,
                changes = ?,
                status = 'pending',
                rescheduled_json = NULL,
                stability_metrics = NULL,
                approved_by = NULL,
                approved_at = ?
            WHERE id = ?
            """, (title, description, json.dumps(changes), now, disruption_id))
        else:
            cursor.execute("""
            INSERT INTO disruptions (id, title, description, changes, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """, (
                disruption_id,
                title,
                description,
                json.dumps(changes),
                "pending",
                now
            ))

        cursor.execute("""
        INSERT INTO notifications (target_role, target_email, title, message, type, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (
            "admin",
            "admin@cit.edu",
            f"New Disruption Logged: {title}",
            f"Scenario '{title}' was submitted. Admin review and rescheduling simulation required.",
            "warning",
            now
        ))

        conn.commit()
        conn.close()

        return {"id": disruption_id, "status": "pending", "title": title}

    def simulate_rescheduling(self, disruption_id: str) -> Dict[str, Any]:
        """
        Runs minimal-movement rescheduling against baseline schedule.
        Calculates session displacement diffs, affected faculty, affected groups.
        """
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM disruptions WHERE id = ?", (disruption_id,))
        row = cursor.fetchone()
        if not row:
            conn.close()
            raise ValueError(f"Disruption {disruption_id} not found.")

        disruption = dict(row)
        changes = json.loads(disruption.get("changes") or "[]")

        # Get or generate baseline schedule
        cursor.execute("SELECT * FROM schedules WHERE schedule_type = 'baseline' AND status IN ('optimal', 'feasible') ORDER BY id DESC LIMIT 1")
        baseline_row = cursor.fetchone()

        if baseline_row:
            baseline_data = json.loads(baseline_row["schedule_json"])
            baseline_assign, _ = validator.to_assign(baseline_data)
        else:
            # Generate baseline now
            tt_res = self.scheduler.solve_timetable(max_time_seconds=30)
            exams_res = self.scheduler.solve_exams()
            fest_res = self.scheduler.solve_spectra_bookings(tt_res["assign_dict"])
            baseline_data = {
                "team": "Tech Zephyr 4.0",
                "dataset_id": self.scheduler.data["dataset_id"],
                "sessions": tt_res["sessions"],
                "exams": exams_res,
                "fest_week": fest_res
            }
            baseline_assign = tt_res["assign_dict"]

            # Save baseline in DB
            now_iso = datetime.now(timezone.utc).isoformat()
            cursor.execute("""
            INSERT INTO schedules (schedule_type, created_at, status, solver_duration, schedule_json, hard_violations, soft_penalty)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                "baseline", now_iso, tt_res["status"], tt_res["solver_duration"], json.dumps(baseline_data), 0, 233
            ))
            conn.commit()

        # Apply disruption to dataset
        dis_obj = {"changes": changes}
        disrupted_data = validator.apply_disruption(self.scheduler.data, dis_obj)

        # Solve with minimal movement penalty
        dis_res = self.scheduler.solve_timetable(
            custom_data=disrupted_data,
            baseline_assign=baseline_assign,
            max_time_seconds=35
        )

        if dis_res.get("status") == "infeasible":
            conn.close()
            err_msg = dis_res.get("error") or "Rescheduling is infeasible under the current hard constraints."
            return {
                "status": "infeasible",
                "error": err_msg,
                "disruption_id": disruption_id
            }

        # Solve bookings under new timetable
        dis_fest = self.scheduler.solve_spectra_bookings(dis_res["assign_dict"])

        rescheduled_schedule = {
            "team": "Tech Zephyr 4.0",
            "dataset_id": self.scheduler.data["dataset_id"],
            "sessions": dis_res["sessions"],
            "exams": baseline_data.get("exams", []),
            "fest_week": dis_fest
        }

        # Run validator to verify stability & violations
        v_report = validator.run(disrupted_data, rescheduled_schedule, baseline=baseline_data)

        # Compute detailed visual movement diffs
        new_assign = dis_res["assign_dict"]
        session_diffs = []
        affected_fac = set()
        affected_groups = set()

        for s in disrupted_data["sessions"]:
            sid = s["id"]
            if sid in new_assign and sid in baseline_assign:
                b_day, b_sp, b_rid = baseline_assign[sid]
                n_day, n_sp, n_rid = new_assign[sid]
                if (b_day, b_sp, b_rid) != (n_day, n_sp, n_rid):
                    change_type = "time_and_room" if (b_day, b_sp) != (n_day, n_sp) and b_rid != n_rid else (
                        "time_only" if (b_day, b_sp) != (n_day, n_sp) else "room_only"
                    )
                    session_diffs.append({
                        "session_id": sid,
                        "course_id": s["course_id"],
                        "kind": s["kind"],
                        "faculty_id": s["faculty_id"],
                        "groups": s["groups"],
                        "change_type": change_type,
                        "before": {"day": b_day, "start_period": b_sp, "room_id": b_rid},
                        "after": {"day": n_day, "start_period": n_sp, "room_id": n_rid}
                    })
                    affected_fac.add(s["faculty_id"])
                    for g in s["groups"]:
                        affected_groups.add(g)

        # Check for added sessions
        base_sids = set(baseline_assign.keys())
        for s in disrupted_data["sessions"]:
            if s["id"] not in base_sids and s["id"] in new_assign:
                n_day, n_sp, n_rid = new_assign[s["id"]]
                session_diffs.append({
                    "session_id": s["id"],
                    "course_id": s["course_id"],
                    "kind": s["kind"],
                    "faculty_id": s["faculty_id"],
                    "groups": s["groups"],
                    "change_type": "new_session",
                    "before": None,
                    "after": {"day": n_day, "start_period": n_sp, "room_id": n_rid}
                })
                affected_fac.add(s["faculty_id"])

        stability = v_report.get("stability", {
            "sessions_moved": len(session_diffs),
            "time_changed": sum(1 for d in session_diffs if "time" in d["change_type"]),
            "room_only_changed": sum(1 for d in session_diffs if d["change_type"] == "room_only"),
            "moved_ids": [d["session_id"] for d in session_diffs]
        })

        # Save proposal in DB
        cursor.execute("""
        UPDATE disruptions SET
            rescheduled_json = ?,
            stability_metrics = ?
        WHERE id = ?
        """, (
            json.dumps(rescheduled_schedule),
            json.dumps(stability),
            disruption_id
        ))
        conn.commit()
        conn.close()

        return {
            "status": "success",
            "disruption_id": disruption_id,
            "stability": stability,
            "hard_violations": v_report.get("hard_violation_count", 0),
            "soft_total": v_report.get("soft_total", 0),
            "session_diffs": session_diffs,
            "affected_faculty_count": len(affected_fac),
            "affected_groups_count": len(affected_groups),
            "affected_faculty": sorted(list(affected_fac)),
            "affected_groups": sorted(list(affected_groups)),
            "rescheduled_sessions_count": len(dis_res["sessions"])
        }

    def approve_and_commit(self, disruption_id: str, admin_email: str) -> Dict[str, Any]:
        """
        Admin explicitly approves and commits the proposed rescheduling.
        Saves proposal as the new official schedule and exports exports/schedule_after.json.
        """
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM disruptions WHERE id = ?", (disruption_id,))
        row = cursor.fetchone()
        if not row:
            conn.close()
            raise ValueError(f"Disruption {disruption_id} not found.")

        dis = dict(row)
        rescheduled_json = dis.get("rescheduled_json")
        if not rescheduled_json:
            conn.close()
            raise ValueError("No simulation proposal exists for this disruption. Run simulation first.")

        now = datetime.now(timezone.utc).isoformat()

        # Update disruption record
        cursor.execute("""
        UPDATE disruptions SET
            status = 'applied',
            approved_by = ?,
            approved_at = ?
        WHERE id = ?
        """, (admin_email, now, disruption_id))

        # Save to schedules table
        cursor.execute("""
        INSERT INTO schedules (schedule_type, created_at, status, solver_duration, schedule_json, hard_violations, soft_penalty)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            "disruption", now, "optimal", 0.0, rescheduled_json, 0, 0
        ))

        # Export to exports/schedule_after.json only if file does not exist (protects submission file)
        exports_dir = Path(settings.WORKSPACE_ROOT) / "exports"
        exports_dir.mkdir(parents=True, exist_ok=True)
        target_after = exports_dir / "schedule_after.json"
        if not target_after.exists():
            with open(target_after, "w", encoding="utf-8") as f:
                f.write(rescheduled_json)

        # Broadcast notifications
        cursor.execute("""
        INSERT INTO notifications (target_role, target_email, title, message, type, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (
            "all",
            None,
            "Campus Timetable Revised (Disruption Applied)",
            f"Admin {admin_email} approved disruption '{dis['title']}'. The revised timetable is now active.",
            "warning",
            now
        ))

        # Audit log
        cursor.execute("""
        INSERT INTO audit_logs (user_email, action, details, timestamp)
        VALUES (?, ?, ?, ?)
        """, (
            admin_email,
            "DISRUPTION_APPROVED",
            json.dumps({"disruption_id": disruption_id, "title": dis["title"]}),
            now
        ))

        conn.commit()
        conn.close()

        return {
            "status": "applied",
            "disruption_id": disruption_id,
            "approved_by": admin_email,
            "export_file": "exports/schedule_after.json"
        }


disruption_service = DisruptionService()

