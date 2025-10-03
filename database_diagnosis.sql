-- =============================================================================
-- MEDCURE DATABASE DIAGNOSIS SCRIPT
-- =============================================================================
-- Purpose: Check current database schema and guide migration
-- Date: October 3, 2025
-- =============================================================================

-- Check current products table structure
SELECT 'Current products table columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'products' 
ORDER BY ordinal_position;

-- Check if new columns exist
SELECT 'Checking for new columns:' as info;
SELECT 
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'generic_name'
  ) THEN 'generic_name: EXISTS' ELSE 'generic_name: MISSING' END as generic_name_status,
  
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'brand_name'
  ) THEN 'brand_name: EXISTS' ELSE 'brand_name: MISSING' END as brand_name_status,
  
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'manufacturer'
  ) THEN 'manufacturer: EXISTS' ELSE 'manufacturer: MISSING' END as manufacturer_status,
  
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'drug_classification'
  ) THEN 'drug_classification: EXISTS' ELSE 'drug_classification: MISSING' END as drug_classification_status;

-- Check if ENUM types exist
SELECT 'Checking for ENUM types:' as info;
SELECT 
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'dosage_form_enum'
  ) THEN 'dosage_form_enum: EXISTS' ELSE 'dosage_form_enum: MISSING' END as dosage_form_enum_status,
  
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'drug_classification_enum'
  ) THEN 'drug_classification_enum: EXISTS' ELSE 'drug_classification_enum: MISSING' END as drug_classification_enum_status;

-- Check if search functions exist
SELECT 'Checking for search functions:' as info;
SELECT 
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'search_products'
  ) THEN 'search_products: EXISTS' ELSE 'search_products: MISSING' END as search_products_status,
  
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'search_products_filtered'
  ) THEN 'search_products_filtered: EXISTS' ELSE 'search_products_filtered: MISSING' END as search_products_filtered_status,
  
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'get_distinct_manufacturers'
  ) THEN 'get_distinct_manufacturers: EXISTS' ELSE 'get_distinct_manufacturers: MISSING' END as get_distinct_manufacturers_status,
  
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'get_distinct_drug_classifications'
  ) THEN 'get_distinct_drug_classifications: EXISTS' ELSE 'get_distinct_drug_classifications: MISSING' END as get_distinct_drug_classifications_status;

-- Sample data check
SELECT 'Sample products data:' as info;
SELECT id, name, brand, category, description 
FROM public.products 
WHERE is_active = true 
LIMIT 3;

-- Diagnosis summary
SELECT 'DIAGNOSIS SUMMARY:' as info;
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'generic_name')
    THEN '✅ Schema has been updated - Ready for enhanced search functions'
    ELSE '❌ Schema needs updating - Run update_products_table_schema.sql first'
  END as schema_status,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'search_products')
    THEN '✅ Search functions exist - Database ready'
    ELSE '❌ Search functions missing - Run create_enhanced_search_functions.sql after schema update'
  END as functions_status;