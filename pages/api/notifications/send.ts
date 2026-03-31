import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

interface NotificationPayload {
  userId: string;
  type: 'message' | 'event' | 'payment' | 'system';
  title: string;
  message: string;
  actionUrl?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { userId, type, title, message, actionUrl } = req.body as NotificationPayload;

    if (!userId || !type || !title || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if notifications table exists, if not create it
    const { error: tableError } = await supabase
      .from('notifications')
      .select('id')
      .limit(1);

    if (tableError?.code === 'PGRST116') {
      // Table doesn't exist, create it
      const { error: createError } = await supabase.rpc('create_notifications_table');
      if (createError) {
        console.error('Error creating notifications table:', createError);
      }
    }

    // Insert notification
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        action_url: actionUrl || null,
        read: false,
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      notification,
    });
  } catch (error: any) {
    console.error('Error sending notification:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
