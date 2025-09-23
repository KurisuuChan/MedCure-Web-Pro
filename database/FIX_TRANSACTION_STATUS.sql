-- ============================================
-- FIX TRANSACTION STATUS - COMPLETE IMMEDIATELY
-- ============================================
-- This updates the create_sale_with_items function to complete transactions immediately
-- like your original POS system

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
    -- Insert the sale record with 'completed' status immediately
    INSERT INTO sales (
        user_id,
        total_amount,
        payment_method,
        customer_id,
        customer_name,
        customer_phone,
        customer_email,
        customer_address,
        customer_type,
        notes,
        discount_type,
        discount_percentage,
        discount_amount,
        subtotal_before_discount,
        pwd_senior_id,
        status,
        completed_at  -- Set completion time immediately
    ) VALUES (
        (sale_data->>'user_id')::UUID,
        (sale_data->>'total_amount')::DECIMAL,
        sale_data->>'payment_method',
        (sale_data->>'customer_id')::UUID,
        sale_data->>'customer_name',
        sale_data->>'customer_phone',
        sale_data->>'customer_email',
        sale_data->>'customer_address',
        COALESCE(sale_data->>'customer_type', 'guest'),
        sale_data->>'notes',
        COALESCE(sale_data->>'discount_type', 'none'),
        COALESCE((sale_data->>'discount_percentage')::DECIMAL, 0),
        COALESCE((sale_data->>'discount_amount')::DECIMAL, 0),
        COALESCE((sale_data->>'subtotal_before_discount')::DECIMAL, (sale_data->>'total_amount')::DECIMAL),
        sale_data->>'pwd_senior_id',
        'completed', -- ✅ CHANGED: Complete immediately like original POS
        NOW()        -- ✅ ADDED: Set completion timestamp
    ) RETURNING id INTO new_sale_id;

    -- Process each sale item AND deduct stock immediately
    FOR i IN array_lower(sale_items, 1) .. array_upper(sale_items, 1)
    LOOP
        sale_item := sale_items[i];
        
        -- Check stock availability
        SELECT stock_in_pieces INTO current_stock 
        FROM products 
        WHERE id = (sale_item->>'product_id')::UUID;

        IF current_stock < (sale_item->>'quantity')::INTEGER THEN
            RAISE EXCEPTION 'Insufficient stock for product %. Available: %, Required: %', 
                (sale_item->>'product_id')::UUID, current_stock, (sale_item->>'quantity')::INTEGER;
        END IF;
        
        -- ✅ ADDED: Deduct stock immediately (like original POS)
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
            total_price
        ) VALUES (
            new_sale_id,
            (sale_item->>'product_id')::UUID,
            (sale_item->>'quantity')::INTEGER,
            sale_item->>'unit_type',
            (sale_item->>'unit_price')::DECIMAL,
            (sale_item->>'total_price')::DECIMAL
        );
    END LOOP;

    -- Return the complete sale with items
    SELECT jsonb_build_object(
        'id', s.id,
        'user_id', s.user_id,
        'total_amount', s.total_amount,
        'payment_method', s.payment_method,
        'customer_id', s.customer_id,
        'customer_name', s.customer_name,
        'customer_phone', s.customer_phone,
        'customer_email', s.customer_email,
        'customer_address', s.customer_address,
        'customer_type', s.customer_type,
        'notes', s.notes,
        'discount_type', s.discount_type,
        'discount_percentage', s.discount_percentage,
        'discount_amount', s.discount_amount,
        'subtotal_before_discount', s.subtotal_before_discount,
        'pwd_senior_id', s.pwd_senior_id,
        'status', s.status,          -- Will now be 'completed'
        'completed_at', s.completed_at, -- Will have timestamp
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
            ), '[]'::jsonb
        )
    ) INTO result
    FROM sales s
    WHERE s.id = new_sale_id;

    RETURN result;
END;
$$;

-- Success message
SELECT '✅ TRANSACTION STATUS FIXED!' as message,
       'Your POS now completes transactions immediately like the original system' as info;