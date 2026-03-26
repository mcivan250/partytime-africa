'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, AuthUser, signOut } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Event } from '@/lib/types';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [eventsCreated, setEventsCreated] = useState<Event[]>([]);
  const [eventsAttending, setEventsAttending] = useState<Event[]>([]);
  const [activeTab, setActiveTab] = useState<'attending' | 'created'>('attending');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      router.push('/auth');
      return;
    }

    setUser(currentUser);
    await loadUserEvents(currentUser.id);
    setLoading(false);
  };

  const loadUserEvents = async (userId: string) => {
    try {
      // Load events created by user
      const { data: created, error: createdError } = await supabase
        .from('events')
        .select('*')
        .eq('host_id', userId)
        .order('date_time', { ascending: false });

      if (!createdError && created) {
        setEventsCreated(created);
      }

      // Load events user is attending (via RSVPs)
      const { data: rsvps, error: rsvpsError } = await supabase
        .from('rsvps')
        .select('event_id, status, events(*)')
        .eq('user_id', userId)
        .in('status', ['going', 'maybe'])
        .order('created_at', { ascending: false });

      if (!rsvpsError && rsvps) {
        const attendingEvents = rsvps
          .map((r: any) => r.events)
          .filter((e: any) => e !== null);
        setEventsAttending(attendingEvents);
      }
    } catch (error) {
      console.error('Error loading user events:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-24">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8">
          {/* Cover Image */}
          <div className="h-32 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400"></div>

          {/* Profile Info */}
          <div className="px-6 pb-6">
            <div className="flex items-start justify-between">
              {/* Avatar */}
              <div className="-mt-16 mb-4">
                {user.profile_photo_url ? (
                  <img
                    src={user.profile_photo_url}
                    alt={user.name}
                    className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-5xl font-bold">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Edit Buttons */}
              <div className="mt-4 flex space-x-2">
                <Link
                  href="/profile/edit"
                  className="px-4 py-2 text-sm bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition font-semibold"
                >
                  Edit Profile
                </Link>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  Sign Out
                </button>
              </div>
            </div>

            {/* User Info */}
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {user.name}
            </h1>
            {user.email && (
              <p className="text-gray-600 mb-1">{user.email}</p>
            )}
            {user.phone_number && (
              <p className="text-gray-600">{user.phone_number}</p>
            )}

            {/* Stats */}
            <div className="flex space-x-8 mt-6 pt-6 border-t border-gray-100">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {eventsCreated.length}
                </div>
                <div className="text-sm text-gray-600">Created</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-600">
                  {eventsAttending.length}
                </div>
                <div className="text-sm text-gray-600">Attending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  0
                </div>
                <div className="text-sm text-gray-600">Friends</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('attending')}
            className={`flex-1 py-3 px-6 rounded-xl font-semibold transition ${
              activeTab === 'attending'
                ? 'bg-white text-purple-600 shadow-lg'
                : 'text-gray-600 hover:bg-white/50'
            }`}
          >
            Attending ({eventsAttending.length})
          </button>
          <button
            onClick={() => setActiveTab('created')}
            className={`flex-1 py-3 px-6 rounded-xl font-semibold transition ${
              activeTab === 'created'
                ? 'bg-white text-purple-600 shadow-lg'
                : 'text-gray-600 hover:bg-white/50'
            }`}
          >
            Created ({eventsCreated.length})
          </button>
        </div>

        {/* Events List */}
        <div className="space-y-4">
          {activeTab === 'attending' && (
            <>
              {eventsAttending.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center">
                  <span className="text-6xl block mb-4">🎉</span>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    No upcoming events
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Browse events and RSVP to start building your calendar
                  </p>
                  <Link
                    href="/events"
                    className="inline-block bg-purple-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-purple-700 transition"
                  >
                    Discover Events
                  </Link>
                </div>
              ) : (
                eventsAttending.map((event) => (
                  <Link
                    key={event.id}
                    href={`/e/${event.slug}`}
                    className="block bg-white rounded-2xl p-6 hover:shadow-lg transition"
                  >
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {event.title}
                    </h3>
                    {event.date_time && (
                      <p className="text-gray-600">
                        📅 {new Date(event.date_time).toLocaleDateString()}
                      </p>
                    )}
                  </Link>
                ))
              )}
            </>
          )}

          {activeTab === 'created' && (
            <>
              {eventsCreated.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center">
                  <span className="text-6xl block mb-4">✨</span>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    No events created yet
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Create your first event and start building your community
                  </p>
                  <Link
                    href="/create"
                    className="inline-block bg-purple-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-purple-700 transition"
                  >
                    Create Event
                  </Link>
                </div>
              ) : (
                eventsCreated.map((event) => (
                  <Link
                    key={event.id}
                    href={`/e/${event.slug}`}
                    className="block bg-white rounded-2xl p-6 hover:shadow-lg transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {event.title}
                        </h3>
                        {event.date_time && (
                          <p className="text-gray-600">
                            📅 {new Date(event.date_time).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Link
                        href={`/e/${event.slug}/edit`}
                        className="px-4 py-2 bg-purple-100 text-purple-600 rounded-lg font-semibold hover:bg-purple-200 transition"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Edit
                      </Link>
                    </div>
                  </Link>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
