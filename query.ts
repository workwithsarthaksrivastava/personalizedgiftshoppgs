import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  console.log("URL length:", SUPABASE_URL.length);
  const { count, error } = await supabase.from('products').select('*', { count: 'exact', head: true });
  console.log("Count:", count, "Error:", error);
}
run();
