'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

interface Notification {
  id: string;
  type: 'event' | 'friend' | 'message' | 'affiliate';
  title: string;
  description: string;
  icon: string;
  timestamp: string;
  read: boolean;
  link?: string;
  eventId?: string;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      // Demo notifications
      const demoNotifications: Notification[] = [
        {
          id: '1',
          type: 'event',
          title: 'Event Reminder',
          description: 'Skyline Brunch & Beats starts in 2 hours',
          icon: '🎉',
          timestamp: new Date().toISOString(),
          read: false,
          link: '/events/2f8e1c13-e3a1-48af-8b8f-3148b4ee857f',
          eventId: '2f8e1c13-e3a1-48af-8b8f-3148b4ee857f',
        },
        {
          id: '2',
          type: 'affiliate',
          title: 'Affiliate Earnings',
          description: 'You earned 50,000 UGX from ticket sales',
          icon: '💰',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          read: false,
          link: '/wallet',
        },
        {
          id: '3',
          type: 'friend',
          title: 'Friend Request',
          description: 'Sarah M. sent you a friend request',
          icon: '👥',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          read: true,
          link: '/friends',
        },
        {
          id: '4',
          type: 'message',
          title: 'New Message',
          description: 'James K. sent you a message',
          icon: '💬',
          timestamp: new Date(Date.now() - 172800000).toISOString(),
          read: true,
          link: '/messages',
        },
      ];
      setNotifications(demoNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(
      notifications.map((notif) =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const handleNotificationClick = (notif: Notification) => {
    markAsRead(notif.id);
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary text-text-light">
      {/* Header */}
      <div className="bg-secondary border-b border-border/30 p-4 sticky top-16 z-30">
        <h1 className="text-2xl font-bold text-text-light">Notifications</h1>
      </div>

      {/* Notifications List */}
      <div className="divide-y divide-border/20">
        {notifications.length === 0 ? (
          <div className="text-center p-12 text-text-dark">
            <p className="text-4xl mb-4">🔔</p>
            <p>No notifications yet</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-4 hover:bg-secondary/50 transition-colors cursor-pointer border-l-4 ${
                notif.read ? 'border-border/20' : 'border-accent'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl flex-shrink-0">{notif.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={`font-bold ${notif.read ? 'text-text-dark' : 'text-text-light'}`}>
                      {notif.title}
                    </h3>
                    <span className="text-xs text-text-dark ml-2 flex-shrink-0">
                      {formatTime(notif.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-text-dark">{notif.description}</p>
                  {!notif.read && (
                    <div className="mt-2 w-2 h-2 bg-accent rounded-full"></div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom Spacing */}
      <div className="h-8"></div>
    </div>
  );
}
