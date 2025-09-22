-- ================================================================
-- FIX RLS POLICIES FOR SALES TABLE
-- ================================================================
-- Run this SQL in your Supabase SQL Editor to allow transactions to be saved

-- First, let's see what policies currently exist
SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check 
FROM pg_policies 
WHERE tablename = 'sales';

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Users can only view their own sales" ON public.sales;
DROP POLICY IF EXISTS "Users can only insert their own sales" ON public.sales;

-- Create more permissive policies for sales table
-- Policy 1: Allow authenticated users to view all sales
CREATE POLICY "Authenticated users can view sales" ON public.sales
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy 2: Allow authenticated users to insert sales  
CREATE POLICY "Authenticated users can insert sales" ON public.sales
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy 3: Allow authenticated users to update sales
CREATE POLICY "Authenticated users can update sales" ON public.sales
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy 4: Allow authenticated users to delete sales (for admin functions)
CREATE POLICY "Authenticated users can delete sales" ON public.sales
  FOR DELETE USING (auth.role() = 'authenticated');

-- Also ensure sale_items table has proper policies
DROP POLICY IF EXISTS "Users can only view their own sale items" ON public.sale_items;
DROP POLICY IF EXISTS "Users can only insert their own sale items" ON public.sale_items;

CREATE POLICY "Authenticated users can view sale_items" ON public.sale_items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert sale_items" ON public.sale_items
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update sale_items" ON public.sale_items
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete sale_items" ON public.sale_items
  FOR DELETE USING (auth.role() = 'authenticated');

-- Grant necessary permissions
GRANT ALL ON public.sales TO authenticated;
GRANT ALL ON public.sale_items TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;