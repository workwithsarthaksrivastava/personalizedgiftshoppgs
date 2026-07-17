import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('albums').select('*').limit(1);
  if (error) {
    console.error("Error fetching albums:", error);
  } else {
    console.log("Albums table exists. Data:", data);
  }
}
check();
