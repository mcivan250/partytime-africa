import { supabase } from './supabase';

export interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  message_text: string;
  read: boolean;
  created_at: string;
  sender?: {
    id: string;
    name: string;
    profile_photo_url?: string;
  };
  receiver?: {
    id: string;
    name: string;
    profile_photo_url?: string;
  };
}

export interface EventMessage {
  id: string;
  event_id: string;
  user_id: string;
  message_text: string;
  created_at: string;
  user?: {
    id: string;
    name: string;
    profile_photo_url?: string;
  };
}

// Direct Messages
export async function sendDirectMessage(senderId: string, receiverId: string, messageText: string) {
  const { data, error } = await supabase
    .from('direct_messages')
    .insert([
      {
        sender_id: senderId,
        receiver_id: receiverId,
        message_text: messageText,
      },
    ])
    .select(`
      *,
      sender:sender_id(id, name, profile_photo_url),
      receiver:receiver_id(id, name, profile_photo_url)
    `)
    .single();

  if (error) throw error;
  return data;
}

export async function getConversation(userId: string, otherUserId: string) {
  const { data, error } = await supabase
    .from('direct_messages')
    .select(`
      *,
      sender:sender_id(id, name, profile_photo_url),
      receiver:receiver_id(id, name, profile_photo_url)
    `)
    .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getConversations(userId: string) {
  // Get all conversations (grouped by other user)
  const { data, error } = await supabase
    .from('direct_messages')
    .select(`
      *,
      sender:sender_id(id, name, profile_photo_url),
      receiver:receiver_id(id, name, profile_photo_url)
    `)
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Group by conversation partner
  const conversations = new Map();
  (data || []).forEach((msg: any) => {
    const partnerId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
    if (!conversations.has(partnerId)) {
      conversations.set(partnerId, {
        partnerId,
        partner: msg.sender_id === userId ? msg.receiver : msg.sender,
        lastMessage: msg,
        unread: msg.receiver_id === userId && !msg.read,
      });
    }
  });

  return Array.from(conversations.values());
}

export async function markAsRead(messageId: string) {
  const { error } = await supabase
    .from('direct_messages')
    .update({ read: true })
    .eq('id', messageId);

  if (error) throw error;
}

export async function getUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('direct_messages')
    .select('*', { count: 'exact', head: true })
    .eq('receiver_id', userId)
    .eq('read', false);

  if (error) throw error;
  return count || 0;
}

// Event Messages
export async function sendEventMessage(eventId: string, userId: string, messageText: string) {
  const { data, error } = await supabase
    .from('event_messages')
    .insert([
      {
        event_id: eventId,
        user_id: userId,
        message_text: messageText,
      },
    ])
    .select(`
      *,
      user:user_id(id, name, profile_photo_url)
    `)
    .single();

  if (error) throw error;
  return data;
}

export async function getEventMessages(eventId: string) {
  const { data, error } = await supabase
    .from('event_messages')
    .select(`
      *,
      users(id, name, profile_photo_url)
    `)
    .eq('event_id', eventId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  
  // Map to proper format
  return (data || []).map((msg: any) => ({
    ...msg,
    user: msg.users,
  }));
}

export async function deleteEventMessage(messageId: string, userId: string) {
  // Verify user owns the message
  const { data: message } = await supabase
    .from('event_messages')
    .select('user_id')
    .eq('id', messageId)
    .single();

  if (!message || message.user_id !== userId) {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase
    .from('event_messages')
    .delete()
    .eq('id', messageId);

  if (error) throw error;
}

// Real-time subscriptions
export function subscribeToConversation(userId: string, otherUserId: string, callback: (message: DirectMessage) => void) {
  return supabase
    .channel(`dm-${userId}-${otherUserId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'direct_messages',
        filter: `sender_id=eq.${otherUserId}`,
      },
      (payload) => {
        callback(payload.new as DirectMessage);
      }
    )
    .subscribe();
}

export function subscribeToEventChat(eventId: string, callback: (message: EventMessage) => void) {
  return supabase
    .channel(`event-chat-${eventId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'event_messages',
        filter: `event_id=eq.${eventId}`,
      },
      (payload) => {
        callback(payload.new as EventMessage);
      }
    )
    .subscribe();
}
