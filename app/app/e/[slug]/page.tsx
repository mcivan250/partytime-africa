import { supabase } from '@/lib/supabase';
import { Event } from '@/lib/types';
import EventPageClient from './EventPageClient';

export default async function EventPage({ params }: { params: { slug: string } }) {
  const { slug } = params;

  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-6xl mb-4">😕</h1>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Event Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            {error?.message || "This event doesn't exist or has been removed."}
          </p>
          <a
            href="/"
            className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
          >
            Go Home
          </a>
        </div>
      </div>
    );
  }

  return <EventPageClient event={event} />;
}
