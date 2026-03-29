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
      fetchProfile(); // Re-fetch to ensure latest data
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (userLoading || !user) {
    return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Loading profile...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
      <div className="max-w-3xl mx-auto bg-gray-800 rounded-lg shadow-lg p-6 sm:p-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-8">Your Profile</h1>

        {loadingProfile ? (
          <p className="text-center">Loading profile data...</p>
        ) : error ? (
          <p className="text-red-500 text-center">Error: {error}</p>
        ) : profile ? (
          <div className="space-y-6">
            {/* Avatar */}
            <div className="text-center mb-6">
              <div className="w-24 h-24 rounded-full bg-yellow-500 flex items-center justify-center mx-auto text-gray-900 text-4xl font-bold">
                {(profile.name || user.email || '?')[0].toUpperCase()}
              </div>
              <p className="text-xl font-semibold mt-2">{profile.name || user.email}</p>
            </div>

            <div className="form-group">
              <label htmlFor="email" className="block text-lg font-medium text-gray-300 mb-2">Email</label>
              <input
                type="email"
                id="email"
                value={user.email || ''}
                className="w-full p-3 rounded-md bg-gray-700 border border-gray-600 text-gray-400 cursor-not-allowed"
                disabled
              />
            </div>

            <div className="form-group">
              <label htmlFor="name" className="block text-lg font-medium text-gray-300 mb-2">Name</label>
              {editing ? (
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 rounded-md bg-gray-700 border border-gray-600 focus:ring-yellow-500 focus:border-yellow-500 text-white"
                  placeholder="Your name"
                />
              ) : (
                <p className="p-3 rounded-md bg-gray-700 text-white">{profile.name || 'Not set'}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="bio" className="block text-lg font-medium text-gray-300 mb-2">Bio</label>
              {editing ? (
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full p-3 rounded-md bg-gray-700 border border-gray-600 focus:ring-yellow-500 focus:border-yellow-500 text-white"
                  placeholder="Tell us about yourself..."
                ></textarea>
              ) : (
                <p className="p-3 rounded-md bg-gray-700 text-white whitespace-pre-wrap">{profile.bio || 'Not set'}</p>
              )}
            </div>

            <div className="flex gap-4 mt-6">
              {editing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-3 px-4 rounded-md transition-colors duration-200"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => { setEditing(false); setName(profile.name || ''); setBio(profile.bio || ''); }}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-md transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-3 px-4 rounded-md transition-colors duration-200"
                >
                  Edit Profile
                </button>
              )}
            </div>

            <button
              onClick={signOut}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-md transition-colors duration-200 mt-4"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <p className="text-center">No profile data found.</p>
        )}

        <div className="mt-8 text-center">
          <Link href="/dashboard" className="text-yellow-500 hover:underline">← Back to Dashboard</Link>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
