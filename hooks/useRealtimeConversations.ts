import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function useRealtimeConversations(
  userId: string | undefined,
  onConversationUpdate: () => void
) {
  useEffect(() => {
    if (!userId) return;

    // Create a channel for direct messages
    const channel: RealtimeChannel = supabase
      .channel(`conversations:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `or(sender_id=eq.${userId},receiver_id=eq.${userId})`,
        },
        () => {
          onConversationUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, onConversationUpdate]);
}
