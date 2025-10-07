-- =============================================================================
-- FIX POS STOCK DEDUCTION
-- =============================================================================
-- Purpose: Update create_sale_with_items function to properly deduct stock
-- Issue: Sales are completing but stock is not being deducted
-- Solution: Add stock validation and deduction to the transaction function
-- =============================================================================

-- Drop existing function
DROP FUNCTION IF EXISTS public.create_sale_with_items(jsonb, jsonb[]);

-- Create updated function with stock deduction
CREATE OR REPLACE FUNCTION public.create_sale_with_items(sale_data jsonb, sale_items jsonb[])
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    sale_id UUID;
    customer_id_result UUID;
    item_data jsonb;
    current_stock INTEGER;
    item_quantity INTEGER;
    product_name TEXT;
    result jsonb;
BEGIN
    -- Log function start
    RAISE NOTICE 'Starting create_sale_with_items with % items', array_length(sale_items, 1);

    -- Validate stock FIRST before creating any records
    FOR item_data IN SELECT unnest(sale_items)
    LOOP
        -- Get current stock and product name
        SELECT stock_in_pieces, COALESCE(brand_name, generic_name) 
        INTO current_stock, product_name
        FROM public.products 
        WHERE id = (item_data->>'product_id')::UUID;

        IF current_stock IS NULL THEN
            RAISE EXCEPTION 'Product with ID % not found', (item_data->>'product_id')::UUID;
        END IF;

        item_quantity := (item_data->>'quantity_in_pieces')::INTEGER;
        
        IF current_stock < item_quantity THEN
            RAISE EXCEPTION 'Insufficient stock for %. Available: %, Required: %', 
                product_name, current_stock, item_quantity;
        END IF;
        
        RAISE NOTICE 'Stock check passed for %: % - % = %', 
            product_name, current_stock, item_quantity, (current_stock - item_quantity);
    END LOOP;

    -- All stock checks passed, now create the sale
    INSERT INTO public.sales (
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
        pwd_senior_holder_name,
        status,
        completed_at,
        created_at,
        updated_at
    ) VALUES (
        CASE 
            WHEN sale_data->>'user_id' IS NOT NULL 
            THEN (sale_data->>'user_id')::UUID 
            ELSE NULL 
        END,
        (sale_data->>'total_amount')::DECIMAL,
        sale_data->>'payment_method',
        CASE 
            WHEN sale_data->>'customer_id' IS NOT NULL 
            THEN (sale_data->>'customer_id')::UUID 
            ELSE NULL 
        END,
        sale_data->>'customer_name',
        sale_data->>'customer_phone',
        sale_data->>'customer_email',
        sale_data->>'customer_address',
        COALESCE(sale_data->>'customer_type', 'guest'),
        sale_data->>'notes',
        COALESCE(sale_data->>'discount_type', 'none'),
        COALESCE((sale_data->>'discount_percentage')::DECIMAL, 0),
        COALESCE((sale_data->>'discount_amount')::DECIMAL, 0),
        COALESCE((sale_data->>'subtotal_before_discount')::DECIMAL, 0),
        sale_data->>'pwd_senior_id',
        sale_data->>'pwd_senior_holder_name',
        COALESCE(sale_data->>'status', 'completed'),
        COALESCE((sale_data->>'completed_at')::TIMESTAMP WITH TIME ZONE, NOW()),
        NOW(),
        NOW()
    ) RETURNING id INTO sale_id;

    -- Get customer_id for the result
    SELECT customer_id INTO customer_id_result FROM public.sales WHERE id = sale_id;

    -- Insert sale items AND deduct stock
    FOR item_data IN SELECT unnest(sale_items)
    LOOP
        item_quantity := (item_data->>'quantity_in_pieces')::INTEGER;
        
        -- Insert sale item
        INSERT INTO public.sale_items (
            sale_id,
            product_id,
            quantity,
            unit_type,
            unit_price,
            total_price,
            created_at,
            updated_at
        ) VALUES (
            sale_id,
            (item_data->>'product_id')::UUID,
            item_quantity,
            item_data->>'unit_type',
            (item_data->>'price_per_unit')::DECIMAL,
            (item_data->>'total_price')::DECIMAL,
            NOW(),
            NOW()
        );

        -- DEDUCT STOCK - This is the critical fix!
        UPDATE public.products 
        SET 
            stock_in_pieces = stock_in_pieces - item_quantity,
            updated_at = NOW()
        WHERE id = (item_data->>'product_id')::UUID;

        -- Log the stock update
        SELECT stock_in_pieces, COALESCE(brand_name, generic_name) 
        INTO current_stock, product_name
        FROM public.products 
        WHERE id = (item_data->>'product_id')::UUID;
        
        RAISE NOTICE 'Stock updated for %: new stock level = %', product_name, current_stock;
    END LOOP;

    -- Build and return result
    SELECT jsonb_build_object(
        'sale_id', sale_id,
        'customer_id', customer_id_result,
        'customer_name', s.customer_name,
        'customer_phone', s.customer_phone,
        'customer_email', s.customer_email,
        'customer_address', s.customer_address,
        'customer_type', s.customer_type,
        'total_amount', s.total_amount,
        'payment_method', s.payment_method,
        'discount_type', s.discount_type,
        'discount_percentage', s.discount_percentage,
        'discount_amount', s.discount_amount,
        'subtotal_before_discount', s.subtotal_before_discount,
        'pwd_senior_id', s.pwd_senior_id,
        'pwd_senior_holder_name', s.pwd_senior_holder_name,
        'status', s.status,
        'completed_at', s.completed_at,
        'created_at', s.created_at
    ) INTO result
    FROM public.sales s
    WHERE s.id = sale_id;

    RAISE NOTICE 'Sale completed successfully with ID: %', sale_id;
    RETURN result;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error creating sale: %', SQLERRM;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_sale_with_items(jsonb, jsonb[]) TO authenticated;

-- Test function exists
SELECT 'create_sale_with_items function updated with stock deduction!' AS status;

-- Verify function was created
SELECT 
    routine_name, 
    routine_type,
    specific_name,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_name = 'create_sale_with_items' 
AND routine_schema = 'public';

-- Verify function parameters
SELECT 
    p.parameter_name,
    p.data_type,
    p.parameter_mode
FROM information_schema.parameters p
WHERE p.specific_name IN (
    SELECT specific_name 
    FROM information_schema.routines 
    WHERE routine_name = 'create_sale_with_items' 
    AND routine_schema = 'public'
)
ORDER BY p.ordinal_position;

-- =============================================================================
-- VERIFICATION QUERY
-- =============================================================================
-- Run this to verify the function was created correctly:
-- SELECT routine_name, routine_type 
-- FROM information_schema.routines 
-- WHERE routine_name = 'create_sale_with_items' 
-- AND routine_schema = 'public';
-- =============================================================================