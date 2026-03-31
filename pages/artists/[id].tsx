import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import ArtistEPKProfile from '@/components/ArtistEPKProfile';

interface Artist {
  id: string;
  name: string;
  bio: string;
  genre: string[];
  profileImage: string;
  coverImage: string;
  socialLinks: {
    instagram?: string;
    spotify?: string;
    soundcloud?: string;
    youtube?: string;
  };
  keyHighlights: Array<{
    id: string;
    title: string;
    description: string;
    date: string;
    type: 'residency' | 'festival' | 'performance' | 'award';
  }>;
  bookingRate: number;
  availability: string;
  pastPerformances: number;
  rating: number;
  reviews: number;
}

export default function ArtistProfilePage() {
  const router = useRouter();
  const { id } = router.query;
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchArtist(id as string);
    }
  }, [id]);

  const fetchArtist = async (artistId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('artists')
        .select('*')
        .eq('id', artistId)
        .single();

      if (error) throw error;

      // Transform data to match interface
      const artistData: Artist = {
        id: data.id,
        name: data.name,
        bio: data.bio || '',
        genre: data.genre || [],
        profileImage: data.profile_image || '/images/artist-placeholder.jpg',
        coverImage: data.cover_image || '/images/cover-placeholder.jpg',
        socialLinks: data.social_links || {},
        keyHighlights: data.key_highlights || [],
        bookingRate: data.booking_rate || 500000,
        availability: data.availability || 'Available for bookings',
        pastPerformances: data.past_performances || 0,
        rating: data.rating || 4.8,
        reviews: data.reviews || 0,
      };

      setArtist(artistData);
    } catch (error) {
      console.error('Error fetching artist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = () => {
    setBookingModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent mb-4"></div>
          <p className="text-text-light">Loading artist profile...</p>
        </div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center flex-col gap-4">
        <div className="text-5xl">🎤</div>
        <h2 className="text-2xl font-bold text-text-light">Artist not found</h2>
        <button
          onClick={() => router.push('/artists')}
          className="text-accent hover:underline"
        >
          Browse Artists →
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary pb-12">
      <ArtistEPKProfile artist={artist} onBooking={handleBooking} />

      {/* Booking Modal */}
      {bookingModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-secondary rounded-2xl border border-border max-w-md w-full p-8">
            <h2 className="text-2xl font-display font-bold text-text-light mb-4">Book {artist.name}</h2>
            <p className="text-text-dark mb-6">
              Send a booking request to {artist.name}. They will review your event details and get back to you within 24 hours.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-text-light font-semibold mb-2">Event Name</label>
                <input
                  type="text"
                  placeholder="Your event name"
                  className="w-full p-3 rounded-lg border border-border bg-primary text-text-light placeholder-text-dark"
                />
              </div>
              <div>
                <label className="block text-text-light font-semibold mb-2">Event Date</label>
                <input
                  type="date"
                  className="w-full p-3 rounded-lg border border-border bg-primary text-text-light"
                />
              </div>
              <div>
                <label className="block text-text-light font-semibold mb-2">Event Location</label>
                <input
                  type="text"
                  placeholder="Venue address"
                  className="w-full p-3 rounded-lg border border-border bg-primary text-text-light placeholder-text-dark"
                />
              </div>
              <div>
                <label className="block text-text-light font-semibold mb-2">Special Requests</label>
                <textarea
                  placeholder="Any special requirements or notes..."
                  className="w-full p-3 rounded-lg border border-border bg-primary text-text-light placeholder-text-dark resize-none"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setBookingModalOpen(false)}
                className="flex-1 bg-border hover:bg-border/80 text-text-light font-bold py-3 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setBookingModalOpen(false);
                  alert('Booking request sent! The artist will contact you soon.');
                }}
                className="flex-1 bg-accent hover:bg-accent/90 text-primary font-bold py-3 rounded-lg transition-colors"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
