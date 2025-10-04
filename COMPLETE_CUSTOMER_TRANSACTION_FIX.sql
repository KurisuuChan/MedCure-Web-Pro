-- ============================================
-- UPDATE CREATE_SALE_WITH_ITEMS TO RETURN CUSTOMER DATA
-- ============================================
-- The function needs to return customer information for the frontend

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
    customer_info JSONB := '{}';
BEGIN
    -- Validate inputs
    IF sale_data IS NULL THEN
        RAISE EXCEPTION 'sale_data cannot be null';
    END IF;
    
    IF sale_items IS NULL OR array_length(sale_items, 1) IS NULL THEN
        RAISE EXCEPTION 'sale_items cannot be null or empty';
    END IF;

    -- Create sale record with customer data (always save customer info even for walk-ins)
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
        created_at,
        updated_at
    ) VALUES (
        (sale_data->>'user_id')::UUID,
        (sale_data->>'total_amount')::DECIMAL,
        COALESCE(sale_data->>'payment_method', 'cash'),
        CASE 
            WHEN sale_data->>'customer_id' != '' AND sale_data->>'customer_id' IS NOT NULL 
            THEN (sale_data->>'customer_id')::UUID 
            ELSE NULL 
        END,
        COALESCE(sale_data->>'customer_name', 'Walk-in Customer'), -- Always save customer name
        sale_data->>'customer_phone', -- Can be null for walk-ins
        sale_data->>'customer_email', -- Can be null
        sale_data->>'customer_address', -- Can be null
        COALESCE(sale_data->>'customer_type', 'guest'),
        sale_data->>'notes',
        COALESCE(sale_data->>'discount_type', 'none'),
        COALESCE((sale_data->>'discount_percentage')::DECIMAL, 0),
        COALESCE((sale_data->>'discount_amount')::DECIMAL, 0),
        COALESCE((sale_data->>'subtotal_before_discount')::DECIMAL, (sale_data->>'total_amount')::DECIMAL),
        sale_data->>'pwd_senior_id',
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

    -- Prepare customer info for return
    customer_info := jsonb_build_object(
        'customer_id', sale_data->>'customer_id',
        'customer_name', sale_data->>'customer_name',
        'customer_phone', sale_data->>'customer_phone',
        'customer_email', sale_data->>'customer_email',
        'customer_address', sale_data->>'customer_address',
        'customer_type', COALESCE(sale_data->>'customer_type', 'guest')
    );

    -- Return comprehensive result with customer data
    result := jsonb_build_object(
        'id', new_sale_id,
        'success', true,
        'message', 'Transaction completed successfully',
        'total_amount', (sale_data->>'total_amount')::DECIMAL,
        'items_count', array_length(sale_items, 1),
        'customer_id', sale_data->>'customer_id',
        'customer_name', sale_data->>'customer_name',
        'customer_phone', sale_data->>'customer_phone',
        'customer_data', customer_info
    );

    RAISE NOTICE 'Transaction completed successfully with customer data: %', result;
    
    RETURN result;
END;
$$;

-- Test the updated function
SELECT 'create_sale_with_items function updated to return customer data!' as status;