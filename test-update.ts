import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const url = process.env.VITE_SUPABASE_URL || '';
const key = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(url, key);

async function testUpdate() {
  const { data: fetch1, error: e1 } = await supabase.from('orders').select('id, status').limit(1).single();
  if (!fetch1) {
    console.log("No orders");
    return;
  }
  console.log("Found order:", fetch1);
  const { data, error } = await supabase
    .from('orders')
    .update({ status: 'Test Status' })
    .eq('id', fetch1.id)
    .select();
  console.log("Update result:", data, error);
}

testUpdate();
