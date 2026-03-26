'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, generateSlug } from '@/lib/supabase';
import { Event, THEMES, ANIMATIONS } from '@/lib/types';
import { getCurrentUser } from '@/lib/auth';
import ImageUpload from '@/components/ImageUpload';
import Link from 'next/link';

export default function CreateEventPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imagePath, setImagePath] = useState<string>('');

  const [formData, setFormData] = useState<Partial<Event>>({
    title: '',
    description: '',
    date_time: '',
    location_address: '',
    theme: 'sunset',
    animation_effect: 'none',
    is_guest_list_public: true,
    is_comments_enabled: true,
  });

  const updateField = (field: keyof Event, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (url: string, path: string) => {
    setImageUrl(url);
    setImagePath(path);
  };

  const handleSubmit = async () => {
    if (!formData.title) {
      setError('Event title is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get current user
      const user = await getCurrentUser();
      if (!user) {
        router.push('/auth');
        return;
      }

      const slug = generateSlug(formData.title);

      const eventData = {
        ...formData,
        slug,
        host_id: user.id,
        image_url: imageUrl || null,
        image_path: imagePath || null,
      };

      const { data, error: insertError } = await supabase
        .from('events')
        .insert([eventData])
        .select()
        .single();

      if (insertError) throw insertError;

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
          <Link href="/" className="text-purple-600 font-semibold hover:underline mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Create Your Event
          </h1>
          <p className="text-gray-600">
            Beautiful invites in minutes. 100% Free. 🎉
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3, 4].map((num) => (
              <div key={num} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition ${
                    step >= num
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {num}
                </div>
                {num < 4 && (
                  <div
                    className={`w-16 h-1 transition ${
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
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded mb-6">
            <p className="font-semibold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Form Steps */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                📝 Event Details
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
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600 transition"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Tell guests what to expect... drinks, music, vibes!"
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600 transition"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.date_time}
                    onChange={(e) => updateField('date_time', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location *
                  </label>
                  <input
                    type="text"
                    value={formData.location_address}
                    onChange={(e) => updateField('location_address', e.target.value)}
                    placeholder="Sky Lounge, Kampala"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600 transition"
                  />
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!formData.title}
                className="w-full bg-purple-600 text-white font-semibold py-4 rounded-xl hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl"
              >
                Next: Add Event Image →
              </button>
            </div>
          )}

          {/* Step 2: Image Upload */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                🖼️ Event Image
              </h2>

              <p className="text-gray-600 mb-6">
                Add a cover image to make your event stand out! (Optional but recommended)
              </p>

              <ImageUpload
                onUploadComplete={handleImageUpload}
                currentImage={imageUrl}
                label="Event Poster / Cover Image"
                bucket="event-images"
                folder="events"
              />

              {imageUrl && (
                <div className="mt-4">
                  <p className="text-sm text-green-600 font-semibold">
                    ✓ Image uploaded successfully!
                  </p>
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-200 text-gray-700 font-semibold py-4 rounded-xl hover:bg-gray-300 transition"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 bg-purple-600 text-white font-semibold py-4 rounded-xl hover:bg-purple-700 transition shadow-lg"
                >
                  Next: Choose Theme →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Theme Selection */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                🎨 Choose Your Vibe
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => updateField('theme', theme.id)}
                    className={`h-24 rounded-xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-white font-semibold shadow-lg hover:scale-105 transition ${
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
                  Animation Effect (Optional)
                </label>
                <select
                  value={formData.animation_effect}
                  onChange={(e) => updateField('animation_effect', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-600 transition"
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
                  onClick={() => setStep(2)}
                  className="flex-1 bg-gray-200 text-gray-700 font-semibold py-4 rounded-xl hover:bg-gray-300 transition"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="flex-1 bg-purple-600 text-white font-semibold py-4 rounded-xl hover:bg-purple-700 transition shadow-lg"
                >
                  Next: Preview & Publish →
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Preview & Publish */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                👀 Preview & Publish
              </h2>

              {/* Preview Card */}
              <div
                className={`rounded-2xl bg-gradient-to-br ${selectedTheme.gradient} p-8 text-white shadow-2xl`}
              >
                {imageUrl && (
                  <div className="mb-6 rounded-xl overflow-hidden">
                    <img src={imageUrl} alt={formData.title} className="w-full h-64 object-cover" />
                  </div>
                )}
                <div className="text-center">
                  <h3 className="text-4xl font-bold mb-4">{formData.title || 'Your Event'}</h3>
                  {formData.description && (
                    <p className="text-xl opacity-90 mb-6">{formData.description}</p>
                  )}
                  <div className="space-y-2">
                    {formData.date_time && (
                      <p className="flex items-center justify-center space-x-2">
                        <span>📅</span>
                        <span>{new Date(formData.date_time).toLocaleDateString()}</span>
                      </p>
                    )}
                    {formData.location_address && (
                      <p className="flex items-center justify-center space-x-2">
                        <span>📍</span>
                        <span>{formData.location_address}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.is_guest_list_public}
                    onChange={(e) => updateField('is_guest_list_public', e.target.checked)}
                    className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-600"
                  />
                  <span className="text-gray-700">Show guest list publicly</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.is_comments_enabled}
                    onChange={(e) => updateField('is_comments_enabled', e.target.checked)}
                    className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-600"
                  />
                  <span className="text-gray-700">Allow comments</span>
                </label>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 bg-gray-200 text-gray-700 font-semibold py-4 rounded-xl hover:bg-gray-300 transition"
                  disabled={loading}
                >
                  ← Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-purple-600 text-white font-semibold py-4 rounded-xl hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Publishing...
                    </span>
                  ) : (
                    '🚀 Publish Event'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
