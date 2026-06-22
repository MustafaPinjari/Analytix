import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import NotificationsCenter from './NotificationsCenter';
import { MOCK_NOTIFICATIONS } from '../../../utils/mockData';
import { Notification } from '../../../types';

export default function AppLayout() {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background font-sans">
      {/* Sidebar Panel */}
      <Sidebar />

      {/* Main Container */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header Topbar */}
        <Header
          onToggleNotifications={() => setNotificationsOpen(true)}
          unreadCount={unreadCount}
        />

        {/* Scrollable Work Area */}
        <main className="flex-1 overflow-y-auto px-6 py-6 focus:outline-none">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Notifications Drawer */}
      <NotificationsCenter
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={notifications}
        onMarkRead={handleMarkRead}
        onMarkAllRead={handleMarkAllRead}
      />
    </div>
  );
}
