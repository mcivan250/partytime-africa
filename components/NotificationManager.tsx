'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Notification {
  id: string;
  type: 'booking_reminder' | 'payment_confirmation' | 'event_update' | 'promotion' | 'system';
  title: string;
  message: string;
  read: boolean;
  action_url?: string;
  created_at: string;
  data?: Record<string, any>;
}

export default function NotificationManager() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      setupRealtimeListener();
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount((data || []).filter((n) => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeListener = () => {
    if (!user) return;

    const subscription = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications((prev) => [newNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);

          // Show browser notification
          if (Notification.permission === 'granted') {
            new Notification(newNotification.title, {
              body: newNotification.message,
              icon: '/logo.png',
            });
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user?.id)
        .eq('read', false);

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking_reminder':
        return '🕐';
      case 'payment_confirmation':
        return '✓';
      case 'event_update':
        return '📢';
      case 'promotion':
        return '🎉';
      case 'system':
        return 'ℹ️';
      default:
        return '📬';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'booking_reminder':
        return 'border-orange-500/30 bg-orange-500/5';
      case 'payment_confirmation':
        return 'border-green-500/30 bg-green-500/5';
      case 'event_update':
        return 'border-blue-500/30 bg-blue-500/5';
      case 'promotion':
        return 'border-purple-500/30 bg-purple-500/5';
      case 'system':
        return 'border-yellow-500/30 bg-yellow-500/5';
      default:
        return 'border-border/30 bg-primary';
    }
  };

  return (
    <>
      {/* Notification Bell Icon */}
      <div className="relative">
        <button
          onClick={() => setShowPanel(!showPanel)}
          className="relative p-2 hover:bg-secondary rounded-lg transition-colors"
        >
          <span className="text-2xl">🔔</span>
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Notification Panel */}
        {showPanel && (
          <div className="absolute right-0 top-12 w-96 bg-secondary border border-border/30 rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-secondary border-b border-border/30 p-4 flex items-center justify-between">
              <h3 className="font-bold text-text-light">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-accent hover:underline"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* Notifications List */}
            {loading ? (
              <div className="p-4 text-center text-text-dark">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-text-dark">
                <p className="text-2xl mb-2">📭</p>
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-l-4 ${getNotificationColor(notification.type)} ${
                      !notification.read ? 'bg-accent/5' : ''
                    } hover:bg-primary/50 transition-colors`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start gap-3 flex-1">
                        <span className="text-xl mt-1">{getNotificationIcon(notification.type)}</span>
                        <div className="flex-1">
                          <p className="font-semibold text-text-light">{notification.title}</p>
                          <p className="text-sm text-text-dark mt-1">{notification.message}</p>
                          <p className="text-xs text-text-dark/50 mt-2">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-accent rounded-full mt-2 ml-2"></div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-3">
                      {notification.action_url && (
                        <a
                          href={notification.action_url}
                          className="text-xs bg-accent/10 border border-accent/30 text-accent px-3 py-1 rounded hover:bg-accent/20 transition-colors"
                        >
                          View
                        </a>
                      )}
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-xs bg-primary border border-border/30 text-text-light px-3 py-1 rounded hover:border-accent/50 transition-colors"
                        >
                          Mark as read
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="text-xs bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-1 rounded hover:bg-red-500/20 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="border-t border-border/30 p-4 text-center">
                <a href="/notifications" className="text-sm text-accent hover:underline">
                  View all notifications →
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Request notification permission */}
      {typeof window !== 'undefined' && Notification.permission === 'default' && (
        <button
          onClick={() => Notification.requestPermission()}
          className="text-xs text-accent hover:underline"
        >
          Enable notifications
        </button>
      )}
    </>
  );
}
