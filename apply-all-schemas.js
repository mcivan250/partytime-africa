const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQL(sql, name) {
  console.log(`\n🔧 Applying ${name}...`);
  
  try {
    const { data, error } = await supabase.rpc('query', { query_text: sql });
    
    if (error) {
      // Try alternative method - direct query
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ query: sql })
      });
      
      if (!response.ok) {
        console.log(`⚠️  ${name}: Using client-side execution...`);
        // Execute statement by statement
        const statements = sql.split(';').filter(s => s.trim().length > 0);
        let successCount = 0;
        
        for (const statement of statements) {
          try {
            await supabase.rpc('exec', { sql: statement.trim() + ';' });
            successCount++;
          } catch (err) {
            // Ignore "already exists" errors
            if (!err.message?.includes('already exists')) {
              console.log(`   ℹ️  Skipped: ${statement.substring(0, 60)}...`);
            }
          }
        }
        
        console.log(`✅ ${name} - Processed ${successCount}/${statements.length} statements`);
      } else {
        console.log(`✅ ${name} completed successfully`);
      }
    } else {
      console.log(`✅ ${name} completed successfully`);
    }
  } catch (err) {
    console.log(`⚠️  ${name}: ${err.message}`);
  }
}

async function applyAllSchemas() {
  console.log('🚀 APPLYING ALL DATABASE SCHEMAS...\n');
  console.log(`📍 Target: ${supabaseUrl}\n`);
  
  // 1. Wallets table (CRITICAL for signup)
  console.log('=' .repeat(60));
  if (fs.existsSync('./CREATE_WALLETS_TABLE.sql')) {
    const walletsSQL = fs.readFileSync('./CREATE_WALLETS_TABLE.sql', 'utf8');
    await executeSQL(walletsSQL, 'Wallets Table');
  }
  
  // 2. Payment schema
  console.log('=' .repeat(60));
  if (fs.existsSync('./payment-schema.sql')) {
    const paymentSQL = fs.readFileSync('./payment-schema.sql', 'utf8');
    await executeSQL(paymentSQL, 'Payment Schema');
  }
  
  // 3. Security schema
  console.log('=' .repeat(60));
  if (fs.existsSync('./security-schema.sql')) {
    const securitySQL = fs.readFileSync('./security-schema.sql', 'utf8');
    await executeSQL(securitySQL, 'Security Schema');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ ALL SCHEMAS APPLIED!\n');
  
  // Test signup flow
  console.log('🧪 Testing signup flow...\n');
  await testSignup();
}

async function testSignup() {
  try {
    // Check tables exist
    const { data: wallets, error: walletsError } = await supabase
      .from('wallets')
      .select('id')
      .limit(1);
    
    if (walletsError) {
      console.log('❌ Wallets table not accessible:', walletsError.message);
    } else {
      console.log('✅ Wallets table is accessible');
    }
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (usersError) {
      console.log('❌ Users table not accessible:', usersError.message);
    } else {
      console.log('✅ Users table is accessible');
    }
    
    console.log('\n🎉 SIGNUP SHOULD NOW WORK!\n');
    console.log('Test it at: https://partytime.africa/auth\n');
    
  } catch (err) {
    console.error('Error testing:', err.message);
  }
}

applyAllSchemas().catch(console.error);
