-- =====================================================
-- Quick Fix: Update Testing User Role from CASHIER to EMPLOYEE
-- =====================================================

-- This script updates the "Testing User" account from old "CASHIER" role to new "EMPLOYEE" role

BEGIN;

-- Show current status
SELECT 
  '📋 Current Testing User Status' as info,
  id,
  email,
  first_name,
  last_name,
  role,
  is_active,
  last_login
FROM users
WHERE email = 'test@pharmacy.com' OR role = 'cashier';

-- Update Testing User role from cashier to employee
UPDATE users 
SET 
  role = 'employee',
  updated_at = NOW()
WHERE email = 'test@pharmacy.com' OR role = 'cashier';

-- Verify the update
SELECT 
  '✅ Updated Testing User Status' as info,
  id,
  email,
  first_name,
  last_name,
  role,
  is_active,
  last_login
FROM users
WHERE email = 'test@pharmacy.com' OR id IN (
  SELECT id FROM users WHERE role = 'employee'
);

-- Check all current roles in system
SELECT 
  '📊 All Roles in System' as info,
  role,
  COUNT(*) as count,
  STRING_AGG(email, ', ') as users
FROM users
GROUP BY role
ORDER BY 
  CASE 
    WHEN role = 'admin' THEN 1
    WHEN role = 'pharmacist' THEN 2
    WHEN role = 'employee' THEN 3
    ELSE 4
  END;

-- List any remaining old roles (should be empty after migration)
SELECT 
  '⚠️ Old Roles Still in Database (should be empty)' as info,
  role,
  COUNT(*) as count,
  STRING_AGG(email, ', ') as affected_users
FROM users
WHERE role IN ('cashier', 'staff', 'manager', 'super_admin')
GROUP BY role;

COMMIT;

-- =====================================================
-- Expected Result
-- =====================================================
-- Testing User should now show as "EMPLOYEE" role
-- Role badge should be blue (bg-blue-100 text-blue-800)
-- User can process sales and view inventory
