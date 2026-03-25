const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSignup() {
  console.log('🧪 Testing signup flow...\n');

  // Test 1: Check if users table exists
  console.log('1. Checking users table...');
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .limit(1);

  if (usersError) {
    console.error('❌ Users table error:', usersError.message);
  } else {
    console.log('✅ Users table exists');
  }

  // Test 2: Check if wallets table exists
  console.log('\n2. Checking wallets table...');
  const { data: wallets, error: walletsError } = await supabase
    .from('wallets')
    .select('*')
    .limit(1);

  if (walletsError) {
    console.error('❌ Wallets table error:', walletsError.message);
  } else {
    console.log('✅ Wallets table exists');
  }

  // Test 3: Try a test signup
  console.log('\n3. Testing signup with email...');
  const testEmail = `test${Date.now()}@test.com`;
  const testPassword = 'Test1234!@#';
  const testName = 'Test User';

  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });

    if (authError) {
      console.error('❌ Auth signup error:', authError.message);
      return;
    }

    console.log('✅ Supabase auth signup successful');
    console.log('   User ID:', authData.user?.id);

    // Try to insert into users table
    const { error: profileError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          email: testEmail,
          name: testName,
        },
      ]);

    if (profileError) {
      console.error('❌ Profile insert error:', profileError.message);
      console.error('   Details:', profileError);
    } else {
      console.log('✅ User profile created successfully');
    }

    // Try to create wallet
    const { error: walletError } = await supabase
      .from('wallets')
      .insert([
        {
          user_id: authData.user.id,
          balance_cents: 0,
          currency: 'UGX',
        },
      ]);

    if (walletError) {
      console.error('❌ Wallet creation error:', walletError.message);
      console.error('   Details:', walletError);
    } else {
      console.log('✅ Wallet created successfully');
    }

    console.log('\n✅ Full signup flow completed!');
    
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }
}

testSignup();
