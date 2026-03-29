'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { THEMES } from '@/lib/types';

interface EventItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  date_time: string;
  location_address: string;
  theme: string;
  image_url: string | null;
  host_id: string;
  max_capacity: number | null;
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');

  useEffect(() => {
    fetchEvents();
  }, [filter]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('events')
        .select('id, title, slug, description, date_time, location_address, theme, image_url, host_id, max_capacity')
        .order('date_time', { ascending: true });

      if (filter === 'upcoming') {
        query = query.gte('date_time', new Date().toISOString());
      } else if (filter === 'past') {
        query = query.lt('date_time', new Date().toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getThemeGradient = (theme: string) => {
    const found = THEMES.find(t => t.id === theme);
    return found ? `theme-${found.id}` : 'theme-fire';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      day: date.toLocaleDateString('en-US', { day: 'numeric' }),
      month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      full: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
    };
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-text-light)' }}>
      {/* Navigation */}
      <nav style={{ backgroundColor: 'var(--color-secondary)', borderBottom: '1px solid var(--color-border)' }} className="sticky top-0 z-50">
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-accent)', textDecoration: 'none', fontFamily: 'var(--font-family-display)' }}>
            Party Time Africa
          </Link>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link href="/" className="btn btn-secondary" style={{ fontSize: '0.9rem' }}>Home</Link>
            <Link href="/events/create-with-tiers" className="btn btn-primary" style={{ fontSize: '0.9rem' }}>Create Event</Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section style={{ padding: '3rem 1.5rem 2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-family-display)', color: 'var(--color-accent)', marginBottom: '0.5rem' }}>
          Discover Events
        </h1>
        <p style={{ color: 'var(--color-text-dark)', maxWidth: '600px', margin: '0 auto 2rem' }}>
          Find the hottest parties, brunches, and nightlife experiences across Africa.
        </p>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
          {(['upcoming', 'all', 'past'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={filter === f ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{ textTransform: 'capitalize', fontSize: '0.9rem' }}
            >
              {f}
            </button>
          ))}
        </div>
      </section>

      {/* Events Grid */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem 4rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <p style={{ color: 'var(--color-text-dark)', fontSize: '1.2rem' }}>Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
            <h3 style={{ color: 'var(--color-text-light)', marginBottom: '0.5rem' }}>No events found</h3>
            <p style={{ color: 'var(--color-text-dark)', marginBottom: '2rem' }}>Be the first to create an event!</p>
            <Link href="/events/create-with-tiers" className="btn btn-primary">Create Event</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
            {events.map((event) => {
              const dateInfo = formatDate(event.date_time);
              return (
                <Link key={event.id} href={`/events/${event.id}`} style={{ textDecoration: 'none' }}>
                  <div className="event-card">
                    {/* Event Image / Theme Banner */}
                    <div className={`event-card-image ${getThemeGradient(event.theme)}`}>
                      {event.image_url ? (
                        <img src={event.image_url} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ textAlign: 'center', padding: '1rem' }}>
                          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
                          <span style={{ color: 'white', fontWeight: 'bold', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            {event.theme || 'Party'}
                          </span>
                        </div>
                      )}
                      {/* Date Badge */}
                      <div style={{
                        position: 'absolute', top: '12px', right: '12px',
                        backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: '0.5rem',
                        padding: '0.5rem 0.75rem', textAlign: 'center', minWidth: '50px'
                      }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-accent)', fontWeight: 'bold' }}>{dateInfo.month}</div>
                        <div style={{ fontSize: '1.4rem', color: 'white', fontWeight: 'bold', lineHeight: '1' }}>{dateInfo.day}</div>
                      </div>
                    </div>

                    {/* Event Body */}
                    <div className="event-card-body">
                      <h3 className="event-card-title">{event.title}</h3>
                      <div className="event-card-meta">
                        <span>📅 {dateInfo.full} at {dateInfo.time}</span>
                        <span>📍 {event.location_address}</span>
                      </div>
                      <p style={{ color: 'var(--color-text-dark)', fontSize: '0.9rem', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {event.description}
                      </p>
                      <div className="event-card-footer">
                        <span style={{ color: 'var(--color-accent)', fontWeight: 'bold', fontSize: '0.9rem' }}>View Details →</span>
                        {event.max_capacity && (
                          <span style={{ color: 'var(--color-text-dark)', fontSize: '0.8rem' }}>
                            {event.max_capacity} spots
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer style={{ padding: '2rem', textAlign: 'center', borderTop: '1px solid var(--color-border)' }}>
        <p style={{ color: 'var(--color-text-dark)' }}>© 2026 Party Time Africa. All rights reserved.</p>
      </footer>
    </div>
  );
}
