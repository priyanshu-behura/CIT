import json
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, PlainTextResponse, Response
from app.core.config import settings
from app.core.database import get_db_connection

router = APIRouter(prefix="/export", tags=["Reports & Official Exports"])


@router.get("/schedule.json")
def export_baseline_schedule():
    """
    Download current baseline schedule matching the exact validator schema.
    Serves the latest active baseline schedule from the SQLite database dynamically.
    Falls back to exports/schedule.json if database has not recorded a run yet.
    Protects committed submission exports on disk from runtime mutation.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT schedule_json FROM schedules WHERE schedule_type = 'baseline' ORDER BY id DESC LIMIT 1")
    row = cursor.fetchone()
    conn.close()

    if row and row["schedule_json"]:
        return Response(
            content=row["schedule_json"],
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=schedule.json"}
        )

    # Fallback to repository committed export if DB record absent
    exports_dir = Path(settings.WORKSPACE_ROOT) / "exports"
    file_path = exports_dir / "schedule.json"
    if file_path.exists():
        return FileResponse(path=str(file_path), media_type="application/json", filename="schedule.json")

    raise HTTPException(status_code=404, detail="schedule.json has not been generated yet. Please click 'Generate Timetable' first.")


@router.get("/schedule_after.json")
def export_disrupted_schedule():
    """
    Download current disrupted schedule matching the exact validator schema.
    Serves the latest committed disruption schedule from SQLite dynamically.
    Falls back to exports/schedule_after.json if database record absent.
    Protects committed submission exports on disk from runtime mutation.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT schedule_json FROM schedules WHERE schedule_type = 'disruption' ORDER BY id DESC LIMIT 1")
    row = cursor.fetchone()
    conn.close()

    if row and row["schedule_json"]:
        return Response(
            content=row["schedule_json"],
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=schedule_after.json"}
        )

    exports_dir = Path(settings.WORKSPACE_ROOT) / "exports"
    file_path = exports_dir / "schedule_after.json"
    if file_path.exists():
        return FileResponse(path=str(file_path), media_type="application/json", filename="schedule_after.json")

    raise HTTPException(status_code=404, detail="schedule_after.json has not been approved yet. Run disruption simulation and click 'Approve & Commit' first.")



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

