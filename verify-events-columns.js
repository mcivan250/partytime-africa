const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zhrpvudzanhabiuddkhz.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpocnB2dWR6YW5oYWJpdWRka2h6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDM5MTE5NiwiZXhwIjoyMDg5OTY3MTk2fQ.nGJ-NFxZOfI-VD6YDaz80Yq8wrHw5lw1DF-JjPVIrFI';

const supabase = createClient(supabaseUrl, serviceKey);

async function verifyColumns() {
  console.log('Verifying events table columns...\n');
  
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  if (data && data.length > 0) {
    const columns = Object.keys(data[0]);
    console.log('✅ Events table columns:', columns);
    
    if (columns.includes('image_url')) {
      console.log('✅ image_url exists!');
    } else {
      console.log('❌ image_url missing');
    }
    
    if (columns.includes('image_path')) {
      console.log('✅ image_path exists!');
    } else {
      console.log('❌ image_path missing');
    }
  } else {
    console.log('No events found, creating test event to check schema...');
    const { data: testData, error: testError } = await supabase
      .from('events')
      .insert({ 
        title: 'Test',
        slug: 'test-' + Date.now(),
        host_id: '00000000-0000-0000-0000-000000000000'
      })
      .select()
      .single();
    
    if (testData) {
      console.log('Table columns:', Object.keys(testData));
    }
  }
}

verifyColumns().catch(console.error);
