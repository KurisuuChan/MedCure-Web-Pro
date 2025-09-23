-- ========================================
-- 🚀 SIMPLE BATCH TRACKING SYSTEM SETUP
-- ========================================
-- Execute this in your Supabase SQL Editor
-- This is a simplified version that avoids foreign key conflicts

-- ========================================
-- 1. DROP EXISTING TABLES IF THEY EXIST
-- ========================================
DROP TABLE IF EXISTS inventory_logs CASCADE;
DROP TABLE IF EXISTS product_batches CASCADE;

-- ========================================
-- 2. CREATE BATCH TRACKING TABLES
-- ========================================

-- Create product_batches table
CREATE TABLE product_batches (
    id SERIAL PRIMARY KEY,
    product_id UUID NOT NULL,
    batch_number VARCHAR(100),
    quantity INTEGER NOT NULL DEFAULT 0,
    original_quantity INTEGER NOT NULL DEFAULT 0,
    expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    
    -- Constraints
    CHECK (quantity >= 0),
    CHECK (original_quantity >= 0),
    CHECK (quantity <= original_quantity)
);

-- Create inventory_logs table for audit trail
CREATE TABLE inventory_logs (
    id SERIAL PRIMARY KEY,
    product_id UUID NOT NULL,
    batch_id INTEGER,
    action VARCHAR(50) NOT NULL,
    quantity_change INTEGER NOT NULL DEFAULT 0,
    previous_quantity INTEGER,
    new_quantity INTEGER,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);

-- ========================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ========================================

-- Indexes for product_batches
CREATE INDEX idx_product_batches_product_id ON product_batches(product_id);
CREATE INDEX idx_product_batches_expiry ON product_batches(expiry_date);
CREATE INDEX idx_product_batches_created_at ON product_batches(created_at);

-- Indexes for inventory_logs
CREATE INDEX idx_inventory_logs_product_id ON inventory_logs(product_id);
CREATE INDEX idx_inventory_logs_batch_id ON inventory_logs(batch_id);
CREATE INDEX idx_inventory_logs_created_at ON inventory_logs(created_at);

-- ========================================
-- 4. ENABLE ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS on new tables
ALTER TABLE product_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_batches
CREATE POLICY "Users can view all product batches" ON product_batches
    FOR SELECT USING (true);

CREATE POLICY "Users can insert product batches" ON product_batches
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update product batches" ON product_batches
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete product batches" ON product_batches
    FOR DELETE USING (true);

-- RLS Policies for inventory_logs
CREATE POLICY "Users can view all inventory logs" ON inventory_logs
    FOR SELECT USING (true);

CREATE POLICY "Users can insert inventory logs" ON inventory_logs
    FOR INSERT WITH CHECK (true);

-- ========================================
-- 5. CREATE RPC FUNCTIONS
-- ========================================

-- Function to add a new product batch
CREATE OR REPLACE FUNCTION add_product_batch(
    p_product_id UUID,
    p_quantity INTEGER,
    p_batch_number VARCHAR DEFAULT NULL,
    p_expiry_date DATE DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_batch_id INTEGER;
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
        original_quantity,
        expiry_date,
        created_by
    ) VALUES (
        p_product_id,
        p_batch_number,
        p_quantity,
        p_quantity,
        p_expiry_date,
        auth.uid()
    )
    RETURNING id INTO v_batch_id;

    -- Update product stock
    UPDATE products 
    SET 
        stock_in_pieces = v_new_stock,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_product_id;

    -- Log the inventory change
    INSERT INTO inventory_logs (
        product_id,
        batch_id,
        action,
        quantity_change,
        previous_quantity,
        new_quantity,
        reason,
        created_by
    ) VALUES (
        p_product_id,
        v_batch_id,
        'ADD_BATCH',
        p_quantity,
        v_current_stock,
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
    id INTEGER,
    product_id UUID,
    batch_number VARCHAR,
    quantity INTEGER,
    original_quantity INTEGER,
    expiry_date DATE,
    days_to_expiry INTEGER,
    status VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE
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
        pb.original_quantity,
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
    id INTEGER,
    product_id UUID,
    product_name VARCHAR,
    batch_number VARCHAR,
    quantity INTEGER,
    original_quantity INTEGER,
    expiry_date DATE,
    days_to_expiry INTEGER,
    status VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE
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
        pb.original_quantity,
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
    p_batch_id INTEGER,
    p_new_quantity INTEGER,
    p_reason VARCHAR DEFAULT 'Manual adjustment'
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
    SET 
        quantity = p_new_quantity,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_batch_id;

    -- Update product stock
    UPDATE products 
    SET 
        stock_in_pieces = v_new_stock,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = v_product_id;

    -- Log the change
    INSERT INTO inventory_logs (
        product_id,
        batch_id,
        action,
        quantity_change,
        previous_quantity,
        new_quantity,
        reason,
        created_by
    ) VALUES (
        v_product_id,
        p_batch_id,
        'ADJUST_BATCH',
        v_quantity_diff,
        v_current_stock,
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

-- ========================================
-- 6. CREATE TRIGGERS FOR AUTOMATIC UPDATES
-- ========================================

-- Function to update product_batches timestamp
CREATE OR REPLACE FUNCTION update_batch_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for product_batches
DROP TRIGGER IF EXISTS trigger_update_batch_timestamp ON product_batches;
CREATE TRIGGER trigger_update_batch_timestamp
    BEFORE UPDATE ON product_batches
    FOR EACH ROW
    EXECUTE FUNCTION update_batch_timestamp();

-- ========================================
-- 7. GRANT PERMISSIONS
-- ========================================

-- Grant permissions on tables
GRANT ALL ON product_batches TO authenticated;
GRANT ALL ON inventory_logs TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION add_product_batch(UUID, INTEGER, VARCHAR, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_batches_for_product(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_batches() TO authenticated;
GRANT EXECUTE ON FUNCTION update_batch_quantity(INTEGER, INTEGER, VARCHAR) TO authenticated;

-- ========================================
-- ✅ SETUP COMPLETE!
-- ========================================

SELECT '✅ BATCH TRACKING SYSTEM SETUP COMPLETE!' as message;