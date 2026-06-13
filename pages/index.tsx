import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import Navigation from '../components/Navigation';

export default function HomePage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchEvents();
    
    // Global error listener for debugging Safari mobile
    window.onerror = function(message, source, lineno, colno, error) {
      console.error("GLOBAL ERROR:", message, "at", source, lineno, colno);
      return false;
    };
  }, []);

  async function fetchEvents() {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return <div className="min-h-screen bg-primary" />;

  return (
    <div className="min-h-screen bg-primary pb-24 text-white">
      <Head>
        <title>PartyTime Africa | Your Night, Elevated.</title>
      </Head>

      {/* Header */}
      <div className="p-6 flex justify-between items-center sticky top-0 bg-primary/80 backdrop-blur-xl z-50">
        <div>
          <h1 className="text-2xl font-black italic tracking-tighter">
            partytime<span className="text-accent">.africa</span>
          </h1>
          <p className="text-[8px] text-text-dark font-bold uppercase tracking-[0.2em]">Your Night, Elevated.</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-12 text-center">
        <h2 className="text-4xl font-black mb-4 tracking-tighter leading-none">THE VIBE IS LIVE.</h2>
        <p className="text-text-dark text-sm mb-8">Discover the most exclusive events in Kampala.</p>
        <Link href="/discover" className="luxury-button inline-block">Explore Now</Link>
      </div>

      {/* Trending Events */}
      <div className="px-6 mb-12">
        <h3 className="text-text-dark text-[10px] font-black uppercase tracking-[0.3em] mb-6">Trending Now</h3>
        <div className="space-y-6">
          {loading ? (
            <div className="w-full aspect-video bg-secondary rounded-3xl animate-pulse" />
          ) : (
            events.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`} className="block relative rounded-[2rem] overflow-hidden aspect-video group shadow-2xl">
                <img 
                  src={event.image_url || 'https://images.unsplash.com/photo-1514525253344-99a429996592?w=800'} 
                  alt={event.title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 text-left">
                  <h4 className="text-white font-black text-xl mb-1">{event.title}</h4>
                  <p className="text-text-dark text-xs">{event.location_address}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      <Navigation />
    </div>
  );
}

// Forced change to trigger git detection
