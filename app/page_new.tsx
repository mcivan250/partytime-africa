'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Event } from '@/lib/types';

export default function Home() {
  const [trendingEvents, setTrendingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    loadTrendingEvents();
  }, []);

  const loadTrendingEvents = async () => {
    try {
      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .gte('date_time', new Date().toISOString())
        .order('date_time', { ascending: true })
        .limit(12);

      if (error) throw error;
      setTrendingEvents(events || []);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % Math.ceil(trendingEvents.length / 3));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + Math.ceil(trendingEvents.length / 3)) % Math.ceil(trendingEvents.length / 3));
  };

  const displayedEvents = trendingEvents.slice(currentSlide * 3, currentSlide * 3 + 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
      {/* ============ HERO SECTION (COMPACT) ============ */}
      <div className="min-h-[50vh] flex items-center justify-center px-4 py-8">
        <div className="text-center max-w-4xl">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 drop-shadow-2xl">
            Party Time Africa
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl text-white/90 mb-8 font-light">
            Turn up, African style. Create events, track RSVPs, collect payments. 🎉
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/create"
              className="inline-block bg-white text-purple-600 px-8 py-3 rounded-full text-lg font-bold hover:scale-105 transition shadow-2xl"
            >
              Create Event
            </Link>
            <Link
              href="/events"
              className="inline-block bg-white/20 text-white px-8 py-3 rounded-full text-lg font-bold hover:bg-white/30 transition border-2 border-white"
            >
              Browse Events
            </Link>
          </div>
        </div>
      </div>

      {/* ============ STATS BAR (NEW) ============ */}
      <div className="bg-white/10 backdrop-blur-md py-8 border-y border-white/20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-3xl md:text-4xl font-bold text-white">5K+</p>
              <p className="text-white/70 text-sm md:text-base mt-1">Active Users</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-white">150+</p>
              <p className="text-white/70 text-sm md:text-base mt-1">Events This Month</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-white">50K+</p>
              <p className="text-white/70 text-sm md:text-base mt-1">Guests Connected</p>
            </div>
          </div>
        </div>
      </div>

      {/* ============ FEATURED EVENTS CAROUSEL ============ */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 text-center">
            🔥 Happening Soon
          </h2>
          <p className="text-white/70 text-center">Discover the hottest events in your area</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/20 rounded-2xl h-72 animate-pulse" />
            ))}
          </div>
        ) : trendingEvents.length > 0 ? (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {displayedEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/e/${event.slug}`}
                  className="bg-white rounded-2xl overflow-hidden hover:scale-105 transition shadow-xl hover:shadow-2xl group"
                >
                  {/* Event Image or Placeholder */}
                  <div className="h-40 bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-4xl group-hover:scale-110 transition">
                    🎉
                  </div>

                  <div className="p-6">
                    <h3 className="font-bold text-xl text-gray-900 mb-2 line-clamp-2">
                      {event.title}
                    </h3>
                    {event.description && (
                      <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                        {event.description}
                      </p>
                    )}

                    <div className="space-y-2 text-sm text-gray-700 mb-4">
                      {event.date_time && (
                        <p className="flex items-center space-x-2">
                          <span>📅</span>
                          <span>
                            {new Date(event.date_time).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
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

                    <div className="pt-4 border-t border-gray-200">
                      <span className="inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-semibold">
                        View Event →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Carousel Navigation */}
            {trendingEvents.length > 3 && (
              <div className="flex justify-center items-center gap-4">
                <button
                  onClick={prevSlide}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full transition"
                >
                  ← Previous
                </button>
                <span className="text-white/70 text-sm">
                  {currentSlide + 1} / {Math.ceil(trendingEvents.length / 3)}
                </span>
                <button
                  onClick={nextSlide}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full transition"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-12 text-center">
            <div className="text-6xl mb-4">🎪</div>
            <h3 className="text-2xl font-bold text-white mb-2">No Events Yet</h3>
            <p className="text-white/70 mb-6">Be the first to create an amazing event!</p>
            <Link
              href="/create"
              className="inline-block bg-white text-purple-600 px-8 py-3 rounded-full font-bold hover:scale-105 transition shadow-xl"
            >
              Create Your Event
            </Link>
          </div>
        )}
      </div>

      {/* ============ HOW IT WORKS SECTION (NEW) ============ */}
      <div className="bg-white/5 backdrop-blur py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-12 text-center">
            How It Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="bg-white/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-3xl">
                ✏️
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Create</h3>
              <p className="text-white/70">
                Design your event with beautiful invites, set date, location, and theme
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="bg-white/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-3xl">
                📤
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Invite</h3>
              <p className="text-white/70">
                Share on WhatsApp, email, or social. Track RSVPs and guest confirmations
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="bg-white/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-3xl">
                🎊
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Celebrate</h3>
              <p className="text-white/70">
                Collect payments, manage guest lists, and make your event unforgettable
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ============ SIMPLIFIED FEATURES (3 instead of 6) ============ */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-12 text-center">
          Why Choose Party Time?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <Link
            href="/create"
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-white hover:bg-white/20 transition group border border-white/20"
          >
            <div className="text-5xl mb-4 group-hover:scale-110 transition">🎨</div>
            <h3 className="font-bold text-xl mb-3">Afrocentric Design</h3>
            <p className="text-white/80 mb-4">
              Ankara themes, African vibes, and local aesthetics built for us
            </p>
            <span className="text-sm text-white/60 group-hover:text-white transition">Learn More →</span>
          </Link>

          {/* Feature 2 */}
          <Link
            href="/wallet"
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-white hover:bg-white/20 transition group border border-white/20"
          >
            <div className="text-5xl mb-4 group-hover:scale-110 transition">💰</div>
            <h3 className="font-bold text-xl mb-3">Mobile Money Ready</h3>
            <p className="text-white/80 mb-4">
              Pay with Airtel, MTN, or card. Installments, wallets, and instant transfers
            </p>
            <span className="text-sm text-white/60 group-hover:text-white transition">Learn More →</span>
          </Link>

          {/* Feature 3 */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-white group border border-white/20">
            <div className="text-5xl mb-4 group-hover:scale-110 transition">📱</div>
            <h3 className="font-bold text-xl mb-3">WhatsApp Native</h3>
            <p className="text-white/80 mb-4">
              Share, remind, and confirm right where Africa lives — on WhatsApp
            </p>
            <span className="text-sm text-white/60">Coming Soon</span>
          </div>
        </div>
      </div>

      {/* ============ CTA SECTION ============ */}
      <div className="bg-white/10 backdrop-blur py-16 border-y border-white/20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Party?
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Join thousands of Africans creating unforgettable events
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/create"
              className="inline-block bg-white text-purple-600 px-10 py-4 rounded-full text-lg font-bold hover:scale-105 transition shadow-2xl"
            >
              Create Event Now
            </Link>
            <Link
              href="/events"
              className="inline-block bg-white/20 text-white px-10 py-4 rounded-full text-lg font-bold hover:bg-white/30 transition border-2 border-white"
            >
              Browse Events
            </Link>
          </div>
        </div>
      </div>

      {/* ============ ENHANCED FOOTER ============ */}
      <div className="bg-black/40 backdrop-blur py-12 border-t border-white/20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold text-white mb-4">Party Time</h4>
              <p className="text-white/60 text-sm">
                The African event platform for creating, sharing, and celebrating together
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><Link href="/create" className="hover:text-white transition">Create Event</Link></li>
                <li><Link href="/events" className="hover:text-white transition">Browse Events</Link></li>
                <li><Link href="/venues" className="hover:text-white transition">Book Tables</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
                <li><a href="#" className="hover:text-white transition">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Follow</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><a href="#" className="hover:text-white transition">Instagram</a></li>
                <li><a href="#" className="hover:text-white transition">Twitter</a></li>
                <li><a href="#" className="hover:text-white transition">WhatsApp</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/20 pt-8 text-center text-white/60 text-sm">
            <p>Made with ❤️ in Uganda • <Link href="/auth" className="hover:text-white transition">Sign In</Link></p>
            <p className="mt-2">© 2026 Party Time Africa. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
