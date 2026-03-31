'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface TicketTier {
  id: string;
  name: string;
  description: string;
  price: number;
  discount?: number;
}

interface SecureCheckoutProps {
  eventId: string;
  eventTitle: string;
  ticketTiers: TicketTier[];
  onPaymentSuccess?: (result: any) => void;
  onPaymentError?: (error: string) => void;
}

export default function SecureCheckout({
  eventId,
  eventTitle,
  ticketTiers,
  onPaymentSuccess,
  onPaymentError,
}: SecureCheckoutProps) {
  const { user } = useAuth();
  const [selectedTier, setSelectedTier] = useState<string>(ticketTiers[0]?.id || '');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentTier = ticketTiers.find((t) => t.id === selectedTier);
  const pricePerTicket = currentTier?.price || 0;
  const discount = currentTier?.discount || 0;
  const discountedPrice = Math.floor(pricePerTicket * ((100 - discount) / 100));
  const totalPrice = discountedPrice * quantity;

  const handleCheckout = async () => {
    if (!user) {
      setError('Please sign in to purchase tickets');
      onPaymentError?.('Please sign in to purchase tickets');
      return;
    }

    if (!selectedTier) {
      setError('Please select a ticket tier');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call the purchase-ticket API
      const response = await fetch('/api/purchase-ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          userId: user.id,
          tier: selectedTier,
          quantity,
          pricePerTicket: discountedPrice,
          customerEmail: user.email,
          customerName: user.user_metadata?.full_name || user.email,
          customerPhone: user.user_metadata?.phone_number || '+256700000000',
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Payment initialization failed');
      }

      // Redirect to Flutterwave payment link
      if (data.paymentLink) {
        window.location.href = data.paymentLink;
        onPaymentSuccess?.(data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed';
      setError(errorMessage);
      onPaymentError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-secondary border border-border rounded-xl p-6 space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Get Your Ticket</h3>
          <p className="text-text-dark text-sm">{eventTitle}</p>
        </div>

        {/* Ticket Tier Selection */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-text-light">Select Ticket Tier</label>
          <div className="grid grid-cols-1 gap-3">
            {ticketTiers.map((tier) => (
              <button
                key={tier.id}
                onClick={() => setSelectedTier(tier.id)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedTier === tier.id
                    ? 'border-accent bg-accent/10'
                    : 'border-border hover:border-accent/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">{tier.name}</p>
                    <p className="text-xs text-text-dark">{tier.description}</p>
                  </div>
                  <div className="text-right">
                    {tier.discount ? (
                      <>
                        <p className="text-sm font-bold text-accent">
                          {Math.floor(tier.price * ((100 - tier.discount) / 100)).toLocaleString()} UGX
                        </p>
                        <p className="text-xs text-text-dark line-through">
                          {tier.price.toLocaleString()} UGX
                        </p>
                      </>
                    ) : (
                      <p className="text-sm font-bold text-accent">
                        {tier.price.toLocaleString()} UGX
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Quantity Selection */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-text-light">Quantity</label>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 rounded-lg bg-border hover:bg-border/80 flex items-center justify-center transition"
            >
              −
            </button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="flex-1 bg-border rounded-lg px-4 py-2 text-center font-semibold text-white border border-border focus:border-accent outline-none"
              min="1"
              max="10"
            />
            <button
              onClick={() => setQuantity(Math.min(10, quantity + 1))}
              className="w-10 h-10 rounded-lg bg-border hover:bg-border/80 flex items-center justify-center transition"
            >
              +
            </button>
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="bg-border/50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-dark">Price per ticket</span>
            <span className="text-text-light">{discountedPrice.toLocaleString()} UGX</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-dark">Quantity</span>
            <span className="text-text-light">×{quantity}</span>
          </div>
          <div className="border-t border-border pt-2 flex justify-between font-bold">
            <span className="text-text-light">Total</span>
            <span className="text-accent">{totalPrice.toLocaleString()} UGX</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Checkout Button */}
        <button
          onClick={handleCheckout}
          disabled={loading || !user}
          className={`w-full py-3 rounded-lg font-bold transition-all ${
            loading || !user
              ? 'bg-border text-text-dark cursor-not-allowed'
              : 'bg-accent hover:bg-yellow-600 text-primary'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Processing...
            </span>
          ) : !user ? (
            'Sign In to Purchase'
          ) : (
            `💳 Pay ${totalPrice.toLocaleString()} UGX`
          )}
        </button>

        {/* Security Info */}
        <div className="text-xs text-text-dark text-center space-y-1">
          <p>🔒 Secure payment powered by Flutterwave</p>
          <p>Your payment information is encrypted and secure</p>
        </div>
      </div>
    </div>
  );
}
