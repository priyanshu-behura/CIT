import pytest
from app.services.nlp_booking_service import nlp_booking_service


def test_parser_a_time_range_hinglish_morning_to_afternoon():
    """Case A: 'somwar subah 10 se 1 baje' must resolve to 10:00-13:00 (P3-P5)."""
    res = nlp_booking_service.parse_booking_prompt("computing lab mein somwar subah 10 se 1 baje for 60 students")
    assert res["day"] == "MON"
    assert res["start_period"] == 3
    assert res["end_period"] == 5
    assert "Time: 10:00 to 13:00" in " ".join(res["extracted_fields"])


def test_parser_b_multiple_days_recurring_series():
    """Case B: 'every Monday and Wednesday' must preserve both days and flag recurrence."""
    res = nlp_booking_service.parse_booking_prompt("Our club meets every Monday and Wednesday 7 to 8 pm, 30 people")
    assert "days" in res
    assert "MON" in res["days"]
    assert "WED" in res["days"]
    assert res["is_recurring"] is True
    assert "recurring_days" in res["needs_input_fields"]
    assert any("recurring" in q.lower() for q in res["follow_up_questions"])


def test_parser_c_unknown_rooms_not_silently_substituted():
    """Case C: 'Hall 999' and 'Room 5000' produce room-not-found message and valid alternatives."""
    res = nlp_booking_service.parse_booking_prompt("Book Hall 999 on Tuesday 2 PM for 50 people")
    assert res["preferred_room_id"] is None
    assert res["unknown_room_requested"] == "HALL 999"
    assert "venue" in res["needs_input_fields"]
    assert any("does not exist" in q for q in res["follow_up_questions"])
    assert any("Seminar Halls" in q or "Classrooms" in q for q in res["follow_up_questions"])


def test_parser_d_invalid_operating_hours():
    """Case D: Requests before 08:00 or after 22:00 must request a valid time window."""
    res = nlp_booking_service.parse_booking_prompt("Reserve room at 3 am to 5 am on Friday for stargazing")
    assert res["start_period"] is None
    assert res["end_period"] is None
    assert "time" in res["needs_input_fields"]
    assert any("outside valid campus operating hours" in q for q in res["follow_up_questions"])


def test_parser_e_relative_dates_asia_kolkata():
    """Case E: aaj, kal, parso use Asia/Kolkata timezone with explicit reference date."""
    # Test with Monday 2026-11-02 as reference date in Asia/Kolkata
    res_aaj = nlp_booking_service.parse_booking_prompt("Need seminar hall aaj 2 pm to 5 pm for 40 students", reference_date="2026-11-02")
    assert res_aaj["day"] == "MON"
    assert res_aaj["is_relative_day"] is True
    assert "day" in res_aaj["needs_input_fields"]

    res_kal = nlp_booking_service.parse_booking_prompt("Need seminar hall kal 2 pm to 5 pm for 40 students", reference_date="2026-11-02")
    assert res_kal["day"] == "TUE"
    assert res_kal["is_relative_day"] is True
    assert "day" in res_kal["needs_input_fields"]

    res_parso = nlp_booking_service.parse_booking_prompt("Need seminar hall parso 2 pm to 5 pm for 40 students", reference_date="2026-11-02")
    assert res_parso["day"] == "WED"
    assert res_parso["is_relative_day"] is True
    assert "day" in res_parso["needs_input_fields"]
