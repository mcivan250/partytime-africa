import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { createEvent } from '../../lib/events';
import { EventTheme } from '../../lib/types';

const CreateEventPage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();

  const [eventName, setEventName] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventTheme, setEventTheme] = useState<EventTheme>('OCEAN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <p className="text-2xl mb-4">🔒 Sign in to create events</p>
          <button
            onClick={() => router.push('/auth/signin')}
            className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-2 px-4 rounded"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const newEvent = await createEvent({
        host_id: user.id,
        name: eventName,
        description: eventDescription,
        date_time: `${eventDate}T${eventTime}:00`,
        location_address: eventLocation,
        theme: eventTheme,
      });
      router.push(`/events/${newEvent.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
      <div className="max-w-3xl mx-auto bg-gray-800 rounded-lg shadow-lg p-6 sm:p-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-8">Create Your Event</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="eventName" className="block text-lg font-medium text-gray-300 mb-2">
              Event Name
            </label>
            <input
              type="text"
              id="eventName"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="e.g., Skyline Brunch & Beats"
              className="w-full p-3 rounded-md bg-gray-700 border border-gray-600 focus:ring-yellow-500 focus:border-yellow-500 text-white"
              required
            />
          </div>

          <div>
            <label htmlFor="eventDescription" className="block text-lg font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              id="eventDescription"
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              placeholder="Tell your guests about the event..."
              rows={4}
              className="w-full p-3 rounded-md bg-gray-700 border border-gray-600 focus:ring-yellow-500 focus:border-yellow-500 text-white"
              required
            ></textarea>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="eventDate" className="block text-lg font-medium text-gray-300 mb-2">
                Date
              </label>
              <input
                type="date"
                id="eventDate"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full p-3 rounded-md bg-gray-700 border border-gray-600 focus:ring-yellow-500 focus:border-yellow-500 text-white"
                required
              />
            </div>
            <div>
              <label htmlFor="eventTime" className="block text-lg font-medium text-gray-300 mb-2">
                Time
              </label>
              <input
                type="time"
                id="eventTime"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                className="w-full p-3 rounded-md bg-gray-700 border border-gray-600 focus:ring-yellow-500 focus:border-yellow-500 text-white"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="eventLocation" className="block text-lg font-medium text-gray-300 mb-2">
              Location
            </label>
            <input
              type="text"
              id="eventLocation"
              value={eventLocation}
              onChange={(e) => setEventLocation(e.target.value)}
              placeholder="e.g., Sky Lounge, Kampala"
              className="w-full p-3 rounded-md bg-gray-700 border border-gray-600 focus:ring-yellow-500 focus:border-yellow-500 text-white"
              required
            />
          </div>

          <div>
            <label htmlFor="eventTheme" className="block text-lg font-medium text-gray-300 mb-2">
              Theme
            </label>
            <select
              id="eventTheme"
              value={eventTheme}
              onChange={(e) => setEventTheme(e.target.value as EventTheme)}
              className="w-full p-3 rounded-md bg-gray-700 border border-gray-600 focus:ring-yellow-500 focus:border-yellow-500 text-white"
            >
              <option value="OCEAN">Ocean</option>
              <option value="GALAXY">Galaxy</option>
              <option value="SUNSET">Sunset</option>
              <option value="ANKARA">Ankara</option>
              <option value="FIRE">Fire</option>
            </select>
          </div>

          {error && <p className="text-red-500 text-center">{error}</p>}

          <button
            type="submit"
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-3 px-4 rounded-md transition-colors duration-200"
            disabled={loading}
          >
            {loading ? 'Creating Event...' : 'Create Event'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateEventPage;
