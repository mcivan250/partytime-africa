
import { getEvents } from './lib/supabase-db';

async function testGetEvents() {
  console.log('Running testGetEvents...');
  const result = await getEvents();
  if (result.success) {
    console.log('Successfully fetched events:', result.events);
  } else {
    console.error('Failed to fetch events:', result.error);
  }
}

testGetEvents();
