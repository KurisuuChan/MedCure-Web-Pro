-- ========================================
-- 🚀 ENHANCED BATCH MANAGEMENT SYSTEM
-- ========================================
-- Senior Developer Implementation
-- Fixes all identified batch management flaws

-- ========================================
-- 1. ENHANCED BATCH TRACKING SCHEMA
-- ========================================

-- Drop existing tables to rebuild properly
DROP TABLE IF EXISTS inventory_logs CASCADE;
DROP TABLE IF EXISTS product_batches CASCADE;
DROP TABLE IF EXISTS batch_adjustments CASCADE;

-- Enhanced product_batches table with better constraints
CREATE TABLE product_batches (
    id SERIAL PRIMARY KEY,
    product_id UUID NOT NULL,
    batch_number VARCHAR(100) NOT NULL,
    supplier_batch_id VARCHAR(100), -- External supplier reference
    quantity INTEGER NOT NULL DEFAULT 0,
    original_quantity INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER NOT NULL DEFAULT 0, -- For pending transactions
    cost_per_unit DECIMAL(10,2) DEFAULT 0,
    selling_price DECIMAL(10,2),
    expiry_date DATE,
    manufacture_date DATE,
    received_date DATE DEFAULT CURRENT_DATE,
    supplier_name VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'quarantined', 'depleted')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    
    -- Enhanced constraints
    CHECK (quantity >= 0),
    CHECK (original_quantity >= 0),
    CHECK (reserved_quantity >= 0),
    CHECK (quantity <= original_quantity),
    CHECK (reserved_quantity <= quantity),
    CHECK (cost_per_unit >= 0),
    CHECK (selling_price >= 0),
    
    -- Unique constraint for batch numbers per product
    UNIQUE(product_id, batch_number)
);

-- Enhanced inventory_logs with better categorization
CREATE TABLE inventory_logs (
    id SERIAL PRIMARY KEY,
    product_id UUID NOT NULL,
    batch_id INTEGER REFERENCES product_batches(id),
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN (
        'batch_created', 'batch_received', 'sale', 'adjustment', 
        'transfer', 'expiry', 'return', 'damaged', 'count'
    )),
    quantity_before INTEGER NOT NULL DEFAULT 0,
    quantity_change INTEGER NOT NULL DEFAULT 0,
    quantity_after INTEGER NOT NULL DEFAULT 0,
    unit_cost DECIMAL(10,2),
    reference_id UUID, -- Transaction ID, adjustment ID, etc.
    reference_type VARCHAR(50), -- 'sale', 'purchase', 'adjustment', etc.
    reason TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    
    -- Constraints
    CHECK (quantity_before >= 0),
    CHECK (quantity_after >= 0),
    CHECK (quantity_after = quantity_before + quantity_change)
);

-- Batch adjustments table for tracking manual changes
CREATE TABLE batch_adjustments (
    id SERIAL PRIMARY KEY,
    batch_id INTEGER NOT NULL REFERENCES product_batches(id),
    adjustment_type VARCHAR(50) NOT NULL CHECK (adjustment_type IN (
        'manual_count', 'damage', 'expiry', 'transfer_in', 'transfer_out', 'correction'
    )),
    quantity_before INTEGER NOT NULL,
    quantity_after INTEGER NOT NULL,
    reason TEXT NOT NULL,
    notes TEXT,
    approved_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL
);

-- ========================================
-- 2. PERFORMANCE INDEXES
-- ========================================

-- Critical indexes for performance
CREATE INDEX idx_product_batches_product_expiry_qty ON product_batches(product_id, expiry_date ASC NULLS LAST, quantity DESC) WHERE quantity > 0;
CREATE INDEX idx_product_batches_status_expiry ON product_batches(status, expiry_date) WHERE status = 'active';
CREATE INDEX idx_product_batches_expiry_date ON product_batches(expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX idx_product_batches_created_at ON product_batches(created_at DESC);
CREATE INDEX idx_inventory_logs_batch_created ON inventory_logs(batch_id, created_at DESC);
CREATE INDEX idx_inventory_logs_product_type ON inventory_logs(product_id, transaction_type, created_at DESC);
CREATE INDEX idx_batch_adjustments_batch_created ON batch_adjustments(batch_id, created_at DESC);

-- ========================================
-- 3. ENHANCED RLS POLICIES
-- ========================================

-- Enable RLS
ALTER TABLE product_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_adjustments ENABLE ROW LEVEL SECURITY;

-- Liberal policies for operational staff (can be restricted later)
CREATE POLICY "Allow all operations on batches" ON product_batches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on logs" ON inventory_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on adjustments" ON batch_adjustments FOR ALL USING (true) WITH CHECK (true);

-- ========================================
-- 4. AUTOMATED STATUS UPDATES
-- ========================================

-- Trigger to automatically update batch status based on expiry and quantity
CREATE OR REPLACE FUNCTION update_batch_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update status based on quantity and expiry
    IF NEW.quantity = 0 THEN
        NEW.status := 'depleted';
    ELSIF NEW.expiry_date IS NOT NULL AND NEW.expiry_date < CURRENT_DATE THEN
        NEW.status := 'expired';
    ELSIF NEW.status IN ('expired', 'quarantined') AND NEW.expiry_date >= CURRENT_DATE THEN
        NEW.status := 'active'; -- Reactivate if expiry date was corrected
    ELSE
        NEW.status := 'active';
    END IF;
    
    -- Update timestamp
    NEW.updated_at := CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_batch_status
    BEFORE UPDATE ON product_batches
    FOR EACH ROW
    EXECUTE FUNCTION update_batch_status();

-- ========================================
-- 5. ENHANCED BATCH FUNCTIONS
-- ========================================

-- Function to add batch with comprehensive validation
CREATE OR REPLACE FUNCTION add_product_batch_enhanced(
    p_product_id UUID,
    p_quantity INTEGER,
    p_batch_number VARCHAR DEFAULT NULL,
    p_expiry_date DATE DEFAULT NULL,
    p_cost_per_unit DECIMAL DEFAULT 0,
    p_supplier_name VARCHAR DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_batch_id INTEGER;
    v_generated_batch_number VARCHAR;
    v_product_name VARCHAR;
    v_result JSONB;
BEGIN
    -- Validate inputs
    IF p_product_id IS NULL OR p_quantity <= 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Product ID and positive quantity are required'
        );
    END IF;
    
    -- Get product name for logging
    SELECT name INTO v_product_name FROM products WHERE id = p_product_id;
    IF v_product_name IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Product not found'
        );
    END IF;
    
    -- Generate batch number if not provided
    IF p_batch_number IS NULL OR p_batch_number = '' THEN
        SELECT COALESCE(MAX(id), 0) + 1 INTO v_batch_id FROM product_batches;
        v_generated_batch_number := 'B' || LPAD(v_batch_id::TEXT, 6, '0');
    ELSE
        v_generated_batch_number := p_batch_number;
    END IF;
    
    -- Check for duplicate batch number for this product
    IF EXISTS (
        SELECT 1 FROM product_batches 
        WHERE product_id = p_product_id 
        AND batch_number = v_generated_batch_number
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Batch number already exists for this product'
        );
    END IF;
    
    -- Insert new batch
    INSERT INTO product_batches (
        product_id, batch_number, quantity, original_quantity,
        cost_per_unit, expiry_date, supplier_name, notes, created_by
    ) VALUES (
        p_product_id, v_generated_batch_number, p_quantity, p_quantity,
        p_cost_per_unit, p_expiry_date, p_supplier_name, p_notes, p_user_id
    ) RETURNING id INTO v_batch_id;
    
    -- Log the batch creation
    INSERT INTO inventory_logs (
        product_id, batch_id, transaction_type, quantity_before,
        quantity_change, quantity_after, unit_cost, reason, created_by
    ) VALUES (
        p_product_id, v_batch_id, 'batch_created', 0, p_quantity, p_quantity,
        p_cost_per_unit, 'New batch added: ' || v_generated_batch_number, p_user_id
    );
    
    -- Update product total stock
    UPDATE products 
    SET 
        stock_in_pieces = stock_in_pieces + p_quantity,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_product_id;
    
    -- Build success response
    v_result := jsonb_build_object(
        'success', true,
        'batch_id', v_batch_id,
        'batch_number', v_generated_batch_number,
        'quantity_added', p_quantity,
        'product_name', v_product_name,
        'expiry_date', p_expiry_date
    );
    
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Failed to add batch: ' || SQLERRM
        );
END;
$$;

-- Function to get batches with enhanced sorting and filtering
CREATE OR REPLACE FUNCTION get_all_batches_enhanced(
    p_product_id UUID DEFAULT NULL,
    p_status VARCHAR DEFAULT NULL,
    p_expiry_filter VARCHAR DEFAULT 'all', -- 'all', 'expiring', 'expired'
    p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
    id INTEGER,
    product_id UUID,
    product_name VARCHAR,
    category_name VARCHAR,
    batch_number VARCHAR,
    quantity INTEGER,
    original_quantity INTEGER,
    reserved_quantity INTEGER,
    cost_per_unit DECIMAL,
    expiry_date DATE,
    days_until_expiry INTEGER,
    status VARCHAR,
    supplier_name VARCHAR,
    notes TEXT,
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
        COALESCE(c.name, 'Uncategorized') as category_name,
        pb.batch_number,
        pb.quantity,
        pb.original_quantity,
        pb.reserved_quantity,
        pb.cost_per_unit,
        pb.expiry_date,
        CASE 
            WHEN pb.expiry_date IS NULL THEN NULL
            ELSE EXTRACT(DAY FROM pb.expiry_date - CURRENT_DATE)::INTEGER
        END as days_until_expiry,
        pb.status,
        pb.supplier_name,
        pb.notes,
        pb.created_at
    FROM product_batches pb
    JOIN products p ON pb.product_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE 
        (p_product_id IS NULL OR pb.product_id = p_product_id)
        AND (p_status IS NULL OR pb.status = p_status)
        AND (
            p_expiry_filter = 'all' OR
            (p_expiry_filter = 'expiring' AND pb.expiry_date IS NOT NULL AND pb.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days') OR
            (p_expiry_filter = 'expired' AND pb.expiry_date IS NOT NULL AND pb.expiry_date < CURRENT_DATE)
        )
    ORDER BY 
        -- FEFO ordering: expired first, then by expiry date, then by creation date
        CASE WHEN pb.expiry_date IS NOT NULL AND pb.expiry_date < CURRENT_DATE THEN 0 ELSE 1 END,
        CASE WHEN pb.expiry_date IS NULL THEN 1 ELSE 0 END,
        pb.expiry_date ASC NULLS LAST,
        pb.created_at ASC
    LIMIT p_limit;
END;
$$;

-- Enhanced FEFO sales processing with proper batch validation
CREATE OR REPLACE FUNCTION process_sale_fefo_enhanced(
    p_product_id UUID,
    p_quantity_needed INTEGER,
    p_user_id UUID DEFAULT NULL,
    p_sale_id UUID DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_batch_record RECORD;
    v_remaining_quantity INTEGER := p_quantity_needed;
    v_deducted_quantity INTEGER;
    v_batches_affected INTEGER := 0;
    v_total_available INTEGER := 0;
    v_result JSONB;
    v_batches_used JSONB[] := '{}';
BEGIN
    -- Validate inputs
    IF p_product_id IS NULL OR p_quantity_needed <= 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Valid product ID and positive quantity required'
        );
    END IF;
    
    -- Check total available quantity (excluding expired and reserved)
    SELECT COALESCE(SUM(quantity - reserved_quantity), 0) INTO v_total_available
    FROM product_batches 
    WHERE product_id = p_product_id 
    AND status = 'active'
    AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE)
    AND quantity > reserved_quantity;
    
    IF v_total_available < p_quantity_needed THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient stock available',
            'available', v_total_available,
            'requested', p_quantity_needed
        );
    END IF;
    
    -- Process batches in FEFO order
    FOR v_batch_record IN
        SELECT id, batch_number, quantity, reserved_quantity, expiry_date
        FROM product_batches 
        WHERE product_id = p_product_id 
        AND status = 'active'
        AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE)
        AND quantity > reserved_quantity
        ORDER BY 
            CASE WHEN expiry_date IS NULL THEN 1 ELSE 0 END,
            expiry_date ASC NULLS LAST,
            created_at ASC
    LOOP
        EXIT WHEN v_remaining_quantity <= 0;
        
        -- Calculate how much we can take from this batch
        v_deducted_quantity := LEAST(
            v_remaining_quantity, 
            v_batch_record.quantity - v_batch_record.reserved_quantity
        );
        
        -- Update batch quantity
        UPDATE product_batches 
        SET 
            quantity = quantity - v_deducted_quantity,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = v_batch_record.id;
        
        -- Log the deduction
        INSERT INTO inventory_logs (
            product_id, batch_id, transaction_type, quantity_before,
            quantity_change, quantity_after, reference_id, reference_type,
            reason, created_by
        ) VALUES (
            p_product_id, v_batch_record.id, 'sale', 
            v_batch_record.quantity, -v_deducted_quantity, 
            v_batch_record.quantity - v_deducted_quantity,
            p_sale_id, 'sale',
            COALESCE(p_notes, 'FEFO sale deduction from batch ' || v_batch_record.batch_number),
            p_user_id
        );
        
        -- Track batch usage
        v_batches_used := v_batches_used || jsonb_build_object(
            'batch_id', v_batch_record.id,
            'batch_number', v_batch_record.batch_number,
            'quantity_used', v_deducted_quantity,
            'expiry_date', v_batch_record.expiry_date
        );
        
        v_remaining_quantity := v_remaining_quantity - v_deducted_quantity;
        v_batches_affected := v_batches_affected + 1;
    END LOOP;
    
    -- Update product total stock
    UPDATE products 
    SET 
        stock_in_pieces = stock_in_pieces - p_quantity_needed,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_product_id;
    
    -- Final validation
    IF v_remaining_quantity > 0 THEN
        RAISE EXCEPTION 'FEFO processing incomplete. Remaining quantity: %', v_remaining_quantity;
    END IF;
    
    -- Build success response
    v_result := jsonb_build_object(
        'success', true,
        'quantity_processed', p_quantity_needed,
        'batches_affected', v_batches_affected,
        'batches_used', v_batches_used,
        'sale_id', p_sale_id
    );
    
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'FEFO processing failed: ' || SQLERRM
        );
END;
$$;

-- Function to adjust batch quantity with proper logging
CREATE OR REPLACE FUNCTION adjust_batch_quantity(
    p_batch_id INTEGER,
    p_new_quantity INTEGER,
    p_reason TEXT,
    p_adjustment_type VARCHAR DEFAULT 'manual_count',
    p_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_batch_record RECORD;
    v_old_total_stock INTEGER;
    v_quantity_difference INTEGER;
    v_result JSONB;
BEGIN
    -- Get batch information
    SELECT pb.*, p.stock_in_pieces as product_stock
    INTO v_batch_record
    FROM product_batches pb
    JOIN products p ON pb.product_id = p.id
    WHERE pb.id = p_batch_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Batch not found'
        );
    END IF;
    
    -- Validate new quantity
    IF p_new_quantity < 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Quantity cannot be negative'
        );
    END IF;
    
    IF p_new_quantity > v_batch_record.original_quantity THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Quantity cannot exceed original quantity'
        );
    END IF;
    
    -- Calculate difference
    v_quantity_difference := p_new_quantity - v_batch_record.quantity;
    
    -- Update batch
    UPDATE product_batches 
    SET 
        quantity = p_new_quantity,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_batch_id;
    
    -- Update product total stock
    UPDATE products 
    SET 
        stock_in_pieces = stock_in_pieces + v_quantity_difference,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = v_batch_record.product_id;
    
    -- Log the adjustment
    INSERT INTO batch_adjustments (
        batch_id, adjustment_type, quantity_before, quantity_after,
        reason, created_by
    ) VALUES (
        p_batch_id, p_adjustment_type, v_batch_record.quantity, p_new_quantity,
        p_reason, p_user_id
    );
    
    -- Log in inventory logs
    INSERT INTO inventory_logs (
        product_id, batch_id, transaction_type, quantity_before,
        quantity_change, quantity_after, reason, created_by
    ) VALUES (
        v_batch_record.product_id, p_batch_id, 'adjustment', 
        v_batch_record.quantity, v_quantity_difference, p_new_quantity,
        p_reason, p_user_id
    );
    
    -- Build response
    v_result := jsonb_build_object(
        'success', true,
        'batch_id', p_batch_id,
        'old_quantity', v_batch_record.quantity,
        'new_quantity', p_new_quantity,
        'difference', v_quantity_difference,
        'adjustment_type', p_adjustment_type
    );
    
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Adjustment failed: ' || SQLERRM
        );
END;
$$;

-- Function to quarantine expired batches
CREATE OR REPLACE FUNCTION quarantine_expired_batches()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_quarantined_count INTEGER := 0;
    v_batch_record RECORD;
BEGIN
    -- Find and quarantine expired batches
    FOR v_batch_record IN
        SELECT id, product_id, batch_number, quantity
        FROM product_batches
        WHERE status = 'active'
        AND expiry_date IS NOT NULL
        AND expiry_date < CURRENT_DATE
        AND quantity > 0
    LOOP
        -- Update batch status
        UPDATE product_batches 
        SET 
            status = 'expired',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = v_batch_record.id;
        
        -- Log the expiry
        INSERT INTO inventory_logs (
            product_id, batch_id, transaction_type, quantity_before,
            quantity_change, quantity_after, reason
        ) VALUES (
            v_batch_record.product_id, v_batch_record.id, 'expiry',
            v_batch_record.quantity, 0, v_batch_record.quantity,
            'Batch expired and quarantined: ' || v_batch_record.batch_number
        );
        
        v_quarantined_count := v_quarantined_count + 1;
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', true,
        'quarantined_batches', v_quarantined_count
    );
END;
$$;

-- ========================================
-- 6. GRANT PERMISSIONS
-- ========================================

GRANT EXECUTE ON FUNCTION add_product_batch_enhanced(UUID, INTEGER, VARCHAR, DATE, DECIMAL, VARCHAR, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_batches_enhanced(UUID, VARCHAR, VARCHAR, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION process_sale_fefo_enhanced(UUID, INTEGER, UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION adjust_batch_quantity(INTEGER, INTEGER, TEXT, VARCHAR, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION quarantine_expired_batches() TO authenticated;

-- ========================================
-- 7. SETUP COMPLETE MESSAGE
-- ========================================

SELECT 
    '🚀 ENHANCED BATCH MANAGEMENT SYSTEM INSTALLED!' as message,
    'All functions ready for production use' as status,
    CURRENT_TIMESTAMP as installed_at;