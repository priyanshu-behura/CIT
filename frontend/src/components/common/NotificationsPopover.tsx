import React from 'react';
import { Bell, CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react';
import type { NotificationItem } from '../../types/dataset';

interface NotificationsPopoverProps {
  notifications: NotificationItem[];
  isOpen: boolean;
  onClose: () => void;
  onMarkRead: (id: number) => void;
}

export const NotificationsPopover: React.FC<NotificationsPopoverProps> = ({
  notifications,
  isOpen,
  onClose,
  onMarkRead,
}) => {
  if (!isOpen) return null;

  const iconForType = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-rose-600 shrink-0" />;
      default:
        return <Info className="h-4 w-4 text-blue-600 shrink-0" />;
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-elevated border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-blue-600" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">System Notifications</h4>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
            {notifications.length} recent
          </span>
        </div>

        <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No new alerts or notifications.
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => onMarkRead(item.id)}
                className={`p-3.5 flex items-start gap-3 hover:bg-slate-50 transition-colors cursor-pointer ${
                  item.is_read ? 'opacity-60' : 'bg-blue-50/20'
                }`}
              >
                <div className="mt-0.5">{iconForType(item.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-semibold text-slate-900 truncate">{item.title}</p>
                    <span className="text-[9px] text-slate-400 font-mono shrink-0">
                      {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{item.message}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-2 bg-slate-50 border-t border-slate-100 text-center">
          <button
            onClick={onClose}
            className="text-[11px] font-medium text-blue-600 hover:text-blue-700"
          >
            Close notification drawer
          </button>
        </div>
      </div>
    </>
  );
};

