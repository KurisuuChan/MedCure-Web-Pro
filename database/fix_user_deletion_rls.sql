-- 🔧 USER DELETION FIX - RLS POLICIES
-- Run these commands in your Supabase SQL Editor
-- Execute them ONE BY ONE and check results

-- STEP 1: Diagnose Current Setup
-- Check current RLS policies on users table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users';

-- Check your current user
SELECT 
    auth.uid() as my_auth_id,
    auth.role() as my_auth_role;

-- Check if you exist in users table
SELECT 
    id,
    email,
    role,
    is_active
FROM public.users 
WHERE id = auth.uid();

-- 2. Check if RLS is enabled on users table
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'users';

-- STEP 2: Quick Fix - Temporarily Disable RLS for Testing
-- ⚠️ CAUTION: This disables security temporarily
-- Only do this to test if RLS is the issue
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Test your deletion now - if it works, RLS was the problem
-- Then come back and enable RLS with proper policies

-- STEP 3: Re-enable RLS and create proper policies
-- Run this after testing
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- STEP 4: Clean up any existing restrictive policies
DROP POLICY IF EXISTS "Allow authenticated users to read users" ON public.users;
DROP POLICY IF EXISTS "Allow admin users to read users" ON public.users;
DROP POLICY IF EXISTS "Allow admin users to update users" ON public.users;
DROP POLICY IF EXISTS "Allow admin to manage users" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- STEP 5: Create Simple, Working RLS Policies
-- These are more permissive but functional

-- Enable RLS first
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Simple policy: Allow all authenticated users to read users
CREATE POLICY "authenticated_users_select_users" ON public.users
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Simple policy: Allow all authenticated users to update users
CREATE POLICY "authenticated_users_update_users" ON public.users
    FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Simple policy: Allow all authenticated users to insert users
CREATE POLICY "authenticated_users_insert_users" ON public.users
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Simple policy: Allow all authenticated users to delete users
CREATE POLICY "authenticated_users_delete_users" ON public.users
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- STEP 6: Advanced Policies (Use these after simple ones work)
-- Uncomment these if you want role-based restrictions later

/*
-- Drop simple policies
DROP POLICY IF EXISTS "authenticated_users_select_users" ON public.users;
DROP POLICY IF EXISTS "authenticated_users_update_users" ON public.users;
DROP POLICY IF EXISTS "authenticated_users_insert_users" ON public.users;
DROP POLICY IF EXISTS "authenticated_users_delete_users" ON public.users;

-- Role-based policies (more secure)
CREATE POLICY "admin_manager_select_users" ON public.users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users u2 
            WHERE u2.id = auth.uid() 
            AND u2.role IN ('admin', 'manager', 'super_admin')
            AND u2.is_active = true
        )
    );

CREATE POLICY "admin_manager_update_users" ON public.users
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users u2 
            WHERE u2.id = auth.uid() 
            AND u2.role IN ('admin', 'manager', 'super_admin')
            AND u2.is_active = true
        )
    );
*/

-- 7. Check if policies were created successfully
SELECT 
    policyname,
    cmd,
    permissive,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- 8. Test the policies by checking current user access
-- This should return the current user if authentication is working
SELECT 
    id,
    email,
    role,
    is_active,
    auth.uid() as current_auth_uid
FROM public.users 
WHERE id = auth.uid();

-- 9. Alternative approach: Temporarily disable RLS for testing
-- CAUTION: Only use this for testing, re-enable RLS afterwards
-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 10. Re-enable RLS after testing (if you disabled it)
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;