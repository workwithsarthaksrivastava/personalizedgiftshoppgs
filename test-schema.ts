import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function getTable() {
  const res = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/orders?limit=1`, {
    headers: {
      'apikey': process.env.VITE_SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`
    }
  });
  console.log("Headers:", Array.from(res.headers.entries()));
  const data = await res.json();
  console.log(data);
}
getTable();
