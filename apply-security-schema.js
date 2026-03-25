const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applySecuritySchema() {
  console.log('🔒 Applying security schema to Supabase...\n');

  const schema = fs.readFileSync('./security-schema.sql', 'utf8');
  
  // Split into individual statements (separated by blank lines or semicolons)
  const statements = schema
    .split(/;\s*\n/)
    .filter(s => s.trim().length > 0 && !s.trim().startsWith('--'));

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i].trim() + ';';
    
    if (!statement || statement === ';') continue;
    
    // Get a preview of the statement
    const preview = statement.substring(0, 80).replace(/\s+/g, ' ');
    
    try {
      console.log(`[${i + 1}/${statements.length}] ${preview}...`);
      
      const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        // Some errors are OK (like "already exists")
        if (error.message.includes('already exists') || 
            error.message.includes('duplicate') ||
            error.code === '42P07' || // relation already exists
            error.code === '42710') { // object already exists
          console.log(`    ℹ️  Already exists, skipping`);
          successCount++;
        } else {
          console.error(`    ❌ Error:`, error.message);
          errorCount++;
        }
      } else {
        console.log(`    ✅ Success`);
        successCount++;
      }
    } catch (err) {
      console.error(`    ❌ Exception:`, err.message);
      errorCount++;
    }
  }

  console.log(`\n📊 Results:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  
  if (errorCount === 0) {
    console.log('\n🎉 Security schema applied successfully!');
  } else {
    console.log('\n⚠️  Some errors occurred, but core tables should be created');
  }
}

// Alternative: Direct SQL execution using Supabase SQL API
async function applySecuritySchemaDirect() {
  console.log('🔒 Applying security schema via direct SQL execution...\n');
  
  const schema = fs.readFileSync('./security-schema.sql', 'utf8');
  
  try {
    // Try to execute the whole schema at once
    const { data, error } = await supabase.rpc('exec_sql', { sql: schema });
    
    if (error) {
      console.error('❌ Error:', error);
      console.log('\n⚠️  Trying statement-by-statement approach...\n');
      await applySecuritySchema();
    } else {
      console.log('✅ Security schema applied successfully!');
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
    console.log('\n⚠️  Trying statement-by-statement approach...\n');
    await applySecuritySchema();
  }
}

// Run it
console.log('🚀 Starting security schema deployment...\n');
console.log(`📍 Target: ${supabaseUrl}\n`);

// Try direct first, fall back to statement-by-statement
applySecuritySchemaDirect().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
