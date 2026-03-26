'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, AuthUser } from '@/lib/auth';
import { getConversations } from '@/lib/messages';

export default function MessagesPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPage();
  }, []);

  const loadPage = async () => {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      router.push('/auth');
      return;
    }

    setUser(currentUser);
    await loadConversations(currentUser.id);
    setLoading(false);
  };

  const loadConversations = async (userId: string) => {
    try {
      const convos = await getConversations(userId);
      setConversations(convos);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mb-4"></div>
          <p className="text-gray-600">Loading messages...</p>
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
            Messages
          </h1>
          <p className="text-gray-600">
            Chat with your friends
          </p>
        </div>

        {/* Conversations List */}
        {conversations.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <span className="text-6xl block mb-4">💬</span>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No messages yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start a conversation with your friends
            </p>
            <Link
              href="/friends"
              className="inline-block bg-purple-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-purple-700 transition"
            >
              Find Friends
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((convo) => (
              <Link
                key={convo.partnerId}
                href={`/messages/${convo.partnerId}`}
                className="block bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {convo.partner?.profile_photo_url ? (
                      <img
                        src={convo.partner.profile_photo_url}
                        alt={convo.partner.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-2xl">
                        {convo.partner?.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="font-bold text-lg text-gray-900 mb-1">
                        {convo.partner?.name || 'Unknown'}
                      </div>
                      <div className="text-sm text-gray-600 line-clamp-1">
                        {convo.lastMessage.message_text}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(convo.lastMessage.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  {convo.unread && (
                    <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
