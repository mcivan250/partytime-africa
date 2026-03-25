'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BRUNCH_THEMES, getDayName } from '@/lib/booking-types';
import { formatCurrency } from '@/lib/payment-types';

export default function BrunchPage() {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Demo brunch events
  const brunches = [
    {
      id: '1',
      title: 'Bottomless Brunch',
      venue: 'Sky Lounge Kampala',
      day: 0, // Sunday
      time: '11:00 AM - 3:00 PM',
      price: 3000, // $30
      theme: 'afrobeat',
      includes: ['Unlimited drinks (2h)', 'Buffet', 'Afrobeat DJ', 'Games'],
      image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
    },
    {
      id: '2',
      title: 'Jazz Brunch',
      venue: 'Fusion Lounge',
      day: 0, // Sunday
      time: '12:00 PM - 4:00 PM',
      price: 4000, // $40
      theme: 'jazz',
      includes: ['Live jazz band', 'À la carte', 'Premium cocktails', 'Rooftop seating'],
      image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800',
    },
    {
      id: '3',
      title: 'Caribbean Brunch',
      venue: 'The Brunch Spot',
      day: 6, // Saturday
      time: '10:00 AM - 2:00 PM',
      price: 3500, // $35
      theme: 'caribbean',
      includes: ['Caribbean cuisine', 'Rum punch', 'Reggae DJ', 'Beach vibes'],
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
    },
  ];

  const filteredBrunches = selectedDay !== null
    ? brunches.filter((b) => b.day === selectedDay)
    : brunches;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200')",
          }}
        />
        <div className="relative bg-gradient-to-r from-orange-600/90 to-pink-600/90 text-white py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="text-6xl mb-4">🥂</div>
            <h1 className="text-6xl font-bold mb-6">Brunch in Kampala</h1>
            <p className="text-2xl text-orange-100 mb-8">
              Unlimited vibes. Unlimited drinks. Unlimited memories.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full">
                ✓ Every Weekend
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full">
                ✓ From $30/person
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full">
                ✓ Book in Advance
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Day Filter */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Browse by Day
          </h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedDay(null)}
              className={`px-6 py-3 rounded-full font-medium transition ${
                selectedDay === null
                  ? 'bg-orange-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              All Days
            </button>
            {[0, 6].map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-6 py-3 rounded-full font-medium transition ${
                  selectedDay === day
                    ? 'bg-orange-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {getDayName(day)}
              </button>
            ))}
          </div>
        </div>

        {/* Brunch Events */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredBrunches.map((brunch) => {
            const themeData = BRUNCH_THEMES.find((t) => t.id === brunch.theme);
            return (
              <Link
                key={brunch.id}
                href={`/brunch/${brunch.id}`}
                className="bg-white rounded-3xl shadow-lg overflow-hidden hover:shadow-2xl transition group"
              >
                <div className="relative h-56 overflow-hidden">
                  <div
                    className="w-full h-full bg-cover bg-center group-hover:scale-110 transition duration-500"
                    style={{ backgroundImage: `url(${brunch.image})` }}
                  />
                  <div className="absolute top-4 left-4 bg-white px-4 py-2 rounded-full font-bold text-gray-900">
                    {getDayName(brunch.day)}s
                  </div>
                  <div className="absolute bottom-4 right-4 bg-orange-600 text-white px-4 py-2 rounded-full font-bold text-lg">
                    {formatCurrency(brunch.price)}
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-2xl">{themeData?.emoji}</span>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {brunch.title}
                    </h3>
                  </div>

                  <p className="text-gray-600 font-medium mb-2">
                    📍 {brunch.venue}
                  </p>
                  <p className="text-gray-600 mb-4">🕐 {brunch.time}</p>

                  <div className="space-y-2 mb-6">
                    {brunch.includes.map((item, i) => (
                      <div key={i} className="flex items-center text-sm text-gray-700">
                        <span className="text-green-600 mr-2">✓</span>
                        {item}
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <button className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 transition">
                      Book Your Spot →
                    </button>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* How It Works */}
        <div className="mt-20">
          <h2 className="text-4xl font-bold text-center mb-12">How Brunch Booking Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
                1️⃣
              </div>
              <h3 className="text-xl font-bold mb-2">Choose Your Brunch</h3>
              <p className="text-gray-600">
                Browse brunches by day, theme, or venue. See what's included.
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
                2️⃣
              </div>
              <h3 className="text-xl font-bold mb-2">Book & Pay</h3>
              <p className="text-gray-600">
                Select date, party size, and pay. Installments available!
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
                3️⃣
              </div>
              <h3 className="text-xl font-bold mb-2">Show Up & Turn Up</h3>
              <p className="text-gray-600">
                Get confirmation code. Show at venue. Enjoy unlimited vibes.
              </p>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="mt-20 bg-white rounded-3xl p-12">
          <h2 className="text-3xl font-bold mb-8">Brunch FAQs</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-lg mb-2">What does "bottomless" mean?</h3>
              <p className="text-gray-600">
                Unlimited drinks (usually 2 hours) included in your ticket price. Refills on mimosas, cocktails, or whatever the venue offers!
              </p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">Can I pay in installments?</h3>
              <p className="text-gray-600">
                Yes! Most brunch events accept 2-3 payment installments. Pay 35% now, rest before the event.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">What if I need to cancel?</h3>
              <p className="text-gray-600">
                Most venues allow cancellation 24-48 hours before for a full refund. Check the specific brunch's policy when booking.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">Is there a dress code?</h3>
              <p className="text-gray-600">
                Varies by venue. Most brunches are smart casual. Check the event details or venue page for specifics.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
