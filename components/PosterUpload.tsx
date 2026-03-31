import React, { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

interface PosterUploadProps {
  eventId: string;
  onUploadComplete?: (posterUrl: string) => void;
}

export default function PosterUpload({ eventId, onUploadComplete }: PosterUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const fileName = `${eventId}-${Date.now()}-${file.name}`;
      const { data, error: uploadError } = await supabase.storage
        .from('event-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('event-images')
        .getPublicUrl(fileName);

      // Update event with poster URL
      await supabase.from('events').update({ poster_url: publicUrl }).eq('id', eventId);

      setPosterUrl(publicUrl);
      if (onUploadComplete) {
        onUploadComplete(publicUrl);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload poster');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <label className="block text-lg font-display font-semibold text-text-light mb-4">
          🎨 Event Poster / Flyer
        </label>
        <p className="text-text-dark text-sm mb-4">Upload a stunning poster to showcase your event. Recommended size: 1200x1600px</p>

        {posterUrl ? (
          <div className="relative w-full h-96 rounded-lg overflow-hidden border-2 border-accent">
            <Image
              src={posterUrl}
              alt="Event Poster"
              layout="fill"
              objectFit="cover"
              className="rounded-lg"
            />
            <button
              onClick={() => {
                setPosterUrl(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="absolute top-4 right-4 bg-error text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors"
            >
              Remove
            </button>
          </div>
        ) : (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative w-full border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 cursor-pointer ${
              dragActive
                ? 'border-accent bg-accent/10'
                : 'border-border hover:border-accent'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleChange}
              disabled={uploading}
              className="hidden"
            />

            <div className="space-y-3">
              <div className="text-5xl">📸</div>
              <div>
                <p className="text-text-light font-semibold text-lg">
                  {uploading ? 'Uploading...' : 'Drag your poster here or click to browse'}
                </p>
                <p className="text-text-dark text-sm mt-1">PNG, JPG, or GIF (Max 10MB)</p>
              </div>
            </div>

            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
                  <p className="text-text-light mt-4">Uploading your poster...</p>
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-error/10 border border-error rounded-lg">
            <p className="text-error font-semibold">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
