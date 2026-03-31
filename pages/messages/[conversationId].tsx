'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';
import MediaUpload from '@/components/MediaUpload';
import MediaMessage from '@/components/MediaMessage';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read: boolean;
  media_url?: string;
  media_type?: 'image' | 'video' | 'audio';
}

interface Conversation {
  id: string;
  other_user: {
    id: string;
    name: string;
    profile_photo_url: string | null;
  };
  messages: Message[];
}

export default function ConversationPage() {
  const router = useRouter();
  const { conversationId } = router.query;
  const { user } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{ url: string; type: 'image' | 'video' | 'audio' } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch initial conversation data
  const fetchConversation = useCallback(async () => {
    if (!conversationId) return;

    try {
      const response = await fetch(`/api/messages/${conversationId}`);
      const data = await response.json();

      if (data.success) {
        setConversation(data.conversation);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch conversation');
      }
    } catch (err: any) {
      console.error('Error fetching conversation:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    if (conversationId) {
      fetchConversation();
    }
  }, [conversationId, fetchConversation]);

  // Handle new messages from real-time subscription
  const handleNewMessage = useCallback((newMessage: Message) => {
    setConversation((prev) =>
      prev
        ? {
            ...prev,
            messages: [...prev.messages, newMessage],
          }
        : null
    );
  }, []);

  // Handle message read status updates
  const handleMessageRead = useCallback((messageId: string) => {
    setConversation((prev) =>
      prev
        ? {
            ...prev,
            messages: prev.messages.map((msg) =>
              msg.id === messageId ? { ...msg, read: true } : msg
            ),
          }
        : null
    );
  }, []);

  // Set up real-time subscriptions
  useRealtimeMessages(
    conversationId as string,
    user?.id,
    handleNewMessage,
    handleMessageRead
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages]);

  const handleMediaUpload = (url: string, type: 'image' | 'video' | 'audio') => {
    setSelectedMedia({ url, type });
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() && !selectedMedia) return;
    if (sending || !conversation) return;

    setSending(true);
    try {
      const response = await fetch(`/api/messages/${conversationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageInput,
          mediaUrl: selectedMedia?.url || null,
          mediaType: selectedMedia?.type || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessageInput('');
        setSelectedMedia(null);
        // Message will be added via real-time subscription
      } else {
        setError(data.error || 'Failed to send message');
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <p className="text-text-dark">Conversation not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary flex flex-col pb-20">
      {/* Header */}
      <div className="bg-secondary border-b border-border/30 p-4 sticky top-16 z-30">
        <Link href="/messages" className="text-accent hover:text-accent/80 mb-2 block">
          ← Back to Messages
        </Link>
        <h1 className="text-2xl font-bold text-text-light">{conversation.other_user.name}</h1>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversation.messages.length === 0 ? (
          <div className="text-center p-12 text-text-dark">
            <p className="text-4xl mb-4">💬</p>
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          conversation.messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender_id === user?.id ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  message.sender_id === user?.id
                    ? 'bg-accent text-primary'
                    : 'bg-secondary text-text-light'
                }`}
              >
                {message.media_url && message.media_type && (
                  <div className="mb-2">
                    <MediaMessage
                      url={message.media_url}
                      type={message.media_type}
                      caption={message.content}
                    />
                  </div>
                )}
                {message.content && <p>{message.content}</p>}
                <p className={`text-xs mt-1 ${
                  message.sender_id === user?.id
                    ? 'text-primary/70'
                    : 'text-text-dark'
                }`}>
                  {formatTime(message.created_at)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Media Preview */}
      {selectedMedia && (
        <div className="bg-secondary border-t border-border/30 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-text-dark">Media selected</p>
            <button
              onClick={() => setSelectedMedia(null)}
              className="text-accent hover:text-accent/80 text-sm"
            >
              Remove
            </button>
          </div>
          <div className="max-w-xs">
            {selectedMedia.type === 'image' && (
              <img
                src={selectedMedia.url}
                alt="Preview"
                className="rounded-lg w-full h-auto max-h-40 object-cover"
              />
            )}
            {selectedMedia.type === 'video' && (
              <video
                src={selectedMedia.url}
                className="rounded-lg w-full h-auto max-h-40"
              />
            )}
            {selectedMedia.type === 'audio' && (
              <audio
                src={selectedMedia.url}
                controls
                className="rounded-lg w-full"
              />
            )}
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="fixed bottom-20 left-0 right-0 bg-secondary border-t border-border/30 p-4">
        <div className="flex gap-2 max-w-2xl mx-auto">
          <MediaUpload onUpload={handleMediaUpload} disabled={sending} />
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !sending) {
                handleSendMessage();
              }
            }}
            placeholder="Type a message..."
            disabled={sending}
            className="flex-1 bg-primary border border-border/30 rounded-lg px-4 py-2 text-text-light placeholder-text-dark focus:outline-none focus:border-accent disabled:opacity-50"
          />
          <button
            onClick={handleSendMessage}
            disabled={(!messageInput.trim() && !selectedMedia) || sending}
            className="bg-accent hover:bg-accent/90 disabled:bg-accent/50 text-primary font-bold px-4 py-2 rounded-lg transition-colors"
          >
            {sending ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
