-- ============================================
-- ULTRA SIMPLE FIX - MATCHING YOUR EXACT SCHEMA
-- ============================================
-- Execute this to create a function that matches your exact table structure

-- Drop the existing function
DROP FUNCTION IF EXISTS create_sale_with_items(JSONB, JSONB[]);

-- Create a simplified function based on the minimal required fields
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
BEGIN
    -- Insert the sale record with only the essential fields
    INSERT INTO sales (
        user_id,
        total_amount,
        payment_method,
        customer_name,
        customer_phone,
        customer_type,
        status,
        created_at,
        updated_at
    ) VALUES (
        (sale_data->>'user_id')::UUID,
        (sale_data->>'total_amount')::DECIMAL,
        sale_data->>'payment_method',
        COALESCE(sale_data->>'customer_name', 'Walk-in Customer'),
        sale_data->>'customer_phone',
        COALESCE(sale_data->>'customer_type', 'guest'),
        'completed',
        NOW(),
        NOW()
    ) RETURNING id INTO new_sale_id;

    -- Process each sale item
    FOR i IN array_lower(sale_items, 1) .. array_upper(sale_items, 1)
    LOOP
        sale_item := sale_items[i];
        
        -- Check stock availability
        SELECT stock_in_pieces INTO current_stock 
        FROM products 
        WHERE id = (sale_item->>'product_id')::UUID;

        IF current_stock IS NULL THEN
            RAISE EXCEPTION 'Product not found: %', (sale_item->>'product_id')::UUID;
        END IF;

        IF current_stock < (sale_item->>'quantity')::INTEGER THEN
            RAISE EXCEPTION 'Insufficient stock for product %. Available: %, Required: %', 
                (sale_item->>'product_id')::UUID, current_stock, (sale_item->>'quantity')::INTEGER;
        END IF;
        
        -- Deduct stock
        UPDATE products 
        SET stock_in_pieces = stock_in_pieces - (sale_item->>'quantity')::INTEGER,
            updated_at = NOW()
        WHERE id = (sale_item->>'product_id')::UUID;
        
        -- Insert sale item with minimal fields
        INSERT INTO sale_items (
            sale_id,
            product_id,
            quantity,
            unit_price,
            total_price
        ) VALUES (
            new_sale_id,
            (sale_item->>'product_id')::UUID,
            (sale_item->>'quantity')::INTEGER,
            (sale_item->>'unit_price')::DECIMAL,
            (sale_item->>'total_price')::DECIMAL
        );
    END LOOP;

    -- Return simple result
    SELECT jsonb_build_object(
        'id', s.id,
        'user_id', s.user_id,
        'total_amount', s.total_amount,
        'payment_method', s.payment_method,
        'customer_name', s.customer_name,
        'customer_phone', s.customer_phone,
        'customer_type', s.customer_type,
        'status', s.status,
        'created_at', s.created_at,
        'updated_at', s.updated_at
    ) INTO result
    FROM sales s
    WHERE s.id = new_sale_id;

    RETURN result;
END;
$$;

-- Test the function
SELECT '✅ SIMPLIFIED POS Transaction function created!' as message;

-- Verify function exists
SELECT 
    routine_name,
    routine_type,
    external_language
FROM information_schema.routines 
WHERE routine_name = 'create_sale_with_items' 
    AND routine_schema = 'public';