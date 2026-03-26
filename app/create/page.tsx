'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, generateSlug } from '@/lib/supabase';
import { Event, THEMES, ANIMATIONS } from '@/lib/types';
import ImageUpload from '@/components/ImageUpload';

export default function CreateEventPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Event>>({
    title: '',
    description: '',
    date_time: '',
    location_address: '',
    theme: 'sunset',
    animation_effect: 'none',
    is_guest_list_public: true,
    is_comments_enabled: true,
    image_url: '',
    image_path: '',
  });

  const updateField = (field: keyof Event, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.title) {
      setError('Event title is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const slug = generateSlug(formData.title);

      // For now, create event without auth (we'll add auth later)
      // Using a dummy host_id for testing
      const eventData = {
        ...formData,
        slug,
        host_id: '00000000-0000-0000-0000-000000000000', // Placeholder
      };

      const { data, error: insertError } = await supabase
        .from('events')
        .insert([eventData])
        .select()
        .single();

      if (insertError) throw insertError;

      // Redirect to event page
      router.push(`/e/${data.slug}`);
    } catch (err: any) {
      console.error('Error creating event:', err);
      setError(err.message || 'Failed to create event');
      setLoading(false);
    }
  };

  const selectedTheme = THEMES.find(t => t.id === formData.theme) || THEMES[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Create Your Event
          </h1>
          <p className="text-gray-600">
            Turn up, African style. 🎉
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step >= num
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {num}
                </div>
                {num < 3 && (
                  <div
                    className={`w-16 h-1 ${
                      step > num ? 'bg-purple-600' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Form Steps */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Event Details
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="Chris's Birthday Bash"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Tell guests what to expect..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.date_time}
                  onChange={(e) => updateField('date_time', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location_address}
                  onChange={(e) => updateField('location_address', e.target.value)}
                  placeholder="Kampala, Uganda"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
              </div>

              <ImageUpload
                onUploadComplete={(url, path) => {
                  updateField('image_url', url);
                  updateField('image_path', path);
                }}
                currentImage={formData.image_url}
                label="Event Poster"
                className="mt-6"
              />

              <button
                onClick={() => setStep(2)}
                disabled={!formData.title}
                className="w-full bg-purple-600 text-white font-semibold py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                Next: Choose Theme
              </button>
            </div>
          )}

          {/* Step 2: Theme Selection */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Choose Your Vibe
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => updateField('theme', theme.id)}
                    className={`h-24 rounded-lg bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-white font-semibold shadow-lg hover:scale-105 transition ${
                      formData.theme === theme.id
                        ? 'ring-4 ring-purple-600 ring-offset-2'
                        : ''
                    }`}
                  >
                    {theme.name}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Animation Effect
                </label>
                <select
                  value={formData.animation_effect}
                  onChange={(e) => updateField('animation_effect', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                >
                  {ANIMATIONS.map((anim) => (
                    <option key={anim.id} value={anim.id}>
                      {anim.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-300 transition"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 bg-purple-600 text-white font-semibold py-3 rounded-lg hover:bg-purple-700 transition"
                >
                  Next: Preview
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Preview & Settings */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Preview & Settings
              </h2>

              {/* Preview Card */}
              <div
                className={`rounded-2xl bg-gradient-to-br ${selectedTheme.gradient} p-8 text-white shadow-2xl overflow-hidden relative`}
              >
                {formData.image_url && (
                  <div className="absolute inset-0">
                    <img
                      src={formData.image_url}
                      alt={formData.title}
                      className="w-full h-full object-cover opacity-30"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-black/60 to-black/40"></div>
                  </div>
                )}
                <div className="text-center relative z-10">
                  <h3 className="text-3xl font-bold mb-4">
                    {formData.title || 'Your Event Title'}
                  </h3>
                  {formData.description && (
                    <p className="text-lg opacity-90 mb-6">
                      {formData.description}
                    </p>
                  )}
                  <div className="space-y-2 text-sm opacity-80">
                    {formData.date_time && (
                      <p>
                        📅{' '}
                        {new Date(formData.date_time).toLocaleDateString(
                          'en-US',
                          { weekday: 'long', month: 'long', day: 'numeric' }
                        )}
                      </p>
                    )}
                    {formData.location_address && (
                      <p>📍 {formData.location_address}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-4 border-t pt-6">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.is_guest_list_public}
                    onChange={(e) =>
                      updateField('is_guest_list_public', e.target.checked)
                    }
                    className="w-5 h-5 text-purple-600 rounded"
                  />
                  <span className="text-gray-700">
                    Make guest list public
                  </span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.is_comments_enabled}
                    onChange={(e) =>
                      updateField('is_comments_enabled', e.target.checked)
                    }
                    className="w-5 h-5 text-purple-600 rounded"
                  />
                  <span className="text-gray-700">Enable comments</span>
                </label>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-300 transition"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-purple-600 text-white font-semibold py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition"
                >
                  {loading ? 'Creating...' : 'Create Event 🎉'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          Party Time Africa • Turn up, African style.
        </div>
      </div>
    </div>
  );
}
