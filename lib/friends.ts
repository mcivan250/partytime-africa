import { supabase } from './supabase';

export interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
}

// Send friend request (simplified - auto-accept for now)
export async function addFriend(userId: string, friendId: string) {
  // Check if friendship already exists
  const { data: existing } = await supabase
    .from('friends')
    .select('*')
    .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)
    .single();

  if (existing) {
    return existing;
  }

  // Create bidirectional friendship (auto-accepted)
  const { data, error } = await supabase
    .from('friends')
    .insert([
      { user_id: userId, friend_id: friendId, status: 'accepted' },
      { user_id: friendId, friend_id: userId, status: 'accepted' }
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Remove friend
export async function removeFriend(userId: string, friendId: string) {
  const { error } = await supabase
    .from('friends')
    .delete()
    .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`);

  if (error) throw error;
}

// Get user's friends
export async function getFriends(userId: string) {
  const { data, error } = await supabase
    .from('friends')
    .select(`
      *,
      friend:friend_id(id, name, email, profile_photo_url)
    `)
    .eq('user_id', userId)
    .eq('status', 'accepted');

  if (error) throw error;
  return data || [];
}

// Check if two users are friends
export async function areFriends(userId: string, friendId: string): Promise<boolean> {
  const { data } = await supabase
    .from('friends')
    .select('id')
    .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)
    .eq('status', 'accepted')
    .single();

  return !!data;
}

// Get friends attending an event
export async function getFriendsAttendingEvent(userId: string, eventId: string) {
  // Get user's friends
  const friends = await getFriends(userId);
  const friendIds = friends.map((f: any) => f.friend_id);

  if (friendIds.length === 0) return [];

  // Get RSVPs from friends for this event
  const { data, error } = await supabase
    .from('rsvps')
    .select(`
      *,
      user:user_id(id, name, profile_photo_url)
    `)
    .eq('event_id', eventId)
    .in('user_id', friendIds)
    .in('status', ['going', 'maybe']);

  if (error) throw error;
  return data || [];
}

// Search users to add as friends
export async function searchUsers(query: string, limit: number = 10) {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, profile_photo_url')
    .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
    .limit(limit);

  if (error) throw error;
  return data || [];
}
