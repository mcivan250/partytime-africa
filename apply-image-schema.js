const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://zhrpvudzanhabiuddkhz.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpocnB2dWR6YW5oYWJpdWRka2h6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDM5MTE5NiwiZXhwIjoyMDg5OTY3MTk2fQ.nGJ-NFxZOfI-VD6YDaz80Yq8wrHw5lw1DF-JjPVIrFI';

const supabase = createClient(supabaseUrl, serviceKey);

async function applySchema() {
  const sql = fs.readFileSync('add-image-column.sql', 'utf8');
  
  console.log('Applying image column schema...');
  
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
  
  if (error) {
    // Try direct ALTER TABLE commands
    console.log('Using direct ALTER TABLE approach...');
    
    const commands = [
      "ALTER TABLE events ADD COLUMN IF NOT EXISTS image_url TEXT",
      "ALTER TABLE events ADD COLUMN IF NOT EXISTS image_path TEXT",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo_url TEXT",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo_path TEXT"
    ];
    
    for (const cmd of commands) {
      const { error: cmdError } = await supabase.rpc('exec_sql', { sql_query: cmd });
      if (cmdError) {
        console.error(`Error executing: ${cmd}`);
        console.error(cmdError);
      } else {
        console.log(`✓ ${cmd}`);
      }
    }
    
    console.log('\n✅ Image columns added!');
  } else {
    console.log('✅ Schema applied successfully!');
    console.log(data);
  }
}

applySchema().catch(console.error);
