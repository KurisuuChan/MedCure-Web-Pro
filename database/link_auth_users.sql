-- 🔗 **LINK SUPABASE AUTH USERS TO DATABASE USERS**
-- This creates user records in our users table that correspond to Supabase Auth users

-- First, let's check if we have any Supabase Auth users
-- (You would have created these in the Supabase Auth dashboard)

-- Insert user records that match the Supabase Auth accounts
-- Replace the UUIDs below with the actual UUIDs from your Supabase Auth users

-- You can find the UUIDs by going to:
-- Supabase Dashboard > Authentication > Users
-- Copy the ID from each user you created

-- Example inserts (replace with your actual Auth user IDs):
INSERT INTO users (id, email, role, first_name, last_name, phone, is_active) VALUES
-- Replace 'your-admin-auth-uuid-here' with the actual UUID from Supabase Auth
('00000000-0000-0000-0000-000000000001', 'admin@medcure.com', 'admin', 'System', 'Administrator', '+1234567890', true),

-- Replace 'your-manager-auth-uuid-here' with the actual UUID from Supabase Auth  
('00000000-0000-0000-0000-000000000002', 'manager@medcure.com', 'manager', 'Store', 'Manager', '+1234567891', true),

-- Replace 'your-cashier-auth-uuid-here' with the actual UUID from Supabase Auth
('00000000-0000-0000-0000-000000000003', 'cashier@medcure.com', 'cashier', 'Front', 'Cashier', '+1234567892', true)

ON CONFLICT (email) DO UPDATE SET
    role = EXCLUDED.role,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    phone = EXCLUDED.phone,
    is_active = EXCLUDED.is_active;

-- Verify the users were created
SELECT id, email, role, first_name, last_name, is_active FROM users;
