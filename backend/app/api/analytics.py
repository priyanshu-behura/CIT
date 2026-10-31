import json
from collections import defaultdict
from fastapi import APIRouter
from app.services.dataset_service import dataset_service
from app.core.database import get_db_connection

router = APIRouter(prefix="/analytics", tags=["Campus Analytics & Reporting"])


@router.get("/overview")
def get_analytics_overview():
    """
    Computes real analytics derived strictly from the official CIT dataset,
    active timetable schedule, and live booking database records.
    Zero fabricated numbers.
    """
    data = dataset_service.raw_data
    rooms = {r["id"]: r for r in data["rooms"]}
    faculty = {f["id"]: f for f in data["faculty"]}
    groups = {g["id"]: g for g in data["student_groups"]}
    courses = {c["id"]: c for c in data["courses"]}
    sessions = data["sessions"]

    # 1. Active Schedule Occupancy
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT schedule_json, hard_violations, soft_penalty FROM schedules WHERE status IN ('optimal', 'feasible') ORDER BY id DESC LIMIT 1")
    row = cursor.fetchone()

    room_hours = defaultdict(int)
    faculty_hours = defaultdict(int)
    group_hours = defaultdict(int)
    day_distribution = defaultdict(int)
    period_distribution = defaultdict(int)

    if row:
        sched = json.loads(row["schedule_json"])
        sess_dict = {s["id"]: s for s in sessions}
        for s_entry in sched.get("sessions", []):
            sid = s_entry["session_id"]
            s = sess_dict.get(sid, {})
            dur = s.get("duration", 1)
            rid = s_entry["room_id"]
            d = s_entry["day"]
            sp = s_entry["start_period"]
            fid = s.get("faculty_id")

            room_hours[rid] += dur
            if fid:
                faculty_hours[fid] += dur
            for g in s.get("groups", []):
                group_hours[g] += dur
            day_distribution[d] += dur
            for p in range(sp, sp + dur):
                period_distribution[p] += 1

    # Total teaching periods per week = 5 days * 9 teaching periods = 45 periods
    TOTAL_SLOTS = 45
    room_utilization = []
    for rid, r in rooms.items():
        used_h = room_hours[rid]
        util_pct = round((used_h / TOTAL_SLOTS) * 100, 1)
        room_utilization.append({
            "room_id": rid,
            "name": r["name"],
            "type": r["type"],
            "capacity": r["capacity"],
            "occupied_hours": used_h,
            "utilization_percent": util_pct
        })
    room_utilization.sort(key=lambda x: x["occupied_hours"], reverse=True)

    # Faculty load breakdown by department
    dept_faculty_hours = defaultdict(int)
    dept_faculty_counts = defaultdict(int)
    for fid, f in faculty.items():
        dept = f.get("department", "CSE")
        dept_faculty_hours[dept] += faculty_hours[fid]
        dept_faculty_counts[dept] += 1

    dept_workload = []
    for dept, total_h in dept_faculty_hours.items():
        cnt = dept_faculty_counts[dept]
        dept_workload.append({
            "department": dept,
            "total_teaching_hours": total_h,
            "faculty_count": cnt,
            "avg_hours_per_faculty": round(total_h / cnt, 1) if cnt > 0 else 0
        })
    dept_workload.sort(key=lambda x: x["total_teaching_hours"], reverse=True)

    # Student Group loads
    cohort_workload = []
    for gid, g in groups.items():
        cohort_workload.append({
            "group_id": gid,
            "year": g.get("year", 1),
            "size": g.get("size", 60),
            "weekly_teaching_hours": group_hours[gid]
        })
    cohort_workload.sort(key=lambda x: x["weekly_teaching_hours"], reverse=True)

    # Booking Statistics from DB
    cursor.execute("SELECT status, count(*) FROM bookings GROUP BY status")
    booking_status_counts = dict(cursor.fetchall())
    cursor.execute("SELECT requested_category, count(*) FROM bookings GROUP BY requested_category")
    booking_cat_counts = dict(cursor.fetchall())

    conn.close()

    return {
        "summary": {
            "total_rooms": len(rooms),
            "total_faculty": len(faculty),
            "total_student_groups": len(groups),
            "total_sessions": len(sessions),
            "weekly_teaching_hours": sum(s.get("duration", 1) for s in sessions),
            "hard_violations": row["hard_violations"] if row else 0,
            "soft_penalty": row["soft_penalty"] if row else 0
        },
        "room_utilization": room_utilization,
        "department_workload": dept_workload,
        "cohort_workload": cohort_workload,
        "day_distribution": [{"day": d, "hours": day_distribution.get(d, 0)} for d in ["MON", "TUE", "WED", "THU", "FRI"]],
        "period_distribution": [{"period": f"P{p}", "sessions": period_distribution.get(p, 0)} for p in range(1, 10)],
        "booking_stats": {
            "by_status": booking_status_counts,
            "by_category": booking_cat_counts
        }
    }

