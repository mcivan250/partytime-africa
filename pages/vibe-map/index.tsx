'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  generateVibeMapData,
  getHottestVenues,
  getVenuesByVibeLevel,
  getVibeEmoji,
  getVibeColor,
  Venue,
  VibeData
} from '@/lib/vibe-map';

export default function VibeMapPage() {
  const { user } = useAuth();
  const [vibeData, setVibeData] = useState<VibeData | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [filterLevel, setFilterLevel] = useState<'all' | 'hot' | 'moderate' | 'chill'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVibeData();
    // Refresh vibe data every 30 seconds
    const interval = setInterval(fetchVibeData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchVibeData = () => {
    try {
      const data = generateVibeMapData();
      setVibeData(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching vibe data:', error);
      setLoading(false);
    }
  };

  if (loading || !vibeData) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  const filteredVenues = filterLevel === 'all'
    ? vibeData.venues
    : getVenuesByVibeLevel(vibeData.venues, filterLevel);

  const hottestVenues = getHottestVenues(filteredVenues);

  return (
    <div className="min-h-screen bg-primary text-text-light">
      {/* Header */}
      <div className="bg-secondary border-b border-border p-4 md:p-6 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between mb-4">
          <Link href="/dashboard" className="text-accent hover:text-yellow-300">
            ← Dashboard
          </Link>
          <h1 className="text-2xl font-display font-bold">🗺️ Vibe Map</h1>
          <button onClick={fetchVibeData} className="text-accent hover:text-yellow-300">
            🔄
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto">
          {(['all', 'hot', 'moderate', 'chill'] as const).map(level => (
            <button
              key={level}
              onClick={() => setFilterLevel(level)}
              className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap transition-all ${
                filterLevel === level
                  ? 'bg-accent text-primary'
                  : 'bg-border/30 text-text-dark hover:bg-border/50'
              }`}
            >
              {level === 'all' && '🌍 All'}
              {level === 'hot' && '🔥 Hot'}
              {level === 'moderate' && '🟡 Moderate'}
              {level === 'chill' && '🔵 Chill'}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Section */}
        <div className="lg:col-span-2 space-y-4">
          {/* Simple Map Visualization (SVG-based) */}
          <div className="card p-6 bg-secondary border-border/50 relative h-96 overflow-hidden">
            <svg className="w-full h-full" viewBox="0 0 400 300" style={{ background: '#0a1628' }}>
              {/* Background */}
              <rect width="400" height="300" fill="#0a1628" />

              {/* Grid */}
              <g stroke="#2a3a4e" strokeWidth="1" opacity="0.3">
                {[...Array(5)].map((_, i) => (
                  <line key={`v${i}`} x1={i * 100} y1="0" x2={i * 100} y2="300" />
                ))}
                {[...Array(4)].map((_, i) => (
                  <line key={`h${i}`} x1="0" y1={i * 100} x2="400" y2={i * 100} />
                ))}
              </g>

              {/* Venues */}
              {vibeData.venues.map((venue, idx) => {
                const x = ((venue.longitude - 32.5) * 100) + 100;
                const y = ((0.35 - venue.latitude) * 100) + 100;
                const color = venue.vibe_level === 'hot' ? '#FF4444' : venue.vibe_level === 'moderate' ? '#FFD700' : '#4488FF';
                const size = venue.vibe_level === 'hot' ? 20 : venue.vibe_level === 'moderate' ? 16 : 12;

                return (
                  <g
                    key={venue.id}
                    onClick={() => setSelectedVenue(venue)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Pulse effect for hot venues */}
                    {venue.vibe_level === 'hot' && (
                      <circle cx={x} cy={y} r={size + 8} fill={color} opacity="0.2">
                        <animate attributeName="r" from={size + 8} to={size + 20} dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" from="0.3" to="0" dur="2s" repeatCount="indefinite" />
                      </circle>
                    )}

                    {/* Venue marker */}
                    <circle cx={x} cy={y} r={size} fill={color} opacity="0.8" />
                    <circle cx={x} cy={y} r={size} fill="none" stroke={color} strokeWidth="2" opacity="0.5" />

                    {/* Label */}
                    <text
                      x={x}
                      y={y + 30}
                      textAnchor="middle"
                      fill="#fff"
                      fontSize="10"
                      fontWeight="bold"
                      pointerEvents="none"
                    >
                      {venue.name.substring(0, 10)}
                    </text>
                  </g>
                );
              })}

              {/* Legend */}
              <g transform="translate(10, 10)">
                <text x="0" y="0" fill="#fff" fontSize="12" fontWeight="bold">Legend:</text>
                <circle cx="0" cy="15" r="4" fill="#FF4444" />
                <text x="10" y="19" fill="#fff" fontSize="10">Hot</text>

                <circle cx="50" cy="15" r="4" fill="#FFD700" />
                <text x="60" y="19" fill="#fff" fontSize="10">Moderate</text>

                <circle cx="130" cy="15" r="4" fill="#4488FF" />
                <text x="140" y="19" fill="#fff" fontSize="10">Chill</text>
              </g>
            </svg>

            {/* Map Info */}
            <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-2 rounded text-xs text-text-dark">
              Kampala, Uganda • {vibeData.total_active_events} active events
            </div>
          </div>

          {/* Selected Venue Details */}
          {selectedVenue && (
            <div className="card p-6 bg-secondary border-accent/30">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-3xl">{selectedVenue.icon}</span>
                    <h3 className="text-2xl font-display font-bold">{selectedVenue.name}</h3>
                  </div>
                  <p className="text-text-dark text-sm">{selectedVenue.address}</p>
                </div>
                <button
                  onClick={() => setSelectedVenue(null)}
                  className="text-text-dark hover:text-text-light"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-text-dark text-xs uppercase mb-1">Vibe</p>
                  <p className="text-2xl font-bold">{getVibeEmoji(selectedVenue.vibe_level)}</p>
                  <p className="text-xs text-accent capitalize">{selectedVenue.vibe_level}</p>
                </div>
                <div className="text-center">
                  <p className="text-text-dark text-xs uppercase mb-1">Events</p>
                  <p className="text-2xl font-bold">{selectedVenue.active_events}</p>
                  <p className="text-xs text-text-dark">active</p>
                </div>
                <div className="text-center">
                  <p className="text-text-dark text-xs uppercase mb-1">RSVPs</p>
                  <p className="text-2xl font-bold">{selectedVenue.total_rsvps}</p>
                  <p className="text-xs text-text-dark">guests</p>
                </div>
              </div>

              <Link href="/events" className="btn btn-primary w-full text-center">
                View Events at {selectedVenue.name}
              </Link>
            </div>
          )}
        </div>

        {/* Venues List */}
        <div className="space-y-4">
          <h3 className="text-lg font-display font-bold px-2">
            {filterLevel === 'all' ? 'All Venues' : `${filterLevel.charAt(0).toUpperCase() + filterLevel.slice(1)} Venues`}
          </h3>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {hottestVenues.length === 0 ? (
              <div className="text-center p-6 text-text-dark">
                <p>No venues found</p>
              </div>
            ) : (
              hottestVenues.map(venue => (
                <button
                  key={venue.id}
                  onClick={() => setSelectedVenue(venue)}
                  className={`card p-4 w-full text-left border transition-all ${
                    selectedVenue?.id === venue.id
                      ? 'border-accent bg-accent/10'
                      : 'border-border/30 hover:border-accent/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{venue.icon}</span>
                      <h4 className="font-bold text-sm">{venue.name}</h4>
                    </div>
                    <span className="text-xl">{getVibeEmoji(venue.vibe_level)}</span>
                  </div>

                  {/* Vibe Bar */}
                  <div className="mb-2">
                    <div className="w-full h-2 bg-border/30 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all"
                        style={{
                          width: `${venue.vibe_score}%`,
                          backgroundColor: getVibeColor(venue.vibe_level)
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex justify-between text-xs text-text-dark">
                    <span>{venue.active_events} events</span>
                    <span>{venue.total_rsvps} RSVPs</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
