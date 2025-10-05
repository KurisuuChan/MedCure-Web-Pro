-- ========================================
-- 🏥 BATCH MANAGEMENT MIGRATION TO NEW MEDICINE STRUCTURE
-- ========================================
-- This migrates batch management to work with the new medicine data structure
-- Execute this in your Supabase SQL Editor

-- ========================================
-- 1. DROP EXISTING BATCH FUNCTIONS
-- ========================================

DROP FUNCTION IF EXISTS get_all_batches();
DROP FUNCTION IF EXISTS get_batches_for_product(UUID);
DROP FUNCTION IF EXISTS get_all_batches_enhanced();
DROP FUNCTION IF EXISTS get_batches_with_medicine_info(UUID);

-- ========================================
-- 2. CREATE ENHANCED BATCH FUNCTIONS WITH NEW MEDICINE STRUCTURE
-- ========================================

-- Function to get all batches with complete medicine information
CREATE OR REPLACE FUNCTION get_all_batches_enhanced()
RETURNS TABLE (
    -- Batch Information
    id BIGINT,
    batch_id BIGINT, -- Alias for compatibility
    product_id UUID,
    batch_number TEXT,
    quantity INTEGER,
    original_quantity INTEGER,
    expiry_date DATE,
    days_to_expiry INTEGER,
    days_until_expiry INTEGER, -- Alias for compatibility
    status TEXT,
    created_at TIMESTAMPTZ,
    
    -- Product Basic Info (for compatibility)
    product_name TEXT,
    category TEXT,
    category_name TEXT,
    supplier TEXT,
    supplier_name TEXT,
    price_per_piece NUMERIC,
    
    -- New Medicine Structure
    generic_name VARCHAR,
    brand_name VARCHAR,
    dosage_strength VARCHAR,
    dosage_form dosage_form_enum,
    manufacturer TEXT,
    drug_classification drug_classification_enum,
    pharmacologic_category VARCHAR,
    storage_conditions TEXT,
    registration_number VARCHAR,
    
    -- Additional Product Fields for UI
    product_generic_name VARCHAR, -- Prefixed for batch display components
    product_brand_name VARCHAR,
    product_dosage_strength VARCHAR,
    product_dosage_form dosage_form_enum,
    product_manufacturer TEXT,
    product_drug_classification drug_classification_enum,
    
    -- Cost and Value Information
    cost_per_unit NUMERIC,
    cost_price NUMERIC,
    total_value NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        -- Batch Information
        pb.id,
        pb.id as batch_id,
        pb.product_id,
        pb.batch_number,
        pb.quantity,
        COALESCE(pb.quantity, pb.quantity) as original_quantity, -- Using quantity as original for now
        pb.expiry_date,
        CASE 
            WHEN pb.expiry_date IS NULL THEN NULL
            ELSE EXTRACT(DAY FROM pb.expiry_date - CURRENT_DATE)::INTEGER
        END as days_to_expiry,
        CASE 
            WHEN pb.expiry_date IS NULL THEN NULL
            ELSE EXTRACT(DAY FROM pb.expiry_date - CURRENT_DATE)::INTEGER
        END as days_until_expiry,
        CASE 
            WHEN pb.quantity = 0 THEN 'depleted'
            WHEN pb.expiry_date IS NULL THEN 'active'
            WHEN pb.expiry_date < CURRENT_DATE THEN 'expired'
            WHEN pb.expiry_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'critical'
            WHEN pb.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring'
            WHEN pb.expiry_date <= CURRENT_DATE + INTERVAL '90 days' THEN 'warning'
            ELSE 'active'
        END as status,
        pb.created_at,
        
        -- Product Basic Info (backward compatibility)
        COALESCE(p.generic_name, p.name) as product_name,
        COALESCE(cat.name, p.category) as category,
        COALESCE(cat.name, p.category) as category_name,
        COALESCE(sup.name, p.supplier) as supplier,
        COALESCE(sup.name, p.supplier) as supplier_name,
        p.price_per_piece,
        
        -- New Medicine Structure
        p.generic_name,
        p.brand_name,
        p.dosage_strength,
        p.dosage_form,
        p.manufacturer,
        p.drug_classification,
        p.pharmacologic_category,
        p.storage_conditions,
        p.registration_number,
        
        -- Prefixed versions for batch display components
        p.generic_name as product_generic_name,
        p.brand_name as product_brand_name,
        p.dosage_strength as product_dosage_strength,
        p.dosage_form as product_dosage_form,
        p.manufacturer as product_manufacturer,
        p.drug_classification as product_drug_classification,
        
        -- Cost and Value Information
        p.cost_price as cost_per_unit,
        p.cost_price,
        (pb.quantity * COALESCE(p.cost_price, p.price_per_piece, 0)) as total_value
        
    FROM product_batches pb
    JOIN products p ON pb.product_id = p.id
    LEFT JOIN categories cat ON p.category_id = cat.id
    LEFT JOIN suppliers sup ON p.supplier_id = sup.id
    WHERE p.is_active = true OR p.is_active IS NULL
    ORDER BY 
        -- Priority order: expired first, then expiring soon, then by expiry date
        CASE 
            WHEN pb.expiry_date IS NULL THEN 5
            WHEN pb.expiry_date < CURRENT_DATE THEN 1
            WHEN pb.expiry_date <= CURRENT_DATE + INTERVAL '7 days' THEN 2
            WHEN pb.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 3
            ELSE 4
        END,
        pb.expiry_date ASC NULLS LAST,
        pb.created_at DESC;
END;
$$;

-- Function to get batches for a specific product with medicine information
CREATE OR REPLACE FUNCTION get_batches_with_medicine_info(p_product_id UUID)
RETURNS TABLE (
    -- Batch Information
    id BIGINT,
    batch_id BIGINT,
    product_id UUID,
    batch_number TEXT,
    quantity INTEGER,
    original_quantity INTEGER,
    expiry_date DATE,
    days_to_expiry INTEGER,
    days_until_expiry INTEGER,
    status TEXT,
    created_at TIMESTAMPTZ,
    
    -- Medicine Information
    generic_name VARCHAR,
    brand_name VARCHAR,
    dosage_strength VARCHAR,
    dosage_form dosage_form_enum,
    manufacturer TEXT,
    drug_classification drug_classification_enum,
    category_name TEXT,
    price_per_piece NUMERIC,
    cost_price NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pb.id,
        pb.id as batch_id,
        pb.product_id,
        pb.batch_number,
        pb.quantity,
        COALESCE(pb.quantity, pb.quantity) as original_quantity,
        pb.expiry_date,
        CASE 
            WHEN pb.expiry_date IS NULL THEN NULL
            ELSE EXTRACT(DAY FROM pb.expiry_date - CURRENT_DATE)::INTEGER
        END as days_to_expiry,
        CASE 
            WHEN pb.expiry_date IS NULL THEN NULL
            ELSE EXTRACT(DAY FROM pb.expiry_date - CURRENT_DATE)::INTEGER
        END as days_until_expiry,
        CASE 
            WHEN pb.quantity = 0 THEN 'depleted'
            WHEN pb.expiry_date IS NULL THEN 'active'
            WHEN pb.expiry_date < CURRENT_DATE THEN 'expired'
            WHEN pb.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring'
            ELSE 'active'
        END as status,
        pb.created_at,
        
        -- Medicine Information
        p.generic_name,
        p.brand_name,
        p.dosage_strength,
        p.dosage_form,
        p.manufacturer,
        p.drug_classification,
        COALESCE(cat.name, p.category) as category_name,
        p.price_per_piece,
        p.cost_price
        
    FROM product_batches pb
    JOIN products p ON pb.product_id = p.id
    LEFT JOIN categories cat ON p.category_id = cat.id
    WHERE pb.product_id = p_product_id
    ORDER BY pb.expiry_date ASC NULLS LAST, pb.created_at DESC;
END;
$$;

-- Legacy function for backward compatibility (maps to new function)
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
        enhanced.id,
        enhanced.product_id,
        enhanced.product_name,
        enhanced.batch_number,
        enhanced.quantity,
        enhanced.original_quantity,
        enhanced.expiry_date,
        enhanced.days_to_expiry,
        enhanced.status,
        enhanced.created_at
    FROM get_all_batches_enhanced() as enhanced;
END;
$$;

-- Legacy function for backward compatibility
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
        enhanced.id,
        enhanced.product_id,
        enhanced.batch_number,
        enhanced.quantity,
        enhanced.original_quantity,
        enhanced.expiry_date,
        enhanced.days_to_expiry,
        enhanced.status,
        enhanced.created_at
    FROM get_batches_with_medicine_info(p_product_id) as enhanced;
END;
$$;

-- ========================================
-- 3. CREATE ENHANCED SEARCH AND ANALYTICS FUNCTIONS
-- ========================================

-- Function to get expiring batches with medicine details
CREATE OR REPLACE FUNCTION get_expiring_batches(days_ahead INTEGER DEFAULT 30)
RETURNS TABLE (
    id BIGINT,
    product_id UUID,
    batch_number TEXT,
    quantity INTEGER,
    expiry_date DATE,
    days_to_expiry INTEGER,
    generic_name VARCHAR,
    brand_name VARCHAR,
    dosage_strength VARCHAR,
    manufacturer TEXT,
    category_name TEXT,
    total_value NUMERIC
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
        pb.expiry_date,
        EXTRACT(DAY FROM pb.expiry_date - CURRENT_DATE)::INTEGER as days_to_expiry,
        p.generic_name,
        p.brand_name,
        p.dosage_strength,
        p.manufacturer,
        COALESCE(cat.name, p.category) as category_name,
        (pb.quantity * COALESCE(p.cost_price, p.price_per_piece, 0)) as total_value
    FROM product_batches pb
    JOIN products p ON pb.product_id = p.id
    LEFT JOIN categories cat ON p.category_id = cat.id
    WHERE pb.expiry_date IS NOT NULL
    AND pb.expiry_date <= CURRENT_DATE + INTERVAL '1 day' * days_ahead
    AND pb.expiry_date >= CURRENT_DATE
    AND pb.quantity > 0
    ORDER BY pb.expiry_date ASC;
END;
$$;

-- Function to get batch analytics
CREATE OR REPLACE FUNCTION get_batch_analytics()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSON;
    v_total_batches INTEGER;
    v_active_batches INTEGER;
    v_expired_batches INTEGER;
    v_expiring_batches INTEGER;
    v_depleted_batches INTEGER;
    v_total_inventory_value NUMERIC;
    v_expired_value NUMERIC;
BEGIN
    -- Count batches by status
    SELECT 
        COUNT(*),
        COUNT(CASE WHEN pb.quantity > 0 AND (pb.expiry_date IS NULL OR pb.expiry_date > CURRENT_DATE) THEN 1 END),
        COUNT(CASE WHEN pb.expiry_date < CURRENT_DATE THEN 1 END),
        COUNT(CASE WHEN pb.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' THEN 1 END),
        COUNT(CASE WHEN pb.quantity = 0 THEN 1 END)
    INTO v_total_batches, v_active_batches, v_expired_batches, v_expiring_batches, v_depleted_batches
    FROM product_batches pb
    JOIN products p ON pb.product_id = p.id
    WHERE p.is_active = true OR p.is_active IS NULL;

    -- Calculate inventory values
    SELECT 
        COALESCE(SUM(pb.quantity * COALESCE(p.cost_price, p.price_per_piece, 0)), 0),
        COALESCE(SUM(CASE WHEN pb.expiry_date < CURRENT_DATE THEN pb.quantity * COALESCE(p.cost_price, p.price_per_piece, 0) ELSE 0 END), 0)
    INTO v_total_inventory_value, v_expired_value
    FROM product_batches pb
    JOIN products p ON pb.product_id = p.id
    WHERE p.is_active = true OR p.is_active IS NULL;

    v_result := json_build_object(
        'total_batches', v_total_batches,
        'active_batches', v_active_batches,
        'expired_batches', v_expired_batches,
        'expiring_batches', v_expiring_batches,
        'depleted_batches', v_depleted_batches,
        'total_inventory_value', v_total_inventory_value,
        'expired_value', v_expired_value,
        'active_value', v_total_inventory_value - v_expired_value
    );

    RETURN v_result;
END;
$$;

-- ========================================
-- 4. GRANT PERMISSIONS
-- ========================================

-- Grant execute permissions on new functions
GRANT EXECUTE ON FUNCTION get_all_batches_enhanced() TO authenticated;
GRANT EXECUTE ON FUNCTION get_batches_with_medicine_info(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_expiring_batches(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_batch_analytics() TO authenticated;

-- Ensure permissions on legacy functions
GRANT EXECUTE ON FUNCTION get_all_batches() TO authenticated;
GRANT EXECUTE ON FUNCTION get_batches_for_product(UUID) TO authenticated;

-- ========================================
-- 5. CREATE VIEW FOR BATCH MANAGEMENT UI
-- ========================================

-- Create a view that provides all necessary data for the batch management page
CREATE OR REPLACE VIEW batch_management_view AS
SELECT 
    pb.id as batch_id,
    pb.product_id,
    pb.batch_number,
    pb.quantity,
    pb.expiry_date,
    CASE 
        WHEN pb.expiry_date IS NULL THEN NULL
        ELSE EXTRACT(DAY FROM pb.expiry_date - CURRENT_DATE)::INTEGER
    END as days_until_expiry,
    CASE 
        WHEN pb.quantity = 0 THEN 'depleted'
        WHEN pb.expiry_date IS NULL THEN 'active'
        WHEN pb.expiry_date < CURRENT_DATE THEN 'expired'
        WHEN pb.expiry_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'critical'
        WHEN pb.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring'
        ELSE 'active'
    END as status,
    pb.created_at,
    
    -- New Medicine Structure
    p.generic_name as product_generic_name,
    p.brand_name as product_brand_name,
    p.dosage_strength as product_dosage_strength,
    p.dosage_form as product_dosage_form,
    p.manufacturer as product_manufacturer,
    p.drug_classification as product_drug_classification,
    
    -- Category and Supplier Info
    COALESCE(cat.name, p.category) as category_name,
    COALESCE(sup.name, p.supplier) as supplier_name,
    
    -- Pricing
    p.price_per_piece,
    p.cost_price as cost_per_unit,
    (pb.quantity * COALESCE(p.cost_price, p.price_per_piece, 0)) as total_value
    
FROM product_batches pb
JOIN products p ON pb.product_id = p.id
LEFT JOIN categories cat ON p.category_id = cat.id
LEFT JOIN suppliers sup ON p.supplier_id = sup.id
WHERE p.is_active = true OR p.is_active IS NULL;

-- Grant access to the view
GRANT SELECT ON batch_management_view TO authenticated;

-- ========================================
-- 6. UPDATE EXISTING BATCH SERVICE FUNCTIONS
-- ========================================

-- Update add_product_batch to work with both old and new structure
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
    v_product_name TEXT;
BEGIN
    -- Validate inputs
    IF p_product_id IS NULL OR p_quantity IS NULL OR p_quantity <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Product ID and positive quantity are required'
        );
    END IF;

    -- Check if product exists and get name using new structure
    SELECT 
        COALESCE(stock_in_pieces, 0),
        CASE 
            WHEN brand_name IS NOT NULL AND generic_name IS NOT NULL THEN brand_name || ' (' || generic_name || ')'
            WHEN generic_name IS NOT NULL THEN generic_name
            WHEN brand_name IS NOT NULL THEN brand_name
            ELSE COALESCE(name, 'Unknown Product')
        END
    INTO v_current_stock, v_product_name
    FROM products 
    WHERE id = p_product_id;

    IF v_product_name IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Product not found'
        );
    END IF;
    
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

    -- Log the inventory change (if inventory_logs table exists)
    BEGIN
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
            'New batch added for ' || v_product_name || ': ' || COALESCE(p_batch_number, 'No batch number'),
            auth.uid()
        );
    EXCEPTION
        WHEN OTHERS THEN
            -- Ignore if inventory_logs table doesn't exist
            NULL;
    END;

    -- Build result
    v_result := json_build_object(
        'success', true,
        'batch_id', v_batch_id,
        'product_id', p_product_id,
        'product_name', v_product_name,
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION add_product_batch(UUID, INTEGER, TEXT, DATE) TO authenticated;

-- ========================================
-- ✅ COMPLETION MESSAGE
-- ========================================

SELECT 
    '✅ BATCH MANAGEMENT MIGRATION COMPLETED!' as status,
    'Enhanced batch management now supports the new medicine data structure with brand_name, generic_name, dosage_strength, etc.' as message,
    'Available functions: get_all_batches_enhanced(), get_batches_with_medicine_info(), get_expiring_batches(), get_batch_analytics()' as new_functions,
    'Legacy functions still work for backward compatibility' as compatibility;
