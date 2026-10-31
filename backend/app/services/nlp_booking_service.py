import re
from typing import Dict, Any, List, Optional
from datetime import datetime

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

ROOM_TYPE_KEYWORDS = {
    "auditorium": ("auditorium", "AUD"),
    "audi": ("auditorium", "AUD"),
    "seminar": ("seminar_hall", "SH-1"),
    "seminar hall": ("seminar_hall", "SH-1"),
    "lecture hall": ("lecture_hall", "LH-1"),
    "lh": ("lecture_hall", "LH-1"),
    "classroom": ("classroom", "CR-101"),
    "class": ("classroom", "CR-101"),
    "cr": ("classroom", "CR-101"),
    "computing lab": ("lab_cs", "CS-LAB-1"),
    "cs lab": ("lab_cs", "CS-LAB-1"),
    "computer lab": ("lab_cs", "CS-LAB-1"),
    "electronics lab": ("lab_elec", "ELEC-LAB-1"),
    "workshop": ("workshop", "MECH-WS"),
    "open air theatre": ("outdoor", "OAT"),
    "oat": ("outdoor", "OAT")
}

CATEGORY_KEYWORDS = {
    "robotics": ("club_event", "Robotics Workshop"),
    "cultural": ("club_event", "Cultural Fest / Event"),
    "hackathon": ("club_event", "Tech Hackathon"),
    "guest lecture": ("guest_lecture", "Distinguished Guest Lecture"),
    "symposium": ("department_event", "Department Academic Symposium"),
    "meeting": ("department_event", "Faculty & Staff Meeting"),
    "convocation": ("institute_event", "Annual Institute Convocation"),
    "orientation": ("institute_event", "Student Orientation Program"),
    "quiz": ("club_event", "Inter-College Quiz Competition"),
    "workshop": ("club_event", "Hands-on Technical Workshop"),
    "bootcamp": ("club_event", "Student Coding Bootcamp")
}


class NLPBookingService:
    def parse_booking_prompt(self, text: str) -> Dict[str, Any]:
        """
        Parses English or Hinglish natural language booking prompts.
        Extracts structured parameters honestly:
        - When essential fields (date, time, attendance, venue) are missing or vague,
          flags them as 'needs input' and lists actionable follow-up questions.
        - Fixes room code number parsing (e.g. CR-101, SH-1, LH-2 are never parsed as attendance).
        - User reviews and edits the resulting draft before submission; nothing is saved before submit.
        """
        text_lower = text.lower()
        extracted_field_keys = set()
        missing_fields = []
        needs_input_fields = []
        follow_up_questions = []

        extracted = {
            "title": "Campus Event",
            "category": "club_event",
            "day": "MON",
            "start_period": 6,
            "end_period": 8,
            "attendance": 60,
            "room_types": ["classroom"],
            "preferred_room_id": "CR-101",
            "needs": ["projector", "ac"],
            "needs_accessible": False,
            "confidence": 0.85,
            "extracted_fields": [],
            "missing_fields": [],
            "needs_input": False,
            "needs_input_fields": [],
            "follow_up_questions": []
        }

        # -------------------------------------------------------------
        # 1. Day / Date Extraction (English & Hinglish)
        # -------------------------------------------------------------
        day_found = False
        for keyword, day_code in DAYS_ENGLISH_HINGLISH.items():
            if re.search(rf"\b{keyword}\b", text_lower):
                extracted["day"] = day_code
                extracted["extracted_fields"].append(f"Day: {day_code}")
                extracted_field_keys.add("day")
                day_found = True
                break

        if not day_found:
            if "tomorrow" in text_lower or "kal" in text_lower:
                extracted["day"] = "TUE"  # Next teaching day default
                extracted["extracted_fields"].append("Day: TUE (from tomorrow/kal)")
                extracted_field_keys.add("day")
                day_found = True
            elif "agle hafte" in text_lower or "next week" in text_lower:
                extracted["day"] = "MON"
                extracted["extracted_fields"].append("Day: MON (vague: next week / agle hafte)")
                needs_input_fields.append("day")
                follow_up_questions.append("You requested 'agle hafte' / next week; please confirm the exact day (Monday-Saturday / Somwar-Shaniwar).")
                day_found = True

        if not day_found:
            missing_fields.append("day")
            needs_input_fields.append("day")
            follow_up_questions.append("Which day would you like to schedule this event? (e.g. Monday-Saturday / Somwar-Shaniwar)")

        # -------------------------------------------------------------
        # 2. Time / Periods Extraction (English & Hinglish)
        # -------------------------------------------------------------
        time_found = False
        # Patterns like: "2 pm to 5 pm", "14:00 to 17:00", "10 am to 1 pm"
        time_match = re.search(r"(\d{1,2})\s*(am|pm)?\s*(?:to|-|se|till)\s*(\d{1,2})\s*(am|pm)", text_lower)
        if time_match:
            start_hr = int(time_match.group(1))
            start_mer = time_match.group(2)
            end_hr = int(time_match.group(3))
            end_mer = time_match.group(4)

            # Convert 12h to 24h
            if start_mer == "pm" and start_hr < 12:
                start_hr += 12
            elif start_mer == "am" and start_hr == 12:
                start_hr = 0
            if end_mer == "pm" and end_hr < 12:
                end_hr += 12
            elif end_mer == "am" and end_hr == 12:
                end_hr = 0

            sp = PERIOD_MAP.get(start_hr, 6)
            ep = PERIOD_MAP.get(end_hr - 1, sp + 2)
            extracted["start_period"] = sp
            extracted["end_period"] = max(sp, ep)
            extracted["extracted_fields"].append(f"Time: {start_hr}:00 to {end_hr}:00 (P{sp}-P{ep})")
            extracted_field_keys.add("time")
            time_found = True
        else:
            # Hinglish: "6 baje, 2 ghante" or "6 baje se 8 baje"
            baje_match = re.search(r"(\d{1,2})\s*baje", text_lower)
            ghante_match = re.search(r"(\d{1,2})\s*ghante", text_lower)
            if baje_match:
                start_hr = int(baje_match.group(1))
                if ("shaam" in text_lower or "raat" in text_lower) and start_hr < 12:
                    start_hr += 12
                dur = int(ghante_match.group(1)) if ghante_match else 2
                sp = PERIOD_MAP.get(start_hr, 10 if start_hr >= 18 else 6)
                ep = min(13, sp + dur - 1)
                extracted["start_period"] = sp
                extracted["end_period"] = max(sp, ep)
                extracted["extracted_fields"].append(f"Time: {start_hr}:00 ({dur}h, P{sp}-P{ep})")
                extracted_field_keys.add("time")
                time_found = True
            elif "morning" in text_lower or "subah" in text_lower:
                extracted["start_period"] = 2
                extracted["end_period"] = 4
                extracted["extracted_fields"].append("Time: Morning (P2-P4)")
                extracted_field_keys.add("time")
                time_found = True
            elif "after lunch" in text_lower or "dopehar" in text_lower:
                extracted["start_period"] = 6
                extracted["end_period"] = 8
                extracted["extracted_fields"].append("Time: Afternoon after lunch (P6-P8)")
                extracted_field_keys.add("time")
                time_found = True
            elif "evening" in text_lower or "shaam" in text_lower or "night" in text_lower or "raat" in text_lower:
                extracted["start_period"] = 10
                extracted["end_period"] = 12
                extracted["extracted_fields"].append("Time: Evening (P10-P12)")
                extracted_field_keys.add("time")
                time_found = True

        if not time_found:
            missing_fields.append("time")
            needs_input_fields.append("time")
            follow_up_questions.append("What time or periods do you need? (e.g. 2 PM to 5 PM, Morning P2-P4, Evening P10-P12)")

        # -------------------------------------------------------------
        # 3. Attendance Extraction (Cleaned of Room Codes like CR-101, SH-1)
        # -------------------------------------------------------------
        # Strip room codes and course codes before checking attendance numbers
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
            missing_fields.append("attendance")
            needs_input_fields.append("attendance")
            follow_up_questions.append("Approximately how many attendees or students will attend?")

        # -------------------------------------------------------------
        # 4. Room Type & Preferred Room
        # -------------------------------------------------------------
        venue_found = False
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
                break

        # Custom title from text if "for <event>" or "<event> ke liye"
        for_match = re.search(r"(?:for|liye)\s+([a-zA-Z\s]{4,30})(?:on|from|in|with|$)", text_lower)
        if for_match:
            candidate = for_match.group(1).strip().title()
            if candidate and len(candidate) > 4:
                extracted["title"] = candidate
                extracted["extracted_fields"].append(f"Title: {candidate}")

        # -------------------------------------------------------------
        # 6. Needs / Features
        # -------------------------------------------------------------
        needs = []
        if any(w in text_lower for w in ["projector", "screen"]):
            needs.append("projector")
        if any(w in text_lower for w in ["ac", "air condition", "cool"]):
            needs.append("ac")
        if any(w in text_lower for w in ["mic", "pa", "sound", "speaker"]):
            needs.append("pa_system")
        if any(w in text_lower for w in ["computer", "pc", "system", "lab with computers"]):
            needs.append("computers")
        if any(w in text_lower for w in ["wheelchair", "accessible", "ramps"]):
            extracted["needs_accessible"] = True
            extracted["extracted_fields"].append("Accessible: True")

        if needs:
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
