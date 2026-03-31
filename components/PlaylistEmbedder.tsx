'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Playlist {
  id: string;
  type: 'spotify' | 'youtube';
  url: string;
  title: string;
  embedCode?: string;
}

export default function PlaylistEmbedder({ eventId }: { eventId: string }) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [playlistType, setPlaylistType] = useState<'spotify' | 'youtube'>('spotify');
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [playlistTitle, setPlaylistTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const extractSpotifyId = (url: string): string | null => {
    const match = url.match(/spotify\.com\/playlist\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  };

  const extractYouTubeId = (url: string): string | null => {
    const patterns = [
      /youtube\.com\/playlist\?list=([a-zA-Z0-9_-]+)/,
      /youtu\.be\/([a-zA-Z0-9_-]+)/,
      /youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const generateEmbedCode = (type: string, id: string): string => {
    if (type === 'spotify') {
      return `<iframe src="https://open.spotify.com/embed/playlist/${id}" width="100%" height="380" frameborder="0" allowtransparency="true" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe>`;
    } else if (type === 'youtube') {
      return `<iframe width="100%" height="380" src="https://www.youtube.com/embed/videoseries?list=${id}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    }
    return '';
  };

  const addPlaylist = async () => {
    if (!playlistUrl || !playlistTitle) {
      alert('Please fill in all fields');
      return;
    }

    let playlistId = '';
    if (playlistType === 'spotify') {
      playlistId = extractSpotifyId(playlistUrl) || '';
    } else {
      playlistId = extractYouTubeId(playlistUrl) || '';
    }

    if (!playlistId) {
      alert('Invalid playlist URL');
      return;
    }

    try {
      setLoading(true);
      const newPlaylist: Playlist = {
        id: `${playlistType}_${Date.now()}`,
        type: playlistType,
        url: playlistUrl,
        title: playlistTitle,
        embedCode: generateEmbedCode(playlistType, playlistId),
      };

      // Save to database
      const { error } = await supabase
        .from('event_playlists')
        .insert({
          event_id: eventId,
          playlist_data: newPlaylist,
        });

      if (error) throw error;

      setPlaylists([...playlists, newPlaylist]);
      setPlaylistUrl('');
      setPlaylistTitle('');
      setShowForm(false);
    } catch (error: any) {
      alert('Error adding playlist: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const removePlaylist = async (id: string) => {
    try {
      await supabase
        .from('event_playlists')
        .delete()
        .eq('playlist_data->id', id);

      setPlaylists(playlists.filter((p) => p.id !== id));
    } catch (error: any) {
      alert('Error removing playlist: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Playlist Button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full bg-accent text-primary py-3 rounded-lg font-semibold hover:bg-accent/90 transition-colors"
        >
          + Add Playlist
        </button>
      )}

      {/* Add Playlist Form */}
      {showForm && (
        <div className="bg-primary rounded-lg p-6 border border-border/30 space-y-4">
          <h3 className="text-lg font-bold text-text-light">Add Event Playlist</h3>

          {/* Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-text-light mb-3">Platform</label>
            <div className="flex gap-3">
              <button
                onClick={() => setPlaylistType('spotify')}
                className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
                  playlistType === 'spotify'
                    ? 'bg-green-500 text-white'
                    : 'bg-secondary border border-border/30 text-text-light hover:border-accent/50'
                }`}
              >
                🎵 Spotify
              </button>
              <button
                onClick={() => setPlaylistType('youtube')}
                className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
                  playlistType === 'youtube'
                    ? 'bg-red-500 text-white'
                    : 'bg-secondary border border-border/30 text-text-light hover:border-accent/50'
                }`}
              >
                ▶️ YouTube
              </button>
            </div>
          </div>

          {/* Title Input */}
          <div>
            <label className="block text-sm font-semibold text-text-light mb-2">Playlist Title</label>
            <input
              type="text"
              value={playlistTitle}
              onChange={(e) => setPlaylistTitle(e.target.value)}
              placeholder="e.g., Party Hits 2026"
              className="w-full bg-secondary border border-border/30 rounded px-4 py-2 text-text-light placeholder-text-dark/50 focus:outline-none focus:border-accent"
            />
          </div>

          {/* URL Input */}
          <div>
            <label className="block text-sm font-semibold text-text-light mb-2">
              {playlistType === 'spotify' ? 'Spotify Playlist URL' : 'YouTube Playlist URL'}
            </label>
            <input
              type="url"
              value={playlistUrl}
              onChange={(e) => setPlaylistUrl(e.target.value)}
              placeholder={
                playlistType === 'spotify'
                  ? 'https://open.spotify.com/playlist/...'
                  : 'https://youtube.com/playlist?list=...'
              }
              className="w-full bg-secondary border border-border/30 rounded px-4 py-2 text-text-light placeholder-text-dark/50 focus:outline-none focus:border-accent"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={addPlaylist}
              disabled={loading}
              className="flex-1 bg-accent text-primary py-2 rounded-lg font-semibold hover:bg-accent/90 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Playlist'}
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

      {/* Playlists List */}
      {playlists.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-text-light">Event Playlists</h3>
          {playlists.map((playlist) => (
            <div key={playlist.id} className="bg-primary rounded-lg p-4 border border-border/30 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-text-light">{playlist.title}</p>
                  <p className="text-sm text-text-dark">
                    {playlist.type === 'spotify' ? '🎵 Spotify' : '▶️ YouTube'}
                  </p>
                </div>
                <button
                  onClick={() => removePlaylist(playlist.id)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Embed Preview */}
              {playlist.embedCode && (
                <div className="bg-secondary rounded p-3 overflow-hidden">
                  <div dangerouslySetInnerHTML={{ __html: playlist.embedCode }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {playlists.length === 0 && !showForm && (
        <div className="text-center py-8 text-text-dark">
          <p className="text-4xl mb-2">🎵</p>
          <p>No playlists added yet</p>
        </div>
      )}
    </div>
  );
}
