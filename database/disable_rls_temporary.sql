-- ================================================================
-- TEMPORARY FIX: DISABLE RLS FOR SALES TABLE
-- ================================================================
-- WARNING: This removes security. Only use for testing!
-- Run this SQL in your Supabase SQL Editor

-- Disable RLS on sales table (temporary fix)
ALTER TABLE public.sales DISABLE ROW LEVEL SECURITY;

-- Disable RLS on sale_items table 
ALTER TABLE public.sale_items DISABLE ROW LEVEL SECURITY;

-- Grant permissions to anonymous users (for testing only)
GRANT ALL ON public.sales TO anon;
GRANT ALL ON public.sale_items TO anon;
GRANT USAGE ON SCHEMA public TO anon;

-- Note: This is less secure but will allow transactions to work immediately