-- =================================================
-- 🏥 MEDCURE-PRO SCHEMA DEPLOYMENT SCRIPT
-- Professional Pharmacy Management System
-- Deploy PWD/Senior Discounts, Transaction Editing, 
-- Batch Management, and Expired Products Management
-- =================================================

-- DEPLOYMENT INSTRUCTION:
-- Copy and paste this entire script into your Supabase SQL Editor
-- Execute it to add all required columns and tables for new features

-- =================================================
-- 1. PWD/SENIOR CITIZEN DISCOUNT SYSTEM
-- =================================================

-- Add discount columns to sales table
ALTER TABLE sales ADD COLUMN IF NOT EXISTS discount_type VARCHAR(20) 
    DEFAULT 'none' CHECK (discount_type IN ('none', 'pwd', 'senior', 'custom'));

ALTER TABLE sales ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5,2) 
    DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100);

ALTER TABLE sales ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) 
    DEFAULT 0 CHECK (discount_amount >= 0);

ALTER TABLE sales ADD COLUMN IF NOT EXISTS subtotal_before_discount DECIMAL(10,2);

ALTER TABLE sales ADD COLUMN IF NOT EXISTS pwd_senior_id VARCHAR(50);

-- =================================================
-- 2. TRANSACTION EDITING SYSTEM
-- =================================================

-- Add transaction editing audit columns
ALTER TABLE sales ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT false;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS edited_by UUID REFERENCES users(id);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS edit_reason TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS original_total DECIMAL(10,2);

-- =================================================
-- 3. MULTIPLE BATCH INVENTORY MANAGEMENT
-- =================================================

-- Create batch inventory table for FIFO management
CREATE TABLE IF NOT EXISTS batch_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    batch_number VARCHAR(50) NOT NULL,
    expiry_date DATE NOT NULL,
    manufacture_date DATE,
    supplier VARCHAR(100),
    cost_price DECIMAL(10,2),
    stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique batch per product
    UNIQUE(product_id, batch_number)
);

-- Add updated_at trigger for batch_inventory
CREATE TRIGGER update_batch_inventory_updated_at BEFORE UPDATE
    ON batch_inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create performance indexes for batch inventory
CREATE INDEX IF NOT EXISTS idx_batch_inventory_product ON batch_inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_batch_inventory_expiry ON batch_inventory(expiry_date);
CREATE INDEX IF NOT EXISTS idx_batch_inventory_batch_number ON batch_inventory(batch_number);
CREATE INDEX IF NOT EXISTS idx_batch_inventory_active ON batch_inventory(is_active);

-- =================================================
-- 4. EXPIRED PRODUCTS MANAGEMENT SYSTEM
-- =================================================

-- Add expiry tracking columns to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS expiry_status VARCHAR(20) 
    DEFAULT 'valid' CHECK (expiry_status IN ('valid', 'expiring_soon', 'expired'));

ALTER TABLE products ADD COLUMN IF NOT EXISTS expiry_alert_days INTEGER DEFAULT 30;

-- Create expired products clearance tracking table
CREATE TABLE IF NOT EXISTS expired_products_clearance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id),
    batch_id UUID REFERENCES batch_inventory(id),
    original_quantity INTEGER NOT NULL,
    clearance_quantity INTEGER DEFAULT 0,
    clearance_method VARCHAR(20) CHECK (clearance_method IN ('return_supplier', 'disposal', 'donation')),
    clearance_date DATE,
    clearance_notes TEXT,
    handled_by UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for expired products clearance
CREATE INDEX IF NOT EXISTS idx_expired_clearance_product ON expired_products_clearance(product_id);
CREATE INDEX IF NOT EXISTS idx_expired_clearance_status ON expired_products_clearance(status);
CREATE INDEX IF NOT EXISTS idx_expired_clearance_date ON expired_products_clearance(created_at);

-- =================================================
-- 5. ENHANCED SALE ITEMS FOR BATCH TRACKING
-- =================================================

-- Add batch tracking to sale items
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES batch_inventory(id);
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS expiry_date DATE;

-- =================================================
-- 6. SMART REORDER SUGGESTIONS (SIMPLE & PRACTICAL)
-- =================================================

-- Add reorder tracking columns to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS last_reorder_date DATE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS reorder_frequency_days INTEGER DEFAULT 30;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_critical_medicine BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_lead_time_days INTEGER DEFAULT 7;

-- Create simple reorder suggestions view
CREATE OR REPLACE VIEW reorder_suggestions AS
SELECT 
    p.id,
    p.name,
    p.brand,
    p.category,
    p.stock_in_pieces,
    p.reorder_level,
    p.supplier,
    p.supplier_lead_time_days,
    
    -- Calculate sales velocity (last 30 days)
    COALESCE(sales_data.total_sold_30_days, 0) as units_sold_last_30_days,
    ROUND(COALESCE(sales_data.total_sold_30_days, 0) / 30.0, 2) as avg_daily_sales,
    
    -- Calculate days until empty
    CASE 
        WHEN COALESCE(sales_data.total_sold_30_days, 0) > 0 THEN
            ROUND(p.stock_in_pieces / (COALESCE(sales_data.total_sold_30_days, 0) / 30.0), 0)
        ELSE 999
    END as days_until_empty,
    
    -- Suggest reorder quantity (simple formula)
    CASE 
        WHEN COALESCE(sales_data.total_sold_30_days, 0) > 0 THEN
            CEIL((COALESCE(sales_data.total_sold_30_days, 0) / 30.0) * (p.supplier_lead_time_days + 14))
        ELSE p.reorder_level * 2
    END as suggested_reorder_quantity,
    
    -- Priority level
    CASE 
        WHEN p.stock_in_pieces <= 0 THEN 'CRITICAL'
        WHEN p.stock_in_pieces <= p.reorder_level THEN 'HIGH'
        WHEN COALESCE(sales_data.total_sold_30_days, 0) > 0 AND 
             (p.stock_in_pieces / (COALESCE(sales_data.total_sold_30_days, 0) / 30.0)) <= p.supplier_lead_time_days + 7 THEN 'MEDIUM'
        ELSE 'LOW'
    END as priority_level,
    
    -- Reason for suggestion
    CASE 
        WHEN p.stock_in_pieces <= 0 THEN 'Out of stock'
        WHEN p.stock_in_pieces <= p.reorder_level THEN 'Below reorder level'
        WHEN p.is_critical_medicine AND p.stock_in_pieces <= p.reorder_level * 2 THEN 'Critical medicine low stock'
        WHEN COALESCE(sales_data.total_sold_30_days, 0) > 0 AND 
             (p.stock_in_pieces / (COALESCE(sales_data.total_sold_30_days, 0) / 30.0)) <= p.supplier_lead_time_days + 7 THEN 'Stock will run out before next delivery'
        ELSE 'Preventive restock'
    END as suggestion_reason

FROM products p
LEFT JOIN (
    SELECT 
        si.product_id,
        SUM(si.quantity) as total_sold_30_days
    FROM sale_items si
    JOIN sales s ON si.sale_id = s.id
    WHERE s.created_at >= CURRENT_DATE - INTERVAL '30 days'
      AND s.status = 'completed'
    GROUP BY si.product_id
) sales_data ON p.id = sales_data.product_id
WHERE p.is_active = true
  AND (
    p.stock_in_pieces <= p.reorder_level OR
    p.is_critical_medicine OR
    (COALESCE(sales_data.total_sold_30_days, 0) > 0 AND 
     (p.stock_in_pieces / (COALESCE(sales_data.total_sold_30_days, 0) / 30.0)) <= p.supplier_lead_time_days + 7)
  )
ORDER BY 
    CASE 
        WHEN p.stock_in_pieces <= 0 THEN 1
        WHEN p.stock_in_pieces <= p.reorder_level THEN 2
        WHEN p.is_critical_medicine THEN 3
        ELSE 4
    END,
    p.name;

-- Function to get fast-moving products (top sellers)
CREATE OR REPLACE FUNCTION get_fast_moving_products(days_period INTEGER DEFAULT 30, limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
    product_id UUID,
    product_name VARCHAR(255),
    total_sold INTEGER,
    avg_daily_sales DECIMAL(10,2),
    current_stock INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        COALESCE(sales_data.total_sold, 0)::INTEGER,
        ROUND(COALESCE(sales_data.total_sold, 0) / days_period::DECIMAL, 2),
        p.stock_in_pieces
    FROM products p
    LEFT JOIN (
        SELECT 
            si.product_id,
            SUM(si.quantity) as total_sold
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        WHERE s.created_at >= CURRENT_DATE - INTERVAL '1 day' * days_period
          AND s.status = 'completed'
        GROUP BY si.product_id
    ) sales_data ON p.id = sales_data.product_id
    WHERE p.is_active = true
      AND COALESCE(sales_data.total_sold, 0) > 0
    ORDER BY sales_data.total_sold DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- =================================================
-- 7. ENHANCED BUSINESS FUNCTIONS
-- =================================================

-- Function to automatically update expiry status
CREATE OR REPLACE FUNCTION update_expiry_status()
RETURNS TRIGGER AS $$
BEGIN
    NEW.expiry_status := CASE 
        WHEN NEW.expiry_date <= CURRENT_DATE THEN 'expired'
        WHEN NEW.expiry_date <= CURRENT_DATE + INTERVAL '1 day' * COALESCE(NEW.expiry_alert_days, 30) THEN 'expiring_soon'
        ELSE 'valid'
    END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic expiry status updates
DROP TRIGGER IF EXISTS trigger_update_expiry_status ON products;
CREATE TRIGGER trigger_update_expiry_status
    BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_expiry_status();

-- Function for FIFO batch selection (First In, First Out)
CREATE OR REPLACE FUNCTION get_fifo_batches(p_product_id UUID, p_quantity INTEGER)
RETURNS TABLE(batch_id UUID, available_quantity INTEGER, expiry_date DATE) AS $$
BEGIN
    RETURN QUERY
    SELECT bi.id, bi.stock_quantity, bi.expiry_date
    FROM batch_inventory bi
    WHERE bi.product_id = p_product_id 
      AND bi.stock_quantity > 0 
      AND bi.is_active = true
    ORDER BY bi.expiry_date ASC, bi.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate PWD/Senior discount (20% by law in Philippines)
CREATE OR REPLACE FUNCTION calculate_pwd_senior_discount(p_amount DECIMAL(10,2))
RETURNS DECIMAL(10,2) AS $$
BEGIN
    -- Philippine law: 20% discount for PWD/Senior Citizens
    RETURN ROUND(p_amount * 0.20, 2);
END;
$$ LANGUAGE plpgsql;

-- =================================================
-- 7. PROFESSIONAL VIEWS FOR REPORTING
-- =================================================

-- Enhanced product stock view with batch and expiry information
CREATE OR REPLACE VIEW product_stock_detailed AS
SELECT 
    p.id,
    p.name,
    p.brand,
    p.category,
    p.stock_in_pieces,
    p.reorder_level,
    p.expiry_status,
    p.expiry_date as product_expiry,
    COUNT(bi.id) as batch_count,
    MIN(bi.expiry_date) as earliest_batch_expiry,
    MAX(bi.expiry_date) as latest_batch_expiry,
    SUM(CASE WHEN bi.is_active THEN bi.stock_quantity ELSE 0 END) as total_batch_stock,
    CASE 
        WHEN p.stock_in_pieces <= 0 THEN 'OUT_OF_STOCK'
        WHEN p.stock_in_pieces <= p.reorder_level THEN 'LOW_STOCK'
        ELSE 'IN_STOCK'
    END as stock_status,
    CASE 
        WHEN MIN(bi.expiry_date) <= CURRENT_DATE THEN 'HAS_EXPIRED_BATCHES'
        WHEN MIN(bi.expiry_date) <= CURRENT_DATE + INTERVAL '30 days' THEN 'HAS_EXPIRING_BATCHES'
        ELSE 'ALL_BATCHES_VALID'
    END as batch_expiry_status
FROM products p
LEFT JOIN batch_inventory bi ON p.id = bi.product_id
WHERE p.is_active = true
GROUP BY p.id, p.name, p.brand, p.category, p.stock_in_pieces, p.reorder_level, p.expiry_status, p.expiry_date;

-- Sales view with discount information
CREATE OR REPLACE VIEW sales_with_discounts AS
SELECT 
    s.*,
    CASE 
        WHEN s.discount_type = 'pwd' THEN 'PWD Discount (20%)'
        WHEN s.discount_type = 'senior' THEN 'Senior Citizen Discount (20%)'
        WHEN s.discount_type = 'custom' THEN 'Custom Discount'
        ELSE 'No Discount'
    END as discount_label,
    u.first_name || ' ' || COALESCE(u.last_name, '') as cashier_name,
    CASE WHEN s.is_edited THEN 'EDITED' ELSE 'ORIGINAL' END as transaction_status
FROM sales s
LEFT JOIN users u ON s.user_id = u.id;

-- Expiring products alert view
CREATE OR REPLACE VIEW expiring_products_alert AS
SELECT 
    p.id,
    p.name,
    p.brand,
    p.category,
    p.stock_in_pieces,
    p.expiry_date,
    p.expiry_status,
    bi.batch_number,
    bi.stock_quantity as batch_stock,
    bi.expiry_date as batch_expiry,
    CURRENT_DATE - bi.expiry_date as days_expired,
    CASE 
        WHEN bi.expiry_date <= CURRENT_DATE THEN 'EXPIRED'
        WHEN bi.expiry_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'EXPIRES_THIS_WEEK'
        WHEN bi.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'EXPIRES_THIS_MONTH'
        ELSE 'VALID'
    END as urgency_level
FROM products p
LEFT JOIN batch_inventory bi ON p.id = bi.product_id AND bi.is_active = true
WHERE p.is_active = true 
  AND (p.expiry_status IN ('expired', 'expiring_soon') 
       OR bi.expiry_date <= CURRENT_DATE + INTERVAL '30 days')
ORDER BY bi.expiry_date ASC;

-- =================================================
-- 8. PERFORMANCE INDEXES
-- =================================================

-- Sales performance indexes
CREATE INDEX IF NOT EXISTS idx_sales_discount_type ON sales(discount_type);
CREATE INDEX IF NOT EXISTS idx_sales_edited ON sales(is_edited);
CREATE INDEX IF NOT EXISTS idx_sales_pwd_senior_id ON sales(pwd_senior_id);

-- Products performance indexes  
CREATE INDEX IF NOT EXISTS idx_products_expiry_status ON products(expiry_status);
CREATE INDEX IF NOT EXISTS idx_products_expiry_date ON products(expiry_date);

-- Sale items batch tracking index
CREATE INDEX IF NOT EXISTS idx_sale_items_batch_id ON sale_items(batch_id);

-- =================================================
-- 9. DATA COMMENTS FOR DOCUMENTATION
-- =================================================

COMMENT ON COLUMN sales.discount_type IS 'Type of discount: none, pwd (20%), senior (20%), custom';
COMMENT ON COLUMN sales.discount_percentage IS 'Percentage of discount applied (0-100)';
COMMENT ON COLUMN sales.pwd_senior_id IS 'PWD or Senior Citizen ID card number for legal compliance';
COMMENT ON COLUMN sales.is_edited IS 'Indicates if transaction was modified after creation';
COMMENT ON COLUMN sales.edit_reason IS 'Reason for editing the transaction (audit trail)';

COMMENT ON TABLE batch_inventory IS 'FIFO batch tracking for pharmaceutical inventory management';
COMMENT ON TABLE expired_products_clearance IS 'Professional tracking for expired product disposal and clearance procedures';

COMMENT ON COLUMN products.expiry_status IS 'Automatic status: valid, expiring_soon, expired';
COMMENT ON COLUMN products.expiry_alert_days IS 'Number of days before expiry to trigger alerts (default: 30)';

-- =================================================
-- 10. ENABLE ROW LEVEL SECURITY FOR NEW TABLES
-- =================================================

-- Enable RLS for new tables
ALTER TABLE batch_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE expired_products_clearance ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (authenticated users can access)
CREATE POLICY "batch_inventory_access" ON batch_inventory FOR ALL TO authenticated USING (true);
CREATE POLICY "expired_clearance_access" ON expired_products_clearance FOR ALL TO authenticated USING (true);

-- =================================================
-- ✅ DEPLOYMENT COMPLETE!
-- =================================================

-- Test query to verify deployment
SELECT 
    'PWD/Senior Discounts' as feature,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'discount_type') 
         THEN 'DEPLOYED ✅' ELSE 'MISSING ❌' END as status
UNION ALL
SELECT 
    'Transaction Editing' as feature,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'is_edited') 
         THEN 'DEPLOYED ✅' ELSE 'MISSING ❌' END as status
UNION ALL
SELECT 
    'Batch Management' as feature,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'batch_inventory') 
         THEN 'DEPLOYED ✅' ELSE 'MISSING ❌' END as status
UNION ALL
SELECT 
    'Expired Products' as feature,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'expired_products_clearance') 
         THEN 'DEPLOYED ✅' ELSE 'MISSING ❌' END as status;

-- Display success message
SELECT 
    '🏥 MedCure-Pro Schema Deployment Complete!' as message,
    '✅ PWD/Senior Citizen Discounts Ready' as feature_1,
    '✅ Transaction Editing System Ready' as feature_2,
    '✅ Multiple Batch Management Ready' as feature_3,
    '✅ Expired Products Workflow Ready' as feature_4,
    'Ready for frontend implementation!' as next_step;
