#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, 'app', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applySchema() {
  try {
    console.log('📦 Reading schema.sql...');
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    
    console.log('🚀 Applying schema to Supabase...');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: schema });
    
    if (error) {
      console.error('❌ Error applying schema:', error);
      
      // Fallback: try using REST API
      console.log('\n🔄 Trying direct SQL execution...');
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({ query: schema })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed:', errorText);
        process.exit(1);
      }
    }
    
    console.log('✅ Schema applied successfully!');
    console.log('\n📊 Tables created:');
    console.log('  - users');
    console.log('  - events');
    console.log('  - rsvps');
    console.log('  - comments');
    console.log('  - photos');
    console.log('  - event_questions');
    console.log('  - event_answers');
    
  } catch (err) {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  }
}

applySchema();
