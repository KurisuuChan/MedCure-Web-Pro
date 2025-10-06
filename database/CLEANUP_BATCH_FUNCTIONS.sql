-- ================================================================
-- CLEAN BATCH FUNCTIONS - COMPLETE REMOVAL
-- ================================================================
-- This script removes ALL batch-related functions completely
-- Run this FIRST, then we'll create new ones from scratch
-- ================================================================

BEGIN;

-- ================================================================
-- 1. DROP ALL BATCH FUNCTIONS (COMPREHENSIVE CLEANUP)
-- ================================================================

-- AGGRESSIVE FUNCTION REMOVAL - Handle all possible signatures
DO $$
DECLARE
    func_record RECORD;
    drop_statement TEXT;
BEGIN
    -- Drop all variations of batch functions by finding them dynamically
    FOR func_record IN 
        SELECT 
            p.oid,
            p.proname,
            pg_get_function_identity_arguments(p.oid) as args,
            pg_get_function_arguments(p.oid) as full_args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE 
            n.nspname = 'public' 
            AND (
                p.proname = 'get_all_batches_enhanced'
                OR p.proname = 'get_all_batches'
                OR p.proname = 'get_batch_analytics'
                OR p.proname = 'fetch_batches_with_details'
                OR p.proname = 'add_product_batch'
                OR p.proname = 'update_batch_quantity'
                OR p.proname = 'generate_batch_number'
            )
    LOOP
        BEGIN
            drop_statement := 'DROP FUNCTION ' || func_record.proname || '(' || func_record.args || ') CASCADE';
            EXECUTE drop_statement;
            RAISE NOTICE 'Successfully dropped: % with args: %', func_record.proname, func_record.args;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop %(%): %', func_record.proname, func_record.args, SQLERRM;
        END;
    END LOOP;
END $$;

-- Advanced cleanup - find and drop ANY remaining function with 'batch' in the name
DO $$
DECLARE
    func_record RECORD;
    drop_statement TEXT;
BEGIN
    -- Second pass - catch any remaining batch-related functions
    FOR func_record IN 
        SELECT 
            p.proname,
            pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE 
            n.nspname = 'public' 
            AND p.proname ILIKE '%batch%'
    LOOP
        BEGIN
            drop_statement := 'DROP FUNCTION ' || func_record.proname || '(' || func_record.args || ') CASCADE';
            EXECUTE drop_statement;
            RAISE NOTICE 'Cleanup pass 2 - Dropped: %(%)', func_record.proname, func_record.args;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Cleanup pass 2 - Could not drop %(%): %', func_record.proname, func_record.args, SQLERRM;
        END;
    END LOOP;
END $$;

-- ================================================================
-- 2. VERIFY CLEANUP
-- ================================================================

-- Check remaining functions
DO $$
DECLARE
    remaining_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO remaining_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname ILIKE '%batch%';
    
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'BATCH FUNCTION CLEANUP COMPLETED';
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'Remaining batch functions: %', remaining_count;
    
    IF remaining_count = 0 THEN
        RAISE NOTICE '✅ ALL batch functions successfully removed!';
    ELSE
        RAISE NOTICE '⚠️  Some batch functions may still exist';
    END IF;
    
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'Next step: Create new batch functions from scratch';
    RAISE NOTICE '================================================================';
END $$;

COMMIT;

-- ================================================================
-- COMPLETION MESSAGE
-- ================================================================

SELECT 
    'CLEANUP COMPLETE! All batch functions removed.' as status,
    'Ready to create new functions from scratch.' as next_step;