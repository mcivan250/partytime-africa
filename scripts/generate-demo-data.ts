/**
 * Demo Data Generator
 * Generates realistic demo events and users for PartyTime Africa
 */

import { supabase } from '../lib/supabase';

const DEMO_USERS = [
  { email: 'sarah@example.com', name: 'Sarah M.', bio: 'Event enthusiast | Loves rooftop parties' },
  { email: 'james@example.com', name: 'James K.', bio: 'Music lover | DJ on weekends' },
  { email: 'amara@example.com', name: 'Amara T.', bio: 'Fashion blogger | Always at the hottest spots' },
  { email: 'david@example.com', name: 'David L.', bio: 'Entrepreneur | Networking is my game' },
  { email: 'grace@example.com', name: 'Grace O.', bio: 'Artist | Creative soul' },
  { email: 'brian@example.com', name: 'Brian N.', bio: 'Tech enthusiast | Startup founder' },
];

const DEMO_EVENTS = [
  {
    title: 'Skyline Brunch & Beats',
    description: 'Join us for an unforgettable Sunday brunch with live DJ sets and cocktails. Perfect for networking and meeting new friends.',
    date_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    location_address: 'Rooftop Venue, Kampala',
    theme: 'sunset',
    max_capacity: 150,
  },
  {
    title: 'Techies After Dark',
    description: 'A gathering for tech enthusiasts, founders, and innovators. Network, share ideas, and celebrate the tech community.',
    date_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    location_address: 'Innovation Hub, Kampala',
    theme: 'galaxy',
    max_capacity: 200,
  },
  {
    title: 'Fashion Forward Gala',
    description: 'Celebrate African fashion with designers, models, and fashion enthusiasts. Runway shows, live music, and premium cocktails.',
    date_time: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    location_address: 'Design Hub, Kampala',
    theme: 'ankara',
    max_capacity: 300,
  },
  {
    title: 'Live Jazz Night',
    description: 'Experience smooth jazz performances from local and international artists. Intimate venue, premium drinks, and great vibes.',
    date_time: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    location_address: 'The Rooftop Bar, Kampala',
    theme: 'ocean',
    max_capacity: 100,
  },
  {
    title: 'Neon Nights Club Experience',
    description: 'High-energy club night with international DJs, dancers, and light shows. Come ready to dance until dawn!',
    date_time: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    location_address: 'Urban Hub, Kampala',
    theme: 'fire',
    max_capacity: 500,
  },
  {
    title: 'Art & Wine Tasting',
    description: 'Explore contemporary African art while enjoying curated wines from around the world. Perfect for art lovers and connoisseurs.',
    date_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    location_address: 'Gallery Space, Kampala',
    theme: 'royal',
    max_capacity: 120,
  },
  {
    title: 'Beach Party Extravaganza',
    description: 'Sun, sand, and celebration! Join us for a full day beach party with live music, food, and water activities.',
    date_time: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
    location_address: 'Diani Beach, Mombasa',
    theme: 'sunset',
    max_capacity: 400,
  },
  {
    title: 'Comedy Night Showcase',
    description: 'Laugh out loud with Africa\'s funniest comedians. Great food, drinks, and non-stop entertainment.',
    date_time: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(),
    location_address: 'Entertainment Venue, Kampala',
    theme: 'gold',
    max_capacity: 250,
  },
  {
    title: 'Wellness & Yoga Retreat',
    description: 'Start your day right with yoga, meditation, and healthy brunch. Relax, rejuvenate, and connect with like-minded people.',
    date_time: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    location_address: 'Wellness Center, Kampala',
    theme: 'ocean',
    max_capacity: 80,
  },
  {
    title: 'Networking Mixer',
    description: 'Connect with professionals, entrepreneurs, and creatives. Build relationships and explore collaboration opportunities.',
    date_time: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000).toISOString(),
    location_address: 'Business Hub, Kampala',
    theme: 'royal',
    max_capacity: 180,
  },
];

export async function generateDemoData() {
  try {
    console.log('Starting demo data generation...');

    // Note: In production, you would use Supabase admin API
    // For now, this is a template for data generation
    console.log(`Generated ${DEMO_USERS.length} demo users`);
    console.log(`Generated ${DEMO_EVENTS.length} demo events`);
    console.log('Demo data generation complete!');

    return {
      users: DEMO_USERS,
      events: DEMO_EVENTS,
    };
  } catch (error) {
    console.error('Error generating demo data:', error);
    throw error;
  }
}

// Export data for use in other parts of the application
export { DEMO_USERS, DEMO_EVENTS };
