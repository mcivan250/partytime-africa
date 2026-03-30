
import type { NextApiRequest, NextApiResponse } from 'next';
import { getEvents } from '../../lib/supabase-db';

type Data = {
  events?: any[];
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method === 'GET') {
    const { success, events, error } = await getEvents();

    if (success) {
      res.status(200).json({ events });
    } else {
      res.status(500).json({ error: error || 'Failed to fetch events' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
