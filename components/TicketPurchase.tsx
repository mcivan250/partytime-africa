import React, { useState } from 'react';
import { calculateTicketPrice, formatPrice, TICKET_TIERS } from '@/lib/payment';

interface TicketPurchaseProps {
  eventId: string;
  eventTitle: string;
  basePrice: number;
  currency?: string;
  onPurchaseComplete?: (ticketId: string, amount: number) => void;
  isLoading?: boolean;
}

export default function TicketPurchase({
  eventId,
  eventTitle,
  basePrice,
  currency = 'UGX',
  onPurchaseComplete,
  isLoading = false,
}: TicketPurchaseProps) {
  const [selectedTier, setSelectedTier] = useState<'vip' | 'regular' | 'early-bird'>('regular');
  const [quantity, setQuantity] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  const ticketPrice = calculateTicketPrice(basePrice, selectedTier);
  const totalPrice = ticketPrice * quantity;
  const tierInfo = TICKET_TIERS[selectedTier];

  const handlePurchase = async () => {
    setIsProcessing(true);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // In production, this would call the payment API
      const ticketId = `TKT-${eventId}-${Date.now()}`;
      onPurchaseComplete?.(ticketId, totalPrice);

      // Reset form
      setQuantity(1);
      setSelectedTier('regular');
    } catch (error) {
      console.error('Purchase error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="card p-6 bg-secondary border-border/50 space-y-6">
      <h3 className="text-2xl font-display font-bold">Get Your Tickets</h3>

      {/* Tier Selection */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-text-dark uppercase">Select Tier</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(Object.entries(TICKET_TIERS) as Array<[string, any]>).map(([tier, info]) => (
            <button
              key={tier}
              onClick={() => setSelectedTier(tier as any)}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                selectedTier === tier
                  ? 'border-accent bg-accent/10'
                  : 'border-border/30 hover:border-accent/50'
              }`}
            >
              <div className="text-2xl mb-2">{info.icon}</div>
              <p className="font-bold text-sm">{info.name}</p>
              <p className="text-xs text-text-dark">{info.description}</p>
              <p className="text-sm font-semibold text-accent mt-2">
                {formatPrice(calculateTicketPrice(basePrice, tier), currency)}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Quantity Selection */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-text-dark uppercase">Quantity</p>
        <div className="flex items-center gap-4 bg-primary p-3 rounded-lg">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={quantity === 1}
            className="w-10 h-10 rounded-lg bg-secondary border border-border/50 hover:border-accent/50 disabled:opacity-50 transition-colors flex items-center justify-center font-bold"
          >
            −
          </button>
          <input
            type="number"
            value={quantity}
            onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="flex-1 bg-transparent text-center text-xl font-bold focus:outline-none"
            min="1"
            max="10"
          />
          <button
            onClick={() => setQuantity(Math.min(10, quantity + 1))}
            disabled={quantity === 10}
            className="w-10 h-10 rounded-lg bg-secondary border border-border/50 hover:border-accent/50 disabled:opacity-50 transition-colors flex items-center justify-center font-bold"
          >
            +
          </button>
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="space-y-2 p-4 bg-primary rounded-lg border border-border/30">
        <div className="flex justify-between text-sm">
          <span className="text-text-dark">Unit Price:</span>
          <span>{formatPrice(ticketPrice, currency)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-text-dark">Quantity:</span>
          <span>{quantity}x</span>
        </div>
        <div className="border-t border-border/30 pt-2 mt-2 flex justify-between font-bold text-lg">
          <span>Total:</span>
          <span className="text-accent">{formatPrice(totalPrice, currency)}</span>
        </div>
      </div>

      {/* Affiliate Info */}
      <div className="p-3 bg-accent/5 border border-accent/20 rounded-lg text-xs text-text-dark">
        <p className="font-semibold mb-1">💡 Tip</p>
        <p>Share your referral link and earn 10% commission on each ticket sold!</p>
      </div>

      {/* Purchase Button */}
      <button
        onClick={handlePurchase}
        disabled={isProcessing || isLoading}
        className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
          isProcessing || isLoading
            ? 'bg-accent/50 text-primary/50 cursor-not-allowed'
            : 'bg-accent text-primary hover:bg-yellow-500 active:scale-95'
        }`}
      >
        {isProcessing ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            Processing Payment...
          </div>
        ) : (
          `Purchase ${quantity} Ticket${quantity > 1 ? 's' : ''}`
        )}
      </button>

      {/* Security Notice */}
      <p className="text-xs text-text-dark text-center">
        🔒 Secure payment powered by Flutterwave
      </p>
    </div>
  );
}
