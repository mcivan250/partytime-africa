'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Event } from '@/lib/types';

export default function Home() {
  const [trendingEvents, setTrendingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrendingEvents();
  }, []);

  const loadTrendingEvents = async () => {
    try {
      // Get upcoming events
      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .gte('date_time', new Date().toISOString())
        .order('date_time', { ascending: true })
        .limit(6);

      if (error) throw error;
      setTrendingEvents(events || []);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
      {/* Hero Section */}
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="text-center max-w-4xl">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 drop-shadow-2xl">
            Party Time Africa
          </h1>
          <p className="text-xl md:text-2xl lg:text-3xl text-white/90 mb-12 font-light">
            Turn up, African style. 🎉
          </p>

          <div className="space-y-4">
            <Link
              href="/create"
              className="inline-block bg-white text-purple-600 px-10 py-4 rounded-full text-xl font-bold hover:scale-105 transition shadow-2xl"
            >
              Create Your Event
            </Link>

            <p className="text-white/80 text-sm mt-8">
              Beautiful invites • Easy RSVPs • Mobile Money • 100% Free
            </p>
          </div>
        </div>
      </div>

      {/* Trending Events Section */}
      {trendingEvents.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 pb-16">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 md:p-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-8 text-center">
              🔥 Happening Soon
            </h2>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white/20 rounded-2xl h-64 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trendingEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={`/e/${event.slug}`}
                    className="bg-white rounded-2xl p-6 hover:scale-105 transition shadow-xl hover:shadow-2xl"
                  >
                    <div className="mb-4">
                      <h3 className="font-bold text-xl text-gray-900 mb-2 line-clamp-2">
                        {event.title}
                      </h3>
                      {event.description && (
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {event.description}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2 text-sm text-gray-700">
                      {event.date_time && (
                        <p className="flex items-center space-x-2">
                          <span>📅</span>
                          <span>
                            {new Date(event.date_time).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </p>
                      )}
                      {event.location_address && (
                        <p className="flex items-center space-x-2">
                          <span>📍</span>
                          <span className="truncate">{event.location_address}</span>
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <span className="inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-semibold">
                        View Event →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {!loading && trendingEvents.length === 0 && (
              <div className="text-center py-12 text-white/80">
                <p className="text-xl mb-4">No events yet!</p>
                <p className="mb-6">Be the first to create an event.</p>
                <Link
                  href="/create"
                  className="inline-block bg-white text-purple-600 px-8 py-3 rounded-full font-bold hover:scale-105 transition shadow-xl"
                >
                  Create Event
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/create"
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-white hover:bg-white/20 transition group"
          >
            <div className="text-4xl mb-3 group-hover:scale-110 transition">🎉</div>
            <h3 className="font-bold text-lg mb-2">Create Events</h3>
            <p className="text-white/80 text-sm">
              Beautiful invites, RSVP tracking, guest lists
            </p>
          </Link>

          <Link
            href="/venues"
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-white hover:bg-white/20 transition group"
          >
            <div className="text-4xl mb-3 group-hover:scale-110 transition">🍽️</div>
            <h3 className="font-bold text-lg mb-2">Book Tables</h3>
            <p className="text-white/80 text-sm">
              Reserve VIP booths, rooftop tables at top venues
            </p>
          </Link>

          <Link
            href="/brunch"
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-white hover:bg-white/20 transition group"
          >
            <div className="text-4xl mb-3 group-hover:scale-110 transition">🥂</div>
            <h3 className="font-bold text-lg mb-2">Sunday Brunch</h3>
            <p className="text-white/80 text-sm">
              Bottomless brunches, live music, unlimited vibes
            </p>
          </Link>

          <Link
            href="/wallet"
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-white hover:bg-white/20 transition group"
          >
            <div className="text-4xl mb-3 group-hover:scale-110 transition">💰</div>
            <h3 className="font-bold text-lg mb-2">Pay Your Way</h3>
            <p className="text-white/80 text-sm">
              Mobile Money, installments, wallet system
            </p>
          </Link>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-white group">
            <div className="text-4xl mb-3 group-hover:scale-110 transition">📱</div>
            <h3 className="font-bold text-lg mb-2">WhatsApp Native</h3>
            <p className="text-white/80 text-sm">
              Share, remind, confirm — where Africa lives
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-white group">
            <div className="text-4xl mb-3 group-hover:scale-110 transition">🎨</div>
            <h3 className="font-bold text-lg mb-2">Afrocentric</h3>
            <p className="text-white/80 text-sm">
              Ankara themes, African vibes, built for us
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pb-8 text-white/60 text-sm">
        Made with ❤️ in Uganda • <Link href="/auth" className="hover:text-white transition">Sign In</Link>
      </div>
    </div>
  );
}
