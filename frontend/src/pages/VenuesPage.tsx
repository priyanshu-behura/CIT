import React, { useState, useEffect } from 'react';
import {
  DoorClosed,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Building2,
  Tv,
  Wind,
  Mic,
  Monitor,
  Flame,
  Calendar,
  Layers
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { api } from '../services/api';
import type { RoomItem, DetailedSession } from '../types/dataset';

export const VenuesPage: React.FC = () => {
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [sessions, setSessions] = useState<DetailedSession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [selectedRoom, setSelectedRoom] = useState<RoomItem | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [rRes, sRes] = await Promise.all([
          api.getRooms(),
          api.getCurrentTimetable()
        ]);
        setRooms(rRes);
        setSessions(sRes.sessions);
      } catch (err) {
        console.error(err);
      }
    };
    loadData();
  }, []);

  const filteredRooms = rooms.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.building.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'ALL' || r.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const roomTypes = Array.from(new Set(rooms.map((r) => r.type)));

  // Sessions for selected room
  const selectedRoomSessions = selectedRoom
    ? sessions.filter((s) => s.room_id === selectedRoom.id)
    : [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#FBF8F3] rounded-2xl border border-[#1E1915]/10 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-serif font-bold text-[#1E1915] tracking-tight">Campus Venues & Facilities</h2>
            <Badge variant="cyan">{rooms.length} Venues</Badge>
          </div>
          <p className="text-xs text-[#5B5048] mt-1 font-sans">
            Auditorium, 6 Lecture Halls, 10 Classrooms, 2 Seminar Halls, 7 Labs & Open Air Theatre
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-[#243C50]/10 border border-[#243C50]/20 text-xs text-[#243C50]">
            <span className="font-bold">Total Campus Seating:</span>{' '}
            <span className="font-mono font-bold text-sm text-[#243C50]">
              {rooms.reduce((acc, r) => acc + r.capacity, 0).toLocaleString()} seats
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#FBF8F3] rounded-2xl border border-[#1E1915]/10 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="h-4 w-4 text-[#5B5048] absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by venue name, ID, or building..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#1E1915]/15 text-xs text-[#1E1915] outline-none focus:border-[#A9502B] bg-[#FBF8F3]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-semibold text-[#5B5048] uppercase tracking-wider font-mono">Type:</span>
          <button
            onClick={() => setTypeFilter('ALL')}
            className={`px-3 py-1 rounded-lg font-semibold text-xs transition-all ${
              typeFilter === 'ALL' ? 'bg-[#A9502B] text-[#F3ECE2]' : 'text-[#5B5048] hover:bg-[#F3ECE2]'
            }`}
          >
            All
          </button>
          {roomTypes.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1 rounded-lg font-semibold text-xs capitalize transition-all shrink-0 ${
                typeFilter === t ? 'bg-[#A9502B] text-[#F3ECE2]' : 'text-[#5B5048] hover:bg-[#F3ECE2]'
              }`}
            >
              {t.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Venues Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredRooms.map((r) => (
          <div
            key={r.id}
            onClick={() => setSelectedRoom(r)}
            className="p-5 rounded-2xl bg-[#FBF8F3] border border-[#1E1915]/10 shadow-sm hover:shadow-card-hover hover:border-[#A9502B]/40 transition-all cursor-pointer space-y-4 group"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono font-bold text-xs text-[#A9502B]">{r.id}</span>
                <h3 className="text-base font-serif font-bold text-[#1E1915] group-hover:text-[#A9502B] transition-colors">{r.name}</h3>
                <p className="text-xs text-[#5B5048] flex items-center gap-1 mt-0.5">
                  <Building2 className="h-3 w-3 text-[#5B5048]" /> {r.building}
                </p>
              </div>
              <Badge variant="neutral" size="sm" className="capitalize">
                {r.type.replace('_', ' ')}
              </Badge>
            </div>

            {/* Capacity Badges */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1E1915]/10 text-xs">
              <div className="p-2.5 rounded-xl bg-[#F3ECE2] border border-[#1E1915]/10">
                <span className="text-[10px] text-[#5B5048] font-bold uppercase tracking-wider block font-mono">Regular Cap</span>
                <span className="text-base font-extrabold text-[#1E1915] font-mono">{r.capacity}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#243C50]/10 border border-[#243C50]/20">
                <span className="text-[10px] text-[#243C50] font-bold uppercase tracking-wider block font-mono">Exam Cap (½)</span>
                <span className="text-base font-extrabold text-[#243C50] font-mono">{Math.floor(r.capacity / 2)}</span>
              </div>
            </div>

            {/* Features Tags */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap gap-1.5">
                {r.features.map((f) => (
                  <span
                    key={f}
                    className="px-2 py-0.5 rounded-md bg-[#F3ECE2] text-[#5B5048] text-[10px] font-medium capitalize border border-[#1E1915]/5"
                  >
                    {f.replace('_', ' ')}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="text-[#5B5048]">Wheelchair Accessible:</span>
                {r.accessible ? (
                  <span className="text-emerald-800 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" /> Accessible
                  </span>
                ) : (
                  <span className="text-[#5B5048] flex items-center gap-1">
                    <XCircle className="h-3.5 w-3.5 text-[#5B5048]" /> Not Adapted
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Room Schedule Modal */}
      {selectedRoom && (
        <div className="fixed inset-0 z-50 bg-[#191513]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FBF8F3] rounded-2xl shadow-elevated border border-[#1E1915]/15 max-w-2xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[#1E1915]/10 pb-3">
              <div>
                <span className="font-mono text-xs text-[#A9502B] font-bold">{selectedRoom.id}</span>
                <h3 className="text-lg font-serif font-bold text-[#1E1915]">{selectedRoom.name}</h3>
                <p className="text-xs text-[#5B5048]">{selectedRoom.building} &middot; Capacity: {selectedRoom.capacity} seats</p>
              </div>
              <button
                onClick={() => setSelectedRoom(null)}
                className="p-1 rounded-lg text-[#5B5048] hover:bg-[#F3ECE2] text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <h4 className="text-xs font-serif font-bold text-[#1E1915] uppercase tracking-wider mb-2">
                Scheduled Teaching Sessions ({selectedRoomSessions.length})
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedRoomSessions.length === 0 ? (
                  <p className="text-xs text-[#5B5048] py-4 text-center">No regular sessions scheduled in this room.</p>
                ) : (
                  selectedRoomSessions.map((s) => (
                    <div key={s.session_id} className="p-3 rounded-xl bg-[#F3ECE2] border border-[#1E1915]/10 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-[#1E1915]">{s.course_name} ({s.course_id})</span>
                        <p className="text-[11px] text-[#5B5048]">{s.faculty_name} &middot; Cohort: {s.groups.join(', ')}</p>
                      </div>
                      <div className="text-right font-mono font-bold text-[#243C50]">
                        {s.day} P{s.start_period}–P{s.end_period}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-[#1E1915]/10 text-right">
              <button
                onClick={() => setSelectedRoom(null)}
                className="px-4 py-2 rounded-xl bg-[#F3ECE2] text-[#1E1915] font-semibold text-xs hover:bg-[#F3ECE2]/80"
              >
                Close Room Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

