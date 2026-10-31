import React from 'react';
import {
  Calendar,
  CalendarDays,
  FileCheck2,
  DoorClosed,
  Users,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  MessageSquare,
  Clock,
  Layers,
  ChevronRight,
  Zap,
  Building2,
  GraduationCap
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import type { DatasetSummary } from '../types/dataset';

interface LandingPageProps {
  summary: DatasetSummary | null;
  onNavigateLogin: () => void;
  onNavigateApp: () => void;
  userRole?: string | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  summary,
  onNavigateLogin,
  onNavigateApp,
  userRole,
}) => {
  return (
    <div className="min-h-screen bg-[#F5F8FF] text-slate-800 font-sans selection:bg-blue-100 selection:text-blue-700">
      <Navbar onNavigateLogin={onNavigateLogin} onNavigateApp={onNavigateApp} userRole={userRole} />

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden">
        {/* Soft elegant gradient blur orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-blue-200/40 via-cyan-100/30 to-transparent blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Institution Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-xs font-semibold text-blue-700 font-mono tracking-wide">
                CIT Public Dataset &middot; cit-public-v1
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Smarter Campus Scheduling.{' '}
              <span className="bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 bg-clip-text text-transparent">
                Seamless Venue Management.
              </span>
            </h1>

            {/* Supporting Text */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal max-w-2xl mx-auto">
              One intelligent platform to coordinate academic timetables, examinations, campus venues and institutional events with mathematical precision.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
              <button
                onClick={userRole ? onNavigateApp : onNavigateLogin}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-600/25 transition-all hover:scale-105 active:scale-95"
              >
                <span>{userRole ? 'Launch Dashboard' : 'Explore Platform'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={onNavigateLogin}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm border border-slate-200 shadow-xs transition-all"
              >
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>One-Click Role Demo</span>
              </button>
            </div>
          </div>

          {/* Interactive Timetable & Venue Preview Card */}
          <div className="mt-14 max-w-5xl mx-auto bg-white rounded-2xl shadow-elevated border border-slate-200 overflow-hidden relative">
            <div className="bg-slate-50/80 px-6 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-rose-400" />
                <div className="h-3 w-3 rounded-full bg-amber-400" />
                <div className="h-3 w-3 rounded-full bg-emerald-400" />
                <span className="text-xs font-mono text-slate-400 ml-2">Chilika Institute of Technology &middot; Automated Timetable Grid</span>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                0 Hard Violations Verified
              </span>
            </div>

            <div className="p-6 grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { day: 'Monday', period: 'P1 (08:00)', course: 'MA101 Calculus', room: 'LH-1 (200 Cap)', kind: 'Lecture', color: 'blue' },
                { day: 'Tuesday', period: 'P2 (09:00)', course: 'PH191 Physics Lab', room: 'PHY-LAB (90 Cap)', kind: '3h Lab Block', color: 'amber' },
                { day: 'Wednesday', period: 'P3 (10:00)', course: 'OE301 Basket Elective', room: 'LH-3 (120 Cap)', kind: 'Synchronized', color: 'purple' },
                { day: 'Thursday', period: 'P6 (14:00)', course: 'CS202 Data Structures', room: 'CR-101 (80 Cap)', kind: 'Lecture', color: 'blue' },
                { day: 'Friday', period: 'P10 (18:00)', course: "Spectra '27 Cultural Fest", room: 'AUD (500 Cap)', kind: 'Campus Event', color: 'emerald' },
              ].map((card, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-50/60 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="font-bold text-slate-700">{card.day}</span>
                    <span className="text-slate-400">{card.period}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-900 leading-snug">{card.course}</p>
                  <p className="text-[11px] text-slate-500">{card.room}</p>
                  <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    card.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                    card.color === 'amber' ? 'bg-amber-100 text-amber-800' :
                    card.color === 'purple' ? 'bg-purple-100 text-purple-700' :
                    'bg-emerald-100 text-emerald-800'
                  }`}>
                    {card.kind}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Dataset Backed Statistics Section */}
      <section id="statistics" className="py-12 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-8">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 font-mono">Official CIT Dataset Metrics</h2>
            <p className="text-xl font-bold text-slate-900 mt-1">Ground Truth Figures &middot; Zero Fabricated Statistics</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
              <span className="text-3xl sm:text-4xl font-extrabold text-blue-600 font-mono">
                {summary?.counts.sessions || 189}
              </span>
              <p className="text-xs font-bold text-slate-800">Teaching Sessions</p>
              <p className="text-[11px] text-slate-500">243 teaching hours/week (P1–P9)</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
              <span className="text-3xl sm:text-4xl font-extrabold text-cyan-600 font-mono">
                {summary?.counts.rooms || 27}
              </span>
              <p className="text-xs font-bold text-slate-800">Campus Venues</p>
              <p className="text-[11px] text-slate-500">Auditorium, 6 halls, 10 classrooms, 7 labs</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
              <span className="text-3xl sm:text-4xl font-extrabold text-blue-700 font-mono">
                {summary?.counts.faculty || 40}
              </span>
              <p className="text-xs font-bold text-slate-800">Faculty Members</p>
              <p className="text-[11px] text-slate-500">Across 6 academic departments</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
              <span className="text-3xl sm:text-4xl font-extrabold text-emerald-600 font-mono">
                {summary?.counts.exams || 41}
              </span>
              <p className="text-xs font-bold text-slate-800">Midsem Examinations</p>
              <p className="text-[11px] text-slate-500">Mon–Sat AM/PM with half-capacity rule</p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem & Solution Section */}
      <section id="problem-solution" className="py-20 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 font-mono">Institutional Challenges Solved</h2>
          <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">Solving Campus Scheduling Chaos</h3>
          <p className="text-sm text-slate-600">Manual timetable planning and decentralized venue bookings lead to clashes, under-utilized halls, and exam disruption. The CIT Scheduling Platform solves each challenge mathematically.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: 'Timetable Clashes',
              prob: 'Faculty overlapping across parallel branches and cohorts assigned to concurrent lectures.',
              sol: 'OR-Tools CP-SAT formulation guarantees zero faculty, student cohort, or room double-booking.',
              icon: <CalendarDays className="h-5 w-5 text-blue-600" />
            },
            {
              title: 'Room Capacity Violations',
              prob: 'Large cohorts crammed into small seminar rooms without accessibility or required lab gear.',
              sol: 'Strict capacity checks, room type validation, and mandatory wheelchair accessibility compliance.',
              icon: <DoorClosed className="h-5 w-5 text-cyan-600" />
            },
            {
              title: 'Examination Logistics',
              prob: 'Room overcrowding during midsems leading to academic integrity risks and group clashes.',
              sol: 'Half-capacity enforcement (floor(C/2)) and balanced slotting across AM/PM periods without clashes.',
              icon: <FileCheck2 className="h-5 w-5 text-emerald-600" />
            },
            {
              title: 'Event Booking Conflicts',
              prob: 'Clubs and guest lectures competing for the Auditorium without clear priority rules.',
              sol: 'Official priority ranking (Exam > Regular Class > Institute > Guest > Dept > Club) with self-approval prevention.',
              icon: <Sparkles className="h-5 w-5 text-amber-600" />
            },
            {
              title: 'Last-Minute Disruptions',
              prob: 'Faculty sudden leave or pipe leak closures cause cascading chaos across the semester.',
              sol: 'Minimal-movement rescheduling algorithm that identifies affected sessions and solves alternative slots with minimum displacement.',
              icon: <AlertTriangle className="h-5 w-5 text-rose-600" />
            },
            {
              title: 'Natural Language Booking',
              prob: 'Non-technical faculty and students struggle with complex database booking forms.',
              sol: 'English & Hinglish assistant automatically extracts event parameters into reviewable drafts.',
              icon: <MessageSquare className="h-5 w-5 text-purple-600" />
            },
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 w-fit">{item.icon}</div>
              <h4 className="text-base font-bold text-slate-900">{item.title}</h4>
              <p className="text-xs text-rose-700 bg-rose-50/60 p-2.5 rounded-lg border border-rose-100">
                <span className="font-semibold">Challenge:</span> {item.prob}
              </p>
              <p className="text-xs text-emerald-800 bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100">
                <span className="font-semibold">CIT Platform Solution:</span> {item.sol}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 8 Core Features Grid */}
      <section id="features" className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 font-mono">Platform Capabilities</h2>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">Enterprise Scheduling Built for Higher Education</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Intelligent Timetable Generation', desc: 'Schedules 189 teaching sessions adhering to all 14 hard constraints in seconds.', icon: <CalendarDays className="h-5 w-5 text-blue-600" /> },
              { title: 'Examination Scheduling', desc: 'Coordinates 41 midsem exams with effective room capacity halved for integrity.', icon: <FileCheck2 className="h-5 w-5 text-emerald-600" /> },
              { title: 'Smart Venue Booking', desc: 'Process booking requests with conflict pre-checking and alternative venue recommendations.', icon: <Building2 className="h-5 w-5 text-cyan-600" /> },
              { title: 'Hinglish AI Booking Assistant', desc: 'Natural language parsing for prompts in English and Hinglish into verified booking records.', icon: <Sparkles className="h-5 w-5 text-amber-600" /> },
              { title: 'Deterministic Validator', desc: 'Evaluates every generated schedule against the official CIT validator.py for zero violations.', icon: <ShieldCheck className="h-5 w-5 text-blue-700" /> },
              { title: 'Disruption Management', desc: 'Simulates minimum displacement when faculty take leave or rooms undergo emergency maintenance.', icon: <AlertTriangle className="h-5 w-5 text-rose-600" /> },
              { title: 'Role-Based Dashboards', desc: 'Tailored portals for Dean/Admin, Department Coordinator, Faculty, and Student Clubs.', icon: <Users className="h-5 w-5 text-purple-600" /> },
              { title: 'Campus Analytics', desc: 'Real room utilization percentages, faculty teaching load charts, and booking status metrics.', icon: <BarChart3 className="h-5 w-5 text-cyan-700" /> },
            ].map((f, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:shadow-sm transition-all space-y-2">
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 w-fit">{f.icon}</div>
                <h4 className="text-sm font-bold text-slate-900">{f.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 font-mono">Operational Workflow</h2>
          <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">How the CIT Scheduling Platform Works</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { step: '01', title: 'Load CIT Data', desc: '27 rooms, 40 faculty, 189 sessions loaded dynamically.' },
            { step: '02', title: 'Solve Schedules', desc: 'Google OR-Tools CP-SAT finds optimal conflict-free slots.' },
            { step: '03', title: 'Submit Requests', desc: 'Staff & student clubs request venues manually or via AI.' },
            { step: '04', title: 'Priority Review', desc: 'Official hierarchy applied with self-approval prevention.' },
            { step: '05', title: 'Handle Leaves', desc: 'Disruptions resolved with minimal session movement.' },
            { step: '06', title: 'Official Export', desc: 'schedule.json exported and verified with validator.py.' },
          ].map((s, idx) => (
            <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2 relative">
              <span className="text-xs font-extrabold text-blue-600 font-mono px-2 py-0.5 rounded bg-blue-50 border border-blue-200">
                {s.step}
              </span>
              <h4 className="text-sm font-bold text-slate-900 mt-2">{s.title}</h4>
              <p className="text-[11px] text-slate-500 leading-normal">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* User Roles Showcase */}
      <section id="roles" className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 font-mono">Role-Based Governance</h2>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">Four Tailored Institutional Experiences</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                role: 'Administrator',
                name: 'Dean & Chief Admin',
                badge: 'ADMIN',
                color: 'rose',
                desc: 'Complete institutional authority. Solves timetables, validates with validator.py, manages disruptions, approves high-priority bookings, and exports official JSONs.'
              },
              {
                role: 'Department Coordinator',
                name: 'CSE / ECE / ME Leads',
                badge: 'COORDINATOR',
                color: 'blue',
                desc: 'Department-level schedule oversight. Monitors faculty workload, cohort lecture hours, reviews departmental booking requests, and resolves internal clashes.'
              },
              {
                role: 'Faculty Member',
                name: 'Teaching Faculty',
                badge: 'FACULTY',
                color: 'emerald',
                desc: 'Personal weekly timetable view, today’s classes, classroom locations, daily teaching load monitoring (max 4h/day), and schedule avoidance preferences.'
              },
              {
                role: 'Club Representative',
                name: 'Robotics & Cultural Clubs',
                badge: 'CLUBS',
                color: 'amber',
                desc: 'Submits event booking requests manually or via natural language AI. Tracks approval status, receives alternative venue recommendations. Self-approval strictly forbidden.'
              },
            ].map((r, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  r.color === 'rose' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                  r.color === 'blue' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                  r.color === 'emerald' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {r.badge}
                </span>
                <h4 className="text-base font-bold text-slate-900">{r.role}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Call To Action */}
      <section className="py-20 max-w-5xl mx-auto px-6 text-center space-y-6">
        <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Bring Your Campus Schedule Under Control.
        </h3>
        <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
          Explore the live platform, test the OR-Tools CP-SAT solver, submit a booking with the Hinglish AI assistant, and verify zero constraint violations.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <button
            onClick={onNavigateLogin}
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/25 transition-all hover:scale-105 active:scale-95"
          >
            Access Platform &middot; Sign In
          </button>
        </div>
      </section>

      {/* Public Footer */}
      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Calendar className="h-4 w-4" />
              </div>
              <span className="font-bold text-base text-slate-900">CIT Campus Scheduling</span>
            </div>
            <p className="text-xs text-slate-500 max-w-sm">
              Campus Scheduling, Timetable Optimization and Venue Management Platform built for Chilika Institute of Technology (CIT).
            </p>
            <p className="text-[11px] text-slate-400 font-mono">
              Dataset: cit-public-v1 &middot; Google OR-Tools CP-SAT &middot; React + Vite + FastAPI
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">Platform Modules</p>
            <ul className="text-xs text-slate-500 space-y-1.5">
              <li>Weekly Timetable Engine</li>
              <li>Midsem Examination Manager</li>
              <li>Venue Booking & Priority</li>
              <li>Spectra Week '27 Management</li>
              <li>Disruption Minimum Movement</li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">Institution</p>
            <ul className="text-xs text-slate-500 space-y-1.5">
              <li>Chilika Institute of Technology</li>
              <li>6 Academic Departments</li>
              <li>27 Campus Venues</li>
              <li>40 Teaching Faculty</li>
              <li>Official Validator Integration</li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
          <span>&copy; 2026 Chilika Institute of Technology. All rights reserved.</span>
          <span>CIT Campus Scheduling &middot; Official CIT Hackathon Entry</span>
        </div>
      </footer>
    </div>
  );
};

