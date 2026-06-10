import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const url = process.env.VITE_SUPABASE_URL || '';
const key = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(url, key);

async function testScenario() {
  console.log("creating...");
  const orderData = {
    order_id: `PGS-${Date.now()}`,
    customer_name: 'test',
    total: 100,
    status: 'Order Placed'
  };
  
  const { data: inserted, error: insertErr } = await supabase.from('orders').insert([orderData]).select();
  if (insertErr) {
    console.error("Insert err:", insertErr);
    return;
  }
  
  const dbId = inserted[0].id;
  console.log("inserted ID:", dbId);
  
  console.log("updating status...");
  const { data: updated, error: updateErr } = await supabase.from('orders').update({
    status: 'Cancellation Requested'
  }).eq('id', dbId).select();
  
  if (updateErr) {
    console.error("Update err:", updateErr);
  } else {
    console.log("Updates result:", updated);
  }
}
testScenario();
