const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zhrpvudzanhabiuddkhz.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpocnB2dWR6YW5oYWJpdWRka2h6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDM5MTE5NiwiZXhwIjoyMDg5OTY3MTk2fQ.nGJ-NFxZOfI-VD6YDaz80Yq8wrHw5lw1DF-JjPVIrFI';

const supabase = createClient(supabaseUrl, serviceKey);

async function finalCheck() {
  console.log('Testing events table with correct schema...\n');
  
  const testEvent = {
    title: 'Test Event',
    slug: 'test-' + Date.now(),
    date_time: '2026-04-01T19:00:00Z',
    location_address: 'Test Location',
    description: 'Test Description',
    theme: 'sunset',
    host_id: '00000000-0000-0000-0000-000000000000',
    image_url: 'https://test.com/test.jpg',
    image_path: 'events/test.jpg'
  };
  
  const { data, error } = await supabase
    .from('events')
    .insert(testEvent)
    .select()
    .single();
  
  if (error) {
    if (error.message.includes('image_url') || error.message.includes('image_path')) {
      console.log('❌ IMAGE COLUMNS DO NOT EXIST');
      console.log('\nError:', error.message);
      console.log('\n🔴 Please run this SQL in Supabase Dashboard:');
      console.log('ALTER TABLE events ADD COLUMN image_url TEXT;');
      console.log('ALTER TABLE events ADD COLUMN image_path TEXT;');
    } else {
      console.log('Other error:', error.message);
    }
  } else {
    console.log('✅ SUCCESS! Event created with image fields!');
    console.log('\nColumns:', Object.keys(data));
    console.log('\nimage_url:', data.image_url);
    console.log('image_path:', data.image_path);
    
    // Clean up
    await supabase.from('events').delete().eq('id', data.id);
    console.log('\n✅ Test event cleaned up');
    console.log('\n🎉 DATABASE IS READY FOR IMAGE UPLOADS!');
  }
}

finalCheck().catch(console.error);
