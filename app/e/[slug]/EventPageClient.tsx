'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Event, THEMES } from '@/lib/types';
import { getCurrentUser, AuthUser } from '@/lib/auth';
import { createOrUpdateRSVP, getRSVPsForEvent, getUserRSVP, getRSVPCounts } from '@/lib/rsvp';
import { createComment, getCommentsForEvent, getCommentCount, Comment } from '@/lib/comments';
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
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentCount, setCommentCount] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedTheme = THEMES.find((t) => t.id === event.theme) || THEMES[0];

  useEffect(() => {
    loadUser();
    loadRSVPs();
    loadComments();
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Event Card */}
        <div
          className={`rounded-3xl bg-gradient-to-br ${selectedTheme.gradient} p-12 text-white shadow-2xl mb-8`}
        >
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">{event.title}</h1>

            {event.description && (
              <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
                {event.description}
              </p>
            )}

            <div className="space-y-3 text-lg">
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

              {rsvpCounts.total > 0 && (
                <p className="flex items-center justify-center space-x-2">
                  <span>👥</span>
                  <span>{rsvpCounts.total} people interested</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* RSVP Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
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

          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => handleRSVP('going')}
              disabled={loading}
              className={`py-4 px-6 rounded-xl font-semibold transition shadow-lg ${
                userRsvp?.status === 'going'
                  ? 'bg-green-600 text-white'
                  : 'bg-green-500 text-white hover:bg-green-600'
              } disabled:opacity-50`}
            >
              ✓ Going
              {rsvpCounts.going > 0 && (
                <span className="block text-sm mt-1">{rsvpCounts.going}</span>
              )}
            </button>
            <button
              onClick={() => handleRSVP('maybe')}
              disabled={loading}
              className={`py-4 px-6 rounded-xl font-semibold transition shadow-lg ${
                userRsvp?.status === 'maybe'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-yellow-500 text-white hover:bg-yellow-600'
              } disabled:opacity-50`}
            >
              ? Maybe
              {rsvpCounts.maybe > 0 && (
                <span className="block text-sm mt-1">{rsvpCounts.maybe}</span>
              )}
            </button>
            <button
              onClick={() => handleRSVP('cant_go')}
              disabled={loading}
              className={`py-4 px-6 rounded-xl font-semibold transition shadow-lg ${
                userRsvp?.status === 'cant_go'
                  ? 'bg-red-600 text-white'
                  : 'bg-red-500 text-white hover:bg-red-600'
              } disabled:opacity-50`}
            >
              ✗ Can't Go
            </button>
          </div>

          {!user && (
            <p className="text-center text-sm text-gray-500 mt-4">
              <Link href="/auth" className="text-purple-600 hover:underline">
                Sign in
              </Link>{' '}
              to RSVP
            </p>
          )}
        </div>

        {/* Guest List */}
        {event.is_guest_list_public && rsvps.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Guest List ({rsvps.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {rsvps.map((rsvp: any) => (
                <div key={rsvp.id} className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center font-bold text-purple-600">
                    {rsvp.users?.name?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
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
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Comments ({commentCount})
            </h2>

            {user ? (
              <form onSubmit={handleComment} className="mb-6">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 resize-none"
                />
                <button
                  type="submit"
                  disabled={loading || !newComment.trim()}
                  className="mt-2 bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-300"
                >
                  Post Comment
                </button>
              </form>
            ) : (
              <p className="text-center text-gray-500 mb-6 py-4 bg-gray-50 rounded-lg">
                <Link href="/auth" className="text-purple-600 hover:underline">
                  Sign in
                </Link>{' '}
                to comment
              </p>
            )}

            {comments.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No comments yet. Be the first!
              </p>
            ) : (
              <div className="space-y-6">
                {comments.map((comment) => (
                  <div key={comment.id} className="border-b border-gray-100 pb-4 last:border-0">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center font-bold text-purple-600">
                        {comment.user?.name?.[0] || '?'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-semibold text-gray-900">
                            {comment.user?.name || 'Guest'}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-700">{comment.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Share Section */}
        <div className="text-center">
          <p className="text-gray-600 mb-4">Share this event:</p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={handleShare}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
            >
              📱 Share
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert('Link copied!');
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              📋 Copy Link
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-gray-500">
          Created with{' '}
          <Link href="/" className="text-purple-600 hover:underline">
            Party Time Africa
          </Link>{' '}
          • Turn up, African style.
        </div>
      </div>
    </div>
  );
}
