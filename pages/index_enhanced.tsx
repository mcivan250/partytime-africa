'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface EventStats {
  totalEvents: number;
  totalUsers: number;
  totalRSVPs: number;
}

export default function HomePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<EventStats>({
    totalEvents: 150,
    totalUsers: 5000,
    totalRSVPs: 50000,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: events } = await supabase.from('events').select('id', { count: 'exact' });
      const { data: users } = await supabase.from('users').select('id', { count: 'exact' });
      
      setStats({
        totalEvents: events?.length || 150,
        totalUsers: users?.length || 5000,
        totalRSVPs: 50000, // This would come from RSVPs table if it exists
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
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
    <div className="min-h-screen bg-primary text-text-light overflow-x-hidden">
      {/* Navigation */}
      <nav className="bg-secondary border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
        <div className="container max-w-6xl mx-auto px-4 md:px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl md:text-2xl font-display font-bold text-accent hover:text-yellow-300 transition-colors">
            🎉 Party Time Africa
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

      {/* Hero Section - Partiful Inspired */}
      <section className="relative bg-gradient-to-br from-secondary via-primary to-secondary py-16 md:py-24 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent rounded-full blur-3xl"></div>
        </div>

        <div className="container max-w-6xl mx-auto px-4 md:px-6 relative z-10">
          <div className="text-center mb-12">
            <div className="inline-block mb-4 px-4 py-2 bg-accent bg-opacity-10 rounded-full border border-accent border-opacity-30">
              <span className="text-accent text-sm font-semibold">✨ 100K+ Ratings</span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold mb-6 text-accent leading-tight">
              Celebrate in Style
            </h1>
            <p className="text-lg md:text-xl text-text-dark mb-8 md:mb-12 max-w-3xl mx-auto leading-relaxed">
              The easiest way to discover, create, and manage unforgettable events. Premium ticketing, affiliate rewards, and real-time analytics—all in one platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/events/create-with-tiers" className="btn btn-primary px-8 py-4 text-lg w-full sm:w-auto text-center font-semibold hover:scale-105 transition-transform">
                🚀 Create Your Event
              </Link>
              <Link href="/events" className="btn btn-secondary px-8 py-4 text-lg w-full sm:w-auto text-center font-semibold hover:bg-border transition-colors">
                Explore Events
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof - Stats Bar */}
      <div className="bg-primary py-12 md:py-16 border-y border-border/50">
        <div className="container max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 text-center">
          <div className="group hover:scale-105 transition-transform">
            <div className="text-4xl md:text-5xl font-bold text-accent mb-2">{stats.totalEvents}+</div>
            <div className="text-text-dark uppercase tracking-widest text-sm font-semibold">Events This Month</div>
          </div>
          <div className="group hover:scale-105 transition-transform">
            <div className="text-4xl md:text-5xl font-bold text-accent mb-2">{stats.totalUsers}K+</div>
            <div className="text-text-dark uppercase tracking-widest text-sm font-semibold">Active Users</div>
          </div>
          <div className="group hover:scale-105 transition-transform">
            <div className="text-4xl md:text-5xl font-bold text-accent mb-2">{stats.totalRSVPs}K+</div>
            <div className="text-text-dark uppercase tracking-widest text-sm font-semibold">Guests Connected</div>
          </div>
        </div>
      </div>

      {/* Trending Events Section */}
      <section className="py-16 md:py-20 bg-secondary border-b border-border">
        <div className="container max-w-6xl mx-auto px-4 md:px-6">
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-accent mb-2">Trending Now 🔥</h2>
            <p className="text-text-dark">The hottest events happening in Kampala right now</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-0 overflow-hidden hover:border-accent transition-all duration-300 group cursor-pointer">
                <div className="h-40 bg-gradient-to-br from-accent to-yellow-600 flex items-center justify-center relative">
                  <div className="text-5xl">🎉</div>
                  <div className="absolute top-3 right-3 bg-black bg-opacity-70 px-3 py-1 rounded text-accent text-sm font-bold">
                    MAR 30
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-display font-bold mb-2">Event Title</h3>
                  <p className="text-text-dark text-sm mb-4">Discover the best nightlife experience...</p>
                  <div className="text-accent font-semibold text-sm">View Details →</div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/events" className="btn btn-primary px-8 py-3">
              Explore All Events
            </Link>
          </div>
        </div>
      </section>

      {/* Premium Features Section */}
      <section className="py-16 md:py-20 bg-primary border-b border-border">
        <div className="container max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-accent mb-4">
              Powerful Features, Easy to Use
            </h2>
            <p className="text-text-dark max-w-2xl mx-auto">
              Everything you need to create, manage, and discover unforgettable events
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <div key={idx} className="card p-6 border border-border/50 hover:border-accent hover:shadow-lg transition-all duration-300 group">
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">{feature.icon}</div>
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
            <h2 className="text-3xl md:text-4xl font-display font-bold text-accent mb-4">
              Loved by Event Enthusiasts
            </h2>
            <p className="text-text-dark">See what our community has to say</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="card p-6 border border-border/50 hover:border-accent transition-all">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-accent">⭐</span>
                  ))}
                </div>
                <p className="text-text-light mb-4 italic">"{testimonial.quote}"</p>
                <div>
                  <p className="font-semibold text-accent">{testimonial.author}</p>
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
          <h2 className="text-3xl md:text-4xl font-display font-bold text-accent mb-4">
            Ready to Celebrate?
          </h2>
          <p className="text-text-light mb-8 text-lg">
            Join thousands of event enthusiasts discovering and creating amazing experiences
          </p>
          <Link href="/auth/signup" className="btn btn-primary px-8 py-4 text-lg font-semibold">
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-primary border-t border-border text-center">
        <div className="container max-w-6xl mx-auto px-4 md:px-6">
          <p className="text-text-dark mb-6">© 2026 Party Time Africa. All rights reserved.</p>
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
