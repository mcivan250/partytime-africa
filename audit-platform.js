const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zhrpvudzanhabiuddkhz.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpocnB2dWR6YW5oYWJpdWRka2h6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDM5MTE5NiwiZXhwIjoyMDg5OTY3MTk2fQ.nGJ-NFxZOfI-VD6YDaz80Yq8wrHw5lw1DF-JjPVIrFI';

const supabase = createClient(supabaseUrl, serviceKey);

async function auditPlatform() {
  console.log('🔍 PLATFORM AUDIT REPORT\n');
  console.log('═'.repeat(60));
  
  // 1. Check Users
  console.log('\n📊 USERS');
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, name, email, phone_number, created_at')
    .order('created_at', { ascending: false });
  
  if (usersError) {
    console.log('❌ Error:', usersError.message);
  } else {
    console.log(`Total Users: ${users.length}`);
    users.slice(0, 5).forEach(u => {
      console.log(`  - ${u.name} (${u.email || u.phone_number}) - ${u.created_at?.split('T')[0]}`);
    });
  }

  // 2. Check Events
  console.log('\n🎉 EVENTS');
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id, title, slug, date_time, location_address, host_id, created_at, image_url')
    .order('created_at', { ascending: false });
  
  if (eventsError) {
    console.log('❌ Error:', eventsError.message);
  } else {
    console.log(`Total Events: ${events.length}`);
    if (events.length === 0) {
      console.log('  ⚠️  NO EVENTS EXIST - Platform empty!');
    } else {
      events.slice(0, 5).forEach(e => {
        console.log(`  - "${e.title}"`);
        console.log(`    Slug: ${e.slug}`);
        console.log(`    Date: ${e.date_time ? new Date(e.date_time).toLocaleDateString() : 'No date'}`);
        console.log(`    Location: ${e.location_address || 'No location'}`);
        console.log(`    Image: ${e.image_url ? 'Yes' : 'No'}`);
        console.log(`    Created: ${e.created_at?.split('T')[0]}`);
      });
    }
  }

  // 3. Check RSVPs
  console.log('\n✓ RSVPs');
  const { data: rsvps, error: rsvpsError } = await supabase
    .from('rsvps')
    .select('id, event_id, user_id, status')
    .order('created_at', { ascending: false });
  
  if (rsvpsError) {
    console.log('❌ Error:', rsvpsError.message);
  } else {
    console.log(`Total RSVPs: ${rsvps.length}`);
    const goingCount = rsvps.filter(r => r.status === 'going').length;
    const maybeCount = rsvps.filter(r => r.status === 'maybe').length;
    console.log(`  Going: ${goingCount}, Maybe: ${maybeCount}`);
  }

  // 4. Check Comments
  console.log('\n💬 COMMENTS');
  const { data: comments, error: commentsError } = await supabase
    .from('comments')
    .select('id, event_id, user_id, comment_text')
    .order('created_at', { ascending: false });
  
  if (commentsError) {
    console.log('❌ Error:', commentsError.message);
  } else {
    console.log(`Total Comments: ${comments.length}`);
  }

  // 5. Check Wallets
  console.log('\n💰 WALLETS');
  const { data: wallets, error: walletsError } = await supabase
    .from('wallets')
    .select('user_id, balance_cents, currency, verification_tier')
    .order('created_at', { ascending: false });
  
  if (walletsError) {
    console.log('❌ Error:', walletsError.message);
  } else {
    console.log(`Total Wallets: ${wallets.length}`);
  }

  // 6. Check Friends
  console.log('\n👥 FRIENDS');
  const { data: friends, error: friendsError } = await supabase
    .from('friends')
    .select('user_id, friend_id, status');
  
  if (friendsError) {
    console.log('❌ Error (expected if table not created):', friendsError.message);
  } else {
    console.log(`Total Friendships: ${friends.length}`);
  }

  // 7. Check Storage Buckets
  console.log('\n📦 STORAGE');
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  
  if (bucketsError) {
    console.log('❌ Error:', bucketsError.message);
  } else {
    console.log(`Buckets: ${buckets.map(b => b.name).join(', ')}`);
  }

  // 8. Platform Health Summary
  console.log('\n' + '═'.repeat(60));
  console.log('📋 SUMMARY\n');
  
  const issues = [];
  const successes = [];

  if (users.length === 0) issues.push('❌ No users registered');
  else successes.push(`✅ ${users.length} users registered`);

  if (events.length === 0) issues.push('❌ No events created - CRITICAL');
  else successes.push(`✅ ${events.length} events created`);

  if (rsvps.length === 0) issues.push('⚠️  No RSVPs yet');
  else successes.push(`✅ ${rsvps.length} RSVPs recorded`);

  if (wallets.length !== users.length) issues.push(`⚠️  Wallet count (${wallets.length}) doesn't match user count (${users.length})`);
  
  if (buckets.length < 2) issues.push('⚠️  Missing storage buckets');
  else successes.push('✅ Storage buckets created');

  console.log('SUCCESSES:');
  successes.forEach(s => console.log(s));
  
  console.log('\nISSUES:');
  if (issues.length === 0) {
    console.log('✅ No critical issues found!');
  } else {
    issues.forEach(i => console.log(i));
  }

  console.log('\n' + '═'.repeat(60));
}

auditPlatform().catch(console.error);
