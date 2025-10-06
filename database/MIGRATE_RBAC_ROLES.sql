-- =====================================================
-- RBAC Role Migration Script
-- Updates old role names to new simplified 3-tier system
-- =====================================================

-- 🎯 Purpose: Convert 6-role system to 3-role system
-- Old Roles: super_admin, admin, manager, pharmacist, cashier, staff
-- New Roles: admin, pharmacist, employee

BEGIN;

-- =====================================================
-- Step 1: Check Current Role Distribution
-- =====================================================
SELECT 
  '📊 Current Role Distribution' as info,
  role,
  COUNT(*) as user_count
FROM users
GROUP BY role
ORDER BY user_count DESC;

-- =====================================================
-- Step 2: Backup Current State (Optional)
-- =====================================================
-- Uncomment if you want to create a backup
-- CREATE TABLE users_backup_before_rbac_migration AS
-- SELECT * FROM users;

-- =====================================================
-- Step 3: Update Roles to New System
-- =====================================================

-- Convert super_admin → admin
UPDATE users 
SET role = 'admin' 
WHERE role = 'super_admin';

-- Convert manager → pharmacist
UPDATE users 
SET role = 'pharmacist' 
WHERE role = 'manager';

-- Convert cashier → employee
UPDATE users 
SET role = 'employee' 
WHERE role = 'cashier';

-- Convert staff → employee
UPDATE users 
SET role = 'employee' 
WHERE role = 'staff';

-- Note: 'admin' stays 'admin'
-- Note: 'pharmacist' stays 'pharmacist'

-- =====================================================
-- Step 4: Verify Migration Results
-- =====================================================
SELECT 
  '✅ Updated Role Distribution' as info,
  role,
  COUNT(*) as user_count
FROM users
GROUP BY role
ORDER BY 
  CASE 
    WHEN role = 'admin' THEN 1
    WHEN role = 'pharmacist' THEN 2
    WHEN role = 'employee' THEN 3
    ELSE 4
  END;

-- =====================================================
-- Step 5: Check for Any Unmapped Roles
-- =====================================================
SELECT 
  '⚠️ Unmapped Roles (should be empty)' as info,
  role,
  COUNT(*) as user_count
FROM users
WHERE role NOT IN ('admin', 'pharmacist', 'employee')
GROUP BY role;

-- =====================================================
-- Step 6: Show Sample Users by Role
-- =====================================================
SELECT 
  '👥 Sample Users by Role' as info,
  role,
  first_name || ' ' || last_name as full_name,
  email,
  is_active
FROM users
ORDER BY 
  CASE 
    WHEN role = 'admin' THEN 1
    WHEN role = 'pharmacist' THEN 2
    WHEN role = 'employee' THEN 3
    ELSE 4
  END,
  last_name;

-- =====================================================
-- Step 7: Update Timestamps
-- =====================================================
UPDATE users 
SET updated_at = NOW()
WHERE role IN ('admin', 'pharmacist', 'employee');

COMMIT;

-- =====================================================
-- Rollback Instructions (if needed)
-- =====================================================
-- If something goes wrong, run:
-- ROLLBACK;
-- 
-- Or restore from backup:
-- DELETE FROM users;
-- INSERT INTO users SELECT * FROM users_backup_before_rbac_migration;

-- =====================================================
-- Expected Results
-- =====================================================
-- After migration, you should have ONLY these roles:
-- 1. admin      - Super administrator (1-2 users typically)
-- 2. pharmacist - Licensed pharmacists (few users)
-- 3. employee   - Basic staff members (most users)

-- =====================================================
-- Post-Migration Checklist
-- =====================================================
-- ✅ All users have one of three roles: admin, pharmacist, employee
-- ✅ No users have old roles: super_admin, manager, cashier, staff
-- ✅ Admin users have full access
-- ✅ Pharmacist users can manage inventory and sales
-- ✅ Employee users can process sales and view inventory
-- ✅ All users can still login (role change doesn't affect authentication)

-- =====================================================
-- Testing Recommendations
-- =====================================================
-- 1. Test login as admin → Should have full access
-- 2. Test login as pharmacist → Should access inventory and sales
-- 3. Test login as employee → Should access sales only
-- 4. Verify User Management page shows correct role badges:
--    - admin: Red badge
--    - pharmacist: Green badge
--    - employee: Blue badge
