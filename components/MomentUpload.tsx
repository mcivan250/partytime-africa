'use client';

import { useState, useRef } from 'react';
import { uploadMomentImage, createMoment } from '@/lib/moments';
import { getCurrentUser } from '@/lib/auth';

interface MomentUploadProps {
  eventId: string;
  onMomentCreated?: () => void;
}

export default function MomentUpload({ eventId, onMomentCreated }: MomentUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!preview || !fileInputRef.current?.files?.[0]) {
      setError('Please select an image');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const user = await getCurrentUser();
      if (!user) throw new Error('Not authenticated');

      const file = fileInputRef.current.files[0];

      // Upload image
      const imageUrl = await uploadMomentImage(eventId, user.id, file);

      // Create moment
      await createMoment(eventId, user.id, imageUrl, caption);

      // Reset form
      setPreview(null);
      setCaption('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Notify parent
      onMomentCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error uploading image');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">📸 Share Your Moment</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Image Preview */}
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-64 object-cover rounded-lg"
            />
            <button
              type="button"
              onClick={() => {
                setPreview(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
            >
              ✕
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-purple-600 transition"
          >
            <div className="text-4xl mb-2">📷</div>
            <p className="text-gray-600 font-medium">Click to upload or drag and drop</p>
            <p className="text-sm text-gray-500">PNG, JPG, GIF up to 5MB</p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Caption */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Caption (optional)
          </label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="What's happening at this event? 🎉"
            maxLength={280}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 resize-none"
            rows={3}
          />
          <p className="text-xs text-gray-500 mt-1">{caption.length}/280</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!preview || loading}
          className="w-full bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Uploading...' : 'Share Moment'}
        </button>
      </form>
    </div>
  );
}
