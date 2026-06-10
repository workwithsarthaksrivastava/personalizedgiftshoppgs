import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testWithAuth() {
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email: 'testauth' + Date.now() + '@gmail.com',
    password: 'password123'
  });
  
  if (authErr) { console.error("auth error", authErr); return; }
  
  const user = authData.user;
  console.log("Logged in:", user?.id);
  
  const orderData = {
    order_id: `PGS-${Date.now()}`,
    customer_id: user.id,
    customer_name: 'test',
    items: [],
    total: 100,
    shipping_address: {},
    status: 'Order Placed'
  };
  
  const { data: inserted, error: insertErr } = await supabase.from('orders').insert([orderData]).select();
  if (insertErr) { console.error("Insert err:", insertErr); return; }
  
  const dbId = inserted[0].id;
  console.log("Inserted ID:", dbId);
  
  const { data: updated, error: updateErr } = await supabase.from('orders').update({
    status: 'Cancellation Requested'
  }).eq('id', dbId).select();
  
  console.log("Update result:", updated, updateErr);
}
testWithAuth();
