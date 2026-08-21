-- Supabase table migration SQL for PSD Templates

CREATE TABLE IF NOT EXISTS psd_templates (
  id uuid primary key default gen_random_uuid(),
  source_path text,
  canvas_width int,
  canvas_height int,
  layers jsonb,
  created_at timestamp default now()
);

-- Note: You also need to create two Supabase Storage buckets:
-- 1. "raw-psd" (Public)
-- 2. "processed-layers" (Public)
