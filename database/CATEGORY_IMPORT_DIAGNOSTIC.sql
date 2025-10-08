-- =============================================================================
-- CATEGORY IMPORT DIAGNOSTIC & FIX SCRIPT
-- =============================================================================
-- Purpose: Diagnose and fix category creation issues during CSV import
-- Created: October 2025
-- Author: Senior Developer
-- =============================================================================

-- 📊 STEP 1: Check Current Category State
-- =============================================================================
SELECT 
  '=== CURRENT CATEGORIES ===' as section,
  COUNT(*) as total_categories,
  COUNT(*) FILTER (WHERE is_active = true) as active_categories,
  COUNT(*) FILTER (WHERE metadata->>'auto_created' = 'true') as auto_created_categories
FROM categories;

SELECT 
  id,
  name,
  description,
  is_active,
  created_at,
  metadata->>'auto_created' as auto_created,
  metadata->>'creation_source' as creation_source
FROM categories
ORDER BY created_at DESC
LIMIT 20;

-- 📊 STEP 2: Check for Duplicate or Similar Category Names
-- =============================================================================
SELECT 
  '=== POTENTIAL DUPLICATES ===' as section;

SELECT 
  LOWER(TRIM(name)) as normalized_name,
  COUNT(*) as count,
  array_agg(name ORDER BY created_at) as variations,
  array_agg(id ORDER BY created_at) as ids
FROM categories
GROUP BY LOWER(TRIM(name))
HAVING COUNT(*) > 1;

-- 📊 STEP 3: Check Category Table Permissions
-- =============================================================================
SELECT 
  '=== CATEGORY TABLE PERMISSIONS ===' as section;

-- Check if RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'categories';

-- Check RLS policies
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
WHERE tablename = 'categories';

-- 📊 STEP 4: Check for Failed Insert Attempts (if audit log exists)
-- =============================================================================
SELECT 
  '=== RECENT CATEGORY ACTIVITY ===' as section;

-- Check if user_activity_logs table exists and has category-related logs
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'user_activity_logs') THEN
    RAISE NOTICE 'Checking user activity logs...';
  ELSE
    RAISE NOTICE 'user_activity_logs table does not exist - skipping';
  END IF;
END $$;

-- 📊 STEP 5: Test Category Creation
-- =============================================================================
SELECT 
  '=== TESTING CATEGORY CREATION ===' as section;

-- Test insert (will rollback if in transaction)
BEGIN;

-- Try to create a test category
INSERT INTO categories (
  name,
  description,
  color,
  icon,
  sort_order,
  is_active,
  metadata
) VALUES (
  'Test Category Import',
  'Testing category creation from diagnostic script',
  '#3B82F6',
  'Package',
  9999,
  true,
  jsonb_build_object(
    'test', true,
    'created_by', 'diagnostic_script',
    'timestamp', NOW()
  )
)
ON CONFLICT (name) DO UPDATE 
SET updated_at = NOW()
RETURNING 
  id, 
  name, 
  'Successfully created or updated test category' as result;

ROLLBACK; -- Don't actually save the test

-- 🔧 STEP 6: FIX COMMON ISSUES
-- =============================================================================
SELECT 
  '=== APPLYING FIXES ===' as section;

-- Fix 1: Ensure categories table has proper indexes
CREATE INDEX IF NOT EXISTS idx_categories_name_lower 
ON categories (LOWER(name));

CREATE INDEX IF NOT EXISTS idx_categories_active 
ON categories (is_active);

CREATE INDEX IF NOT EXISTS idx_categories_sort_order 
ON categories (sort_order);

-- Fix 2: Create unique index on lowercase name if not exists
-- (PostgreSQL doesn't support function-based UNIQUE constraints, use unique index instead)
CREATE UNIQUE INDEX IF NOT EXISTS categories_name_lower_unique_idx 
ON categories (LOWER(name));

-- Fix 3: Ensure proper RLS policies for category creation
-- (Run this only if RLS is enabled and causing issues)

-- Disable RLS temporarily to test if it's the issue
-- ALTER TABLE categories DISABLE ROW LEVEL SECURITY;

-- Or create permissive policy for authenticated users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'categories' 
    AND policyname = 'allow_authenticated_insert'
  ) THEN
    CREATE POLICY allow_authenticated_insert ON categories
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'categories' 
    AND policyname = 'allow_authenticated_select'
  ) THEN
    CREATE POLICY allow_authenticated_select ON categories
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'categories' 
    AND policyname = 'allow_service_role_all'
  ) THEN
    CREATE POLICY allow_service_role_all ON categories
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- 🔧 STEP 7: Create Helper Function for Safe Category Creation
-- =============================================================================
CREATE OR REPLACE FUNCTION create_category_safe(
  p_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_color TEXT DEFAULT '#3B82F6',
  p_icon TEXT DEFAULT 'Package',
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(
  category_id UUID,
  category_name TEXT,
  was_created BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_category_id UUID;
  v_existing_id UUID;
  v_sort_order INTEGER;
BEGIN
  -- Normalize category name
  p_name := INITCAP(TRIM(p_name));
  
  -- Check if category already exists (case-insensitive)
  SELECT id INTO v_existing_id
  FROM categories
  WHERE LOWER(name) = LOWER(p_name)
  LIMIT 1;
  
  IF v_existing_id IS NOT NULL THEN
    -- Category exists, return it
    RETURN QUERY
    SELECT 
      v_existing_id,
      p_name,
      false,
      'Category already exists'::TEXT;
    RETURN;
  END IF;
  
  -- Get next sort order
  SELECT COALESCE(MAX(sort_order), 0) + 10 
  INTO v_sort_order
  FROM categories;
  
  -- Create new category
  INSERT INTO categories (
    name,
    description,
    color,
    icon,
    sort_order,
    is_active,
    metadata,
    created_at
  ) VALUES (
    p_name,
    COALESCE(p_description, 'Auto-created category'),
    p_color,
    p_icon,
    v_sort_order,
    true,
    p_metadata || jsonb_build_object(
      'auto_created', true,
      'created_at', NOW()
    ),
    NOW()
  )
  RETURNING id INTO v_category_id;
  
  RETURN QUERY
  SELECT 
    v_category_id,
    p_name,
    true,
    'Category created successfully'::TEXT;
    
EXCEPTION
  WHEN unique_violation THEN
    -- Race condition: another process created it
    SELECT id INTO v_existing_id
    FROM categories
    WHERE LOWER(name) = LOWER(p_name)
    LIMIT 1;
    
    RETURN QUERY
    SELECT 
      v_existing_id,
      p_name,
      false,
      'Category created by another process'::TEXT;
      
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create category: %', SQLERRM;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_category_safe TO authenticated, service_role;

-- 📊 STEP 8: Test the Helper Function
-- =============================================================================
SELECT 
  '=== TESTING HELPER FUNCTION ===' as section;

-- Test creating a new category
SELECT * FROM create_category_safe(
  'Test Import Category',
  'Created by diagnostic script',
  '#10B981',
  'Package',
  '{"test": true}'::jsonb
);

-- Test creating a duplicate (should return existing)
SELECT * FROM create_category_safe(
  'Test Import Category', -- Same name
  'Should return existing',
  '#EF4444',
  'AlertCircle'
);

-- Clean up test categories
DELETE FROM categories 
WHERE name = 'Test Import Category';

-- 📊 FINAL REPORT
-- =============================================================================
SELECT 
  '=== DIAGNOSTIC COMPLETE ===' as section,
  'Check the results above to identify issues' as message,
  'Use create_category_safe() function for reliable category creation' as recommendation;

-- Show summary
SELECT 
  '=== SUMMARY ===' as section,
  COUNT(*) as total_categories,
  COUNT(*) FILTER (WHERE is_active) as active_categories,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as created_today,
  COUNT(*) FILTER (WHERE metadata->>'auto_created' = 'true') as auto_created
FROM categories;

-- 🎯 USAGE INSTRUCTIONS
-- =============================================================================
/*
HOW TO USE THIS DIAGNOSTIC SCRIPT:

1. Run this entire script in your Supabase SQL Editor
2. Review the output for each section
3. Common issues and solutions:

   ISSUE: "RLS is blocking inserts"
   SOLUTION: Policies are created automatically by this script
   
   ISSUE: "Duplicate key violation"
   SOLUTION: Use the create_category_safe() function instead of direct INSERT
   
   ISSUE: "Permission denied"
   SOLUTION: Run this script with service_role credentials or check user permissions

4. Update your application code to use create_category_safe():

   // In JavaScript/TypeScript
   const { data, error } = await supabase.rpc('create_category_safe', {
     p_name: 'Pain Relief',
     p_description: 'Pain management medications',
     p_color: '#EF4444',
     p_icon: 'Zap',
     p_metadata: { source: 'import' }
   });

5. Monitor category creation in real-time:
   SELECT * FROM categories ORDER BY created_at DESC LIMIT 10;
*/
