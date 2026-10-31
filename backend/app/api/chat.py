from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from app.services.ai_chat_service import ai_chat_service

router = APIRouter(prefix="/chat", tags=["AI Campus Assistant"])


class ChatQueryRequest(BaseModel):
    query: str = Field(..., min_length=2)
    role: Optional[str] = "guest"
    user_email: Optional[str] = None


@router.post("/query")
def chat_query(req: ChatQueryRequest):
    """Answers user questions grounded in official CIT dataset facts, timetable, and booking policies."""
    return ai_chat_service.answer_query(
        query=req.query,
        user_role=req.role or "guest",
        user_email=req.user_email
    )

