from fastapi import APIRouter
from typing import Optional, Dict, Any, List
from app.core.database import get_db_connection

router = APIRouter(prefix="/notifications", tags=["Notifications & System Alerts"])


@router.get("")
def get_notifications(role: Optional[str] = None):
    """Retrieve system alerts and activity notifications."""
    conn = get_db_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM notifications WHERE target_role IN (?, 'all') ORDER BY created_at DESC LIMIT 30"
    cursor.execute(query, (role or "admin",))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


@router.post("/{notification_id}/read")
def mark_read(notification_id: int):
    """Mark a notification as read."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE notifications SET is_read = 1 WHERE id = ?", (notification_id,))
    conn.commit()
    conn.close()
    return {"status": "ok", "id": notification_id}

