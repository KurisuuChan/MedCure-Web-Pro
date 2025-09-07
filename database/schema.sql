-- 🏥 **MEDCURE-PRO DATABASE SCHEMA**
-- Complete pharmaceutical inventory management system schema for Supabase
-- Created: Phase 3 - Database Integration
-- Version: 1.0

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable RLS (Row Level Security)
ALTER DATABASE postgres SET row_security = on;

-- ==========================================
-- 1. USERS TABLE
-- ==========================================
-- Core user management with role-based access control

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(20) CHECK (role IN ('admin', 'manager', 'cashier')) NOT NULL DEFAULT 'cashier',
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger for users
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE
    ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 2. PRODUCTS TABLE
-- ==========================================
-- Comprehensive pharmaceutical product management

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100),
    category VARCHAR(100),
    description TEXT,
    
    -- Pricing information
    price_per_piece DECIMAL(10,2) NOT NULL CHECK (price_per_piece > 0),
    
    -- Unit conversion system
    pieces_per_sheet INTEGER DEFAULT 1 CHECK (pieces_per_sheet > 0),
    sheets_per_box INTEGER DEFAULT 1 CHECK (sheets_per_box > 0),
    
    -- Stock management
    stock_in_pieces INTEGER DEFAULT 0 CHECK (stock_in_pieces >= 0),
    reorder_level INTEGER DEFAULT 0 CHECK (reorder_level >= 0),
    
    -- Product details
    expiry_date DATE,
    supplier VARCHAR(100),
    batch_number VARCHAR(50),
    
    -- Status and timestamps
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger for products
CREATE TRIGGER update_products_updated_at BEFORE UPDATE
    ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_stock ON products(stock_in_pieces);

-- ==========================================
-- 3. SALES TABLE
-- ==========================================
-- Sales transaction management

CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Financial information
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'card', 'digital')) NOT NULL,
    
    -- Transaction details
    status VARCHAR(20) CHECK (status IN ('completed', 'pending', 'cancelled')) DEFAULT 'completed',
    notes TEXT,
    
    -- Customer information (optional)
    customer_name VARCHAR(100),
    customer_phone VARCHAR(20),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger for sales
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE
    ON sales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_sales_user_id ON sales(user_id);
CREATE INDEX idx_sales_date ON sales(created_at);
CREATE INDEX idx_sales_status ON sales(status);
CREATE INDEX idx_sales_payment_method ON sales(payment_method);

-- ==========================================
-- 4. SALE_ITEMS TABLE
-- ==========================================
-- Individual items within each sale transaction

CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    
    -- Quantity and unit information
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_type VARCHAR(10) CHECK (unit_type IN ('piece', 'sheet', 'box')) NOT NULL,
    
    -- Pricing information
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price > 0),
    total_price DECIMAL(10,2) NOT NULL CHECK (total_price > 0),
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product_id ON sale_items(product_id);

-- ==========================================
-- 5. STOCK_MOVEMENTS TABLE
-- ==========================================
-- Track all stock movements for audit and inventory management

CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Movement details
    movement_type VARCHAR(20) CHECK (movement_type IN ('in', 'out', 'adjustment')) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity != 0),
    reason VARCHAR(255) NOT NULL,
    
    -- Reference to related transaction (optional)
    reference_id UUID, -- Could reference sale_id or other transactions
    reference_type VARCHAR(20), -- 'sale', 'purchase', 'adjustment', etc.
    
    -- Stock levels after movement
    stock_before INTEGER NOT NULL,
    stock_after INTEGER NOT NULL,
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_user_id ON stock_movements(user_id);
CREATE INDEX idx_stock_movements_date ON stock_movements(created_at);
CREATE INDEX idx_stock_movements_type ON stock_movements(movement_type);

-- ==========================================
-- 6. DATABASE FUNCTIONS & TRIGGERS
-- ==========================================

-- Function to automatically update stock when sale items are created
CREATE OR REPLACE FUNCTION update_stock_on_sale()
RETURNS TRIGGER AS $$
DECLARE
    current_stock INTEGER;
    pieces_to_deduct INTEGER;
BEGIN
    -- Get current stock
    SELECT stock_in_pieces INTO current_stock
    FROM products 
    WHERE id = NEW.product_id;
    
    -- Calculate pieces to deduct based on unit type
    CASE NEW.unit_type
        WHEN 'piece' THEN
            pieces_to_deduct := NEW.quantity;
        WHEN 'sheet' THEN
            SELECT NEW.quantity * pieces_per_sheet INTO pieces_to_deduct
            FROM products WHERE id = NEW.product_id;
        WHEN 'box' THEN
            SELECT NEW.quantity * pieces_per_sheet * sheets_per_box INTO pieces_to_deduct
            FROM products WHERE id = NEW.product_id;
    END CASE;
    
    -- Update product stock
    UPDATE products 
    SET stock_in_pieces = stock_in_pieces - pieces_to_deduct
    WHERE id = NEW.product_id;
    
    -- Record stock movement
    INSERT INTO stock_movements (
        product_id, user_id, movement_type, quantity, reason,
        reference_id, reference_type, stock_before, stock_after
    ) VALUES (
        NEW.product_id,
        (SELECT user_id FROM sales WHERE id = NEW.sale_id),
        'out',
        -pieces_to_deduct,
        'Sale transaction',
        NEW.sale_id,
        'sale',
        current_stock,
        current_stock - pieces_to_deduct
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic stock updates
CREATE TRIGGER trigger_update_stock_on_sale
    AFTER INSERT ON sale_items
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_on_sale();

-- Function to validate sale totals
CREATE OR REPLACE FUNCTION validate_sale_total()
RETURNS TRIGGER AS $$
DECLARE
    calculated_total DECIMAL(10,2);
BEGIN
    -- Calculate total from sale items
    SELECT COALESCE(SUM(total_price), 0) INTO calculated_total
    FROM sale_items 
    WHERE sale_id = NEW.id;
    
    -- Update sale total if items exist
    IF calculated_total > 0 THEN
        NEW.total_amount := calculated_total;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for sale total validation
CREATE TRIGGER trigger_validate_sale_total
    BEFORE UPDATE ON sales
    FOR EACH ROW
    EXECUTE FUNCTION validate_sale_total();

-- ==========================================
-- 7. VIEWS FOR COMMON QUERIES
-- ==========================================

-- View for product stock status with low stock alerts
CREATE VIEW product_stock_status AS
SELECT 
    p.id,
    p.name,
    p.brand,
    p.category,
    p.stock_in_pieces,
    p.reorder_level,
    CASE 
        WHEN p.stock_in_pieces <= 0 THEN 'OUT_OF_STOCK'
        WHEN p.stock_in_pieces <= p.reorder_level THEN 'LOW_STOCK'
        ELSE 'IN_STOCK'
    END as stock_status,
    p.expiry_date,
    CASE 
        WHEN p.expiry_date <= CURRENT_DATE THEN 'EXPIRED'
        WHEN p.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'EXPIRING_SOON'
        ELSE 'VALID'
    END as expiry_status
FROM products p
WHERE p.is_active = true;

-- View for sales summary with user details
CREATE VIEW sales_summary AS
SELECT 
    s.id,
    s.total_amount,
    s.payment_method,
    s.status,
    s.created_at,
    u.first_name || ' ' || u.last_name as cashier_name,
    COUNT(si.id) as item_count
FROM sales s
LEFT JOIN users u ON s.user_id = u.id
LEFT JOIN sale_items si ON s.id = si.sale_id
GROUP BY s.id, s.total_amount, s.payment_method, s.status, s.created_at, u.first_name, u.last_name;

-- ==========================================
-- 8. INITIAL CONSTRAINTS & VALIDATIONS
-- ==========================================

-- Ensure sale item total price matches quantity * unit price
ALTER TABLE sale_items 
ADD CONSTRAINT check_total_price 
CHECK (total_price = quantity * unit_price);

-- Ensure positive stock levels (can be 0 but not negative)
ALTER TABLE products 
ADD CONSTRAINT check_positive_stock 
CHECK (stock_in_pieces >= 0);

-- ==========================================
-- SCHEMA CREATION COMPLETE
-- ==========================================

-- Create some useful indexes for reporting
CREATE INDEX idx_sales_date_range ON sales(created_at) WHERE status = 'completed';
CREATE INDEX idx_stock_movements_date_range ON stock_movements(created_at);

COMMENT ON DATABASE postgres IS 'MedCure-Pro Pharmaceutical Inventory Management System';
COMMENT ON TABLE users IS 'System users with role-based access control';
COMMENT ON TABLE products IS 'Pharmaceutical products with multi-unit inventory tracking';
COMMENT ON TABLE sales IS 'Sales transactions with payment tracking';
COMMENT ON TABLE sale_items IS 'Individual items within sales transactions';
COMMENT ON TABLE stock_movements IS 'Audit trail for all inventory movements';

-- Schema ready for deployment! 🚀
