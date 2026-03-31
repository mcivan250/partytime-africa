'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface Notification {
  id: string;
  type: 'message' | 'event' | 'payment' | 'system';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  actionUrl?: string;
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  // Subscribe to real-time notifications
  useEffect(() => {
    const channel: RealtimeChannel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload: any) => {
          const newNotification: Notification = {
            id: payload.new.id,
            type: payload.new.type,
            title: payload.new.title,
            message: payload.new.message,
            read: payload.new.read,
            created_at: payload.new.created_at,
            actionUrl: payload.new.action_url,
          };
          setNotifications((prev) => [newNotification, ...prev]);
          if (!newNotification.read) {
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const markAsRead = useCallback(async (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, read: true }))
    );
    setUnreadCount(0);

    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('read', false);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId: string) => {
    setNotifications((prev) =>
      prev.filter((notif) => notif.id !== notificationId)
    );

    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return '💬';
      case 'event':
        return '🎉';
      case 'payment':
        return '💳';
      case 'system':
        return 'ℹ️';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'message':
        return 'border-blue-500/30 bg-blue-500/10';
      case 'event':
        return 'border-yellow-500/30 bg-yellow-500/10';
      case 'payment':
        return 'border-green-500/30 bg-green-500/10';
      case 'system':
        return 'border-purple-500/30 bg-purple-500/10';
      default:
        return 'border-border/30 bg-secondary';
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-secondary rounded-lg transition-colors"
      >
        <span className="text-2xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-accent text-primary text-xs font-bold px-2 py-0.5 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-secondary border border-border/30 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-border/30 flex justify-between items-center">
            <h3 className="font-bold text-text-light">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-accent hover:text-accent/80"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-text-dark">
                <p className="text-4xl mb-2">🔔</p>
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border/20">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 hover:bg-primary/50 transition-colors cursor-pointer border-l-4 ${
                      notif.read ? 'opacity-60' : ''
                    } ${getNotificationColor(notif.type)}`}
                    onClick={() => {
                      if (!notif.read) {
                        markAsRead(notif.id);
                      }
                      if (notif.actionUrl) {
                        window.location.href = notif.actionUrl;
                      }
                    }}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex gap-3 flex-1">
                        <span className="text-xl">{getNotificationIcon(notif.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-text-light">{notif.title}</p>
                          <p className="text-sm text-text-dark truncate">{notif.message}</p>
                          <p className="text-xs text-text-dark/50 mt-1">
                            {new Date(notif.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notif.id);
                        }}
                        className="text-text-dark hover:text-text-light"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-border/30 text-center">
              <button className="text-xs text-accent hover:text-accent/80">
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
