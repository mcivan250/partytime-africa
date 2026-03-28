
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import TicketTierManager from '@/components/TicketTierManager';

export default function CreateEventWithTiers() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [tiers, setTiers] = useState<any[]>([]);
  const [eventData, setEventData] = useState({
    title: '',
    description: '',
    location: '',
    date: '',
    currency: 'UGX',
    category: 'party',
  });

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert('Please login first');
    
    setLoading(true);
    try {
      const { data: event, error } = await supabase
        .from('events')
        .insert([
          {
            ...eventData,
            organizer_id: user.id,
            ticket_tiers: tiers,
            total_capacity: tiers.reduce((sum, t) => sum + Number(t.capacity), 0),
          },
        ])
        .select()
        .single();

      if (error) throw error;
      
      alert('Event created successfully with ticket tiers!');
      router.push(`/events/${event.id}`);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary text-text-light py-10">
      <div className="container max-w-2xl">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-display font-bold text-accent mb-2">Create New Event</h1>
          <p className="text-text-dark font-medium">Set your details, pricing, and launch your celebration.</p>
        </header>

        <form onSubmit={handleCreateEvent} className="space-y-8">
          {/* Section 1: Basic Info */}
          <section className="card p-8">
            <h2 className="text-2xl font-display font-bold text-text-light mb-6 flex items-center gap-3">
              <span className="bg-accent text-primary w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold">1</span>
              Basic Event Details
            </h2>
            <div className="space-y-5">
              <div className="form-group">
                <label className="form-label">Event Title</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g., Kampala Night Lights"
                  value={eventData.title}
                  onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Venue name or address"
                  value={eventData.location}
                  onChange={(e) => setEventData({ ...eventData, location: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  className="form-input"
                  value={eventData.date}
                  onChange={(e) => setEventData({ ...eventData, date: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  required
                  className="form-textarea"
                  placeholder="Tell guests what to expect..."
                  value={eventData.description}
                  onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
                />
              </div>
            </div>
          </section>

          {/* Section 2: Ticket Tiers */}
          <section className="card p-8">
            <h2 className="text-2xl font-display font-bold text-text-light mb-6 flex items-center gap-3">
              <span className="bg-accent text-primary w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold">2</span>
              Tickets & Pricing
            </h2>
            <div className="form-group mb-6">
              <label className="form-label">Currency</label>
              <select
                className="form-select w-full md:w-1/2"
                value={eventData.currency}
                onChange={(e) => setEventData({ ...eventData, currency: e.target.value })}
              >
                <option value="UGX">Ugandan Shilling (UGX)</option>
                <option value="KES">Kenyan Shilling (KES)</option>
                <option value="NGN">Nigerian Naira (NGN)</option>
                <option value="GHS">Ghanaian Cedi (GHS)</option>
                <option value="USD">US Dollar (USD)</option>
              </select>
            </div>
            
            <TicketTierManager 
              currency={eventData.currency}
              onTiersChange={setTiers}
            />
          </section>

          {/* Action Button */}
          <div className="pt-6 text-center">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-4 text-xl"
            >
              {loading ? 'Creating Your Event...' : '🚀 Launch Event & Start Selling'}
            </button>
          </div>
        </form>

        <footer className="mt-20 pb-10 text-center text-text-dark text-sm">
          By creating an event, you agree to our Terms of Service.
        </footer>
      </div>
    </div>
  );
}
