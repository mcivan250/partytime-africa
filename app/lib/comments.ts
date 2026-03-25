import { supabase } from './supabase';

export interface Comment {
  id: string;
  event_id: string;
  user_id: string;
  parent_comment_id?: string;
  content: string;
  created_at: string;
  user?: {
    id: string;
    name: string;
    profile_photo_url?: string;
  };
  replies?: Comment[];
}

export async function createComment(
  eventId: string,
  userId: string,
  content: string,
  parentCommentId?: string
): Promise<Comment> {
  const { data, error } = await supabase
    .from('comments')
    .insert([
      {
        event_id: eventId,
        user_id: userId,
        content,
        parent_comment_id: parentCommentId,
      },
    ])
    .select(`
      *,
      users (
        id,
        name,
        profile_photo_url
      )
    `)
    .single();

  if (error) throw error;
  return data;
}

export async function getCommentsForEvent(eventId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      users (
        id,
        name,
        profile_photo_url
      )
    `)
    .eq('event_id', eventId)
    .is('parent_comment_id', null) // Only top-level comments
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Get replies for each comment
  const commentsWithReplies = await Promise.all(
    data.map(async (comment) => {
      const { data: replies } = await supabase
        .from('comments')
        .select(`
          *,
          users (
            id,
            name,
            profile_photo_url
          )
        `)
        .eq('parent_comment_id', comment.id)
        .order('created_at', { ascending: true });

      return {
        ...comment,
        user: comment.users,
        replies: replies || [],
      };
    })
  );

  return commentsWithReplies;
}

export async function deleteComment(commentId: string, userId: string) {
  // Verify user owns the comment
  const { data: comment } = await supabase
    .from('comments')
    .select('user_id')
    .eq('id', commentId)
    .single();

  if (!comment || comment.user_id !== userId) {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);

  if (error) throw error;
}

export async function getCommentCount(eventId: string): Promise<number> {
  const { count, error } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId);

  if (error) throw error;
  return count || 0;
}
