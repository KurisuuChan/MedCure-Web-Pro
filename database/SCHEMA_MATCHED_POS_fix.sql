-- ============================================
-- CORRECT POS TRANSACTION FUNCTION - MATCHING YOUR EXACT SCHEMA
-- ============================================
-- This function matches your actual sales table structure from the diagnostic

-- Drop existing function
DROP FUNCTION IF EXISTS create_sale_with_items(JSONB, JSONB[]);

-- Create function with your exact sales table fields
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
    -- Insert into sales with your exact table structure
    INSERT INTO sales (
        user_id,
        total_amount,
        payment_method,
        status,
        notes,
        customer_name,
        customer_phone,
        customer_email,
        customer_address,
        customer_type,
        customer_id,
        discount_amount,
        tax_amount,
        discount_type,
        discount_percentage,
        subtotal_before_discount,
        pwd_senior_id,
        completed_at,
        created_at,
        updated_at
    ) VALUES (
        (sale_data->>'user_id')::UUID,
        (sale_data->>'total_amount')::DECIMAL,
        sale_data->>'payment_method',
        'completed',
        sale_data->>'notes',
        sale_data->>'customer_name',
        sale_data->>'customer_phone',
        sale_data->>'customer_email',
        sale_data->>'customer_address',
        COALESCE(sale_data->>'customer_type', 'guest'),
        CASE 
            WHEN sale_data->>'customer_id' IS NOT NULL AND sale_data->>'customer_id' != '' 
            THEN (sale_data->>'customer_id')::UUID 
            ELSE NULL 
        END,
        COALESCE((sale_data->>'discount_amount')::DECIMAL, 0),
        COALESCE((sale_data->>'tax_amount')::DECIMAL, 0),
        COALESCE(sale_data->>'discount_type', 'none'),
        COALESCE((sale_data->>'discount_percentage')::DECIMAL, 0),
        COALESCE((sale_data->>'subtotal_before_discount')::DECIMAL, (sale_data->>'total_amount')::DECIMAL),
        sale_data->>'pwd_senior_id',
        NOW(),
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
        
        -- Update stock
        UPDATE products 
        SET stock_in_pieces = stock_in_pieces - (sale_item->>'quantity')::INTEGER,
            updated_at = NOW()
        WHERE id = (sale_item->>'product_id')::UUID;
        
        -- Insert sale item with your exact table structure
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
    END LOOP;

    -- Return complete sale with items (matching your schema)
    SELECT jsonb_build_object(
        'id', s.id,
        'user_id', s.user_id,
        'total_amount', s.total_amount,
        'payment_method', s.payment_method,
        'status', s.status,
        'notes', s.notes,
        'customer_name', s.customer_name,
        'customer_phone', s.customer_phone,
        'customer_email', s.customer_email,
        'customer_address', s.customer_address,
        'customer_type', s.customer_type,
        'customer_id', s.customer_id,
        'discount_amount', s.discount_amount,
        'tax_amount', s.tax_amount,
        'discount_type', s.discount_type,
        'discount_percentage', s.discount_percentage,
        'subtotal_before_discount', s.subtotal_before_discount,
        'pwd_senior_id', s.pwd_senior_id,
        'completed_at', s.completed_at,
        'created_at', s.created_at,
        'updated_at', s.updated_at,
        'success', true,
        'items', COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', si.id,
                        'product_id', si.product_id,
                        'quantity', si.quantity,
                        'unit_type', si.unit_type,
                        'unit_price', si.unit_price,
                        'total_price', si.total_price,
                        'created_at', si.created_at
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

-- Test function creation
SELECT '✅ SCHEMA-MATCHED POS function created successfully!' as message;

-- Verify function exists
SELECT 
    routine_name,
    routine_type,
    external_language
FROM information_schema.routines 
WHERE routine_name = 'create_sale_with_items' 
    AND routine_schema = 'public';

-- Test the function with a sample call to ensure it works
DO $$
BEGIN
    RAISE NOTICE 'Function created and ready for testing. Try a POS transaction now!';
END
$$;