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
      text: "Hello! I'm Campus AI. How can I help you today? I have complete knowledge of the Chilika Institute of Technology campus, 189 teaching sessions, 27 venues, 40 faculty members, and Spectra Week booking policies. I can also help you with general academic concepts, computer science, and programming questions. Feel free to chat naturally in English or Hinglish!",
      category: 'general',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      is_ai_powered: true,
      model: 'Campus AI'
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sampleQueries = [
    'CIT kya hai?',
    'What departments are available at CIT?',
    'Mujhe seminar hall book karna hai.',
    'Explain Python loops with an example.',
    'Friday ko available rooms kaunse hain?',
    'Explain artificial intelligence in simple words.',
    'Mujhe CSE department ke baare mein batao.',
    'What is the difference between RAM and ROM?',
    'What are the rules for lunch break?',
    'Tell me about the Main Auditorium capacity.'
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

    const currentMessages = [...messages, userMsg];
    setMessages(currentMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Build conversation history from recent turns
      const historyPayload = messages
        .filter((m) => m.text && m.sender)
        .slice(-8)
        .map((m) => ({
          role: m.sender,
          text: m.text,
        }));

      const res = await api.queryAIChat(q, user?.role, user?.email, historyPayload);
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
        text: "I'm having trouble connecting right now. Please try again.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model: 'Campus AI'
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitDraftBooking = async (msgId: string, draft: any) => {
    if (!draft) return;

    if (!draft.attendance || draft.attendance <= 0) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? {
                ...m,
                submit_error: 'Attendance is required before confirming this booking request.',
              }
            : m
        )
      );
      return;
    }

    if (!draft.day || draft.start_period == null || draft.end_period == null) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? {
                ...m,
                submit_error: 'Day and time periods are required before confirming this booking request.',
              }
            : m
        )
      );
      return;
    }

    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, is_submitting: true, submit_error: undefined } : m))
    );

    try {
      const duration = draft.end_period - draft.start_period + 1;
      const res = await api.createBooking({
        title: (draft.title || 'Campus Event').trim(),
        description: `Booking requested via CIT AI Assistant: ${draft.title}`,
        requested_category: draft.category || 'club_event',
        attendance: draft.attendance,
        duration_periods: duration > 0 ? duration : 2,
        day: draft.day,
        start_period: draft.start_period,
        end_period: draft.end_period,
        room_types: draft.room_types || ['classroom'],
        needs: draft.needs || ['projector', 'ac'],
        preferred_room_id: draft.preferred_room_id || undefined,
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
      <div className="bg-[#FBF8F3] rounded-2xl border border-[#1E1915]/10 p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold font-serif text-[#1E1915] tracking-tight">Campus AI</h2>
            <Badge variant="terracotta">Your intelligent campus assistant</Badge>
          </div>
          <p className="text-xs text-[#5B5048] mt-1">
            Ask questions about timetables, faculty load, room availability, bookings, or general programming and technology topics in English or Hinglish.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-[#243C50]/10 border border-[#243C50]/20 text-xs text-[#1E1915] flex items-center gap-2 self-start md:self-auto">
          <ShieldCheck className="h-4 w-4 text-[#243C50] shrink-0" />
          <span>Institutional Governance: Deterministic Solver is Authoritative</span>
        </div>
      </div>

      {/* Chat Container */}
      <Card className="flex flex-col h-[calc(100vh-14rem)] min-h-[500px] max-h-[720px] p-0 overflow-hidden border-[#1E1915]/10 bg-[#FBF8F3]">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 bg-[#F3ECE2]/40">
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
                    ? 'bg-[#A9502B] text-[#F3ECE2]'
                    : 'bg-[#243C50] text-[#F3ECE2]'
                }`}
              >
                {m.sender === 'user' ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              <div
                className={`p-4 rounded-2xl text-xs space-y-3 shadow-xs ${
                  m.sender === 'user'
                    ? 'bg-[#A9502B] text-[#F3ECE2] rounded-tr-xs'
                    : 'bg-[#FBF8F3] border border-[#1E1915]/10 text-[#1E1915] rounded-tl-xs'
                }`}
              >
                <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>

                {/* Structured Draft Booking Card if assistant prepared a draft */}
                {m.sender === 'assistant' && m.draft_booking && (
                  <div className="p-3.5 rounded-xl bg-[#F3ECE2]/50 border border-[#1E1915]/10 space-y-3 text-[#1E1915]">
                    <div className="flex items-center justify-between border-b border-[#1E1915]/10 pb-2">
                      <div className="flex items-center gap-1.5 font-bold text-[#1E1915] text-xs">
                        <Sparkles className="h-3.5 w-3.5 text-[#A9502B]" />
                        <span>Draft Booking Preview: {m.draft_booking.title || 'Campus Event'}</span>
                      </div>
                      <span className="text-[10px] font-mono uppercase bg-[#A9502B]/10 text-[#A9502B] px-2 py-0.5 rounded-full font-semibold">
                        {m.draft_booking.category || 'Event'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                      <div className="flex items-center gap-1.5 text-[#5B5048]">
                        <Calendar className="h-3.5 w-3.5 text-[#5B5048]/70" />
                        <span>Day: <strong className={m.draft_booking.day ? "text-[#1E1915]" : "text-amber-700"}>{m.draft_booking.day || 'Required'}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#5B5048]">
                        <Clock className="h-3.5 w-3.5 text-[#5B5048]/70" />
                        <span>Period: <strong className={m.draft_booking.start_period != null ? "text-[#1E1915]" : "text-amber-700"}>
                          {m.draft_booking.start_period != null && m.draft_booking.end_period != null
                            ? `P${m.draft_booking.start_period}–P${m.draft_booking.end_period}`
                            : 'Required'}
                        </strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#5B5048]">
                        <Users className="h-3.5 w-3.5 text-[#5B5048]/70" />
                        <span>Attendance: <strong className={m.draft_booking.attendance ? "text-[#1E1915]" : "text-amber-700 font-bold"}>
                          {m.draft_booking.attendance ? `${m.draft_booking.attendance} students` : 'Required'}
                        </strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#5B5048]">
                        <Building2 className="h-3.5 w-3.5 text-[#5B5048]/70" />
                        <span>Room: <strong className="text-[#1E1915]">{m.draft_booking.preferred_room_id || 'Any suitable'}</strong></span>
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
                        <span className="text-[10px] text-[#5B5048] italic">
                          Deterministic verification will be enforced upon submission.
                        </span>
                        <button
                          onClick={() => handleSubmitDraftBooking(m.id, m.draft_booking)}
                          disabled={m.is_submitting || !m.draft_booking.attendance || !m.draft_booking.day || m.draft_booking.start_period == null || m.draft_booking.end_period == null}
                          className="px-3.5 py-1.5 rounded-lg bg-[#A9502B] hover:bg-[#8F3F1E] text-[#F3ECE2] font-semibold text-xs shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
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
                    m.sender === 'user' ? 'text-[#F3ECE2]/80' : 'text-[#5B5048]'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {m.category && <span className="capitalize font-mono">[{m.category}]</span>}
                    {m.sender === 'assistant' && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] bg-[#F3ECE2] text-[#5B5048] border border-[#1E1915]/10">
                        <Cpu className="h-2.5 w-2.5 text-[#243C50]" />
                        Campus AI
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
              <div className="h-8 w-8 rounded-full bg-[#243C50] flex items-center justify-center text-[#F3ECE2]">
                <Bot className="h-4 w-4" />
              </div>
              <div className="p-3 rounded-2xl bg-[#FBF8F3] border border-[#1E1915]/10 text-xs text-[#5B5048] animate-pulse">
                Campus AI is thinking...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Queries Pills */}
        <div className="px-5 py-2.5 bg-[#FBF8F3] border-t border-[#1E1915]/10 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-[10px] font-bold text-[#5B5048] uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-[#A9502B]" /> Suggestions:
          </span>
          {sampleQueries.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="px-2.5 py-1 rounded-lg bg-[#F3ECE2] hover:bg-[#A9502B]/10 hover:text-[#A9502B] text-[#5B5048] border border-[#1E1915]/10 text-[11px] font-medium shrink-0 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-[#FBF8F3] border-t border-[#1E1915]/10 flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask in English or Hinglish (e.g. 'Humein Friday ko SH-1 chahiye workshop ke liye')..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-[#1E1915]/15 text-xs outline-none focus:border-[#A9502B] bg-[#F3ECE2]/40 text-[#1E1915] placeholder:text-[#5B5048]/60"
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="p-2.5 rounded-xl bg-[#A9502B] hover:bg-[#8F3F1E] text-[#F3ECE2] transition-all disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </Card>
    </div>
  );
};
