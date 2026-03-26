'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Event, THEMES } from '@/lib/types';
import { getCurrentUser, AuthUser } from '@/lib/auth';
import { createOrUpdateRSVP, getRSVPsForEvent, getUserRSVP, getRSVPCounts } from '@/lib/rsvp';
import { createComment, getCommentsForEvent, getCommentCount, Comment } from '@/lib/comments';
import { getFriendsAttendingEvent } from '@/lib/friends';
import Link from 'next/link';

interface EventPageClientProps {
  event: Event;
}

export default function EventPageClient({ event }: EventPageClientProps) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userRsvp, setUserRsvp] = useState<any>(null);
  const [rsvpCounts, setRsvpCounts] = useState({ going: 0, maybe: 0, cant_go: 0, total: 0 });
  const [rsvps, setRsvps] = useState<any[]>([]);
  const [friendsAttending, setFriendsAttending] = useState<any[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentCount, setCommentCount] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAllGuests, setShowAllGuests] = useState(false);

  const selectedTheme = THEMES.find((t) => t.id === event.theme) || THEMES[0];

  useEffect(() => {
    loadUser();
    loadRSVPs();
    loadComments();
    loadFriendsAttending();
  }, []);

  const loadUser = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);

    if (currentUser) {
      const rsvp = await getUserRSVP(event.id!, currentUser.id);
      setUserRsvp(rsvp);
    }
  };

  const loadRSVPs = async () => {
    const counts = await getRSVPCounts(event.id!);
    setRsvpCounts(counts);

    if (event.is_guest_list_public) {
      const allRsvps = await getRSVPsForEvent(event.id!);
      setRsvps(allRsvps.filter((r: any) => r.status !== 'cant_go'));
    }
  };

  const loadComments = async () => {
    if (event.is_comments_enabled) {
      const eventComments = await getCommentsForEvent(event.id!);
      setComments(eventComments);
      const count = await getCommentCount(event.id!);
      setCommentCount(count);
    }
  };

  const loadFriendsAttending = async () => {
    if (!user) {
      const currentUser = await getCurrentUser();
      if (!currentUser) return;
      setUser(currentUser);
    }
    
    try {
      const friends = await getFriendsAttendingEvent(user?.id || '', event.id!);
      setFriendsAttending(friends);
    } catch (error) {
      console.error('Error loading friends attending:', error);
    }
  };

  const handleRSVP = async (status: 'going' | 'maybe' | 'cant_go') => {
    if (!user) {
      router.push('/auth');
      return;
    }

    setLoading(true);
    try {
      await createOrUpdateRSVP(event.id!, user.id, status);
      await loadUser();
      await loadRSVPs();
    } catch (error) {
      console.error('RSVP error:', error);
      alert('Failed to RSVP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/auth');
      return;
    }

    if (!newComment.trim()) return;

    setLoading(true);
    try {
      await createComment(event.id!, user.id, newComment.trim());
      setNewComment('');
      await loadComments();
    } catch (error) {
      console.error('Comment error:', error);
      alert('Failed to post comment.');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    const text = `🎉 ${event.title}\n\n${event.description || ''}\n\n${url}`;
    
    if (navigator.share) {
      navigator.share({ title: event.title, text, url });
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  const handleWhatsAppShare = () => {
    const url = window.location.href;
    const text = `🎉 ${event.title}\n\n${event.description || ''}\n\n📅 ${event.date_time ? new Date(event.date_time).toLocaleDateString() : ''}\n📍 ${event.location_address || ''}\n\nRSVP here: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Calculate urgency & social proof
  const totalInterested = rsvpCounts.going + rsvpCounts.maybe;
  const isTrending = totalInterested > 50;
  const isPopular = totalInterested > 20;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header - Fixed on mobile */}
      <div className="sticky top-0 z-50 bg-white shadow-md px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-purple-600 font-semibold hover:underline flex items-center">
            <span className="mr-2">←</span> Back
          </Link>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleWhatsAppShare}
              className="bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-600 transition flex items-center space-x-2"
            >
              <span>📱</span>
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
            <button
              onClick={handleShare}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition"
            >
              Share
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Social Proof Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          {isTrending && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-orange-100 text-orange-800">
              🔥 Trending
            </span>
          )}
          {isPopular && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-800">
              ⭐ Popular
            </span>
          )}
          {friendsAttending.length > 0 && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
              👥 {friendsAttending.length} {friendsAttending.length === 1 ? 'friend' : 'friends'} going
            </span>
          )}
        </div>

        {/* Event Card */}
        <div
          className={`rounded-3xl bg-gradient-to-br ${selectedTheme.gradient} p-8 md:p-12 text-white shadow-2xl mb-6 overflow-hidden relative`}
        >
          {event.image_url && (
            <div className="absolute inset-0">
              <img
                src={event.image_url}
                alt={event.title}
                className="w-full h-full object-cover opacity-40"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-black/70 to-black/50"></div>
            </div>
          )}
          <div className="text-center relative z-10">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">{event.title}</h1>

            {event.description && (
              <p className="text-lg md:text-xl opacity-90 mb-8 max-w-2xl mx-auto">
                {event.description}
              </p>
            )}

            <div className="space-y-3 text-base md:text-lg">
              {event.date_time && (
                <p className="flex items-center justify-center space-x-2">
                  <span>📅</span>
                  <span>
                    {new Date(event.date_time).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}{' '}
                    at{' '}
                    {new Date(event.date_time).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                </p>
              )}

              {event.location_address && (
                <p className="flex items-center justify-center space-x-2">
                  <span>📍</span>
                  <span>{event.location_address}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Social Proof Stats */}
        {totalInterested > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-purple-600">{rsvpCounts.going}</div>
                <div className="text-sm text-gray-600">Going</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-yellow-600">{rsvpCounts.maybe}</div>
                <div className="text-sm text-gray-600">Maybe</div>
              </div>
            </div>
            {rsvps.length > 0 && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowAllGuests(!showAllGuests)}
                  className="text-purple-600 hover:underline text-sm font-semibold"
                >
                  👀 See who's going
                </button>
              </div>
            )}
          </div>
        )}

        {/* RSVP Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Will you be there?
          </h2>

          {userRsvp && (
            <p className="text-center text-sm text-gray-600 mb-4">
              You responded: <span className="font-semibold">
                {userRsvp.status === 'going' && '✓ Going'}
                {userRsvp.status === 'maybe' && '? Maybe'}
                {userRsvp.status === 'cant_go' && "✗ Can't Go"}
              </span>
            </p>
          )}

          <div className="grid grid-cols-3 gap-3 md:gap-4">
            <button
              onClick={() => handleRSVP('going')}
              disabled={loading}
              className={`py-3 md:py-4 px-4 md:px-6 rounded-xl font-semibold transition shadow-lg ${
                userRsvp?.status === 'going'
                  ? 'bg-green-600 text-white scale-105'
                  : 'bg-green-500 text-white hover:bg-green-600 hover:scale-105'
              } disabled:opacity-50`}
            >
              <div className="text-xl md:text-2xl mb-1">✓</div>
              <div className="text-xs md:text-sm">Going</div>
              {rsvpCounts.going > 0 && (
                <div className="text-xs md:text-sm font-bold mt-1">{rsvpCounts.going}</div>
              )}
            </button>
            <button
              onClick={() => handleRSVP('maybe')}
              disabled={loading}
              className={`py-3 md:py-4 px-4 md:px-6 rounded-xl font-semibold transition shadow-lg ${
                userRsvp?.status === 'maybe'
                  ? 'bg-yellow-600 text-white scale-105'
                  : 'bg-yellow-500 text-white hover:bg-yellow-600 hover:scale-105'
              } disabled:opacity-50`}
            >
              <div className="text-xl md:text-2xl mb-1">?</div>
              <div className="text-xs md:text-sm">Maybe</div>
              {rsvpCounts.maybe > 0 && (
                <div className="text-xs md:text-sm font-bold mt-1">{rsvpCounts.maybe}</div>
              )}
            </button>
            <button
              onClick={() => handleRSVP('cant_go')}
              disabled={loading}
              className={`py-3 md:py-4 px-4 md:px-6 rounded-xl font-semibold transition shadow-lg ${
                userRsvp?.status === 'cant_go'
                  ? 'bg-red-600 text-white scale-105'
                  : 'bg-red-500 text-white hover:bg-red-600 hover:scale-105'
              } disabled:opacity-50`}
            >
              <div className="text-xl md:text-2xl mb-1">✗</div>
              <div className="text-xs md:text-sm">Can't Go</div>
            </button>
          </div>

          {!user && (
            <p className="text-center text-sm text-gray-500 mt-4">
              <Link href="/auth" className="text-purple-600 hover:underline font-semibold">
                Sign in
              </Link>{' '}
              to RSVP
            </p>
          )}
        </div>

        {/* Guest List - Expandable */}
        {event.is_guest_list_public && rsvps.length > 0 && showAllGuests && (
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Who's Going ({rsvps.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {rsvps.map((rsvp: any) => (
                <div key={rsvp.id} className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center font-bold text-white shadow-md">
                    {rsvp.users?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate text-sm">
                      {rsvp.users?.name || 'Guest'}
                    </p>
                    {rsvp.plus_ones > 0 && (
                      <p className="text-xs text-gray-500">+{rsvp.plus_ones}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comments */}
        {event.is_comments_enabled && (
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              💬 Comments ({commentCount})
            </h2>

            {user ? (
              <form onSubmit={handleComment} className="mb-6">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none text-base"
                />
                <button
                  type="submit"
                  disabled={loading || !newComment.trim()}
                  className="mt-3 bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 disabled:bg-gray-300 transition shadow-lg hover:shadow-xl"
                >
                  Post Comment
                </button>
              </form>
            ) : (
              <p className="text-center text-gray-500 mb-6 py-4 bg-gray-50 rounded-xl">
                <Link href="/auth" className="text-purple-600 hover:underline font-semibold">
                  Sign in
                </Link>{' '}
                to comment
              </p>
            )}

            {comments.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No comments yet. Be the first! 💭
              </p>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="border-b border-gray-100 pb-4 last:border-0">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center font-bold text-white shadow-md flex-shrink-0">
                        {comment.user?.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1 flex-wrap">
                          <span className="font-semibold text-gray-900">
                            {comment.user?.name || 'Guest'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm md:text-base break-words">{comment.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          Powered by{' '}
          <Link href="/" className="text-purple-600 hover:underline font-semibold">
            Party Time Africa
          </Link>{' '}
          🎉
        </div>
      </div>
    </div>
  );
}
