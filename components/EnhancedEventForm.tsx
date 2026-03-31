'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface EventFormData {
  title: string;
  description: string;
  date_time: string;
  location_address: string;
  location_lat: number | null;
  location_lng: number | null;
  theme: string;
  max_capacity: number | null;
  poster_url: string | null;
  ticket_price: number;
  merch_items: Array<{ name: string; price: number; quantity: number }>;
  playlist_url: string | null;
  fundraising_goal: number | null;
  fundraising_description: string;
}

export default function EnhancedEventForm({ onSuccess }: { onSuccess?: () => void }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    date_time: '',
    location_address: '',
    location_lat: null,
    location_lng: null,
    theme: 'party',
    max_capacity: null,
    poster_url: null,
    ticket_price: 100000,
    merch_items: [],
    playlist_url: null,
    fundraising_goal: null,
    fundraising_description: '',
  });

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);

  const handlePosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileName = `posters/${Date.now()}_${file.name}`;
      const { data, error: uploadError } = await supabase.storage
        .from('media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from('media')
        .getPublicUrl(fileName);

      setFormData((prev) => ({
        ...prev,
        poster_url: publicData.publicUrl,
      }));

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPosterPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setError('Failed to upload poster: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const addMerchItem = () => {
    setFormData((prev) => ({
      ...prev,
      merch_items: [...prev.merch_items, { name: '', price: 0, quantity: 0 }],
    }));
  };

  const removeMerchItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      merch_items: prev.merch_items.filter((_, i) => i !== index),
    }));
  };

  const updateMerchItem = (index: number, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      merch_items: prev.merch_items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError(null);
    setSuccess(false);

    try {
      const { data, error: insertError } = await supabase
        .from('events')
        .insert({
          title: formData.title,
          description: formData.description,
          date_time: formData.date_time,
          location_address: formData.location_address,
          location_lat: formData.location_lat,
          location_lng: formData.location_lng,
          theme: formData.theme,
          max_capacity: formData.max_capacity,
          image_url: formData.poster_url,
          host_id: user.id,
          ticket_price: formData.ticket_price,
          merch_items: formData.merch_items,
          playlist_url: formData.playlist_url,
          fundraising_goal: formData.fundraising_goal,
          fundraising_description: formData.fundraising_description,
        })
        .select();

      if (insertError) throw insertError;

      setSuccess(true);
      setFormData({
        title: '',
        description: '',
        date_time: '',
        location_address: '',
        location_lat: null,
        location_lng: null,
        theme: 'party',
        max_capacity: null,
        poster_url: null,
        ticket_price: 100000,
        merch_items: [],
        playlist_url: null,
        fundraising_goal: null,
        fundraising_description: '',
      });
      setPosterPreview(null);
      onSuccess?.();
    } catch (err: any) {
      setError('Failed to create event: ' + err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-secondary rounded-lg p-6 border border-border/30 space-y-6">
      <h2 className="text-2xl font-bold text-text-light">Create Your Event</h2>

      {/* Error/Success Messages */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
          Event created successfully! Redirecting...
        </div>
      )}

      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-text-light">Event Details</h3>
        
        <div>
          <label className="block text-sm font-semibold text-text-light mb-2">Event Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="e.g., Summer Music Festival"
            className="w-full bg-primary border border-border/30 rounded-lg px-4 py-2 text-text-light placeholder-text-dark focus:outline-none focus:border-accent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-text-light mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Describe your event..."
            className="w-full bg-primary border border-border/30 rounded-lg px-4 py-2 text-text-light placeholder-text-dark focus:outline-none focus:border-accent h-24"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-text-light mb-2">Date & Time</label>
            <input
              type="datetime-local"
              value={formData.date_time}
              onChange={(e) => setFormData((prev) => ({ ...prev, date_time: e.target.value }))}
              className="w-full bg-primary border border-border/30 rounded-lg px-4 py-2 text-text-light focus:outline-none focus:border-accent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-light mb-2">Location</label>
            <input
              type="text"
              value={formData.location_address}
              onChange={(e) => setFormData((prev) => ({ ...prev, location_address: e.target.value }))}
              placeholder="Venue address"
              className="w-full bg-primary border border-border/30 rounded-lg px-4 py-2 text-text-light placeholder-text-dark focus:outline-none focus:border-accent"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-text-light mb-2">Max Capacity</label>
          <input
            type="number"
            value={formData.max_capacity || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, max_capacity: e.target.value ? parseInt(e.target.value) : null }))}
            placeholder="e.g., 500"
            className="w-full bg-primary border border-border/30 rounded-lg px-4 py-2 text-text-light placeholder-text-dark focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* Poster Upload */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-text-light">Event Poster</h3>
        
        <div className="border-2 border-dashed border-border/30 rounded-lg p-6 text-center">
          {posterPreview ? (
            <div className="space-y-3">
              <img src={posterPreview} alt="Poster preview" className="w-full max-h-64 object-cover rounded-lg" />
              <button
                type="button"
                onClick={() => {
                  setPosterPreview(null);
                  setFormData((prev) => ({ ...prev, poster_url: null }));
                }}
                className="text-accent hover:text-accent/80 text-sm"
              >
                Change poster
              </button>
            </div>
          ) : (
            <label className="cursor-pointer">
              <div className="text-4xl mb-2">🎨</div>
              <p className="text-text-light font-semibold mb-1">Upload Event Poster</p>
              <p className="text-text-dark text-sm mb-4">Click to select an image</p>
              <input
                type="file"
                accept="image/*"
                onChange={handlePosterUpload}
                disabled={uploading}
                className="hidden"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  (e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement)?.click();
                }}
                className="bg-accent text-primary px-4 py-2 rounded-lg font-semibold hover:bg-accent/90"
              >
                {uploading ? 'Uploading...' : 'Choose Image'}
              </button>
            </label>
          )}
        </div>
      </div>

      {/* Ticket Pricing */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-text-light">Ticket Pricing</h3>
        
        <div>
          <label className="block text-sm font-semibold text-text-light mb-2">Ticket Price (UGX)</label>
          <input
            type="number"
            value={formData.ticket_price}
            onChange={(e) => setFormData((prev) => ({ ...prev, ticket_price: parseInt(e.target.value) || 0 }))}
            className="w-full bg-primary border border-border/30 rounded-lg px-4 py-2 text-text-light focus:outline-none focus:border-accent"
            required
          />
        </div>
      </div>

      {/* Merchandise */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-text-light">Merchandise</h3>
          <button
            type="button"
            onClick={addMerchItem}
            className="text-accent hover:text-accent/80 text-sm font-semibold"
          >
            + Add Item
          </button>
        </div>

        {formData.merch_items.map((item, index) => (
          <div key={index} className="bg-primary rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <input
                type="text"
                value={item.name}
                onChange={(e) => updateMerchItem(index, 'name', e.target.value)}
                placeholder="Item name"
                className="bg-secondary border border-border/30 rounded px-3 py-2 text-text-light placeholder-text-dark focus:outline-none focus:border-accent"
              />
              <input
                type="number"
                value={item.price}
                onChange={(e) => updateMerchItem(index, 'price', parseInt(e.target.value) || 0)}
                placeholder="Price"
                className="bg-secondary border border-border/30 rounded px-3 py-2 text-text-light placeholder-text-dark focus:outline-none focus:border-accent"
              />
              <input
                type="number"
                value={item.quantity}
                onChange={(e) => updateMerchItem(index, 'quantity', parseInt(e.target.value) || 0)}
                placeholder="Quantity"
                className="bg-secondary border border-border/30 rounded px-3 py-2 text-text-light placeholder-text-dark focus:outline-none focus:border-accent"
              />
            </div>
            <button
              type="button"
              onClick={() => removeMerchItem(index)}
              className="text-red-400 hover:text-red-300 text-sm font-semibold"
            >
              Remove Item
            </button>
          </div>
        ))}
      </div>

      {/* Playlist */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-text-light">Playlist</h3>
        
        <div>
          <label className="block text-sm font-semibold text-text-light mb-2">Spotify/YouTube Playlist URL</label>
          <input
            type="url"
            value={formData.playlist_url || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, playlist_url: e.target.value || null }))}
            placeholder="https://open.spotify.com/playlist/..."
            className="w-full bg-primary border border-border/30 rounded-lg px-4 py-2 text-text-light placeholder-text-dark focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* Fundraising */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-text-light">Fundraising (Optional)</h3>
        
        <div>
          <label className="block text-sm font-semibold text-text-light mb-2">Fundraising Goal (UGX)</label>
          <input
            type="number"
            value={formData.fundraising_goal || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, fundraising_goal: e.target.value ? parseInt(e.target.value) : null }))}
            placeholder="e.g., 5000000"
            className="w-full bg-primary border border-border/30 rounded-lg px-4 py-2 text-text-light placeholder-text-dark focus:outline-none focus:border-accent"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-text-light mb-2">Fundraising Description</label>
          <textarea
            value={formData.fundraising_description}
            onChange={(e) => setFormData((prev) => ({ ...prev, fundraising_description: e.target.value }))}
            placeholder="Why are you raising funds? What will it be used for?"
            className="w-full bg-primary border border-border/30 rounded-lg px-4 py-2 text-text-light placeholder-text-dark focus:outline-none focus:border-accent h-20"
          />
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="w-full bg-accent hover:bg-accent/90 text-primary font-bold py-3 rounded-lg transition-colors"
      >
        🎉 Create Event
      </button>
    </form>
  );
}
