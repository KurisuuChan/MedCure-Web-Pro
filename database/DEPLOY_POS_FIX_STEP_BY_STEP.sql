-- =============================================================================
-- STEP-BY-STEP POS STOCK DEDUCTION FIX
-- =============================================================================
-- Run each step individually to troubleshoot any issues
-- =============================================================================

-- STEP 1: Check if function exists
SELECT 'STEP 1: Checking existing function...' as step;
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'create_sale_with_items' 
AND routine_schema = 'public';

-- STEP 2: Drop existing function (if exists)
SELECT 'STEP 2: Dropping existing function...' as step;
DROP FUNCTION IF EXISTS public.create_sale_with_items(jsonb, jsonb[]);
DROP FUNCTION IF EXISTS public.create_sale_with_items CASCADE;

-- STEP 3: Create the new function with correct parameters
SELECT 'STEP 3: Creating new function with stock deduction...' as step;

CREATE OR REPLACE FUNCTION public.create_sale_with_items(
    sale_data jsonb, 
    sale_items jsonb[]
)
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
    RAISE NOTICE 'POS Fix: Starting transaction with % items', array_length(sale_items, 1);

    -- Validate stock before creating sale
    FOR item_data IN SELECT unnest(sale_items)
    LOOP
        SELECT stock_in_pieces, COALESCE(brand_name, generic_name) 
        INTO current_stock, product_name
        FROM public.products 
        WHERE id = (item_data->>'product_id')::UUID;

        IF current_stock IS NULL THEN
            RAISE EXCEPTION 'Product not found: %', (item_data->>'product_id')::UUID;
        END IF;

        item_quantity := (item_data->>'quantity_in_pieces')::INTEGER;
        
        IF current_stock < item_quantity THEN
            RAISE EXCEPTION 'Insufficient stock for %: available %, needed %', 
                product_name, current_stock, item_quantity;
        END IF;
        
        RAISE NOTICE 'Stock OK for %: % available, % needed', 
            product_name, current_stock, item_quantity;
    END LOOP;

    -- Create sale record
    INSERT INTO public.sales (
        user_id, total_amount, payment_method, customer_id,
        customer_name, customer_phone, customer_email, customer_address,
        customer_type, notes, discount_type, discount_percentage,
        discount_amount, subtotal_before_discount, pwd_senior_id,
        pwd_senior_holder_name, status, completed_at, created_at, updated_at
    ) VALUES (
        (sale_data->>'user_id')::UUID,
        (sale_data->>'total_amount')::DECIMAL,
        sale_data->>'payment_method',
        CASE WHEN sale_data->>'customer_id' IS NOT NULL 
             THEN (sale_data->>'customer_id')::UUID ELSE NULL END,
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
        NOW(), NOW(), NOW()
    ) RETURNING id INTO sale_id;

    SELECT customer_id INTO customer_id_result FROM public.sales WHERE id = sale_id;

    -- Insert sale items AND deduct stock
    FOR item_data IN SELECT unnest(sale_items)
    LOOP
        item_quantity := (item_data->>'quantity_in_pieces')::INTEGER;
        
        -- Insert sale item
        INSERT INTO public.sale_items (
            sale_id, product_id, quantity, unit_type, unit_price, total_price,
            created_at, updated_at
        ) VALUES (
            sale_id,
            (item_data->>'product_id')::UUID,
            item_quantity,
            item_data->>'unit_type',
            (item_data->>'price_per_unit')::DECIMAL,
            (item_data->>'total_price')::DECIMAL,
            NOW(), NOW()
        );

        -- CRITICAL: Deduct stock
        UPDATE public.products 
        SET stock_in_pieces = stock_in_pieces - item_quantity,
            updated_at = NOW()
        WHERE id = (item_data->>'product_id')::UUID;

        -- Log stock update
        SELECT stock_in_pieces, COALESCE(brand_name, generic_name) 
        INTO current_stock, product_name
        FROM public.products 
        WHERE id = (item_data->>'product_id')::UUID;
        
        RAISE NOTICE 'Stock updated for %: new level = %', product_name, current_stock;
    END LOOP;

    -- Return result
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

    RAISE NOTICE 'POS Fix: Sale completed with ID %', sale_id;
    RETURN result;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'POS Fix Error: %', SQLERRM;
END;
$$;

-- STEP 4: Grant permissions
SELECT 'STEP 4: Granting permissions...' as step;
GRANT EXECUTE ON FUNCTION public.create_sale_with_items(jsonb, jsonb[]) TO authenticated;

-- STEP 5: Verify function was created
SELECT 'STEP 5: Verifying function creation...' as step;
SELECT 
    routine_name, 
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_name = 'create_sale_with_items' 
AND routine_schema = 'public';

SELECT 'SUCCESS: POS stock deduction function deployed!' as final_status;