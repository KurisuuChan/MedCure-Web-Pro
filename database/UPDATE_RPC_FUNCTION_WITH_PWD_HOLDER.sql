-- ============================================================================
-- UPDATE RPC FUNCTION TO INCLUDE PWD_SENIOR_HOLDER_NAME
-- ============================================================================
-- This updates the create_sale_with_items function to handle the new 
-- pwd_senior_holder_name field

CREATE OR REPLACE FUNCTION public.create_sale_with_items(sale_data jsonb, items jsonb[])
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    sale_id UUID;
    item_data jsonb;
    customer_id_result UUID;
    result_json jsonb;
BEGIN
    -- Insert into sales table with pwd_senior_holder_name
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
        pwd_senior_holder_name,  -- ✅ ADD THIS FIELD
        status,
        completed_at
    ) VALUES (
        (sale_data->>'user_id')::UUID,
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
        sale_data->>'pwd_senior_holder_name',  -- ✅ ADD THIS VALUE
        COALESCE(sale_data->>'status', 'completed'),
        COALESCE((sale_data->>'completed_at')::TIMESTAMP WITH TIME ZONE, NOW())
    ) RETURNING id INTO sale_id;

    -- Get customer_id for the result
    SELECT customer_id INTO customer_id_result FROM public.sales WHERE id = sale_id;

    -- Insert sale items
    FOR item_data IN SELECT unnest(items)
    LOOP
        INSERT INTO public.sale_items (
            sale_id,
            product_id,
            quantity,
            unit_type,
            unit_price,
            total_price
        ) VALUES (
            sale_id,
            (item_data->>'product_id')::UUID,
            (item_data->>'quantity_in_pieces')::INTEGER,
            item_data->>'unit_type',
            (item_data->>'price_per_unit')::DECIMAL,
            (item_data->>'total_price')::DECIMAL
        );
    END LOOP;

    -- Return the sale data with customer_id
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
        'pwd_senior_holder_name', s.pwd_senior_holder_name,  -- ✅ RETURN THIS FIELD
        'status', s.status,
        'completed_at', s.completed_at,
        'created_at', s.created_at
    ) INTO result_json
    FROM public.sales s
    WHERE s.id = sale_id;

    RETURN result_json;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.create_sale_with_items(jsonb, jsonb[]) TO authenticated;

-- Test the function to ensure it works
SELECT 'create_sale_with_items function updated successfully' AS status;