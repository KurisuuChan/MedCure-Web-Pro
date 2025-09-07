-- 🔧 **MISSING COLUMNS FIX FOR PRODUCTS TABLE**
-- Add missing archive_reason column and any other columns needed for import functionality
-- Run this BEFORE using the truncate script or import functionality

-- ==========================================
-- 1. ADD MISSING COLUMNS TO PRODUCTS TABLE
-- ==========================================

-- Add archive_reason column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' AND column_name = 'archive_reason') THEN
        ALTER TABLE products ADD COLUMN archive_reason TEXT;
        COMMENT ON COLUMN products.archive_reason IS 'Reason for archiving the product';
    END IF;
END $$;

-- ==========================================
-- 2. VERIFY COLUMNS EXIST
-- ==========================================

-- Check that all expected columns exist in products table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'products'
ORDER BY ordinal_position;

-- ==========================================
-- 3. UPDATE ARCHIVE FUNCTIONS TO USE REASON
-- ==========================================

-- Update the archive_product function to include reason
CREATE OR REPLACE FUNCTION archive_product(
    product_uuid UUID,
    user_uuid UUID,
    reason TEXT DEFAULT 'Archived via system'
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Update product to archived status
    UPDATE products 
    SET 
        is_archived = true,
        archived_at = NOW(),
        archived_by = user_uuid,
        archive_reason = reason,
        is_active = false
    WHERE id = product_uuid;
    
    -- Return success if row was updated
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Update the restore_product function to clear reason
CREATE OR REPLACE FUNCTION restore_product(
    product_uuid UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Update product to active status
    UPDATE products 
    SET 
        is_archived = false,
        archived_at = NULL,
        archived_by = NULL,
        archive_reason = NULL,
        is_active = true
    WHERE id = product_uuid;
    
    -- Return success if row was updated
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 4. UPDATE ARCHIVED PRODUCTS VIEW
-- ==========================================

-- Drop and recreate the archived products view to include reason
DROP VIEW IF EXISTS archived_products;

CREATE VIEW archived_products AS
SELECT 
    p.id,
    p.name,
    p.brand,
    p.category,
    p.description,
    p.price_per_piece,
    p.cost_price,
    p.base_price,
    p.margin_percentage,
    p.pieces_per_sheet,
    p.sheets_per_box,
    p.stock_in_pieces,
    p.reorder_level,
    p.expiry_date,
    p.supplier,
    p.batch_number,
    p.is_active,
    p.is_archived,
    p.archived_at,
    p.archived_by,
    p.archive_reason,
    p.category_id,
    p.created_at,
    p.updated_at,
    c.name as category_name,
    u.first_name || ' ' || u.last_name as archived_by_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN users u ON p.archived_by = u.id
WHERE p.is_archived = true
ORDER BY p.archived_at DESC;

-- ==========================================
-- COLUMN ADDITION COMPLETE
-- ==========================================

-- Your products table now has all required columns for import functionality!
-- You can now safely use the import feature and truncate script.

COMMENT ON COLUMN products.archive_reason IS 'Tracks the reason why a product was archived for audit purposes';
