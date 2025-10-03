-- =============================================================================
-- DATABASE SCHEMA DIAGNOSTIC SCRIPT
-- =============================================================================
-- Purpose: Check the current state of products table schema
-- Date: October 3, 2025
-- =============================================================================

-- Check if products table exists and its structure
SELECT 
    'Table Structure Check' as test_name,
    'Checking products table columns' as description;

-- Get all columns in products table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'products'
ORDER BY ordinal_position;

-- Check for specific medicine-related columns
SELECT 
    'Medicine Columns Check' as test_name,
    'Checking if new medicine columns exist' as description;

-- Check which medicine columns exist
SELECT 
    column_name,
    CASE 
        WHEN column_name IN ('generic_name', 'brand_name', 'dosage_form', 'dosage_strength', 'manufacturer', 'drug_classification', 'pharmacologic_category', 'storage_conditions', 'registration_number') 
        THEN '✅ NEW MEDICINE COLUMN'
        WHEN column_name IN ('name', 'brand')
        THEN '⚠️ OLD COLUMN (should be renamed)'
        ELSE '📋 STANDARD COLUMN'
    END as column_status
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'products'
AND column_name IN ('name', 'generic_name', 'brand', 'brand_name', 'dosage_form', 'dosage_strength', 'manufacturer', 'drug_classification', 'pharmacologic_category', 'storage_conditions', 'registration_number')
ORDER BY column_name;

-- Check if ENUM types exist
SELECT 
    'ENUM Types Check' as test_name,
    'Checking if dosage_form_enum and drug_classification_enum exist' as description;

SELECT 
    typname as enum_name,
    enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE typname IN ('dosage_form_enum', 'drug_classification_enum')
ORDER BY typname, enumsortorder;

-- Check current RPC functions
SELECT 
    'RPC Functions Check' as test_name,
    'Checking if search functions exist' as description;

SELECT 
    proname as function_name,
    prosrc LIKE '%p.name%' as references_old_name_column,
    prosrc LIKE '%p.brand%' as references_old_brand_column,
    prosrc LIKE '%generic_name%' as references_generic_name,
    prosrc LIKE '%brand_name%' as references_brand_name
FROM pg_proc 
WHERE proname IN ('search_products', 'search_products_filtered', 'get_distinct_manufacturers', 'get_distinct_drug_classifications');

-- Sample data check (if any exists)
SELECT 
    'Sample Data Check' as test_name,
    'Checking first few products to see data structure' as description;

-- Check a few products to see what data exists
SELECT 
    id,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'generic_name') 
         THEN 'HAS generic_name column' 
         ELSE 'NO generic_name column' END as generic_name_status,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'brand_name') 
         THEN 'HAS brand_name column' 
         ELSE 'NO brand_name column' END as brand_name_status,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'name') 
         THEN 'HAS name column' 
         ELSE 'NO name column' END as name_status,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'brand') 
         THEN 'HAS brand column' 
         ELSE 'NO brand column' END as brand_status
FROM products 
LIMIT 1;

-- Migration status summary
SELECT 
    'Migration Status Summary' as test_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'generic_name') 
             AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'brand_name')
             AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'name')
             AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'brand')
        THEN '✅ FULLY MIGRATED - New columns exist, old columns removed'
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'generic_name') 
             AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'brand_name')
             AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'name')
             AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'brand')
        THEN '⚠️ PARTIAL MIGRATION - Both old and new columns exist'
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'generic_name') 
             AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'name')
        THEN '❌ NOT MIGRATED - Still using old column structure'
        ELSE '❓ UNKNOWN STATE - Unexpected column configuration'
    END as migration_status;