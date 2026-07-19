import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const url = process.env.VITE_SUPABASE_URL || '';
const key = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(url, key);

async function alterTable() {
  const sql = `
    ALTER TABLE public.albums 
    ADD COLUMN IF NOT EXISTS client_name text,
    ADD COLUMN IF NOT EXISTS audio_name text,
    ADD COLUMN IF NOT EXISTS back_cover_url text,
    ADD COLUMN IF NOT EXISTS inner_front_url text,
    ADD COLUMN IF NOT EXISTS inner_back_url text,
    ADD COLUMN IF NOT EXISTS combined_inner_url text,
    ADD COLUMN IF NOT EXISTS is_combined_inner boolean,
    ADD COLUMN IF NOT EXISTS function_name text,
    ADD COLUMN IF NOT EXISTS function_date text,
    ADD COLUMN IF NOT EXISTS view_lock_pin text,
    ADD COLUMN IF NOT EXISTS is_public boolean,
    ADD COLUMN IF NOT EXISTS status text,
    ADD COLUMN IF NOT EXISTS job_number text,
    ADD COLUMN IF NOT EXISTS studio_name text,
    ADD COLUMN IF NOT EXISTS photographer_name text,
    ADD COLUMN IF NOT EXISTS mobile_number text,
    ADD COLUMN IF NOT EXISTS views_count integer DEFAULT 0,
    ADD COLUMN IF NOT EXISTS likes_count integer DEFAULT 0,
    ADD COLUMN IF NOT EXISTS comments jsonb DEFAULT '[]'::jsonb;
  `;

  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
  console.log("exec_sql sql_query - Error:", error);
  console.log("exec_sql sql_query - Data:", data);

  // Try different parameter name if failed
  if (error) {
    const { data: data2, error: error2 } = await supabase.rpc('exec_sql', { query: sql });
    console.log("exec_sql query - Error:", error2);
    console.log("exec_sql query - Data:", data2);
  }
}

alterTable();
