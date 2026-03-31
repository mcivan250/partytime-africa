import { useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read: boolean;
}

export function useRealtimeMessages(
  conversationId: string,
  userId: string | undefined,
  onNewMessage: (message: Message) => void,
  onMessageRead: (messageId: string) => void
) {
  useEffect(() => {
    if (!conversationId || !userId) return;

    // Parse conversation ID to get the other user ID
    const [userId1, userId2] = conversationId.split('_');
    const otherUserId = userId1 === userId ? userId2 : userId1;

    // Create a channel for this conversation
    const channel: RealtimeChannel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `or(and(sender_id=eq.${userId},receiver_id=eq.${otherUserId}),and(sender_id=eq.${otherUserId},receiver_id=eq.${userId}))`,
        },
        (payload: any) => {
          const newMessage: Message = {
            id: payload.new.id,
            sender_id: payload.new.sender_id,
            content: payload.new.message_text,
            created_at: payload.new.created_at,
            read: payload.new.read,
          };
          onNewMessage(newMessage);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'direct_messages',
          filter: `receiver_id=eq.${userId}`,
        },
        (payload: any) => {
          if (payload.new.read) {
            onMessageRead(payload.new.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, userId, onNewMessage, onMessageRead]);
}
