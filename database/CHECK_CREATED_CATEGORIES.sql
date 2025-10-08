-- =============================================================================
-- CHECK CREATED CATEGORIES ANALYSIS
-- =============================================================================
-- Purpose: Analyze the 93 categories that were created
-- =============================================================================

-- 📊 Show all 93 categories with details
SELECT 
  ROW_NUMBER() OVER (ORDER BY name) as row_num,
  name,
  description,
  color,
  icon,
  metadata->>'creation_source' as source,
  created_at
FROM categories
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY name;

-- 📊 Check for potential issues
SELECT 
  '=== POTENTIAL ISSUES ===' as section;

-- Issue 1: Check if product names were used as categories
SELECT 
  'Categories that look like product names:' as issue,
  COUNT(*) as count
FROM categories
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND (
    name ILIKE '%tablet%' OR
    name ILIKE '%capsule%' OR
    name ILIKE '%syrup%' OR
    name ILIKE '%mg%' OR
    name ILIKE '%ml%' OR
    LENGTH(name) > 50  -- Abnormally long category names
  );

-- Issue 2: Check for single-use categories (only 1 product per category)
WITH category_product_counts AS (
  SELECT 
    c.name as category_name,
    COUNT(p.id) as product_count
  FROM categories c
  LEFT JOIN products p ON p.category = c.name
  WHERE c.created_at > NOW() - INTERVAL '24 hours'
  GROUP BY c.name
)
SELECT 
  'Single-use categories (possibly product names):' as issue,
  category_name,
  product_count
FROM category_product_counts
WHERE product_count <= 1
ORDER BY category_name
LIMIT 20;

-- Issue 3: Show category usage statistics
WITH category_usage AS (
  SELECT 
    c.name as category_name,
    COUNT(p.id) as product_count
  FROM categories c
  LEFT JOIN products p ON p.category = c.name
  WHERE c.created_at > NOW() - INTERVAL '24 hours'
  GROUP BY c.name
)
SELECT 
  'Category Usage Distribution:' as analysis,
  category_name,
  product_count
FROM category_usage
ORDER BY product_count DESC, category_name
LIMIT 30;

-- 📊 Recommended Actions
SELECT 
  '=== RECOMMENDATIONS ===' as section;

-- Show categories that should probably be merged
WITH category_stats AS (
  SELECT 
    c.name,
    COUNT(p.id) as product_count
  FROM categories c
  LEFT JOIN products p ON p.category = c.name
  WHERE c.created_at > NOW() - INTERVAL '24 hours'
  GROUP BY c.name
)
SELECT 
  CASE 
    WHEN product_count = 0 THEN '❌ Empty Category'
    WHEN product_count = 1 THEN '⚠️ Single Product Category'
    WHEN product_count >= 10 THEN '✅ Well-Used Category'
    ELSE 'ℹ️ Low-Use Category'
  END as status,
  name,
  product_count
FROM category_stats
ORDER BY 
  CASE 
    WHEN product_count = 0 THEN 1
    WHEN product_count = 1 THEN 2
    ELSE 3
  END,
  product_count DESC,
  name;

-- 🔧 CLEANUP RECOMMENDATIONS
SELECT 
  '=== CLEANUP SUGGESTIONS ===' as section;

SELECT 
  'Empty categories to delete:' as action,
  COUNT(*) as count
FROM categories c
WHERE c.created_at > NOW() - INTERVAL '24 hours'
  AND NOT EXISTS (SELECT 1 FROM products p WHERE p.category = c.name);

SELECT 
  'Single-product categories to review:' as action,
  COUNT(*) as count
FROM categories c
WHERE c.created_at > NOW() - INTERVAL '24 hours'
  AND (SELECT COUNT(*) FROM products p WHERE p.category = c.name) = 1;

-- 📝 OPTIONAL: Generate cleanup script for empty categories
/*
-- Run this to delete empty categories:
DELETE FROM categories
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND NOT EXISTS (SELECT 1 FROM products p WHERE p.category = categories.name);
*/
