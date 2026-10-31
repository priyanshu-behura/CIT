import json
import logging
from pathlib import Path
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, Depends, Request

from app.services.disruption_service import disruption_service
from app.api.auth import get_current_user
from app.core.config import settings

router = APIRouter(prefix="/disruptions", tags=["Disruption Management & Rescheduling"])
logger = logging.getLogger(__name__)


def validate_disruption_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Strict server-side validation of disruption payload against authoritative dataset.
    Enforces structure, valid types, and resolves session, room, and faculty IDs against database/dataset.
    Ignores and strips any untrusted client-supplied user, role, approval, or timestamp fields.
    """
    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="Invalid disruption payload: must be a JSON object.")

    disruption_id = payload.get("id")
    if not disruption_id or not isinstance(disruption_id, str) or len(disruption_id.strip()) < 3:
        raise HTTPException(status_code=400, detail="Invalid disruption id: must be a non-empty string of at least 3 characters.")

    changes = payload.get("changes")
    if changes is None or not isinstance(changes, list):
        raise HTTPException(status_code=400, detail="Missing or invalid 'changes' key: must be a non-empty list of change operations.")
    if len(changes) == 0:
        raise HTTPException(status_code=400, detail="Disruption 'changes' list cannot be empty.")

    # Load authoritative dataset to validate IDs
    dataset_file = Path(settings.DATASET_PATH)
    with open(dataset_file, "r", encoding="utf-8") as f:
        dataset_data = json.load(f)

    valid_room_ids = {r["id"] for r in dataset_data.get("rooms", [])}
    valid_faculty_ids = {f["id"] for f in dataset_data.get("faculty", [])}
    valid_session_ids = {s["id"] for s in dataset_data.get("sessions", [])}
    valid_days = set(dataset_data.get("calendar", {}).get("teaching_days", ["MON", "TUE", "WED", "THU", "FRI"]))

    sanitized_changes = []
    for idx, ch in enumerate(changes):
        if not isinstance(ch, dict):
            raise HTTPException(status_code=400, detail=f"Change at index {idx} must be a JSON object.")

        ch_type = ch.get("type")
        if not ch_type or not isinstance(ch_type, str):
            raise HTTPException(status_code=400, detail=f"Change at index {idx} missing 'type' string.")

        if ch_type == "faculty_unavailable":
            fac_id = ch.get("faculty_id")
            if not fac_id or not isinstance(fac_id, str):
                raise HTTPException(status_code=400, detail=f"Change {idx} ({ch_type}) requires 'faculty_id'.")
            if fac_id not in valid_faculty_ids:
                raise HTTPException(status_code=400, detail=f"Unknown faculty ID '{fac_id}' in change {idx}.")

            days = ch.get("days")
            if not isinstance(days, list) or not all(d in valid_days for d in days):
                raise HTTPException(status_code=400, detail=f"Invalid or missing 'days' in change {idx}.")

            periods = ch.get("periods")
            if not isinstance(periods, list) or not all(isinstance(p, int) and 1 <= p <= 9 for p in periods):
                raise HTTPException(status_code=400, detail=f"Invalid or missing 'periods' in change {idx}: must be integer teaching periods 1-9.")

            sanitized_changes.append({
                "type": ch_type,
                "faculty_id": fac_id,
                "days": days,
                "periods": periods,
                "reason": str(ch.get("reason", ""))
            })

        elif ch_type == "room_unavailable":
            room_id = ch.get("room_id")
            if not room_id or not isinstance(room_id, str):
                raise HTTPException(status_code=400, detail=f"Change {idx} ({ch_type}) requires 'room_id'.")
            if room_id not in valid_room_ids:
                raise HTTPException(status_code=400, detail=f"Unknown room ID '{room_id}' in change {idx}.")

            days = ch.get("days")
            if not isinstance(days, list) or not all(d in valid_days for d in days):
                raise HTTPException(status_code=400, detail=f"Invalid or missing 'days' in change {idx}.")

            periods = ch.get("periods")
            if not isinstance(periods, list) or not all(isinstance(p, int) and 1 <= p <= 9 for p in periods):
                raise HTTPException(status_code=400, detail=f"Invalid or missing 'periods' in change {idx}: must be integer teaching periods 1-9.")

            sanitized_changes.append({
                "type": ch_type,
                "room_id": room_id,
                "days": days,
                "periods": periods,
                "reason": str(ch.get("reason", ""))
            })

        elif ch_type == "add_session":
            sess = ch.get("session")
            if not isinstance(sess, dict):
                raise HTTPException(status_code=400, detail=f"Change {idx} ({ch_type}) requires a 'session' dictionary.")

            sess_id = sess.get("id")
            if not sess_id or not isinstance(sess_id, str):
                raise HTTPException(status_code=400, detail=f"Change {idx} ({ch_type}) requires valid session 'id'.")

            fac_id = sess.get("faculty_id")
            if fac_id and fac_id not in valid_faculty_ids:
                raise HTTPException(status_code=400, detail=f"Unknown faculty ID '{fac_id}' in added session '{sess_id}'.")

            # Validate room types
            req_room_types = sess.get("room_types", [])
            if not isinstance(req_room_types, list) or not req_room_types:
                raise HTTPException(status_code=400, detail=f"Added session '{sess_id}' must specify at least one valid room_type.")

            sanitized_changes.append({
                "type": ch_type,
                "session": sess
            })

        elif ch_type == "remove_session":
            sess_id = ch.get("session_id")
            if not sess_id or not isinstance(sess_id, str):
                raise HTTPException(status_code=400, detail=f"Change {idx} ({ch_type}) requires 'session_id'.")
            if sess_id not in valid_session_ids:
                raise HTTPException(status_code=400, detail=f"Unknown session ID '{sess_id}' in change {idx}.")

            sanitized_changes.append({
                "type": ch_type,
                "session_id": sess_id
            })

        elif ch_type == "add_faculty":
            fac = ch.get("faculty")
            if not isinstance(fac, dict) or "id" not in fac or "name" not in fac:
                raise HTTPException(status_code=400, detail=f"Change {idx} ({ch_type}) requires valid faculty dict with 'id' and 'name'.")
            sanitized_changes.append({
                "type": ch_type,
                "faculty": fac
            })

        else:
            raise HTTPException(status_code=400, detail=f"Unsupported change type '{ch_type}' in change {idx}.")

    return {
        "id": disruption_id.strip(),
        "title": str(payload.get("title") or payload.get("description") or f"Disruption Scenario {disruption_id.strip()}"),
        "description": str(payload.get("description", "")),
        "changes": sanitized_changes
    }


@router.get("")
def list_disruptions():
    """Retrieve all logged campus disruptions and their rescheduling proposals."""
    return disruption_service.get_all_disruptions()


@router.post("/upload")
async def upload_disruption_file(
    request: Request,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Upload and validate a disruption scenario file (.json, max 1MB).
    Reads raw body or multipart stream without third-party dependencies.
    Validates structure and IDs against authoritative records.
    Prepares disruption for simulation and administrative approval.
    """
    MAX_BYTES = 1024 * 1024  # 1 MB
    body = await request.body()
    if len(body) > MAX_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"Uploaded file exceeds maximum allowable size of 1 MB ({len(body)} bytes received)."
        )

    if not body:
        raise HTTPException(status_code=400, detail="Empty request body. Please upload a valid JSON disruption file.")

    # Handle raw JSON or multipart boundary extraction
    content_type = request.headers.get("content-type", "")
    if "multipart/form-data" in content_type:
        # Simple standard multipart boundary extraction to avoid python-multipart dependency
        try:
            boundary = content_type.split("boundary=")[1].encode("utf-8")
            parts = body.split(b"--" + boundary)
            file_part = None
            for part in parts:
                if b'filename=' in part:
                    file_part = part
                    break
            if not file_part:
                raise HTTPException(status_code=400, detail="No file found in multipart upload.")
            header_end = file_part.find(b"\r\n\r\n")
            if header_end == -1:
                header_end = file_part.find(b"\n\n")
            if header_end == -1:
                raise HTTPException(status_code=400, detail="Invalid multipart header.")
            raw_bytes = file_part[header_end:].strip(b"\r\n-")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse multipart upload: {str(e)}")
    else:
        raw_bytes = body

    try:
        raw_text = raw_bytes.decode("utf-8")
        payload = json.loads(raw_text)
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="Uploaded file is not valid UTF-8 text.")
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail=f"Malformed JSON: {str(e)}")

    validated = validate_disruption_payload(payload)

    # Register into disruptions database
    record = disruption_service.create_disruption(
        disruption_id=validated["id"],
        title=validated["title"],
        description=validated["description"],
        changes=validated["changes"]
    )

    return {
        "status": "success",
        "message": f"Disruption scenario '{validated['id']}' successfully validated and registered.",
        "disruption": record
    }


@router.post("")
def create_disruption(
    payload: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Log a new disruption scenario with server-side validation."""
    validated = validate_disruption_payload(payload)
    return disruption_service.create_disruption(
        disruption_id=validated["id"],
        title=validated["title"],
        description=validated["description"],
        changes=validated["changes"]
    )


@router.post("/{disruption_id}/simulate")
def simulate_rescheduling(
    disruption_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Simulate minimal-movement rescheduling using Google OR-Tools CP-SAT.
    Calculates exact session movements, time/room diffs, and affected cohorts.
    Does NOT alter the live active schedule until Admin approval.
    """
    try:
        return disruption_service.simulate_rescheduling(disruption_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{disruption_id}/approve")
def approve_and_commit(
    disruption_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Admin-only action to commit a proposed rescheduling into the active timetable.
    Exports to exports/schedule_after.json and broadcasts notifications.
    """
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail="Unauthorized: Only an Administrator can approve and commit a revised schedule."
        )

    try:
        res = disruption_service.approve_and_commit(disruption_id, current_user["email"])
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
