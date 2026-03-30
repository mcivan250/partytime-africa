'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface Friend {
  id: string;
  name: string;
  profile_photo_url: string | null;
  status: 'online' | 'offline';
  mutual_friends: number;
}

export default function FriendsPage() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<number>(3);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFriends();
    }
  }, [user]);

  const fetchFriends = async () => {
    setLoading(true);
    try {
      // Simulate friends data for MVP/Demo
      const demoFriends: Friend[] = [
        { id: 'f1', name: "Sarah M.", profile_photo_url: null, status: 'online', mutual_friends: 12 },
        { id: 'f2', name: "James K.", profile_photo_url: null, status: 'offline', mutual_friends: 8 },
        { id: 'f3', name: "Amara T.", profile_photo_url: null, status: 'online', mutual_friends: 15 },
        { id: 'f4', name: "David L.", profile_photo_url: null, status: 'offline', mutual_friends: 4 },
        { id: 'f5', name: "Grace O.", profile_photo_url: null, status: 'online', mutual_friends: 21 },
        { id: 'f6', name: "Brian N.", profile_photo_url: null, status: 'offline', mutual_friends: 7 }
      ];
      setFriends(demoFriends);
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary text-text-light pb-20">
      {/* Header */}
      <div className="bg-secondary border-b border-border p-6 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="text-accent hover:text-yellow-300">
            ← Dashboard
          </Link>
          <h1 className="text-xl font-display font-bold">Friends</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-8">
        {/* Search Bar */}
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search friends..." 
            className="w-full bg-secondary border border-border/50 rounded-full px-10 py-3 text-sm focus:outline-none focus:border-accent transition-colors"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50">🔍</span>
        </div>

        {/* Requests Banner */}
        {requests > 0 && (
          <Link href="/friends/requests" className="block">
            <div className="card p-4 bg-accent/10 border-accent/30 flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <span className="text-xl">👋</span>
                <p className="font-bold text-accent">{requests} New Friend Requests</p>
              </div>
              <span className="text-accent group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>
        )}

        {/* Online Friends (Horizontal Scroll) */}
        <div className="space-y-4">
          <h3 className="text-lg font-display font-bold px-2">Online Now</h3>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-2">
            {friends.filter(f => f.status === 'online').map(friend => (
              <div key={friend.id} className="flex flex-col items-center gap-2 min-w-[80px]">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center text-xl font-bold text-accent border-2 border-accent/50 p-1">
                    <div className="w-full h-full rounded-full bg-accent/30 flex items-center justify-center">
                      {friend.name[0]}
                    </div>
                  </div>
                  <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-primary rounded-full"></div>
                </div>
                <p className="text-xs font-semibold truncate w-20 text-center">{friend.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* All Friends List */}
        <div className="space-y-4">
          <h3 className="text-lg font-display font-bold px-2">All Friends</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {friends.map((friend) => (
              <div key={friend.id} className="card p-4 bg-secondary border-border/30 flex items-center justify-between hover:border-accent/50 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-lg font-bold text-accent border border-accent/30 group-hover:scale-105 transition-transform">
                    {friend.name[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm md:text-base group-hover:text-accent transition-colors">{friend.name}</h4>
                    <p className="text-text-dark text-xs">{friend.mutual_friends} mutual friends</p>
                  </div>
                </div>
                <Link href={`/messages/${friend.id}`} className="p-2 hover:bg-accent/10 rounded-full text-accent transition-colors">
                  💬
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Invite Friends Section */}
        <div className="card p-8 bg-gradient-to-br from-secondary to-primary border-accent/20 text-center">
          <h4 className="text-xl font-display font-bold text-accent mb-2">Invite Your Crew</h4>
          <p className="text-text-dark text-sm mb-6">PartyTime is better with friends. Share your link and earn rewards!</p>
          <button className="btn btn-primary px-8 py-3 w-full sm:w-auto font-bold">
            Share Invite Link
          </button>
        </div>
      </div>
    </div>
  );
}
