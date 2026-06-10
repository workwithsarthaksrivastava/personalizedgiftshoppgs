import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const url = process.env.VITE_SUPABASE_URL || '';
const key = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(url, key);

async function testQuery() {
  const { data, error } = await supabase.rpc('get_policies', {});
  if (error) {
    console.error("RPC failed, trying raw query");
    // Can't do raw query from client...
  } else {
    console.log(data);
  }
}

testQuery();
