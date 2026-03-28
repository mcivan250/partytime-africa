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
    <div className="ticket-tier-manager">
      <div className="manager-header">
        <h3 className="text-xl font-bold mb-2">🎫 Ticket Tiers & Pricing</h3>
        <p className="text-sm text-gray-600 mb-4">
          Create different ticket types for your event (e.g., Early Bird, VIP, Tables).
        </p>
      </div>

      <div className="tiers-list space-y-4">
        {tiers.map((tier, index) => (
          <div key={tier.id} className="tier-card p-4 border rounded-lg bg-white shadow-sm relative">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-bold text-purple-600 uppercase tracking-wider">
                Tier #{index + 1}
              </span>
              {tiers.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeTier(tier.id)}
                  className="text-red-500 hover:text-red-700 text-sm font-medium"
                >
                  Remove Tier
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tier Name
                </label>
                <input
                  type="text"
                  value={tier.name}
                  onChange={(e) => updateTier(tier.id, 'name', e.target.value)}
                  placeholder="e.g., VIP Experience"
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-purple-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price ({currency})
                  </label>
                  <input
                    type="number"
                    value={tier.price}
                    onChange={(e) => updateTier(tier.id, 'price', Number(e.target.value))}
                    min="0"
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-purple-500 outline-none"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacity
                  </label>
                  <input
                    type="number"
                    value={tier.capacity}
                    onChange={(e) => updateTier(tier.id, 'capacity', Number(e.target.value))}
                    min="1"
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-purple-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="form-group md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  What's included? (Description)
                </label>
                <textarea
                  value={tier.description}
                  onChange={(e) => updateTier(tier.id, 'description', e.target.value)}
                  placeholder="e.g., Free drink on arrival, VIP lounge access..."
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-purple-500 outline-none h-20 resize-none"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="manager-footer mt-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <button
          type="button"
          onClick={addTier}
          className="w-full md:w-auto px-6 py-2 bg-purple-600 text-white font-bold rounded-full hover:bg-purple-700 transition-colors shadow-md"
        >
          + Add Another Ticket Type
        </button>

        <div className="total-summary p-3 bg-purple-50 rounded-lg border border-purple-100">
          <span className="text-sm text-purple-800 font-medium">
            Total Event Capacity: <strong>{totalCapacity}</strong> tickets
          </span>
        </div>
      </div>

      <style jsx>{`
        .ticket-tier-manager {
          background: #fdfdfd;
          padding: 20px;
          border-radius: 12px;
          border: 1px solid #eee;
        }
        .tier-card {
          border-left: 4px solid #7c3aed;
        }
      `}</style>
    </div>
  );
}
