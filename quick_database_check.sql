-- =============================================================================
-- QUICK DATABASE STATE CHECK
-- =============================================================================
-- Run this in Supabase to see what's wrong

-- Check if the schema update worked
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name = 'name'
    ) THEN
        RAISE NOTICE '❌ PROBLEM FOUND: "name" column still exists - Schema update did not run!';
        RAISE NOTICE '🔧 SOLUTION: You need to run update_products_table_schema.sql first';
    ELSE
        RAISE NOTICE '✅ Schema update completed - "name" column was renamed to "generic_name"';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name = 'generic_name'
    ) THEN
        RAISE NOTICE '✅ "generic_name" column exists';
    ELSE
        RAISE NOTICE '❌ "generic_name" column missing - Schema update failed!';
    END IF;
END $$;

-- Show current column structure
SELECT 'Current products table columns:' as message;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'products' 
  AND column_name IN ('name', 'generic_name', 'brand', 'brand_name', 'manufacturer', 'drug_classification')
ORDER BY column_name;