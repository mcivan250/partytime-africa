import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Event } from '../../lib/types';

const DashboardPage: React.FC = () => {
  const { user, loading: userLoading } = useAuth();
  const router = useRouter();
  const [hostedEvents, setHostedEvents] = useState<Event[]>([]);
  const [rsvpedEvents, setRsvpedEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/auth/signin');
    }
    if (user) {
      fetchUserEvents();
    }
  }, [user, userLoading]);

  const fetchUserEvents = async () => {
    setLoadingEvents(true);
    setError(null);
    try {
      // Fetch hosted events
      const { data: hostedData, error: hostedError } = await supabase
        .from('events')
        .select('*')
        .eq('host_id', user?.id)
        .order('date_time', { ascending: false });

      if (hostedError) throw hostedError;
      setHostedEvents(hostedData || []);

      // Fetch RSVP'd events
      const { data: rsvpData, error: rsvpError } = await supabase
        .from('rsvps')
        .select('*, events(*)')
        .eq('user_id', user?.id)
        .in('status', ['going', 'maybe']);

      if (rsvpError) throw rsvpError;
      setRsvpedEvents(rsvpData?.map((rsvp: any) => rsvp.events) || []);

    } catch (err: any) {
      console.error('Error fetching user events:', err);
      setError(err.message || 'Failed to fetch events');
    } finally {
      setLoadingEvents(false);
    }
  };

  if (userLoading || !user) {
    return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Loading dashboard...</div>;
  }

  const EventCard = ({ event }: { event: Event }) => {
    const themeClasses = {
      OCEAN: 'from-blue-500 to-teal-400',
      GALAXY: 'from-purple-500 to-indigo-600',
      SUNSET: 'from-orange-500 to-red-600',
      ANKARA: 'from-yellow-500 to-orange-400',
      FIRE: 'from-red-600 to-yellow-500',
    };

    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return {
        day: date.toLocaleDateString('en-US', { day: 'numeric' }),
        month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
        full: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
        time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };
    };

    const dateInfo = formatDate(event.date_time);

    return (
      <Link href={`/events/${event.id}`} className="block">
        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300 cursor-pointer">
          <div className={`bg-gradient-to-br ${themeClasses[event.theme]} h-32 flex items-center justify-center text-center p-4 relative`}>
            <h3 className="text-xl font-bold text-white">{event.title}</h3>
            <div className="absolute top-3 right-3 bg-gray-900 bg-opacity-70 rounded-md p-2 text-sm">
              <div className="text-yellow-400 font-bold">{dateInfo.month}</div>
              <div className="text-white text-lg font-bold leading-none">{dateInfo.day}</div>
            </div>
          </div>
          <div className="p-4">
            <p className="text-gray-400 text-sm mb-1">{dateInfo.full} at {dateInfo.time}</p>
            <p className="text-gray-300 text-sm truncate">{event.location_address}</p>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">👋 Welcome, {user?.email}!</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Hosted Events */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Your Hosted Events</h2>
              <Link href="/events/create-with-tiers" className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-2 px-4 rounded-md text-sm">
                + Create New Event
              </Link>
            </div>
            {loadingEvents ? (
              <p>Loading your events...</p>
            ) : hostedEvents.length === 0 ? (
              <p className="text-gray-400">You haven't hosted any events yet.</p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {hostedEvents.map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </div>

          {/* RSVP'd Events */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Your RSVPs</h2>
            {loadingEvents ? (
              <p>Loading your RSVPs...</p>
            ) : rsvpedEvents.length === 0 ? (
              <p className="text-gray-400">You haven't RSVP'd to any events yet.</p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {rsvpedEvents.map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </div>
        </div>

        {error && <p className="text-red-500 text-center mt-8">Error: {error}</p>}
      </div>
    </div>
  );
};

export default DashboardPage;
