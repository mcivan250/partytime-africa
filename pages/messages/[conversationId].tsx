'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read: boolean;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversationId) {
      fetchConversation();
    }
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages]);

  const fetchConversation = async () => {
    setLoading(true);
    try {
      // Demo conversation data
      const demoConversation: Conversation = {
        id: conversationId as string,
        other_user: {
          id: 'u1',
          name: 'Sarah M.',
          profile_photo_url: null,
        },
        messages: [
          {
            id: '1',
            sender_id: 'u1',
            content: 'Hey! Are you coming to the Skyline Brunch tomorrow?',
            created_at: new Date(Date.now() - 3600000).toISOString(),
            read: true,
          },
          {
            id: '2',
            sender_id: user?.id || 'current-user',
            content: 'Yeah! I already got my tickets. See you there!',
            created_at: new Date(Date.now() - 1800000).toISOString(),
            read: true,
          },
          {
            id: '3',
            sender_id: 'u1',
            content: 'Are you still coming to the Skyline Brunch?',
            created_at: new Date().toISOString(),
            read: false,
          },
        ],
      };
      setConversation(demoConversation);
    } catch (error) {
      console.error('Error fetching conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !conversation) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      sender_id: user?.id || 'current-user',
      content: messageInput,
      created_at: new Date().toISOString(),
      read: true,
    };

    setConversation({
      ...conversation,
      messages: [...conversation.messages, newMessage],
    });

    setMessageInput('');

    // Simulate receiving a reply after 2 seconds
    setTimeout(() => {
      const reply: Message = {
        id: (Date.now() + 1).toString(),
        sender_id: conversation.other_user.id,
        content: 'That sounds great! Looking forward to it! 🎉',
        created_at: new Date().toISOString(),
        read: false,
      };

      setConversation((prev) =>
        prev
          ? {
              ...prev,
              messages: [...prev.messages, reply],
            }
          : null
      );
    }, 2000);
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversation.messages.map((message) => (
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
              <p>{message.content}</p>
              <p className={`text-xs mt-1 ${
                message.sender_id === user?.id
                  ? 'text-primary/70'
                  : 'text-text-dark'
              }`}>
                {formatTime(message.created_at)}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="fixed bottom-20 left-0 right-0 bg-secondary border-t border-border/30 p-4">
        <div className="flex gap-2 max-w-2xl mx-auto">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 bg-primary border border-border/30 rounded-lg px-4 py-2 text-text-light placeholder-text-dark focus:outline-none focus:border-accent"
          />
          <button
            onClick={handleSendMessage}
            disabled={!messageInput.trim()}
            className="bg-accent hover:bg-accent/90 disabled:bg-accent/50 text-primary font-bold px-4 py-2 rounded-lg transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
