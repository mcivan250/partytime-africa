const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zhrpvudzanhabiuddkhz.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpocnB2dWR6YW5oYWJpdWRka2h6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDM5MTE5NiwiZXhwIjoyMDg5OTY3MTk2fQ.nGJ-NFxZOfI-VD6YDaz80Yq8wrHw5lw1DF-JjPVIrFI';

const supabase = createClient(supabaseUrl, serviceKey);

async function createTestEvents() {
  console.log('Creating test events...\n');
  
  // Get first user
  const { data: users } = await supabase
    .from('users')
    .select('id, name, email')
    .limit(1);
  
  if (!users || users.length === 0) {
    console.log('No users found!');
    return;
  }
  
  const hostId = users[0].id;
  console.log(`Using host: ${users[0].name} (${users[0].email})\n`);
  
  const events = [
    {
      title: 'Tattoos & Cocktails Returns',
      slug: 'tattoos-cocktails-returns-' + Date.now(),
      description: 'The legendary night is back. Fresh ink, premium cocktails, and unforgettable vibes. Live tattoo artists on site. Drink specials all night.',
      date_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      location_address: 'Kampala, Uganda',
      theme: 'fire',
      host_id: hostId,
      is_guest_list_public: true,
      is_comments_enabled: true,
    },
    {
      title: 'Tall People Social Mixer',
      slug: 'tall-people-mixer-' + Date.now(),
      description: 'For everyone 6ft+ (183cm+). Finally meet people at eye level! Rooftop venue, networking, games, and tall-people problems discussions. Height verification at door 😄',
      date_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
      location_address: 'Kampala Rooftop',
      theme: 'sunset',
      host_id: hostId,
      is_guest_list_public: true,
      is_comments_enabled: true,
    },
    {
      title: 'Skyline Brunch & Beats',
      slug: 'skyline-brunch-' + Date.now(),
      description: 'Bottomless mimosas, city views, Afrobeats playlist. Chef\'s special buffet, live DJ, Instagram-worthy setup. Dress code: Brunch casual.',
      date_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days
      location_address: 'Sky Lounge, Kampala',
      theme: 'ocean',
      host_id: hostId,
      is_guest_list_public: true,
      is_comments_enabled: true,
    },
    {
      title: 'Kampala Underground Hip Hop Night',
      slug: 'underground-hip-hop-' + Date.now(),
      description: 'Local MCs, DJ battles, open cipher at midnight. Raw talent, underground vibes. If you rap, bring your bars. 18+ only.',
      date_time: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days
      location_address: 'Urban Hub, Kampala',
      theme: 'galaxy',
      host_id: hostId,
      is_guest_list_public: true,
      is_comments_enabled: true,
    },
    {
      title: 'Ankara After Dark - Fashion Showcase',
      slug: 'ankara-after-dark-' + Date.now(),
      description: 'African fashion runway + networking mixer. Local designers showcase latest collections. Dress code: Ankara only. Best dressed wins prizes.',
      date_time: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days
      location_address: 'Design Hub, Kampala',
      theme: 'ankara',
      host_id: hostId,
      is_guest_list_public: true,
      is_comments_enabled: true,
    },
  ];
  
  for (const event of events) {
    const { data, error } = await supabase
      .from('events')
      .insert([event])
      .select()
      .single();
    
    if (error) {
      console.log(`❌ Failed: ${event.title}`);
      console.log(`   Error: ${error.message}`);
    } else {
      console.log(`✅ Created: ${event.title}`);
      console.log(`   URL: https://partytime.africa/e/${data.slug}`);
    }
  }
  
  console.log('\n✅ All test events created!');
  console.log('\nVisit:');
  console.log('- https://partytime.africa (homepage)');
  console.log('- https://partytime.africa/events (browse all)');
}

createTestEvents().catch(console.error);
