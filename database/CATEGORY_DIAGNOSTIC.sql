-- ============================================================
-- CATEGORY CREATION FAILURE - DIAGNOSTIC SQL
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. CHECK IF FAILING CATEGORIES ALREADY EXIST
-- ============================================================
SELECT 
  '1. Exact Match Check' AS check_type,
  name, 
  id, 
  is_active, 
  created_at,
  metadata
FROM categories
WHERE name IN (
  'Antihistamine (First Generation)',
  'Dietary Supplement',
  'Iron Supplement',
  'Renal Supplement',
  'Antihypertensive',
  'Energy Supplement',
  'Brain Health Supplement',
  'Liver Health Supplement',
  'General Supplement',
  'Infant Supplement',
  'Electrolyte Supplement',
  'Statin/Cholesterol Lowering'
)
ORDER BY name;

-- 2. CHECK FOR SIMILAR NAMES (Case-insensitive)
-- ============================================================
SELECT 
  '2. Fuzzy Match Check' AS check_type,
  name, 
  id, 
  is_active
FROM categories
WHERE LOWER(name) LIKE '%supplement%'
   OR LOWER(name) LIKE '%antihistamine%'
   OR LOWER(name) LIKE '%antihypertensive%'
   OR LOWER(name) LIKE '%statin%'
   OR LOWER(name) LIKE '%cholesterol%'
ORDER BY name;

-- 3. CHECK ROW LEVEL SECURITY STATUS
-- ============================================================
SELECT 
  '3. RLS Status' AS check_type,
  tablename,
  CASE 
    WHEN rowsecurity THEN '🔒 ENABLED'
    ELSE '🔓 DISABLED'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'categories';

-- 4. CHECK RLS POLICIES (if RLS is enabled)
-- ============================================================
SELECT 
  '4. RLS Policies' AS check_type,
  policyname,
  cmd as operation,
  CASE 
    WHEN roles = '{public}' THEN 'PUBLIC'
    ELSE array_to_string(roles, ', ')
  END as roles,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING clause'
  END as using_check,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
    ELSE 'No WITH CHECK clause'
  END as with_check_status
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'categories'
ORDER BY cmd, policyname;

-- 5. CHECK TABLE CONSTRAINTS
-- ============================================================
SELECT 
  '5. Table Constraints' AS check_type,
  conname as constraint_name,
  contype as constraint_type,
  CASE contype
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'f' THEN 'FOREIGN KEY'
    WHEN 'u' THEN 'UNIQUE'
    WHEN 'c' THEN 'CHECK'
    ELSE contype::text
  END as constraint_description,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.categories'::regclass
ORDER BY contype, conname;

-- 6. GET ALL CATEGORIES (for reference)
-- ============================================================
SELECT 
  '6. All Categories' AS check_type,
  COUNT(*) as total_categories
FROM categories;

SELECT 
  name,
  id,
  is_active,
  sort_order,
  created_at
FROM categories
ORDER BY name
LIMIT 50;

-- ============================================================
-- DIAGNOSTIC SUMMARY
-- ============================================================
SELECT 
  '=== DIAGNOSTIC SUMMARY ===' AS info,
  (SELECT COUNT(*) FROM categories) as total_categories,
  (SELECT COUNT(*) FROM categories WHERE is_active = true) as active_categories,
  (SELECT COUNT(*) FROM categories WHERE is_active = false) as inactive_categories,
  (
    SELECT CASE 
      WHEN rowsecurity THEN 'ENABLED ⚠️'
      ELSE 'DISABLED ✅'
    END
    FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'categories'
  ) as rls_status,
  (
    SELECT COUNT(*)
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'categories'
  ) as total_policies;

-- ============================================================
-- SOLUTIONS (Uncomment the one you need)
-- ============================================================

-- SOLUTION A: Delete duplicate categories (if they exist)
-- WARNING: This will delete data. Only use if you're sure.
-- ============================================================
/*
DELETE FROM categories
WHERE name IN (
  'Antihistamine (First Generation)',
  'Dietary Supplement',
  'Iron Supplement',
  'Renal Supplement',
  'Antihypertensive',
  'Energy Supplement',
  'Brain Health Supplement',
  'Liver Health Supplement',
  'General Supplement',
  'Infant Supplement',
  'Electrolyte Supplement',
  'Statin/Cholesterol Lowering'
);
*/

-- SOLUTION B: Disable RLS (if it's blocking inserts)
-- WARNING: This removes security. Only use in development.
-- ============================================================
/*
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
*/

-- SOLUTION C: Add INSERT policy for authenticated users
-- ============================================================
/*
CREATE POLICY "Allow authenticated users to insert categories"
ON categories
FOR INSERT
TO authenticated
WITH CHECK (true);
*/

-- SOLUTION D: Add comprehensive policies for categories
-- ============================================================
/*
-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users
CREATE POLICY "Allow all for authenticated users"
ON categories
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow read for public (optional)
CREATE POLICY "Allow read for public"
ON categories
FOR SELECT
TO public
USING (is_active = true);
*/

-- SOLUTION E: Check if there are inactive versions
-- ============================================================
/*
-- Find and reactivate existing categories
UPDATE categories
SET is_active = true
WHERE name IN (
  'Antihistamine (First Generation)',
  'Dietary Supplement',
  'Iron Supplement'
  -- add others as needed
)
AND is_active = false;
*/
