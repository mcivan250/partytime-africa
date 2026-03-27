'use client';

import { useEffect, useState } from 'react';
import { getEventMoments, likeMoment, addMomentComment, getMomentComments, EventMoment, MomentComment } from '@/lib/moments';
import { getCurrentUser } from '@/lib/auth';

interface MomentsFeedProps {
  eventId: string;
  refresh?: boolean;
}

export default function MomentsFeed({ eventId, refresh }: MomentsFeedProps) {
  const [moments, setMoments] = useState<EventMoment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedMoment, setSelectedMoment] = useState<EventMoment | null>(null);
  const [comments, setComments] = useState<MomentComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [eventId, refresh]);

  const loadData = async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);

      const eventMoments = await getEventMoments(eventId, user?.id);
      setMoments(eventMoments);
    } catch (error) {
      console.error('Error loading moments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (momentId: string) => {
    try {
      await likeMoment(momentId, currentUser.id);

      // Update local state
      setMoments((prev) =>
        prev.map((m) => {
          if (m.id === momentId) {
            return {
              ...m,
              liked_by_user: !m.liked_by_user,
              likes_count: m.liked_by_user ? m.likes_count - 1 : m.likes_count + 1,
            };
          }
          return m;
        })
      );
    } catch (error) {
      console.error('Error liking moment:', error);
    }
  };

  const handleSelectMoment = async (moment: EventMoment) => {
    setSelectedMoment(moment);
    try {
      const momentComments = await getMomentComments(moment.id);
      setComments(momentComments);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedMoment) return;

    setCommentLoading(true);
    try {
      await addMomentComment(selectedMoment.id, currentUser.id, newComment);
      setNewComment('');

      // Reload comments
      const updatedComments = await getMomentComments(selectedMoment.id);
      setComments(updatedComments);

      // Update moment in list
      setMoments((prev) =>
        prev.map((m) => {
          if (m.id === selectedMoment.id) {
            return { ...m, comments_count: m.comments_count + 1 };
          }
          return m;
        })
      );
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setCommentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (moments.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">📸</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No Moments Yet</h3>
        <p className="text-gray-600">Be the first to share a moment from this event!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Moments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {moments.map((moment) => (
          <div
            key={moment.id}
            onClick={() => handleSelectMoment(moment)}
            className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition cursor-pointer group"
          >
            {/* Image */}
            <div className="relative h-48 overflow-hidden bg-gray-200">
              <img
                src={moment.image_url}
                alt="Moment"
                className="w-full h-full object-cover group-hover:scale-105 transition"
              />
              {moment.is_featured && (
                <div className="absolute top-2 right-2 bg-yellow-400 text-white px-2 py-1 rounded text-xs font-bold">
                  ⭐ Featured
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4">
              {moment.caption && (
                <p className="text-gray-700 text-sm mb-3 line-clamp-2">{moment.caption}</p>
              )}

              {/* Engagement Stats */}
              <div className="flex items-center justify-between text-sm text-gray-600 border-t pt-3">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLike(moment.id);
                    }}
                    className={`flex items-center space-x-1 transition ${
                      moment.liked_by_user ? 'text-red-600' : 'hover:text-red-600'
                    }`}
                  >
                    <span className="text-lg">{moment.liked_by_user ? '❤️' : '🤍'}</span>
                    <span>{moment.likes_count}</span>
                  </button>

                  <div className="flex items-center space-x-1">
                    <span className="text-lg">💬</span>
                    <span>{moment.comments_count}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Moment Detail Modal */}
      {selectedMoment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Moment</h2>
              <button
                onClick={() => setSelectedMoment(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Image */}
              <img
                src={selectedMoment.image_url}
                alt="Moment"
                className="w-full rounded-lg"
              />

              {/* Caption */}
              {selectedMoment.caption && (
                <div>
                  <p className="text-gray-700">{selectedMoment.caption}</p>
                </div>
              )}

              {/* Like Button */}
              <button
                onClick={() => handleLike(selectedMoment.id)}
                className={`w-full py-2 rounded-lg font-semibold transition ${
                  selectedMoment.liked_by_user
                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {selectedMoment.liked_by_user ? '❤️ Unlike' : '🤍 Like'} ({selectedMoment.likes_count})
              </button>

              {/* Comments Section */}
              <div className="border-t pt-6">
                <h3 className="font-bold text-gray-900 mb-4">
                  Comments ({selectedMoment.comments_count})
                </h3>

                {/* Comments List */}
                <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                  {comments.length === 0 ? (
                    <p className="text-gray-600 text-center py-4">No comments yet</p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="bg-gray-50 p-3 rounded-lg">
                        <p className="font-semibold text-sm text-gray-900">
                          {comment.user?.name || 'Anonymous'}
                        </p>
                        <p className="text-gray-700 text-sm mt-1">{comment.comment_text}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Comment */}
                <form onSubmit={handleAddComment} className="space-y-2">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    maxLength={280}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 resize-none"
                    rows={2}
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim() || commentLoading}
                    className="w-full bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {commentLoading ? 'Posting...' : 'Post Comment'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
