import React, { useState } from 'react';
import Image from 'next/image';

interface KeyHighlight {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'residency' | 'festival' | 'performance' | 'award';
}

interface ArtistProfile {
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
  keyHighlights: KeyHighlight[];
  bookingRate: number;
  availability: string;
  pastPerformances: number;
  rating: number;
  reviews: number;
}

interface ArtistEPKProfileProps {
  artist: ArtistProfile;
  onBooking?: () => void;
}

export default function ArtistEPKProfile({ artist, onBooking }: ArtistEPKProfileProps) {
  const [activeTab, setActiveTab] = useState<'highlights' | 'bio' | 'bookings'>('highlights');

  const getHighlightIcon = (type: string) => {
    switch (type) {
      case 'residency':
        return '🏠';
      case 'festival':
        return '🎪';
      case 'performance':
        return '🎤';
      case 'award':
        return '🏆';
      default:
        return '⭐';
    }
  };

  return (
    <div className="w-full bg-primary">
      {/* Cover Image */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden rounded-b-2xl">
        <Image
          src={artist.coverImage}
          alt={artist.name}
          layout="fill"
          objectFit="cover"
          className="transition-transform duration-500 hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-transparent to-transparent"></div>
      </div>

      {/* Profile Section */}
      <div className="max-w-6xl mx-auto px-4 -mt-24 relative z-10 mb-12">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Profile Image */}
          <div className="flex-shrink-0">
            <div className="relative w-40 h-40 rounded-2xl overflow-hidden border-4 border-secondary shadow-2xl">
              <Image
                src={artist.profileImage}
                alt={artist.name}
                layout="fill"
                objectFit="cover"
              />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 pt-8">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-text-light mb-2">{artist.name}</h1>
            
            {/* Genres */}
            <div className="flex flex-wrap gap-2 mb-4">
              {artist.genre.map((g) => (
                <span key={g} className="bg-accent/20 text-accent px-3 py-1 rounded-full text-sm font-semibold">
                  {g}
                </span>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <p className="text-text-dark text-sm mb-1">Rating</p>
                <div className="flex items-center gap-1">
                  <span className="text-2xl font-bold text-accent">{artist.rating}</span>
                  <span className="text-lg">⭐</span>
                  <span className="text-text-dark text-sm">({artist.reviews})</span>
                </div>
              </div>
              <div>
                <p className="text-text-dark text-sm mb-1">Performances</p>
                <p className="text-2xl font-bold text-accent">{artist.pastPerformances}+</p>
              </div>
              <div>
                <p className="text-text-dark text-sm mb-1">Booking Rate</p>
                <p className="text-2xl font-bold text-accent">{(artist.bookingRate / 100000).toLocaleString()} UGX</p>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-3 mb-6">
              {artist.socialLinks.instagram && (
                <a
                  href={artist.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-accent/20 hover:bg-accent hover:text-primary text-accent p-3 rounded-lg transition-all"
                >
                  📷
                </a>
              )}
              {artist.socialLinks.spotify && (
                <a
                  href={artist.socialLinks.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-accent/20 hover:bg-accent hover:text-primary text-accent p-3 rounded-lg transition-all"
                >
                  🎵
                </a>
              )}
              {artist.socialLinks.soundcloud && (
                <a
                  href={artist.socialLinks.soundcloud}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-accent/20 hover:bg-accent hover:text-primary text-accent p-3 rounded-lg transition-all"
                >
                  ☁️
                </a>
              )}
              {artist.socialLinks.youtube && (
                <a
                  href={artist.socialLinks.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-accent/20 hover:bg-accent hover:text-primary text-accent p-3 rounded-lg transition-all"
                >
                  📺
                </a>
              )}
            </div>

            {/* CTA */}
            <button
              onClick={onBooking}
              className="bg-accent hover:bg-accent/90 text-primary font-bold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              💼 Book for Event
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-4 mb-8">
        <div className="flex gap-4 border-b border-border">
          {(['highlights', 'bio', 'bookings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 font-semibold transition-all ${
                activeTab === tab
                  ? 'text-accent border-b-2 border-accent'
                  : 'text-text-dark hover:text-text-light'
              }`}
            >
              {tab === 'highlights' && '✨ Key Highlights'}
              {tab === 'bio' && '📝 Bio'}
              {tab === 'bookings' && '📅 Availability'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        {/* Key Highlights */}
        {activeTab === 'highlights' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {artist.keyHighlights.map((highlight) => (
              <div key={highlight.id} className="bg-secondary rounded-xl border border-border p-6 hover:border-accent transition-all">
                <div className="flex items-start gap-4">
                  <span className="text-4xl">{getHighlightIcon(highlight.type)}</span>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-text-light mb-1">{highlight.title}</h3>
                    <p className="text-text-dark text-sm mb-2">{highlight.description}</p>
                    <p className="text-accent text-xs font-semibold">{highlight.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bio */}
        {activeTab === 'bio' && (
          <div className="bg-secondary rounded-xl border border-border p-8 max-w-3xl">
            <p className="text-text-light leading-relaxed text-lg">{artist.bio}</p>
          </div>
        )}

        {/* Availability */}
        {activeTab === 'bookings' && (
          <div className="bg-secondary rounded-xl border border-border p-8 max-w-3xl">
            <h3 className="text-2xl font-bold text-text-light mb-4">Availability</h3>
            <p className="text-text-light mb-6">{artist.availability}</p>
            
            <div className="bg-primary rounded-lg p-6 border border-border mb-6">
              <h4 className="text-lg font-bold text-text-light mb-4">Booking Details</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-text-dark">Booking Rate:</span>
                  <span className="text-accent font-bold">{(artist.bookingRate / 100000).toLocaleString()} UGX</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-dark">Minimum Duration:</span>
                  <span className="text-text-light font-semibold">2 hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-dark">Travel Included:</span>
                  <span className="text-text-light font-semibold">Within Kampala</span>
                </div>
              </div>
            </div>

            <button
              onClick={onBooking}
              className="w-full bg-accent hover:bg-accent/90 text-primary font-bold py-3 rounded-lg transition-all"
            >
              💼 Send Booking Request
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
