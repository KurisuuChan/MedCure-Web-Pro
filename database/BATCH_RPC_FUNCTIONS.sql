-- ============================================
-- BATCH TRACKING RPC FUNCTIONS
-- ============================================
-- Execute this in your Supabase SQL Editor
-- These functions work with your existing table structure

-- Drop existing functions first to avoid conflicts
DROP FUNCTION IF EXISTS add_product_batch(UUID, INTEGER, TEXT, DATE);
DROP FUNCTION IF EXISTS add_product_batch(UUID, INTEGER, VARCHAR, DATE);
DROP FUNCTION IF EXISTS get_batches_for_product(UUID);
DROP FUNCTION IF EXISTS get_all_batches();
DROP FUNCTION IF EXISTS update_batch_quantity(BIGINT, INTEGER, TEXT);
DROP FUNCTION IF EXISTS update_batch_quantity(INTEGER, INTEGER, VARCHAR);

-- Function to add a new product batch
CREATE OR REPLACE FUNCTION add_product_batch(
    p_product_id UUID,
    p_quantity INTEGER,
    p_batch_number TEXT DEFAULT NULL,
    p_expiry_date DATE DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_batch_id BIGINT;
    v_result JSON;
    v_current_stock INTEGER;
    v_new_stock INTEGER;
BEGIN
    -- Validate inputs
    IF p_product_id IS NULL OR p_quantity IS NULL OR p_quantity <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Product ID and positive quantity are required'
        );
    END IF;

    -- Check if product exists
    IF NOT EXISTS (SELECT 1 FROM products WHERE id = p_product_id) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Product not found'
        );
    END IF;

    -- Get current stock
    SELECT COALESCE(stock_in_pieces, 0) INTO v_current_stock 
    FROM products WHERE id = p_product_id;
    
    v_new_stock := v_current_stock + p_quantity;

    -- Insert new batch
    INSERT INTO product_batches (
        product_id,
        batch_number,
        quantity,
        expiry_date
    ) VALUES (
        p_product_id,
        p_batch_number,
        p_quantity,
        p_expiry_date
    )
    RETURNING id INTO v_batch_id;

    -- Update product stock
    UPDATE products 
    SET 
        stock_in_pieces = v_new_stock,
        updated_at = NOW()
    WHERE id = p_product_id;

    -- Log the inventory change
    INSERT INTO inventory_logs (
        product_id,
        quantity_change,
        new_quantity,
        notes,
        user_id
    ) VALUES (
        p_product_id,
        p_quantity,
        v_new_stock,
        'New batch added: ' || COALESCE(p_batch_number, 'No batch number'),
        auth.uid()
    );

    -- Build result
    v_result := json_build_object(
        'success', true,
        'batch_id', v_batch_id,
        'product_id', p_product_id,
        'quantity_added', p_quantity,
        'previous_stock', v_current_stock,
        'new_stock', v_new_stock,
        'batch_number', p_batch_number,
        'expiry_date', p_expiry_date
    );

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- Function to get batches for a specific product
CREATE OR REPLACE FUNCTION get_batches_for_product(p_product_id UUID)
RETURNS TABLE (
    id BIGINT,
    product_id UUID,
    batch_number TEXT,
    quantity INTEGER,
    original_quantity INTEGER,
    expiry_date DATE,
    days_to_expiry INTEGER,
    status TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pb.id,
        pb.product_id,
        pb.batch_number,
        pb.quantity,
        pb.quantity as original_quantity, -- Using quantity as original since that's what we have
        pb.expiry_date,
        CASE 
            WHEN pb.expiry_date IS NULL THEN NULL
            ELSE EXTRACT(DAY FROM pb.expiry_date - CURRENT_DATE)::INTEGER
        END as days_to_expiry,
        CASE 
            WHEN pb.quantity = 0 THEN 'DEPLETED'
            WHEN pb.expiry_date IS NULL THEN 'ACTIVE'
            WHEN pb.expiry_date < CURRENT_DATE THEN 'EXPIRED'
            WHEN pb.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'EXPIRING_SOON'
            ELSE 'ACTIVE'
        END as status,
        pb.created_at
    FROM product_batches pb
    WHERE pb.product_id = p_product_id
    ORDER BY pb.expiry_date ASC NULLS LAST, pb.created_at DESC;
END;
$$;

-- Function to get all batches (for Batch Management page)
CREATE OR REPLACE FUNCTION get_all_batches()
RETURNS TABLE (
    id BIGINT,
    product_id UUID,
    product_name TEXT,
    batch_number TEXT,
    quantity INTEGER,
    original_quantity INTEGER,
    expiry_date DATE,
    days_to_expiry INTEGER,
    status TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pb.id,
        pb.product_id,
        p.name as product_name,
        pb.batch_number,
        pb.quantity,
        pb.quantity as original_quantity, -- Using quantity as original since that's what we have
        pb.expiry_date,
        CASE 
            WHEN pb.expiry_date IS NULL THEN NULL
            ELSE EXTRACT(DAY FROM pb.expiry_date - CURRENT_DATE)::INTEGER
        END as days_to_expiry,
        CASE 
            WHEN pb.quantity = 0 THEN 'DEPLETED'
            WHEN pb.expiry_date IS NULL THEN 'ACTIVE'
            WHEN pb.expiry_date < CURRENT_DATE THEN 'EXPIRED'
            WHEN pb.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'EXPIRING_SOON'
            ELSE 'ACTIVE'
        END as status,
        pb.created_at
    FROM product_batches pb
    JOIN products p ON pb.product_id = p.id
    WHERE p.is_active = true
    ORDER BY pb.expiry_date ASC NULLS LAST, pb.created_at DESC;
END;
$$;

-- Function to update batch quantity
CREATE OR REPLACE FUNCTION update_batch_quantity(
    p_batch_id BIGINT,
    p_new_quantity INTEGER,
    p_reason TEXT DEFAULT 'Manual adjustment'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_product_id UUID;
    v_old_quantity INTEGER;
    v_quantity_diff INTEGER;
    v_current_stock INTEGER;
    v_new_stock INTEGER;
    v_result JSON;
BEGIN
    -- Validate inputs
    IF p_batch_id IS NULL OR p_new_quantity IS NULL OR p_new_quantity < 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Valid batch ID and non-negative quantity required'
        );
    END IF;

    -- Get current batch info
    SELECT product_id, quantity INTO v_product_id, v_old_quantity
    FROM product_batches 
    WHERE id = p_batch_id;

    IF v_product_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Batch not found'
        );
    END IF;

    -- Calculate difference
    v_quantity_diff := p_new_quantity - v_old_quantity;

    -- Get current product stock
    SELECT COALESCE(stock_in_pieces, 0) INTO v_current_stock 
    FROM products WHERE id = v_product_id;
    
    v_new_stock := v_current_stock + v_quantity_diff;

    -- Ensure stock doesn't go negative
    IF v_new_stock < 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Cannot reduce stock below zero'
        );
    END IF;

    -- Update batch quantity
    UPDATE product_batches 
    SET quantity = p_new_quantity
    WHERE id = p_batch_id;

    -- Update product stock
    UPDATE products 
    SET 
        stock_in_pieces = v_new_stock,
        updated_at = NOW()
    WHERE id = v_product_id;

    -- Log the change
    INSERT INTO inventory_logs (
        product_id,
        quantity_change,
        new_quantity,
        notes,
        user_id
    ) VALUES (
        v_product_id,
        v_quantity_diff,
        v_new_stock,
        p_reason,
        auth.uid()
    );

    v_result := json_build_object(
        'success', true,
        'batch_id', p_batch_id,
        'product_id', v_product_id,
        'old_quantity', v_old_quantity,
        'new_quantity', p_new_quantity,
        'quantity_difference', v_quantity_diff,
        'previous_stock', v_current_stock,
        'new_stock', v_new_stock
    );

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION add_product_batch(UUID, INTEGER, TEXT, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_batches_for_product(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_batches() TO authenticated;
GRANT EXECUTE ON FUNCTION update_batch_quantity(BIGINT, INTEGER, TEXT) TO authenticated;

-- ========================================
-- ✅ RPC FUNCTIONS SETUP COMPLETE!
-- ========================================

SELECT '✅ BATCH TRACKING RPC FUNCTIONS SETUP COMPLETE!' as message;