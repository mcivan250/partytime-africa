import React, { useState } from 'react';
import axios from 'axios';

interface BottlePackage {
  id: string;
  name: string;
  description: string;
  price: number;
  bottles: string[];
  includes: string[];
  icon: string;
}

interface VIPConciergeProps {
  eventId: string;
  onBookingComplete?: (bookingId: string) => void;
}

const bottlePackages: BottlePackage[] = [
  {
    id: 'bronze',
    name: 'Bronze Vibes',
    description: 'Perfect for small groups',
    price: 500000,
    bottles: ['1x Premium Vodka', '1x Champagne'],
    includes: ['VIP Table', 'Bottle Service', 'Priority Entry', 'Complimentary Mixers'],
    icon: '🥉',
  },
  {
    id: 'silver',
    name: 'Silver Nights',
    description: 'The popular choice',
    price: 1000000,
    bottles: ['2x Premium Vodka', '1x Champagne', '1x Hennessy'],
    includes: ['Premium VIP Table', 'Dedicated Server', 'Priority Entry', 'Complimentary Mixers', 'Table Sparklers'],
    icon: '🥈',
  },
  {
    id: 'gold',
    name: 'Gold Standard',
    description: 'Luxury experience',
    price: 2000000,
    bottles: ['3x Premium Vodka', '2x Champagne', '1x Hennessy', '1x Patron'],
    includes: [
      'Premium VIP Table',
      'Dedicated Server',
      'Priority Entry',
      'Complimentary Mixers',
      'Table Sparklers',
      'Bottle Parade',
      'DJ Shout-out',
    ],
    icon: '🥇',
  },
  {
    id: 'platinum',
    name: 'Platinum Elite',
    description: 'Ultimate VIP treatment',
    price: 5000000,
    bottles: ['5x Premium Vodka', '3x Champagne', '2x Hennessy', '2x Patron', '1x Cognac'],
    includes: [
      'Exclusive VIP Suite',
      'Personal Concierge',
      'Dedicated Server',
      'Priority Entry',
      'Complimentary Mixers',
      'Table Sparklers',
      'Bottle Parade',
      'DJ Shout-out',
      'Private Photo Session',
      'VIP Parking',
    ],
    icon: '💎',
  },
];

export default function VIPConcierge({ eventId, onBookingComplete }: VIPConciergeProps) {
  const [step, setStep] = useState<'select' | 'details' | 'payment'>('select');
  const [selectedPackage, setSelectedPackage] = useState<BottlePackage | null>(null);
  const [guestCount, setGuestCount] = useState(4);
  const [specialRequests, setSpecialRequests] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectPackage = (pkg: BottlePackage) => {
    setSelectedPackage(pkg);
    setStep('details');
  };

  const handleConfirmBooking = async () => {
    if (!selectedPackage) return;

    setLoading(true);
    setError(null);

    try {
      const { data } = await axios.post('/api/vip/book-concierge', {
        eventId,
        packageId: selectedPackage.id,
        guestCount,
        specialRequests,
        totalPrice: selectedPackage.price,
      });

      if (data.success) {
        setStep('payment');
        if (onBookingComplete) {
          onBookingComplete(data.bookingId);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="text-5xl font-display font-bold text-text-light mb-4">🍾 VIP Concierge</h1>
        <p className="text-text-dark text-lg max-w-2xl mx-auto">
          Elevate your night with premium bottle service, dedicated servers, and exclusive VIP treatment.
        </p>
      </div>

      {/* Step 1: Package Selection */}
      {step === 'select' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {bottlePackages.map((pkg) => (
            <button
              key={pkg.id}
              onClick={() => handleSelectPackage(pkg)}
              className="group relative bg-secondary border-2 border-border hover:border-accent rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:scale-105 text-left"
            >
              {/* Badge */}
              <div className="absolute top-4 right-4 text-4xl">{pkg.icon}</div>

              {/* Content */}
              <div className="mb-6">
                <h3 className="text-2xl font-display font-bold text-text-light mb-1">{pkg.name}</h3>
                <p className="text-text-dark text-sm">{pkg.description}</p>
              </div>

              {/* Price */}
              <div className="mb-6 pb-6 border-b border-border">
                <p className="text-3xl font-bold text-accent">
                  {(pkg.price / 100000).toLocaleString()} UGX
                </p>
                <p className="text-text-dark text-xs mt-1">Per table</p>
              </div>

              {/* Bottles */}
              <div className="mb-6">
                <p className="text-xs font-semibold text-text-dark uppercase mb-3">Includes</p>
                <div className="space-y-2">
                  {pkg.bottles.map((bottle, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-text-light text-sm">
                      <span>🍷</span>
                      <span>{bottle}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Features */}
              <div className="space-y-2">
                {pkg.includes.slice(0, 3).map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-text-light text-sm">
                    <span>✨</span>
                    <span>{feature}</span>
                  </div>
                ))}
                {pkg.includes.length > 3 && (
                  <p className="text-accent text-xs font-semibold mt-2">+{pkg.includes.length - 3} more benefits</p>
                )}
              </div>

              {/* CTA */}
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-accent font-bold text-sm group-hover:translate-x-1 transition-transform">
                  Select Package →
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Booking Details */}
      {step === 'details' && selectedPackage && (
        <div className="max-w-2xl mx-auto bg-secondary rounded-2xl border border-border p-8">
          <div className="mb-8">
            <h2 className="text-3xl font-display font-bold text-text-light mb-2">
              {selectedPackage.icon} {selectedPackage.name}
            </h2>
            <p className="text-text-dark">{selectedPackage.description}</p>
          </div>

          {/* Guest Count */}
          <div className="mb-8">
            <label className="block text-text-light font-semibold mb-4">Number of Guests</label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                className="bg-border hover:bg-accent hover:text-primary text-text-light font-bold py-2 px-4 rounded-lg transition-colors"
              >
                −
              </button>
              <input
                type="number"
                value={guestCount}
                onChange={(e) => setGuestCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 p-3 text-center rounded-lg border border-border bg-primary text-text-light font-bold text-lg"
                min="1"
                max="20"
              />
              <button
                onClick={() => setGuestCount(Math.min(20, guestCount + 1))}
                className="bg-border hover:bg-accent hover:text-primary text-text-light font-bold py-2 px-4 rounded-lg transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Special Requests */}
          <div className="mb-8">
            <label className="block text-text-light font-semibold mb-4">Special Requests (Optional)</label>
            <textarea
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              placeholder="e.g., Birthday celebration, proposal setup, specific music requests..."
              className="w-full p-4 rounded-lg border border-border bg-primary text-text-light placeholder-text-dark resize-none"
              rows={4}
            />
          </div>

          {/* Summary */}
          <div className="mb-8 p-6 bg-primary rounded-lg border border-accent/20">
            <div className="flex justify-between items-center mb-4">
              <span className="text-text-light">Package Total:</span>
              <span className="text-2xl font-bold text-accent">
                {(selectedPackage.price / 100000).toLocaleString()} UGX
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-dark">Guests:</span>
              <span className="text-text-light font-semibold">{guestCount} people</span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-error/10 border border-error rounded-lg">
              <p className="text-error font-semibold">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={() => setStep('select')}
              className="flex-1 bg-border hover:bg-border/80 text-text-light font-bold py-3 rounded-lg transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleConfirmBooking}
              disabled={loading}
              className="flex-1 bg-accent hover:bg-accent/90 disabled:bg-text-dark text-primary font-bold py-3 rounded-lg transition-colors"
            >
              {loading ? 'Processing...' : 'Proceed to Payment'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Payment Confirmation */}
      {step === 'payment' && selectedPackage && (
        <div className="max-w-2xl mx-auto bg-secondary rounded-2xl border border-border p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-display font-bold text-text-light mb-4">Booking Confirmed!</h2>
          <p className="text-text-dark mb-8">
            Your VIP concierge booking has been confirmed. A confirmation email has been sent to you.
          </p>
          <div className="bg-primary rounded-lg p-6 mb-8 text-left">
            <h3 className="text-xl font-bold text-text-light mb-4">Booking Details</h3>
            <div className="space-y-3 text-text-light">
              <div className="flex justify-between">
                <span className="text-text-dark">Package:</span>
                <span className="font-semibold">{selectedPackage.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-dark">Guests:</span>
                <span className="font-semibold">{guestCount}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-3">
                <span className="text-text-dark">Total:</span>
                <span className="font-bold text-accent">
                  {(selectedPackage.price / 100000).toLocaleString()} UGX
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => window.location.href = '/events'}
            className="w-full bg-accent hover:bg-accent/90 text-primary font-bold py-3 rounded-lg transition-colors"
          >
            Back to Events
          </button>
        </div>
      )}
    </div>
  );
}
