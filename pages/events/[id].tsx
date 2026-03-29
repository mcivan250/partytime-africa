'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { THEMES } from '@/lib/types';

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
      full: date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
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
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--color-text-dark)', fontSize: '1.2rem' }}>Loading event...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ fontSize: '4rem' }}>😢</div>
        <h2 style={{ color: 'var(--color-text-light)' }}>Event not found</h2>
        <Link href="/events" className="btn btn-primary">Browse Events</Link>
      </div>
    );
  }

  const dateInfo = formatDate(event.date_time);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-primary)', color: 'var(--color-text-light)' }}>
      {/* Navigation */}
      <nav style={{ backgroundColor: 'var(--color-secondary)', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-accent)', textDecoration: 'none' }}>
            Party Time Africa
          </Link>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link href="/events" className="btn btn-secondary" style={{ fontSize: '0.9rem' }}>All Events</Link>
          </div>
        </div>
      </nav>

      {/* Hero Banner */}
      <div className={`theme-${event.theme || 'fire'}`} style={{ minHeight: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        {event.image_url ? (
          <img src={event.image_url} alt={event.title} style={{ width: '100%', height: '280px', objectFit: 'cover' }} />
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🎉</div>
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              {event.theme || 'Party Time'}
            </span>
          </div>
        )}
        <div style={{
          position: 'absolute', bottom: '-20px', left: '50%', transform: 'translateX(-50%)',
          backgroundColor: 'var(--color-accent)', color: 'var(--color-primary)',
          padding: '0.5rem 1.5rem', borderRadius: '2rem', fontWeight: 'bold', fontSize: '0.9rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)', whiteSpace: 'nowrap'
        }}>
          {dateInfo.relative}
        </div>
      </div>

      {/* Event Content */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem 1.5rem' }}>
        {/* Title & Host */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.2rem', fontFamily: 'var(--font-family-display)', color: 'var(--color-text-light)', marginBottom: '0.5rem' }}>
            {event.title}
          </h1>
          <p style={{ color: 'var(--color-text-dark)' }}>
            Hosted by <span style={{ color: 'var(--color-accent)', fontWeight: 'bold' }}>{hostName || 'Unknown'}</span>
          </p>
        </div>

        {/* RSVP Section */}
        <div className="card" style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <h3 style={{ color: 'var(--color-accent)', marginBottom: '1rem', fontSize: '1.2rem' }}>Are you going?</h3>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {(['going', 'maybe', 'cant_go'] as const).map((status) => {
              const labels: Record<string, string> = { going: '🎉 Going', maybe: '🤔 Maybe', cant_go: "😔 Can't Go" };
              const activeColors: Record<string, string> = { going: 'var(--color-success)', maybe: 'var(--color-accent)', cant_go: 'var(--color-error)' };
              const isActive = rsvpStatus === status;
              return (
                <button
                  key={status}
                  onClick={() => handleRSVP(status)}
                  disabled={rsvpLoading}
                  className="btn"
                  style={{
                    backgroundColor: isActive ? activeColors[status] : 'var(--color-border)',
                    color: isActive ? (status === 'cant_go' ? 'white' : 'black') : 'var(--color-text-light)',
                    minWidth: '100px', opacity: rsvpLoading ? 0.6 : 1
                  }}
                >
                  {labels[status]}
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1rem' }}>
            <span style={{ color: 'var(--color-text-dark)', fontSize: '0.9rem' }}>
              <strong style={{ color: 'var(--color-success)' }}>{goingCount}</strong> going
            </span>
            <span style={{ color: 'var(--color-text-dark)', fontSize: '0.9rem' }}>
              <strong style={{ color: 'var(--color-accent)' }}>{maybeCount}</strong> interested
            </span>
          </div>
        </div>

        {/* Event Details */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <span style={{ fontSize: '1.5rem' }}>📅</span>
              <div>
                <p style={{ fontWeight: 'bold', color: 'var(--color-text-light)', marginBottom: '0.25rem' }}>{dateInfo.full}</p>
                <p style={{ color: 'var(--color-text-dark)' }}>{dateInfo.time}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <span style={{ fontSize: '1.5rem' }}>📍</span>
              <div>
                <p style={{ fontWeight: 'bold', color: 'var(--color-text-light)', marginBottom: '0.25rem' }}>{event.location_address}</p>
                {event.location_lat && event.location_lng && (
                  <a
                    href={`https://www.google.com/maps?q=${event.location_lat},${event.location_lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--color-accent)', fontSize: '0.9rem' }}
                  >
                    Open in Google Maps →
                  </a>
                )}
              </div>
            </div>
            {event.max_capacity && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <span style={{ fontSize: '1.5rem' }}>👥</span>
                <div>
                  <p style={{ fontWeight: 'bold', color: 'var(--color-text-light)' }}>Capacity: {event.max_capacity} guests</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {event.description && (
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ color: 'var(--color-accent)', marginBottom: '1rem' }}>About This Event</h3>
            <p style={{ color: 'var(--color-text-light)', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
              {event.description}
            </p>
          </div>
        )}

        {/* Share Section */}
        <div className="card" style={{ textAlign: 'center' }}>
          <h3 style={{ color: 'var(--color-accent)', marginBottom: '1rem' }}>Share This Event</h3>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                if (typeof navigator !== 'undefined' && navigator.share) {
                  navigator.share({ title: event.title, url: window.location.href });
                } else if (typeof navigator !== 'undefined') {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Link copied to clipboard!');
                }
              }}
              className="btn btn-primary"
            >
              📤 Share Link
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Check out ${event.title} on Party Time Africa! ${typeof window !== 'undefined' ? window.location.href : ''}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
              💬 WhatsApp
            </a>
          </div>
        </div>

        {/* Back Link */}
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link href="/events" style={{ color: 'var(--color-accent)', fontSize: '0.9rem' }}>← Back to All Events</Link>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ padding: '2rem', textAlign: 'center', borderTop: '1px solid var(--color-border)' }}>
        <p style={{ color: 'var(--color-text-dark)' }}>© 2026 Party Time Africa. All rights reserved.</p>
      </footer>
    </div>
  );
}
