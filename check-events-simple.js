const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zhrpvudzanhabiuddkhz.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpocnB2dWR6YW5oYWJpdWRka2h6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDM5MTE5NiwiZXhwIjoyMDg5OTY3MTk2fQ.nGJ-NFxZOfI-VD6YDaz80Yq8wrHw5lw1DF-JjPVIrFI';

const supabase = createClient(supabaseUrl, serviceKey);

async function check() {
  // Try to insert with image_url
  const { data, error } = await supabase
    .from('events')
    .insert({
      title: 'Test Event',
      slug: 'test-' + Date.now(),
      date: '2026-04-01',
      time: '19:00',
      location: 'Test Location',
      description: 'Test',
      theme: 'sunset',
      host_id: '00000000-0000-0000-0000-000000000000',
      image_url: 'https://test.com/image.jpg'
    })
    .select()
    .single();
  
  if (error) {
    console.log('❌ Error inserting with image_url:', error.message);
    if (error.message.includes('image_url')) {
      console.log('\n⚠️  Column image_url does NOT exist in events table');
      console.log('Please run the SQL again in Supabase Dashboard');
    }
  } else {
    console.log('✅ SUCCESS! image_url column exists!');
    console.log('Event created with columns:', Object.keys(data));
    
    // Clean up
    await supabase.from('events').delete().eq('id', data.id);
  }
}

check().catch(console.error);
