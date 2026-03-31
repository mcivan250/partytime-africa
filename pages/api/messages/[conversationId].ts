import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read: boolean;
  media_url?: string;
  media_type?: 'image' | 'video' | 'audio';
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { conversationId } = req.query;

  if (req.method === 'GET') {
    return handleGetMessages(req, res, conversationId as string);
  } else if (req.method === 'POST') {
    return handleSendMessage(req, res, conversationId as string);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGetMessages(
  req: NextApiRequest,
  res: NextApiResponse,
  conversationId: string
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Parse conversation ID to get the other user ID
    const [userId1, userId2] = conversationId.split('_');
    const otherUserId = userId1 === user.id ? userId2 : userId1;

    // Fetch all messages between these two users
    const { data: messages, error } = await supabase
      .from('direct_messages')
      .select(`
        id,
        sender_id,
        message_text,
        read,
        created_at,
        media_url,
        media_type,
        sender:sender_id(id, user_metadata)
      `)
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Mark messages as read
    await supabase
      .from('direct_messages')
      .update({ read: true })
      .eq('receiver_id', user.id)
      .eq('sender_id', otherUserId);

    const formattedMessages: Message[] = messages?.map((msg: any) => ({
      id: msg.id,
      sender_id: msg.sender_id,
      content: msg.message_text,
      created_at: msg.created_at,
      read: msg.read,
      media_url: msg.media_url,
      media_type: msg.media_type,
    })) || [];

    // Get other user info
    const { data: otherUser, error: userError } = await supabase
      .from('users')
      .select('id, user_metadata')
      .eq('id', otherUserId)
      .single();

    if (userError) throw userError;

    return res.status(200).json({
      success: true,
      conversation: {
        id: conversationId,
        messages: formattedMessages,
        other_user: {
          id: otherUserId,
          name: (otherUser as any)?.user_metadata?.full_name || 'Unknown User',
          profile_photo_url: (otherUser as any)?.user_metadata?.profile_photo_url || null,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

async function handleSendMessage(
  req: NextApiRequest,
  res: NextApiResponse,
  conversationId: string
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { message, mediaUrl, mediaType } = req.body;

    if (!message?.trim() && !mediaUrl) {
      return res.status(400).json({ error: 'Message or media is required' });
    }

    // Parse conversation ID to get the other user ID
    const [userId1, userId2] = conversationId.split('_');
    const receiverId = userId1 === user.id ? userId2 : userId1;

    // Insert the message
    const { data: newMessage, error } = await supabase
      .from('direct_messages')
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        message_text: message || '',
        media_url: mediaUrl || null,
        media_type: mediaType || null,
        read: false,
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: {
        id: newMessage.id,
        sender_id: newMessage.sender_id,
        content: newMessage.message_text,
        created_at: newMessage.created_at,
        read: newMessage.read,
        media_url: newMessage.media_url,
        media_type: newMessage.media_type,
      },
    });
  } catch (error: any) {
    console.error('Error sending message:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
