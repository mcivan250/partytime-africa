'use client';

import { useState, useRef } from 'react';

interface MediaUploadProps {
  onUpload: (url: string, type: 'image' | 'video' | 'audio') => void;
  disabled?: boolean;
}

export default function MediaUpload({ onUpload, disabled = false }: MediaUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        // Determine media type
        const type = file.type.startsWith('image/')
          ? 'image'
          : file.type.startsWith('video/')
          ? 'video'
          : 'audio';

        onUpload(data.url, type);
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (err: any) {
      console.error('Error uploading media:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,audio/*"
        onChange={handleFileSelect}
        disabled={uploading || disabled}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading || disabled}
        className="bg-accent/20 hover:bg-accent/30 disabled:bg-accent/10 text-accent font-bold px-3 py-2 rounded-lg transition-colors flex items-center gap-2"
        title="Upload media"
      >
        {uploading ? (
          <>
            <span className="animate-spin">⏳</span>
            Uploading...
          </>
        ) : (
          <>
            <span>📎</span>
            Media
          </>
        )}
      </button>
      {error && (
        <div className="absolute bottom-full mb-2 left-0 bg-red-500/10 border border-red-500/30 rounded px-2 py-1 text-xs text-red-400 whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  );
}
