import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface Conversation {
  id: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  other_user: {
    id: string;
    name: string;
    profile_photo_url: string | null;
  };
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      // Simulate conversation data for MVP/Demo
      const demoConversations: Conversation[] = [
        {
          id: '1',
          last_message: "Are you still coming to the Skyline Brunch?",
          last_message_at: new Date().toISOString(),
          unread_count: 2,
          other_user: {
            id: 'u1',
            name: "Sarah M.",
            profile_photo_url: null
          }
        },
        {
          id: '2',
          last_message: "The vibes at Ankara After Dark were insane!",
          last_message_at: new Date(Date.now() - 3600000).toISOString(),
          unread_count: 0,
          other_user: {
            id: 'u2',
            name: "James K.",
            profile_photo_url: null
          }
        },
        {
          id: '3',
          last_message: "See you at the Rooftop Bar tonight!",
          last_message_at: new Date(Date.now() - 86400000).toISOString(),
          unread_count: 0,
          other_user: {
            id: 'u3',
            name: "Amara T.",
            profile_photo_url: null
          }
        }
      ];
      setConversations(demoConversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
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
    <div className="min-h-screen bg-primary text-text-light flex flex-col">
      {/* Header */}
      <div className="bg-secondary border-b border-border p-4 sticky top-0 z-10 flex items-center justify-between">
        <Link href="/dashboard" className="text-accent hover:text-yellow-300">
          ← Dashboard
        </Link>
        <h1 className="text-xl font-display font-bold">Messages</h1>
        <button className="text-accent text-2xl font-bold">+</button>
      </div>

      {/* Search Bar */}
      <div className="p-4">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search messages..." 
            className="w-full bg-secondary border border-border/50 rounded-full px-10 py-3 text-sm focus:outline-none focus:border-accent transition-colors"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50">🔍</span>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="text-center p-12 text-text-dark">
            <p className="text-4xl mb-4">💬</p>
            <p>No messages yet. Start a conversation!</p>
          </div>
        ) : (
          <div className="divide-y divide-border/20">
            {conversations.map((conv) => (
              <Link key={conv.id} href={`/messages/${conv.id}`} className="flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors group">
                <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center text-xl font-bold text-accent border border-accent/30 group-hover:scale-105 transition-transform">
                  {conv.other_user.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-bold truncate text-text-light group-hover:text-accent transition-colors">{conv.other_user.name}</h3>
                    <span className="text-xs text-text-dark">
                      {new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className={`text-sm truncate ${conv.unread_count > 0 ? 'text-text-light font-semibold' : 'text-text-dark'}`}>
                      {conv.last_message}
                    </p>
                    {conv.unread_count > 0 && (
                      <span className="bg-accent text-primary text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Nav Spacer */}
      <div className="h-16"></div>
    </div>
  );
}
