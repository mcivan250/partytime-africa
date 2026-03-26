'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, AuthUser } from '@/lib/auth';
import { getFriends, searchUsers, addFriend, removeFriend } from '@/lib/friends';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  name: string;
  email?: string;
  profile_photo_url?: string;
}

export default function FriendsPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [friends, setFriends] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadPage();
  }, []);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      handleSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const loadPage = async () => {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      router.push('/auth');
      return;
    }

    setUser(currentUser);
    await loadFriends(currentUser.id);
    setLoading(false);
  };

  const loadFriends = async (userId: string) => {
    try {
      const userFriends = await getFriends(userId);
      setFriends(userFriends);
      
      // Build set of friend IDs for quick lookup
      const ids = new Set(userFriends.map((f: any) => f.friend_id));
      setFriendIds(ids);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.length < 2) return;
    
    setSearching(true);
    try {
      const results = await searchUsers(searchQuery);
      // Filter out current user and existing friends
      const filtered = results.filter(
        (u: User) => u.id !== user?.id && !friendIds.has(u.id)
      );
      setSearchResults(filtered);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleAddFriend = async (friendId: string) => {
    if (!user) return;
    
    try {
      await addFriend(user.id, friendId);
      // Reload friends
      await loadFriends(user.id);
      // Remove from search results
      setSearchResults(prev => prev.filter(u => u.id !== friendId));
    } catch (error) {
      console.error('Error adding friend:', error);
      alert('Failed to add friend');
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!user) return;
    
    if (!confirm('Remove this friend?')) return;
    
    try {
      await removeFriend(user.id, friendId);
      await loadFriends(user.id);
    } catch (error) {
      console.error('Error removing friend:', error);
      alert('Failed to remove friend');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-24">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Friends
          </h1>
          <p className="text-gray-600">
            Connect with friends and see what events they're attending
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search people by name or email..."
              className="w-full px-6 py-4 pl-12 rounded-2xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition text-lg"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl">
              🔍
            </span>
            {searching && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-600 border-t-transparent"></div>
              </span>
            )}
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-4 bg-white rounded-2xl shadow-lg p-4 space-y-3">
              <h3 className="font-semibold text-gray-700 px-2">Search Results</h3>
              {searchResults.map((person) => (
                <div
                  key={person.id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition"
                >
                  <div className="flex items-center space-x-3">
                    {person.profile_photo_url ? (
                      <img
                        src={person.profile_photo_url}
                        alt={person.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                        {person.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-gray-900">{person.name}</div>
                      {person.email && (
                        <div className="text-sm text-gray-500">{person.email}</div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddFriend(person.id)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
                  >
                    Add Friend
                  </button>
                </div>
              ))}
            </div>
          )}

          {searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
            <div className="mt-4 bg-white rounded-2xl shadow-lg p-8 text-center">
              <span className="text-4xl block mb-2">🔍</span>
              <p className="text-gray-600">No users found</p>
            </div>
          )}
        </div>

        {/* Friends List */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Your Friends ({friends.length})
          </h2>

          {friends.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center">
              <span className="text-6xl block mb-4">👥</span>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No friends yet
              </h3>
              <p className="text-gray-600 mb-6">
                Search for people above to add your first friend
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {friends.map((friendship) => {
                const friend = friendship.friend;
                return (
                  <div
                    key={friendship.id}
                    className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {friend?.profile_photo_url ? (
                          <img
                            src={friend.profile_photo_url}
                            alt={friend.name}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-2xl">
                            {friend?.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-lg text-gray-900">
                            {friend?.name || 'Unknown'}
                          </div>
                          {friend?.email && (
                            <div className="text-sm text-gray-500">{friend.email}</div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveFriend(friend?.id)}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-semibold hover:bg-red-100 transition text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
