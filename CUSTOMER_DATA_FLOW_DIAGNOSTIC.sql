-- ============================================
-- CUSTOMER DATA FLOW DIAGNOSTIC
-- ============================================
-- Check if customers are being created and linked properly

-- 1. First, let's see what columns actually exist in customers table
SELECT 
    'CUSTOMERS TABLE STRUCTURE:' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'customers' 
ORDER BY ordinal_position;

-- 2. Check recent customer creation attempts (using actual column names)
SELECT 
    'RECENT CUSTOMERS:' as info,
    id,
    customer_name,
    phone,
    email,
    created_at
FROM customers 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Check recent sales with customer data
SELECT 
    'RECENT SALES WITH CUSTOMER DATA:' as info,
    id,
    customer_id,
    customer_name,
    customer_phone,
    total_amount,
    created_at
FROM sales 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. Check if customer_ids are being linked properly
SELECT 
    'CUSTOMER ID LINKAGE CHECK:' as info,
    s.id as sale_id,
    s.customer_id,
    s.customer_name as sale_customer_name,
    c.id as customer_table_id,
    c.customer_name as customer_table_name,
    c.phone as customer_table_phone
FROM sales s
LEFT JOIN customers c ON s.customer_id = c.id
WHERE s.created_at > NOW() - INTERVAL '1 day'
ORDER BY s.created_at DESC
LIMIT 5;

-- 5. Test customer creation manually
DO $$
DECLARE
    test_customer_id UUID;
    existing_count INTEGER;
BEGIN
    -- Check if test customer already exists
    SELECT COUNT(*) INTO existing_count
    FROM customers 
    WHERE phone = '1234567890';
    
    IF existing_count = 0 THEN
        -- Create test customer
        INSERT INTO customers (customer_name, phone, email, is_active)
        VALUES ('Test Customer', '1234567890', 'test@example.com', true)
        RETURNING id INTO test_customer_id;
        
        RAISE NOTICE '✅ Test customer created with ID: %', test_customer_id;
    ELSE
        RAISE NOTICE '📋 Test customer already exists';
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Error creating test customer: % - %', SQLSTATE, SQLERRM;
END
$$;

SELECT '🔍 CUSTOMER DATA FLOW DIAGNOSTIC COMPLETE' as status;