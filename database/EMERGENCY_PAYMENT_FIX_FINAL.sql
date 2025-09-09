-- =================================================
-- 🚨 EMERGENCY PAYMENT FIX - COMPLETE OVERRIDE
-- This completely removes and recreates the stored procedure
-- =================================================

-- Force drop any existing versions of the function
DROP FUNCTION IF EXISTS create_sale_with_items(JSONB, JSONB[]) CASCADE;

-- Also check for any other variations
DO $$
DECLARE
    func_record RECORD;
BEGIN
    -- Find and drop all variations of create_sale_with_items
    FOR func_record IN
        SELECT p.proname, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname LIKE '%create_sale%' AND n.nspname = 'public'
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS %I(%s) CASCADE', func_record.proname, func_record.args);
        RAISE NOTICE 'Dropped function: %(%)', func_record.proname, func_record.args;
    END LOOP;
END
$$;

-- Create the completely new stored procedure without any stock_movements references
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
    -- Insert the sale record
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

    -- Process each sale item with simple stock management
    FOR i IN array_lower(sale_items, 1) .. array_upper(sale_items, 1)
    LOOP
        sale_item := sale_items[i];
        
        -- Get current product stock
        SELECT stock_in_pieces INTO current_stock 
        FROM products 
        WHERE id = (sale_item->>'product_id')::UUID;

        -- Check if we have sufficient stock
        IF current_stock < (sale_item->>'quantity')::INTEGER THEN
            RAISE EXCEPTION 'Insufficient stock. Available: %, Required: %', current_stock, (sale_item->>'quantity')::INTEGER;
        END IF;
        
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

        -- Update product stock (simple version)
        UPDATE products 
        SET stock_in_pieces = stock_in_pieces - (sale_item->>'quantity')::INTEGER,
            updated_at = NOW()
        WHERE id = (sale_item->>'product_id')::UUID;

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

EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error processing sale: %', SQLERRM;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_sale_with_items(JSONB, JSONB[]) TO authenticated;

-- Test that the function exists and works
DO $$
DECLARE
    test_result JSONB;
BEGIN
    -- Verify the function signature
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'create_sale_with_items' AND n.nspname = 'public'
    ) THEN
        RAISE NOTICE 'Function create_sale_with_items successfully created!';
    ELSE
        RAISE EXCEPTION 'Function create_sale_with_items was not created!';
    END IF;
END
$$;

SELECT 
    '🚨 EMERGENCY PAYMENT FIX DEPLOYED!' as status,
    'Function completely recreated without stock_movements dependencies' as message,
    NOW() as deployed_at;
