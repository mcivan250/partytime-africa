
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getEvents } from '@/lib/supabase-db';
import { THEMES } from '@/lib/types';

interface Event {
  id: string;
  title: string;
  slug: string;
  date_time: string;
  location_address: string;
  theme: string;
  image_url: string;
}

export default function EventsPage() {
  console.log("EventsPage component is rendering.");

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'upcoming' | 'all' | 'past'>('upcoming');

  useEffect(() => {
    console.log("EventsPage useEffect triggered.");

    const fetchEvents = async () => {
      console.log("fetchEvents function called.");

      setLoading(true);
      setError(null);
      console.log("Supabase client in EventsPage:", supabase);
      const { success, events: fetchedEvents, error: fetchError } = await getEvents();
      console.log("getEvents result:", { success, fetchedEvents, fetchError });

      if (success && fetchedEvents) {
        const now = new Date();
        const sortedEvents = fetchedEvents.sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime());

        setEvents(sortedEvents);
      } else {
        setError(fetchError || 'Failed to fetch events');
      }
      setLoading(false);
    };

    fetchEvents();
  }, []);

  const filteredEvents = events.filter((event) => {
    const eventDate = new Date(event.date_time);
    const now = new Date();

    if (filter === 'upcoming') {
      return eventDate > now;
    } else if (filter === 'past') {
      return eventDate < now;
    } else {
      return true;
    }
  });

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-24">
      <div className="bg-gradient-to-r from-yellow-600/20 to-yellow-500/10 border-b border-yellow-500/20 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-white">Discover Events</h1>
          <p className="text-gray-400 text-sm">Find the hottest parties, brunches, and nightlife experiences across Africa.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="flex gap-2 border-b border-slate-700">
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-4 py-3 font-semibold border-b-2 transition ${
              filter === 'upcoming'
                ? 'border-yellow-500 text-yellow-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-3 font-semibold border-b-2 transition ${
              filter === 'all'
                ? 'border-yellow-500 text-yellow-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`px-4 py-3 font-semibold border-b-2 transition ${
              filter === 'past'
                ? 'border-yellow-500 text-yellow-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            Past
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin">
              <div className="w-8 h-8 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full" />
            </div>
            <p className="text-gray-400 mt-2">Loading events...</p>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-400">{error}</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 text-center">
            <p className="text-gray-400">No events found for this filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`} className="block">
                <div
                  className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <img
                    src={event.image_url || '/placeholder-event.jpg'}
                    alt={event.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="text-xl font-bold text-white mb-1">{event.title}</h3>
                    <p className="text-gray-400 text-sm mb-2">
                      {new Date(event.date_time).toLocaleString()}
                    </p>
                    <p className="text-gray-300 text-sm">{event.location_address}</p>
                    <div className="mt-4 flex justify-between items-center">
                      <span className="text-yellow-400 font-semibold text-sm capitalize">
                        {event.theme.replace(/_/g, ' ')}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {/* Add RSVP count or other relevant info here */}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
