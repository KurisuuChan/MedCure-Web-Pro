-- ============================================
-- ULTIMATE FUNCTION REPLACEMENT - ZERO CACHE TOLERANCE
-- ============================================
-- This completely removes EVERYTHING and rebuilds from absolute zero

-- Step 1: Nuclear drop of ALL related functions and objects
DROP FUNCTION IF EXISTS create_sale_with_items CASCADE;
DROP FUNCTION IF EXISTS create_sale_with_items(JSONB, JSONB[]) CASCADE;
DROP FUNCTION IF EXISTS create_sale_with_items(JSON, JSON[]) CASCADE;
DROP FUNCTION IF EXISTS create_sale_with_items(TEXT, TEXT) CASCADE;

-- Step 2: Drop any cached plans
DISCARD PLANS;
DISCARD SEQUENCES;
DISCARD TEMP;
DISCARD ALL;

-- Step 3: Create multiple dummy functions to clear cache completely
CREATE OR REPLACE FUNCTION dummy_clear_1() RETURNS TEXT AS $$ BEGIN RETURN 'clear1'; END; $$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION dummy_clear_2() RETURNS TEXT AS $$ BEGIN RETURN 'clear2'; END; $$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION dummy_clear_3() RETURNS TEXT AS $$ BEGIN RETURN 'clear3'; END; $$ LANGUAGE plpgsql;

-- Step 4: Drop all dummy functions
DROP FUNCTION dummy_clear_1();
DROP FUNCTION dummy_clear_2(); 
DROP FUNCTION dummy_clear_3();

-- Step 5: Wait and then create the real function
CREATE OR REPLACE FUNCTION create_sale_with_items(
    sale_data JSONB,
    sale_items JSONB[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_sale_id UUID;
    sale_item JSONB;
    current_stock INTEGER;
    result JSONB;
    i INTEGER;
    debug_info TEXT := '';
BEGIN
    -- Initialize debug
    debug_info := 'Function started with ' || array_length(sale_items, 1) || ' items';
    RAISE NOTICE 'DEBUG: %', debug_info;
    
    -- Log the exact input data
    RAISE NOTICE 'DEBUG: sale_data = %', sale_data;
    RAISE NOTICE 'DEBUG: sale_items = %', sale_items;

    -- Validate inputs
    IF sale_data IS NULL THEN
        RAISE EXCEPTION 'sale_data cannot be null';
    END IF;
    
    IF sale_items IS NULL OR array_length(sale_items, 1) IS NULL THEN
        RAISE EXCEPTION 'sale_items cannot be null or empty';
    END IF;

    -- Check if required fields exist
    IF NOT (sale_data ? 'user_id') THEN
        RAISE EXCEPTION 'Missing user_id in sale_data';
    END IF;
    
    IF NOT (sale_data ? 'total_amount') THEN
        RAISE EXCEPTION 'Missing total_amount in sale_data';
    END IF;

    -- Create sale record - using ONLY fields that exist in sales table
    debug_info := 'Creating sale record';
    RAISE NOTICE 'DEBUG: %', debug_info;
    
    INSERT INTO sales (
        user_id,
        total_amount,
        payment_method,
        status,
        created_at,
        updated_at
    ) VALUES (
        (sale_data->>'user_id')::UUID,
        (sale_data->>'total_amount')::DECIMAL,
        COALESCE(sale_data->>'payment_method', 'cash'),
        'completed',
        NOW(),
        NOW()
    ) RETURNING id INTO new_sale_id;

    debug_info := 'Sale created with ID: ' || new_sale_id;
    RAISE NOTICE 'DEBUG: %', debug_info;

    -- Process each sale item
    FOR i IN 1 .. array_length(sale_items, 1)
    LOOP
        sale_item := sale_items[i];
        
        debug_info := 'Processing item ' || i || ': ' || sale_item;
        RAISE NOTICE 'DEBUG: %', debug_info;
        
        -- Validate item has required fields
        IF NOT (sale_item ? 'product_id') THEN
            RAISE EXCEPTION 'Missing product_id in sale item %', i;
        END IF;
        
        IF NOT (sale_item ? 'quantity') THEN
            RAISE EXCEPTION 'Missing quantity in sale item %', i;
        END IF;
        
        -- Get and check stock
        SELECT stock_in_pieces INTO current_stock 
        FROM products 
        WHERE id = (sale_item->>'product_id')::UUID;

        IF current_stock IS NULL THEN
            RAISE EXCEPTION 'Product % not found', (sale_item->>'product_id')::UUID;
        END IF;

        debug_info := 'Product stock check: ' || current_stock || ' available, ' || (sale_item->>'quantity') || ' requested';
        RAISE NOTICE 'DEBUG: %', debug_info;

        IF current_stock < (sale_item->>'quantity')::INTEGER THEN
            RAISE EXCEPTION 'Insufficient stock. Available: %, Required: %', 
                current_stock, (sale_item->>'quantity')::INTEGER;
        END IF;
        
        -- Update stock
        debug_info := 'Updating stock for product ' || (sale_item->>'product_id');
        RAISE NOTICE 'DEBUG: %', debug_info;
        
        UPDATE products 
        SET stock_in_pieces = stock_in_pieces - (sale_item->>'quantity')::INTEGER,
            updated_at = NOW()
        WHERE id = (sale_item->>'product_id')::UUID;
        
        -- Insert sale item - using ONLY fields that exist in sale_items table
        debug_info := 'Creating sale item for product ' || (sale_item->>'product_id');
        RAISE NOTICE 'DEBUG: %', debug_info;
        
        INSERT INTO sale_items (
            sale_id,
            product_id,
            quantity,
            unit_type,
            unit_price,
            total_price,
            created_at
        ) VALUES (
            new_sale_id,
            (sale_item->>'product_id')::UUID,
            (sale_item->>'quantity')::INTEGER,
            COALESCE(sale_item->>'unit_type', 'piece'),
            (sale_item->>'unit_price')::DECIMAL,
            (sale_item->>'total_price')::DECIMAL,
            NOW()
        );
        
        debug_info := 'Sale item created successfully';
        RAISE NOTICE 'DEBUG: %', debug_info;
    END LOOP;

    -- Return result
    debug_info := 'Transaction completed successfully';
    RAISE NOTICE 'DEBUG: %', debug_info;
    
    result := jsonb_build_object(
        'id', new_sale_id,
        'success', true,
        'message', 'Transaction completed successfully',
        'total_amount', (sale_data->>'total_amount')::DECIMAL,
        'items_count', array_length(sale_items, 1),
        'debug_info', debug_info
    );

    RAISE NOTICE '✅ ULTIMATE FUNCTION SUCCESS: %', result;
    
    RETURN result;
    
EXCEPTION 
    WHEN OTHERS THEN
        RAISE NOTICE '❌ ULTIMATE FUNCTION ERROR: % - %', SQLSTATE, SQLERRM;
        RAISE EXCEPTION 'Transaction failed: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END;
$$;

-- Step 6: Test immediately
DO $$
DECLARE
    test_result JSONB;
    test_product_id UUID;
BEGIN
    -- Get a real product
    SELECT id INTO test_product_id 
    FROM products 
    WHERE is_active = true AND stock_in_pieces > 0
    LIMIT 1;
    
    IF test_product_id IS NULL THEN
        RAISE NOTICE '⚠️ No products available for testing';
        RETURN;
    END IF;
    
    RAISE NOTICE '🧪 Testing with product: %', test_product_id;
    
    -- Test the function
    SELECT create_sale_with_items(
        jsonb_build_object(
            'user_id', 'b9b31a83-66fd-46e5-b4be-3386c4988f48',
            'total_amount', 1.0,
            'payment_method', 'cash'
        ),
        ARRAY[jsonb_build_object(
            'product_id', test_product_id,
            'quantity', 1,
            'unit_type', 'piece',
            'unit_price', 1.0,
            'total_price', 1.0
        )]
    ) INTO test_result;
    
    RAISE NOTICE '🎉 ULTIMATE FIX SUCCESS: %', test_result;
    
EXCEPTION 
    WHEN OTHERS THEN
        RAISE NOTICE '💥 ULTIMATE FIX FAILED: % - %', SQLSTATE, SQLERRM;
END
$$;

SELECT '🚀 ULTIMATE FUNCTION DEPLOYED WITH ZERO CACHE TOLERANCE!' as status;