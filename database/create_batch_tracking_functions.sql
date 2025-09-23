-- ============================================
-- BATCH TRACKING SYSTEM - RPC FUNCTIONS
-- ============================================
-- Creates the core RPC functions for batch management
-- Run this SQL in your Supabase SQL editor after creating the tables

-- 1. Main function to add a new product batch
CREATE OR REPLACE FUNCTION add_product_batch(
    p_product_id UUID,
    p_quantity INTEGER,
    p_batch_number TEXT DEFAULT NULL,
    p_expiry_date DATE DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_batch_id BIGINT;
    v_old_stock INTEGER;
    v_new_stock INTEGER;
    v_user_id UUID;
    v_product_name TEXT;
    v_notes TEXT;
BEGIN
    -- Get current user ID
    SELECT auth.uid() INTO v_user_id;
    
    -- Validate product exists and get current stock
    SELECT stock_in_pieces, name 
    INTO v_old_stock, v_product_name
    FROM products 
    WHERE id = p_product_id AND is_active = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product with ID % not found or is inactive', p_product_id;
    END IF;
    
    -- Validate quantity
    IF p_quantity <= 0 THEN
        RAISE EXCEPTION 'Quantity must be greater than 0';
    END IF;
    
    -- Start transaction
    BEGIN
        -- 1. INSERT new batch record
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
        ) RETURNING id INTO v_batch_id;
        
        -- 2. UPDATE total stock in products table
        -- Calculate new total from all batches
        SELECT COALESCE(SUM(quantity), 0)
        INTO v_new_stock
        FROM product_batches
        WHERE product_id = p_product_id;
        
        UPDATE products
        SET 
            stock_in_pieces = v_new_stock,
            updated_at = NOW()
        WHERE id = p_product_id;
        
        -- 3. INSERT audit log entry
        v_notes := 'New batch added';
        IF p_batch_number IS NOT NULL THEN
            v_notes := v_notes || ': ' || p_batch_number;
        END IF;
        IF p_expiry_date IS NOT NULL THEN
            v_notes := v_notes || ' (expires: ' || p_expiry_date || ')';
        END IF;
        
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
            v_notes,
            v_user_id
        );
        
        -- Return success response
        RETURN jsonb_build_object(
            'success', true,
            'batch_id', v_batch_id,
            'product_name', v_product_name,
            'old_stock', v_old_stock,
            'new_stock', v_new_stock,
            'quantity_added', p_quantity,
            'message', 'Batch added successfully'
        );
        
    EXCEPTION WHEN OTHERS THEN
        -- Rollback handled automatically by PostgreSQL
        RAISE EXCEPTION 'Failed to add batch: %', SQLERRM;
    END;
END;
$$;

-- 2. Function to get all batches for a product
CREATE OR REPLACE FUNCTION get_batches_for_product(p_product_id UUID)
RETURNS TABLE (
    batch_id BIGINT,
    batch_number TEXT,
    quantity INTEGER,
    expiry_date DATE,
    created_at TIMESTAMPTZ,
    days_until_expiry INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pb.id as batch_id,
        pb.batch_number,
        pb.quantity,
        pb.expiry_date,
        pb.created_at,
        CASE 
            WHEN pb.expiry_date IS NOT NULL 
            THEN EXTRACT(DAYS FROM (pb.expiry_date - CURRENT_DATE))::INTEGER
            ELSE NULL
        END as days_until_expiry
    FROM product_batches pb
    WHERE pb.product_id = p_product_id
    ORDER BY 
        CASE WHEN pb.expiry_date IS NULL THEN 1 ELSE 0 END,
        pb.expiry_date ASC,
        pb.created_at ASC;
END;
$$;

-- 3. Function to get all batches (for batch management page)
CREATE OR REPLACE FUNCTION get_all_batches()
RETURNS TABLE (
    batch_id BIGINT,
    product_id UUID,
    product_name TEXT,
    batch_number TEXT,
    quantity INTEGER,
    expiry_date DATE,
    created_at TIMESTAMPTZ,
    days_until_expiry INTEGER,
    category_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pb.id as batch_id,
        pb.product_id,
        p.name as product_name,
        pb.batch_number,
        pb.quantity,
        pb.expiry_date,
        pb.created_at,
        CASE 
            WHEN pb.expiry_date IS NOT NULL 
            THEN EXTRACT(DAYS FROM (pb.expiry_date - CURRENT_DATE))::INTEGER
            ELSE NULL
        END as days_until_expiry,
        p.category as category_name
    FROM product_batches pb
    JOIN products p ON pb.product_id = p.id
    WHERE p.is_active = true
    ORDER BY 
        CASE WHEN pb.expiry_date IS NULL THEN 1 ELSE 0 END,
        pb.expiry_date ASC,
        p.name ASC,
        pb.created_at ASC;
END;
$$;

-- 4. Function to update batch quantity (for manual adjustments)
CREATE OR REPLACE FUNCTION update_batch_quantity(
    p_batch_id BIGINT,
    p_new_quantity INTEGER,
    p_reason TEXT DEFAULT 'Manual adjustment'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_product_id UUID;
    v_old_quantity INTEGER;
    v_quantity_change INTEGER;
    v_new_total_stock INTEGER;
    v_user_id UUID;
    v_product_name TEXT;
BEGIN
    -- Get current user ID
    SELECT auth.uid() INTO v_user_id;
    
    -- Validate new quantity
    IF p_new_quantity < 0 THEN
        RAISE EXCEPTION 'Quantity cannot be negative';
    END IF;
    
    -- Get batch info
    SELECT pb.product_id, pb.quantity, p.name
    INTO v_product_id, v_old_quantity, v_product_name
    FROM product_batches pb
    JOIN products p ON pb.product_id = p.id
    WHERE pb.id = p_batch_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Batch with ID % not found', p_batch_id;
    END IF;
    
    v_quantity_change := p_new_quantity - v_old_quantity;
    
    BEGIN
        -- Update batch quantity
        UPDATE product_batches
        SET quantity = p_new_quantity
        WHERE id = p_batch_id;
        
        -- Recalculate total stock
        SELECT COALESCE(SUM(quantity), 0)
        INTO v_new_total_stock
        FROM product_batches
        WHERE product_id = v_product_id;
        
        -- Update product total stock
        UPDATE products
        SET stock_in_pieces = v_new_total_stock
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
            v_quantity_change,
            v_new_total_stock,
            p_reason || ' (Batch ID: ' || p_batch_id || ')',
            v_user_id
        );
        
        RETURN jsonb_build_object(
            'success', true,
            'batch_id', p_batch_id,
            'product_name', v_product_name,
            'old_quantity', v_old_quantity,
            'new_quantity', p_new_quantity,
            'quantity_change', v_quantity_change,
            'new_total_stock', v_new_total_stock,
            'message', 'Batch quantity updated successfully'
        );
        
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to update batch quantity: %', SQLERRM;
    END;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION add_product_batch TO authenticated;
GRANT EXECUTE ON FUNCTION get_batches_for_product TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_batches TO authenticated;
GRANT EXECUTE ON FUNCTION update_batch_quantity TO authenticated;