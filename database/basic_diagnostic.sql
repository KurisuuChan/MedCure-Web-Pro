-- 🔍 SUPABASE RLS DIAGNOSTIC - Step by Step
-- Run these ONE AT A TIME to identify the exact issue

-- STEP 1A: Check if the users table exists
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name = 'users';

-- STEP 1B: Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public';

-- STEP 1C: Check if you can access the table at all
SELECT COUNT(*) as user_count 
FROM public.users;

-- STEP 1D: Check your current authentication
SELECT 
    current_user,
    session_user,
    auth.uid() as auth_user_id,
    auth.role() as auth_role;

-- STEP 1E: Simple select test
SELECT id, email FROM public.users LIMIT 1;