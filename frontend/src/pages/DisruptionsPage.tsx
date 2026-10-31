import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Play,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  DoorClosed,
  Users,
  FileCheck2,
  Layers,
  ArrowRightLeft,
  RotateCcw
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { api } from '../services/api';
import type { DisruptionRecord, DisruptionDiff, User } from '../types/dataset';

interface DisruptionsPageProps {
  user: User | null;
}

export const DisruptionsPage: React.FC<DisruptionsPageProps> = ({ user }) => {
  const [disruptions, setDisruptions] = useState<DisruptionRecord[]>([]);
  const [selectedDisruption, setSelectedDisruption] = useState<DisruptionRecord | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any | null>(null);
  const [commitStatus, setCommitStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDisruptions = async () => {
      try {
        const res = await api.getDisruptions();
        setDisruptions(res);
        if (res.length > 0) setSelectedDisruption(res[0]);
      } catch (err) {
        console.error(err);
      }
    };
    loadDisruptions();
  }, []);

  const handleSimulate = async () => {
    if (!selectedDisruption) return;
    setIsSimulating(true);
    setError(null);
    setCommitStatus(null);
    try {
      const res = await api.simulateDisruption(selectedDisruption.id);
      setSimulationResult(res);
    } catch (err: any) {
      setError(err?.message || 'Simulation failed');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedDisruption) return;
    setError(null);
    try {
      const res = await api.approveDisruption(selectedDisruption.id);
      setCommitStatus(`Revised schedule approved & committed! Saved to exports/schedule_after.json.`);
    } catch (err: any) {
      setError(err?.message || 'Approval failed');
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Disruption Management & Rescheduling</h2>
            <Badge variant="warning">Minimum-Movement Optimization</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Simulate faculty sudden leave, room closure repairs, or new curriculum sessions without cascading campus chaos.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
          <span className="font-bold flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-amber-600" />
            Admin Approval Mandatory
          </span>
          <p className="text-[11px] text-amber-700 mt-0.5">
            Simulations remain proposals until an authorized Administrator commits them.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {commitStatus && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{commitStatus}</span>
        </div>
      )}

      {/* Disruption Scenarios Selector */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>Select Disruption Scenario</CardTitle>
            <CardDescription>Official practice disruption from starter pack</CardDescription>
          </div>
          {selectedDisruption && (
            <button
              onClick={handleSimulate}
              disabled={isSimulating}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5" />
              <span>{isSimulating ? 'Running OR-Tools Minimization...' : 'Simulate Rescheduling'}</span>
            </button>
          )}
        </CardHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {disruptions.map((dis) => (
            <div
              key={dis.id}
              onClick={() => setSelectedDisruption(dis)}
              className={`p-4 rounded-xl border text-xs cursor-pointer transition-all space-y-2 ${
                selectedDisruption?.id === dis.id
                  ? 'bg-blue-50/60 border-blue-400 shadow-sm'
                  : 'bg-slate-50 border-slate-200 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-blue-700">{dis.id}</span>
                <Badge variant={dis.status === 'applied' ? 'success' : 'warning'} size="sm">
                  {dis.status}
                </Badge>
              </div>
              <h4 className="font-bold text-slate-900">{dis.title}</h4>
              <p className="text-slate-500 text-[11px] leading-relaxed">{dis.description}</p>
              <div className="pt-2 border-t border-slate-200/60 text-[10px] text-slate-400 font-mono">
                {dis.changes.length} Changes (Faculty Unavailable + Room Maintenance + New Session)
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Simulation Results & Diff View */}
      {simulationResult && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Stability Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200 text-center space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Sessions Moved</span>
              <span className="text-3xl font-extrabold text-blue-600 font-mono">
                {simulationResult.stability?.sessions_moved || simulationResult.session_diffs?.length || 0}
              </span>
              <p className="text-[10px] text-slate-500">Minimal displacement</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 text-center space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Time Changed</span>
              <span className="text-3xl font-extrabold text-amber-600 font-mono">
                {simulationResult.stability?.time_changed || 0}
              </span>
              <p className="text-[10px] text-slate-500">Day or period shift</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 text-center space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Room Only Changed</span>
              <span className="text-3xl font-extrabold text-cyan-600 font-mono">
                {simulationResult.stability?.room_only_changed || 0}
              </span>
              <p className="text-[10px] text-slate-500">Same time, new venue</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 text-center space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Hard Violations</span>
              <span className="text-3xl font-extrabold text-emerald-600 font-mono">
                {simulationResult.hard_violations}
              </span>
              <p className="text-[10px] text-slate-500">Zero constraint breaches</p>
            </div>
          </div>

          {/* Detailed Movements Table */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle>Session Movements (Before vs Proposed Timetable)</CardTitle>
                <CardDescription>Exact relocation manifest with affected cohorts</CardDescription>
              </div>

              {isAdmin ? (
                <button
                  onClick={handleApprove}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Approve & Commit Revised Timetable</span>
                </button>
              ) : (
                <span className="text-xs text-amber-700 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200">
                  Admin authority required to commit
                </span>
              )}
            </CardHeader>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-mono uppercase text-[10px] bg-slate-50">
                    <th className="py-3 px-3">Session</th>
                    <th className="py-3 px-3">Faculty & Cohorts</th>
                    <th className="py-3 px-3">Movement Type</th>
                    <th className="py-3 px-3">Before Timetable</th>
                    <th className="py-3 px-3"></th>
                    <th className="py-3 px-3">Proposed Revised Slot</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {simulationResult.session_diffs?.map((diff: DisruptionDiff) => (
                    <tr key={diff.session_id} className="hover:bg-slate-50">
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-blue-700 block">{diff.session_id}</span>
                        <span className="text-[11px] text-slate-500">{diff.course_id} ({diff.kind})</span>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        <div className="font-medium text-slate-800">{diff.faculty_id}</div>
                        <span className="text-[10px] text-slate-400">{diff.groups.join(', ')}</span>
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          variant={
                            diff.change_type === 'room_only' ? 'cyan' :
                            diff.change_type === 'time_only' ? 'warning' :
                            diff.change_type === 'new_session' ? 'success' : 'purple'
                          }
                          size="sm"
                        >
                          {diff.change_type.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500">
                        {diff.before ? (
                          <span>{diff.before.day} P{diff.before.start_period} &middot; {diff.before.room_id}</span>
                        ) : (
                          <span className="text-slate-400 italic">Unscheduled (New)</span>
                        )}
                      </td>
                      <td className="py-3 px-1 text-slate-400">
                        <ArrowRight className="h-3.5 w-3.5" />
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-700">
                        {diff.after.day} P{diff.after.start_period} &middot; {diff.after.room_id}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

