-- ================================================================
-- BATCH MANAGEMENT - COMPLETE MIGRATION FIX
-- ================================================================
-- This script adds complete batch management functionality to your
-- existing medicine structure and fixes all missing functions
-- ================================================================

BEGIN;

-- ================================================================
-- 1. BATCH MANAGEMENT TABLES
-- ================================================================

-- Create product_batches table if not exists
CREATE TABLE IF NOT EXISTS product_batches (
    id BIGSERIAL PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    batch_number TEXT,
    quantity INTEGER NOT NULL CHECK (quantity >= 0),
    original_quantity INTEGER DEFAULT 0,
    reserved_quantity INTEGER DEFAULT 0,
    expiry_date DATE,
    manufacture_date DATE,
    supplier_name TEXT,
    supplier_batch_id TEXT,
    cost_per_unit DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'depleted', 'quarantined')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    
    -- Constraints
    CONSTRAINT unique_batch_per_product UNIQUE(product_id, batch_number, expiry_date)
);

-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_batches' AND column_name = 'status') THEN
        ALTER TABLE product_batches ADD COLUMN status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'depleted', 'quarantined'));
    END IF;
    
    -- Add original_quantity column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_batches' AND column_name = 'original_quantity') THEN
        ALTER TABLE product_batches ADD COLUMN original_quantity INTEGER DEFAULT 0;
    END IF;
    
    -- Add reserved_quantity column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_batches' AND column_name = 'reserved_quantity') THEN
        ALTER TABLE product_batches ADD COLUMN reserved_quantity INTEGER DEFAULT 0;
    END IF;
    
    -- Add manufacture_date column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_batches' AND column_name = 'manufacture_date') THEN
        ALTER TABLE product_batches ADD COLUMN manufacture_date DATE;
    END IF;
    
    -- Add supplier_batch_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_batches' AND column_name = 'supplier_batch_id') THEN
        ALTER TABLE product_batches ADD COLUMN supplier_batch_id TEXT;
    END IF;
    
    -- Add cost_per_unit column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_batches' AND column_name = 'cost_per_unit') THEN
        ALTER TABLE product_batches ADD COLUMN cost_per_unit DECIMAL(10,2) DEFAULT 0;
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_batches' AND column_name = 'updated_at') THEN
        ALTER TABLE product_batches ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    -- Add created_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_batches' AND column_name = 'created_by') THEN
        ALTER TABLE product_batches ADD COLUMN created_by UUID REFERENCES users(id);
    END IF;
END $$;

-- Create inventory_logs table if not exists
CREATE TABLE IF NOT EXISTS inventory_logs (
    id BIGSERIAL PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    batch_id BIGINT REFERENCES product_batches(id) ON DELETE SET NULL,
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment', 'expired', 'quarantined')),
    quantity_change INTEGER NOT NULL,
    quantity_before INTEGER NOT NULL DEFAULT 0,
    quantity_after INTEGER NOT NULL DEFAULT 0,
    unit_cost DECIMAL(10,2) DEFAULT 0,
    total_cost DECIMAL(10,2) DEFAULT 0,
    reference_type VARCHAR(50),
    reference_id UUID,
    notes TEXT,
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 2. INDEXES FOR PERFORMANCE
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_product_batches_product_id ON product_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_product_batches_expiry_date ON product_batches(expiry_date);
CREATE INDEX IF NOT EXISTS idx_product_batches_status ON product_batches(status);
CREATE INDEX IF NOT EXISTS idx_product_batches_created_at ON product_batches(created_at);
CREATE INDEX IF NOT EXISTS idx_product_batches_supplier ON product_batches(supplier_name);

CREATE INDEX IF NOT EXISTS idx_inventory_logs_product_id ON inventory_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_batch_id ON inventory_logs(batch_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_movement_type ON inventory_logs(movement_type);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_created_at ON inventory_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_reference ON inventory_logs(reference_type, reference_id);

-- ================================================================
-- 3. RLS POLICIES
-- ================================================================

ALTER TABLE product_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view product batches" ON product_batches;
DROP POLICY IF EXISTS "Authenticated users can insert product batches" ON product_batches;
DROP POLICY IF EXISTS "Authenticated users can update product batches" ON product_batches;
DROP POLICY IF EXISTS "Admin users can delete product batches" ON product_batches;

DROP POLICY IF EXISTS "Users can view inventory logs" ON inventory_logs;
DROP POLICY IF EXISTS "System can insert inventory logs" ON inventory_logs;

-- Create RLS policies for product_batches
CREATE POLICY "Users can view product batches" ON product_batches FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert product batches" ON product_batches FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update product batches" ON product_batches FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete product batches" ON product_batches FOR DELETE USING (true);

-- Create RLS policies for inventory_logs
CREATE POLICY "Users can view inventory logs" ON inventory_logs FOR SELECT USING (true);
CREATE POLICY "System can insert inventory logs" ON inventory_logs FOR INSERT WITH CHECK (true);

-- ================================================================
-- 4. CORE BATCH FUNCTIONS (MEDICINE STRUCTURE COMPATIBLE)
-- ================================================================

-- Function: Generate batch number
CREATE OR REPLACE FUNCTION generate_batch_number()
RETURNS TEXT AS $$
DECLARE
    batch_date TEXT;
    sequence_num INTEGER;
    batch_number TEXT;
BEGIN
    -- Format: BT + DDMMYY + sequence
    batch_date := TO_CHAR(CURRENT_DATE, 'DDMMYY');
    
    -- Get next sequence number for today
    SELECT COUNT(*) + 1 INTO sequence_num
    FROM product_batches 
    WHERE batch_number LIKE 'BT' || batch_date || '%'
    AND created_at::DATE = CURRENT_DATE;
    
    -- Pad sequence to 3 digits
    batch_number := 'BT' || batch_date || '-' || LPAD(sequence_num::TEXT, 3, '0');
    
    RETURN batch_number;
END;
$$ LANGUAGE plpgsql;

-- Function: Add product batch with medicine structure support
CREATE OR REPLACE FUNCTION add_product_batch(
    p_product_id UUID,
    p_quantity INTEGER,
    p_batch_number TEXT DEFAULT NULL,
    p_expiry_date DATE DEFAULT NULL,
    p_supplier_name TEXT DEFAULT NULL,
    p_cost_per_unit DECIMAL DEFAULT 0,
    p_notes TEXT DEFAULT NULL
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
    v_brand_name TEXT;
    v_generic_name TEXT;
    v_final_batch_number TEXT;
    v_notes TEXT;
BEGIN
    -- Get current user ID (from auth or first user)
    SELECT COALESCE(auth.uid(), (SELECT id FROM users LIMIT 1)) INTO v_user_id;
    
    -- Validate product exists and get current stock + medicine names
    SELECT 
        stock_in_pieces, 
        name,
        COALESCE(brand_name, name) as brand,
        COALESCE(generic_name, name) as generic
    INTO v_old_stock, v_product_name, v_brand_name, v_generic_name
    FROM products 
    WHERE id = p_product_id AND is_active = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product with ID % not found or is inactive', p_product_id;
    END IF;
    
    -- Validate quantity
    IF p_quantity <= 0 THEN
        RAISE EXCEPTION 'Quantity must be greater than 0';
    END IF;
    
    -- Generate batch number if not provided
    v_final_batch_number := COALESCE(p_batch_number, generate_batch_number());
    
    -- Start transaction
    BEGIN
        -- 1. INSERT new batch record
        INSERT INTO product_batches (
            product_id,
            batch_number,
            quantity,
            original_quantity,
            expiry_date,
            supplier_name,
            cost_per_unit,
            notes,
            created_by
        ) VALUES (
            p_product_id,
            v_final_batch_number,
            p_quantity,
            p_quantity,
            p_expiry_date,
            p_supplier_name,
            p_cost_per_unit,
            p_notes,
            v_user_id
        ) RETURNING id INTO v_batch_id;
        
        -- 2. UPDATE total stock in products table
        SELECT COALESCE(SUM(quantity), 0)
        INTO v_new_stock
        FROM product_batches
        WHERE product_id = p_product_id 
        AND (status = 'active' OR status IS NULL); -- Handle cases where status might not exist yet
        
        UPDATE products
        SET 
            stock_in_pieces = v_new_stock,
            updated_at = NOW()
        WHERE id = p_product_id;
        
        -- 3. INSERT audit log entry
        v_notes := 'New batch added: ' || v_final_batch_number;
        IF p_supplier_name IS NOT NULL THEN
            v_notes := v_notes || ' from ' || p_supplier_name;
        END IF;
        IF p_expiry_date IS NOT NULL THEN
            v_notes := v_notes || ' (expires: ' || p_expiry_date || ')';
        END IF;
        
        INSERT INTO inventory_logs (
            product_id,
            batch_id,
            movement_type,
            quantity_change,
            quantity_before,
            quantity_after,
            unit_cost,
            total_cost,
            notes,
            user_id,
            reference_type,
            reference_id
        ) VALUES (
            p_product_id,
            v_batch_id,
            'in',
            p_quantity,
            v_old_stock,
            v_new_stock,
            p_cost_per_unit,
            p_quantity * p_cost_per_unit,
            v_notes,
            v_user_id,
            'batch_create',
            v_batch_id::UUID
        );
        
        -- Return success response with medicine names
        RETURN jsonb_build_object(
            'success', true,
            'batch_id', v_batch_id,
            'batch_number', v_final_batch_number,
            'product_name', v_product_name,
            'brand_name', v_brand_name,
            'generic_name', v_generic_name,
            'old_stock', v_old_stock,
            'new_stock', v_new_stock,
            'quantity_added', p_quantity,
            'message', 'Batch added successfully'
        );
        
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to add batch: %', SQLERRM;
    END;
END;
$$;

-- Function: Get all batches with medicine structure support
CREATE OR REPLACE FUNCTION get_all_batches(
    p_product_id UUID DEFAULT NULL,
    p_status VARCHAR DEFAULT NULL,
    p_expiry_filter VARCHAR DEFAULT NULL,
    p_limit INTEGER DEFAULT 500
)
RETURNS TABLE (
    batch_id BIGINT,
    product_id UUID,
    product_name TEXT,
    product_brand_name TEXT,
    product_generic_name TEXT,
    product_dosage_strength TEXT,
    product_dosage_form TEXT,
    product_manufacturer TEXT,
    product_drug_classification TEXT,
    batch_number TEXT,
    quantity INTEGER,
    original_quantity INTEGER,
    reserved_quantity INTEGER,
    expiry_date DATE,
    manufacture_date DATE,
    supplier_name TEXT,
    cost_per_unit DECIMAL,
    total_value DECIMAL,
    status VARCHAR,
    created_at TIMESTAMPTZ,
    days_until_expiry INTEGER,
    category_name TEXT,
    is_expired BOOLEAN,
    is_expiring_soon BOOLEAN
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
        COALESCE(p.name, 'Unknown Product') as product_name,
        COALESCE(p.brand_name, p.name) as product_brand_name,
        COALESCE(p.generic_name, p.name) as product_generic_name,
        p.dosage_strength as product_dosage_strength,
        p.dosage_form as product_dosage_form,
        p.manufacturer as product_manufacturer,
        p.drug_classification as product_drug_classification,
        pb.batch_number,
        pb.quantity,
        pb.original_quantity,
        pb.reserved_quantity,
        pb.expiry_date,
        pb.manufacture_date,
        pb.supplier_name,
        pb.cost_per_unit,
        (pb.quantity * COALESCE(pb.cost_per_unit, 0)) as total_value,
        pb.status,
        pb.created_at,
        CASE 
            WHEN pb.expiry_date IS NOT NULL 
            THEN EXTRACT(DAYS FROM (pb.expiry_date - CURRENT_DATE))::INTEGER
            ELSE NULL
        END as days_until_expiry,
        COALESCE(p.category, c.name) as category_name,
        CASE 
            WHEN pb.expiry_date IS NOT NULL AND pb.expiry_date < CURRENT_DATE 
            THEN true 
            ELSE false 
        END as is_expired,
        CASE 
            WHEN pb.expiry_date IS NOT NULL 
                AND pb.expiry_date >= CURRENT_DATE 
                AND pb.expiry_date <= CURRENT_DATE + INTERVAL '30 days'
            THEN true 
            ELSE false 
        END as is_expiring_soon
    FROM product_batches pb
    LEFT JOIN products p ON pb.product_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE 
        (p_product_id IS NULL OR pb.product_id = p_product_id)
        AND (p_status IS NULL OR pb.status = p_status OR (p_status = 'active' AND pb.status IS NULL))
        AND (
            p_expiry_filter IS NULL 
            OR p_expiry_filter = 'all'
            OR (p_expiry_filter = 'expired' AND pb.expiry_date < CURRENT_DATE)
            OR (p_expiry_filter = 'expiring' AND pb.expiry_date >= CURRENT_DATE AND pb.expiry_date <= CURRENT_DATE + INTERVAL '30 days')
            OR (p_expiry_filter = 'valid' AND (pb.expiry_date IS NULL OR pb.expiry_date > CURRENT_DATE + INTERVAL '30 days'))
        )
        AND (p.is_active = true OR p.is_active IS NULL)
    ORDER BY 
        CASE WHEN pb.expiry_date IS NULL THEN 1 ELSE 0 END,
        pb.expiry_date ASC,
        COALESCE(p.brand_name, p.name) ASC,
        pb.created_at DESC
    LIMIT p_limit;
END;
$$;

-- Function: Get enhanced batches (same as get_all_batches but with different signature)
CREATE OR REPLACE FUNCTION get_all_batches_enhanced(
    p_expiry_filter VARCHAR DEFAULT NULL,
    p_limit INTEGER DEFAULT 500,
    p_product_id UUID DEFAULT NULL,
    p_status VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    batch_id BIGINT,
    product_id UUID,
    product_name TEXT,
    product_brand_name TEXT,
    product_generic_name TEXT,
    product_dosage_strength TEXT,
    product_dosage_form TEXT,
    product_manufacturer TEXT,
    product_drug_classification TEXT,
    batch_number TEXT,
    quantity INTEGER,
    original_quantity INTEGER,
    reserved_quantity INTEGER,
    expiry_date DATE,
    manufacture_date DATE,
    supplier_name TEXT,
    cost_per_unit DECIMAL,
    total_value DECIMAL,
    status VARCHAR,
    created_at TIMESTAMPTZ,
    days_until_expiry INTEGER,
    category_name TEXT,
    is_expired BOOLEAN,
    is_expiring_soon BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM get_all_batches(p_product_id, p_status, p_expiry_filter, p_limit);
END;
$$;

-- Function: Get batches for specific product
CREATE OR REPLACE FUNCTION get_batches_for_product(p_product_id UUID)
RETURNS TABLE (
    batch_id BIGINT,
    batch_number TEXT,
    quantity INTEGER,
    original_quantity INTEGER,
    expiry_date DATE,
    supplier_name TEXT,
    cost_per_unit DECIMAL,
    status VARCHAR,
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
        pb.original_quantity,
        pb.expiry_date,
        pb.supplier_name,
        pb.cost_per_unit,
        pb.status,
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

-- Function: Update batch quantity
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
    v_brand_name TEXT;
    v_generic_name TEXT;
BEGIN
    -- Get current user ID
    SELECT COALESCE(auth.uid(), (SELECT id FROM users LIMIT 1)) INTO v_user_id;
    
    -- Validate new quantity
    IF p_new_quantity < 0 THEN
        RAISE EXCEPTION 'Quantity cannot be negative';
    END IF;
    
    -- Get batch and product info
    SELECT 
        pb.product_id, 
        pb.quantity, 
        COALESCE(p.name, 'Unknown'),
        COALESCE(p.brand_name, p.name),
        COALESCE(p.generic_name, p.name)
    INTO v_product_id, v_old_quantity, v_product_name, v_brand_name, v_generic_name
    FROM product_batches pb
    LEFT JOIN products p ON pb.product_id = p.id
    WHERE pb.id = p_batch_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Batch with ID % not found', p_batch_id;
    END IF;
    
    v_quantity_change := p_new_quantity - v_old_quantity;
    
    BEGIN
        -- Update batch quantity
        UPDATE product_batches
        SET 
            quantity = p_new_quantity,
            status = CASE 
                WHEN p_new_quantity = 0 THEN 'depleted'
                WHEN expiry_date < CURRENT_DATE THEN 'expired'
                ELSE COALESCE(status, 'active')
            END,
            updated_at = COALESCE(updated_at, NOW())
        WHERE id = p_batch_id;
        
        -- Recalculate total stock
        SELECT COALESCE(SUM(quantity), 0)
        INTO v_new_total_stock
        FROM product_batches
        WHERE product_id = v_product_id 
        AND (status = 'active' OR status IS NULL); -- Handle cases where status might not exist yet
        
        -- Update product total stock
        UPDATE products
        SET 
            stock_in_pieces = v_new_total_stock,
            updated_at = NOW()
        WHERE id = v_product_id;
        
        -- Log the change
        INSERT INTO inventory_logs (
            product_id,
            batch_id,
            movement_type,
            quantity_change,
            quantity_before,
            quantity_after,
            notes,
            user_id,
            reference_type,
            reference_id
        ) VALUES (
            v_product_id,
            p_batch_id,
            'adjustment',
            v_quantity_change,
            v_old_quantity,
            p_new_quantity,
            p_reason || ' (Batch ID: ' || p_batch_id || ')',
            v_user_id,
            'batch_adjustment',
            p_batch_id::UUID
        );
        
        RETURN jsonb_build_object(
            'success', true,
            'batch_id', p_batch_id,
            'product_name', v_product_name,
            'brand_name', v_brand_name,
            'generic_name', v_generic_name,
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

-- Function: Get batch analytics
CREATE OR REPLACE FUNCTION get_batch_analytics()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'totalBatches', COALESCE((SELECT COUNT(*) FROM product_batches), 0),
        'activeBatches', COALESCE((SELECT COUNT(*) FROM product_batches WHERE status = 'active' OR status IS NULL), 0),
        'expiredBatches', COALESCE((SELECT COUNT(*) FROM product_batches WHERE expiry_date < CURRENT_DATE), 0),
        'expiringBatches', COALESCE((
            SELECT COUNT(*) 
            FROM product_batches 
            WHERE expiry_date >= CURRENT_DATE 
            AND expiry_date <= CURRENT_DATE + INTERVAL '30 days'
        ), 0),
        'depletedBatches', COALESCE((SELECT COUNT(*) FROM product_batches WHERE quantity = 0), 0),
        'totalValue', COALESCE((
            SELECT SUM(quantity * COALESCE(cost_per_unit, 0)) 
            FROM product_batches 
            WHERE (status = 'active' OR status IS NULL)
        ), 0),
        'uniqueProducts', COALESCE((
            SELECT COUNT(DISTINCT product_id) 
            FROM product_batches
        ), 0),
        'averageBatchSize', COALESCE((
            SELECT AVG(quantity) 
            FROM product_batches 
            WHERE (status = 'active' OR status IS NULL)
        ), 0)
    ) INTO result;
    
    RETURN result;
END;
$$;

-- ================================================================
-- 5. TRIGGER FUNCTIONS
-- ================================================================

-- Function to update batch status based on expiry and quantity
CREATE OR REPLACE FUNCTION update_batch_status_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-update status based on quantity and expiry (only if status column exists)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_batches' AND column_name = 'status') THEN
        NEW.status := CASE 
            WHEN NEW.quantity = 0 THEN 'depleted'
            WHEN NEW.expiry_date IS NOT NULL AND NEW.expiry_date < CURRENT_DATE THEN 'expired'
            ELSE COALESCE(NEW.status, 'active')
        END;
    END IF;
    
    -- Update timestamp if column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_batches' AND column_name = 'updated_at') THEN
        NEW.updated_at := NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for batch status updates
DROP TRIGGER IF EXISTS trigger_update_batch_status ON product_batches;
CREATE TRIGGER trigger_update_batch_status
    BEFORE UPDATE ON product_batches
    FOR EACH ROW EXECUTE FUNCTION update_batch_status_trigger();

-- ================================================================
-- 6. GRANT PERMISSIONS
-- ================================================================

GRANT EXECUTE ON FUNCTION generate_batch_number() TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION add_product_batch(UUID, INTEGER, TEXT, DATE, TEXT, DECIMAL, TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION get_all_batches(UUID, VARCHAR, VARCHAR, INTEGER) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION get_all_batches_enhanced(VARCHAR, INTEGER, UUID, VARCHAR) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION get_batches_for_product(UUID) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION update_batch_quantity(BIGINT, INTEGER, TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION get_batch_analytics() TO authenticated, anon, service_role;

-- ================================================================
-- 7. DATA MIGRATION (if needed)
-- ================================================================

-- Migrate existing product stock to batches (if products exist with stock)
DO $$
DECLARE
    product_record RECORD;
    batch_number TEXT;
BEGIN
    -- Only migrate products that have stock but no batches
    FOR product_record IN 
        SELECT p.id, p.stock_in_pieces, COALESCE(p.brand_name, p.name) as name
        FROM products p
        WHERE p.stock_in_pieces > 0 
        AND p.is_active = true
        AND NOT EXISTS (SELECT 1 FROM product_batches pb WHERE pb.product_id = p.id)
        LIMIT 50 -- Limit for safety
    LOOP
        -- Generate batch number for migration
        batch_number := 'MIGRATED-' || TO_CHAR(CURRENT_DATE, 'DDMMYY') || '-' || SUBSTRING(product_record.id::TEXT, 1, 8);
        
        -- Create batch for existing stock
        INSERT INTO product_batches (
            product_id,
            batch_number,
            quantity,
            original_quantity,
            notes,
            status
        ) VALUES (
            product_record.id,
            batch_number,
            product_record.stock_in_pieces,
            product_record.stock_in_pieces,
            'Migrated from existing stock on ' || CURRENT_DATE,
            'active'
        );
        
        -- Update original_quantity if it was added later
        UPDATE product_batches 
        SET original_quantity = quantity 
        WHERE product_id = product_record.id 
        AND batch_number = batch_number
        AND original_quantity = 0;
        
        -- Log the migration
        INSERT INTO inventory_logs (
            product_id,
            movement_type,
            quantity_change,
            quantity_before,
            quantity_after,
            notes,
            reference_type
        ) VALUES (
            product_record.id,
            'in',
            product_record.stock_in_pieces,
            0,
            product_record.stock_in_pieces,
            'Stock migrated to batch system: ' || batch_number,
            'migration'
        );
    END LOOP;
END;
$$;

COMMIT;

-- ================================================================
-- 8. VERIFICATION AND COMPLETION MESSAGE
-- ================================================================

DO $$ 
DECLARE
    batch_count INTEGER;
    function_count INTEGER;
BEGIN
    -- Count created batches
    SELECT COUNT(*) INTO batch_count FROM product_batches;
    
    -- Count created functions
    SELECT COUNT(*) INTO function_count 
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name IN ('add_product_batch', 'get_all_batches', 'get_all_batches_enhanced', 'get_batches_for_product', 'update_batch_quantity', 'get_batch_analytics');
    
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'BATCH MANAGEMENT MIGRATION COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'Tables Created: product_batches, inventory_logs';
    RAISE NOTICE 'Functions Created: % batch management functions', function_count;
    RAISE NOTICE 'Batches Created: % (including migrated stock)', batch_count;
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'Your batch management system is now fully integrated with your';
    RAISE NOTICE 'medicine data structure (brand_name, generic_name, etc.)';
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '1. Refresh your frontend application';
    RAISE NOTICE '2. Test batch creation in the UI';
    RAISE NOTICE '3. Verify product display shows medicine names correctly';
    RAISE NOTICE '================================================================';
END $$;