
'use client';

import React, { useState, useEffect } from 'react';

interface TicketTier {
  id: string;
  name: string;
  price: number;
  capacity: number;
  description: string;
  sold: number;
}

interface TicketTierManagerProps {
  initialTiers?: TicketTier[];
  onTiersChange: (tiers: TicketTier[]) => void;
  currency?: string;
}

export default function TicketTierManager({
  initialTiers = [],
  onTiersChange,
  currency = 'UGX',
}: TicketTierManagerProps) {
  const [tiers, setTiers] = useState<TicketTier[]>(
    initialTiers.length > 0 
      ? initialTiers 
      : [{ id: Math.random().toString(36).substr(2, 9), name: 'General Admission', price: 0, capacity: 100, description: 'Standard entry ticket', sold: 0 }]
  );

  useEffect(() => {
    onTiersChange(tiers);
  }, [tiers]);

  const addTier = () => {
    const newTier: TicketTier = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      price: 0,
      capacity: 50,
      description: '',
      sold: 0,
    };
    setTiers([...tiers, newTier]);
  };

  const removeTier = (id: string) => {
    if (tiers.length === 1) return;
    setTiers(tiers.filter((t) => t.id !== id));
  };

  const updateTier = (id: string, field: keyof TicketTier, value: string | number) => {
    setTiers(
      tiers.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  const totalCapacity = tiers.reduce((sum, t) => sum + Number(t.capacity), 0);

  return (
    <div className="ticket-tier-manager card p-6">
      <div className="manager-header mb-6">
        <h3 className="text-2xl font-display font-bold text-text-light mb-2">🎫 Ticket Tiers & Pricing</h3>
        <p className="text-text-dark text-sm">
          Create different ticket types for your event (e.g., Early Bird, VIP, Tables).
        </p>
      </div>

      <div className="tiers-list space-y-6">
        {tiers.map((tier, index) => (
          <div key={tier.id} className="tier-card p-5 border border-border rounded-lg bg-primary shadow-md relative">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-bold text-accent uppercase tracking-wider">
                Tier #{index + 1}
              </span>
              {tiers.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeTier(tier.id)}
                  className="text-error hover:text-red-400 text-sm font-medium"
                >
                  Remove Tier
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div className="form-group mb-0">
                <label className="form-label">Tier Name</label>
                <input
                  type="text"
                  value={tier.name}
                  onChange={(e) => updateTier(tier.id, 'name', e.target.value)}
                  placeholder="e.g., VIP Experience"
                  className="form-input"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group mb-0">
                  <label className="form-label">Price ({currency})</label>
                  <input
                    type="number"
                    value={tier.price}
                    onChange={(e) => updateTier(tier.id, 'price', Number(e.target.value))}
                    min="0"
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group mb-0">
                  <label className="form-label">Capacity</label>
                  <input
                    type="number"
                    value={tier.capacity}
                    onChange={(e) => updateTier(tier.id, 'capacity', Number(e.target.value))}
                    min="1"
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group mb-0">
                <label className="form-label">What's included? (Description)</label>
                <textarea
                  value={tier.description}
                  onChange={(e) => updateTier(tier.id, 'description', e.target.value)}
                  placeholder="e.g., Free drink on arrival, VIP lounge access..."
                  className="form-textarea h-20 resize-none"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="manager-footer mt-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <button
          type="button"
          onClick={addTier}
          className="btn btn-secondary w-full md:w-auto px-6 py-3"
        >
          + Add Another Ticket Type
        </button>

        <div className="total-summary p-3 rounded-lg border border-border bg-primary">
          <span className="text-sm text-text-light font-medium">
            Total Event Capacity: <strong className="text-accent">{totalCapacity}</strong> tickets
          </span>
        </div>
      </div>
    </div>
  );
}
