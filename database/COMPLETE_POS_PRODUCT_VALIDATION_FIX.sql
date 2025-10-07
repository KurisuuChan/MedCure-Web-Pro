-- =============================================================================
-- COMPLETE POS PRODUCT VALIDATION FIX
-- =============================================================================
-- Purpose: Fix POS issues where products no longer exist during transaction
-- Issues Fixed:
--   1. Missing updated_at column in sale_items table  
--   2. Missing create_sale_with_items function
--   3. Stock deduction not working
--   4. Better product validation with helpful error messages
-- =============================================================================

-- Step 1: Check and fix sale_items table structure
DO $$
BEGIN
    -- Check if updated_at column exists in sale_items
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sale_items' 
        AND column_name = 'updated_at'
        AND table_schema = 'public'
    ) THEN
        -- Add updated_at column to sale_items table
        ALTER TABLE public.sale_items 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        -- Update existing records to have current timestamp
        UPDATE public.sale_items 
        SET updated_at = created_at 
        WHERE updated_at IS NULL;
        
        RAISE NOTICE 'Added updated_at column to sale_items table';
    ELSE
        RAISE NOTICE 'updated_at column already exists in sale_items table';
    END IF;
    
    -- Check if created_at column exists in sale_items
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sale_items' 
        AND column_name = 'created_at'
        AND table_schema = 'public'
    ) THEN
        -- Add created_at column to sale_items table
        ALTER TABLE public.sale_items 
        ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        -- Update existing records to have current timestamp
        UPDATE public.sale_items 
        SET created_at = NOW() 
        WHERE created_at IS NULL;
        
        RAISE NOTICE 'Added created_at column to sale_items table';
    ELSE
        RAISE NOTICE 'created_at column already exists in sale_items table';
    END IF;
END $$;

-- Step 2: Drop existing function if it exists
DROP FUNCTION IF EXISTS public.create_sale_with_items(jsonb, jsonb[]);

-- Step 3: Create enhanced create_sale_with_items function with better product validation
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
    product_record RECORD;
    result jsonb;
    missing_products TEXT[] := ARRAY[]::TEXT[];
    invalid_products TEXT[] := ARRAY[]::TEXT[];
    stock_issues TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Log function start
    RAISE NOTICE 'Starting create_sale_with_items with % items', array_length(sale_items, 1);

    -- Enhanced product validation with detailed error reporting
    FOR item_data IN SELECT unnest(sale_items)
    LOOP
        -- Get current product data with validation
        SELECT 
            id, 
            stock_in_pieces, 
            COALESCE(brand_name, generic_name, 'Unknown Product') as name,
            is_active,
            is_archived
        INTO product_record
        FROM public.products 
        WHERE id = (item_data->>'product_id')::UUID;

        -- Check if product exists
        IF NOT FOUND THEN
            missing_products := array_append(missing_products, item_data->>'product_id');
            CONTINUE;
        END IF;

        -- Check if product is active and not archived
        IF NOT product_record.is_active OR product_record.is_archived THEN
            invalid_products := array_append(invalid_products, 
                format('%s (ID: %s) - %s', 
                    product_record.name, 
                    item_data->>'product_id',
                    CASE 
                        WHEN NOT product_record.is_active THEN 'inactive'
                        WHEN product_record.is_archived THEN 'archived'
                        ELSE 'unavailable'
                    END
                )
            );
            CONTINUE;
        END IF;

        -- Fix: Use correct field name from frontend
        item_quantity := (item_data->>'quantity')::INTEGER;
        
        -- Check stock availability
        IF product_record.stock_in_pieces < item_quantity THEN
            stock_issues := array_append(stock_issues,
                format('%s: requested %s, available %s', 
                    product_record.name, 
                    item_quantity, 
                    product_record.stock_in_pieces
                )
            );
            CONTINUE;
        END IF;
        
        RAISE NOTICE 'Stock check passed for %: % available, % required', 
            product_record.name, product_record.stock_in_pieces, item_quantity;
    END LOOP;

    -- Report any validation errors with helpful messages
    IF array_length(missing_products, 1) > 0 THEN
        RAISE EXCEPTION 'Products not found in database: %. Please refresh the product list and try again.', 
            array_to_string(missing_products, ', ');
    END IF;

    IF array_length(invalid_products, 1) > 0 THEN
        RAISE EXCEPTION 'Products are not available for sale: %. Please refresh the product list.', 
            array_to_string(invalid_products, '; ');
    END IF;

    IF array_length(stock_issues, 1) > 0 THEN
        RAISE EXCEPTION 'Insufficient stock: %. Please adjust quantities or refresh stock levels.', 
            array_to_string(stock_issues, '; ');
    END IF;

    -- All validations passed, now create the sale
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
        -- Fix: Use correct field name from frontend
        item_quantity := (item_data->>'quantity')::INTEGER;
        
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
            (item_data->>'unit_price')::DECIMAL,
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
        SELECT 
            stock_in_pieces, 
            COALESCE(brand_name, generic_name, 'Unknown Product') as name
        INTO current_stock, product_name
        FROM public.products 
        WHERE id = (item_data->>'product_id')::UUID;
        
        RAISE NOTICE 'Stock deducted for %: new stock level = %', product_name, current_stock;
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

-- Step 4: Grant permissions
GRANT EXECUTE ON FUNCTION public.create_sale_with_items(jsonb, jsonb[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_sale_with_items(jsonb, jsonb[]) TO anon;

-- Step 5: Create helper function to validate products for POS
CREATE OR REPLACE FUNCTION public.validate_pos_products(product_ids UUID[])
RETURNS TABLE (
    product_id UUID,
    name TEXT,
    stock_in_pieces INTEGER,
    is_available BOOLEAN,
    issue_reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as product_id,
        COALESCE(p.brand_name, p.generic_name, 'Unknown Product') as name,
        p.stock_in_pieces,
        (p.is_active AND NOT COALESCE(p.is_archived, false) AND p.stock_in_pieces > 0) as is_available,
        CASE 
            WHEN NOT p.is_active THEN 'Product is inactive'
            WHEN COALESCE(p.is_archived, false) THEN 'Product is archived'
            WHEN p.stock_in_pieces <= 0 THEN 'Out of stock'
            ELSE 'Available'
        END as issue_reason
    FROM public.products p
    WHERE p.id = ANY(product_ids);
END;
$$;

-- Grant permissions for validation function
GRANT EXECUTE ON FUNCTION public.validate_pos_products(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_pos_products(UUID[]) TO anon;

-- Step 6: Verification queries
SELECT 'Database structure checks completed!' AS status;

-- Check sale_items table structure
SELECT 
    'sale_items table structure:' AS info,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'sale_items' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if functions were created
SELECT 
    'Functions created:' AS info,
    routine_name, 
    routine_type
FROM information_schema.routines 
WHERE routine_name IN ('create_sale_with_items', 'validate_pos_products')
AND routine_schema = 'public';

-- =============================================================================
-- FINAL VERIFICATION
-- =============================================================================
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'create_sale_with_items' 
            AND routine_schema = 'public'
        ) AND EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'sale_items' 
            AND column_name = 'updated_at'
            AND table_schema = 'public'
        ) THEN '🎉 POS FIXES COMPLETED SUCCESSFULLY! Your POS should now work properly.'
        ELSE '⚠️ Some fixes may have failed. Check the output above for details.'
    END AS final_status;

-- Usage example for product validation:
-- SELECT * FROM validate_pos_products(ARRAY['product-id-1', 'product-id-2']::UUID[]);