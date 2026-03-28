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
    <div className="max-w-4xl mx-auto p-6 bg-white min-h-screen">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-black text-purple-900 mb-2">Create New Event</h1>
        <p className="text-gray-500 font-medium">Set your details, pricing, and launch your celebration.</p>
      </header>

      <form onSubmit={handleCreateEvent} className="space-y-12">
        {/* Section 1: Basic Info */}
        <section className="bg-gray-50 p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
            Basic Event Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Event Title</label>
              <input
                type="text"
                required
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 outline-none transition-all"
                placeholder="e.g., Kampala Night Lights"
                value={eventData.title}
                onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Location</label>
              <input
                type="text"
                required
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 outline-none transition-all"
                placeholder="Venue name or address"
                value={eventData.location}
                onChange={(e) => setEventData({ ...eventData, location: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Date & Time</label>
              <input
                type="datetime-local"
                required
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 outline-none transition-all"
                value={eventData.date}
                onChange={(e) => setEventData({ ...eventData, date: e.target.value })}
              />
            </div>
            <div className="form-group md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Description</label>
              <textarea
                required
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 outline-none transition-all h-32 resize-none"
                placeholder="Tell guests what to expect..."
                value={eventData.description}
                onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
              />
            </div>
          </div>
        </section>

        {/* Section 2: Ticket Tiers */}
        <section className="bg-white p-8 rounded-3xl border-2 border-purple-100 shadow-xl shadow-purple-50">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
            Tickets & Pricing
          </h2>
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Currency</label>
            <select
              className="w-full md:w-1/3 p-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 outline-none transition-all"
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
        <div className="pt-6">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xl font-black rounded-3xl shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? 'Creating Your Event...' : '🚀 Launch Event & Start Selling'}
          </button>
        </div>
      </form>

      <footer className="mt-20 pb-10 text-center text-gray-400 text-sm">
        By creating an event, you agree to our Terms of Service.
      </footer>
    </div>
  );
}
