
'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { trackAffiliateTicketSale } from '@/lib/affiliate-moments';
import TicketDigitalPass from './TicketDigitalPass';

interface TicketTier {
  id: string;
  name: string;
  price: number;
  capacity: number;
  description: string;
  sold?: number;
}

interface LuxuryCheckoutProps {
  eventId: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  tiers: TicketTier[];
  currency: string;
  affiliateRef?: string;
  affiliateMomentId?: string;
}

export default function LuxuryCheckout({
  eventId,
  eventName,
  eventDate,
  eventLocation,
  tiers,
  currency,
  affiliateRef,
  affiliateMomentId,
}: LuxuryCheckoutProps) {
  const { user } = useAuth();
  const [selectedTier, setSelectedTier] = useState<TicketTier | null>(tiers[0] || null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [purchaseComplete, setPurchaseComplete] = useState(false);
  const [ticket, setTicket] = useState<any>(null);

  if (!user) {
    return (
      <div className="card p-8 text-center">
        <p className="text-text-light mb-4">Please sign in to purchase tickets</p>
        <button className="btn btn-primary">Sign In</button>
      </div>
    );
  }

  const handlePurchase = async () => {
    if (!selectedTier) return;

    setLoading(true);
    try {
      const totalAmount = selectedTier.price * quantity;

      // Create ticket order
      const { data: order, error: orderError } = await supabase
        .from('ticket_orders')
        .insert([
          {
            user_id: user.id,
            event_id: eventId,
            total_amount: totalAmount,
            currency,
            payment_status: 'completed',
            payment_method: 'mobile_money',
          },
        ])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create tickets
      const ticketPromises = [];
      for (let i = 0; i < quantity; i++) {
        ticketPromises.push(
          supabase.from('tickets').insert([
            {
              event_id: eventId,
              user_id: user.id,
              tier_id: selectedTier.id,
              tier_name: selectedTier.name,
              purchase_price: selectedTier.price,
              order_id: order.id,
              qr_code_data: `${eventId}-${order.id}-${i}`,
              status: 'valid',
            },
          ])
        );
      }

      await Promise.all(ticketPromises);

      // Track affiliate sale if applicable
      if (affiliateRef && affiliateMomentId) {
        await trackAffiliateTicketSale(affiliateMomentId, user.id, eventId);
      }

      // Create mock ticket for display
      setTicket({
        id: order.id,
        event_name: eventName,
        event_date: eventDate,
        event_location: eventLocation,
        tier_name: selectedTier.name,
        purchase_price: totalAmount,
        currency,
        buyer_name: user.user_metadata?.full_name || 'Guest',
        qr_code_data: `${eventId}-${order.id}-0`,
        order_id: order.id,
      });

      setPurchaseComplete(true);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (purchaseComplete && ticket) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-display font-bold text-accent mb-2">✨ Ticket Purchased!</h2>
          <p className="text-text-dark">Your digital pass is ready. Download it or add to your calendar.</p>
        </div>
        <TicketDigitalPass ticket={ticket} compact={false} />
      </div>
    );
  }

  const selectedPrice = selectedTier ? selectedTier.price * quantity : 0;
  const available = selectedTier ? (selectedTier.capacity - (selectedTier.sold || 0)) : 0;

  return (
    <div className="card p-8 space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-display font-bold text-text-light mb-2">Secure Your Spot</h2>
        <p className="text-text-dark">Choose your ticket tier and complete your purchase</p>
      </div>

      {/* Tier Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-display font-bold text-text-light">Select Ticket Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tiers.map((tier) => (
            <button
              key={tier.id}
              onClick={() => setSelectedTier(tier)}
              className={`p-5 rounded-lg border-2 transition-all text-left ${
                selectedTier?.id === tier.id
                  ? 'border-accent bg-primary'
                  : 'border-border bg-secondary hover:border-accent'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-lg font-bold text-text-light">{tier.name}</h4>
                <span className="text-accent font-bold">{currency} {tier.price.toLocaleString()}</span>
              </div>
              <p className="text-text-dark text-sm mb-2">{tier.description}</p>
              <span className="text-xs text-text-dark">
                {available} of {tier.capacity} available
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Quantity Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-display font-bold text-text-light">Quantity</h3>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="btn btn-secondary px-4 py-2"
          >
            −
          </button>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            min="1"
            max={available}
            className="form-input w-20 text-center"
          />
          <button
            onClick={() => setQuantity(Math.min(available, quantity + 1))}
            className="btn btn-secondary px-4 py-2"
          >
            +
          </button>
          <span className="text-text-dark ml-auto">{available} available</span>
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-primary border border-border rounded-lg p-6 space-y-3">
        <div className="flex justify-between text-text-light">
          <span>Subtotal ({quantity} ticket{quantity > 1 ? 's' : ''})</span>
          <span>{currency} {selectedPrice.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-text-light">
          <span>Service Fee</span>
          <span>{currency} {Math.round(selectedPrice * 0.05).toLocaleString()}</span>
        </div>
        <div className="border-t border-border pt-3 flex justify-between text-lg font-bold text-accent">
          <span>Total</span>
          <span>{currency} {Math.round(selectedPrice * 1.05).toLocaleString()}</span>
        </div>
      </div>

      {/* Affiliate Info */}
      {affiliateRef && (
        <div className="bg-secondary border border-border rounded-lg p-4 text-center">
          <p className="text-text-dark text-sm">
            🎉 You're getting this ticket through a friend's referral! They'll earn Party Points when you complete your purchase.
          </p>
        </div>
      )}

      {/* Purchase Button */}
      <button
        onClick={handlePurchase}
        disabled={loading || !selectedTier || available === 0}
        className="btn btn-primary w-full py-4 text-lg font-bold"
      >
        {loading ? 'Processing...' : `Purchase ${quantity} Ticket${quantity > 1 ? 's' : ''}`}
      </button>

      <p className="text-text-dark text-xs text-center">
        By purchasing, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}
