-- =================================================
-- 🔥 EMERGENCY FIX FOR PAYMENT PROCESSING
-- This completely replaces the problematic stored procedure
-- =================================================

-- Drop and recreate the stored procedure to ensure no old references exist
DROP FUNCTION IF EXISTS create_sale_with_items(JSONB, JSONB[]);

-- Create the corrected stored procedure
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
    -- Insert the sale record with discount support
    INSERT INTO sales (
        user_id,
        total_amount,
        payment_method,
        customer_name,
        customer_phone,
        notes,
        discount_type,
        discount_percentage,
        discount_amount,
        subtotal_before_discount,
        pwd_senior_id,
        status
    ) VALUES (
        (sale_data->>'user_id')::UUID,
        (sale_data->>'total_amount')::DECIMAL,
        sale_data->>'payment_method',
        sale_data->>'customer_name',
        sale_data->>'customer_phone',
        sale_data->>'notes',
        COALESCE(sale_data->>'discount_type', 'none'),
        COALESCE((sale_data->>'discount_percentage')::DECIMAL, 0),
        COALESCE((sale_data->>'discount_amount')::DECIMAL, 0),
        COALESCE((sale_data->>'subtotal_before_discount')::DECIMAL, (sale_data->>'total_amount')::DECIMAL),
        sale_data->>'pwd_senior_id',
        'completed'
    ) RETURNING id INTO new_sale_id;

    -- Insert sale items and update stock
    FOR i IN array_lower(sale_items, 1) .. array_upper(sale_items, 1)
    LOOP
        sale_item := sale_items[i];
        
        -- Insert sale item
        INSERT INTO sale_items (
            sale_id,
            product_id,
            quantity,
            unit_type,
            unit_price,
            total_price
        ) VALUES (
            new_sale_id,
            (sale_item->>'product_id')::UUID,
            (sale_item->>'quantity')::INTEGER,
            sale_item->>'unit_type',
            (sale_item->>'unit_price')::DECIMAL,
            (sale_item->>'total_price')::DECIMAL
        );

        -- Get current product stock
        SELECT stock_in_pieces INTO current_stock FROM products 
        WHERE id = (sale_item->>'product_id')::UUID;

        -- Update product stock
        UPDATE products 
        SET stock_in_pieces = stock_in_pieces - (sale_item->>'quantity')::INTEGER,
            updated_at = NOW()
        WHERE id = (sale_item->>'product_id')::UUID;

        -- Insert stock movement record with CORRECT column names
        INSERT INTO stock_movements (
            product_id,
            user_id,
            movement_type,
            quantity,
            reason,
            reference_id,
            reference_type,
            stock_before,
            stock_after
        ) VALUES (
            (sale_item->>'product_id')::UUID,
            (sale_data->>'user_id')::UUID,
            'out',
            -(sale_item->>'quantity')::INTEGER,  -- Negative for outgoing stock
            'Sale transaction',
            new_sale_id,
            'sale',
            COALESCE(current_stock, 0),
            COALESCE(current_stock, 0) - (sale_item->>'quantity')::INTEGER
        );

    END LOOP;

    -- Return the complete sale with items
    SELECT jsonb_build_object(
        'id', s.id,
        'user_id', s.user_id,
        'total_amount', s.total_amount,
        'payment_method', s.payment_method,
        'customer_name', s.customer_name,
        'customer_phone', s.customer_phone,
        'notes', s.notes,
        'discount_type', s.discount_type,
        'discount_percentage', s.discount_percentage,
        'discount_amount', s.discount_amount,
        'subtotal_before_discount', s.subtotal_before_discount,
        'pwd_senior_id', s.pwd_senior_id,
        'status', s.status,
        'created_at', s.created_at,
        'updated_at', s.updated_at,
        'items', COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', si.id,
                        'product_id', si.product_id,
                        'quantity', si.quantity,
                        'unit_type', si.unit_type,
                        'unit_price', si.unit_price,
                        'total_price', si.total_price
                    )
                )
                FROM sale_items si
                WHERE si.sale_id = s.id
            ),
            '[]'::jsonb
        )
    ) INTO result
    FROM sales s
    WHERE s.id = new_sale_id;

    RETURN result;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_sale_with_items(JSONB, JSONB[]) TO authenticated;

-- Verification
SELECT 'Emergency stored procedure fix deployed! Payment should work now.' as status;
