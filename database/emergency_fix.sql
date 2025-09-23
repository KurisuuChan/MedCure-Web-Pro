-- 🚨 EMERGENCY FIX - Alternative Approach
-- If basic SQL is failing, try these simpler approaches

-- METHOD 1: Check if table exists differently
\d users

-- METHOD 2: Try without schema prefix
SELECT * FROM users LIMIT 1;

-- METHOD 3: Check RLS status without complex queries
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'users';

-- METHOD 4: Try to disable RLS with different syntax
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- METHOD 5: Nuclear option - Grant all permissions (temporary)
-- GRANT ALL ON public.users TO authenticated;
-- GRANT ALL ON public.users TO anon;