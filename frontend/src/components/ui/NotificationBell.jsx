// Phase 6: Hiển thị thông báo real-time từ Socket.io
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../store/AuthContext';
import { useSocket } from '../../hooks/useSocket';

const SOCKET_EVENTS = ['reservation_ready', 'due_reminder', 'reservation_expired'];

const EVENT_ICON = {
  reservation_ready: '📢',
  due_reminder: '⏰',
  reservation_expired: '❌',
};

export default function NotificationBell() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  const handlers = Object.fromEntries(
    SOCKET_EVENTS.map((event) => [
      event,
      (data) => {
        setNotifications((prev) => [
          { id: Date.now(), event, ...data, readAt: null },
          ...prev.slice(0, 19), // giữ tối đa 20
        ]);
      },
    ]),
  );

  useSocket(token, handlers);

  // Đóng panel khi click ngoài
  useEffect(() => {
    function handler(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unread = notifications.filter((n) => !n.readAt).length;

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date() })));
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => { setOpen((o) => !o); if (!open && unread > 0) markAllRead(); }}
        className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        title="Thông báo"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="font-semibold text-gray-900 text-sm">Thông báo</p>
            {notifications.length > 0 && (
              <button onClick={() => setNotifications([])} className="text-xs text-gray-400 hover:text-gray-600">Xóa tất cả</button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">Không có thông báo mới</div>
          ) : (
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
              {notifications.map((n) => (
                <div key={n.id} className={`px-4 py-3 hover:bg-gray-50 transition-colors ${!n.readAt ? 'bg-blue-50' : ''}`}>
                  <div className="flex gap-3 items-start">
                    <span className="text-lg shrink-0 mt-0.5">{EVENT_ICON[n.event] || '🔔'}</span>
                    <p className="text-sm text-gray-700 leading-relaxed">{n.message}</p>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 ml-8">{new Date(n.id).toLocaleTimeString('vi-VN')}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
