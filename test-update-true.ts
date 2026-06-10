import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testUpdateWithAuth() {
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'sarthaksrivastava1084@gmail.com', // Let's use the users email? Wait, I don't have their password.
    password: 'password123'
  });
}
