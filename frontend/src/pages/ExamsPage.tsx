import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Calendar,
  Users,
  DoorClosed,
  CheckCircle2,
  Clock,
  Filter,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { api } from '../services/api';
import type { ScheduledExam } from '../types/dataset';

export const ExamsPage: React.FC = () => {
  const [exams, setExams] = useState<ScheduledExam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<string>('ALL');

  useEffect(() => {
    const loadExams = async () => {
      setIsLoading(true);
      try {
        const res = await api.getExamSchedule({
          group: selectedGroup || undefined,
          day: selectedDay !== 'ALL' ? selectedDay : undefined,
        });
        setExams(res.exams);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadExams();
  }, [selectedGroup, selectedDay]);

  const examDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#FBF8F3] rounded-2xl border border-[#1E1915]/10 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-serif font-bold text-[#1E1915] tracking-tight">Midsem Examination Schedule</h2>
            <Badge variant="success">41 Exams Coordinated</Badge>
          </div>
          <p className="text-xs text-[#5B5048] mt-1 font-sans">
            Official Midsem Week &middot; Monday–Saturday &middot; AM Session (09:30–11:30) & PM Session (14:00–16:00)
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-[#243C50]/10 border border-[#243C50]/20 text-xs text-[#243C50] space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-[#243C50]" />
            Effective Room Capacity Halved (H5 & E2)
          </p>
          <p className="text-[11px] text-[#243C50]/80">
            Every venue's seating capacity is strictly halved ($\lfloor C/2 \rfloor$) for examinations to ensure proper separation.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#FBF8F3] rounded-2xl border border-[#1E1915]/10 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-[#5B5048] uppercase tracking-wider text-[11px] flex items-center gap-1 font-mono">
            <Filter className="h-3 w-3" /> Filter Exams:
          </span>

          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-[#1E1915]/15 bg-[#FBF8F3] text-[#1E1915] font-medium outline-none"
          >
            <option value="">All Student Cohorts (14 Groups)</option>
            {['CSE-1', 'CSE-2', 'CSE-3', 'ECE-1', 'ECE-2', 'ECE-3', 'EE-1', 'EE-2', 'EE-3', 'ME-1', 'ME-2', 'ME-3', 'CE-1', 'CE-2'].map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1">
          {['ALL', ...examDays].map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDay(d)}
              className={`px-2.5 py-1 rounded-lg font-mono font-bold text-[11px] transition-all ${
                selectedDay === d ? 'bg-[#A9502B] text-[#F3ECE2]' : 'text-[#5B5048] hover:bg-[#F3ECE2]'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Exams Table */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>Midsem Examination Allocations ({exams.length})</CardTitle>
            <CardDescription>Validated room assignments and effective seating totals</CardDescription>
          </div>
          <span className="text-xs font-mono text-[#5B5048]">AM: 09:30–11:30 | PM: 14:00–16:00</span>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1E1915]/10 text-[#5B5048] font-mono uppercase text-[10px] bg-[#F3ECE2]">
                <th className="py-3 px-3">Exam ID</th>
                <th className="py-3 px-3">Slot</th>
                <th className="py-3 px-3">Courses Included</th>
                <th className="py-3 px-3">Cohorts</th>
                <th className="py-3 px-3 text-right">Students</th>
                <th className="py-3 px-3">Assigned Rooms</th>
                <th className="py-3 px-3 text-right">Effective Seats</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E1915]/10 font-sans">
              {exams.map((ex) => (
                <tr key={ex.exam_id} className="hover:bg-[#F3ECE2]/50 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-[#A9502B]">{ex.exam_id}</td>
                  <td className="py-3 px-3 font-mono">
                    <span className="font-bold text-[#1E1915]">{ex.day}</span>{' '}
                    <span className="text-[#A9502B] font-semibold">{ex.session}</span>
                  </td>
                  <td className="py-3 px-3 font-medium text-[#1E1915]">{ex.course_ids.join(', ')}</td>
                  <td className="py-3 px-3 text-[#5B5048]">{ex.groups.join(', ')}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-[#1E1915]">{ex.student_count}</td>
                  <td className="py-3 px-3">
                    <div className="flex flex-wrap gap-1">
                      {ex.assigned_rooms.map((r) => (
                        <span
                          key={r.room_id}
                          className="px-2 py-0.5 rounded bg-[#F3ECE2] text-[#5B5048] border border-[#1E1915]/10 font-mono text-[10px]"
                        >
                          {r.name} ({r.effective_exam_capacity} seats)
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800">
                    {ex.total_effective_seats}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {ex.capacity_valid ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-950/10 px-2 py-0.5 rounded-full border border-emerald-300">
                        <CheckCircle2 className="h-3 w-3 text-emerald-700" /> Valid
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-800 bg-rose-950/10 px-2 py-0.5 rounded-full border border-rose-300">
                        <AlertCircle className="h-3 w-3 text-rose-700" /> Insufficient
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

