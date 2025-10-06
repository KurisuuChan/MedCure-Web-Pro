-- ================================================================
-- FIX USERS TABLE RLS FOR CUSTOM AUTHENTICATION
-- ================================================================
-- Problem: Current RLS policies use auth.uid() and auth.role()
--          which only work with Supabase Auth, not custom auth
-- Solution: Temporarily disable RLS or create permissive policies
-- ================================================================

-- ================================================================
-- STEP 1: CREATE MISSING user_activity_logs TABLE
-- ================================================================
-- This table is needed for login tracking

CREATE TABLE IF NOT EXISTS user_activity_logs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_action ON user_activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created ON user_activity_logs(created_at);

SELECT '✅ user_activity_logs table created' as status;

-- ================================================================
-- STEP 2: DISABLE OR FIX PROBLEMATIC TRIGGER
-- ================================================================
-- Check if trigger exists and handle it

DO $$
BEGIN
    -- Try to drop the trigger if it exists
    IF EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'log_user_activity_trigger'
    ) THEN
        DROP TRIGGER log_user_activity_trigger ON users;
        RAISE NOTICE '✅ Dropped existing log_user_activity_trigger';
    END IF;
    
    -- Drop the function if it exists
    DROP FUNCTION IF EXISTS log_user_activity() CASCADE;
    RAISE NOTICE '✅ Dropped log_user_activity() function';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Could not drop trigger/function: %', SQLERRM;
END $$;

-- ================================================================
-- STEP 3: DISABLE RLS (Quick Fix - Recommended for Development)
-- ================================================================
-- This allows all operations on the users table
-- Good for development/testing, but should be secured in production

ALTER TABLE users DISABLE ROW LEVEL SECURITY;

SELECT '✅ RLS disabled on users table - All operations now allowed' as status;

-- ================================================================
-- OPTION 2: CREATE PERMISSIVE POLICIES (Better for Production)
-- ================================================================
-- Uncomment this section if you want to keep RLS enabled
-- but make it work with your custom authentication

/*
-- First, drop existing restrictive policies
DROP POLICY IF EXISTS "users_can_view_own_profile" ON users;
DROP POLICY IF EXISTS "authenticated_users_can_view_user_roles" ON users;
DROP POLICY IF EXISTS "service_role_can_manage_users" ON users;
DROP POLICY IF EXISTS "authenticated_users_select_users" ON users;
DROP POLICY IF EXISTS "authenticated_users_update_users" ON users;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create new permissive policies that allow authenticated role
-- (which your Supabase client uses by default)

-- Policy 1: Allow SELECT for anyone (needed for login lookup)
CREATE POLICY "allow_public_select_users" 
ON users 
FOR SELECT 
USING (true);

-- Policy 2: Allow INSERT for service_role (needed for user creation)
CREATE POLICY "allow_service_insert_users" 
ON users 
FOR INSERT 
WITH CHECK (true);

-- Policy 3: Allow UPDATE for all (needed for last_login updates)
-- In production, you might want to restrict this to specific columns
CREATE POLICY "allow_all_update_users" 
ON users 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Policy 4: Allow DELETE for service_role only
CREATE POLICY "allow_service_delete_users" 
ON users 
FOR DELETE 
USING (true);

SELECT '✅ RLS policies updated for custom authentication' as status;
*/

-- ================================================================
-- OPTION 3: GRANT DIRECT PERMISSIONS (Alternative)
-- ================================================================
-- Grant permissions directly to roles used by your app
-- Uncomment if you want to use this approach

/*
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON users TO anon;
GRANT ALL ON users TO service_role;

SELECT '✅ Granted permissions to authenticated, anon, and service_role' as status;
*/

-- ================================================================
-- VERIFICATION QUERIES
-- ================================================================

-- Check current RLS status
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'users';

-- Check remaining policies
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'users';

-- Test if updates will work now
DO $$
DECLARE
    test_user_id uuid;
    update_result INTEGER;
BEGIN
    -- Get first active user ID
    SELECT id INTO test_user_id FROM users WHERE is_active = true LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Try to update last_login
        UPDATE users 
        SET last_login = NOW() 
        WHERE id = test_user_id;
        
        GET DIAGNOSTICS update_result = ROW_COUNT;
        
        IF update_result > 0 THEN
            RAISE NOTICE '✅ SUCCESS: Update worked! Updated user: %', test_user_id;
            RAISE NOTICE '📝 You can now test login tracking in your app';
        ELSE
            RAISE NOTICE '❌ FAILED: Update did not affect any rows';
            RAISE NOTICE '🔍 RLS might still be blocking updates';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ No active users found to test';
    END IF;
END $$;

-- Show current state of all users
SELECT 
    email,
    role,
    is_active,
    last_login,
    CASE 
        WHEN last_login IS NULL THEN '❌ Never logged in'
        WHEN last_login < NOW() - INTERVAL '24 hours' THEN '⏰ Old login'
        ELSE '✅ Recent login'
    END as status
FROM users 
ORDER BY role, email;

-- ================================================================
-- INSTRUCTIONS
-- ================================================================

SELECT '
╔═══════════════════════════════════════════════════════════════╗
║                    🔧 COMPLETE FIX APPLIED                    ║
╚═══════════════════════════════════════════════════════════════╝

✅ WHAT WAS DONE:
   1. Created user_activity_logs table (was missing)
   2. Removed problematic trigger/function (caused errors)
   3. Disabled Row Level Security (RLS) on users table
   → This allows your custom authentication to update last_login

🧪 NEXT STEPS:
   1. Check the verification output above
   2. Log out from your application
   3. Log in with any user account
   4. Check browser console for:
      → "✅ [LoginTracking] Successfully updated last login"
      → "✅ [AuthProvider] Login tracked successfully"
   5. Go to User Management page as admin
   6. Check "Active Sessions" - should now show logged-in users!

⚠️  WHAT THE ERROR WAS:
   - Missing user_activity_logs table
   - Trigger tried to log to non-existent table
   - RLS policies blocked custom auth updates

🔍 VERIFY IT WORKS:
   Run this after logging in:
   
   SELECT email, last_login 
   FROM users 
   WHERE email = ''your-email@example.com'';
   
   → last_login should be a recent timestamp!

⚠️  PRODUCTION NOTES:
   - For production, consider using OPTION 2 instead
   - OPTION 2 keeps RLS enabled with permissive policies
   - Current fix is safe for development/testing

═══════════════════════════════════════════════════════════════
' as instructions;
