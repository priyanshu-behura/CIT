import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User as UserIcon,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Clock,
  Users,
  Building2,
  AlertCircle,
  Cpu
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { api } from '../services/api';
import type { User } from '../types/dataset';

interface AIChatPageProps {
  user: User | null;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  category?: string;
  time: string;
  is_booking_intent?: boolean;
  draft_booking?: any;
  follow_up_questions?: string[];
  needs_input?: boolean;
  needs_input_fields?: string[];
  is_ai_powered?: boolean;
  model?: string;
  booking_submitted_id?: string;
  is_submitting?: boolean;
  submit_error?: string;
}

export const AIChatPage: React.FC<AIChatPageProps> = ({ user }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'assistant',
      text: 'Hello! I am your CIT Campus Scheduling Assistant. I have full knowledge of the Chilika Institute of Technology dataset, our 189 teaching sessions, 27 campus venues, 40 faculty members, and Spectra Week booking policies. You can ask questions or describe an event to book in English or Hinglish.',
      category: 'general',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      is_ai_powered: false,
      model: 'deterministic-engine'
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sampleQueries = [
    'What are the rules for lunch break?',
    'How many venues are there on campus?',
    'Tell me about the Main Auditorium capacity.',
    'Book seminar hall for robotics workshop on Friday from 2 PM to 5 PM.',
    'Humein Saturday ko auditorium chahiye cultural event ke liye.',
    'Why was booking request BR-04 cancelled?',
    'Explain the disruption impact of the CR-102 water leak.'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (queryText?: string) => {
    const q = queryText || input;
    if (!q.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text: q,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await api.queryAIChat(q, user?.role, user?.email);
      const assistantMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: res.answer,
        category: res.category,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        is_booking_intent: res.is_booking_intent,
        draft_booking: res.draft_booking,
        follow_up_questions: res.follow_up_questions,
        needs_input: res.needs_input,
        needs_input_fields: res.needs_input_fields,
        is_ai_powered: res.is_ai_powered,
        model: res.model,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: 'I encountered an error querying the campus database. Please ensure the backend server is running.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitDraftBooking = async (msgId: string, draft: any) => {
    if (!draft) return;

    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, is_submitting: true, submit_error: undefined } : m))
    );

    try {
      const duration = (draft.end_period || 8) - (draft.start_period || 6) + 1;
      const res = await api.createBooking({
        title: draft.title || 'Campus Event',
        description: `Booking requested via CIT AI Assistant: ${draft.title}`,
        requested_category: draft.category || 'club_event',
        attendance: draft.attendance || 60,
        duration_periods: duration > 0 ? duration : 2,
        day: draft.day || 'MON',
        start_period: draft.start_period || 6,
        end_period: draft.end_period || 8,
        room_types: draft.room_types || ['classroom'],
        needs: draft.needs || ['projector', 'ac'],
        preferred_room_id: draft.preferred_room_id || 'CR-101',
      });

      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? {
                ...m,
                is_submitting: false,
                booking_submitted_id: res.id || 'Confirmed',
              }
            : m
        )
      );
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? {
                ...m,
                is_submitting: false,
                submit_error: err?.message || 'Failed to submit booking to server',
              }
            : m
        )
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">AI Campus Assistant</h2>
            <Badge variant="cyan">Grounded CIT Knowledge</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Ask questions about timetables, faculty load constraints, room availability, booking rules, and disruptions in English or Hinglish.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
          <span>Institutional Governance: Deterministic Solver is Authoritative</span>
        </div>
      </div>

      {/* Chat Container */}
      <Card className="flex flex-col h-[640px] p-0 overflow-hidden">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-3 max-w-3xl ${
                m.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
              }`}
            >
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                  m.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gradient-to-tr from-cyan-600 to-blue-700 text-white'
                }`}
              >
                {m.sender === 'user' ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              <div
                className={`p-4 rounded-2xl text-xs space-y-3 shadow-xs ${
                  m.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-xs'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                }`}
              >
                <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>

                {/* Structured Draft Booking Card if assistant prepared a draft */}
                {m.sender === 'assistant' && m.draft_booking && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-slate-800">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                        <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                        <span>Draft Booking Preview: {m.draft_booking.title || 'Campus Event'}</span>
                      </div>
                      <span className="text-[10px] font-mono uppercase bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-semibold">
                        {m.draft_booking.category || 'Event'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>Day: <strong className="text-slate-900">{m.draft_booking.day || 'MON'}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>Period: <strong className="text-slate-900">P{m.draft_booking.start_period || 6}–P{m.draft_booking.end_period || 8}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        <span>Seats: <strong className="text-slate-900">{m.draft_booking.attendance || 60}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        <span>Room: <strong className="text-slate-900">{m.draft_booking.preferred_room_id || 'CR-101'}</strong></span>
                      </div>
                    </div>

                    {/* Follow-up Questions / Missing Input Alert */}
                    {m.follow_up_questions && m.follow_up_questions.length > 0 && (
                      <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] space-y-1">
                        <div className="flex items-center gap-1.5 font-semibold text-amber-800">
                          <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                          <span>Clarification Needed:</span>
                        </div>
                        <ul className="list-disc list-inside space-y-0.5 text-amber-950 pl-1">
                          {m.follow_up_questions.map((fq, idx) => (
                            <li key={idx}>{fq}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Booking Submission Status or Action Button */}
                    {m.booking_submitted_id ? (
                      <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-2 font-medium">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>Booking request registered as <strong>{m.booking_submitted_id}</strong>. Awaiting administrator review.</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-slate-500 italic">
                          Deterministic verification will be enforced upon submission.
                        </span>
                        <button
                          onClick={() => handleSubmitDraftBooking(m.id, m.draft_booking)}
                          disabled={m.is_submitting}
                          className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {m.is_submitting ? 'Submitting...' : 'Confirm & Submit Booking'}
                        </button>
                      </div>
                    )}

                    {m.submit_error && (
                      <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[10px]">
                        Error: {m.submit_error}
                      </div>
                    )}
                  </div>
                )}

                {/* Footer metadata */}
                <div
                  className={`flex items-center justify-between gap-2 text-[10px] ${
                    m.sender === 'user' ? 'text-blue-100' : 'text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {m.category && <span className="capitalize font-mono">[{m.category}]</span>}
                    {m.sender === 'assistant' && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] bg-slate-100 text-slate-600 border border-slate-200">
                        <Cpu className="h-2.5 w-2.5 text-blue-500" />
                        {m.is_ai_powered ? (m.model || 'Gemini 2.5 Flash') : 'CIT Knowledge Engine'}
                      </span>
                    )}
                  </div>
                  <span>{m.time}</span>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-cyan-600 flex items-center justify-center text-white">
                <Bot className="h-4 w-4" />
              </div>
              <div className="p-3 rounded-2xl bg-white border border-slate-200 text-xs text-slate-500 animate-pulse">
                Consulting campus knowledge base...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Queries Pills */}
        <div className="px-5 py-2.5 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-amber-500" /> Suggestions:
          </span>
          {sampleQueries.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 text-[11px] font-medium shrink-0 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask in English or Hinglish (e.g. 'Humein Friday ko SH-1 chahiye workshop ke liye')..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-500 bg-slate-50/50"
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </Card>
    </div>
  );
};
