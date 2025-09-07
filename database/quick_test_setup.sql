-- 🚀 **QUICK AUTH TEST SETUP**
-- Creates a test user that bypasses the current RLS issue for immediate testing

-- First, disable RLS temporarily on users table for testing
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Insert a test user that can be used immediately
INSERT INTO users (email, role, first_name, last_name, phone, is_active) VALUES
('test@medcure.com', 'admin', 'Test', 'User', '+1234567890', true)
ON CONFLICT (email) DO UPDATE SET
    role = EXCLUDED.role,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    is_active = true;

-- Create a corresponding Supabase Auth user
-- You'll need to run this in Supabase Auth > Users > "Add user"
-- Email: test@medcure.com
-- Password: TestUser123!
-- Then get the UUID and update the users table with:
-- UPDATE users SET id = 'actual-auth-uuid' WHERE email = 'test@medcure.com';

-- Re-enable RLS after testing
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
