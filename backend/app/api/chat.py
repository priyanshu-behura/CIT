from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from app.services.ai_chat_service import ai_chat_service

router = APIRouter(prefix="/chat", tags=["AI Campus Assistant"])


class ChatMessageHistory(BaseModel):
    role: str = "user"
    text: str = ""


class ChatQueryRequest(BaseModel):
    query: str = Field(..., min_length=1)
    role: Optional[str] = "guest"
    user_email: Optional[str] = None
    history: Optional[List[ChatMessageHistory]] = None


class ChatQueryResponse(BaseModel):
    answer: str
    category: str
    is_booking_intent: bool = False
    draft_booking: Optional[Dict[str, Any]] = None
    follow_up_questions: List[str] = []
    needs_input: bool = False
    needs_input_fields: List[str] = []
    is_ai_powered: bool = False
    model: Optional[str] = None
    fallback_reason: Optional[str] = None


@router.post("/query", response_model=ChatQueryResponse)
def chat_query(req: ChatQueryRequest):
    """
    Answers user questions grounded in official CIT dataset facts, timetable, and booking policies.
    Integrates Google Gemini with strict institutional governance and resilient deterministic fallback.
    """
    history_dicts = None
    if req.history:
        history_dicts = [{"role": h.role, "text": h.text} for h in req.history]

    return ai_chat_service.answer_query(
        query=req.query,
        user_role=req.role or "guest",
        user_email=req.user_email,
        history=history_dicts
    )
