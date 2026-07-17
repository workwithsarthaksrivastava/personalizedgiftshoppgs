import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { error } = await supabase.rpc('exec_sql', {
    query: `
      CREATE TABLE IF NOT EXISTS public.albums (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        title text,
        template text DEFAULT 'classic',
        audio_url text,
        cover_url text,
        orientation text DEFAULT 'landscape',
        page_marking text,
        spreads jsonb DEFAULT '[]'::jsonb,
        created_at timestamp with time zone DEFAULT now()
      );
      
      -- We don't have exec_sql unless defined, wait.
    `
  });
  console.log(error);
}
run();
