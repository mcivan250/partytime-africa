'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Event, THEMES } from '@/lib/types';

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Events', icon: '🎉' },
    { id: 'nightlife', name: 'Nightlife', icon: '🌙' },
    { id: 'brunch', name: 'Brunch', icon: '🥂' },
    { id: 'concerts', name: 'Concerts', icon: '🎵' },
    { id: 'rooftop', name: 'Rooftop', icon: '🏙️' },
    { id: 'clubs', name: 'Clubs', icon: '💃' },
  ];

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .gte('date_time', new Date().toISOString())
        .order('date_time', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location_address?.toLowerCase().includes(searchQuery.toLowerCase());

    // TODO: Add category filtering once we have categories in database
    return matchesSearch;
  });

  const getThemeGradient = (themeId?: string) => {
    const theme = THEMES.find((t) => t.id === themeId);
    return theme?.gradient || THEMES[0].gradient;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-24">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Discover Events
          </h1>
          <p className="text-gray-600">
            Find your next experience
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events, locations, or organizers..."
              className="w-full px-6 py-4 pl-12 rounded-2xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition text-lg"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl">
              🔍
            </span>
          </div>
        </div>

        {/* Category Filters */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex space-x-3 pb-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-full font-semibold whitespace-nowrap transition ${
                  selectedCategory === category.id
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-xl">{category.icon}</span>
                <span>{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl h-80 animate-pulse"
              />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-6xl mb-4 block">🔍</span>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              No events found
            </h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search or create your own event
            </p>
            <Link
              href="/create"
              className="inline-block bg-purple-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-purple-700 transition"
            >
              Create Event
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-600">
              {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/e/${event.slug}`}
                  className="group"
                >
                  <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                    {/* Event Card Header */}
                    <div
                      className={`relative h-48 bg-gradient-to-br ${getThemeGradient(event.theme)} flex items-center justify-center overflow-hidden`}
                    >
                      {event.image_url ? (
                        <img
                          src={event.image_url}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <span className="text-6xl opacity-50">🎉</span>
                      )}
                    </div>

                    {/* Event Card Content */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition">
                        {event.title}
                      </h3>

                      {event.description && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {event.description}
                        </p>
                      )}

                      <div className="space-y-2 text-sm text-gray-700">
                        {event.date_time && (
                          <div className="flex items-center space-x-2">
                            <span>📅</span>
                            <span>
                              {new Date(event.date_time).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                        )}

                        {event.location_address && (
                          <div className="flex items-center space-x-2">
                            <span>📍</span>
                            <span className="line-clamp-1">{event.location_address}</span>
                          </div>
                        )}
                      </div>

                      {/* RSVP Count (TODO: Fetch from database) */}
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">
                            <span className="font-semibold text-purple-600">0</span> going
                          </span>
                          <span className="text-purple-600 font-semibold group-hover:underline">
                            View →
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* Create Event CTA */}
        {!loading && filteredEvents.length > 0 && (
          <div className="mt-12 text-center bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">Have an event?</h2>
            <p className="text-lg mb-6 opacity-90">
              Create beautiful invites in minutes
            </p>
            <Link
              href="/create"
              className="inline-block bg-white text-purple-600 px-8 py-3 rounded-full font-bold hover:scale-105 transition transform"
            >
              Create Event
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
