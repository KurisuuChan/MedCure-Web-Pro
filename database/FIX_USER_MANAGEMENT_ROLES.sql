-- =====================================================
-- USER MANAGEMENT ROLE FIX
-- =====================================================
-- Problem: Database CHECK constraint only allows 'admin', 'manager', 'cashier'
-- but UserManagementService uses 'admin', 'pharmacist', 'employee'
-- Solution: Update constraint to support both old and new role systems
-- =====================================================

-- Step 1: Drop the old CHECK constraint
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_role_check;

-- Step 2: Add new CHECK constraint with updated roles
-- Supports: admin, pharmacist, employee (new system)
-- Also supports: manager, cashier, staff, super_admin (for backward compatibility)
ALTER TABLE public.users 
ADD CONSTRAINT users_role_check 
CHECK (role::text = ANY (ARRAY[
  'admin'::character varying,
  'pharmacist'::character varying,
  'employee'::character varying,
  'manager'::character varying,
  'cashier'::character varying,
  'staff'::character varying,
  'super_admin'::character varying
]::text[]));

-- Step 3: Migrate existing legacy roles to new role system (optional)
-- Uncomment the following lines if you want to migrate old roles to new ones:
/*
UPDATE public.users SET role = 'admin' WHERE role = 'super_admin';
UPDATE public.users SET role = 'pharmacist' WHERE role = 'manager';
UPDATE public.users SET role = 'employee' WHERE role IN ('cashier', 'staff');
*/

-- Step 4: Verify the changes
SELECT 
  'Users Table Role Constraint Updated' as status,
  COUNT(*) as total_users,
  COUNT(DISTINCT role) as unique_roles
FROM public.users;

-- Step 5: Show current role distribution
SELECT 
  role,
  COUNT(*) as user_count,
  CASE 
    WHEN role IN ('admin', 'pharmacist', 'employee') THEN '✅ New System'
    WHEN role IN ('super_admin', 'manager', 'cashier', 'staff') THEN '⚠️  Legacy System'
    ELSE '❌ Unknown'
  END as system_type
FROM public.users
GROUP BY role
ORDER BY 
  CASE role
    WHEN 'admin' THEN 1
    WHEN 'super_admin' THEN 1
    WHEN 'pharmacist' THEN 2
    WHEN 'manager' THEN 2
    WHEN 'employee' THEN 3
    WHEN 'cashier' THEN 3
    WHEN 'staff' THEN 3
    ELSE 4
  END;

-- =====================================================
-- EXPLANATION OF NEW ROLE SYSTEM (3-Tier)
-- =====================================================
-- 
-- 1. ADMIN (admin, super_admin)
--    - Full system access
--    - Can manage users, roles, permissions
--    - View all reports and analytics
--    - Highest level of access
--
-- 2. PHARMACIST (pharmacist, manager)
--    - Inventory management (create, edit, delete products)
--    - Sales and POS operations
--    - Financial reports
--    - Customer management
--    - Cannot manage users or system settings
--
-- 3. EMPLOYEE (employee, cashier, staff)
--    - View inventory
--    - Process sales (basic POS)
--    - View customers
--    - Limited access, no management functions
--
-- =====================================================

-- Step 6: Create a helper function to check user permissions
CREATE OR REPLACE FUNCTION public.user_has_permission(
  p_user_id UUID,
  p_permission TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
  v_has_permission BOOLEAN := FALSE;
BEGIN
  -- Get user's role
  SELECT role INTO v_role
  FROM public.users
  WHERE id = p_user_id AND is_active = TRUE;
  
  -- If user not found or inactive, return false
  IF v_role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check permissions based on role
  -- ADMIN: Full access to everything
  IF v_role IN ('admin', 'super_admin') THEN
    v_has_permission := TRUE;
  
  -- PHARMACIST: Management access (inventory, sales, reports)
  ELSIF v_role IN ('pharmacist', 'manager') THEN
    v_has_permission := p_permission IN (
      'view_users',
      'create_products', 'edit_products', 'delete_products',
      'view_inventory', 'manage_stock', 'manage_batches',
      'process_sales', 'handle_returns', 'void_transactions',
      'view_sales_reports', 'manage_discounts',
      'view_financial_reports', 'manage_pricing',
      'view_customers', 'manage_customers'
    );
  
  -- EMPLOYEE: Basic access (view inventory, process sales)
  ELSIF v_role IN ('employee', 'cashier', 'staff') THEN
    v_has_permission := p_permission IN (
      'view_inventory',
      'process_sales',
      'view_customers'
    );
  END IF;
  
  RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Test the permission function
SELECT 
  'Testing permission function' as test,
  role,
  user_has_permission(id, 'create_products') as can_create_products,
  user_has_permission(id, 'view_inventory') as can_view_inventory,
  user_has_permission(id, 'create_users') as can_manage_users
FROM public.users
LIMIT 5;

-- =====================================================
-- CLEANUP AND VERIFICATION
-- =====================================================

-- Verify constraint was added
SELECT
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'users_role_check';

COMMIT;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
SELECT '✅ User Management Roles Fixed!' as status,
       'Database now supports both new and legacy role systems' as message,
       'Run the CREATE USER test from the UI to verify everything works' as next_step;
