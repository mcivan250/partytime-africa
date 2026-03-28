'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import LuxuryCheckout from '@/components/LuxuryCheckout';

export default function EventDetailPage() {
  const router = useRouter();
  const { id, ref, moment_id } = router.query;
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchEvent = async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setEvent(data);
      } catch (error) {
        console.error('Error fetching event:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="text-text-light text-xl font-display">Loading event...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="text-text-light text-xl font-display">Event not found</div>
      </div>
    );
  }

  const tiers = event.ticket_tiers || [];
  const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="min-h-screen bg-primary text-text-light">
      {/* Navigation */}
      <nav className="bg-secondary border-b border-border sticky top-0 z-50">
        <div className="container max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <button
            onClick={() => router.back()}
            className="text-accent hover:text-yellow-300 transition-colors"
          >
            ← Back
          </button>
          <div className="text-2xl font-display font-bold text-accent">
            Party Time Africa
          </div>
          <div className="w-20"></div>
        </div>
      </nav>

      {/* Event Header */}
      <section className="bg-secondary border-b border-border py-12">
        <div className="container max-w-6xl mx-auto px-6">
          <h1 className="text-5xl font-display font-bold mb-4">{event.title}</h1>
          <div className="flex flex-col md:flex-row gap-6 text-text-dark">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📅</span>
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">📍</span>
              <span>{event.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎫</span>
              <span>{tiers.length} Ticket Types Available</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Event Details */}
          <div className="lg:col-span-2">
            <div className="card p-8">
              <h2 className="text-3xl font-display font-bold mb-6">About This Event</h2>
              <p className="text-text-light leading-relaxed mb-8">
                {event.description}
              </p>

              {/* Event Stats */}
              <div className="grid grid-cols-2 gap-6 py-8 border-t border-border">
                <div>
                  <p className="text-text-dark text-sm mb-2">Total Capacity</p>
                  <p className="text-3xl font-bold text-accent">
                    {event.total_capacity || tiers.reduce((sum: number, t: any) => sum + t.capacity, 0)}
                  </p>
                </div>
                <div>
                  <p className="text-text-dark text-sm mb-2">Currency</p>
                  <p className="text-3xl font-bold text-accent">{event.currency}</p>
                </div>
              </div>

              {/* Ticket Tiers Preview */}
              <div className="py-8 border-t border-border">
                <h3 className="text-2xl font-display font-bold mb-6">Available Tickets</h3>
                <div className="space-y-4">
                  {tiers.map((tier: any) => (
                    <div key={tier.id} className="bg-primary border border-border p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-lg font-bold">{tier.name}</h4>
                        <span className="text-accent font-bold text-lg">
                          {event.currency} {tier.price.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-text-dark text-sm mb-2">{tier.description}</p>
                      <p className="text-text-dark text-xs">
                        Capacity: {tier.capacity} | Available: {Math.max(0, tier.capacity - (tier.sold || 0))}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Checkout Sidebar */}
          <div className="lg:col-span-1">
            <LuxuryCheckout
              eventId={event.id}
              eventName={event.title}
              eventDate={event.date}
              eventLocation={event.location}
              tiers={tiers}
              currency={event.currency}
              affiliateRef={ref as string}
              affiliateMomentId={moment_id as string}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
