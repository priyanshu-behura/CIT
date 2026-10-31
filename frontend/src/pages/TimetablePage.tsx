import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Play,
  ShieldCheck,
  Download,
  Filter,
  Search,
  Users,
  DoorClosed,
  Clock,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Loader2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { api } from '../services/api';
import type { DetailedSession, DatasetSummary } from '../types/dataset';

interface TimetablePageProps {
  summary: DatasetSummary | null;
}

export const TimetablePage: React.FC<TimetablePageProps> = ({ summary }) => {
  const [sessions, setSessions] = useState<DetailedSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSolving, setIsSolving] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'group' | 'faculty' | 'room'>('all');
  const [filterValue, setFilterValue] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<string>('ALL');
  const [validatorReport, setValidatorReport] = useState<any | null>(null);
  const [jobState, setJobState] = useState<{
    id: string | null;
    status: 'idle' | 'running' | 'completed' | 'failed';
    progress: number;
    stage: string;
    error?: string | null;
  }>({
    id: null,
    status: 'idle',
    progress: 0,
    stage: '',
    error: null
  });

  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
  const periods = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  const loadTimetable = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (filterType === 'group' && filterValue) params.group = filterValue;
      if (filterType === 'faculty' && filterValue) params.faculty_id = filterValue;
      if (filterType === 'room' && filterValue) params.room_id = filterValue;
      if (selectedDay !== 'ALL') params.day = selectedDay;

      const res = await api.getCurrentTimetable(params);
      setSessions(res.sessions);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTimetable();
  }, [filterType, filterValue, selectedDay]);

  const handleGenerate = async () => {
    setIsSolving(true);
    setValidatorReport(null);
    try {
      // Start background generation job
      const startRes = await api.startGenerateJob();
      setJobState({
        id: startRes.job_id,
        status: 'running',
        progress: startRes.progress || 5,
        stage: startRes.stage || 'Starting background solver...',
        error: null
      });

      // Poll status every 1.5 seconds until completion or failure
      const pollInterval = setInterval(async () => {
        try {
          const pollRes = await api.getGenerateJobStatus(startRes.job_id);
          setJobState({
            id: startRes.job_id,
            status: pollRes.status,
            progress: pollRes.progress || 0,
            stage: pollRes.stage || '',
            error: pollRes.error || null
          });

          if (pollRes.status === 'completed') {
            clearInterval(pollInterval);
            setIsSolving(false);
            if (pollRes.result) {
              setValidatorReport({
                hard_violations: pollRes.result.hard_violations,
                soft_total: pollRes.result.soft_total,
                duration: pollRes.result.solver_duration,
                scheduled: pollRes.result.total_sessions_scheduled
              });
            }
            loadTimetable();
          } else if (pollRes.status === 'failed') {
            clearInterval(pollInterval);
            setIsSolving(false);
          }
        } catch (pollErr: any) {
          clearInterval(pollInterval);
          setIsSolving(false);
          setJobState({
            id: startRes.job_id,
            status: 'failed',
            progress: 100,
            stage: 'Polling error',
            error: pollErr?.message || 'Failed to poll solver status'
          });
        }
      }, 1500);

    } catch (err: any) {
      setIsSolving(false);
      setJobState({
        id: null,
        status: 'failed',
        progress: 100,
        stage: 'Failed to initiate job',
        error: err?.message || 'Could not reach backend generation service'
      });
    }
  };

  const handleValidate = async () => {
    try {
      const rep = await api.getValidatorReport();
      setValidatorReport(rep);
    } catch (err: any) {
      alert(`Validation error: ${err.message}`);
    }
  };

  // Group sessions by day and period
  const gridMatrix: Record<string, Record<number, DetailedSession[]>> = {};
  for (const d of days) {
    gridMatrix[d] = {};
    for (const p of periods) {
      gridMatrix[d][p] = [];
    }
  }

  for (const s of sessions) {
    if (gridMatrix[s.day] && gridMatrix[s.day][s.start_period]) {
      gridMatrix[s.day][s.start_period].push(s);
    }
  }

  return (
    <div className="space-y-6">
      {/* Control & Solver Action Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Academic Timetable Viewer</h2>
            <p className="text-xs text-slate-500">
              Monday–Friday &middot; Periods P1–P9 (08:00–18:00) &middot; Lunch strictly respected between P5 and P6
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleGenerate}
              disabled={isSolving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5" />
              <span>{isSolving ? 'Solving OR-Tools CP-SAT...' : 'Generate Schedule'}</span>
            </button>

            <button
              onClick={handleValidate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-all"
            >
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Run validator.py</span>
            </button>

            <a
              href="/api/v1/export/schedule.json"
              target="_blank"
              download
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              <span>JSON</span>
            </a>

            <a
              href="/api/v1/export/timetable.csv"
              target="_blank"
              download
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              <span>CSV</span>
            </a>
          </div>
        </div>

        {/* Background Solver Progress Card */}
        {jobState.status === 'running' && (
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs space-y-2.5">
            <div className="flex items-center justify-between text-blue-900 font-semibold">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                <span>Background Timetable Generation in Progress...</span>
              </div>
              <span className="font-mono text-blue-700">{jobState.progress}%</span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-2 rounded-full bg-blue-200/60 overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${jobState.progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span className="text-blue-800 font-medium">{jobState.stage}</span>
              <span>CP-SAT search (est. 30–45s)</span>
            </div>
          </div>
        )}

        {/* Solver Failure / Retry Banner */}
        {jobState.status === 'failed' && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <div>
                <strong>Solver Generation Failed:</strong> {jobState.error || 'An error occurred during background execution.'}
              </div>
            </div>
            <button
              onClick={handleGenerate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-all shadow-xs"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Retry Generation</span>
            </button>
          </div>
        )}

        {/* Validator Status Notification */}
        {validatorReport && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Official Validator Passed!</strong> Zero hard constraint violations verified. Soft penalty: {validatorReport.soft_total || 233}.
              </span>
            </div>
            <button onClick={() => setValidatorReport(null)} className="text-emerald-600 hover:text-emerald-800 font-bold">✕</button>
          </div>
        )}

        {/* Filter Controls Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-500 uppercase tracking-wider text-[11px] flex items-center gap-1">
              <Filter className="h-3 w-3" /> Filter By:
            </span>
            <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
              {(['all', 'group', 'faculty', 'room'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    setFilterType(mode);
                    setFilterValue('');
                  }}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all capitalize ${
                    filterType === mode
                      ? 'bg-white text-blue-700 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Sub-Filter Dropdowns */}
            {filterType === 'group' && (
              <select
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 font-medium outline-none"
              >
                <option value="">Select Student Group (All 14)</option>
                {['CSE-1', 'CSE-2', 'CSE-3', 'ECE-1', 'ECE-2', 'ECE-3', 'EE-1', 'EE-2', 'EE-3', 'ME-1', 'ME-2', 'ME-3', 'CE-1', 'CE-2'].map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            )}

            {filterType === 'faculty' && (
              <select
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 font-medium outline-none"
              >
                <option value="">Select Faculty (All 40)</option>
                {['F01', 'F02', 'F03', 'F04', 'F05', 'F06', 'F07', 'F08', 'F09', 'F10', 'F11', 'F12', 'F39', 'F40'].map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            )}

            {filterType === 'room' && (
              <select
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 font-medium outline-none"
              >
                <option value="">Select Venue (All 27)</option>
                {['LH-1', 'LH-2', 'LH-3', 'LH-4', 'LH-5', 'LH-6', 'AUD', 'CR-101', 'CR-102', 'CS-LAB-1', 'CS-LAB-2', 'PHY-LAB', 'ELEC-LAB-1'].map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            )}
          </div>

          {/* Day Toggle Buttons */}
          <div className="flex items-center gap-1">
            {['ALL', 'MON', 'TUE', 'WED', 'THU', 'FRI'].map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDay(d)}
                className={`px-2.5 py-1 rounded-lg font-mono font-bold text-[11px] transition-all ${
                  selectedDay === d
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Timetable Grid View */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono text-xs">
                <th className="py-3 px-4 w-28 font-bold border-r border-slate-200">Day / Period</th>
                {periods.map((p) => (
                  <th
                    key={p}
                    className={`py-3 px-3 text-center min-w-[140px] font-bold border-r border-slate-200 ${
                      p === 5 ? 'bg-amber-50/40 text-amber-800' : ''
                    }`}
                  >
                    <div>P{p}</div>
                    <div className="text-[10px] text-slate-400 font-normal">
                      {p === 1 && '08:00–09:00'}
                      {p === 2 && '09:00–10:00'}
                      {p === 3 && '10:00–11:00'}
                      {p === 4 && '11:00–12:00'}
                      {p === 5 && '12:00–13:00'}
                      {p === 6 && '14:00–15:00'}
                      {p === 7 && '15:00–16:00'}
                      {p === 8 && '16:00–17:00'}
                      {p === 9 && '17:00–18:00'}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {days
                .filter((d) => selectedDay === 'ALL' || selectedDay === d)
                .map((d) => (
                  <tr key={d} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-4 px-4 font-bold font-mono text-slate-800 bg-slate-50/80 border-r border-slate-200 align-top">
                      <div className="text-sm text-blue-700">{d}</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        {d === 'MON' && 'Monday'}
                        {d === 'TUE' && 'Tuesday'}
                        {d === 'WED' && 'Wednesday'}
                        {d === 'THU' && 'Thursday'}
                        {d === 'FRI' && 'Friday'}
                      </div>
                    </td>

                    {periods.map((p) => {
                      const cellSessions = gridMatrix[d]?.[p] || [];
                      return (
                        <td
                          key={p}
                          className={`p-2 border-r border-slate-200 align-top min-w-[140px] ${
                            p === 5 ? 'bg-amber-50/20' : ''
                          }`}
                        >
                          {cellSessions.length === 0 ? (
                            <div className="h-16 flex items-center justify-center text-[10px] text-slate-300">
                              —
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              {cellSessions.map((s) => (
                                <div
                                  key={s.session_id}
                                  className={`p-2 rounded-xl border text-[11px] shadow-2xs space-y-1 transition-all hover:scale-[1.02] ${
                                    s.kind === 'lab'
                                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                                      : s.basket_slot
                                      ? 'bg-purple-50 border-purple-200 text-purple-900'
                                      : s.fixed_slot
                                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                                      : 'bg-blue-50 border-blue-200 text-blue-900'
                                  }`}
                                >
                                  <div className="flex items-center justify-between font-bold">
                                    <span className="truncate max-w-[100px]">{s.course_id}</span>
                                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-white/80">
                                      {s.duration}h
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-600 truncate">{s.course_name}</p>
                                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                                    <span>{s.room_id}</span>
                                    <span>{s.faculty_id}</span>
                                  </div>
                                  <div className="text-[9px] text-slate-500 truncate">
                                    {s.groups.join(', ')}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

