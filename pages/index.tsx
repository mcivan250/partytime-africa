import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

interface EventStats {
  totalEvents: number;
  totalUsers: number;
  totalRSVPs: number;
}

interface Event {
  id: string;
  name: string;
  description: string;
  date: string;
  time: string;
  location: string;
  poster_url?: string;
  theme?: string;
}

export default function HomePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<EventStats>({
    totalEvents: 0,
    totalUsers: 0,
    totalRSVPs: 0,
  });
  const [trendingEvents, setTrendingEvents] = useState<Event[]>([]);

  useEffect(() => {
    fetchStats();
    fetchTrendingEvents();
  }, []);

  const fetchStats = async () => {
    try {
      const { count: eventsCount } = await supabase.from('events').select('id', { count: 'exact', head: true });
      const { count: usersCount } = await supabase.from('users').select('id', { count: 'exact', head: true });
      
      setStats({
        totalEvents: eventsCount || 0,
        totalUsers: usersCount || 0,
        totalRSVPs: 50000, // Placeholder, ideally from RSVPs table
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchTrendingEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, name, description, date, time, location, poster_url, theme')
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      setTrendingEvents(data || []);
    } catch (error) {
      console.error('Error fetching trending events:', error);
    }
  };

  const testimonials = [
    {
      quote: "PartyTime Africa is the best way to discover nightlife in Kampala!",
      author: "Sarah M.",
      role: "Event Enthusiast"
    },
    {
      quote: "Finally, a platform that gets African nightlife culture.",
      author: "James K.",
      role: "Event Organizer"
    },
    {
      quote: "I've discovered so many amazing events through this app!",
      author: "Amara T.",
      role: "Social Butterfly"
    }
  ];

  const features = [
    {
      icon: "🎫",
      title: "Multi-Tier Ticketing",
      description: "Create VIP, Early Bird, and Table tiers with precise inventory control."
    },
    {
      icon: "💎",
      title: "Affiliate Rewards",
      description: "Let your community sell for you and earn commissions automatically."
    },
    {
      icon: "📊",
      title: "Real-time Analytics",
      description: "Monitor ticket sales, revenue, and guest check-ins live."
    },
    {
      icon: "🗺️",
      title: "Vibe Map",
      description: "Discover venues with live activity levels and real-time vibes."
    },
    {
      icon: "💬",
      title: "Guest Interaction",
      description: "Comment, react, and engage with other guests attending events."
    },
    {
      icon: "📸",
      title: "Photo Album",
      description: "Share and collect event memories in one beautiful place."
    }
  ];

  return (
    <div className="min-h-screen bg-primary text-text-light overflow-x-hidden font-body">
      {/* Navigation - Retain existing structure but apply new styles */}
      <nav className="bg-secondary border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
        <div className="container max-w-6xl mx-auto px-4 md:px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl md:text-2xl font-display font-bold text-accent hover:text-accent-light transition-colors">
            🎉 PartyTime Africa
          </Link>
          <div className="flex gap-2 md:gap-4">
            {user ? (
              <>
                <Link href="/dashboard" className="btn btn-secondary px-3 md:px-6 py-2 text-sm md:text-base">
                  Dashboard
                </Link>
                <Link href="/events/create-with-tiers" className="btn btn-primary px-3 md:px-6 py-2 text-sm md:text-base">
                  Create Event
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/signin" className="btn btn-secondary px-3 md:px-6 py-2 text-sm md:text-base">
                  Sign In
                </Link>
                <Link href="/auth/signup" className="btn btn-primary px-3 md:px-6 py-2 text-sm md:text-base">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section - Luxurious and inviting */}
      <section className="relative bg-gradient-to-br from-primary via-secondary to-primary py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-nude rounded-full blur-3xl"></div>
        </div>

        <div className="container max-w-6xl mx-auto px-4 md:px-6 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-block mb-6 px-5 py-2 bg-accent bg-opacity-10 rounded-full border border-accent border-opacity-30">
              <span className="text-accent text-sm font-semibold uppercase tracking-wide">✨ Experience Luxury Events</span>
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold mb-8 text-text-light leading-tight drop-shadow-lg">
              Your Night, Elevated.
            </h1>
            <p className="text-lg md:text-xl text-text-dark mb-12 max-w-4xl mx-auto leading-relaxed">
              Discover, create, and manage exclusive events with unparalleled elegance. From VIP access to seamless ticketing, elevate every moment.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/events/create-with-tiers" className="btn btn-primary px-10 py-4 text-lg w-full sm:w-auto text-center font-semibold hover:scale-105 transition-transform duration-300">
                🚀 Create Your Exclusive Event
              </Link>
              <Link href="/events" className="btn btn-secondary px-10 py-4 text-lg w-full sm:w-auto text-center font-semibold hover:bg-border-light transition-colors duration-300">
                Explore Curated Events
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof - Stats Bar */}
      <div className="bg-primary py-12 md:py-16 border-y border-border/50">
        <div className="container max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 text-center">
          <div className="group hover:scale-105 transition-transform duration-300">
            <div className="text-5xl md:text-6xl font-bold text-accent mb-2">{stats.totalEvents}+</div>
            <div className="text-text-dark uppercase tracking-widest text-sm font-semibold">Exclusive Events</div>
          </div>
          <div className="group hover:scale-105 transition-transform duration-300">
            <div className="text-5xl md:text-6xl font-bold text-accent mb-2">{stats.totalUsers}K+</div>
            <div className="text-text-dark uppercase tracking-widest text-sm font-semibold">Elite Members</div>
          </div>
          <div className="group hover:scale-105 transition-transform duration-300">
            <div className="text-5xl md:text-6xl font-bold text-accent mb-2">{stats.totalRSVPs}K+</div>
            <div className="text-text-dark uppercase tracking-widest text-sm font-semibold">Guests Attended</div>
          </div>
        </div>
      </div>

      {/* The Vibe Feed Section - Social Discovery */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-accent/10 to-nude/10 border-b border-border">
        <div className="container max-w-6xl mx-auto px-4 md:px-6">
          <div className="mb-12 text-center">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-text-light mb-4">🔥 The Vibe - Live Discovery</h2>
            <p className="text-text-dark text-lg max-w-2xl mx-auto">Swipe through trending events, see who's there, and join the hottest vibes in real-time.</p>
          </div>
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1">
              <div className="relative bg-secondary rounded-2xl border-2 border-accent/30 overflow-hidden h-96 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">📱</div>
                  <p className="text-text-light font-semibold mb-2">Swipe. Discover. Vibe.</p>
                  <p className="text-text-dark text-sm">Experience events like never before</p>
                </div>
              </div>
            </div>
            <div className="flex-1 space-y-6">
              <div className="flex items-start gap-4">
                <div className="text-3xl">🔥</div>
                <div>
                  <h3 className="text-xl font-bold text-text-light mb-1">Trending Events</h3>
                  <p className="text-text-dark">See what's hot right now with real-time engagement metrics.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="text-3xl">👥</div>
                <div>
                  <h3 className="text-xl font-bold text-text-light mb-1">Who's There</h3>
                  <p className="text-text-dark">Check live attendance and vibe scores before you go.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="text-3xl">💬</div>
                <div>
                  <h3 className="text-xl font-bold text-text-light mb-1">Engage & Connect</h3>
                  <p className="text-text-dark">Like, comment, and share your favorite events with friends.</p>
                </div>
              </div>
              <Link href="/vibe" className="btn btn-primary px-8 py-4 text-lg font-semibold inline-block hover:scale-105 transition-transform duration-300">
                Enter The Vibe 🚀
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Events Section - Visually rich feed */}
      <section className="py-16 md:py-20 bg-secondary border-b border-border">
        <div className="container max-w-6xl mx-auto px-4 md:px-6">
          <div className="mb-12 text-center">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-text-light mb-4">Trending Experiences 🔥</h2>
            <p className="text-text-dark text-lg max-w-2xl mx-auto">Discover the most sought-after events and exclusive gatherings.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {trendingEvents.length > 0 ? (
              trendingEvents.map((event) => (
                <Link href={`/events/${event.id}`} key={event.id} className="group block card p-0 overflow-hidden hover:border-accent transition-all duration-300 cursor-pointer">
                  <div className="relative h-64 w-full overflow-hidden">
                    <Image 
                      src={event.poster_url || `/images/event-placeholder-${Math.floor(Math.random() * 3) + 1}.jpg`} 
                      alt={event.name} 
                      layout="fill" 
                      objectFit="cover" 
                      className="transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20"></div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-xl font-display font-bold text-text-light mb-1 drop-shadow">{event.name}</h3>
                      <p className="text-text-dark text-sm drop-shadow">{event.location} • {new Date(event.date).toLocaleDateString()}</p>
                    </div>
                    <div className="absolute top-4 right-4 bg-primary/70 backdrop-blur-sm px-3 py-1 rounded-full text-accent text-xs font-bold uppercase">
                      {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-text-dark text-sm line-clamp-2">{event.description}</p>
                    <div className="mt-4 text-accent font-semibold text-sm flex items-center gap-2">
                      View Details 
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <p className="col-span-3 text-center text-text-dark">No trending events found. Be the first to create one!</p>
            )}
          </div>
          <div className="text-center mt-16">
            <Link href="/events" className="btn btn-primary px-10 py-4 text-lg font-semibold">
              Explore All Events
            </Link>
          </div>
        </div>
      </section>

      {/* Premium Features Section */}
      <section className="py-16 md:py-20 bg-primary border-b border-border">
        <div className="container max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-text-light mb-4">
              Unrivaled Features, Seamless Experience
            </h2>
            <p className="text-text-dark text-lg max-w-3xl mx-auto">
              Everything you need to create, manage, and discover unforgettable events with a touch of class.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className="card p-8 border border-border/50 hover:border-accent hover:shadow-xl transition-all duration-300 group">
                <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300 text-accent">{feature.icon}</div>
                <h3 className="text-xl font-display font-bold mb-3 text-text-light">{feature.title}</h3>
                <p className="text-text-dark leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-20 bg-secondary border-b border-border">
        <div className="container max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-text-light mb-4">
              Endorsed by Elite Event-Goers
            </h2>
            <p className="text-text-dark text-lg max-w-2xl mx-auto">Hear what our discerning community has to say about their PartyTime Africa experience.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="card p-8 border border-border/50 hover:border-accent transition-all duration-300">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-accent text-xl">⭐</span>
                  ))}
                </div>
                <p className="text-text-light mb-4 italic text-lg">"{testimonial.quote}"</p>
                <div>
                  <p className="font-semibold text-accent text-lg">{testimonial.author}</p>
                  <p className="text-text-dark text-sm">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-accent/10 to-accent/5 border-b border-border">
        <div className="container max-w-4xl mx-auto px-4 md:px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-text-light mb-4">
            Ready to Elevate Your Experience?
          </h2>
          <p className="text-text-light mb-8 text-lg">
            Join our exclusive community and start discovering or creating unforgettable events today.
          </p>
          <Link href="/auth/signup" className="btn btn-primary px-10 py-4 text-lg font-semibold">
            Join the Elite
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-primary border-t border-border text-center">
        <div className="container max-w-6xl mx-auto px-4 md:px-6">
          <p className="text-text-dark mb-6">© 2026 PartyTime Africa. All rights reserved.</p>
          <div className="flex justify-center gap-6 flex-wrap">
            <Link href="/terms" className="text-text-dark hover:text-accent transition-colors">Terms</Link>
            <Link href="/privacy" className="text-text-dark hover:text-accent transition-colors">Privacy</Link>
            <Link href="/contact" className="text-text-dark hover:text-accent transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
