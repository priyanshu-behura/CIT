import React, { useState } from 'react';
import {
  ArrowRight,
  Lock,
  Mail,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  Eye,
  EyeOff,
  UserPlus
} from 'lucide-react';
import { StarBorder } from '../components/ui/StarBorder';
import { api, setToken } from '../services/api';
import type { User, DemoAccount } from '../types/dataset';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
  onNavigateLanding: () => void;
  onNavigateRegister?: () => void;
  onNavigateForgotPassword?: () => void;
  demoAccounts?: DemoAccount[];
}

const DEFAULT_DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: 'admin',
    role_label: 'Dean & Administrator',
    email: 'admin@cit.edu',
    password: 'Admin@123',
    full_name: 'Dr. Rajeshwar Jena',
    department: 'ADMIN',
    badge_color: 'rose',
    description: 'Full institutional authority, timetable generation, official approvals & exports.'
  },
  {
    role: 'coordinator',
    role_label: 'Department Coordinator',
    email: 'coordinator.cse@cit.edu',
    password: 'Coord@123',
    full_name: 'Prof. Ananya Patra',
    department: 'CSE',
    badge_color: 'blue',
    description: 'Department timetable view, faculty allocation, student group tracking.'
  },
  {
    role: 'faculty',
    role_label: 'Faculty Member',
    email: 'faculty.sm@cit.edu',
    password: 'Faculty@123',
    full_name: 'Dr. Smruti Mohapatra',
    department: 'CSE',
    badge_color: 'emerald',
    description: 'Personal teaching schedule, classroom assignments, availability preferences.'
  },
  {
    role: 'club',
    role_label: 'Club Representative',
    email: 'club.robotics@cit.edu',
    password: 'Club@123',
    full_name: 'Rohan Das',
    department: 'CLUBS',
    badge_color: 'amber',
    description: 'Spectra week event booking requests, venue status, alternative suggestions.'
  }
];

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onNavigateLanding,
  onNavigateRegister,
  onNavigateForgotPassword,
  demoAccounts,
}) => {
  const activeDemoAccounts = (demoAccounts && demoAccounts.length > 0) ? demoAccounts : DEFAULT_DEMO_ACCOUNTS;
  const [email, setEmail] = useState('admin@cit.edu');
  const [password, setPassword] = useState('Admin@123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLoading) return; // Prevent double submission

    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setError('Please enter your institutional email address.');
      return;
    }
    if (!password) {
      setError('Please enter your account password.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await api.login(normalizedEmail, password);
      setToken(res.access_token);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoClick = (acc: DemoAccount) => {
    if (isLoading) return;
    setEmail(acc.email);
    setPassword(acc.password);
    // Auto-login on demo card click for maximum convenience
    setIsLoading(true);
    setError(null);
    api.login(acc.email, acc.password)
      .then((res) => {
        setToken(res.access_token);
        onLoginSuccess(res.user);
      })
      .catch((err) => {
        setError(err?.message || 'Demo login failed');
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <div className="min-h-screen bg-[#F3ECE2] text-[#1E1915] flex flex-col justify-between p-6 selection:bg-[#A9502B]/20 selection:text-[#1E1915]">
      {/* Top Brand Link */}
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
        <button
          onClick={onNavigateLanding}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#5B5048] hover:text-[#A9502B] transition-colors focus:outline-none"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Public Overview
        </button>
        <div className="inline-flex items-center gap-2">
          <img
            src="/img/cit/cit-logo.png"
            alt="CIT Seal"
            className="h-5 w-5 rounded-full object-cover shrink-0"
          />
          <span className="text-xs font-mono text-[#5B5048] font-medium hidden sm:inline">
            Chilika Institute of Technology
          </span>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto w-full my-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left: Login Card */}
        <div className="md:col-span-6 bg-[#FBF8F3] p-6 sm:p-8 rounded-2xl shadow-elevated border border-[#1E1915]/10 space-y-6">
          <div className="flex items-center gap-3.5">
            <img
              src="/img/cit/cit-logo.png"
              alt="Chilika Institute of Technology"
              className="h-12 w-12 sm:h-14 sm:w-14 rounded-full object-cover shadow-sm border border-[#1E1915]/10 shrink-0"
            />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#A9502B] font-mono">
                Institutional Access
              </span>
              <h2 className="text-xl font-serif font-bold text-[#1E1915] tracking-tight">Institutional Sign In</h2>
              <p className="text-xs text-[#5B5048]">CIT Campus Scheduling Platform Access</p>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700 animate-in fade-in duration-200">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#5B5048] mb-1.5 uppercase tracking-wider font-mono">
                Institutional Email
              </label>
              <div className="relative">
                <Mail className="h-4 w-4 text-[#5B5048]/60 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@cit.edu"
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#1E1915]/15 bg-[#FBF8F3] text-sm text-[#1E1915] focus:outline-none focus:ring-2 focus:ring-[#A9502B]/20 focus:border-[#A9502B] transition-all font-mono placeholder:text-[#5B5048]/50 disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#5B5048] uppercase tracking-wider font-mono">
                  Password
                </label>
                {onNavigateForgotPassword && (
                  <button
                    type="button"
                    onClick={onNavigateForgotPassword}
                    className="text-xs font-medium text-[#A9502B] hover:text-[#8F3F1E] hover:underline transition-colors focus:outline-none"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="h-4 w-4 text-[#5B5048]/60 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#1E1915]/15 bg-[#FBF8F3] text-sm text-[#1E1915] focus:outline-none focus:ring-2 focus:ring-[#A9502B]/20 focus:border-[#A9502B] transition-all placeholder:text-[#5B5048]/50 disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute right-3 top-2.5 p-1 text-[#5B5048]/70 hover:text-[#1E1915] transition-colors focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <StarBorder
              as="button"
              type="submit"
              disabled={isLoading}
              radius={12}
              color="#C8693F"
              trailColor="#A9502B"
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#A9502B] hover:bg-[#8F3F1E] text-[#F3ECE2] text-xs font-semibold shadow-md shadow-[#A9502B]/20 transition-all disabled:opacity-50 tracking-wide uppercase"
            >
              {isLoading ? (
                <span>Authenticating with CIT Server...</span>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </StarBorder>
          </form>

          {/* Create Account / Sign Up CTA */}
          {onNavigateRegister && (
            <div className="pt-4 border-t border-[#1E1915]/10 text-center space-y-2">
              <p className="text-xs text-[#5B5048]">
                New to CIT Campus Scheduling?
              </p>
              <button
                type="button"
                onClick={onNavigateRegister}
                className="w-full py-2.5 px-4 rounded-xl border border-[#A9502B]/30 hover:border-[#A9502B] bg-[#A9502B]/5 hover:bg-[#A9502B]/10 text-xs font-bold text-[#A9502B] transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#A9502B]/20"
              >
                <UserPlus className="h-4 w-4" />
                <span>Create Student Account / Sign Up</span>
              </button>
            </div>
          )}

          <div className="pt-2 border-t border-[#1E1915]/10 flex items-center justify-between text-[11px] text-[#5B5048]">
            <span>Deterministic verification</span>
            <span className="flex items-center gap-1 text-emerald-700 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" /> PBKDF2 Encrypted
            </span>
          </div>
        </div>

        {/* Right: One-Click Demo Role Cards */}
        <div className="md:col-span-6 space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#A9502B]" />
              <h3 className="text-sm font-serif font-bold text-[#1E1915] uppercase tracking-wider">One-Click Demo Roles</h3>
            </div>
            <p className="text-xs text-[#5B5048] mt-0.5">
              Click any role card below to instantly sign in and explore the tailored portal.
            </p>
          </div>

          <div className="space-y-3">
            {activeDemoAccounts.map((acc) => (
              <div
                key={acc.role}
                onClick={() => handleDemoClick(acc)}
                className="p-4 rounded-xl bg-[#FBF8F3] border border-[#1E1915]/10 shadow-sm hover:border-[#A9502B]/40 hover:shadow-card-hover cursor-pointer transition-all space-y-1.5 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      acc.role === 'admin' ? 'bg-[#A9502B]/10 text-[#A9502B] border-[#A9502B]/30' :
                      acc.role === 'coordinator' ? 'bg-[#243C50]/10 text-[#243C50] border-[#243C50]/30' :
                      acc.role === 'faculty' ? 'bg-emerald-950/10 text-emerald-800 border-emerald-300' :
                      'bg-amber-950/10 text-amber-800 border-amber-300'
                    }`}>
                      {acc.role.toUpperCase()}
                    </span>
                    <span className="text-xs font-serif font-bold text-[#1E1915]">{acc.full_name}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-[#A9502B] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    Sign In <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
                <p className="text-[11px] text-[#5B5048] leading-normal">{acc.description}</p>
                <div className="flex items-center gap-3 text-[10px] font-mono text-[#5B5048]/80 pt-1">
                  <span>User: {acc.email}</span>
                  <span>Pass: {acc.password}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-6xl mx-auto w-full text-center text-xs text-[#5B5048]">
        Campus Scheduling and Venue Management Platform &middot; Chilika Institute of Technology
      </div>
    </div>
  );
};
