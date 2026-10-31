import React, { useEffect, useState } from 'react';
import { Search, Calendar, DoorClosed, Users, BookOpen, Sparkles, FileText, X } from 'lucide-react';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string) => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickNav = [
    { title: 'Weekly Timetable', page: 'timetable', icon: <Calendar className="h-4 w-4 text-blue-600" />, desc: 'P1-P9 schedule grid & solver' },
    { title: 'Midsem Exams', page: 'exams', icon: <FileText className="h-4 w-4 text-emerald-600" />, desc: '41 examination slots & half-capacity' },
    { title: 'Campus Venues', page: 'venues', icon: <DoorClosed className="h-4 w-4 text-cyan-600" />, desc: '27 rooms, amenities & accessibility' },
    { title: 'Booking Requests', page: 'bookings', icon: <Sparkles className="h-4 w-4 text-amber-600" />, desc: 'Submit event booking or review' },
    { title: 'Spectra Week 2027', page: 'spectra', icon: <Sparkles className="h-4 w-4 text-purple-600" />, desc: '25 fest week requests processing' },
    { title: 'Disruption Rescheduling', page: 'disruptions', icon: <Calendar className="h-4 w-4 text-rose-600" />, desc: 'Faculty leave & room leak displacement' },
    { title: 'Natural Language Assistant', page: 'assistant', icon: <Sparkles className="h-4 w-4 text-cyan-600" />, desc: 'English & Hinglish prompt booking' },
    { title: 'Campus Analytics', page: 'analytics', icon: <BookOpen className="h-4 w-4 text-blue-600" />, desc: 'Room utilization & faculty workload' },
    { title: 'AI Campus Assistant', page: 'ai-chat', icon: <Users className="h-4 w-4 text-emerald-600" />, desc: 'Grounded CIT campus knowledge Q&A' },
  ];

  const filtered = quickNav.filter(
    (item) => item.title.toLowerCase().includes(query.toLowerCase()) || item.desc.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-start justify-center pt-24 px-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-elevated border border-slate-200 max-w-xl w-full overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
          <Search className="h-5 w-5 text-slate-400 shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, page, or search query... (ESC to exit)"
            className="w-full text-sm outline-none text-slate-800 placeholder-slate-400 bg-transparent font-medium"
          />
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No matching pages found for "{query}"
            </div>
          ) : (
            filtered.map((item) => (
              <button
                key={item.page}
                onClick={() => {
                  onNavigate(item.page);
                  onClose();
                }}
                className="w-full text-left px-3.5 py-2.5 rounded-xl flex items-center justify-between hover:bg-blue-50/60 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-white border border-slate-200 transition-colors">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-700">Jump</span>
              </button>
            ))
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <span>Pro tip: Press <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px]">ESC</kbd> to dismiss</span>
          <span>CIT Campus Scheduling Platform</span>
        </div>
      </div>
    </div>
  );
};

