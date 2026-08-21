CREATE TABLE IF NOT EXISTS public.albums (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  qr_code_url text,
  image_urls text[],
  created_at timestamp with time zone DEFAULT now()
);
