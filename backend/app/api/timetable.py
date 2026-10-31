import json
from pathlib import Path
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, Dict, Any, List
from app.services.scheduler_service import SchedulerService
from app.services.dataset_service import dataset_service
from app.core.database import get_db_connection
from app.api.auth import get_current_user
from app.core.config import settings

# Import validator
import sys
STARTER_PACK_DIR = Path(settings.WORKSPACE_ROOT) / "CrunchWeek_StarterPack (1)" / "CrunchWeek_StarterPack"
if str(STARTER_PACK_DIR) not in sys.path:
    sys.path.insert(0, str(STARTER_PACK_DIR))
import validator

router = APIRouter(prefix="/timetable", tags=["Timetable Management"])
scheduler_service = SchedulerService()


@router.post("/generate")
def generate_timetable(current_user: Optional[Dict[str, Any]] = None):
    """
    Deterministic schedule generation using Google OR-Tools CP-SAT.
    Generates all 189 teaching sessions, 41 midsem exams, and Spectra week bookings.
    Exports to exports/schedule.json and verifies with official validator.
    """
    # 1. Solve timetable
    tt_res = scheduler_service.solve_timetable(max_time_seconds=35)
    if tt_res.get("status") == "infeasible":
        raise HTTPException(status_code=400, detail=f"Timetable generation infeasible: {tt_res.get('error')}")

    # 2. Solve exams
    exams_res = scheduler_service.solve_exams()

    # 3. Solve Spectra bookings
    fest_res = scheduler_service.solve_spectra_bookings(tt_res["assign_dict"])

    # 4. Assemble full schedule
    full_schedule = {
        "team": "Tech Zephyr 4.0",
        "dataset_id": scheduler_service.data["dataset_id"],
        "sessions": tt_res["sessions"],
        "exams": exams_res,
        "fest_week": fest_res
    }

    # 5. Run official validator
    v_report = validator.run(scheduler_service.data, full_schedule)

    # 6. Save in SQLite
    conn = get_db_connection()
    cursor = conn.cursor()
    now_iso = datetime.now(timezone.utc).isoformat()

    cursor.execute("""
    INSERT INTO schedules (schedule_type, created_at, status, solver_duration, schedule_json, validator_report, hard_violations, soft_penalty)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        "baseline",
        now_iso,
        tt_res["status"],
        tt_res.get("solver_duration", 0.0),
        json.dumps(full_schedule),
        json.dumps(v_report),
        v_report.get("hard_violation_count", 0),
        v_report.get("soft_total", 0)
    ))

    # 7. Write to exports/schedule.json only if file does not exist (protects submission file)
    exports_dir = Path(settings.WORKSPACE_ROOT) / "exports"
    exports_dir.mkdir(parents=True, exist_ok=True)
    target_export = exports_dir / "schedule.json"
    if not target_export.exists():
        with open(target_export, "w", encoding="utf-8") as f:
            json.dump(full_schedule, f, indent=2)

    conn.commit()
    conn.close()

    return {
        "status": "success",
        "solver_status": tt_res["status"],
        "solver_duration": tt_res.get("solver_duration"),
        "total_sessions_scheduled": len(tt_res["sessions"]),
        "total_exams_scheduled": len(exams_res),
        "hard_violations": v_report.get("hard_violation_count", 0),
        "hard_by_rule": v_report.get("hard_by_rule", {}),
        "soft_total": v_report.get("soft_total", 0),
        "booking_stats": v_report.get("bookings", {}),
        "export_file": "exports/schedule.json"
    }


@router.get("/current")
def get_current_timetable(
    group: Optional[str] = Query(None, description="Filter by student group, e.g. CSE-1"),
    faculty_id: Optional[str] = Query(None, description="Filter by faculty ID, e.g. F01"),
    room_id: Optional[str] = Query(None, description="Filter by room ID, e.g. LH-1"),
    day: Optional[str] = Query(None, description="Filter by day, e.g. MON")
):
    """
    Retrieve current active timetable sessions with full course, faculty, and room details.
    If no schedule has been generated yet, automatically generates one deterministically.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM schedules WHERE schedule_type='baseline' AND status IN ('optimal', 'feasible') ORDER BY id DESC LIMIT 1")
    row = cursor.fetchone()
    conn.close()

    if row:
        sched_data = json.loads(row["schedule_json"])
    else:
        # Generate on first access
        gen_res = generate_timetable()
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM schedules WHERE schedule_type='baseline' ORDER BY id DESC LIMIT 1")
        row = cursor.fetchone()
        conn.close()
        sched_data = json.loads(row["schedule_json"])

    raw_sessions = sched_data.get("sessions", [])
    raw_courses = {c["id"]: c for c in scheduler_service.data["courses"]}
    raw_faculty = {f["id"]: f for f in scheduler_service.data["faculty"]}
    raw_rooms = {r["id"]: r for r in scheduler_service.data["rooms"]}
    raw_sess_info = {s["id"]: s for s in scheduler_service.data["sessions"]}

    detailed_sessions = []
    for s_entry in raw_sessions:
        sid = s_entry["session_id"]
        s_info = raw_sess_info.get(sid, {})
        c_info = raw_courses.get(s_info.get("course_id"), {})
        f_info = raw_faculty.get(s_info.get("faculty_id"), {})
        r_info = raw_rooms.get(s_entry["room_id"], {})

        # Filters
        if group and group not in s_info.get("groups", []):
            continue
        if faculty_id and faculty_id != s_info.get("faculty_id"):
            continue
        if room_id and room_id != s_entry["room_id"]:
            continue
        if day and day != s_entry["day"]:
            continue

        detailed_sessions.append({
            "session_id": sid,
            "course_id": s_info.get("course_id"),
            "course_name": c_info.get("name", s_info.get("course_id")),
            "kind": s_info.get("kind"),
            "duration": s_info.get("duration", 1),
            "groups": s_info.get("groups", []),
            "faculty_id": s_info.get("faculty_id"),
            "faculty_name": f_info.get("name", s_info.get("faculty_id")),
            "faculty_dept": f_info.get("department", "CSE"),
            "room_id": s_entry["room_id"],
            "room_name": r_info.get("name", s_entry["room_id"]),
            "room_type": r_info.get("type", "classroom"),
            "room_capacity": r_info.get("capacity", 60),
            "day": s_entry["day"],
            "start_period": s_entry["start_period"],
            "end_period": s_entry["start_period"] + s_info.get("duration", 1) - 1,
            "basket_slot": s_info.get("basket_slot"),
            "fixed_slot": s_info.get("fixed_slot")
        })

    return {
        "dataset_id": sched_data.get("dataset_id", "cit-public-v1"),
        "total_scheduled": len(raw_sessions),
        "filtered_count": len(detailed_sessions),
        "sessions": detailed_sessions,
        "calendar": scheduler_service.data["calendar"]
    }


@router.get("/exams")
def get_exam_schedule(
    group: Optional[str] = Query(None, description="Filter by student group"),
    day: Optional[str] = Query(None, description="Filter by exam day")
):
    """Retrieve 41 midsem examinations with room assignments, halving effective room capacity."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM schedules WHERE schedule_type='baseline' AND status IN ('optimal', 'feasible') ORDER BY id DESC LIMIT 1")
    row = cursor.fetchone()
    conn.close()

    if not row:
        generate_timetable()
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM schedules WHERE schedule_type='baseline' ORDER BY id DESC LIMIT 1")
        row = cursor.fetchone()
        conn.close()

    sched_data = json.loads(row["schedule_json"])
    exams_list = sched_data.get("exams", [])
    raw_exams = {e["id"]: e for e in scheduler_service.data["exams"]}
    raw_rooms = {r["id"]: r for r in scheduler_service.data["rooms"]}

    results = []
    for e in exams_list:
        eid = e["exam_id"]
        info = raw_exams.get(eid, {})
        if group and group not in info.get("groups", []):
            continue
        if day and day != e.get("day"):
            continue

        assigned_rooms = []
        total_effective_seats = 0
        for rid in e.get("rooms", []):
            r = raw_rooms.get(rid, {})
            eff_cap = r.get("capacity", 0) // 2
            total_effective_seats += eff_cap
            assigned_rooms.append({
                "room_id": rid,
                "name": r.get("name", rid),
                "actual_capacity": r.get("capacity", 0),
                "effective_exam_capacity": eff_cap
            })

        results.append({
            "exam_id": eid,
            "course_ids": info.get("course_ids", []),
            "groups": info.get("groups", []),
            "student_count": info.get("size", 0),
            "duration_hours": info.get("duration_hours", 2),
            "day": e.get("day"),
            "session": e.get("session"),  # AM (09:30-11:30) or PM (14:00-16:00)
            "assigned_rooms": assigned_rooms,
            "total_effective_seats": total_effective_seats,
            "capacity_valid": total_effective_seats >= info.get("size", 0)
        })

    return {
        "total_exams": len(exams_list),
        "filtered_count": len(results),
        "exams": results,
        "exam_calendar": scheduler_service.data["calendar"]["exam_week"]
    }


@router.get("/validate")
def validate_active_schedule():
    """Runs the official validator.py directly on the current active schedule and returns the report."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM schedules WHERE schedule_type='baseline' AND status IN ('optimal', 'feasible') ORDER BY id DESC LIMIT 1")
    row = cursor.fetchone()
    conn.close()

    if not row:
        generate_timetable()
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM schedules WHERE schedule_type='baseline' ORDER BY id DESC LIMIT 1")
        row = cursor.fetchone()
        conn.close()

    sched_data = json.loads(row["schedule_json"])
    report = validator.run(scheduler_service.data, sched_data)
    return report

