'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Table {
  id: string;
  number: number;
  capacity: number;
  booked: boolean;
  bookedBy?: string;
  bookingId?: string;
}

interface BookingRequest {
  eventId: string;
  tableId: string;
  guestCount: number;
  specialRequests?: string;
}

export default function TableBookingWidget({ eventId }: { eventId: string }) {
  const { user } = useAuth();
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [guestCount, setGuestCount] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [userBooking, setUserBooking] = useState<any | null>(null);

  useEffect(() => {
    fetchVenueLayout();
    checkUserBooking();
  }, [eventId, user]);

  const fetchVenueLayout = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('venue_layouts')
        .select('layout_data')
        .eq('event_id', eventId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      if (data?.layout_data?.tables) {
        setTables(data.layout_data.tables);
      } else {
        // Create default tables if no layout exists
        const defaultTables: Table[] = Array.from({ length: 10 }, (_, i) => ({
          id: `table_${i + 1}`,
          number: i + 1,
          capacity: 4 + (i % 3),
          booked: false,
        }));
        setTables(defaultTables);
      }
    } catch (err: any) {
      setError('Failed to load venue layout: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkUserBooking = async () => {
    if (!user) return;

    try {
      const { data, error: checkError } = await supabase
        .from('bookings')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;

      if (data) {
        setUserBooking(data);
        setSelectedTable(data.table_id);
        setGuestCount(data.guest_count);
        setSpecialRequests(data.special_requests || '');
      }
    } catch (err: any) {
      console.error('Error checking user booking:', err);
    }
  };

  const bookTable = async () => {
    if (!user || !selectedTable) return;

    const selectedTableData = tables.find((t) => t.id === selectedTable);
    if (!selectedTableData) return;

    if (guestCount > selectedTableData.capacity) {
      setError(`Table ${selectedTableData.number} only has capacity for ${selectedTableData.capacity} people`);
      return;
    }

    setBookingLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (userBooking) {
        // Update existing booking
        const { error: updateError } = await supabase
          .from('bookings')
          .update({
            table_id: selectedTable,
            guest_count: guestCount,
            special_requests: specialRequests,
          })
          .eq('id', userBooking.id);

        if (updateError) throw updateError;
      } else {
        // Create new booking
        const { error: insertError } = await supabase
          .from('bookings')
          .insert({
            event_id: eventId,
            user_id: user.id,
            table_id: selectedTable,
            guest_count: guestCount,
            special_requests: specialRequests,
            status: 'confirmed',
          });

        if (insertError) throw insertError;
      }

      setSuccess(true);
      checkUserBooking();

      // Send confirmation notification
      await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: 'booking_confirmed',
          title: 'Table Booked!',
          message: `You've booked table ${selectedTableData.number} for ${guestCount} guests`,
          action_url: `/events/${eventId}`,
        });

      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError('Failed to book table: ' + err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  const cancelBooking = async () => {
    if (!userBooking) return;

    setBookingLoading(true);
    try {
      const { error: deleteError } = await supabase
        .from('bookings')
        .delete()
        .eq('id', userBooking.id);

      if (deleteError) throw deleteError;

      setUserBooking(null);
      setSelectedTable(null);
      setGuestCount(1);
      setSpecialRequests('');
      setSuccess(true);

      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError('Failed to cancel booking: ' + err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="bg-secondary border border-border/30 rounded-xl p-6 space-y-6">
      <h2 className="text-2xl font-bold text-text-light">Reserve Your Table</h2>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
          ✓ {userBooking ? 'Booking updated' : 'Table booked'} successfully!
        </div>
      )}

      {/* Current Booking Status */}
      {userBooking && (
        <div className="bg-primary rounded-lg p-4 border border-green-500/30">
          <p className="text-text-light font-semibold mb-2">✓ Your Current Booking</p>
          <p className="text-text-dark text-sm mb-3">
            Table {userBooking.table_number} for {userBooking.guest_count} guests
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedTable(userBooking.table_id)}
              className="flex-1 text-sm bg-accent/10 border border-accent/30 text-accent py-2 rounded hover:bg-accent/20 transition-colors"
            >
              Modify Booking
            </button>
            <button
              onClick={cancelBooking}
              disabled={bookingLoading}
              className="flex-1 text-sm bg-red-500/10 border border-red-500/30 text-red-400 py-2 rounded hover:bg-red-500/20 transition-colors disabled:opacity-50"
            >
              Cancel Booking
            </button>
          </div>
        </div>
      )}

      {/* Table Selection */}
      <div>
        <h3 className="text-lg font-bold text-text-light mb-4">Available Tables</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {tables.map((table) => (
            <button
              key={table.id}
              onClick={() => !table.booked && setSelectedTable(table.id)}
              disabled={table.booked && table.id !== selectedTable}
              className={`p-4 rounded-lg border-2 transition-all text-center ${
                selectedTable === table.id
                  ? 'border-accent bg-accent/10'
                  : table.booked
                  ? 'border-red-500/30 bg-red-500/5 opacity-50 cursor-not-allowed'
                  : 'border-border/30 hover:border-accent/50 cursor-pointer'
              }`}
            >
              <p className="font-bold text-text-light">Table {table.number}</p>
              <p className="text-xs text-text-dark mt-1">{table.capacity} seats</p>
              {table.booked && <p className="text-xs text-red-400 mt-1">Booked</p>}
            </button>
          ))}
        </div>
      </div>

      {/* Guest Count & Special Requests */}
      {selectedTable && !tables.find((t) => t.id === selectedTable)?.booked && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-text-light mb-2">
              Number of Guests
            </label>
            <div className="flex items-center gap-4 bg-primary rounded-lg p-3">
              <button
                onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                className="w-8 h-8 flex items-center justify-center hover:bg-accent/20 rounded transition-colors"
              >
                −
              </button>
              <span className="text-lg font-bold text-text-light w-8 text-center">{guestCount}</span>
              <button
                onClick={() => {
                  const selectedTableData = tables.find((t) => t.id === selectedTable);
                  if (selectedTableData && guestCount < selectedTableData.capacity) {
                    setGuestCount(guestCount + 1);
                  }
                }}
                className="w-8 h-8 flex items-center justify-center hover:bg-accent/20 rounded transition-colors"
              >
                +
              </button>
            </div>
            <p className="text-xs text-text-dark mt-2">
              Max capacity: {tables.find((t) => t.id === selectedTable)?.capacity} guests
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-light mb-2">
              Special Requests (Optional)
            </label>
            <textarea
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              placeholder="e.g., Birthday celebration, dietary restrictions, seating preferences..."
              className="w-full bg-primary border border-border/30 rounded-lg px-4 py-2 text-text-light placeholder-text-dark focus:outline-none focus:border-accent h-20"
            />
          </div>

          <button
            onClick={bookTable}
            disabled={bookingLoading}
            className="w-full bg-accent hover:bg-accent/90 disabled:bg-accent/50 text-primary font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {bookingLoading ? (
              <>
                <span className="animate-spin">⏳</span>
                Booking...
              </>
            ) : (
              <>
                <span>🪑</span>
                {userBooking ? 'Update Booking' : 'Book Table'}
              </>
            )}
          </button>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-500/5 border border-blue-500/30 rounded-lg p-4">
        <p className="text-sm text-blue-400">
          <span className="font-semibold">ℹ️ Booking Info:</span> Reserve a table to secure your spot at the event. You'll receive a reminder 1 hour before the event starts. If you don't confirm your attendance, your table may be released to other guests.
        </p>
      </div>
    </div>
  );
}
