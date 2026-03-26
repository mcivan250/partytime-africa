'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Event, THEMES, ANIMATIONS } from '@/lib/types';
import { getCurrentUser } from '@/lib/auth';
import { updateEvent, getEventBySlug, userOwnsEvent } from '@/lib/events';
import ImageUpload from '@/components/ImageUpload';
import Link from 'next/link';

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<Partial<Event>>({});
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imagePath, setImagePath] = useState<string>('');

  useEffect(() => {
    loadEvent();
  }, [slug]);

  const loadEvent = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/auth');
        return;
      }

      const eventData = await getEventBySlug(slug);
      if (!eventData) {
        setError('Event not found');
        setLoading(false);
        return;
      }

      // Check if user owns this event
      const owns = await userOwnsEvent(eventData.id!, user.id);
      if (!owns) {
        setError('You do not have permission to edit this event');
        setLoading(false);
        return;
      }

      setEvent(eventData);
      setFormData(eventData);
      setImageUrl(eventData.image_url || '');
      setImagePath(eventData.image_path || '');
      setLoading(false);
    } catch (err: any) {
      console.error('Error loading event:', err);
      setError('Failed to load event');
      setLoading(false);
    }
  };

  const updateField = (field: keyof Event, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (url: string, path: string) => {
    setImageUrl(url);
    setImagePath(path);
  };

  const handleSave = async () => {
    if (!event?.id) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const updates = {
        ...formData,
        image_url: imageUrl || undefined,
        image_path: imagePath || undefined,
      };

      await updateEvent(event.id, updates);
      setSuccess(true);
      
      // Redirect back to event page after 1 second
      setTimeout(() => {
        router.push(`/e/${slug}`);
      }, 1000);
    } catch (err: any) {
      console.error('Error updating event:', err);
      setError(err.message || 'Failed to update event');
      setSaving(false);
    }
  };

  const selectedTheme = THEMES.find(t => t.id === formData.theme) || THEMES[0];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mb-4"></div>
          <p className="text-gray-600">Loading event...</p>
        </div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/"
            className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/e/${slug}`} className="text-purple-600 font-semibold hover:underline mb-4 inline-block">
            ← Back to Event
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Edit Event
          </h1>
          <p className="text-gray-600">
            Update your event details
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded mb-6">
            <p className="font-semibold">Success!</p>
            <p className="text-sm">Event updated. Redirecting...</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded mb-6">
            <p className="font-semibold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-8">
          {/* Basic Info */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">
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
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => updateField('description', e.target.value)}
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
                  value={formData.date_time ? new Date(formData.date_time).toISOString().slice(0, 16) : ''}
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
                  value={formData.location_address || ''}
                  onChange={(e) => updateField('location_address', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600 transition"
                />
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <div className="pt-6 border-t border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              🖼️ Event Image
            </h2>

            <ImageUpload
              onUploadComplete={handleImageUpload}
              currentImage={imageUrl}
              label="Event Poster / Cover Image"
              bucket="event-images"
              folder={event?.id || 'temp'}
            />
          </div>

          {/* Theme */}
          <div className="pt-6 border-t border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              🎨 Theme & Style
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => updateField('theme', theme.id)}
                  type="button"
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
                Animation Effect
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
          </div>

          {/* Settings */}
          <div className="pt-6 border-t border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              ⚙️ Settings
            </h2>

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
          </div>

          {/* Actions */}
          <div className="pt-6 border-t border-gray-200 flex space-x-4">
            <Link
              href={`/e/${slug}`}
              className="flex-1 bg-gray-200 text-gray-700 font-semibold py-4 rounded-xl hover:bg-gray-300 transition text-center"
            >
              Cancel
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-purple-600 text-white font-semibold py-4 rounded-xl hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl"
            >
              {saving ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </span>
              ) : (
                '💾 Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
