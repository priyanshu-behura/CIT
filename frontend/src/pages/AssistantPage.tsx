import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  Clock,
  Users,
  ShieldCheck,
  Edit3,
  ArrowRight
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { api } from '../services/api';

interface AssistantPageProps {
  onNavigateBookings: () => void;
}

export const AssistantPage: React.FC<AssistantPageProps> = ({ onNavigateBookings }) => {
  const [prompt, setPrompt] = useState('Book seminar hall for robotics workshop on Friday from 2 PM to 5 PM.');
  const [isParsing, setIsParsing] = useState(false);
  const [extracted, setExtracted] = useState<any | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const samplePrompts = [
    'Book seminar hall for robotics workshop on Friday from 2 PM to 5 PM.',
    'Humein Saturday ko auditorium chahiye cultural event ke liye.',
    'Book a classroom for 80 students tomorrow morning.',
    'Reserve computing lab 1 on Wednesday 10 AM to 1 PM for Python bootcamp with 60 students'
  ];

  const handleParse = async (textToParse?: string) => {
    const text = textToParse || prompt;
    if (!text.trim()) return;
    setIsParsing(true);
    setSubmitSuccess(null);
    setSubmitError(null);
    try {
      const res = await api.parseNLPBooking(text);
      setExtracted(res);
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to extract booking details');
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmSubmit = async () => {
    if (!extracted) return;
    setSubmitSuccess(null);
    setSubmitError(null);
    try {
      const res = await api.createBooking({
        title: extracted.title,
        description: `Natural language booking from prompt: "${prompt}"`,
        requested_category: extracted.category,
        attendance: extracted.attendance,
        duration_periods: extracted.end_period - extracted.start_period + 1,
        day: extracted.day,
        start_period: extracted.start_period,
        end_period: extracted.end_period,
        room_types: extracted.room_types,
        needs: extracted.needs || ['projector', 'ac'],
        preferred_room_id: extracted.preferred_room_id,
      });
      setSubmitSuccess(`Success! Booking request registered with ID ${res.id}. Awaiting administrative review.`);
      setExtracted(null);
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to register booking');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">AI Booking Request Assistant</h2>
            <Badge variant="cyan">English & Hinglish Support</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Speak or type event requirements naturally. The AI extracts structured parameters into editable drafts before submission.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0" />
          <span>Deterministic validation enforced. AI never decides booking validity.</span>
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
              placeholder="e.g. Humein Saturday ko auditorium chahiye cultural event ke liye..."
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50"
            />
            <button
              onClick={() => handleParse()}
              disabled={isParsing || !prompt.trim()}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              <span>{isParsing ? 'Extracting...' : 'Parse & Draft'}</span>
            </button>
          </div>

          {/* Quick-fill Sample Prompts */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Sample Prompts (Click to test):</span>
            <div className="flex flex-wrap gap-2">
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(p);
                    handleParse(p);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 text-slate-600 text-xs text-left transition-all"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Notifications */}
      {submitSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
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
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Extracted Entity Review Draft Card */}
      {extracted && (
        <Card className="border-blue-200 bg-white">
          <CardHeader className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle>Extracted Booking Draft</CardTitle>
                <Badge variant="electric">Review & Confirm</Badge>
              </div>
              <CardDescription>Verify the extracted fields before submitting for administrative approval</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {extracted.reference_date && (
                <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                  Ref Date: {extracted.reference_date}
                </span>
              )}
              <span className="text-xs font-mono font-semibold text-blue-700">
                Confidence: {Math.round(extracted.confidence * 100)}%
              </span>
            </div>
          </CardHeader>

          {/* Actionable Follow-up Questions Banner for Missing / Vague Fields */}
          {extracted.needs_input && extracted.follow_up_questions && extracted.follow_up_questions.length > 0 && (
            <div className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
              <div className="flex items-center gap-2 font-semibold text-amber-800">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Additional Details Needed (Review Draft Below Before Submitting)</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1">
                {extracted.follow_up_questions.map((q: string, idx: number) => (
                  <li key={idx}><span className="font-medium text-amber-900">{q}</span></li>
                ))}
              </ul>
              <p className="text-[11px] text-amber-700 italic">
                Fields highlighted in amber were not fully specified in your prompt. Please verify or update their values below before confirming.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-3">
              <div>
                <label className="block text-slate-500 font-bold mb-1">Event Title</label>
                <input
                  type="text"
                  value={extracted.title}
                  onChange={(e) => setExtracted({ ...extracted, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-semibold outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">Event Category</label>
                <select
                  value={extracted.category}
                  onChange={(e) => setExtracted({ ...extracted, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 bg-white font-medium outline-none focus:border-blue-500"
                >
                  <option value="club_event">Club Event</option>
                  <option value="department_event">Department Event</option>
                  <option value="guest_lecture">Guest Lecture</option>
                  <option value="institute_event">Institute Event</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-500 font-bold">Day of Week</label>
                    {extracted.needs_input_fields?.includes('day') && (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">Needs Input</span>
                    )}
                  </div>
                  <select
                    value={extracted.day}
                    onChange={(e) => setExtracted({ ...extracted, day: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border font-mono ${
                      extracted.needs_input_fields?.includes('day')
                        ? 'border-amber-400 bg-amber-50/50 ring-1 ring-amber-400/40'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-500 font-bold">Attendance</label>
                    {extracted.needs_input_fields?.includes('attendance') && (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">Needs Input</span>
                    )}
                  </div>
                  <input
                    type="number"
                    value={extracted.attendance}
                    onChange={(e) => setExtracted({ ...extracted, attendance: Number(e.target.value) })}
                    className={`w-full px-3 py-2 rounded-xl border font-mono ${
                      extracted.needs_input_fields?.includes('attendance')
                        ? 'border-amber-400 bg-amber-50/50 ring-1 ring-amber-400/40'
                        : 'border-slate-200'
                    }`}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-500 font-bold">Start Period</label>
                    {extracted.needs_input_fields?.includes('time') && (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">Needs Input</span>
                    )}
                  </div>
                  <select
                    value={extracted.start_period}
                    onChange={(e) => setExtracted({ ...extracted, start_period: Number(e.target.value) })}
                    className={`w-full px-3 py-2 rounded-xl border font-mono ${
                      extracted.needs_input_fields?.includes('time')
                        ? 'border-amber-400 bg-amber-50/50 ring-1 ring-amber-400/40'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    {[1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12].map((p) => (
                      <option key={p} value={p}>P{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-500 font-bold">End Period</label>
                    {extracted.needs_input_fields?.includes('time') && (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">Needs Input</span>
                    )}
                  </div>
                  <select
                    value={extracted.end_period}
                    onChange={(e) => setExtracted({ ...extracted, end_period: Number(e.target.value) })}
                    className={`w-full px-3 py-2 rounded-xl border font-mono ${
                      extracted.needs_input_fields?.includes('time')
                        ? 'border-amber-400 bg-amber-50/50 ring-1 ring-amber-400/40'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    {[1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13].map((p) => (
                      <option key={p} value={p}>P{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-500 font-bold">Preferred Venue</label>
                  {extracted.needs_input_fields?.includes('venue') && (
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">Needs Input</span>
                  )}
                </div>
                <input
                  type="text"
                  value={extracted.preferred_room_id}
                  onChange={(e) => setExtracted({ ...extracted, preferred_room_id: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border font-mono font-semibold ${
                    extracted.needs_input_fields?.includes('venue')
                      ? 'border-amber-400 bg-amber-50/50 ring-1 ring-amber-400/40'
                      : 'border-slate-200'
                  }`}
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Recognized Elements:</span>
                <div className="flex flex-wrap gap-1.5">
                  {extracted.extracted_fields?.map((f: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 text-[10px] font-mono">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              onClick={() => setExtracted(null)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200"
            >
              Discard Draft
            </button>
            <button
              onClick={handleConfirmSubmit}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-600/20 flex items-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Confirm & Register Booking</span>
            </button>
          </div>
        </Card>
      )}
    </div>
  );
};

