'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, AuthUser } from '@/lib/auth';
import { getConversation, sendDirectMessage, subscribeToConversation, DirectMessage } from '@/lib/messages';
import { supabase } from '@/lib/supabase';

export default function ConversationPage() {
  const router = useRouter();
  const params = useParams();
  const otherUserId = params.userId as string;
  
  const [user, setUser] = useState<AuthUser | null>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadPage();
  }, [otherUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadPage = async () => {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      router.push('/auth');
      return;
    }

    setUser(currentUser);
    await loadOtherUser();
    await loadMessages(currentUser.id);
    setLoading(false);

    // Subscribe to real-time messages
    const subscription = subscribeToConversation(currentUser.id, otherUserId, (newMsg) => {
      setMessages((prev) => [...prev, newMsg]);
    });

    return () => {
      subscription.unsubscribe();
    };
  };

  const loadOtherUser = async () => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', otherUserId)
      .single();
    
    setOtherUser(data);
  };

  const loadMessages = async (userId: string) => {
    try {
      const msgs = await getConversation(userId, otherUserId);
      setMessages(msgs);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !newMessage.trim()) return;

    setSending(true);
    try {
      const msg = await sendDirectMessage(user.id, otherUserId, newMessage.trim());
      setMessages((prev) => [...prev, msg]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mb-4"></div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-24 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-md px-4 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/messages" className="text-purple-600 font-semibold hover:underline">
              ←
            </Link>
            {otherUser?.profile_photo_url ? (
              <img
                src={otherUser.profile_photo_url}
                alt={otherUser.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
                {otherUser?.name?.charAt(0).toUpperCase() || '?'}
              </div>
            )}
            <div>
              <div className="font-bold text-gray-900">{otherUser?.name || 'Unknown'}</div>
              <div className="text-xs text-gray-500">Online</div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-6xl block mb-4">👋</span>
              <p className="text-gray-600">Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === user?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-md px-4 py-3 rounded-2xl ${
                      isMe
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-gray-900 shadow-md'
                    }`}
                  >
                    <div className="break-words">{msg.message_text}</div>
                    <div
                      className={`text-xs mt-1 ${
                        isMe ? 'text-purple-100' : 'text-gray-400'
                      }`}
                    >
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-4 sticky bottom-0">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSend} className="flex space-x-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none"
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="px-6 py-3 bg-purple-600 text-white rounded-full font-semibold hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
