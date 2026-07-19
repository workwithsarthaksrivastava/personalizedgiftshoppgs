import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const url = process.env.VITE_SUPABASE_URL || '';
const key = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(url, key);

async function testUpsert() {
  const payload = {
    id: 'test-123',
    title: 'Test Album',
    template: 'Classic Royal',
    audio_url: '',
    cover_url: '',
    orientation: 'Landscape',
    page_marking: '',
    spreads: [],
    client_name: 'Test Client', // Extra field
  };

  const { data, error } = await supabase.from('albums').upsert(payload);
  console.log("Supabase response - Error:", error);
  console.log("Supabase response - Data:", data);
}

testUpsert();
