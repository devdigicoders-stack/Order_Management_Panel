import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, Package, Truck, Info, Check, RefreshCw, Loader2 } from 'lucide-react';
import api from '../services/api';
import clsx from 'clsx';

export const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadNotifs = async () => {
    setLoading(true);
    try {
      const data = await api.getNotifications();
      setNotifications(data?.notifications || []);
    } catch (err) {
      console.warn('Failed to load notifications:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifs();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await api.markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => (n.id === id || n._id === id ? { ...n, read: true } : n)));
    } catch (e) {
      console.warn('Mark read error:', e.message);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) {
      console.warn('Mark all read error:', e.message);
    }
  };

  const getIcon = (message) => {
    const m = (message || '').toLowerCase();
    if (m.includes('approved')) return <CheckCircle className="w-5 h-5 text-emerald-500" />;
    if (m.includes('container') || m.includes('arrived')) return <Truck className="w-5 h-5 text-indigo-500" />;
    if (m.includes('distributed') || m.includes('order')) return <Package className="w-5 h-5 text-amber-500" />;
    return <Info className="w-5 h-5 text-blue-500" />;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 mb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-indigo-600 to-indigo-800 p-6 rounded-2xl shadow-md text-white">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">Notifications</h1>
            {loading && <Loader2 className="w-4 h-4 animate-spin text-indigo-200" />}
          </div>
          <p className="text-indigo-100 text-sm mt-1 opacity-90">
            Real-time updates on orders, new product approvals, and shipping container arrivals.
          </p>
        </div>

        <div className="flex gap-2">
          <button onClick={loadNotifs} className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {notifications.some(n => !n.read) && (
            <button 
              onClick={handleMarkAllRead}
              className="bg-white text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-indigo-50 shadow-sm"
            >
              Mark all as read
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <Bell className="w-12 h-12 text-gray-300 mb-3" />
            <h3 className="text-sm font-bold text-gray-900">No notifications yet</h3>
            <p className="text-xs text-gray-400 mt-1">You are all caught up! Important system events will notify you here.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <li 
                key={notification.id || notification._id} 
                className={clsx(
                  "p-4 hover:bg-gray-50 transition-colors flex items-start space-x-3.5",
                  !notification.read ? "bg-indigo-50/30" : "bg-white"
                )}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getIcon(notification.message)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-900">{notification.title}</p>
                  <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{notification.message}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{new Date(notification.created_at || Date.now()).toLocaleDateString()}</p>
                </div>
                {!notification.read && (
                  <button 
                    onClick={() => handleMarkRead(notification.id || notification._id)}
                    className="text-indigo-600 hover:text-indigo-800 p-1.5 hover:bg-indigo-100 rounded-full"
                    title="Mark as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
