import { supabase } from './supabase';
import { Event } from './types';

// Create event
export async function createEvent(eventData: Partial<Event>, userId: string) {
  const { data, error } = await supabase
    .from('events')
    .insert([
      {
        ...eventData,
        host_id: userId,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Update event
export async function updateEvent(eventId: string, updates: Partial<Event>) {
  const { data, error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', eventId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Delete event
export async function deleteEvent(eventId: string) {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId);

  if (error) throw error;
}

// Get event by ID
export async function getEventById(eventId: string): Promise<Event | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (error) return null;
  return data;
}

// Get event by slug
export async function getEventBySlug(slug: string): Promise<Event | null> {
  const { data, error} = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) return null;
  return data;
}

// Get user's events
export async function getUserEvents(userId: string): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('host_id', userId)
    .order('created_at', { ascending: false });

  if (error) return [];
  return data;
}

// Check if user owns event
export async function userOwnsEvent(eventId: string, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('events')
    .select('host_id')
    .eq('id', eventId)
    .single();

  return data?.host_id === userId;
}
