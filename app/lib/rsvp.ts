import { supabase } from './supabase';
import { RSVP } from './types';

export async function createOrUpdateRSVP(
  eventId: string,
  userId: string,
  status: 'going' | 'maybe' | 'cant_go',
  plusOnes: number = 0
): Promise<RSVP> {
  // Check if RSVP exists
  const { data: existing } = await supabase
    .from('rsvps')
    .select('*')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .single();

  if (existing) {
    // Update existing RSVP
    const { data, error } = await supabase
      .from('rsvps')
      .update({ status, plus_ones: plusOnes, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    // Create new RSVP
    const { data, error } = await supabase
      .from('rsvps')
      .insert([
        {
          event_id: eventId,
          user_id: userId,
          status,
          plus_ones: plusOnes,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export async function getRSVPsForEvent(eventId: string) {
  const { data, error } = await supabase
    .from('rsvps')
    .select(`
      *,
      users (
        id,
        name,
        profile_photo_url
      )
    `)
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getUserRSVP(eventId: string, userId: string) {
  const { data, error } = await supabase
    .from('rsvps')
    .select('*')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') { // Not found is ok
    throw error;
  }
  return data;
}

export async function getRSVPCounts(eventId: string) {
  const { data } = await supabase
    .from('rsvps')
    .select('status, plus_ones')
    .eq('event_id', eventId);

  if (!data) return { going: 0, maybe: 0, cant_go: 0, total: 0 };

  const counts = {
    going: 0,
    maybe: 0,
    cant_go: 0,
    total: 0,
  };

  data.forEach((rsvp) => {
    const count = 1 + (rsvp.plus_ones || 0);
    if (rsvp.status === 'going') counts.going += count;
    else if (rsvp.status === 'maybe') counts.maybe += count;
    else if (rsvp.status === 'cant_go') counts.cant_go += count;
  });

  counts.total = counts.going + counts.maybe;

  return counts;
}

export async function deleteRSVP(eventId: string, userId: string) {
  const { error } = await supabase
    .from('rsvps')
    .delete()
    .eq('event_id', eventId)
    .eq('user_id', userId);

  if (error) throw error;
}
