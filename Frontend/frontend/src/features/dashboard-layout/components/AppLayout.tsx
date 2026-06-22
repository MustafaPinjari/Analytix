import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import NotificationsCenter from './NotificationsCenter';
import { apiClient } from '../../../services/apiClient';
import { Notification } from '../../../types';

export default function AppLayout() {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = async () => {
    try {
      const response = await apiClient.get('/notifications/');
      const results = response.data.results || [];
      const mapped = results.map((n: any) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: 'info' as const, // default type
        read: n.is_read,
        createdAt: n.created_at,
      }));
      setNotifications(mapped);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds for new notifications (micro-optimization for UX)
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkRead = async (id: string) => {
    try {
      await apiClient.post(`/notifications/${id}/read/`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    const promises = unread.map((n) => apiClient.post(`/notifications/${n.id}/read/`));
    try {
      await Promise.all(promises);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('Error marking all notifications read:', err);
    }
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
