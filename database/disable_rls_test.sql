-- 🚨 DISABLE RLS TO TEST USER DELETION
-- Run this command in Supabase SQL Editor

ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- After running this, go back to your app and try deleting a user
-- If it works, then RLS was the problem!