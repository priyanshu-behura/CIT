import pytest
from app.services.nlp_booking_service import nlp_booking_service
from app.services.booking_service import booking_service


def test_missing_essential_fields_flagged_honestly():
    """
    When day, time, or attendance are omitted, the parser must not silently
    pretend it extracted them. It must mark needs_input=True, list the missing fields,
    and generate actionable follow-up questions.
    """
    res = nlp_booking_service.parse_booking_prompt("Book seminar hall for robotics workshop")
    assert res["needs_input"] is True
    assert "day" in res["needs_input_fields"]
    assert "time" in res["needs_input_fields"]
    assert "attendance" in res["needs_input_fields"]
    assert len(res["follow_up_questions"]) >= 3
    # Check that follow up questions explicitly mention the missing elements
    questions_str = " ".join(res["follow_up_questions"]).lower()
    assert "day" in questions_str
    assert "time" in questions_str or "period" in questions_str
    assert "attend" in questions_str or "many" in questions_str


def test_room_codes_not_parsed_as_attendance():
    """
    Room codes such as CR-101, SH-1, LH-2 must NOT be captured as attendance numbers.
    """
    res = nlp_booking_service.parse_booking_prompt("Reserve CR-101 tomorrow morning")
    assert res["preferred_room_id"] == "CR-101"
    assert "classroom" in res["room_types"]
    # 101 must NOT be assigned as attendance
    assert res["attendance"] != 101
    assert "attendance" in res["needs_input_fields"]

    res2 = nlp_booking_service.parse_booking_prompt("Need SH-2 on Friday from 2 pm to 5 pm for 45 students")
    assert res2["preferred_room_id"] == "SH-2"
    assert res2["attendance"] == 45
    assert "attendance" not in res2["needs_input_fields"]


def test_hinglish_vague_times_and_dates():
    """
    Test Hinglish time expressions:
    - 'kal shaam ko': day=TUE (next day), time=evening P10-P12
    - 'agle hafte': day marked as needs_input with confirmation question
    """
    # 1. 'kal shaam ko'
    res_kal = nlp_booking_service.parse_booking_prompt("Humein kal shaam ko auditorium chahiye for annual play")
    assert res_kal["day"] == "TUE"
    assert res_kal["start_period"] == 10
    assert res_kal["end_period"] == 12
    assert "time" not in res_kal["needs_input_fields"]
    assert res_kal["preferred_room_id"] == "AUD"

    # 2. 'agle hafte'
    res_agle = nlp_booking_service.parse_booking_prompt("Seminar hall chahiye agle hafte for 60 students")
    assert "day" in res_agle["needs_input_fields"]
    assert any("agle hafte" in q for q in res_agle["follow_up_questions"])
    assert res_agle["attendance"] == 60


def test_parser_draft_is_pure_in_memory_no_unwanted_writes():
    """
    Parsing an NLP prompt is purely in-memory. It returns a draft and does NOT
    create a booking record in the database.
    """
    initial_count = len(booking_service.get_all_bookings())
    _ = nlp_booking_service.parse_booking_prompt("Book auditorium on Wednesday 2 pm to 5 pm for 200 students")
    after_count = len(booking_service.get_all_bookings())
    assert after_count == initial_count
