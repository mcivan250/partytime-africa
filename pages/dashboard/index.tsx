'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [myEvents, setMyEvents] = useState<any[]>([]);
  const [myRsvps, setMyRsvps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch events hosted by user
      const { data: events } = await supabase
        .from('events')
        .select('*')
        .eq('host_id', user.id)
        .order('date_time', { ascending: false });

      setMyEvents(events || []);

      // Fetch user's RSVPs with event details
      const { data: rsvps } = await supabase
        .from('rsvps')
        .select('*, events(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setMyRsvps(rsvps || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-primary)', color: 'var(--color-text-light)' }}>
      {/* Navigation */}
      <nav style={{ backgroundColor: 'var(--color-secondary)', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-accent)', textDecoration: 'none' }}>
            Party Time Africa
          </Link>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Link href="/events" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>Events</Link>
            <button onClick={() => signOut()} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>Sign Out</button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Welcome Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-family-display)', color: 'var(--color-accent)', marginBottom: '0.5rem' }}>
            Welcome back, {user.user_metadata?.name || user.email?.split('@')[0] || 'Party Lover'}!
          </h1>
          <p style={{ color: 'var(--color-text-dark)' }}>Manage your events and RSVPs from here.</p>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <Link href="/events/create-with-tiers" className="card" style={{ textAlign: 'center', textDecoration: 'none', cursor: 'pointer', transition: 'transform 0.2s' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎉</div>
            <h3 style={{ color: 'var(--color-accent)', marginBottom: '0.25rem' }}>Create Event</h3>
            <p style={{ color: 'var(--color-text-dark)', fontSize: '0.85rem' }}>Host your next party</p>
          </Link>
          <Link href="/events" className="card" style={{ textAlign: 'center', textDecoration: 'none', cursor: 'pointer', transition: 'transform 0.2s' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔍</div>
            <h3 style={{ color: 'var(--color-accent)', marginBottom: '0.25rem' }}>Explore Events</h3>
            <p style={{ color: 'var(--color-text-dark)', fontSize: '0.85rem' }}>Find parties near you</p>
          </Link>
          <Link href="/profile" className="card" style={{ textAlign: 'center', textDecoration: 'none', cursor: 'pointer', transition: 'transform 0.2s' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>👤</div>
            <h3 style={{ color: 'var(--color-accent)', marginBottom: '0.25rem' }}>My Profile</h3>
            <p style={{ color: 'var(--color-text-dark)', fontSize: '0.85rem' }}>Edit your details</p>
          </Link>
        </div>

        {loading ? (
          <p style={{ color: 'var(--color-text-dark)', textAlign: 'center', padding: '2rem' }}>Loading your data...</p>
        ) : (
          <>
            {/* My Events Section */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-family-display)', color: 'var(--color-text-light)' }}>
                  My Events ({myEvents.length})
                </h2>
                <Link href="/events/create-with-tiers" style={{ color: 'var(--color-accent)', fontSize: '0.9rem' }}>+ Create New</Link>
              </div>

              {myEvents.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                  <p style={{ color: 'var(--color-text-dark)', marginBottom: '1rem' }}>You haven't created any events yet.</p>
                  <Link href="/events/create-with-tiers" className="btn btn-primary">Create Your First Event</Link>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {myEvents.map((event) => (
                    <Link key={event.id} href={`/events/${event.id}`} style={{ textDecoration: 'none' }}>
                      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                        <div>
                          <h3 style={{ color: 'var(--color-text-light)', marginBottom: '0.25rem' }}>{event.title}</h3>
                          <p style={{ color: 'var(--color-text-dark)', fontSize: '0.85rem' }}>
                            📅 {new Date(event.date_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            &nbsp;&nbsp;📍 {event.location_address}
                          </p>
                        </div>
                        <span style={{ color: 'var(--color-accent)', fontSize: '1.2rem' }}>→</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* My RSVPs Section */}
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-family-display)', color: 'var(--color-text-light)', marginBottom: '1rem' }}>
                My RSVPs ({myRsvps.length})
              </h2>

              {myRsvps.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                  <p style={{ color: 'var(--color-text-dark)', marginBottom: '1rem' }}>You haven't RSVP'd to any events yet.</p>
                  <Link href="/events" className="btn btn-primary">Browse Events</Link>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {myRsvps.map((rsvp) => {
                    const event = rsvp.events;
                    if (!event) return null;
                    const statusColors: Record<string, string> = { going: 'var(--color-success)', maybe: 'var(--color-accent)', cant_go: 'var(--color-error)' };
                    const statusLabels: Record<string, string> = { going: 'Going', maybe: 'Maybe', cant_go: "Can't Go" };
                    return (
                      <Link key={rsvp.id || `${rsvp.event_id}-${rsvp.user_id}`} href={`/events/${event.id}`} style={{ textDecoration: 'none' }}>
                        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                          <div>
                            <h3 style={{ color: 'var(--color-text-light)', marginBottom: '0.25rem' }}>{event.title}</h3>
                            <p style={{ color: 'var(--color-text-dark)', fontSize: '0.85rem' }}>
                              📅 {new Date(event.date_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              &nbsp;&nbsp;📍 {event.location_address}
                            </p>
                          </div>
                          <span style={{ color: statusColors[rsvp.status] || 'var(--color-text-dark)', fontWeight: 'bold', fontSize: '0.85rem' }}>
                            {statusLabels[rsvp.status] || rsvp.status}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <footer style={{ padding: '2rem', textAlign: 'center', borderTop: '1px solid var(--color-border)' }}>
        <p style={{ color: 'var(--color-text-dark)' }}>© 2026 Party Time Africa. All rights reserved.</p>
      </footer>
    </div>
  );
}
