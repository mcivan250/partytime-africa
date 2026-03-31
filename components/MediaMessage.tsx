'use client';

interface MediaMessageProps {
  url: string;
  type: 'image' | 'video' | 'audio';
  caption?: string;
}

export default function MediaMessage({ url, type, caption }: MediaMessageProps) {
  return (
    <div className="max-w-xs">
      {type === 'image' && (
        <img
          src={url}
          alt="Shared media"
          className="rounded-lg w-full h-auto object-cover max-h-80"
        />
      )}
      {type === 'video' && (
        <video
          src={url}
          controls
          className="rounded-lg w-full h-auto max-h-80"
        />
      )}
      {type === 'audio' && (
        <audio
          src={url}
          controls
          className="rounded-lg w-full"
        />
      )}
      {caption && (
        <p className="mt-2 text-sm opacity-80">{caption}</p>
      )}
    </div>
  );
}
