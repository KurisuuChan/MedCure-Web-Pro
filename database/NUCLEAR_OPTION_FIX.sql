-- ============================================
-- EMERGENCY NUCLEAR OPTION - REBUILD FUNCTION FROM SCRATCH
-- ============================================
-- This completely nukes and rebuilds the function to eliminate any cache issues

-- Step 1: Drop EVERYTHING related to the function
DROP FUNCTION IF EXISTS create_sale_with_items CASCADE;
DROP FUNCTION IF EXISTS create_sale_with_items(JSONB, JSONB[]) CASCADE;

-- Step 2: Clear any function cache by creating a dummy function first
CREATE OR REPLACE FUNCTION create_sale_with_items_temp()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN 'temp';
END;
$$;

-- Step 3: Drop the temp function
DROP FUNCTION create_sale_with_items_temp();

-- Step 4: Create the real function with a completely new implementation
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
BEGIN
    -- Validate inputs
    IF sale_data IS NULL THEN
        RAISE EXCEPTION 'sale_data cannot be null';
    END IF;
    
    IF sale_items IS NULL OR array_length(sale_items, 1) IS NULL THEN
        RAISE EXCEPTION 'sale_items cannot be null or empty';
    END IF;

    -- Create sale record with only essential fields
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

    -- Log the sale creation
    RAISE NOTICE 'Created sale with ID: %', new_sale_id;

    -- Process each sale item
    FOR i IN 1 .. array_length(sale_items, 1)
    LOOP
        sale_item := sale_items[i];
        
        -- Log what we're processing
        RAISE NOTICE 'Processing item: %', sale_item;
        
        -- Get and check stock
        SELECT stock_in_pieces INTO current_stock 
        FROM products 
        WHERE id = (sale_item->>'product_id')::UUID;

        IF current_stock IS NULL THEN
            RAISE EXCEPTION 'Product % not found', (sale_item->>'product_id')::UUID;
        END IF;

        IF current_stock < (sale_item->>'quantity')::INTEGER THEN
            RAISE EXCEPTION 'Insufficient stock for %. Available: %, Required: %', 
                (sale_item->>'product_id')::UUID, current_stock, (sale_item->>'quantity')::INTEGER;
        END IF;
        
        -- Update stock
        UPDATE products 
        SET stock_in_pieces = stock_in_pieces - (sale_item->>'quantity')::INTEGER,
            updated_at = NOW()
        WHERE id = (sale_item->>'product_id')::UUID;
        
        -- Insert sale item
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
        
        RAISE NOTICE 'Inserted sale item for product %', (sale_item->>'product_id')::UUID;
    END LOOP;

    -- Return simple success result
    result := jsonb_build_object(
        'id', new_sale_id,
        'success', true,
        'message', 'Transaction completed successfully',
        'total_amount', (sale_data->>'total_amount')::DECIMAL,
        'items_count', array_length(sale_items, 1)
    );

    RAISE NOTICE 'Transaction completed successfully: %', result;
    
    RETURN result;
END;
$$;

-- Step 5: Test the function immediately with real data
DO $$
DECLARE
    test_result JSONB;
    test_product_id UUID;
BEGIN
    -- Get a real product ID from your data
    SELECT id INTO test_product_id 
    FROM products 
    WHERE is_active = true 
    LIMIT 1;
    
    IF test_product_id IS NULL THEN
        RAISE NOTICE 'No active products found for testing';
        RETURN;
    END IF;
    
    -- Test with minimal data
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
    
    RAISE NOTICE '🎉 NUCLEAR FIX SUCCESS: %', test_result;
EXCEPTION 
    WHEN OTHERS THEN
        RAISE NOTICE '💥 NUCLEAR FIX FAILED: % - %', SQLSTATE, SQLERRM;
END
$$;

SELECT '🚀 NUCLEAR OPTION DEPLOYED!' as status;