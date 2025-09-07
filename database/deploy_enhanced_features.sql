-- 🚀 **DEPLOYMENT SCRIPT FOR ENHANCED FEATURES**
-- Safely apply all advanced feature enhancements to existing MedCure-Pro database
-- This script can be run multiple times safely (idempotent)
-- Version: 2.0 - Production Ready

BEGIN;

-- ==========================================
-- 1. CREATE CATEGORIES TABLE (IF NOT EXISTS)
-- ==========================================

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color for UI
    icon VARCHAR(50) DEFAULT 'Package', -- Lucide icon name
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger if not exists
DO $$ BEGIN
    CREATE TRIGGER update_categories_updated_at BEFORE UPDATE
        ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create indexes if not exist
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_sort ON categories(sort_order);

-- ==========================================
-- 2. ENHANCE PRODUCTS TABLE
-- ==========================================

-- Add archive functionality (if not exists)
DO $$ BEGIN
    ALTER TABLE products ADD COLUMN is_archived BOOLEAN DEFAULT false;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE products ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE products ADD COLUMN archived_by UUID REFERENCES users(id);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Add enhanced pricing structure (if not exists)
DO $$ BEGIN
    ALTER TABLE products ADD COLUMN cost_price DECIMAL(10,2) CHECK (cost_price >= 0);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE products ADD COLUMN base_price DECIMAL(10,2) CHECK (base_price >= 0);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE products ADD COLUMN margin_percentage DECIMAL(5,2) DEFAULT 0 CHECK (margin_percentage >= 0);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Add category foreign key relationship (if not exists)
DO $$ BEGIN
    ALTER TABLE products ADD COLUMN category_id UUID REFERENCES categories(id);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Create new indexes
CREATE INDEX IF NOT EXISTS idx_products_archived ON products(is_archived);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

-- ==========================================
-- 3. ENHANCE SALES TABLE
-- ==========================================

-- Add customer email (if not exists)
DO $$ BEGIN
    ALTER TABLE sales ADD COLUMN customer_email VARCHAR(255);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Add enhanced transaction fields (if not exists)
DO $$ BEGIN
    ALTER TABLE sales ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0 CHECK (discount_amount >= 0);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE sales ADD COLUMN tax_amount DECIMAL(10,2) DEFAULT 0 CHECK (tax_amount >= 0);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE sales ADD COLUMN payment_amount DECIMAL(10,2);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE sales ADD COLUMN change_amount DECIMAL(10,2) DEFAULT 0;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- ==========================================
-- 4. CREATE ENHANCED FUNCTIONS
-- ==========================================

-- Archive product function
CREATE OR REPLACE FUNCTION archive_product(
    product_uuid UUID,
    user_uuid UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE products 
    SET 
        is_archived = true,
        archived_at = NOW(),
        archived_by = user_uuid,
        is_active = false
    WHERE id = product_uuid;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Restore product function
CREATE OR REPLACE FUNCTION restore_product(
    product_uuid UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE products 
    SET 
        is_archived = false,
        archived_at = NULL,
        archived_by = NULL,
        is_active = true
    WHERE id = product_uuid;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Category statistics function
CREATE OR REPLACE FUNCTION get_category_stats(category_uuid UUID)
RETURNS TABLE (
    total_products BIGINT,
    active_products BIGINT,
    archived_products BIGINT,
    total_value DECIMAL(10,2),
    low_stock_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_products,
        COUNT(*) FILTER (WHERE is_active = true AND is_archived = false) as active_products,
        COUNT(*) FILTER (WHERE is_archived = true) as archived_products,
        COALESCE(SUM(stock_in_pieces * price_per_piece) FILTER (WHERE is_active = true AND is_archived = false), 0) as total_value,
        COUNT(*) FILTER (WHERE stock_in_pieces <= reorder_level AND is_active = true AND is_archived = false) as low_stock_count
    FROM products 
    WHERE category_id = category_uuid;
END;
$$ LANGUAGE plpgsql;

-- Safe category deletion function
CREATE OR REPLACE FUNCTION safe_delete_category(category_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    product_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO product_count
    FROM products 
    WHERE category_id = category_uuid;
    
    IF product_count = 0 THEN
        DELETE FROM categories WHERE id = category_uuid;
        RETURN true;
    ELSE
        RETURN false;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Enhanced sales analytics function
CREATE OR REPLACE FUNCTION get_sales_analytics(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    total_sales DECIMAL(10,2),
    total_transactions BIGINT,
    average_transaction DECIMAL(10,2),
    cash_sales DECIMAL(10,2),
    card_sales DECIMAL(10,2),
    digital_sales DECIMAL(10,2),
    top_category VARCHAR(100),
    top_product VARCHAR(255)
) AS $$
BEGIN
    RETURN QUERY
    WITH sales_data AS (
        SELECT 
            s.total_amount,
            s.payment_method,
            si.product_id
        FROM sales s
        JOIN sale_items si ON s.id = si.sale_id
        WHERE s.created_at::DATE BETWEEN start_date AND end_date
        AND s.status = 'completed'
    ),
    payment_totals AS (
        SELECT 
            COALESCE(SUM(total_amount) FILTER (WHERE payment_method = 'cash'), 0) as cash_total,
            COALESCE(SUM(total_amount) FILTER (WHERE payment_method = 'card'), 0) as card_total,
            COALESCE(SUM(total_amount) FILTER (WHERE payment_method = 'digital'), 0) as digital_total
        FROM sales 
        WHERE created_at::DATE BETWEEN start_date AND end_date
        AND status = 'completed'
    ),
    top_category_data AS (
        SELECT c.name
        FROM sales_data sd
        JOIN products p ON sd.product_id = p.id
        JOIN categories c ON p.category_id = c.id
        GROUP BY c.name
        ORDER BY COUNT(*) DESC
        LIMIT 1
    ),
    top_product_data AS (
        SELECT p.name
        FROM sales_data sd
        JOIN products p ON sd.product_id = p.id
        GROUP BY p.name
        ORDER BY COUNT(*) DESC
        LIMIT 1
    )
    SELECT 
        COALESCE(SUM(s.total_amount), 0) as total_sales,
        COUNT(DISTINCT s.id) as total_transactions,
        COALESCE(AVG(s.total_amount), 0) as average_transaction,
        pt.cash_total,
        pt.card_total,
        pt.digital_total,
        COALESCE(tcd.name, 'N/A') as top_category,
        COALESCE(tpd.name, 'N/A') as top_product
    FROM sales s
    CROSS JOIN payment_totals pt
    LEFT JOIN top_category_data tcd ON true
    LEFT JOIN top_product_data tpd ON true
    WHERE s.created_at::DATE BETWEEN start_date AND end_date
    AND s.status = 'completed';
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 5. CREATE ENHANCED VIEWS
-- ==========================================

-- Drop existing views if they exist (in correct dependency order)
DROP VIEW IF EXISTS active_products;
DROP VIEW IF EXISTS archived_products;
DROP VIEW IF EXISTS products_with_category;

-- Enhanced product view with category information
CREATE VIEW products_with_category AS
SELECT 
    p.*,
    c.name as category_name,
    c.color as category_color,
    c.icon as category_icon,
    CASE 
        WHEN p.stock_in_pieces <= 0 THEN 'OUT_OF_STOCK'
        WHEN p.stock_in_pieces <= p.reorder_level THEN 'LOW_STOCK'
        ELSE 'IN_STOCK'
    END as stock_status,
    CASE 
        WHEN p.expiry_date <= CURRENT_DATE THEN 'EXPIRED'
        WHEN p.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'EXPIRING_SOON'
        WHEN p.expiry_date <= CURRENT_DATE + INTERVAL '90 days' THEN 'EXPIRING_WARNING'
        ELSE 'VALID'
    END as expiry_status,
    -- Calculate profit margin
    CASE 
        WHEN p.cost_price > 0 THEN ((p.price_per_piece - p.cost_price) / p.cost_price * 100)
        ELSE 0
    END as actual_margin_percentage
FROM products p
LEFT JOIN categories c ON p.category_id = c.id;

-- Archive view for management
CREATE VIEW archived_products AS
SELECT 
    p.*,
    c.name as category_name,
    u.first_name || ' ' || u.last_name as archived_by_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN users u ON p.archived_by = u.id
WHERE p.is_archived = true
ORDER BY p.archived_at DESC;

-- Active products view
CREATE VIEW active_products AS
SELECT *
FROM products_with_category
WHERE is_active = true AND is_archived = false
ORDER BY name;

-- ==========================================
-- 6. INSERT DEFAULT CATEGORIES (IF EMPTY)
-- ==========================================

INSERT INTO categories (name, description, color, icon, sort_order) 
SELECT * FROM (VALUES
    ('Pain Relief', 'Pain management and relief medications', '#EF4444', 'Heart', 1),
    ('Antibiotics', 'Antibiotic medications for infections', '#10B981', 'Shield', 2),
    ('Vitamins', 'Vitamins and nutritional supplements', '#F59E0B', 'Zap', 3),
    ('Cold & Flu', 'Cold, flu, and respiratory medications', '#6366F1', 'Thermometer', 4),
    ('Digestive', 'Digestive health and stomach medications', '#8B5CF6', 'Stomach', 5),
    ('Skin Care', 'Topical treatments and skin care products', '#EC4899', 'Droplets', 6),
    ('First Aid', 'Emergency and first aid supplies', '#F97316', 'Cross', 7),
    ('Baby Care', 'Infant and child care products', '#84CC16', 'Baby', 8),
    ('Prescription', 'Prescription-only medications', '#DC2626', 'FileText', 9),
    ('Other', 'Miscellaneous pharmaceutical products', '#6B7280', 'Package', 10)
) AS t(name, description, color, icon, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM categories);

-- ==========================================
-- 7. MIGRATE EXISTING PRODUCTS (IF NEEDED)
-- ==========================================

-- Update existing products to use category IDs (only if category_id is null)
UPDATE products 
SET category_id = (
    SELECT id FROM categories 
    WHERE categories.name = products.category
    LIMIT 1
)
WHERE category_id IS NULL AND category IS NOT NULL;

-- Update products without matching categories to 'Other'
UPDATE products 
SET category_id = (
    SELECT id FROM categories 
    WHERE name = 'Other'
    LIMIT 1
)
WHERE category_id IS NULL;

-- ==========================================
-- 8. UPDATE COMMENTS
-- ==========================================

COMMENT ON TABLE categories IS 'Dynamic product categories with UI customization';
COMMENT ON COLUMN products.is_archived IS 'Soft delete flag for products';
COMMENT ON COLUMN products.cost_price IS 'Product cost price for profit calculation';
COMMENT ON COLUMN products.base_price IS 'Base price before markup';
COMMENT ON COLUMN products.margin_percentage IS 'Target profit margin percentage';
COMMENT ON COLUMN sales.customer_email IS 'Optional customer email for receipts';
COMMENT ON COLUMN sales.tax_amount IS 'Tax amount applied to transaction';
COMMENT ON COLUMN sales.discount_amount IS 'Discount amount applied to transaction';

COMMIT;

-- ==========================================
-- DEPLOYMENT COMPLETE! ✅
-- ==========================================

SELECT 'Enhanced features deployment completed successfully! 🚀' as status;

-- Verify deployment
SELECT 
    'Categories' as feature,
    COUNT(*) as count,
    'Ready' as status
FROM categories
UNION ALL
SELECT 
    'Enhanced Products' as feature,
    COUNT(*) as count,
    'Ready' as status
FROM products
WHERE category_id IS NOT NULL
UNION ALL
SELECT 
    'Enhanced Views' as feature,
    1 as count,
    'Ready' as status
WHERE EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'products_with_category');
