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
    <div className="fixed inset-0 z-50 bg-[#191513]/60 backdrop-blur-sm flex items-start justify-center pt-24 px-4 animate-in fade-in duration-150">
      <div className="bg-[#FBF8F3] rounded-2xl shadow-elevated border border-[#1E1915]/15 max-w-xl w-full overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#1E1915]/10">
          <Search className="h-5 w-5 text-[#5B5048] shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, page, or search query... (ESC to exit)"
            className="w-full text-sm outline-none text-[#1E1915] placeholder-[#5B5048]/60 bg-transparent font-medium"
          />
          <button onClick={onClose} className="p-1 hover:bg-[#F3ECE2] rounded-lg text-[#5B5048] hover:text-[#1E1915]">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#5B5048]">
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
                className="w-full text-left px-3.5 py-2.5 rounded-xl flex items-center justify-between hover:bg-[#F3ECE2] transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#F3ECE2] group-hover:bg-[#FBF8F3] border border-[#1E1915]/10 transition-colors">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1E1915] group-hover:text-[#A9502B] transition-colors">{item.title}</p>
                    <p className="text-xs text-[#5B5048]">{item.desc}</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-[#F3ECE2] text-[#5B5048] group-hover:bg-[#A9502B]/10 group-hover:text-[#A9502B]">Jump</span>
              </button>
            ))
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-[#F3ECE2] border-t border-[#1E1915]/10 flex items-center justify-between text-[11px] text-[#5B5048] font-medium">
          <span>Pro tip: Press <kbd className="px-1.5 py-0.5 rounded bg-[#FBF8F3] border border-[#1E1915]/15 font-mono text-[10px]">ESC</kbd> to dismiss</span>
          <span>CIT Campus Scheduling Platform</span>
        </div>
      </div>
    </div>
  );
};

