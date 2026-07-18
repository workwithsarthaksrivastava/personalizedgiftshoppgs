-- Run this entire script in your Supabase SQL Editor to set up the necessary tables

-- 1. Create the products table
CREATE TABLE IF NOT EXISTS public.products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  category text,
  price numeric NOT NULL,
  original_price numeric,
  description text,
  image text,
  images jsonb DEFAULT '[]'::jsonb,
  allow_return_exchange boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- 2. Create the profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name text,
  phone text,
  created_at timestamp with time zone DEFAULT now()
);

-- 3. Create the orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id text UNIQUE NOT NULL,
  customer_id uuid REFERENCES auth.users ON DELETE SET NULL,
  items jsonb NOT NULL,
  total numeric NOT NULL,
  status text DEFAULT 'Pending',
  payment_method text,
  shipping_address jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- 4. Set up Row Level Security (RLS)
-- Enable RLS on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Products: Everyone can read, only anon (admin via secret) can insert/update/delete 
-- Here we'll just allow all for simplicity in development, or set up wide open policies
CREATE POLICY "Enable read access for all users" ON public.products FOR SELECT USING (true);
CREATE POLICY "Enable write access for all users" ON public.products FOR ALL USING (true) WITH CHECK (true);

-- Profiles: Users can read and update their own profile
CREATE POLICY "Enable read/write for users based on user_id" ON public.profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Orders: Users can insert, read and update their own orders. Admin can do everything.
-- We'll enable wide open access for now to avoid blocking the client-side checkout
CREATE POLICY "Enable all access for orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

-- Note: In a production environment, you should secure these policies to ensure users can only see their own orders.

-- 5. Create the albums table
CREATE TABLE IF NOT EXISTS public.albums (
  id text PRIMARY KEY,
  title text,
  template text DEFAULT 'classic',
  audio_url text,
  cover_url text,
  orientation text DEFAULT 'landscape',
  page_marking text,
  spreads jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Enable read access for all users" ON public.albums FOR SELECT USING (true);

-- Allow public write access (for simplicity)
CREATE POLICY "Enable write access for all users" ON public.albums FOR ALL USING (true) WITH CHECK (true);
