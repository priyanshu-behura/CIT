import React, { useState } from 'react';
import { Calendar, Shield, ArrowRight, Lock, Mail, CheckCircle2, AlertCircle, ArrowLeft, Sparkles } from 'lucide-react';
import { api, setToken } from '../services/api';
import type { User, DemoAccount } from '../types/dataset';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
  onNavigateLanding: () => void;
  demoAccounts: DemoAccount[];
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onNavigateLanding,
  demoAccounts,
}) => {
  const [email, setEmail] = useState('admin@cit.edu');
  const [password, setPassword] = useState('Admin@123');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.login(email, password);
      setToken(res.access_token);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoClick = (acc: DemoAccount) => {
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
    <div className="min-h-screen bg-[#F5F8FF] text-slate-800 flex flex-col justify-between p-6">
      {/* Top Brand Link */}
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
        <button
          onClick={onNavigateLanding}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Public Overview
        </button>
        <span className="text-xs font-mono text-slate-400">Chilika Institute of Technology</span>
      </div>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto w-full my-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left: Login Card */}
        <div className="md:col-span-6 bg-white p-8 rounded-2xl shadow-elevated border border-slate-200 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-600/30">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Institutional Sign In</h2>
              <p className="text-xs text-slate-500">CIT Campus Scheduling Platform Access</p>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Institutional Email
              </label>
              <div className="relative">
                <Mail className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@cit.edu"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-600/20 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <span>Authenticating with CIT Server...</span>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Deterministic verification</span>
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" /> PBKDF2 Encrypted
            </span>
          </div>
        </div>

        {/* Right: One-Click Demo Role Cards */}
        <div className="md:col-span-6 space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">One-Click Demo Roles</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any role card below to instantly sign in and explore the tailored portal.
            </p>
          </div>

          <div className="space-y-3">
            {demoAccounts.map((acc) => (
              <div
                key={acc.role}
                onClick={() => handleDemoClick(acc)}
                className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-card-hover cursor-pointer transition-all space-y-1.5 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      acc.role === 'admin' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      acc.role === 'coordinator' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      acc.role === 'faculty' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {acc.role.toUpperCase()}
                    </span>
                    <span className="text-xs font-bold text-slate-800">{acc.full_name}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-blue-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    Sign In <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">{acc.description}</p>
                <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400 pt-1">
                  <span>User: {acc.email}</span>
                  <span>Pass: {acc.password}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-6xl mx-auto w-full text-center text-xs text-slate-400">
        Campus Scheduling and Venue Management Platform &middot; Chilika Institute of Technology
      </div>
    </div>
  );
};

