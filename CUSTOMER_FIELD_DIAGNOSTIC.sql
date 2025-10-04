-- ============================================
-- CUSTOMER FIELD MIGRATION FIX
-- ============================================
-- This will diagnose and fix customer field mismatches

-- 1. Check actual customer table structure
SELECT 'CUSTOMER TABLE STRUCTURE:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'customers' 
ORDER BY ordinal_position;

-- 2. Show sample customer data to see field names
SELECT 'SAMPLE CUSTOMER DATA:' as info;
SELECT * FROM customers LIMIT 2;

-- 3. Check sales customer fields
SELECT 'SALES CUSTOMER FIELDS:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sales' 
AND column_name LIKE '%customer%'
ORDER BY ordinal_position;

-- 4. If customers table uses 'name' instead of 'customer_name', let's see
-- First check if there's a mismatch
DO $$
DECLARE
    has_customer_name boolean := false;
    has_name boolean := false;
BEGIN
    -- Check if customer_name column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' AND column_name = 'customer_name'
    ) INTO has_customer_name;
    
    -- Check if name column exists  
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' AND column_name = 'name'
    ) INTO has_name;
    
    RAISE NOTICE 'CUSTOMER TABLE ANALYSIS:';
    RAISE NOTICE '  - Has customer_name field: %', has_customer_name;
    RAISE NOTICE '  - Has name field: %', has_name;
    
    IF has_name AND NOT has_customer_name THEN
        RAISE NOTICE '🔧 DETECTED: Customers table uses "name" field instead of "customer_name"';
        RAISE NOTICE '📝 RECOMMENDATION: Need to migrate CustomerService to use "name" field';
    END IF;
    
    IF has_customer_name THEN
        RAISE NOTICE '✅ GOOD: Customers table uses "customer_name" field as expected';
    END IF;
END
$$;

SELECT '🔍 CUSTOMER DIAGNOSTIC COMPLETE - CHECK THE NOTICES ABOVE!' as status;