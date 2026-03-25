'use client';

import { useState } from 'react';
import Link from 'next/link';
import { VENUE_TYPES } from '@/lib/booking-types';

export default function VenuesPage() {
  const [selectedType, setSelectedType] = useState<string | null>(null);

  // Demo venues
  const venues = [
    {
      id: '1',
      name: 'Sky Lounge Kampala',
      type: 'rooftop',
      address: 'Kololo, Kampala',
      cover: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800',
      rating: 4.8,
      features: ['Rooftop Views', 'Live DJ', 'Cocktails'],
      minSpend: 50,
    },
    {
      id: '2',
      name: 'The Brunch Spot',
      type: 'restaurant',
      address: 'Ntinda, Kampala',
      cover: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
      rating: 4.6,
      features: ['Bottomless Brunch', 'Live Music', 'Buffet'],
      minSpend: 30,
    },
    {
      id: '3',
      name: 'Fusion Lounge & Bar',
      type: 'lounge',
      address: 'Bugolobi, Kampala',
      cover: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
      rating: 4.7,
      features: ['VIP Booths', 'Hookah', 'Premium Drinks'],
      minSpend: 100,
    },
  ];

  const filteredVenues = selectedType
    ? venues.filter((v) => v.type === selectedType)
    : venues;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold mb-4">Book Your Table</h1>
          <p className="text-xl text-purple-100">
            Reserve tables at Kampala's hottest bars, lounges & brunches
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Filters */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Browse by Type
          </h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedType(null)}
              className={`px-6 py-3 rounded-full font-medium transition ${
                selectedType === null
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              All Venues
            </button>
            {VENUE_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`px-6 py-3 rounded-full font-medium transition ${
                  selectedType === type.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {type.icon} {type.name}
              </button>
            ))}
          </div>
        </div>

        {/* Venues Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVenues.map((venue) => (
            <Link
              key={venue.id}
              href={`/venues/${venue.id}`}
              className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition group"
            >
              <div className="relative h-48 overflow-hidden">
                <div
                  className="w-full h-full bg-cover bg-center group-hover:scale-110 transition duration-300"
                  style={{ backgroundImage: `url(${venue.cover})` }}
                />
                <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-sm font-semibold">
                  ⭐ {venue.rating}
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {venue.name}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  📍 {venue.address}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {venue.features.map((feature, i) => (
                    <span
                      key={i}
                      className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full"
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-sm text-gray-600">
                    From ${venue.minSpend} min spend
                  </span>
                  <span className="text-purple-600 font-semibold group-hover:translate-x-1 transition">
                    Book Now →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Brunch Section */}
        <div className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Sunday Brunch Events
              </h2>
              <p className="text-gray-600">
                Unlimited vibes, unlimited drinks, unlimited memories
              </p>
            </div>
            <Link
              href="/brunch"
              className="text-purple-600 font-semibold hover:underline"
            >
              View All Brunches →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-orange-400 to-pink-500 rounded-2xl p-8 text-white shadow-xl">
              <div className="text-4xl mb-4">🥂</div>
              <h3 className="text-2xl font-bold mb-2">Bottomless Brunch</h3>
              <p className="text-white/90 mb-4">
                Every Sunday • 11 AM - 3 PM
              </p>
              <ul className="space-y-2 mb-6 text-sm">
                <li>✓ Unlimited drinks (2 hours)</li>
                <li>✓ Afrobeat DJ set</li>
                <li>✓ Buffet included</li>
                <li>✓ Games & activities</li>
              </ul>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">$30/person</span>
                <Link
                  href="/brunch/bottomless"
                  className="bg-white text-orange-600 px-6 py-3 rounded-full font-semibold hover:bg-orange-50 transition"
                >
                  Book Now
                </Link>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
              <div className="text-4xl mb-4">🎷</div>
              <h3 className="text-2xl font-bold mb-2">Jazz Brunch</h3>
              <p className="text-white/90 mb-4">
                Every Sunday • 12 PM - 4 PM
              </p>
              <ul className="space-y-2 mb-6 text-sm">
                <li>✓ Live jazz band</li>
                <li>✓ Premium cocktails</li>
                <li>✓ À la carte menu</li>
                <li>✓ Rooftop seating</li>
              </ul>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">$40/person</span>
                <Link
                  href="/brunch/jazz"
                  className="bg-white text-purple-600 px-6 py-3 rounded-full font-semibold hover:bg-purple-50 transition"
                >
                  Book Now
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Own a Venue?</h2>
          <p className="text-xl text-purple-100 mb-8">
            List your bar, lounge, or restaurant on Party Time Africa
          </p>
          <Link
            href="/venues/add"
            className="inline-block bg-white text-purple-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-purple-50 transition"
          >
            List Your Venue
          </Link>
        </div>
      </div>
    </div>
  );
}
