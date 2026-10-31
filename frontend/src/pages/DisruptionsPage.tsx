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
  RotateCcw,
  Upload,
  FileCode
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

  // File Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setUploadError('Invalid file type: Please upload a JSON file (.json).');
      return;
    }

    if (file.size > 1024 * 1024) {
      setUploadError(`File too large: ${file.name} is ${(file.size / 1024).toFixed(1)} KB (Maximum 1 MB allowed).`);
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const res = await api.uploadDisruptionFile(file);
      setUploadSuccess(`Uploaded & Validated scenario '${res.disruption.id}': Ready for simulation.`);
      // Reload disruptions list and select newly uploaded scenario
      const list = await api.getDisruptions();
      setDisruptions(list);
      const match = list.find((d) => d.id === res.disruption.id) || list[0];
      setSelectedDisruption(match);
      setSimulationResult(null);
      setCommitStatus(null);
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to parse and validate disruption scenario file.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
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

      {/* Upload Feedback Banners */}
      {uploadError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{uploadError}</span>
          </div>
          <button onClick={() => setUploadError(null)} className="text-slate-400 hover:text-slate-600 font-semibold text-xs">Dismiss</button>
        </div>
      )}

      {uploadSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{uploadSuccess}</span>
          </div>
          <button onClick={() => setUploadSuccess(null)} className="text-slate-400 hover:text-slate-600 font-semibold text-xs">Dismiss</button>
        </div>
      )}

      {/* Upload Disruption Scenario Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-blue-600" />
            <CardTitle>Upload Disruption Scenario (.json)</CardTitle>
          </div>
          <CardDescription>
            Upload a custom scenario JSON (e.g., sample_disruption.json) to simulate minimal-movement rescheduling before administrative approval.
          </CardDescription>
        </CardHeader>
        <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 hover:bg-blue-50/20 hover:border-blue-400 transition-colors flex flex-col items-center justify-center text-center gap-2">
          <FileCode className="h-8 w-8 text-slate-400" />
          <div>
            <label className="cursor-pointer text-xs font-bold text-blue-600 hover:text-blue-700 underline underline-offset-2">
              <span>{isUploading ? 'Validating Scenario...' : 'Select JSON Disruption File'}</span>
              <input
                type="file"
                accept=".json,application/json"
                className="hidden"
                disabled={isUploading}
                onChange={handleFileUpload}
              />
            </label>
            <span className="text-slate-500 text-xs"> or drag and drop here</span>
          </div>
          <p className="text-[10px] text-slate-400">
            Accepts official competition format: faculty leaves, room closures, or added curriculum sessions (Max 1 MB)
          </p>
        </div>
      </Card>

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

      {/* Infeasible Simulation Diagnostic Alert */}
      {simulationResult && simulationResult.status === 'infeasible' && (
        <div className="p-6 rounded-2xl bg-amber-50/80 border border-amber-300 shadow-sm space-y-4 animate-in fade-in duration-200">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-100 border border-amber-200 text-amber-800 shrink-0 mt-0.5">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-amber-950">Disruption Rescheduling Infeasible</h3>
                <Badge variant="warning">No Feasible Solution</Badge>
              </div>
              <p className="text-xs text-amber-900 font-medium">
                {simulationResult.primary_explanation || simulationResult.error}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-3.5 rounded-xl bg-white/80 border border-amber-200 text-xs space-y-2">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] block">
                Dominant Blocking Constraints
              </span>
              <div className="flex flex-wrap gap-1.5">
                {simulationResult.dominant_blocking_constraints?.map((c: string) => (
                  <span key={c} className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-mono text-[11px] font-semibold">
                    {c.replace(/_/g, ' ')}
                  </span>
                )) || <span className="text-slate-400">None detected</span>}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/80 border border-amber-200 text-xs space-y-2">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] block">
                Safeguards & Active Schedule Status
              </span>
              <p className="text-[11px] text-slate-600">
                <span className="font-bold text-emerald-700">&#10003; Baseline schedule untouched:</span> No partial changes committed to active timetable or disk exports.
              </p>
            </div>
          </div>

          {simulationResult.candidate_elimination_counts && (
            <div className="p-3.5 rounded-xl bg-white/80 border border-amber-200 text-xs space-y-2">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] block">
                Deterministic Constraint-Elimination Breakdown (Evaluated Candidate Slots)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-[11px] font-mono">
                {Object.entries(simulationResult.candidate_elimination_counts).map(([k, v]) => (
                  <div key={k} className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <span className="text-slate-600 truncate pr-1">{k.replace(/_/g, ' ')}</span>
                    <span className="font-bold text-amber-700">{v as number}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Simulation Results & Diff View (Feasible) */}
      {simulationResult && simulationResult.status !== 'infeasible' && (
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

