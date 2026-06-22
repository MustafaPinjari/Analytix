import { X, Check, Info, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { Notification } from '../../../types';
import { cn } from '../../../utils';

interface NotificationsCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

export default function NotificationsCenter({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
}: NotificationsCenterProps) {
  if (!isOpen) return null;

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />;
      default:
        return <Info className="h-5 w-5 text-blue-500 shrink-0" />;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-zinc-950/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 bottom-0 z-50 flex w-full max-w-sm flex-col border-l border-border bg-card text-foreground shadow-2xl transition-transform duration-300 ease-in-out animate-fade-in-up">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-border px-6">
          <div className="flex items-center gap-2">
            <h2 className="text-md font-bold">Notifications</h2>
            {notifications.filter((n) => !n.read).length > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                {notifications.filter((n) => !n.read).length} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {notifications.some((n) => !n.read) && (
              <button
                onClick={onMarkAllRead}
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                title="Mark all as read"
              >
                <Check className="h-3.5 w-3.5" />
                Read all
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
                <Bell className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold">All caught up</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                No alerts or update notifications to show right now.
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => !notification.read && onMarkRead(notification.id)}
                className={cn(
                  'flex gap-3.5 rounded-xl border border-border p-4 transition-all duration-200 text-left',
                  notification.read
                    ? 'bg-card/50 opacity-75'
                    : 'bg-muted/15 border-l-2 border-l-primary hover:bg-muted/30 cursor-pointer'
                )}
              >
                {getNotificationIcon(notification.type)}
                <div className="flex-1 flex flex-col gap-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn("text-xs font-bold leading-tight", !notification.read && "text-foreground")}>
                      {notification.title}
                    </p>
                    <span className="text-[9px] text-muted-foreground shrink-0 mt-0.5">
                      {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-normal">
                    {notification.message}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

// Simple fallback inline svg Bell for empty states to keep build lightweight
function Bell(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}
