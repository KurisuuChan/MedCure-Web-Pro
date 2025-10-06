-- ================================================================
-- BATCH MANAGEMENT - SCHEMA-AWARE MIGRATION
-- ================================================================
-- This script works with your existing schema structure
-- Tables: batch_inventory, batches, product_batches
-- ================================================================

BEGIN;

-- ================================================================
-- 1. ENSURE ALL REQUIRED COLUMNS EXIST
-- ================================================================

-- Update product_batches table to match our needs
DO $$
BEGIN
    -- Add missing columns to product_batches if they don't exist
    
    -- Add supplier_name column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_batches' AND column_name = 'supplier_name') THEN
        ALTER TABLE product_batches ADD COLUMN supplier_name TEXT;
    END IF;
    
    -- Add notes column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_batches' AND column_name = 'notes') THEN
        ALTER TABLE product_batches ADD COLUMN notes TEXT;
    END IF;
    
    -- Add original_quantity column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_batches' AND column_name = 'original_quantity') THEN
        ALTER TABLE product_batches ADD COLUMN original_quantity INTEGER DEFAULT 0;
    END IF;
    
    -- Add reserved_quantity column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_batches' AND column_name = 'reserved_quantity') THEN
        ALTER TABLE product_batches ADD COLUMN reserved_quantity INTEGER DEFAULT 0;
    END IF;
    
    -- Add status column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_batches' AND column_name = 'status') THEN
        ALTER TABLE product_batches ADD COLUMN status VARCHAR(20) DEFAULT 'active';
        ALTER TABLE product_batches ADD CONSTRAINT check_status CHECK (status IN ('active', 'expired', 'depleted', 'quarantined'));
    END IF;
    
    -- Add manufacture_date column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_batches' AND column_name = 'manufacture_date') THEN
        ALTER TABLE product_batches ADD COLUMN manufacture_date DATE;
    END IF;
    
    -- Add supplier_batch_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_batches' AND column_name = 'supplier_batch_id') THEN
        ALTER TABLE product_batches ADD COLUMN supplier_batch_id TEXT;
    END IF;
    
    -- Add created_by column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_batches' AND column_name = 'created_by') THEN
        ALTER TABLE product_batches ADD COLUMN created_by UUID REFERENCES users(id);
    END IF;
    
    -- Fix quantity constraint (remove > 0, allow 0 for depleted batches)
    BEGIN
        ALTER TABLE product_batches DROP CONSTRAINT IF EXISTS product_batches_quantity_check;
        ALTER TABLE product_batches ADD CONSTRAINT product_batches_quantity_check CHECK (quantity >= 0);
    EXCEPTION WHEN OTHERS THEN
        -- Constraint might not exist, ignore
    END;
    
END $$;

-- ================================================================
-- 2. CREATE ENHANCED BATCH FUNCTIONS FOR YOUR SCHEMA
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

-- Function: Get all batches enhanced (works with your schema)
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
        COALESCE(p.generic_name, p.brand_name, 'Unknown Product') as product_name,
        COALESCE(p.brand_name, p.generic_name) as product_brand_name,
        COALESCE(p.generic_name, p.brand_name) as product_generic_name,
        p.dosage_strength as product_dosage_strength,
        p.dosage_form::TEXT as product_dosage_form,
        p.manufacturer as product_manufacturer,
        p.drug_classification::TEXT as product_drug_classification,
        pb.batch_number,
        pb.quantity,
        COALESCE(pb.original_quantity, pb.quantity) as original_quantity,
        COALESCE(pb.reserved_quantity, 0) as reserved_quantity,
        pb.expiry_date,
        pb.manufacture_date,
        pb.supplier_name,
        pb.cost_per_unit,
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
        COALESCE(p.brand_name, p.generic_name) ASC,
        pb.created_at DESC
    LIMIT p_limit;
END;
$$;

-- Function: Add product batch (works with your schema)
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
    -- Get current user ID (try auth.uid() first, fallback to first user)
    SELECT COALESCE(auth.uid(), (SELECT id FROM users LIMIT 1)) INTO v_user_id;
    
    -- Validate product exists and get current stock + medicine names
    SELECT 
        stock_in_pieces, 
        COALESCE(generic_name, brand_name),
        brand_name,
        generic_name
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
            created_by,
            status
        ) VALUES (
            p_product_id,
            v_final_batch_number,
            p_quantity,
            p_quantity,
            p_expiry_date,
            p_supplier_name,
            p_cost_per_unit,
            p_notes,
            v_user_id,
            'active'
        ) RETURNING id INTO v_batch_id;
        
        -- 2. UPDATE total stock in products table
        SELECT COALESCE(SUM(quantity), 0)
        INTO v_new_stock
        FROM product_batches
        WHERE product_id = p_product_id 
        AND COALESCE(status, 'active') = 'active';
        
        UPDATE products
        SET 
            stock_in_pieces = v_new_stock,
            updated_at = NOW()
        WHERE id = p_product_id;
        
        -- 3. INSERT audit log entry (using your existing inventory_logs table)
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
            quantity_change,
            new_quantity,
            notes,
            user_id,
            created_by,
            change_type,
            new_stock_level
        ) VALUES (
            p_product_id,
            v_batch_id,
            p_quantity,
            v_new_stock,
            v_notes,
            v_user_id,
            v_user_id,
            'batch_add',
            v_new_stock
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

-- Function: Get batch analytics (works with your schema)
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
-- 3. CREATE INDEXES FOR PERFORMANCE
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

-- ================================================================
-- 4. ENABLE RLS POLICIES
-- ================================================================

ALTER TABLE product_batches ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view product batches" ON product_batches;
DROP POLICY IF EXISTS "Authenticated users can insert product batches" ON product_batches;
DROP POLICY IF EXISTS "Authenticated users can update product batches" ON product_batches;
DROP POLICY IF EXISTS "Authenticated users can delete product batches" ON product_batches;

-- Create RLS policies for product_batches
CREATE POLICY "Users can view product batches" ON product_batches FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert product batches" ON product_batches FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update product batches" ON product_batches FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete product batches" ON product_batches FOR DELETE USING (true);

-- ================================================================
-- 5. GRANT PERMISSIONS
-- ================================================================

GRANT EXECUTE ON FUNCTION generate_batch_number() TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION get_all_batches_enhanced(VARCHAR, INTEGER, UUID, VARCHAR) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION add_product_batch(UUID, INTEGER, TEXT, DATE, TEXT, DECIMAL, TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION get_batch_analytics() TO authenticated, anon, service_role;

COMMIT;

-- ================================================================
-- 6. COMPLETION MESSAGE
-- ================================================================

DO $$ 
DECLARE
    batch_count INTEGER;
    function_count INTEGER;
    column_count INTEGER;
BEGIN
    -- Count existing batches
    SELECT COUNT(*) INTO batch_count FROM product_batches;
    
    -- Count created functions
    SELECT COUNT(*) INTO function_count 
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name IN ('get_all_batches_enhanced', 'get_batch_analytics', 'generate_batch_number', 'add_product_batch');
    
    -- Count columns in product_batches
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns 
    WHERE table_name = 'product_batches';
    
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'BATCH MANAGEMENT SCHEMA-AWARE MIGRATION COMPLETED!';
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'Enhanced product_batches table with % columns', column_count;
    RAISE NOTICE 'Functions Created: % batch management functions', function_count;
    RAISE NOTICE 'Existing Batches: %', batch_count;
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'Your batch management system now supports:';
    RAISE NOTICE '• Medicine structure (brand_name, generic_name, dosage)';
    RAISE NOTICE '• Advanced filtering and search';
    RAISE NOTICE '• Professional pagination';
    RAISE NOTICE '• Batch analytics and reporting';
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '1. Refresh your frontend application (Ctrl+Shift+R)';
    RAISE NOTICE '2. Navigate to Batch Management page';
    RAISE NOTICE '3. Test new features and search functionality';
    RAISE NOTICE '================================================================';
END $$;