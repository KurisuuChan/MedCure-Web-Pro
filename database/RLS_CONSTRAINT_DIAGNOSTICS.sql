-- ================================================================
-- COMPREHENSIVE RLS AND CONSTRAINT DIAGNOSTICS
-- ================================================================
-- Run this in Supabase SQL Editor to identify what's blocking transaction updates

-- 1. Check if RLS is enabled on sales table
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'sales' AND schemaname = 'public';

-- 2. List all RLS policies on sales table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'sales' AND schemaname = 'public';

-- 3. Check current user and roles
SELECT current_user, current_setting('role');

-- 4. List all constraints on sales table
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    tc.table_name,
    kcu.column_name,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'sales' 
    AND tc.table_schema = 'public'
ORDER BY tc.constraint_type, tc.constraint_name;

-- 5. Check triggers on sales table
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing,
    action_orientation
FROM information_schema.triggers 
WHERE event_object_table = 'sales' 
    AND trigger_schema = 'public';

-- 6. Test current user permissions on sales table
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'sales' 
    AND table_schema = 'public'
    AND grantee = current_user;

-- 7. Check if there are any views or rules that might interfere
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE schemaname = 'public' 
    AND definition LIKE '%sales%';

-- 8. Test a simple update to see exact error
-- Note: This will fail but show us the exact error message
DO $$
DECLARE
    test_id uuid;
    current_total numeric;
    test_total numeric;
BEGIN
    -- Get a sample transaction ID
    SELECT id, total_amount INTO test_id, current_total 
    FROM sales 
    WHERE status = 'completed' 
    LIMIT 1;
    
    IF test_id IS NOT NULL THEN
        test_total := current_total + 0.01;
        
        RAISE NOTICE 'Testing update on transaction: %', test_id;
        RAISE NOTICE 'Current total: %, Test total: %', current_total, test_total;
        
        -- Attempt the update
        UPDATE sales 
        SET total_amount = test_total,
            updated_at = NOW()
        WHERE id = test_id;
        
        -- Check if it worked
        SELECT total_amount INTO current_total FROM sales WHERE id = test_id;
        
        IF current_total = test_total THEN
            RAISE NOTICE 'SUCCESS: Update worked! New total: %', current_total;
            -- Restore original value
            UPDATE sales SET total_amount = current_total - 0.01 WHERE id = test_id;
        ELSE
            RAISE NOTICE 'FAILED: Update did not work. Expected: %, Got: %', test_total, current_total;
        END IF;
    ELSE
        RAISE NOTICE 'No completed transactions found for testing';
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERROR during update test: % - %', SQLSTATE, SQLERRM;
END $$;

-- 9. Check auth.users relationship and foreign key constraints
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'sales'
    AND tc.table_schema = 'public';

-- 10. Check if there are any problematic audit triggers
SELECT 
    p.proname as function_name,
    p.prosrc as function_source
FROM pg_proc p
JOIN pg_trigger t ON t.tgfoid = p.oid
WHERE t.tgrelid = (SELECT oid FROM pg_class WHERE relname = 'sales');

-- Final summary message
SELECT 'Diagnostics complete. Check the output above for RLS policies, constraints, and permissions.' as summary;