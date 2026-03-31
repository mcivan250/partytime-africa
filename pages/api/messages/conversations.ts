import type { NextApiRequest, NextApiResponse } from 'next';
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get all conversations for the current user
    const { data: conversations, error } = await supabase
      .from('direct_messages')
      .select(`
        id,
        sender_id,
        receiver_id,
        message_text,
        read,
        created_at,
        sender:sender_id(id, user_metadata),
        receiver:receiver_id(id, user_metadata)
      `)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Group messages by conversation
    const conversationMap = new Map<string, any>();

    conversations?.forEach((msg: any) => {
      const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      const conversationId = [user.id, otherUserId].sort().join('_');

      if (!conversationMap.has(conversationId)) {
        const otherUser = msg.sender_id === user.id ? msg.receiver : msg.sender;
        conversationMap.set(conversationId, {
          id: conversationId,
          last_message: msg.message_text,
          last_message_at: msg.created_at,
          unread_count: msg.sender_id !== user.id && !msg.read ? 1 : 0,
          other_user: {
            id: otherUserId,
            name: (otherUser as any)?.user_metadata?.full_name || 'Unknown User',
            profile_photo_url: (otherUser as any)?.user_metadata?.profile_photo_url || null,
          },
        });
      } else {
        const conv = conversationMap.get(conversationId);
        if (msg.sender_id !== user.id && !msg.read) {
          conv.unread_count += 1;
        }
      }
    });

    const result: Conversation[] = Array.from(conversationMap.values());

    return res.status(200).json({ success: true, conversations: result });
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
