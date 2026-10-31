import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Sparkles,
  Bot,
  User as UserIcon,
  HelpCircle,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
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
}

export const AIChatPage: React.FC<AIChatPageProps> = ({ user }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'assistant',
      text: 'Hello! I am your CIT Campus Scheduling Assistant. I have full knowledge of the Chilika Institute of Technology (cit-public-v1) dataset, our 189 teaching sessions, 27 campus venues, 40 faculty members, and Spectra Week booking policies. What would you like to know?',
      category: 'general',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sampleQueries = [
    'What are the rules for lunch break?',
    'How many venues are there on campus?',
    'Tell me about the Main Auditorium capacity.',
    'Why was booking request BR-04 cancelled?',
    'What is the faculty daily teaching limit?',
    'When do 3-hour practical lab sessions start?'
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
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: 'I encountered an error querying the campus database. Please ensure the backend is connected.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
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
            Ask questions about timetables, faculty load constraints, room availability, booking rules, and disruptions.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-blue-600" />
          <span>Strictly grounded facts &middot; Zero invented hallucinations</span>
        </div>
      </div>

      {/* Chat Container */}
      <Card className="flex flex-col h-[600px] p-0 overflow-hidden">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-3 max-w-2xl ${
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
                className={`p-4 rounded-2xl text-xs space-y-1.5 shadow-xs ${
                  m.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-xs'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                }`}
              >
                <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                <div
                  className={`flex items-center justify-between gap-2 text-[10px] ${
                    m.sender === 'user' ? 'text-blue-100' : 'text-slate-400'
                  }`}
                >
                  {m.category && <span className="capitalize font-mono">[{m.category}]</span>}
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
            placeholder="Ask about timetables, venues, bookings, or campus constraints..."
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

