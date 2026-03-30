'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const ProfilePage: React.FC = () => {
  const { user, loading: userLoading, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/auth/signin');
    }
    if (user) {
      fetchProfile();
    }
  }, [user, userLoading]);

  const fetchProfile = async () => {
    setLoadingProfile(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
      setName(data.name || '');
      setBio(data.bio || '');
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err.message || 'Failed to fetch profile');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('users')
        .upsert({ id: user.id, name, bio }, { onConflict: 'id' });

      if (error) throw error;
      setEditing(false);
      fetchProfile();
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (userLoading || !user) {
    return (
      <div className="min-h-screen bg-primary text-text-light flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary text-text-light pb-8">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-accent/20 to-accent/5 border-b border-border/30 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-accent/30 border-2 border-accent flex items-center justify-center text-3xl font-bold text-accent">
              {(profile?.name || user.email || '?')[0].toUpperCase()}
            </div>
            
            {/* User Info */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-text-light">{profile?.name || user.email}</h1>
              <p className="text-text-dark text-sm">{user.email}</p>
              <p className="text-accent text-xs mt-1">Member since 2026</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto p-4">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Link
            href="/dashboard"
            className="bg-secondary border border-border/30 rounded-xl p-4 hover:border-accent/50 transition-colors text-center"
          >
            <div className="text-3xl mb-2">📊</div>
            <p className="font-semibold text-sm text-text-light">Dashboard</p>
            <p className="text-xs text-text-dark">Your events</p>
          </Link>
          
          <Link
            href="/wallet"
            className="bg-secondary border border-border/30 rounded-xl p-4 hover:border-accent/50 transition-colors text-center"
          >
            <div className="text-3xl mb-2">💰</div>
            <p className="font-semibold text-sm text-text-light">Wallet</p>
            <p className="text-xs text-text-dark">Balance & earnings</p>
          </Link>

          <Link
            href="/messages"
            className="bg-secondary border border-border/30 rounded-xl p-4 hover:border-accent/50 transition-colors text-center"
          >
            <div className="text-3xl mb-2">💬</div>
            <p className="font-semibold text-sm text-text-light">Messages</p>
            <p className="text-xs text-text-dark">Conversations</p>
          </Link>

          <Link
            href="/friends"
            className="bg-secondary border border-border/30 rounded-xl p-4 hover:border-accent/50 transition-colors text-center"
          >
            <div className="text-3xl mb-2">👥</div>
            <p className="font-semibold text-sm text-text-light">Friends</p>
            <p className="text-xs text-text-dark">Your network</p>
          </Link>
        </div>

        {/* Profile Settings */}
        <div className="bg-secondary border border-border/30 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-bold text-text-light mb-4">Profile Settings</h2>

          {loadingProfile ? (
            <p className="text-center text-text-dark">Loading profile data...</p>
          ) : error ? (
            <p className="text-red-500 text-center">Error: {error}</p>
          ) : profile ? (
            <div className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-text-dark mb-2">Email</label>
                <input
                  type="email"
                  value={user.email || ''}
                  className="w-full p-3 rounded-lg bg-primary border border-border/30 text-text-dark cursor-not-allowed"
                  disabled
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-text-dark mb-2">Name</label>
                {editing ? (
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-3 rounded-lg bg-primary border border-border/50 focus:border-accent text-text-light"
                    placeholder="Your name"
                  />
                ) : (
                  <p className="p-3 rounded-lg bg-primary border border-border/30 text-text-light">
                    {profile.name || 'Not set'}
                  </p>
                )}
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-text-dark mb-2">Bio</label>
                {editing ? (
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className="w-full p-3 rounded-lg bg-primary border border-border/50 focus:border-accent text-text-light"
                    placeholder="Tell us about yourself..."
                  ></textarea>
                ) : (
                  <p className="p-3 rounded-lg bg-primary border border-border/30 text-text-light whitespace-pre-wrap">
                    {profile.bio || 'Not set'}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                {editing ? (
                  <>
                    <button
                      onClick={handleSave}
                      className="flex-1 bg-accent hover:bg-accent/90 text-primary font-bold py-3 px-4 rounded-lg transition-colors"
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false);
                        setName(profile.name || '');
                        setBio(profile.bio || '');
                      }}
                      className="flex-1 bg-secondary border border-border/30 hover:border-border/50 text-text-light font-bold py-3 px-4 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditing(true)}
                    className="w-full bg-accent hover:bg-accent/90 text-primary font-bold py-3 px-4 rounded-lg transition-colors"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          ) : (
            <p className="text-center text-text-dark">No profile data found.</p>
          )}
        </div>

        {/* Account Actions */}
        <div className="space-y-3">
          <button
            onClick={signOut}
            className="w-full bg-red-500/20 border border-red-500/50 hover:bg-red-500/30 text-red-400 font-bold py-3 px-4 rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
