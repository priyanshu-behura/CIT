import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  Clock,
  Users,
  ShieldCheck,
  Send,
  Loader2,
  HelpCircle,
  XCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { StarBorder } from '../components/ui/StarBorder';
import { api } from '../services/api';

interface AssistantPageProps {
  onNavigateBookings: () => void;
}

export interface BookingDraft {
  title: string;
  category: string;
  day: string;
  start_period: number | null;
  end_period: number | null;
  attendance: number | null;
  preferred_room_id: string;
  room_types: string[];
  needs: string[];
  needs_accessible: boolean;
  confidence?: number;
  reference_date?: string;
  is_relative_day?: boolean;
  extracted_fields: string[];
  missing_fields: string[];
  needs_input: boolean;
  needs_input_fields: string[];
  follow_up_questions: string[];
}

const PERIOD_LABELS: Record<number, string> = {
  1: 'P1 (08:00–09:00)',
  2: 'P2 (09:00–10:00)',
  3: 'P3 (10:00–11:00)',
  4: 'P4 (11:00–12:00)',
  5: 'P5 (12:00–13:00)',
  6: 'P6 (14:00–15:00)',
  7: 'P7 (15:00–16:00)',
  8: 'P8 (16:00–17:00)',
  9: 'P9 (17:00–18:00)',
  10: 'P10 (18:00–19:00)',
  11: 'P11 (19:00–20:00)',
  12: 'P12 (20:00–21:00)',
  13: 'P13 (21:00–22:00)'
};

export const AssistantPage: React.FC<AssistantPageProps> = ({ onNavigateBookings }) => {
  const [prompt, setPrompt] = useState('Book seminar hall for robotics workshop on Friday from 2 PM to 5 PM.');
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draft, setDraft] = useState<BookingDraft | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const samplePrompts = [
    'Book seminar hall for robotics workshop on Friday from 2 PM to 5 PM.',
    'Humein Saturday ko auditorium chahiye cultural event ke liye.',
    'Book a classroom for 80 students tomorrow morning.',
    'Reserve computing lab 1 on Wednesday 10 AM to 1 PM for Python bootcamp with 60 students.'
  ];

  const handleParse = async (textToParse?: string) => {
    const text = (textToParse !== undefined ? textToParse : prompt).trim();
    if (!text || isParsing) return;

    // RULE: Clear previous draft, errors, and success notifications immediately
    setDraft(null);
    setSubmitSuccess(null);
    setSubmitError(null);
    setIsParsing(true);

    try {
      const res = await api.parseNLPBooking(text);
      // Drive entire form from this single authoritative extraction response
      const authoritativeDraft: BookingDraft = {
        title: res.title || 'Campus Event',
        category: res.category || 'club_event',
        day: res.day || '',
        start_period: typeof res.start_period === 'number' ? res.start_period : null,
        end_period: typeof res.end_period === 'number' ? res.end_period : null,
        attendance: typeof res.attendance === 'number' && res.attendance > 0 ? res.attendance : null,
        preferred_room_id: res.preferred_room_id || '',
        room_types: Array.isArray(res.room_types) ? res.room_types : ['classroom'],
        needs: Array.isArray(res.needs) ? res.needs : ['projector', 'ac'],
        needs_accessible: !!res.needs_accessible,
        confidence: res.confidence,
        reference_date: res.reference_date,
        is_relative_day: res.is_relative_day,
        extracted_fields: res.extracted_fields || [],
        missing_fields: res.missing_fields || [],
        needs_input: !!res.needs_input,
        needs_input_fields: res.needs_input_fields || [],
        follow_up_questions: res.follow_up_questions || []
      };

      setDraft(authoritativeDraft);
    } catch (err: any) {
      // RULE: Failed parsing leaves NO stale draft visible
      setSubmitError(err?.message || 'Failed to extract booking details from prompt');
    } finally {
      setIsParsing(false);
    }
  };

  const updateDraftField = (field: keyof BookingDraft, value: any) => {
    if (!draft) return;
    setDraft((prev) => {
      if (!prev) return null;
      const updated = { ...prev, [field]: value };

      // Re-evaluate missing fields dynamically
      const missing: string[] = [];
      if (!updated.title || updated.title.trim().length < 3) missing.push('title');
      if (!updated.day) missing.push('day');
      if (updated.start_period == null || updated.end_period == null) missing.push('time');
      if (updated.attendance == null || updated.attendance <= 0) missing.push('attendance');
      if (!updated.preferred_room_id && updated.room_types.length === 0) missing.push('venue');

      updated.needs_input_fields = missing;
      updated.needs_input = missing.length > 0;
      return updated;
    });
  };

  // Submission validation
  const isAttendanceValid = draft?.attendance != null && draft.attendance > 0;
  const isDayValid = !!draft?.day && ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].includes(draft.day);
  const isTimeValid =
    draft?.start_period != null &&
    draft?.end_period != null &&
    draft.start_period >= 1 &&
    draft.end_period <= 13 &&
    draft.start_period <= draft.end_period;
  const isVenueValid = !!draft?.preferred_room_id || (draft?.room_types && draft.room_types.length > 0);
  const isTitleValid = !!draft?.title && draft.title.trim().length >= 3;

  const isReadyToSubmit =
    !!draft &&
    !isSubmitting &&
    isAttendanceValid &&
    isDayValid &&
    isTimeValid &&
    isVenueValid &&
    isTitleValid;

  const handleConfirmSubmit = async () => {
    if (!draft || !isReadyToSubmit || isSubmitting) return;

    setSubmitSuccess(null);
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const duration = draft.end_period! - draft.start_period! + 1;
      const res = await api.createBooking({
        title: draft.title.trim(),
        description: `Natural language booking from prompt: "${prompt}"`,
        requested_category: draft.category,
        attendance: draft.attendance!,
        duration_periods: duration > 0 ? duration : 2,
        day: draft.day,
        start_period: draft.start_period!,
        end_period: draft.end_period!,
        room_types: draft.room_types.length > 0 ? draft.room_types : ['classroom'],
        needs: draft.needs.length > 0 ? draft.needs : ['projector', 'ac'],
        preferred_room_id: draft.preferred_room_id.trim() || undefined,
      });

      setSubmitSuccess(`Success! Booking request registered with ID ${res.id}. Awaiting administrative review.`);
      setDraft(null); // Clear draft upon successful submission
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to register booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#FBF8F3] rounded-2xl border border-[#1E1915]/10 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold font-serif text-[#1E1915] tracking-tight">AI Booking Request Assistant</h2>
            <Badge variant="academic">English & Hinglish Support</Badge>
          </div>
          <p className="text-xs text-[#5B5048] mt-1">
            Speak or type event requirements naturally. The AI extracts structured parameters into an editable draft before submission.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-[#243C50]/10 border border-[#243C50]/20 text-xs text-[#1E1915] flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-[#243C50] shrink-0" />
          <span>Deterministic validation enforced. AI drafts require human confirmation.</span>
        </div>
      </div>

      {/* Prompt Input Card */}
      <Card>
        <CardHeader>
          <CardTitle>Describe Your Event Request</CardTitle>
          <CardDescription>Type in plain English or conversational Hinglish</CardDescription>
        </CardHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleParse()}
              placeholder="e.g. Humein Saturday ko auditorium chahiye cultural event ke liye..."
              disabled={isParsing || isSubmitting}
              className="flex-1 px-4 py-3 rounded-xl border border-[#1E1915]/15 text-sm outline-none focus:border-[#A9502B] focus:ring-2 focus:ring-[#A9502B]/20 bg-[#F3ECE2]/40 text-[#1E1915] disabled:opacity-50"
            />
            <button
              onClick={() => handleParse()}
              disabled={isParsing || !prompt.trim() || isSubmitting}
              className="px-6 py-3 rounded-xl bg-[#A9502B] hover:bg-[#8F3F1E] text-[#F3ECE2] font-semibold text-xs shadow-sm flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isParsing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Extracting...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Parse & Draft</span>
                </>
              )}
            </button>
          </div>

          {/* Quick-fill Sample Prompts */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-[#5B5048] uppercase tracking-wider block">
              Sample Prompts (Click to test):
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(p);
                    handleParse(p);
                  }}
                  disabled={isParsing || isSubmitting}
                  className="px-3 py-2 rounded-xl bg-[#F3ECE2]/50 hover:bg-[#A9502B]/10 hover:text-[#A9502B] hover:border-[#A9502B]/30 border border-[#1E1915]/10 text-[#5B5048] text-xs text-left transition-all disabled:opacity-50"
                >
                  <span className="font-semibold text-[#A9502B] mr-1.5">{idx + 1}.</span>
                  <span>{p}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Notifications */}
      {submitSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{submitSuccess}</span>
          </div>
          <button
            onClick={onNavigateBookings}
            className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
          >
            View in Bookings
          </button>
        </div>
      )}

      {submitError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span className="font-medium">{submitError}</span>
          </div>
          <button
            onClick={() => setSubmitError(null)}
            className="text-rose-500 hover:text-rose-700"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Authoritative Single Draft Card */}
      {draft && (
        <Card className="border-[#1E1915]/10 bg-[#FBF8F3]">
          <CardHeader className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle>Authoritative Booking Draft</CardTitle>
                <Badge variant="terracotta">Review & Edit</Badge>
              </div>
              <CardDescription>
                Populated directly from AI extraction. Edit any field before submitting to the approval queue.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {draft.reference_date && (
                <span className="text-[11px] font-mono text-[#5B5048] bg-[#F3ECE2] px-2.5 py-1 rounded-lg border border-[#1E1915]/10">
                  Ref Date: {draft.reference_date}
                </span>
              )}
              {draft.confidence !== undefined && (
                <span className="text-xs font-mono font-semibold text-[#243C50]">
                  Confidence: {Math.round(draft.confidence * 100)}%
                </span>
              )}
            </div>
          </CardHeader>

          {/* Actionable Follow-up Questions Banner for Missing Information */}
          {draft.needs_input && draft.follow_up_questions && draft.follow_up_questions.length > 0 && (
            <div className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
              <div className="flex items-center gap-2 font-semibold text-amber-800">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Additional Details Required Before Confirmation</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1">
                {draft.follow_up_questions.map((q: string, idx: number) => (
                  <li key={idx}>
                    <span className="font-medium text-amber-900">{q}</span>
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-amber-700 italic">
                Highlighted fields below require your input before this draft can be confirmed.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Left Column: Title, Category, Day, Attendance */}
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[#5B5048] font-bold">Event Title</label>
                  {!isTitleValid && (
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                      Title Required (min 3 chars)
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={draft.title}
                  onChange={(e) => updateDraftField('title', e.target.value)}
                  placeholder="e.g. Robotics Workshop"
                  className={`w-full px-3 py-2 rounded-xl border text-[#1E1915] font-semibold outline-none focus:border-[#A9502B] ${
                    !isTitleValid ? 'border-amber-400 bg-amber-50/30' : 'border-[#1E1915]/15 bg-[#F3ECE2]/30'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[#5B5048] font-bold mb-1">Event Category</label>
                <select
                  value={draft.category}
                  onChange={(e) => updateDraftField('category', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#1E1915]/15 text-[#1E1915] bg-[#F3ECE2]/30 font-medium outline-none focus:border-[#A9502B]"
                >
                  <option value="club_event">Club Event</option>
                  <option value="department_event">Department Event</option>
                  <option value="guest_lecture">Guest Lecture</option>
                  <option value="institute_event">Institute Event</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[#5B5048] font-bold">Day of Week</label>
                    {!isDayValid && (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                        Day Required
                      </span>
                    )}
                  </div>
                  <select
                    value={draft.day || ''}
                    onChange={(e) => updateDraftField('day', e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border font-mono ${
                      !isDayValid
                        ? 'border-amber-400 bg-amber-50/50 ring-1 ring-amber-400/40 text-amber-900'
                        : 'border-[#1E1915]/15 bg-[#F3ECE2]/30 text-[#1E1915]'
                    }`}
                  >
                    <option value="">Select weekday...</option>
                    {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[#5B5048] font-bold">Attendance</label>
                    {!isAttendanceValid && (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                        Attendance Required
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={draft.attendance ?? ''}
                    onChange={(e) => {
                      const val = e.target.value === '' ? null : Number(e.target.value);
                      updateDraftField('attendance', val);
                    }}
                    placeholder="e.g. 50 (Required)"
                    className={`w-full px-3 py-2 rounded-xl border font-mono ${
                      !isAttendanceValid
                        ? 'border-amber-400 bg-amber-50/50 ring-1 ring-amber-400/40 placeholder:text-amber-600'
                        : 'border-[#1E1915]/15 bg-[#F3ECE2]/30 text-[#1E1915]'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Periods, Preferred Venue, Recognized Elements */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[#5B5048] font-bold">Start Period</label>
                    {draft.start_period == null && (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                        Required
                      </span>
                    )}
                  </div>
                  <select
                    value={draft.start_period ?? ''}
                    onChange={(e) => {
                      const val = e.target.value === '' ? null : Number(e.target.value);
                      updateDraftField('start_period', val);
                    }}
                    className={`w-full px-3 py-2 rounded-xl border font-mono ${
                      draft.start_period == null
                        ? 'border-amber-400 bg-amber-50/50 ring-1 ring-amber-400/40 text-amber-900'
                        : 'border-[#1E1915]/15 bg-[#F3ECE2]/30 text-[#1E1915]'
                    }`}
                  >
                    <option value="">Select start period...</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((p) => (
                      <option key={p} value={p}>
                        {PERIOD_LABELS[p] || `P${p}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[#5B5048] font-bold">End Period (Inclusive)</label>
                    {(draft.end_period == null || (draft.start_period != null && draft.end_period < draft.start_period)) && (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                        Required
                      </span>
                    )}
                  </div>
                  <select
                    value={draft.end_period ?? ''}
                    onChange={(e) => {
                      const val = e.target.value === '' ? null : Number(e.target.value);
                      updateDraftField('end_period', val);
                    }}
                    className={`w-full px-3 py-2 rounded-xl border font-mono ${
                      draft.end_period == null || (draft.start_period != null && draft.end_period < draft.start_period)
                        ? 'border-amber-400 bg-amber-50/50 ring-1 ring-amber-400/40 text-amber-900'
                        : 'border-[#1E1915]/15 bg-[#F3ECE2]/30 text-[#1E1915]'
                    }`}
                  >
                    <option value="">Select end period...</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((p) => (
                      <option key={p} value={p}>
                        {PERIOD_LABELS[p] || `P${p}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[#5B5048] font-bold">Preferred Venue</label>
                  {!isVenueValid && (
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                      Venue Required
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={draft.preferred_room_id}
                  onChange={(e) => updateDraftField('preferred_room_id', e.target.value.toUpperCase())}
                  placeholder="e.g. SH-1, AUD, CR-101, CS-LAB-1"
                  className={`w-full px-3 py-2 rounded-xl border font-mono font-semibold ${
                    !isVenueValid
                      ? 'border-amber-400 bg-amber-50/50 ring-1 ring-amber-400/40'
                      : 'border-[#1E1915]/15 bg-[#F3ECE2]/30 text-[#1E1915]'
                  }`}
                />
              </div>

              {/* Authoritative Recognized Elements Display */}
              <div className="p-3 rounded-xl bg-[#F3ECE2]/50 border border-[#1E1915]/10">
                <span className="text-[10px] text-[#5B5048] font-bold uppercase tracking-wider block mb-1">
                  Authoritative Recognized Elements:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {draft.extracted_fields && draft.extracted_fields.length > 0 ? (
                    draft.extracted_fields.map((f: string, i: number) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-[#FBF8F3] text-[#1E1915] border border-[#1E1915]/15 text-[10px] font-mono"
                      >
                        {f}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-[#5B5048]/60 italic">No specific elements recognized</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-[#1E1915]/10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-[11px] text-[#5B5048]">
              {!isReadyToSubmit && (
                <span className="text-amber-700 font-medium flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Please provide all highlighted fields before registering the booking.
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setDraft(null)}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl bg-[#F3ECE2] text-[#5B5048] font-semibold text-xs hover:bg-[#F3ECE2]/80 hover:text-[#1E1915] border border-[#1E1915]/10 transition-colors disabled:opacity-50"
              >
                Discard Draft
              </button>
              <StarBorder
                as="button"
                onClick={handleConfirmSubmit}
                disabled={!isReadyToSubmit}
                radius={12}
                color="#C8693F"
                trailColor="#A9502B"
                className="px-6 py-2.5 rounded-xl bg-[#A9502B] hover:bg-[#8F3F1E] text-[#F3ECE2] font-semibold text-xs shadow-md shadow-[#A9502B]/20 flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Registering Booking...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Confirm & Register Booking</span>
                  </>
                )}
              </StarBorder>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
