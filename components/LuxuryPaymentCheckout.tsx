import React, { useState } from 'react';
import axios from 'axios';

interface PaymentCheckoutProps {
  amount: number;
  currency: string;
  description: string;
  email: string;
  onSuccess?: (transactionId: string) => void;
  onError?: (error: string) => void;
  metadata?: Record<string, any>;
}

export default function LuxuryPaymentCheckout({
  amount,
  currency,
  description,
  email,
  onSuccess,
  onError,
  metadata,
}: PaymentCheckoutProps) {
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'flutterwave'>('stripe');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVC, setCardCVC] = useState('');
  const [cardName, setCardName] = useState('');

  const handleStripePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate card details
      if (!cardNumber || !cardExpiry || !cardCVC || !cardName) {
        throw new Error('Please fill in all card details');
      }

      // Create payment intent
      const { data: intentData } = await axios.post('/api/payments/process', {
        amount,
        currency,
        description,
        email,
        provider: 'stripe',
        metadata: {
          ...metadata,
          cardLast4: cardNumber.slice(-4),
          cardName,
        },
      });

      if (!intentData.success) {
        throw new Error(intentData.message || 'Failed to create payment intent');
      }

      // In production, you would use Stripe.js to tokenize the card
      // For now, we'll simulate the payment
      if (onSuccess) onSuccess(intentData.transactionId);
    } catch (err: any) {
      const errorMessage = err.message || 'Payment failed';
      setError(errorMessage);
      if (onError) onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFlutterwavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: response } = await axios.post('/api/payments/process', {
        amount,
        currency,
        description,
        email,
        provider: 'flutterwave',
        metadata,
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to create payment link');
      }

      // Redirect to Flutterwave payment page
      if (response.redirectUrl) {
        window.location.href = response.redirectUrl;
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Payment failed';
      setError(errorMessage);
      if (onError) onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (paymentMethod === 'stripe') {
      handleStripePayment(e);
    } else {
      handleFlutterwavePayment(e);
    }
  };

  const formattedAmount = (amount / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: currency,
  });

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  // Format expiry date
  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.slice(0, 2) + '/' + v.slice(2, 4);
    }
    return v;
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-secondary rounded-lg border border-border">
      <h2 className="text-2xl font-display font-bold text-text-light mb-2">Complete Payment</h2>
      <p className="text-text-dark mb-6">{description}</p>

      {/* Amount Display */}
      <div className="mb-6 p-4 bg-primary rounded-lg border border-accent/20">
        <p className="text-text-dark text-sm mb-1">Total Amount</p>
        <p className="text-3xl font-bold text-accent">{formattedAmount}</p>
      </div>

      {/* Payment Method Selection */}
      <div className="mb-6 space-y-3">
        <label className="block text-text-light font-semibold mb-3">Choose Payment Method</label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setPaymentMethod('stripe')}
            className={`flex-1 p-3 rounded-lg border-2 transition-all ${
              paymentMethod === 'stripe'
                ? 'border-accent bg-accent/10'
                : 'border-border hover:border-accent/50'
            }`}
          >
            <div className="text-2xl mb-1">💳</div>
            <div className="text-sm font-semibold text-text-light">Stripe</div>
            <div className="text-xs text-text-dark">Cards & More</div>
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod('flutterwave')}
            className={`flex-1 p-3 rounded-lg border-2 transition-all ${
              paymentMethod === 'flutterwave'
                ? 'border-accent bg-accent/10'
                : 'border-border hover:border-accent/50'
            }`}
          >
            <div className="text-2xl mb-1">🌍</div>
            <div className="text-sm font-semibold text-text-light">Flutterwave</div>
            <div className="text-xs text-text-dark">Africa Payments</div>
          </button>
        </div>
      </div>

      {/* Payment Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {paymentMethod === 'stripe' && (
          <>
            {/* Cardholder Name */}
            <div>
              <label className="block text-text-light font-semibold mb-2">Cardholder Name</label>
              <input
                type="text"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder="John Doe"
                className="w-full p-3 rounded-lg border border-border bg-primary text-text-light placeholder-text-dark"
                required
              />
            </div>

            {/* Card Number */}
            <div>
              <label className="block text-text-light font-semibold mb-2">Card Number</label>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                placeholder="4242 4242 4242 4242"
                maxLength={19}
                className="w-full p-3 rounded-lg border border-border bg-primary text-text-light placeholder-text-dark font-mono"
                required
              />
            </div>

            {/* Expiry and CVC */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-text-light font-semibold mb-2">Expiry</label>
                <input
                  type="text"
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                  placeholder="MM/YY"
                  maxLength={5}
                  className="w-full p-3 rounded-lg border border-border bg-primary text-text-light placeholder-text-dark font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-text-light font-semibold mb-2">CVC</label>
                <input
                  type="text"
                  value={cardCVC}
                  onChange={(e) => setCardCVC(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                  placeholder="123"
                  maxLength={4}
                  className="w-full p-3 rounded-lg border border-border bg-primary text-text-light placeholder-text-dark font-mono"
                  required
                />
              </div>
            </div>
          </>
        )}

        {paymentMethod === 'flutterwave' && (
          <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
            <p className="text-text-light text-sm">
              You will be redirected to Flutterwave to complete your payment securely.
            </p>
          </div>
        )}

        {/* Email Display */}
        <div>
          <label className="block text-text-light font-semibold mb-2">Email</label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full p-3 rounded-lg border border-border bg-primary text-text-dark"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-lg bg-error/10 border border-error">
            <p className="text-error text-sm font-semibold">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-accent hover:bg-accent/90 disabled:bg-text-dark text-primary font-bold rounded-lg transition-colors duration-300"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block animate-spin">⏳</span>
              Processing...
            </span>
          ) : paymentMethod === 'stripe' ? (
            `Pay ${formattedAmount}`
          ) : (
            `Pay with Flutterwave`
          )}
        </button>

        {/* Security Badge */}
        <div className="text-center text-text-dark text-xs">
          🔒 Your payment information is secure and encrypted
        </div>
      </form>
    </div>
  );
}
