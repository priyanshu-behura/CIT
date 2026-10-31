import React, { useState, useEffect } from 'react';
import {
  Calendar,
  LayoutDashboard,
  CalendarDays,
  FileCheck2,
  DoorClosed,
  Sparkles,
  AlertTriangle,
  BarChart3,
  MessageSquare,
  FileText,
  Settings,
  LogOut,
  Bell,
  Search,
  Menu,
  X,
  ChevronRight,
  Shield,
  ExternalLink,
  User as UserIcon,
  CheckCircle2
} from 'lucide-react';
import type { User, NotificationItem } from '../../types/dataset';
import { api } from '../../services/api';
import { GlobalSearch } from '../common/GlobalSearch';
import { NotificationsPopover } from '../common/NotificationsPopover';

interface AppLayoutProps {
  user: User | null;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  user,
  currentPage,
  onNavigate,
  onLogout,
  children,
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    const loadNotifs = async () => {
      try {
        const notifs = await api.getNotifications(user?.role);
        setNotifications(notifs);
      } catch {
        // ignore
      }
    };
    loadNotifs();
    const interval = setInterval(loadNotifs, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkNotificationRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
    } catch {
      // ignore
    }
  };

  const navGroups = [
    {
      label: 'Core Dashboard',
      items: [
        { id: 'dashboard', label: 'Overview Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
      ],
    },
    {
      label: 'Academic Scheduling',
      items: [
        { id: 'timetable', label: 'Weekly Timetable', icon: <CalendarDays className="h-4 w-4" /> },
        { id: 'exams', label: 'Midsem Exams', icon: <FileCheck2 className="h-4 w-4" /> },
        { id: 'venues', label: 'Rooms & Venues', icon: <DoorClosed className="h-4 w-4" /> },
      ],
    },
    {
      label: 'Campus Operations',
      items: [
        { id: 'bookings', label: 'Booking Requests', icon: <Sparkles className="h-4 w-4" /> },
        { id: 'spectra', label: "Spectra '27 Fest", icon: <Calendar className="h-4 w-4" /> },
        { id: 'disruptions', label: 'Disruptions & Diff', icon: <AlertTriangle className="h-4 w-4" /> },
      ],
    },
    {
      label: 'AI & Intelligence',
      items: [
        { id: 'assistant', label: 'Booking Assistant', icon: <Sparkles className="h-4 w-4 text-cyan-500" /> },
        { id: 'ai-chat', label: 'Campus AI Chat', icon: <MessageSquare className="h-4 w-4 text-blue-500" /> },
        { id: 'analytics', label: 'Campus Analytics', icon: <BarChart3 className="h-4 w-4 text-emerald-500" /> },
      ],
    },
    {
      label: 'Administration',
      items: [
        { id: 'reports', label: 'Exports & Validator', icon: <FileText className="h-4 w-4" /> },
        { id: 'settings', label: 'System Settings', icon: <Settings className="h-4 w-4" /> },
      ],
    },
  ];

  const roleBadgeStyles: Record<string, string> = {
    admin: 'bg-rose-50 text-rose-700 border-rose-200',
    coordinator: 'bg-blue-50 text-blue-700 border-blue-200',
    faculty: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    club: 'bg-amber-50 text-amber-700 border-amber-200',
  };

  const getPageTitle = (id: string) => {
    switch (id) {
      case 'dashboard': return 'Operational Dashboard';
      case 'timetable': return 'Weekly Academic Timetable (P1–P9)';
      case 'exams': return 'Midsem Examination Schedule';
      case 'venues': return 'Campus Facilities & Venues';
      case 'bookings': return 'Venue Booking & Priority Engine';
      case 'spectra': return "Spectra Week '27 Management";
      case 'disruptions': return 'Disruption & Minimal Rescheduling';
      case 'assistant': return 'Natural Language Booking Assistant';
      case 'ai-chat': return 'Campus Knowledge Assistant';
      case 'analytics': return 'Campus Utilization & Workload';
      case 'reports': return 'Official Validator & JSON Exports';
      case 'settings': return 'System Settings & Demo State';
      default: return 'CIT Campus Scheduling';
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen bg-[#F5F8FF] text-slate-800 flex flex-col font-sans">
      <GlobalSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={onNavigate}
      />

      {/* Main Container */}
      <div className="flex-1 flex w-full">
        {/* Mobile Sidebar Overlay */}
        {isMobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out shrink-0 ${
            isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          {/* Brand Header */}
          <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNavigate('dashboard')}>
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-700 to-cyan-500 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm tracking-tight text-slate-900">CIT Campus Scheduling</span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Chilika Inst. of Tech.</p>
              </div>
            </div>
            <button onClick={() => setIsMobileOpen(false)} className="lg:hidden p-1 rounded-lg text-slate-400 hover:bg-slate-100">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User Role Card */}
          <div className="p-3.5 m-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Role</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${roleBadgeStyles[user?.role || 'admin']}`}>
                {user?.role?.toUpperCase()}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-800 mt-1.5 truncate">{user?.full_name || 'Dean / Administrator'}</p>
            <p className="text-[11px] text-slate-500 truncate">{user?.department ? `${user.department} Department` : 'Academic Administration'}</p>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
            {navGroups.map((group) => (
              <div key={group.label} className="space-y-1">
                <p className="px-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{group.label}</p>
                {group.items.map((item) => {
                  const isActive = currentPage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        setIsMobileOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30 font-bold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      {isActive && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Footer Actions */}
          <div className="p-3 border-t border-slate-100 space-y-1 bg-slate-50/50">
            <button
              onClick={() => onNavigate('landing')}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-white hover:text-blue-600 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
              <span>Public Landing Page</span>
            </button>
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out Session</span>
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Topbar */}
          <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileOpen(true)}
                className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span>CIT Campus</span>
                  <ChevronRight className="h-3 w-3" />
                  <span className="text-slate-600 font-medium capitalize">{currentPage}</span>
                </div>
                <h1 className="text-sm md:text-base font-bold text-slate-900 leading-tight">
                  {getPageTitle(currentPage)}
                </h1>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2.5">
              {/* Command Palette Trigger */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-xs text-slate-500 font-medium transition-colors border border-slate-200"
              >
                <Search className="h-3.5 w-3.5 text-slate-400" />
                <span>Search pages & venues...</span>
                <kbd className="px-1.5 py-0.2 rounded bg-white text-[10px] font-mono border border-slate-200 shadow-2xs">Ctrl K</kbd>
              </button>

              {/* Notifications Button */}
              <div className="relative">
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 relative transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                  )}
                </button>
                <NotificationsPopover
                  notifications={notifications}
                  isOpen={isNotificationsOpen}
                  onClose={() => setIsNotificationsOpen(false)}
                  onMarkRead={handleMarkNotificationRead}
                />
              </div>

              {/* Profile Avatar Pill */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                  {user?.full_name?.charAt(0) || 'A'}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-slate-800 leading-none truncate max-w-[120px]">{user?.full_name?.split(' ')[0] || 'User'}</p>
                  <span className="text-[10px] text-slate-400 uppercase font-mono">{user?.role || 'admin'}</span>
                </div>
              </div>
            </div>
          </header>

          {/* Main Body */}
          <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
            {children}
          </main>

          {/* App Footer */}
          <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>Campus Scheduling & Venue Management Platform &middot; Chilika Institute of Technology (cit-public-v1)</span>
            <div className="flex items-center gap-4 text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <CheckCircle2 className="h-3 w-3" /> OR-Tools CP-SAT Solver Online
              </span>
              <span>189 Sessions Verified</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

