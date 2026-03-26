'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, AuthUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Event } from '@/lib/types';

interface EventStats {
  event_id: string;
  views: number;
  rsvps_going: number;
  rsvps_maybe: number;
  comments: number;
  shares: number;
  revenue: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<Record<string, EventStats>>({});
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalAttendees, setTotalAttendees] = useState(0);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      router.push('/auth');
      return;
    }

    setUser(currentUser);
    await loadUserEvents(currentUser.id);
    setLoading(false);
  };

  const loadUserEvents = async (userId: string) => {
    try {
      // Get user's events
      const { data: userEvents, error } = await supabase
        .from('events')
        .select('*')
        .eq('host_id', userId)
        .order('date_time', { ascending: false });

      if (error) throw error;
      setEvents(userEvents || []);

      // Get stats for each event
      const eventStats: Record<string, EventStats> = {};
      let totalRev = 0;
      let totalAtt = 0;

      for (const event of userEvents || []) {
        // Get RSVP counts
        const { data: rsvps } = await supabase
          .from('rsvps')
          .select('status')
          .eq('event_id', event.id);

        const going = rsvps?.filter(r => r.status === 'going').length || 0;
        const maybe = rsvps?.filter(r => r.status === 'maybe').length || 0;

        // Get comment count
        const { count: commentCount } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id);

        // TODO: Track actual views, shares, revenue when features are built
        eventStats[event.id!] = {
          event_id: event.id!,
          views: Math.floor(Math.random() * 500) + 100, // Placeholder
          rsvps_going: going,
          rsvps_maybe: maybe,
          comments: commentCount || 0,
          shares: Math.floor(Math.random() * 50), // Placeholder
          revenue: 0, // TODO: Calculate from ticket sales
        };

        totalAtt += going;
      }

      setStats(eventStats);
      setTotalRevenue(totalRev);
      setTotalAttendees(totalAtt);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  };

  const handleShare = (slug: string) => {
    const url = `https://partytime.africa/e/${slug}`;
    if (navigator.share) {
      navigator.share({
        title: 'Check out my event!',
        url: url,
      });
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-24">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Promoter Dashboard
          </h1>
          <p className="text-gray-600">
            Manage your events and track performance
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="text-3xl mb-2">🎉</div>
            <div className="text-3xl font-bold text-purple-600 mb-1">
              {events.length}
            </div>
            <div className="text-sm text-gray-600">Total Events</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="text-3xl mb-2">👥</div>
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {totalAttendees}
            </div>
            <div className="text-sm text-gray-600">Total Attendees</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="text-3xl mb-2">💰</div>
            <div className="text-3xl font-bold text-green-600 mb-1">
              UGX {totalRevenue.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Revenue</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="text-3xl mb-2">📊</div>
            <div className="text-3xl font-bold text-orange-600 mb-1">
              {Object.values(stats).reduce((sum, s) => sum + s.views, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Views</div>
          </div>
        </div>

        {/* Create Event CTA */}
        <div className="mb-8">
          <Link
            href="/create"
            className="inline-flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-purple-700 transition shadow-lg"
          >
            <span>➕</span>
            <span>Create New Event</span>
          </Link>
        </div>

        {/* Events List */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Your Events</h2>

          {events.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center">
              <span className="text-6xl block mb-4">🎉</span>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No events yet
              </h3>
              <p className="text-gray-600 mb-6">
                Create your first event and start building your audience
              </p>
              <Link
                href="/create"
                className="inline-block bg-purple-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-purple-700 transition"
              >
                Create Event
              </Link>
            </div>
          ) : (
            events.map((event) => {
              const eventStats = stats[event.id!] || {};
              const isPast = event.date_time && new Date(event.date_time) < new Date();

              return (
                <div
                  key={event.id}
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Event Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">
                          {event.title}
                        </h3>
                        {isPast && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                            Past
                          </span>
                        )}
                      </div>

                      {event.date_time && (
                        <p className="text-gray-600 mb-3">
                          📅 {new Date(event.date_time).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </p>
                      )}

                      {/* Stats Row */}
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <span className="text-purple-600 font-semibold">
                            {eventStats.rsvps_going || 0} going
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-yellow-600 font-semibold">
                            {eventStats.rsvps_maybe || 0} maybe
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-600">
                            👁️ {eventStats.views || 0} views
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-600">
                            💬 {eventStats.comments || 0} comments
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-600">
                            📤 {eventStats.shares || 0} shares
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Link
                        href={`/e/${event.slug}`}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition text-center"
                      >
                        View
                      </Link>
                      <Link
                        href={`/e/${event.slug}/edit`}
                        className="px-4 py-2 bg-purple-100 text-purple-600 rounded-lg font-semibold hover:bg-purple-200 transition text-center"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleShare(event.slug)}
                        className="px-4 py-2 bg-green-100 text-green-600 rounded-lg font-semibold hover:bg-green-200 transition"
                      >
                        Share
                      </button>
                    </div>
                  </div>

                  {/* Performance Bar */}
                  {eventStats.views > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                        <span>Conversion Rate</span>
                        <span>
                          {Math.round(
                            ((eventStats.rsvps_going / eventStats.views) * 100) || 0
                          )}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.min(
                              ((eventStats.rsvps_going / eventStats.views) * 100) || 0,
                              100
                            )}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Marketing Tips */}
        {events.length > 0 && (
          <div className="mt-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">📈 Grow Your Events</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-3xl mb-2">📱</div>
                <h4 className="font-bold mb-2">Share on WhatsApp</h4>
                <p className="text-sm opacity-90">
                  Share your event link in groups and status updates
                </p>
              </div>
              <div>
                <div className="text-3xl mb-2">🎨</div>
                <h4 className="font-bold mb-2">Create Great Content</h4>
                <p className="text-sm opacity-90">
                  Use high-quality images and compelling descriptions
                </p>
              </div>
              <div>
                <div className="text-3xl mb-2">⏰</div>
                <h4 className="font-bold mb-2">Post Early</h4>
                <p className="text-sm opacity-90">
                  Create events 2-3 weeks in advance for maximum reach
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
