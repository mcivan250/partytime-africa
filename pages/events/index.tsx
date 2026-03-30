''''use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getEvents } from '@/lib/supabase-db';

interface Event {
  id: string;
  title: string;
  slug: string;
  date_time: string;
  location_address: string;
  theme: string;
  image_url: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      console.log('Fetching events...');
      setLoading(true);
      setError(null);
      try {
        const { success, events: fetchedEvents, error: fetchError } = await getEvents();
        console.log('Supabase getEvents raw response:', { success, fetchedEvents, fetchError });
        console.log('getEvents response:', { success, fetchedEvents, fetchError });

        if (success && fetchedEvents) {
          console.log('Successfully fetched events:', fetchedEvents);
          setEvents(fetchedEvents);
        } else {
          console.error('Error fetching events:', fetchError);
          setError(fetchError || 'Failed to fetch events');
        }
      } catch (e: any) {
        console.error('Caught exception in fetchEvents:', e);
        setError(e.message || 'An unexpected error occurred.');
        setError('An unexpected error occurred.');
      } finally {
        setLoading(false);
        console.log('Finished fetching events.');
      }
    };
    fetchEvents();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-4">Events</h1>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      <pre className="bg-gray-800 p-4 rounded-lg overflow-x-auto">
        {JSON.stringify({ events, loading, error }, null, 2)}
      </pre>
      <ul>
        {events.map((event) => (
          <li key={event.id} className="border-b border-gray-700 py-2">
            <Link href={`/events/${event.id}`}>
              <span className="text-lg font-semibold hover:text-yellow-500">{event.title}</span>
            </Link>
            <p className="text-sm text-gray-400">{event.location_address}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
'''
