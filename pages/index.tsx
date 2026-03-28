'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-primary text-text-light">
      {/* Navigation */}
      <nav className="bg-secondary border-b border-border sticky top-0 z-50">
        <div className="container max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-display font-bold text-accent">
            Party Time Africa
          </div>
          <div className="flex gap-4">
            {user ? (
              <>
                <Link href="/dashboard" className="btn btn-secondary px-6 py-2">
                  Dashboard
                </Link>
                <Link href="/events/create-with-tiers" className="btn btn-primary px-6 py-2">
                  Create Event
                </Link>
              </>
            ) : (
              <>
                <button className="btn btn-secondary px-6 py-2">Sign In</button>
                <button className="btn btn-primary px-6 py-2">Get Started</button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container max-w-6xl mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-display font-bold mb-6 text-accent">
          Celebrate in Style
        </h1>
        <p className="text-xl text-text-dark mb-12 max-w-2xl mx-auto">
          Create unforgettable events with premium ticketing, affiliate rewards, and real-time analytics. 
          The platform for Africa's most exclusive celebrations.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/events/create-with-tiers" className="btn btn-primary px-8 py-4 text-lg">
            🚀 Create Your Event
          </Link>
          <button className="btn btn-secondary px-8 py-4 text-lg">
            Explore Events
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-secondary py-20 border-y border-border">
        <div className="container max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-display font-bold text-center mb-16">
            Premium Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="card p-8 text-center">
              <div className="text-5xl mb-4">🎫</div>
              <h3 className="text-2xl font-display font-bold mb-4">Multi-Tier Pricing</h3>
              <p className="text-text-dark">
                Create unlimited ticket types—VIP, Early Bird, Tables—with precise inventory control and dynamic pricing.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card p-8 text-center">
              <div className="text-5xl mb-4">💰</div>
              <h3 className="text-2xl font-display font-bold mb-4">Affiliate Rewards</h3>
              <p className="text-text-dark">
                Turn attendees into promoters. Earn Party Points for every referral and redeem for discounts on future events.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card p-8 text-center">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-2xl font-display font-bold mb-4">Real-Time Analytics</h3>
              <p className="text-text-dark">
                Track check-ins, guest demographics, top moments, and affiliate performance in real-time dashboards.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="card p-8 text-center">
              <div className="text-5xl mb-4">🎟️</div>
              <h3 className="text-2xl font-display font-bold mb-4">Premium Digital Passes</h3>
              <p className="text-text-dark">
                Luxury membership-style tickets with QR codes, downloadable passes, and instant calendar integration.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="card p-8 text-center">
              <div className="text-5xl mb-4">📸</div>
              <h3 className="text-2xl font-display font-bold mb-4">Event Moments</h3>
              <p className="text-text-dark">
                Guests share photos and videos from your event. Earn affiliate rewards when their posts drive ticket sales.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="card p-8 text-center">
              <div className="text-5xl mb-4">🌍</div>
              <h3 className="text-2xl font-display font-bold mb-4">Multi-Currency</h3>
              <p className="text-text-dark">
                Sell tickets in UGX, KES, NGN, GHS, USD, and more. Perfect for pan-African celebrations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-display font-bold text-center mb-16">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-accent text-primary rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              1
            </div>
            <h3 className="text-xl font-display font-bold mb-2">Create Event</h3>
            <p className="text-text-dark text-sm">
              Set up your event with multi-tier pricing in minutes.
            </p>
          </div>

          {/* Step 2 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-accent text-primary rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              2
            </div>
            <h3 className="text-xl font-display font-bold mb-2">Share & Promote</h3>
            <p className="text-text-dark text-sm">
              Get affiliate links for every event moment and earn rewards.
            </p>
          </div>

          {/* Step 3 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-accent text-primary rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              3
            </div>
            <h3 className="text-xl font-display font-bold mb-2">Sell Tickets</h3>
            <p className="text-text-dark text-sm">
              Guests purchase premium digital passes instantly.
            </p>
          </div>

          {/* Step 4 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-accent text-primary rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              4
            </div>
            <h3 className="text-xl font-display font-bold mb-2">Analyze & Grow</h3>
            <p className="text-text-dark text-sm">
              Track performance and scale with real-time insights.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-secondary py-20 border-t border-border">
        <div className="container max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-display font-bold mb-6">
            Ready to Host Your Next Celebration?
          </h2>
          <p className="text-lg text-text-dark mb-8">
            Join thousands of organizers creating unforgettable African celebrations with Party Time Africa.
          </p>
          <Link href="/events/create-with-tiers" className="btn btn-primary px-8 py-4 text-lg">
            Create Event Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary border-t border-border py-12">
        <div className="container max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-lg font-display font-bold text-accent mb-4">Party Time Africa</h4>
              <p className="text-text-dark text-sm">
                The premier platform for African celebrations.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-text-dark text-sm">
                <li><a href="#" className="hover:text-accent">Features</a></li>
                <li><a href="#" className="hover:text-accent">Pricing</a></li>
                <li><a href="#" className="hover:text-accent">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-text-dark text-sm">
                <li><a href="#" className="hover:text-accent">About</a></li>
                <li><a href="#" className="hover:text-accent">Blog</a></li>
                <li><a href="#" className="hover:text-accent">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-text-dark text-sm">
                <li><a href="#" className="hover:text-accent">Privacy</a></li>
                <li><a href="#" className="hover:text-accent">Terms</a></li>
                <li><a href="#" className="hover:text-accent">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-text-dark text-sm">
            <p>&copy; 2026 Party Time Africa. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
