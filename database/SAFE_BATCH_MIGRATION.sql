-- ================================================================
-- BATCH MANAGEMENT - SAFE MIGRATION SCRIPT
-- ================================================================
-- This script safely adds batch management functionality 
-- regardless of your existing table structure
-- ================================================================

BEGIN;

-- ================================================================
-- 1. SAFE TABLE CREATION AND COLUMN ADDITIONS
-- ================================================================

-- Create product_batches table if not exists (minimal version first)
CREATE TABLE IF NOT EXISTS product_batches (
    id BIGSERIAL PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    batch_number TEXT,
    quantity INTEGER NOT NULL CHECK (quantity >= 0) DEFAULT 0,
    expiry_date DATE,
    supplier_name TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns safely
DO $$
BEGIN
    -- Add status column if it doesn't exist
    BEGIN
        ALTER TABLE product_batches ADD COLUMN status VARCHAR(20) DEFAULT 'active';
        ALTER TABLE product_batches ADD CONSTRAINT check_status CHECK (status IN ('active', 'expired', 'depleted', 'quarantined'));
    EXCEPTION WHEN duplicate_column THEN
        -- Column already exists, skip
    END;
    
    -- Add original_quantity column if it doesn't exist
    BEGIN
        ALTER TABLE product_batches ADD COLUMN original_quantity INTEGER DEFAULT 0;
    EXCEPTION WHEN duplicate_column THEN
        -- Column already exists, skip
    END;
    
    -- Add reserved_quantity column if it doesn't exist
    BEGIN
        ALTER TABLE product_batches ADD COLUMN reserved_quantity INTEGER DEFAULT 0;
    EXCEPTION WHEN duplicate_column THEN
        -- Column already exists, skip
    END;
    
    -- Add manufacture_date column if it doesn't exist
    BEGIN
        ALTER TABLE product_batches ADD COLUMN manufacture_date DATE;
    EXCEPTION WHEN duplicate_column THEN
        -- Column already exists, skip
    END;
    
    -- Add supplier_batch_id column if it doesn't exist
    BEGIN
        ALTER TABLE product_batches ADD COLUMN supplier_batch_id TEXT;
    EXCEPTION WHEN duplicate_column THEN
        -- Column already exists, skip
    END;
    
    -- Add cost_per_unit column if it doesn't exist
    BEGIN
        ALTER TABLE product_batches ADD COLUMN cost_per_unit DECIMAL(10,2) DEFAULT 0;
    EXCEPTION WHEN duplicate_column THEN
        -- Column already exists, skip
    END;
    
    -- Add updated_at column if it doesn't exist
    BEGIN
        ALTER TABLE product_batches ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    EXCEPTION WHEN duplicate_column THEN
        -- Column already exists, skip
    END;
    
    -- Add created_by column if it doesn't exist
    BEGIN
        ALTER TABLE product_batches ADD COLUMN created_by UUID REFERENCES users(id);
    EXCEPTION WHEN duplicate_column THEN
        -- Column already exists, skip
    END;
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
CREATE INDEX IF NOT EXISTS idx_product_batches_created_at ON product_batches(created_at);
CREATE INDEX IF NOT EXISTS idx_product_batches_supplier ON product_batches(supplier_name);

-- Only create status index if column exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_batches' AND column_name = 'status') THEN
        CREATE INDEX IF NOT EXISTS idx_product_batches_status ON product_batches(status);
    END IF;
END $$;

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
DROP POLICY IF EXISTS "Authenticated users can delete product batches" ON product_batches;

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
-- 4. CORE BATCH FUNCTIONS (SAFE VERSION)
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

-- Function: Get all batches with medicine structure support (SAFE VERSION)
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
        COALESCE(pb.original_quantity, pb.quantity) as original_quantity,
        COALESCE(pb.reserved_quantity, 0) as reserved_quantity,
        pb.expiry_date,
        pb.manufacture_date,
        pb.supplier_name,
        COALESCE(pb.cost_per_unit, 0) as cost_per_unit,
        (pb.quantity * COALESCE(pb.cost_per_unit, 0)) as total_value,
        COALESCE(pb.status, 'active') as status,
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
        AND (p_status IS NULL OR COALESCE(pb.status, 'active') = p_status)
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

-- Function: Get batch analytics (SAFE VERSION)
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
        'activeBatches', COALESCE((SELECT COUNT(*) FROM product_batches WHERE COALESCE(status, 'active') = 'active'), 0),
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
            WHERE COALESCE(status, 'active') = 'active'
        ), 0),
        'uniqueProducts', COALESCE((
            SELECT COUNT(DISTINCT product_id) 
            FROM product_batches
        ), 0),
        'averageBatchSize', COALESCE((
            SELECT AVG(quantity) 
            FROM product_batches 
            WHERE COALESCE(status, 'active') = 'active'
        ), 0)
    ) INTO result;
    
    RETURN result;
END;
$$;

-- ================================================================
-- 5. GRANT PERMISSIONS
-- ================================================================

GRANT EXECUTE ON FUNCTION generate_batch_number() TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION get_all_batches_enhanced(VARCHAR, INTEGER, UUID, VARCHAR) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION get_batch_analytics() TO authenticated, anon, service_role;

COMMIT;

-- ================================================================
-- 6. COMPLETION MESSAGE
-- ================================================================

DO $$ 
DECLARE
    batch_count INTEGER;
    function_count INTEGER;
BEGIN
    -- Count existing batches
    SELECT COUNT(*) INTO batch_count FROM product_batches;
    
    -- Count created functions
    SELECT COUNT(*) INTO function_count 
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name IN ('get_all_batches_enhanced', 'get_batch_analytics', 'generate_batch_number');
    
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'BATCH MANAGEMENT MIGRATION COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'Tables Updated: product_batches, inventory_logs';
    RAISE NOTICE 'Functions Created: % batch management functions', function_count;
    RAISE NOTICE 'Existing Batches: %', batch_count;
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'Your batch management system is now ready!';
    RAISE NOTICE 'Medicine names (brand/generic) will display correctly.';
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '1. Refresh your frontend application';
    RAISE NOTICE '2. Test batch management functionality';
    RAISE NOTICE '================================================================';
END $$;