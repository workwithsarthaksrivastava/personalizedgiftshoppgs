import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const url = process.env.VITE_SUPABASE_URL || '';
const key = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(url, key);

async function checkOrders() {
  const { data, error } = await supabase.from('orders').select('*');
  console.log(data);
}
checkOrders();
