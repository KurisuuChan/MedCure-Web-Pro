-- ============================================
-- SIMPLE DATABASE TEST FUNCTION
-- ============================================

-- Drop any existing test functions
DROP FUNCTION IF EXISTS test_pos_transaction();

-- Create a simple test function
CREATE OR REPLACE FUNCTION test_pos_transaction()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    -- Just test basic functionality
    result := jsonb_build_object(
        'success', true,
        'message', 'Database connection works!',
        'timestamp', NOW()
    );
    
    RETURN result;
END;
$$;

-- Test it
SELECT test_pos_transaction();

-- Now let's try to replicate the exact error by forcing it
-- This will help us understand what's happening
CREATE OR REPLACE FUNCTION debug_create_sale_with_items(
    sale_data JSONB,
    sale_items JSONB[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_sale_id UUID;
    result JSONB;
BEGIN
    -- Let's log what we're receiving
    RAISE NOTICE 'Received sale_data: %', sale_data;
    RAISE NOTICE 'Received sale_items: %', sale_items;
    
    -- Try to insert with minimal fields first
    INSERT INTO sales (
        user_id,
        total_amount,
        payment_method,
        status
    ) VALUES (
        (sale_data->>'user_id')::UUID,
        (sale_data->>'total_amount')::DECIMAL,
        sale_data->>'payment_method',
        'completed'
    ) RETURNING id INTO new_sale_id;
    
    RAISE NOTICE 'Sale created with ID: %', new_sale_id;
    
    result := jsonb_build_object(
        'success', true,
        'sale_id', new_sale_id,
        'message', 'Debug function worked!'
    );
    
    RETURN result;
END;
$$;

SELECT '✅ Debug functions created!' as message;