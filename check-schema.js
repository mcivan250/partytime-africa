const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zhrpvudzanhabiuddkhz.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpocnB2dWR6YW5oYWJpdWRka2h6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDM5MTE5NiwiZXhwIjoyMDg5OTY3MTk2fQ.nGJ-NFxZOfI-VD6YDaz80Yq8wrHw5lw1DF-JjPVIrFI';

const supabase = createClient(supabaseUrl, serviceKey);

async function checkSchema() {
  console.log('Checking comments table schema...\n');
  
  // Try to get one comment to see column names
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .limit(1);
  
  if (error) {
    console.log('Error:', error.message);
    console.log('\nTrying to insert a test comment to see which columns exist...');
    
    // Try inserting with different column names
    const testColumns = [
      { event_id: '00000000-0000-0000-0000-000000000000', user_id: '00000000-0000-0000-0000-000000000000', comment_text: 'test' },
      { event_id: '00000000-0000-0000-0000-000000000000', user_id: '00000000-0000-0000-0000-000000000000', text: 'test' },
      { event_id: '00000000-0000-0000-0000-000000000000', user_id: '00000000-0000-0000-0000-000000000000', content: 'test' },
      { event_id: '00000000-0000-0000-0000-000000000000', user_id: '00000000-0000-0000-0000-000000000000', message: 'test' },
    ];
    
    for (const cols of testColumns) {
      const { error: insertError } = await supabase
        .from('comments')
        .insert(cols);
      
      if (!insertError) {
        console.log(`✅ Working column name: ${Object.keys(cols).find(k => !['event_id', 'user_id'].includes(k))}`);
        // Delete test comment
        await supabase.from('comments').delete().eq('user_id', '00000000-0000-0000-0000-000000000000');
        return;
      }
    }
    
    console.log('Could not determine column name. Checking original schema...');
  } else {
    console.log('Comments table structure:');
    if (data && data.length > 0) {
      console.log(Object.keys(data[0]));
    } else {
      console.log('Table exists but is empty. Checking via schema...');
    }
  }
  
  // Check original schema file
  const fs = require('fs');
  if (fs.existsSync('schema.sql')) {
    const schema = fs.readFileSync('schema.sql', 'utf8');
    const commentsMatch = schema.match(/CREATE TABLE comments[\s\S]*?\);/);
    if (commentsMatch) {
      console.log('\nOriginal schema definition:');
      console.log(commentsMatch[0]);
    }
  }
}

checkSchema().catch(console.error);
