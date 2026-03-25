const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './app/.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyTables() {
  console.log('🔍 Checking database tables...\n');
  
  const tables = ['users', 'events', 'rsvps', 'comments', 'photos', 'event_questions', 'event_answers'];
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`❌ ${table}: ${error.message}`);
    } else {
      console.log(`✅ ${table}: Connected`);
    }
  }
  
  console.log('\n🎉 Database ready!');
}

verifyTables();
