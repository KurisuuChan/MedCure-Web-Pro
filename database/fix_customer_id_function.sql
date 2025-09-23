-- Fix the create_sale_with_items function to include customer_id
-- Run this SQL script in your Supabase SQL editor

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
    -- Insert the sale record with 'pending' status initially
    INSERT INTO sales (
        user_id,
        total_amount,
        payment_method,
        customer_id,           -- ✅ ADDED: customer_id field
        customer_name,
        customer_phone,
        customer_email,        -- ✅ ADDED: customer_email field  
        customer_address,      -- ✅ ADDED: customer_address field
        customer_type,         -- ✅ ADDED: customer_type field
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
        (sale_data->>'customer_id')::UUID,  -- ✅ ADDED: customer_id value
        sale_data->>'customer_name',
        sale_data->>'customer_phone',
        sale_data->>'customer_email',       -- ✅ ADDED: customer_email value
        sale_data->>'customer_address',     -- ✅ ADDED: customer_address value
        COALESCE(sale_data->>'customer_type', 'guest'), -- ✅ ADDED: customer_type value
        sale_data->>'notes',
        COALESCE(sale_data->>'discount_type', 'none'),
        COALESCE((sale_data->>'discount_percentage')::DECIMAL, 0),
        COALESCE((sale_data->>'discount_amount')::DECIMAL, 0),
        COALESCE((sale_data->>'subtotal_before_discount')::DECIMAL, (sale_data->>'total_amount')::DECIMAL),
        sale_data->>'pwd_senior_id',
        'pending' -- Start as pending, not completed
    ) RETURNING id INTO new_sale_id;

    -- Process each sale item WITHOUT deducting stock
    FOR i IN array_lower(sale_items, 1) .. array_upper(sale_items, 1)
    LOOP
        sale_item := sale_items[i];
        
        -- Check stock availability (but don't deduct yet)
        SELECT stock_in_pieces INTO current_stock 
        FROM products 
        WHERE id = (sale_item->>'product_id')::UUID;

        IF current_stock < (sale_item->>'quantity')::INTEGER THEN
            RAISE EXCEPTION 'Insufficient stock. Available: %, Required: %', current_stock, (sale_item->>'product_id')::UUID;
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
    END LOOP;

    -- Return the complete sale with items
    SELECT jsonb_build_object(
        'id', s.id,
        'user_id', s.user_id,
        'total_amount', s.total_amount,
        'payment_method', s.payment_method,
        'customer_id', s.customer_id,        -- ✅ ADDED: Return customer_id
        'customer_name', s.customer_name,
        'customer_phone', s.customer_phone,
        'customer_email', s.customer_email,  -- ✅ ADDED: Return customer_email
        'customer_address', s.customer_address, -- ✅ ADDED: Return customer_address
        'customer_type', s.customer_type,    -- ✅ ADDED: Return customer_type
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
            ), '[]'::jsonb
        )
    ) INTO result
    FROM sales s
    WHERE s.id = new_sale_id;

    RETURN result;
END;
$$;

-- Also need to ensure the sales table has all the required columns
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS customer_id uuid;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS customer_email character varying;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS customer_address text;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS customer_type character varying DEFAULT 'guest';

-- Add foreign key constraint for customer_id (drop first if exists to avoid conflicts)
DO $$ 
BEGIN
    -- Drop constraint if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'sales_customer_id_fkey' 
               AND table_name = 'sales' 
               AND table_schema = 'public') THEN
        ALTER TABLE public.sales DROP CONSTRAINT sales_customer_id_fkey;
    END IF;
    
    -- Add the constraint
    ALTER TABLE public.sales ADD CONSTRAINT sales_customer_id_fkey 
      FOREIGN KEY (customer_id) REFERENCES public.customers(id);
EXCEPTION
    -- If customers table doesn't exist, skip the foreign key
    WHEN undefined_table THEN
        RAISE NOTICE 'customers table does not exist, skipping foreign key constraint';
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON public.sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer_type ON public.sales(customer_type);