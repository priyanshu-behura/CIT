import React from 'react';
import { Calendar, Shield, Sparkles, ArrowRight, UserCheck } from 'lucide-react';

interface NavbarProps {
  onNavigateLogin: () => void;
  onNavigateApp: () => void;
  userRole?: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigateLogin, onNavigateApp, userRole }) => {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-700 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-slate-900">CIT Campus Scheduling</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Chilika Institute of Technology</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
          <a href="#problem-solution" className="hover:text-blue-600 transition-colors">Solutions</a>
          <a href="#how-it-works" className="hover:text-blue-600 transition-colors">How It Works</a>
          <a href="#roles" className="hover:text-blue-600 transition-colors">User Roles</a>
          <a href="#statistics" className="hover:text-blue-600 transition-colors">CIT Dataset</a>
        </nav>

        {/* Action CTAs */}
        <div className="flex items-center gap-3">
          {userRole ? (
            <button
              onClick={onNavigateApp}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all hover:scale-105 active:scale-95"
            >
              <UserCheck className="h-4 w-4" />
              Go to Dashboard
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <>
              <button
                onClick={onNavigateLogin}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-100 transition-all"
              >
                Sign In
              </button>
              <button
                onClick={onNavigateLogin}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm hover:shadow-md transition-all active:scale-95"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Explore Platform
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

