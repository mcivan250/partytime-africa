'use client';

import { useState, useRef } from 'react';
import { uploadImage, validateImageFile } from '@/lib/storage';

interface ImageUploadProps {
  onUploadComplete: (url: string, path: string) => void;
  bucket?: string;
  folder?: string;
  currentImage?: string;
  label?: string;
  className?: string;
}

export default function ImageUpload({
  onUploadComplete,
  bucket = 'event-images',
  folder = 'events',
  currentImage,
  label = 'Upload Image',
  className = ''
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    try {
      const result = await uploadImage(file, bucket, folder);
      onUploadComplete(result.url, result.path);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
      setPreview(currentImage || null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      <div className="flex items-center space-x-4">
        {preview && (
          <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-300">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent"></div>
              </div>
            )}
          </div>
        )}

        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center space-x-2"
          >
            <span className="text-xl">📷</span>
            <span>{uploading ? 'Uploading...' : preview ? 'Change Image' : 'Choose Image'}</span>
          </button>
          <p className="text-xs text-gray-500 mt-2">
            JPG, PNG, GIF or WebP. Max 5MB.
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}
