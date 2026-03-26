const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zhrpvudzanhabiuddkhz.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpocnB2dWR6YW5oYWJpdWRka2h6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDM5MTE5NiwiZXhwIjoyMDg5OTY3MTk2fQ.nGJ-NFxZOfI-VD6YDaz80Yq8wrHw5lw1DF-JjPVIrFI';

const supabase = createClient(supabaseUrl, serviceKey, {
  db: { schema: 'public' },
  auth: { persistSession: false }
});

async function checkAndAddColumns() {
  console.log('Checking current table structure...\n');
  
  // Check events table
  const { data: eventsData, error: eventsError } = await supabase
    .from('events')
    .select('*')
    .limit(1);
  
  if (eventsData && eventsData.length > 0) {
    console.log('Events table columns:', Object.keys(eventsData[0]));
    
    if ('image_url' in eventsData[0]) {
      console.log('✅ image_url already exists in events table');
    } else {
      console.log('❌ image_url missing from events table');
    }
  }
  
  // Check users table
  const { data: usersData, error: usersError } = await supabase
    .from('users')
    .select('*')
    .limit(1);
  
  if (usersData && usersData.length > 0) {
    console.log('\nUsers table columns:', Object.keys(usersData[0]));
    
    if ('profile_photo_url' in usersData[0]) {
      console.log('✅ profile_photo_url already exists in users table');
    } else {
      console.log('❌ profile_photo_url missing from users table');
    }
  }
  
  console.log('\n⚠️  Cannot add columns via Supabase JS client.');
  console.log('📋 You need to run this SQL manually in Supabase Dashboard > SQL Editor:\n');
  console.log('--------------------');
  console.log('ALTER TABLE events ADD COLUMN IF NOT EXISTS image_url TEXT;');
  console.log('ALTER TABLE events ADD COLUMN IF NOT EXISTS image_path TEXT;');
  console.log('ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;');
  console.log('ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo_path TEXT;');
  console.log('--------------------\n');
  console.log('🔗 Go to: https://supabase.com/dashboard/project/zhrpvudzanhabiuddkhz/editor');
}

checkAndAddColumns().catch(console.error);
