'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { THEMES } from '../../lib/types';

interface EventDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  date_time: string;
  location_address: string;
  location_lat: number | null;
  location_lng: number | null;
  theme: string;
  image_url: string | null;
  host_id: string;
  max_capacity: number | null;
  is_guest_list_public: boolean;
  is_comments_enabled: boolean;
  rsvp_deadline: string | null;
  created_at: string;
}

interface Guest {
  id: string;
  name: string;
  avatar: string;
}

export default function EventDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [rsvpStatus, setRsvpStatus] = useState<string | null>(null);
  const [goingCount, setGoingCount] = useState(0);
  const [maybeCount, setMaybeCount] = useState(0);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [hostName, setHostName] = useState('');
  const [guests, setGuests] = useState<Guest[]>([]);
  const [selectedTicket, setSelectedTicket] = useState('regular');
  const [quantity, setQuantity] = useState(1);

  const ticketTiers = {
    'early-bird': { name: 'Early Bird', price: 75000, discount: '25% off' },
    'regular': { name: 'Regular', price: 100000, discount: 'Standard' },
    'vip': { name: 'VIP', price: 250000, discount: 'Premium' },
  };

  useEffect(() => {
    if (id) fetchEvent(id as string);
  }, [id, user]);

  const fetchEvent = async (eventId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      setEvent(data);

      // Fetch host name
      if (data?.host_id) {
        const { data: hostData } = await supabase
          .from('users')
          .select('name')
          .eq('id', data.host_id)
          .single();
        if (hostData) setHostName(hostData.name);
      }

      // Fetch RSVP counts
      const { data: rsvps } = await supabase
        .from('rsvps')
        .select('status')
        .eq('event_id', eventId);

      if (rsvps) {
        setGoingCount(rsvps.filter(r => r.status === 'going').length);
        setMaybeCount(rsvps.filter(r => r.status === 'maybe').length);
      }

      // Set demo guests
      const demoGuests: Guest[] = [
        { id: '1', name: 'Sarah', avatar: 'S' },
        { id: '2', name: 'James', avatar: 'J' },
        { id: '3', name: 'Amara', avatar: 'A' },
        { id: '4', name: 'Chris', avatar: 'C' },
        { id: '5', name: 'Diana', avatar: 'D' },
        { id: '6', name: '+1.2k', avatar: '+' },
      ];
      setGuests(demoGuests);

      // Check user's RSVP
      if (user) {
        const { data: userRsvp } = await supabase
          .from('rsvps')
          .select('status')
          .eq('event_id', eventId)
          .eq('user_id', user.id)
          .single();
        if (userRsvp) setRsvpStatus(userRsvp.status);
      }
    } catch (error) {
      console.error('Error fetching event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRSVP = async (status: 'going' | 'maybe' | 'cant_go') => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }
    if (!event) return;

    setRsvpLoading(true);
    try {
      const { error } = await supabase
        .from('rsvps')
        .upsert({
          event_id: event.id,
          user_id: user.id,
          status,
        }, { onConflict: 'event_id,user_id' });

      if (error) throw error;
      setRsvpStatus(status);
      fetchEvent(event.id);
    } catch (error) {
      console.error('Error updating RSVP:', error);
    } finally {
      setRsvpLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      full: date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      relative: getRelativeTime(date),
    };
  };

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return 'Event has passed';
    if (days === 0) return 'Today!';
    if (days === 1) return 'Tomorrow!';
    return `In ${days} days`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center flex-col gap-4">
        <div className="text-5xl">😢</div>
        <h2 className="text-2xl font-bold text-text-light">Event not found</h2>
        <Link href="/events" className="text-accent hover:underline">Browse Events →</Link>
      </div>
    );
  }

  const dateInfo = formatDate(event.date_time);
  const ticketPrice = ticketTiers[selectedTicket as keyof typeof ticketTiers]?.price || 100000;
  const totalPrice = ticketPrice * quantity;

  return (
    <div className="min-h-screen bg-primary text-text-light pb-24">
      {/* Hero Banner */}
      <div className={`bg-gradient-to-br from-accent/30 to-accent/10 h-64 flex items-center justify-center relative`}>
        {event.image_url ? (
          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <div className="text-center">
            <div className="text-6xl mb-4">🎉</div>
            <p className="text-accent font-bold text-lg">{THEMES.find(t => t.id === event.theme)?.name || 'Party'}</p>
          </div>
        )}
        <div className="absolute bottom-4 right-4 bg-accent text-primary px-4 py-2 rounded-full font-bold text-sm">
          {dateInfo.relative}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Title & Host */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-text-light mb-2">{event.title}</h1>
          <p className="text-text-dark">Hosted by <span className="text-accent font-bold">{hostName || 'Unknown'}</span></p>
        </div>

        {/* Guest List */}
        <div className="bg-secondary border border-border/30 rounded-xl p-4 mb-6">
          <h3 className="text-lg font-bold text-text-light mb-4">Guest List</h3>
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {guests.map((guest) => (
              <div
                key={guest.id}
                className="flex-shrink-0 w-16 h-16 rounded-full bg-accent/20 border-2 border-accent flex items-center justify-center text-center"
              >
                <div className="text-2xl font-bold text-accent">{guest.avatar}</div>
              </div>
            ))}
          </div>
          <p className="text-sm text-text-dark mt-4">
            <span className="font-bold text-accent">{goingCount}</span> going • <span className="font-bold text-accent">{maybeCount}</span> interested
          </p>
        </div>

        {/* Photo Album */}
        <div className="bg-secondary border border-border/30 rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-text-light">Photo Album</h3>
            <button className="text-accent text-sm hover:underline">📎 Share album</button>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-square bg-primary rounded-lg border border-border/30 flex items-center justify-center text-text-dark">
                <span className="text-2xl">📷</span>
              </div>
            ))}
          </div>
          <button className="w-full bg-primary border border-border/30 hover:border-accent/50 rounded-lg py-3 text-accent font-semibold transition-colors">
            📸 Add photos
          </button>
        </div>

        {/* Ticket/Money Section */}
        <div className="bg-secondary border border-border/30 rounded-xl p-4 mb-6">
          <h3 className="text-lg font-bold text-text-light mb-4">Get Your Ticket</h3>
          
          {/* Ticket Tiers */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {Object.entries(ticketTiers).map(([key, tier]) => (
              <button
                key={key}
                onClick={() => setSelectedTicket(key)}
                className={`p-3 rounded-lg border-2 transition-all text-center ${
                  selectedTicket === key
                    ? 'border-accent bg-accent/10'
                    : 'border-border/30 hover:border-accent/50'
                }`}
              >
                <p className="font-bold text-sm text-text-light">{tier.name}</p>
                <p className="text-xs text-accent mt-1">{tier.discount}</p>
                <p className="text-lg font-bold text-accent mt-2">{tier.price.toLocaleString()} UGX</p>
              </button>
            ))}
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center gap-4 mb-6">
            <label className="text-text-dark font-semibold">Quantity:</label>
            <div className="flex items-center gap-3 bg-primary rounded-lg p-2">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 flex items-center justify-center hover:bg-accent/20 rounded transition-colors"
              >
                −
              </button>
              <span className="w-8 text-center font-bold">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 flex items-center justify-center hover:bg-accent/20 rounded transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Price Summary */}
          <div className="bg-primary rounded-lg p-4 mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-text-dark">Subtotal:</span>
              <span className="text-text-light font-semibold">{ticketPrice.toLocaleString()} UGX</span>
            </div>
            <div className="flex justify-between mb-4 pb-4 border-b border-border/30">
              <span className="text-text-dark">Quantity:</span>
              <span className="text-text-light font-semibold">×{quantity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-lg font-bold text-accent">Total:</span>
              <span className="text-2xl font-bold text-accent">{totalPrice.toLocaleString()} UGX</span>
            </div>
          </div>

          <button className="w-full bg-accent hover:bg-accent/90 text-primary font-bold py-3 rounded-lg transition-colors">
            💳 Buy Tickets
          </button>
        </div>

        {/* Activity Feed */}
        <div className="bg-secondary border border-border/30 rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-text-light">Activity</h3>
            <button className="text-accent text-sm hover:underline">💬 Comment</button>
          </div>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">C</div>
              <div>
                <p className="font-bold text-text-light">Chris Ivan <span className="text-text-dark font-normal">sent a Text Blast</span></p>
                <p className="text-sm text-text-dark">7/19/25</p>
              </div>
            </div>
          </div>
        </div>

        {/* RSVP Section */}
        <div className="bg-secondary border border-border/30 rounded-xl p-4 mb-6">
          <h3 className="text-lg font-bold text-text-light mb-4 text-center">Are you going?</h3>
          <div className="flex gap-3 justify-center flex-wrap">
            {(['going', 'maybe', 'cant_go'] as const).map((status) => {
              const labels: Record<string, string> = { going: '🎉 Going', maybe: '🤔 Maybe', cant_go: "😔 Can't Go" };
              const isActive = rsvpStatus === status;
              return (
                <button
                  key={status}
                  onClick={() => handleRSVP(status)}
                  disabled={rsvpLoading}
                  className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                    isActive
                      ? 'bg-accent text-primary'
                      : 'bg-primary border border-border/30 text-text-light hover:border-accent/50'
                  }`}
                >
                  {labels[status]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Event Details */}
        <div className="bg-secondary border border-border/30 rounded-xl p-4 mb-6 space-y-4">
          <div className="flex gap-4">
            <span className="text-2xl">📅</span>
            <div>
              <p className="font-bold text-text-light">{dateInfo.full}</p>
              <p className="text-text-dark text-sm">{dateInfo.time}</p>
            </div>
          </div>
          <div className="flex gap-4">
            <span className="text-2xl">📍</span>
            <div>
              <p className="font-bold text-text-light">{event.location_address}</p>
              {event.location_lat && event.location_lng && (
                <a
                  href={`https://www.google.com/maps?q=${event.location_lat},${event.location_lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent text-sm hover:underline"
                >
                  Open in Google Maps →
                </a>
              )}
            </div>
          </div>
          {event.description && (
            <div>
              <p className="font-bold text-text-light mb-2">About</p>
              <p className="text-text-dark text-sm whitespace-pre-wrap">{event.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
