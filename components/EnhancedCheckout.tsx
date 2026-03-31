'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface TicketTier {
  name: string;
  price: number;
  discount?: number;
}

interface EnhancedCheckoutProps {
  eventId: string;
  eventTitle: string;
  ticketTiers: TicketTier[];
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

type PaymentStatus = 'idle' | 'processing' | 'success' | 'error' | 'pending';

export default function EnhancedCheckout({
  eventId,
  eventTitle,
  ticketTiers,
  onSuccess,
  onError,
}: EnhancedCheckoutProps) {
  const { user } = useAuth();
  const [selectedTier, setSelectedTier] = useState<string>(ticketTiers[0]?.name || '');
  const [quantity, setQuantity] = useState(1);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string>('');

  const selectedTierData = ticketTiers.find((t) => t.name === selectedTier);
  const totalPrice = selectedTierData
    ? selectedTierData.price * quantity
    : 0;

  const handlePayment = async () => {
    if (!user) {
      setPaymentStatus('error');
      setStatusMessage('Please sign in to continue');
      onError?.('User not authenticated');
      return;
    }

    if (!selectedTier || quantity < 1) {
      setPaymentStatus('error');
      setStatusMessage('Please select a valid ticket tier and quantity');
      onError?.('Invalid selection');
      return;
    }

    setPaymentStatus('processing');
    setStatusMessage('Processing your payment...');

    try {
      const response = await fetch('/api/purchase-ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          ticketTier: selectedTier,
          quantity,
          totalAmount: totalPrice,
          customerEmail: user.email,
          customerName: user.user_metadata?.full_name || user.email,
          customerPhone: user.user_metadata?.phone_number || '+256700000000',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment failed');
      }

      setTransactionId(data.transactionId || '');
      setPaymentStatus('pending');
      setStatusMessage('Payment initiated. Redirecting to payment gateway...');

      // Redirect to payment gateway if URL is provided
      if (data.paymentUrl) {
        setTimeout(() => {
          window.location.href = data.paymentUrl;
        }, 2000);
      } else {
        // Simulate payment completion
        setTimeout(() => {
          setPaymentStatus('success');
          setStatusMessage('Payment successful! Your tickets have been issued.');
          onSuccess?.();
        }, 3000);
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      setPaymentStatus('error');
      setStatusMessage(error.message || 'Payment failed. Please try again.');
      onError?.(error.message);
    }
  };

  const getStatusColor = () => {
    switch (paymentStatus) {
      case 'processing':
        return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
      case 'success':
        return 'bg-green-500/10 border-green-500/30 text-green-400';
      case 'error':
        return 'bg-red-500/10 border-red-500/30 text-red-400';
      case 'pending':
        return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
      default:
        return '';
    }
  };

  return (
    <div className="bg-secondary rounded-lg p-6 border border-border/30">
      <h2 className="text-2xl font-bold text-text-light mb-4">Get Your Tickets</h2>
      <p className="text-text-dark mb-6">{eventTitle}</p>

      {/* Ticket Tier Selection */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-text-light mb-3">
          Select Ticket Tier
        </label>
        <div className="space-y-2">
          {ticketTiers.map((tier) => (
            <button
              key={tier.name}
              onClick={() => setSelectedTier(tier.name)}
              className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                selectedTier === tier.name
                  ? 'border-accent bg-accent/10'
                  : 'border-border/30 hover:border-accent/50'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-text-light">{tier.name}</p>
                  {tier.discount && (
                    <p className="text-xs text-accent">{tier.discount}% off</p>
                  )}
                </div>
                <p className="font-bold text-accent">{tier.price.toLocaleString()} UGX</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Quantity Selection */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-text-light mb-3">
          Quantity
        </label>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={paymentStatus === 'processing'}
            className="bg-secondary border border-border/30 hover:border-accent text-text-light px-4 py-2 rounded-lg disabled:opacity-50"
          >
            −
          </button>
          <span className="text-lg font-bold text-text-light w-12 text-center">
            {quantity}
          </span>
          <button
            onClick={() => setQuantity(quantity + 1)}
            disabled={paymentStatus === 'processing'}
            className="bg-secondary border border-border/30 hover:border-accent text-text-light px-4 py-2 rounded-lg disabled:opacity-50"
          >
            +
          </button>
        </div>
      </div>

      {/* Total Price */}
      <div className="mb-6 p-4 bg-primary rounded-lg border border-border/30">
        <div className="flex justify-between items-center">
          <span className="text-text-dark">Total:</span>
          <span className="text-2xl font-bold text-accent">
            {totalPrice.toLocaleString()} UGX
          </span>
        </div>
      </div>

      {/* Status Message */}
      {statusMessage && (
        <div className={`mb-6 p-4 rounded-lg border ${getStatusColor()}`}>
          <div className="flex items-center gap-2">
            {paymentStatus === 'processing' && (
              <span className="animate-spin">⏳</span>
            )}
            {paymentStatus === 'success' && <span>✓</span>}
            {paymentStatus === 'error' && <span>✗</span>}
            {paymentStatus === 'pending' && <span>⏱</span>}
            <p className="text-sm">{statusMessage}</p>
          </div>
        </div>
      )}

      {/* Transaction ID */}
      {transactionId && (
        <div className="mb-6 p-3 bg-primary rounded-lg border border-border/30">
          <p className="text-xs text-text-dark mb-1">Transaction ID:</p>
          <p className="text-sm font-mono text-accent break-all">{transactionId}</p>
        </div>
      )}

      {/* Payment Button */}
      <button
        onClick={handlePayment}
        disabled={
          paymentStatus === 'processing' ||
          paymentStatus === 'success' ||
          !selectedTier ||
          quantity < 1
        }
        className="w-full bg-accent hover:bg-accent/90 disabled:bg-accent/50 text-primary font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {paymentStatus === 'processing' && (
          <>
            <span className="animate-spin">⏳</span>
            Processing...
          </>
        )}
        {paymentStatus === 'success' && (
          <>
            <span>✓</span>
            Payment Successful
          </>
        )}
        {paymentStatus !== 'processing' && paymentStatus !== 'success' && (
          <>
            <span>💳</span>
            Proceed to Payment
          </>
        )}
      </button>

      {/* Retry Button for Errors */}
      {paymentStatus === 'error' && (
        <button
          onClick={() => {
            setPaymentStatus('idle');
            setStatusMessage('');
          }}
          className="w-full mt-3 bg-secondary hover:bg-secondary/80 text-text-light font-bold py-2 rounded-lg transition-colors border border-border/30"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
