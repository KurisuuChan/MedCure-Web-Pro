-- 🚀 **ENHANCED SCHEMA UPDATES FOR MEDCURE-PRO**
-- Advanced features: Categories Management, Archive System, Enhanced Pricing
-- Created: Phase 4 Implementation
-- Version: 2.0

-- ==========================================
-- 1. CATEGORIES TABLE
-- ==========================================
-- Dynamic category management to replace hardcoded categories

CREATE TABLE categories (
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

-- Create updated_at trigger for categories
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE
    ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_categories_name ON categories(name);
CREATE INDEX idx_categories_active ON categories(is_active);
CREATE INDEX idx_categories_sort ON categories(sort_order);

-- ==========================================
-- 2. PRODUCT ENHANCEMENTS
-- ==========================================
-- Add archive functionality and enhanced pricing structure

-- Add archive functionality
ALTER TABLE products ADD COLUMN is_archived BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE products ADD COLUMN archived_by UUID REFERENCES users(id);

-- Add enhanced pricing structure
ALTER TABLE products ADD COLUMN cost_price DECIMAL(10,2) CHECK (cost_price >= 0);
ALTER TABLE products ADD COLUMN base_price DECIMAL(10,2) CHECK (base_price >= 0);
ALTER TABLE products ADD COLUMN margin_percentage DECIMAL(5,2) DEFAULT 0 CHECK (margin_percentage >= 0);

-- Add category foreign key relationship
ALTER TABLE products ADD COLUMN category_id UUID REFERENCES categories(id);

-- Create indexes for new fields
CREATE INDEX idx_products_archived ON products(is_archived);
CREATE INDEX idx_products_category_id ON products(category_id);

-- ==========================================
-- 3. SALES ENHANCEMENTS
-- ==========================================
-- Add customer information and transaction enhancements

ALTER TABLE sales ADD COLUMN customer_name VARCHAR(255);
ALTER TABLE sales ADD COLUMN customer_phone VARCHAR(20);
ALTER TABLE sales ADD COLUMN customer_email VARCHAR(255);
ALTER TABLE sales ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0 CHECK (discount_amount >= 0);
ALTER TABLE sales ADD COLUMN tax_amount DECIMAL(10,2) DEFAULT 0 CHECK (tax_amount >= 0);
ALTER TABLE sales ADD COLUMN payment_amount DECIMAL(10,2);
ALTER TABLE sales ADD COLUMN change_amount DECIMAL(10,2) DEFAULT 0;

-- ==========================================
-- 4. ARCHIVE MANAGEMENT FUNCTIONS
-- ==========================================

-- Function to safely archive a product
CREATE OR REPLACE FUNCTION archive_product(
    product_uuid UUID,
    user_uuid UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Update product to archived status
    UPDATE products 
    SET 
        is_archived = true,
        archived_at = NOW(),
        archived_by = user_uuid,
        is_active = false
    WHERE id = product_uuid;
    
    -- Return success if row was updated
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to restore an archived product
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
        is_active = true
    WHERE id = product_uuid;
    
    -- Return success if row was updated
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 5. CATEGORY MANAGEMENT FUNCTIONS
-- ==========================================

-- Function to get category statistics
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

-- Function to safely delete category (only if no products)
CREATE OR REPLACE FUNCTION safe_delete_category(category_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    product_count INTEGER;
BEGIN
    -- Check if category has any products
    SELECT COUNT(*) INTO product_count
    FROM products 
    WHERE category_id = category_uuid;
    
    -- Only delete if no products are associated
    IF product_count = 0 THEN
        DELETE FROM categories WHERE id = category_uuid;
        RETURN true;
    ELSE
        RETURN false;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 6. ENHANCED VIEWS
-- ==========================================

-- Enhanced product view with category information
CREATE OR REPLACE VIEW products_with_category AS
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
-- 7. INSERT DEFAULT CATEGORIES
-- ==========================================

INSERT INTO categories (name, description, color, icon, sort_order) VALUES
('Pain Relief', 'Pain management and relief medications', '#EF4444', 'Heart', 1),
('Antibiotics', 'Antibiotic medications for infections', '#10B981', 'Shield', 2),
('Vitamins', 'Vitamins and nutritional supplements', '#F59E0B', 'Zap', 3),
('Cold & Flu', 'Cold, flu, and respiratory medications', '#6366F1', 'Thermometer', 4),
('Digestive', 'Digestive health and stomach medications', '#8B5CF6', 'Stomach', 5),
('Skin Care', 'Topical treatments and skin care products', '#EC4899', 'Droplets', 6),
('First Aid', 'Emergency and first aid supplies', '#F97316', 'Cross', 7),
('Baby Care', 'Infant and child care products', '#84CC16', 'Baby', 8),
('Prescription', 'Prescription-only medications', '#DC2626', 'FileText', 9),
('Other', 'Miscellaneous pharmaceutical products', '#6B7280', 'Package', 10);

-- ==========================================
-- 8. MIGRATE EXISTING PRODUCTS
-- ==========================================

-- Update existing products to use category IDs
UPDATE products 
SET category_id = (
    SELECT id FROM categories 
    WHERE categories.name = products.category
    LIMIT 1
)
WHERE category_id IS NULL;

-- Update products without matching categories to 'Other'
UPDATE products 
SET category_id = (
    SELECT id FROM categories 
    WHERE name = 'Other'
    LIMIT 1
)
WHERE category_id IS NULL;

-- ==========================================
-- 9. ENHANCED SALES ANALYTICS FUNCTION
-- ==========================================

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
-- ENHANCED SCHEMA UPDATES COMPLETE
-- ==========================================

COMMENT ON TABLE categories IS 'Dynamic product categories with UI customization';
COMMENT ON COLUMN products.is_archived IS 'Soft delete flag for products';
COMMENT ON COLUMN products.cost_price IS 'Product cost price for profit calculation';
COMMENT ON COLUMN products.base_price IS 'Base price before markup';

-- Schema enhancements ready for deployment! 🚀
