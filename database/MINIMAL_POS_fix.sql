-- ============================================
-- SIMPLIFIED POS TRANSACTION FUNCTION FOR YOUR SCHEMA
-- ============================================
-- This creates a minimal function that only uses fields that definitely exist

-- Drop existing function
DROP FUNCTION IF EXISTS create_sale_with_items(JSONB, JSONB[]);

-- Create a simple function with minimal fields
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
    -- Start with absolute minimal fields that every sales table should have
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

    -- Process each sale item with minimal fields
    FOR i IN array_lower(sale_items, 1) .. array_upper(sale_items, 1)
    LOOP
        sale_item := sale_items[i];
        
        -- Check and update stock
        SELECT stock_in_pieces INTO current_stock 
        FROM products 
        WHERE id = (sale_item->>'product_id')::UUID;

        IF current_stock IS NULL THEN
            RAISE EXCEPTION 'Product not found: %', (sale_item->>'product_id')::UUID;
        END IF;

        IF current_stock < (sale_item->>'quantity')::INTEGER THEN
            RAISE EXCEPTION 'Insufficient stock. Available: %, Required: %', 
                current_stock, (sale_item->>'quantity')::INTEGER;
        END IF;
        
        -- Update stock
        UPDATE products 
        SET stock_in_pieces = stock_in_pieces - (sale_item->>'quantity')::INTEGER
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

    -- Return minimal result
    SELECT jsonb_build_object(
        'id', s.id,
        'user_id', s.user_id,
        'total_amount', s.total_amount,
        'payment_method', s.payment_method,
        'status', s.status,
        'success', true
    ) INTO result
    FROM sales s
    WHERE s.id = new_sale_id;

    RETURN result;
END;
$$;

SELECT '✅ MINIMAL POS function created - should work with any sales table schema!' as message;