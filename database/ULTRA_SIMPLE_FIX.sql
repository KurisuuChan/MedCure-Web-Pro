-- ============================================
-- ULTRA SIMPLE REPLACEMENT FUNCTION
-- ============================================
-- This completely replaces the old function with absolute minimal dependencies

-- First, completely DROP the old function to clear any cache
DROP FUNCTION IF EXISTS create_sale_with_items(JSONB, JSONB[]) CASCADE;

-- Create the simplest possible working function
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
    -- Insert sale with ONLY the required fields
    INSERT INTO sales (user_id, total_amount, payment_method, status, created_at)
    VALUES (
        (sale_data->>'user_id')::UUID,
        (sale_data->>'total_amount')::DECIMAL,
        sale_data->>'payment_method',
        'completed',
        NOW()
    ) RETURNING id INTO new_sale_id;

    -- Process sale items if any
    IF sale_items IS NOT NULL AND array_length(sale_items, 1) > 0 THEN
        FOR i IN 1 .. array_length(sale_items, 1) LOOP
            sale_item := sale_items[i];
            
            -- Get current stock
            SELECT stock_in_pieces INTO current_stock 
            FROM products 
            WHERE id = (sale_item->>'product_id')::UUID;

            -- Check stock
            IF current_stock IS NULL THEN
                RAISE EXCEPTION 'Product not found';
            END IF;

            IF current_stock < (sale_item->>'quantity')::INTEGER THEN
                RAISE EXCEPTION 'Insufficient stock';
            END IF;
            
            -- Update stock
            UPDATE products 
            SET stock_in_pieces = stock_in_pieces - (sale_item->>'quantity')::INTEGER
            WHERE id = (sale_item->>'product_id')::UUID;
            
            -- Insert sale item
            INSERT INTO sale_items (sale_id, product_id, quantity, unit_type, unit_price, total_price)
            VALUES (
                new_sale_id,
                (sale_item->>'product_id')::UUID,
                (sale_item->>'quantity')::INTEGER,
                COALESCE(sale_item->>'unit_type', 'piece'),
                (sale_item->>'unit_price')::DECIMAL,
                (sale_item->>'total_price')::DECIMAL
            );
        END LOOP;
    END IF;

    -- Return simple success result
    result := jsonb_build_object(
        'id', new_sale_id,
        'success', true,
        'message', 'Transaction completed'
    );

    RETURN result;
END;
$$;

-- Test the function immediately
DO $$
DECLARE
    test_result JSONB;
BEGIN
    SELECT create_sale_with_items(
        '{"user_id": "b9b31a83-66fd-46e5-b4be-3386c4988f48", "total_amount": 1.0, "payment_method": "cash"}'::jsonb,
        ARRAY['{"product_id": "e8c296fa-f79d-4d7b-bcca-d57b0bef0d99", "quantity": 1, "unit_price": 1.0, "total_price": 1.0}'::jsonb]
    ) INTO test_result;
    
    RAISE NOTICE '✅ ULTRA SIMPLE FUNCTION TEST SUCCESS: %', test_result;
EXCEPTION 
    WHEN OTHERS THEN
        RAISE NOTICE '❌ ULTRA SIMPLE FUNCTION TEST FAILED: % - %', SQLSTATE, SQLERRM;
END
$$;

SELECT '🚀 Ultra simple function deployed and tested!' as status;