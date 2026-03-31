'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface MerchandiseItem {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  image?: string;
  sizes?: string[];
  colors?: string[];
}

export default function MerchandiseManager({ eventId }: { eventId: string }) {
  const [merchandise, setMerchandise] = useState<MerchandiseItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<MerchandiseItem>>({
    name: '',
    description: '',
    price: 0,
    quantity: 0,
    sizes: [],
    colors: [],
  });
  const [loading, setLoading] = useState(false);

  const addMerchandise = async () => {
    if (!formData.name || !formData.price || !formData.quantity) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const newItem: MerchandiseItem = {
        id: `merch_${Date.now()}`,
        name: formData.name,
        description: formData.description || '',
        price: formData.price,
        quantity: formData.quantity,
        sizes: formData.sizes || [],
        colors: formData.colors || [],
      };

      const { error } = await supabase
        .from('event_merchandise')
        .insert({
          event_id: eventId,
          merchandise_data: newItem,
        });

      if (error) throw error;

      setMerchandise([...merchandise, newItem]);
      setFormData({
        name: '',
        description: '',
        price: 0,
        quantity: 0,
        sizes: [],
        colors: [],
      });
      setShowForm(false);
    } catch (error: any) {
      alert('Error adding merchandise: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const removeMerchandise = async (id: string) => {
    try {
      await supabase
        .from('event_merchandise')
        .delete()
        .eq('merchandise_data->id', id);

      setMerchandise(merchandise.filter((m) => m.id !== id));
    } catch (error: any) {
      alert('Error removing merchandise: ' + error.message);
    }
  };

  const handleSizeToggle = (size: string) => {
    const sizes = formData.sizes || [];
    setFormData({
      ...formData,
      sizes: sizes.includes(size) ? sizes.filter((s) => s !== size) : [...sizes, size],
    });
  };

  const handleColorToggle = (color: string) => {
    const colors = formData.colors || [];
    setFormData({
      ...formData,
      colors: colors.includes(color) ? colors.filter((c) => c !== color) : [...colors, color],
    });
  };

  return (
    <div className="space-y-6">
      {/* Add Merchandise Button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full bg-accent text-primary py-3 rounded-lg font-semibold hover:bg-accent/90 transition-colors"
        >
          + Add Merchandise
        </button>
      )}

      {/* Add Merchandise Form */}
      {showForm && (
        <div className="bg-primary rounded-lg p-6 border border-border/30 space-y-4">
          <h3 className="text-lg font-bold text-text-light">Add Merchandise Item</h3>

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-text-light mb-2">Item Name *</label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Event T-Shirt"
              className="w-full bg-secondary border border-border/30 rounded px-4 py-2 text-text-light placeholder-text-dark/50 focus:outline-none focus:border-accent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-text-light mb-2">Description</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Item description..."
              rows={3}
              className="w-full bg-secondary border border-border/30 rounded px-4 py-2 text-text-light placeholder-text-dark/50 focus:outline-none focus:border-accent resize-none"
            />
          </div>

          {/* Price and Quantity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-text-light mb-2">Price (UGX) *</label>
              <input
                type="number"
                value={formData.price || 0}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                placeholder="0"
                min="0"
                className="w-full bg-secondary border border-border/30 rounded px-4 py-2 text-text-light placeholder-text-dark/50 focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-light mb-2">Quantity *</label>
              <input
                type="number"
                value={formData.quantity || 0}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                placeholder="0"
                min="0"
                className="w-full bg-secondary border border-border/30 rounded px-4 py-2 text-text-light placeholder-text-dark/50 focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {/* Sizes */}
          <div>
            <label className="block text-sm font-semibold text-text-light mb-2">Available Sizes</label>
            <div className="flex flex-wrap gap-2">
              {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => (
                <button
                  key={size}
                  onClick={() => handleSizeToggle(size)}
                  className={`px-3 py-1 rounded transition-colors ${
                    (formData.sizes || []).includes(size)
                      ? 'bg-accent text-primary'
                      : 'bg-secondary border border-border/30 text-text-light hover:border-accent/50'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div>
            <label className="block text-sm font-semibold text-text-light mb-2">Available Colors</label>
            <div className="flex flex-wrap gap-2">
              {['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow'].map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorToggle(color)}
                  className={`px-3 py-1 rounded transition-colors ${
                    (formData.colors || []).includes(color)
                      ? 'bg-accent text-primary'
                      : 'bg-secondary border border-border/30 text-text-light hover:border-accent/50'
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={addMerchandise}
              disabled={loading}
              className="flex-1 bg-accent text-primary py-2 rounded-lg font-semibold hover:bg-accent/90 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Item'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 bg-secondary border border-border/30 text-text-light py-2 rounded-lg hover:border-accent/50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Merchandise List */}
      {merchandise.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-text-light">Event Merchandise</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {merchandise.map((item) => (
              <div key={item.id} className="bg-primary rounded-lg p-4 border border-border/30 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-text-light">{item.name}</p>
                    {item.description && (
                      <p className="text-sm text-text-dark mt-1">{item.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => removeMerchandise(item.id)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-text-dark">Price</p>
                    <p className="font-semibold text-accent">{item.price.toLocaleString()} UGX</p>
                  </div>
                  <div>
                    <p className="text-text-dark">Stock</p>
                    <p className="font-semibold text-text-light">{item.quantity}</p>
                  </div>
                  <div>
                    <p className="text-text-dark">Total Value</p>
                    <p className="font-semibold text-text-light">{(item.price * item.quantity).toLocaleString()} UGX</p>
                  </div>
                </div>

                {(item.sizes?.length || 0) > 0 && (
                  <div>
                    <p className="text-xs text-text-dark mb-1">Sizes: {item.sizes?.join(', ')}</p>
                  </div>
                )}

                {(item.colors?.length || 0) > 0 && (
                  <div>
                    <p className="text-xs text-text-dark mb-1">Colors: {item.colors?.join(', ')}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {merchandise.length === 0 && !showForm && (
        <div className="text-center py-8 text-text-dark">
          <p className="text-4xl mb-2">🛍️</p>
          <p>No merchandise added yet</p>
        </div>
      )}
    </div>
  );
}
