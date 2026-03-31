'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Booking {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDateTime: string;
  tableNumber: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  notificationSent: boolean;
  notificationTime?: string;
}

interface NotificationState {
  bookingId: string;
  status: 'pending' | 'sent' | 'confirmed' | 'cancelled';
  sentAt: string;
  response?: 'confirmed' | 'cancelled';
}

export default function BookingNotificationSystem() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<NotificationState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchBookings();
      setupNotificationListener();
    }
  }, [user]);

  const fetchBookings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('event_date_time', { ascending: true });

      if (fetchError) throw fetchError;

      setBookings(data || []);
      checkForUpcomingBookings(data || []);
    } catch (err: any) {
      setError('Failed to fetch bookings: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkForUpcomingBookings = (bookingsList: Booking[]) => {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    bookingsList.forEach((booking) => {
      const eventTime = new Date(booking.eventDateTime);

      // If event is within 1 hour and notification hasn't been sent
      if (eventTime > now && eventTime <= oneHourLater && !booking.notificationSent) {
        sendBookingReminder(booking);
      }
    });
  };

  const sendBookingReminder = async (booking: Booking) => {
    try {
      // Send notification to user
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: user?.id,
          type: 'booking_reminder',
          title: `Reminder: ${booking.eventTitle}`,
          message: `Your event starts in 1 hour! Confirm your attendance for table ${booking.tableNumber}`,
          data: {
            bookingId: booking.id,
            eventId: booking.eventId,
          },
          action_url: `/events/${booking.eventId}`,
        });

      if (notifError) throw notifError;

      // Mark booking as notified
      await supabase
        .from('bookings')
        .update({
          notification_sent: true,
          notification_time: new Date().toISOString(),
        })
        .eq('id', booking.id);

      // Add to local notifications state
      setNotifications((prev) => [
        ...prev,
        {
          bookingId: booking.id,
          status: 'sent',
          sentAt: new Date().toISOString(),
        },
      ]);
    } catch (err: any) {
      console.error('Failed to send booking reminder:', err);
    }
  };

  const confirmAttendance = async (bookingId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', bookingId);

      if (updateError) throw updateError;

      // Update local state
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.bookingId === bookingId
            ? { ...notif, status: 'confirmed', response: 'confirmed' }
            : notif
        )
      );

      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === bookingId ? { ...booking, status: 'confirmed' } : booking
        )
      );

      // Send confirmation notification
      await supabase
        .from('notifications')
        .insert({
          user_id: user?.id,
          type: 'booking_confirmed',
          title: 'Attendance Confirmed',
          message: 'Your attendance has been confirmed. See you at the event!',
        });
    } catch (err: any) {
      setError('Failed to confirm attendance: ' + err.message);
    }
  };

  const cancelAttendance = async (bookingId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (updateError) throw updateError;

      // Update local state
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.bookingId === bookingId
            ? { ...notif, status: 'cancelled', response: 'cancelled' }
            : notif
        )
      );

      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === bookingId ? { ...booking, status: 'cancelled' } : booking
        )
      );

      // Send cancellation notification
      await supabase
        .from('notifications')
        .insert({
          user_id: user?.id,
          type: 'booking_cancelled',
          title: 'Booking Cancelled',
          message: 'Your booking has been cancelled. Your table is now available for other guests.',
        });
    } catch (err: any) {
      setError('Failed to cancel attendance: ' + err.message);
    }
  };

  const setupNotificationListener = () => {
    if (!user) return;

    // Subscribe to realtime notifications
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
          const newNotification = payload.new as any;
          if (newNotification.type === 'booking_reminder') {
            // Handle incoming booking reminder
            console.log('Booking reminder received:', newNotification);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Upcoming Bookings */}
      <div className="bg-secondary border border-border/30 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-text-light mb-6">Your Bookings</h2>

        {bookings.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-text-dark mb-4">No bookings yet</p>
            <p className="text-text-dark text-sm">Book a table at an event to see it here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const eventTime = new Date(booking.eventDateTime);
              const now = new Date();
              const hoursUntil = Math.floor((eventTime.getTime() - now.getTime()) / (1000 * 60 * 60));
              const isUpcoming = hoursUntil > 0 && hoursUntil <= 1;

              const notification = notifications.find((n) => n.bookingId === booking.id);

              return (
                <div
                  key={booking.id}
                  className={`border rounded-lg p-4 ${
                    isUpcoming
                      ? 'border-orange-500/30 bg-orange-500/5'
                      : 'border-border/30 bg-primary'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-text-light mb-1">
                        {booking.eventTitle}
                      </h3>
                      <p className="text-text-dark text-sm mb-2">
                        📅 {eventTime.toLocaleDateString()} at {eventTime.toLocaleTimeString()}
                      </p>
                      <p className="text-text-dark text-sm">
                        🪑 Table {booking.tableNumber}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          booking.status === 'confirmed'
                            ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                            : booking.status === 'cancelled'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                            : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
                        }`}
                      >
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                      {isUpcoming && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-500/10 text-orange-400 border border-orange-500/30">
                          ⏰ In {hoursUntil} hour
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Notification Status */}
                  {notification && (
                    <div className="mb-4 p-3 bg-primary rounded-lg border border-border/30">
                      <p className="text-sm text-text-dark mb-2">
                        <span className="font-semibold">Reminder sent:</span> {new Date(notification.sentAt).toLocaleTimeString()}
                      </p>
                      {notification.response && (
                        <p className="text-sm text-green-400">
                          ✓ You responded: {notification.response}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  {booking.status === 'pending' && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => confirmAttendance(booking.id)}
                        className="flex-1 bg-green-500/10 border border-green-500/30 text-green-400 py-2 rounded-lg hover:bg-green-500/20 transition-colors font-semibold"
                      >
                        ✓ Confirm Attendance
                      </button>
                      <button
                        onClick={() => cancelAttendance(booking.id)}
                        className="flex-1 bg-red-500/10 border border-red-500/30 text-red-400 py-2 rounded-lg hover:bg-red-500/20 transition-colors font-semibold"
                      >
                        ✕ Cancel
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Notification History */}
      {notifications.length > 0 && (
        <div className="bg-secondary border border-border/30 rounded-xl p-6">
          <h3 className="text-lg font-bold text-text-light mb-4">Notification History</h3>
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div key={notif.bookingId} className="flex items-center gap-3 p-3 bg-primary rounded-lg border border-border/30">
                <div className="flex-1">
                  <p className="text-sm text-text-light font-semibold">
                    {notif.status === 'sent' && '📬 Reminder sent'}
                    {notif.status === 'confirmed' && '✓ Attendance confirmed'}
                    {notif.status === 'cancelled' && '✕ Booking cancelled'}
                  </p>
                  <p className="text-xs text-text-dark">
                    {new Date(notif.sentAt).toLocaleString()}
                  </p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded ${
                  notif.status === 'confirmed'
                    ? 'bg-green-500/10 text-green-400'
                    : notif.status === 'cancelled'
                    ? 'bg-red-500/10 text-red-400'
                    : 'bg-yellow-500/10 text-yellow-400'
                }`}>
                  {notif.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-500/5 border border-blue-500/30 rounded-lg p-4">
        <p className="text-sm text-blue-400">
          <span className="font-semibold">ℹ️ How it works:</span> When your event is within 1 hour, you'll receive a reminder notification. You can confirm your attendance or cancel your booking. If you don't respond, your table will be held for 1 hour before being released to other guests.
        </p>
      </div>
    </div>
  );
}
