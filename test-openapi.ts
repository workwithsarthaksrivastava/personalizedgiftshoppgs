import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

async function checkOpenAPI() {
  const res = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/?apikey=${process.env.VITE_SUPABASE_ANON_KEY}`, {
    headers: {
      'apikey': process.env.VITE_SUPABASE_ANON_KEY,
    }
  });
  console.log(await res.text());
}
checkOpenAPI();
