import { supabase } from './supabase';

export interface EventMoment {
  id: string;
  event_id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  is_featured: boolean;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  user?: {
    name: string;
    profile_photo_url?: string;
  };
  liked_by_user?: boolean;
}

export interface MomentComment {
  id: string;
  moment_id: string;
  user_id: string;
  comment_text: string;
  created_at: string;
  user?: {
    name: string;
    profile_photo_url?: string;
  };
}

/**
 * Upload an image to Supabase Storage
 */
export async function uploadMomentImage(
  eventId: string,
  userId: string,
  file: File
): Promise<string> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${eventId}/${userId}/${Date.now()}.${fileExt}`;

    const { error: uploadError, data } = await supabase.storage
      .from('event-moments')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('event-moments')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

/**
 * Create a new event moment (image post)
 */
export async function createMoment(
  eventId: string,
  userId: string,
  imageUrl: string,
  caption?: string
): Promise<EventMoment> {
  try {
    const { data, error } = await supabase
      .from('event_moments')
      .insert([
        {
          event_id: eventId,
          user_id: userId,
          image_url: imageUrl,
          caption: caption || null,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating moment:', error);
    throw error;
  }
}

/**
 * Get moments for an event
 */
export async function getEventMoments(
  eventId: string,
  currentUserId?: string
): Promise<EventMoment[]> {
  try {
    const { data, error } = await supabase
      .from('event_moments')
      .select('*')
      .eq('event_id', eventId)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Check if current user liked each moment
    if (currentUserId && data) {
      const momentsWithLikes = await Promise.all(
        data.map(async (moment) => {
          const { data: likes } = await supabase
            .from('moment_likes')
            .select('id')
            .eq('moment_id', moment.id)
            .eq('user_id', currentUserId)
            .single();

          return {
            ...moment,
            liked_by_user: !!likes,
          };
        })
      );

      return momentsWithLikes;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching moments:', error);
    throw error;
  }
}

/**
 * Like a moment
 */
export async function likeMoment(momentId: string, userId: string): Promise<void> {
  try {
    // Check if already liked
    const { data: existingLike } = await supabase
      .from('moment_likes')
      .select('id')
      .eq('moment_id', momentId)
      .eq('user_id', userId)
      .single();

    if (existingLike) {
      // Unlike
      await supabase
        .from('moment_likes')
        .delete()
        .eq('moment_id', momentId)
        .eq('user_id', userId);

      // Decrement likes count
      await supabase.rpc('decrement_moment_likes', { moment_id: momentId });
    } else {
      // Like
      await supabase
        .from('moment_likes')
        .insert([{ moment_id: momentId, user_id: userId }]);

      // Increment likes count
      await supabase.rpc('increment_moment_likes', { moment_id: momentId });
    }
  } catch (error) {
    console.error('Error liking moment:', error);
    throw error;
  }
}

/**
 * Add a comment to a moment
 */
export async function addMomentComment(
  momentId: string,
  userId: string,
  commentText: string
): Promise<MomentComment> {
  try {
    const { data, error } = await supabase
      .from('moment_comments')
      .insert([
        {
          moment_id: momentId,
          user_id: userId,
          comment_text: commentText,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Increment comments count
    await supabase.rpc('increment_moment_comments', { moment_id: momentId });

    return data;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
}

/**
 * Get comments for a moment
 */
export async function getMomentComments(momentId: string): Promise<MomentComment[]> {
  try {
    const { data, error } = await supabase
      .from('moment_comments')
      .select('*')
      .eq('moment_id', momentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
}

/**
 * Feature a moment (organizer only)
 */
export async function featureMoment(momentId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('event_moments')
      .update({ is_featured: true })
      .eq('id', momentId);

    if (error) throw error;
  } catch (error) {
    console.error('Error featuring moment:', error);
    throw error;
  }
}

/**
 * Delete a moment
 */
export async function deleteMoment(momentId: string, imageUrl: string): Promise<void> {
  try {
    // Delete from database
    const { error: dbError } = await supabase
      .from('event_moments')
      .delete()
      .eq('id', momentId);

    if (dbError) throw dbError;

    // Delete image from storage
    if (imageUrl) {
      const filePath = imageUrl.split('/').pop();
      if (filePath) {
        await supabase.storage.from('event-moments').remove([filePath]);
      }
    }
  } catch (error) {
    console.error('Error deleting moment:', error);
    throw error;
  }
}
