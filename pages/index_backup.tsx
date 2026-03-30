'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-primary text-text-light overflow-x-hidden">
      {/* Navigation */}
      <nav className="bg-secondary border-b border-border sticky top-0 z-50">
        <div className="container max-w-6xl mx-auto px-4 md:px-6 py-4 flex justify-between items-center">
          <div className="text-xl md:text-2xl font-display font-bold text-accent">
            Party Time Africa
          </div>
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

      {/* Hero Section */}
      <section id="home" className="container max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-20 text-center">
        <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 text-accent leading-tight">
          Celebrate in Style
        </h1>
        <p className="text-lg md:text-xl text-text-dark mb-10 md:12 max-w-2xl mx-auto">
          Create unforgettable events with premium ticketing, affiliate rewards, and real-time analytics.
          The platform for Africa's most exclusive celebrations.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/events/create-with-tiers" className="btn btn-primary px-8 py-4 text-lg w-full sm:w-auto text-center">
            🚀 Create Your Event
          </Link>
          <Link href="/events" className="btn btn-secondary px-8 py-4 text-lg w-full sm:w-auto text-center">
            Explore Events
          </Link>
        </div>
      </section>

      {/* Stats Bar */}
      <div className="bg-primary py-10 border-y border-border/50">
        <div className="container max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-3xl md:text-4xl font-bold text-accent mb-2">5K+</div>
            <div className="text-text-dark uppercase tracking-widest text-sm">Active Users</div>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-bold text-accent mb-2">150+</div>
            <div className="text-text-dark uppercase tracking-widest text-sm">Events This Month</div>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-bold text-accent mb-2">50K+</div>
            <div className="text-text-dark uppercase tracking-widest text-sm">Guests Connected</div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="bg-secondary py-16 md:py-20 border-b border-border">
        <div className="container max-w-6xl mx-auto px-4 md:px-6">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-12 md:16 text-accent">
            Premium Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card p-8 text-center border border-border/50 hover:border-accent transition-all duration-300">
              <div className="text-5xl mb-4">🎫</div>
              <h3 className="text-2xl font-display font-bold mb-4">Multi-Tier Pricing</h3>
              <p className="text-text-dark">
                Create unlimited ticket types—VIP, Early Bird, Tables—with precise inventory control.
              </p>
            </div>
            <div className="card p-8 text-center border border-border/50 hover:border-accent transition-all duration-300">
              <div className="text-5xl mb-4">💎</div>
              <h3 className="text-2xl font-display font-bold mb-4">Affiliate System</h3>
              <p className="text-text-dark">
                Let your community sell for you. Track referrals and reward top performers automatically.
              </p>
            </div>
            <div className="card p-8 text-center border border-border/50 hover:border-accent transition-all duration-300">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-2xl font-display font-bold mb-4">Real-time Analytics</h3>
              <p className="text-text-dark">
                Monitor ticket sales, revenue, and guest check-ins with our premium dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-primary border-t border-border text-center">
        <p className="text-text-dark mb-4">© 2026 Party Time Africa. All rights reserved.</p>
        <div className="flex justify-center gap-6">
          <Link href="/terms" className="text-text-dark hover:text-accent">Terms</Link>
          <Link href="/privacy" className="text-text-dark hover:text-accent">Privacy</Link>
          <Link href="/contact" className="text-text-dark hover:text-accent">Contact</Link>
        </div>
      </footer>
    </div>
  );
}
