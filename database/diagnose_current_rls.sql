-- STEP 1: Diagnose Current RLS Setup
-- Copy these queries one by one into Supabase SQL Editor

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

-- Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'users';

-- Check current user and auth status
SELECT 
    auth.uid() as current_auth_uid,
    auth.role() as current_auth_role,
    auth.jwt() as current_jwt;

-- Try to see what user data we can access
SELECT 
    id,
    email,
    role,
    is_active,
    first_name,
    last_name
FROM public.users 
LIMIT 5;