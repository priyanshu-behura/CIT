import json
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, PlainTextResponse
from app.core.config import settings
from app.core.database import get_db_connection

router = APIRouter(prefix="/export", tags=["Reports & Official Exports"])


@router.get("/schedule.json")
def export_baseline_schedule():
    """Download official baseline schedule.json matching the exact validator schema."""
    exports_dir = Path(settings.WORKSPACE_ROOT) / "exports"
    file_path = exports_dir / "schedule.json"

    if not file_path.exists():
        # Check database
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT schedule_json FROM schedules WHERE schedule_type = 'baseline' ORDER BY id DESC LIMIT 1")
        row = cursor.fetchone()
        conn.close()

        if row:
            exports_dir.mkdir(parents=True, exist_ok=True)
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(row["schedule_json"])
        else:
            raise HTTPException(status_code=404, detail="schedule.json has not been generated yet. Please click 'Generate Timetable' first.")

    return FileResponse(path=str(file_path), media_type="application/json", filename="schedule.json")


@router.get("/schedule_after.json")
def export_disrupted_schedule():
    """Download official disrupted schedule_after.json matching the exact validator schema."""
    exports_dir = Path(settings.WORKSPACE_ROOT) / "exports"
    file_path = exports_dir / "schedule_after.json"

    if not file_path.exists():
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT schedule_json FROM schedules WHERE schedule_type = 'disruption' ORDER BY id DESC LIMIT 1")
        row = cursor.fetchone()
        conn.close()

        if row:
            exports_dir.mkdir(parents=True, exist_ok=True)
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(row["schedule_json"])
        else:
            raise HTTPException(status_code=404, detail="schedule_after.json has not been approved yet. Run disruption simulation and click 'Approve & Commit' first.")

    return FileResponse(path=str(file_path), media_type="application/json", filename="schedule_after.json")


@router.get("/timetable.csv")
def export_timetable_csv():
    """Export timetable as CSV format for spreadsheet analysis."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT schedule_json FROM schedules WHERE schedule_type = 'baseline' AND status IN ('optimal', 'feasible') ORDER BY id DESC LIMIT 1")
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="No active schedule available to export.")

    sched = json.loads(row["schedule_json"])
    lines = ["Session ID,Day,Start Period,Room ID"]
    for s in sched.get("sessions", []):
        lines.append(f"{s['session_id']},{s['day']},{s['start_period']},{s['room_id']}")

    csv_content = "\n".join(lines)
    return PlainTextResponse(content=csv_content, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=cit_timetable.csv"})

