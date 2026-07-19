import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function check() {
  const { data, error } = await supabase.from('albums').select('*').limit(1);
  if (error) {
    console.error("Error fetching albums:", error);
  } else {
    if (data && data.length > 0) {
      console.log("Albums table column keys:", Object.keys(data[0]));
    } else {
      console.log("Albums table exists but has no records.");
    }
  }
}
check();
