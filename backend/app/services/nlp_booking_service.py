import re
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

# Valid campus venues in CIT
VALID_CAMPUS_ROOMS = {
    "CR-101", "CR-102", "CR-103", "CR-104",
    "CR-201", "CR-202", "CR-203", "CR-204",
    "LH-1", "LH-2", "LH-3",
    "SH-1", "SH-2",
    "CS-LAB-1", "CS-LAB-2",
    "ELEC-LAB-1", "ELEC-LAB-2",
    "MECH-WS", "CIVIL-LAB",
    "AUD", "OAT"
}

# Map common periods to times and vice-versa
# Teaching: P1=08:00, P2=09:00, P3=10:00, P4=11:00, P5=12:00, P6=14:00, P7=15:00, P8=16:00, P9=17:00
# Evening event: P10=18:00, P11=19:00, P12=20:00, P13=21:00
PERIOD_MAP = {
    8: 1, 9: 2, 10: 3, 11: 4, 12: 5,
    14: 6, 15: 7, 16: 8, 17: 9,
    18: 10, 19: 11, 20: 12, 21: 13
}

DAYS_ENGLISH_HINGLISH = {
    "monday": "MON", "somwar": "MON", "mon": "MON",
    "tuesday": "TUE", "mangalwar": "TUE", "tue": "TUE",
    "wednesday": "WED", "budhwar": "WED", "wed": "WED",
    "thursday": "THU", "guruwar": "THU", "thu": "THU",
    "friday": "FRI", "shukrawar": "FRI", "fri": "FRI",
    "saturday": "SAT", "shaniwar": "SAT", "sat": "SAT"
}

# Sorted by key length descending so longer, more specific room phrases match first
ROOM_TYPE_KEYWORDS = {
    "computing lab 1": ("lab_cs", "CS-LAB-1"),
    "computing lab 2": ("lab_cs", "CS-LAB-2"),
    "computing lab": ("lab_cs", "CS-LAB-1"),
    "lab with computers": ("lab_cs", "CS-LAB-1"),
    "cs lab 1": ("lab_cs", "CS-LAB-1"),
    "cs lab 2": ("lab_cs", "CS-LAB-2"),
    "cs lab": ("lab_cs", "CS-LAB-1"),
    "computer lab": ("lab_cs", "CS-LAB-1"),
    "seminar hall 1": ("seminar_hall", "SH-1"),
    "seminar hall 2": ("seminar_hall", "SH-2"),
    "seminar hall": ("seminar_hall", "SH-1"),
    "seminar": ("seminar_hall", "SH-1"),
    "lecture hall 1": ("lecture_hall", "LH-1"),
    "lecture hall 2": ("lecture_hall", "LH-2"),
    "lecture hall 3": ("lecture_hall", "LH-3"),
    "lecture hall": ("lecture_hall", "LH-1"),
    "lh-1": ("lecture_hall", "LH-1"),
    "lh-2": ("lecture_hall", "LH-2"),
    "lh-3": ("lecture_hall", "LH-3"),
    "lh": ("lecture_hall", "LH-1"),
    "auditorium": ("auditorium", "AUD"),
    "audi": ("auditorium", "AUD"),
    "open air theatre": ("outdoor", "OAT"),
    "oat": ("outdoor", "OAT"),
    "electronics lab": ("lab_elec", "ELEC-LAB-1"),
    "classroom": ("classroom", "CR-101"),
    "class": ("classroom", "CR-101"),
    "cr": ("classroom", "CR-101"),
    "workshop": ("workshop", "MECH-WS"),
    "lab": ("lab_cs", "CS-LAB-1")
}

# Sorted by specificity
CATEGORY_KEYWORDS = {
    "python bootcamp": ("club_event", "Python Bootcamp"),
    "robotics workshop": ("club_event", "Robotics Workshop"),
    "robotics": ("club_event", "Robotics Workshop"),
    "cultural event": ("club_event", "Cultural Event"),
    "cultural fest": ("club_event", "Cultural Fest"),
    "cultural": ("club_event", "Cultural Event"),
    "guest lecture": ("guest_lecture", "Distinguished Guest Lecture"),
    "hackathon": ("club_event", "Tech Hackathon"),
    "symposium": ("department_event", "Department Academic Symposium"),
    "meeting": ("department_event", "Faculty & Staff Meeting"),
    "convocation": ("institute_event", "Annual Institute Convocation"),
    "orientation": ("institute_event", "Student Orientation Program"),
    "quiz": ("club_event", "Inter-College Quiz Competition"),
    "bootcamp": ("club_event", "Student Coding Bootcamp"),
    "workshop": ("club_event", "Hands-on Technical Workshop")
}


class NLPBookingService:
    def parse_booking_prompt(self, text: str, reference_date: Optional[str] = None) -> Dict[str, Any]:
        """
        Parses English or Hinglish natural language booking prompts honestly:
        - When essential fields (date, time, attendance, venue) are missing or vague,
          flags them as 'needs input' and lists actionable follow-up questions.
        - Relative day terms ('kal', 'aaj', 'parso', 'agle hafte') are evaluated using
          Asia/Kolkata timezone with zoneinfo against an explicit reference date, marked 'needs input'.
        - Multi-day series ('every Monday and Wednesday') preserves both days and queries recurrence.
        - Unknown rooms ('Hall 999', 'Room 5000') trigger clear room-not-found messages with valid alternatives.
        - Invalid times (< 08:00 or > 22:00) request a valid window and never silently default.
        - Room codes (CR-101, SH-1, LH-2) are never parsed as attendance.
        - Attendance is NEVER silently defaulted to 60 or 150; if missing, returns None with needs_input=True.
        - User reviews and confirms the resulting draft in the UI before submission.
        """
        text_lower = text.lower()
        extracted_field_keys = set()
        missing_fields = []
        needs_input_fields = []
        follow_up_questions = []

        try:
            kolkata_tz = ZoneInfo("Asia/Kolkata")
            now_kolkata = datetime.now(kolkata_tz)
        except Exception:
            now_kolkata = datetime.now()

        if not reference_date:
            reference_date = now_kolkata.strftime("%Y-%m-%d")

        try:
            ref_dt = datetime.strptime(reference_date, "%Y-%m-%d")
        except Exception:
            reference_date = now_kolkata.strftime("%Y-%m-%d")
            ref_dt = datetime.strptime(reference_date, "%Y-%m-%d")

        DAY_MAP_INDEX = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]

        extracted: Dict[str, Any] = {
            "title": "Campus Event",
            "category": "club_event",
            "day": None,
            "start_period": None,
            "end_period": None,
            "attendance": None,
            "room_types": [],
            "preferred_room_id": None,
            "needs": ["projector", "ac"],
            "needs_accessible": False,
            "confidence": 0.85,
            "reference_date": reference_date,
            "is_relative_day": False,
            "extracted_fields": [],
            "missing_fields": [],
            "needs_input": False,
            "needs_input_fields": [],
            "follow_up_questions": []
        }

        # -------------------------------------------------------------
        # 1. Day / Date Extraction (English, Hinglish, Multi-day, Relative)
        # -------------------------------------------------------------
        day_found = False
        requested_days = []
        for keyword, day_code in DAYS_ENGLISH_HINGLISH.items():
            if re.search(rf"\b{keyword}\b", text_lower):
                if day_code not in requested_days:
                    requested_days.append(day_code)

        if len(requested_days) > 1:
            extracted["days"] = requested_days
            extracted["day"] = requested_days[0]
            extracted["is_recurring"] = True
            extracted["extracted_fields"].append(f"Days: {', '.join(requested_days)} (Multi-day series)")
            needs_input_fields.append("recurring_days")
            extracted["needs_input"] = True
            follow_up_questions.append(
                f"You requested multiple days ({', '.join(requested_days)}). Please confirm whether this should be created as a recurring booking series across all requested days or scheduled individually."
            )
            extracted_field_keys.add("day")
            day_found = True
        elif len(requested_days) == 1:
            extracted["day"] = requested_days[0]
            extracted["extracted_fields"].append(f"Day: {requested_days[0]}")
            extracted_field_keys.add("day")
            day_found = True

        if not day_found:
            # Check for relative day terms: aaj, kal, parso, agle hafte (Asia/Kolkata reference date)
            if "aaj" in text_lower or re.search(r"\btoday\b", text_lower):
                target_code = DAY_MAP_INDEX[ref_dt.weekday()]
                if target_code == "SUN":
                    target_code = "MON"
                extracted["day"] = target_code
                extracted["is_relative_day"] = True
                extracted["extracted_fields"].append(f"Day: {target_code} (from today/aaj, ref: {reference_date} IST)")
                needs_input_fields.append("day")
                follow_up_questions.append(
                    f"Prompt mentioned 'aaj' (today). Based on reference date {reference_date} ({ref_dt.strftime('%A')}), this maps to {target_code}. Please confirm the academic day."
                )
                extracted_field_keys.add("day")
                day_found = True

            elif "kal" in text_lower or re.search(r"\btomorrow\b", text_lower):
                target_dt = ref_dt + timedelta(days=1)
                target_code = DAY_MAP_INDEX[target_dt.weekday()]
                if target_code == "SUN":
                    target_code = "MON"
                extracted["day"] = target_code
                extracted["is_relative_day"] = True
                extracted["extracted_fields"].append(f"Day: {target_code} (from tomorrow/kal, ref: {reference_date} IST)")
                needs_input_fields.append("day")
                follow_up_questions.append(
                    f"Prompt mentioned 'kal' (tomorrow). Based on reference date {reference_date} ({ref_dt.strftime('%A')}), this maps to {target_code}. Please confirm this weekday in the form below."
                )
                extracted_field_keys.add("day")
                day_found = True

            elif "parso" in text_lower or re.search(r"\bday after tomorrow\b", text_lower):
                target_dt = ref_dt + timedelta(days=2)
                target_code = DAY_MAP_INDEX[target_dt.weekday()]
                if target_code == "SUN":
                    target_code = "MON"
                extracted["day"] = target_code
                extracted["is_relative_day"] = True
                extracted["extracted_fields"].append(f"Day: {target_code} (from parso/day after tomorrow, ref: {reference_date} IST)")
                needs_input_fields.append("day")
                follow_up_questions.append(
                    f"Prompt mentioned 'parso' (day after tomorrow). Based on reference date {reference_date} ({ref_dt.strftime('%A')}), this maps to {target_code}. Please confirm this weekday in the form below."
                )
                extracted_field_keys.add("day")
                day_found = True

            elif "agle hafte" in text_lower or "next week" in text_lower:
                extracted["day"] = "MON"
                extracted["is_relative_day"] = True
                extracted["extracted_fields"].append("Day: MON (vague: next week / agle hafte)")
                needs_input_fields.append("day")
                follow_up_questions.append("Prompt mentioned 'agle hafte' / next week without a specific day. Please select the required weekday (MON-SAT).")
                extracted_field_keys.add("day")
                day_found = True

        if not day_found:
            extracted["day"] = None
            missing_fields.append("day")
            needs_input_fields.append("day")
            follow_up_questions.append("Which day would you like to schedule this event? (e.g. Monday-Saturday / Somwar-Shaniwar)")

        # -------------------------------------------------------------
        # 2. Time / Periods Extraction (English & Hinglish, Time Range, Operating Hours)
        # -------------------------------------------------------------
        time_found = False
        has_subah = "subah" in text_lower or "morning" in text_lower
        has_dopehar = "dopehar" in text_lower or "afternoon" in text_lower or "after lunch" in text_lower
        has_shaam = "shaam" in text_lower or "evening" in text_lower or "raat" in text_lower or "night" in text_lower

        # Pattern 1: Range like "10 se 1 baje", "10 am to 1 pm", "2 pm to 5 pm", "6 to 8 pm", "2 se 4 baje"
        range_match = re.search(
            r"(\d{1,2})\s*(am|pm|baje)?\s*(?:to|-|se|till)\s*(\d{1,2})\s*(am|pm|baje)?",
            text_lower
        )
        if range_match:
            start_hr = int(range_match.group(1))
            start_mer = range_match.group(2)
            end_hr = int(range_match.group(3))
            end_mer = range_match.group(4)

            # Apply morning / afternoon / evening hints
            if has_subah:
                if start_hr <= 12 and not start_mer:
                    start_mer = "am"
                if end_hr < start_hr:
                    end_hr += 12  # e.g. 10 se 1 baje -> 10:00 to 13:00 (P3 to P5)
                elif end_hr <= 12 and not end_mer:
                    end_mer = "am"
            elif has_dopehar:
                if start_hr < 12:
                    start_hr += 12
                if end_hr <= 12:
                    end_hr += 12
            elif has_shaam:
                if start_hr < 12:
                    start_hr += 12
                if end_hr <= 12:
                    end_hr += 12
            else:
                if not start_mer and end_mer == "pm" and start_hr < end_hr:
                    start_mer = "pm"
                elif not start_mer and end_mer == "am":
                    start_mer = "am"

                # Check if e.g. 10 to 1 means 10 AM to 1 PM
                if start_hr >= 8 and start_hr <= 11 and end_hr >= 1 and end_hr <= 5:
                    if not start_mer:
                        start_mer = "am"
                    if not end_mer:
                        end_mer = "pm"

                if start_mer == "pm" and start_hr < 12:
                    start_hr += 12
                elif start_mer == "am" and start_hr == 12:
                    start_hr = 0

                if end_mer == "pm" and end_hr < 12:
                    end_hr += 12
                elif end_mer == "am" and end_hr == 12:
                    end_hr = 0

            # Check operating hours (08:00 to 22:00)
            if start_hr < 8 or end_hr > 22 or (start_hr == end_hr):
                extracted["start_period"] = None
                extracted["end_period"] = None
                extracted["invalid_time_requested"] = f"{start_hr}:00 to {end_hr}:00"
                needs_input_fields.append("time")
                extracted["needs_input"] = True
                follow_up_questions.append(
                    f"Requested time ({start_hr:02d}:00 to {end_hr:02d}:00) is outside valid campus operating hours (08:00 to 22:00). Teaching periods run 08:00–18:00 (P1–P9) and evening events run 18:00–22:00 (P10–P13). Please select a valid time window."
                )
                time_found = True
            else:
                sp = PERIOD_MAP.get(start_hr, 3 if start_hr <= 10 else (6 if start_hr <= 14 else 10))
                ep = PERIOD_MAP.get(end_hr - 1, sp + 2)
                extracted["start_period"] = sp
                extracted["end_period"] = max(sp, ep)
                extracted["extracted_fields"].append(f"Time: {start_hr:02d}:00 to {end_hr:02d}:00 (P{sp}-P{ep})")
                extracted_field_keys.add("time")
                time_found = True
        else:
            # Pattern 2: Single time mention, e.g. "at 10 am", "at 3 am", "7 baje"
            single_match = re.search(r"\b(?:at|@)?\s*(\d{1,2})\s*(am|pm|baje)\b", text_lower)
            if single_match:
                start_hr = int(single_match.group(1))
                unit = single_match.group(2)
                if (unit == "pm" or has_shaam) and start_hr < 12:
                    start_hr += 12
                elif unit == "am" and start_hr == 12:
                    start_hr = 0

                # Check operating hours
                if start_hr < 8 or start_hr > 22:
                    extracted["start_period"] = None
                    extracted["end_period"] = None
                    extracted["invalid_time_requested"] = f"{start_hr}:00"
                    needs_input_fields.append("time")
                    extracted["needs_input"] = True
                    follow_up_questions.append(
                        f"Requested time ({start_hr:02d}:00) is outside valid campus operating hours (08:00 to 22:00). Please choose a time between 08:00 and 22:00."
                    )
                    time_found = True
                else:
                    sp = PERIOD_MAP.get(start_hr, 6)
                    extracted["start_period"] = sp
                    extracted["end_period"] = min(13, sp + 1)
                    extracted["extracted_fields"].append(f"Time: {start_hr:02d}:00 (P{sp})")
                    extracted_field_keys.add("time")
                    time_found = True
            else:
                # Descriptive time hints
                if has_subah:
                    extracted["start_period"] = 2
                    extracted["end_period"] = 4
                    extracted["extracted_fields"].append("Time: Morning (P2-P4)")
                    extracted_field_keys.add("time")
                    time_found = True
                elif has_dopehar:
                    extracted["start_period"] = 6
                    extracted["end_period"] = 8
                    extracted["extracted_fields"].append("Time: Afternoon after lunch (P6-P8)")
                    extracted_field_keys.add("time")
                    time_found = True
                elif has_shaam:
                    extracted["start_period"] = 10
                    extracted["end_period"] = 12
                    extracted["extracted_fields"].append("Time: Evening (P10-P12)")
                    extracted_field_keys.add("time")
                    time_found = True

        if not time_found:
            extracted["start_period"] = None
            extracted["end_period"] = None
            missing_fields.append("time")
            needs_input_fields.append("time")
            follow_up_questions.append("What time or periods do you need? (e.g. 2 PM to 5 PM, Morning P2-P4, Evening P10-P12)")

        # -------------------------------------------------------------
        # 3. Attendance Extraction (Cleaned of Room Codes like CR-101, SH-1)
        # -------------------------------------------------------------
        text_without_codes = re.sub(r"\b[A-Za-z]{1,4}-\d{1,4}[a-z]?\b", " ", text_lower)
        text_without_codes = re.sub(r"\bhall\s+\d{1,4}\b", " ", text_without_codes)
        text_without_codes = re.sub(r"\broom\s+\d{1,4}\b", " ", text_without_codes)

        att_found = False
        # Pattern 1: Number explicitly followed by attendee keywords
        att_kw_match = re.search(
            r"(\d{1,4})\s*(?:students|attendees|people|log|logon|seats|participants|candidates|bacho|members)",
            text_without_codes
        )
        if att_kw_match:
            val = int(att_kw_match.group(1))
            if val > 0:
                extracted["attendance"] = val
                extracted["extracted_fields"].append(f"Attendance: {val}")
                extracted_field_keys.add("attendance")
                att_found = True

        if not att_found:
            # Pattern 2: Contextual keywords like "for 45", "around 400", "about 60"
            ctx_att_match = re.search(
                r"(?:for|around|about|approx|capacity|attendance)\s+(\d{2,4})\b",
                text_without_codes
            )
            if ctx_att_match:
                val = int(ctx_att_match.group(1))
                if 10 <= val <= 1000:
                    extracted["attendance"] = val
                    extracted["extracted_fields"].append(f"Attendance: {val}")
                    extracted_field_keys.add("attendance")
                    att_found = True

        if not att_found:
            # Pattern 3: Standalone 2-3 digit number not followed by time units
            std_num_match = re.search(
                r"\b(\d{2,4})\b(?!\s*(?:am|pm|baje|hours?|ghante|period|p\d|min))",
                text_without_codes
            )
            if std_num_match:
                val = int(std_num_match.group(1))
                if 10 <= val <= 1000:
                    extracted["attendance"] = val
                    extracted["extracted_fields"].append(f"Attendance: {val}")
                    extracted_field_keys.add("attendance")
                    att_found = True

        if not att_found:
            extracted["attendance"] = None
            missing_fields.append("attendance")
            needs_input_fields.append("attendance")
            follow_up_questions.append("Approximately how many attendees or students will attend? (Attendance is required)")

        # -------------------------------------------------------------
        # 4. Room Type & Preferred Room (With Unknown Room Detection)
        # -------------------------------------------------------------
        venue_found = False

        # First, detect explicitly requested unknown rooms (e.g. Hall 999, Room 5000, CR-999)
        unknown_match = re.search(r"\b(hall\s+\d+|room\s+\d+|cr-\d{3,4}|lh-\d{2,4}|sh-\d{2,4})\b", text_lower)
        if unknown_match:
            candidate_room = unknown_match.group(1).upper()
            normalized_candidate = candidate_room.replace(" ", "-")
            if candidate_room not in VALID_CAMPUS_ROOMS and normalized_candidate not in VALID_CAMPUS_ROOMS:
                extracted["preferred_room_id"] = None
                extracted["unknown_room_requested"] = candidate_room
                needs_input_fields.append("venue")
                extracted["needs_input"] = True
                follow_up_questions.append(
                    f"Requested venue '{candidate_room.title()}' does not exist on CIT campus. Available venues include: Seminar Halls (SH-1, SH-2), Lecture Halls (LH-1 to LH-3), Classrooms (CR-101 to CR-204), CS Labs (CS-LAB-1, CS-LAB-2). Please select a valid venue."
                )
                venue_found = True

        if not venue_found:
            # Direct room code match (e.g. "SH-2", "CR-101", "AUD", "OAT")
            room_code_match = re.search(r"\b(cr-\d{3}|lh-\d|sh-\d|cs-lab-\d|elec-lab-\d|mech-ws|civil-lab|aud|oat)\b", text_lower)
            if room_code_match:
                code_upper = room_code_match.group(1).upper()
                extracted["preferred_room_id"] = code_upper
                # Map code to room type
                if "CR-" in code_upper:
                    extracted["room_types"] = ["classroom"]
                elif "LH-" in code_upper:
                    extracted["room_types"] = ["lecture_hall"]
                elif "SH-" in code_upper:
                    extracted["room_types"] = ["seminar_hall"]
                elif "CS-LAB" in code_upper:
                    extracted["room_types"] = ["lab_cs"]
                elif "AUD" in code_upper:
                    extracted["room_types"] = ["auditorium"]
                elif "OAT" in code_upper:
                    extracted["room_types"] = ["outdoor"]
                extracted["extracted_fields"].append(f"Room: {code_upper}")
                extracted_field_keys.add("venue")
                venue_found = True

        if not venue_found:
            for kw, (rtype, pref_id) in ROOM_TYPE_KEYWORDS.items():
                if kw in text_lower:
                    extracted["room_types"] = [rtype]
                    extracted["preferred_room_id"] = pref_id
                    extracted["extracted_fields"].append(f"Room: {rtype} ({pref_id})")
                    extracted_field_keys.add("venue")
                    venue_found = True
                    break

        if not venue_found:
            if extracted.get("attendance") and extracted.get("attendance", 0) > 100:
                extracted["room_types"] = ["lecture_hall", "auditorium"]
                extracted["preferred_room_id"] = "LH-1"
                extracted["extracted_fields"].append("Room: Large Venue (LH/AUD based on attendance > 100)")
                extracted_field_keys.add("venue")
                venue_found = True
            else:
                extracted["preferred_room_id"] = None
                extracted["room_types"] = []
                missing_fields.append("venue")
                needs_input_fields.append("venue")
                follow_up_questions.append("What type of venue do you require? (e.g. Auditorium, Seminar Hall, Classroom, CS Lab, Open Air Theatre)")

        # -------------------------------------------------------------
        # 5. Category & Event Title
        # -------------------------------------------------------------
        for kw, (cat, default_title) in CATEGORY_KEYWORDS.items():
            if kw in text_lower:
                extracted["category"] = cat
                extracted["title"] = default_title
                extracted["extracted_fields"].append(f"Category: {cat}")
                extracted["extracted_fields"].append(f"Title: {default_title}")
                break

        # Check for explicitly quoted or titled topics
        title_match = re.search(r"(?:for|title|named|called)\s+[\"']([^\"']+)[\"']", text_lower)
        if title_match:
            extracted["title"] = title_match.group(1).title()
            extracted["extracted_fields"].append(f"Title: {extracted['title']}")
        else:
            # Check for workshop / event names like "for Python bootcamp with 60 students"
            event_match = re.search(r"for\s+([a-zA-Z\s]{3,25})\s+(?:workshop|event|meeting|fest|lecture|bootcamp)", text_lower)
            if event_match:
                candidate = f"{event_match.group(1).strip().title()} {event_match.group(0).split()[-1].title()}"
                extracted["title"] = candidate
                if not any(f.startswith("Title:") for f in extracted["extracted_fields"]):
                    extracted["extracted_fields"].append(f"Title: {candidate}")

        # Fallback Title if still generic
        if extracted["title"] == "Campus Event":
            if "classroom" in text_lower or "cr-" in text_lower:
                extracted["title"] = "Classroom Booking"
            elif "auditorium" in text_lower or "aud" in text_lower:
                extracted["title"] = "Auditorium Event"
            elif "seminar" in text_lower:
                extracted["title"] = "Seminar Hall Session"
            elif "computing lab" in text_lower or "lab" in text_lower:
                extracted["title"] = "Lab Booking"

        # -------------------------------------------------------------
        # 6. Needs / Features
        # -------------------------------------------------------------
        needs = []
        if any(w in text_lower for w in ["projector", "screen"]):
            needs.append("projector")
        if any(w in text_lower for w in ["ac", "air condition", "air conditioned"]):
            needs.append("ac")
        if any(w in text_lower for w in ["mic", "pa", "sound", "speaker", "sound system"]):
            needs.append("pa_system")
        if any(w in text_lower for w in ["computer", "pc", "system", "computing lab", "lab_cs"]):
            needs.append("computers")
        if any(w in text_lower for w in ["wheelchair", "accessible", "ramps"]):
            extracted["needs_accessible"] = True
            extracted["extracted_fields"].append("Accessibility: Wheelchair accessible")

        if not needs:
            # Sensible defaults based on room type
            if "lab_cs" in extracted.get("room_types", []):
                needs = ["computers", "projector"]
            elif "auditorium" in extracted.get("room_types", []):
                needs = ["projector", "ac", "pa_system"]
            else:
                needs = ["projector", "ac"]

        extracted["needs"] = needs
        extracted["extracted_fields"].append(f"Needs: {', '.join(needs)}")

        # Calculate final confidence and honesty flags
        extracted["missing_fields"] = missing_fields
        extracted["needs_input_fields"] = needs_input_fields
        extracted["follow_up_questions"] = follow_up_questions
        extracted["needs_input"] = len(needs_input_fields) > 0

        # Confidence is penalised if essential fields are missing
        extracted["confidence"] = max(0.40, round(1.0 - (0.15 * len(missing_fields)), 2))

        return extracted


nlp_booking_service = NLPBookingService()
