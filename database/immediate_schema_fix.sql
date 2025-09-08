-- ==========================================
-- IMMEDIATE SCHEMA ALIGNMENT FIX
-- ==========================================
-- Quick deployment script for immediate ML system functionality
-- This script creates compatibility views and adds missing columns

-- ==========================================
-- 1. CREATE COMPATIBILITY VIEWS
-- ==========================================

-- Create pos_transactions view mapping to sales table
CREATE OR REPLACE VIEW pos_transactions AS
SELECT 
    id,
    user_id,
    total_amount,
    tax_amount,
    payment_method,
    status,
    notes,
    customer_name,
    customer_phone,
    created_at,
    updated_at
FROM sales;

-- Create pos_transaction_items view mapping to sale_items table
CREATE OR REPLACE VIEW pos_transaction_items AS
SELECT 
    id,
    sale_id as transaction_id,
    product_id,
    quantity,
    unit_type,
    unit_price,
    total_price,
    created_at
FROM sale_items;

-- ==========================================
-- 2. ADD MISSING COLUMNS
-- ==========================================

-- Add status column to products table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' AND column_name = 'status') THEN
        ALTER TABLE products 
        ADD COLUMN status VARCHAR(20) 
        CHECK (status IN ('active', 'inactive', 'discontinued', 'out_of_stock')) 
        DEFAULT 'active';
        
        -- Initialize status based on is_active
        UPDATE products 
        SET status = CASE 
            WHEN is_active = TRUE THEN 'active'
            ELSE 'inactive'
        END;
    END IF;
END $$;

-- Add delivery_status column to notifications table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'delivery_status') THEN
        ALTER TABLE notifications 
        ADD COLUMN delivery_status VARCHAR(20) 
        CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed', 'read')) 
        DEFAULT 'pending';
        
        -- Initialize delivery_status
        UPDATE notifications 
        SET delivery_status = CASE 
            WHEN read_at IS NOT NULL THEN 'read'
            WHEN created_at < NOW() - INTERVAL '1 hour' THEN 'delivered'
            ELSE 'sent'
        END;
    END IF;
END $$;

-- ==========================================
-- 3. GRANT PERMISSIONS
-- ==========================================

-- Grant permissions on views
GRANT SELECT ON pos_transactions TO authenticated;
GRANT SELECT ON pos_transaction_items TO authenticated;

-- ==========================================
-- 4. VALIDATION QUERY
-- ==========================================

-- Test that views work correctly
SELECT 'pos_transactions' as table_name, COUNT(*) as record_count FROM pos_transactions
UNION ALL
SELECT 'pos_transaction_items' as table_name, COUNT(*) as record_count FROM pos_transaction_items
UNION ALL
SELECT 'products_with_status' as table_name, COUNT(*) as record_count FROM products WHERE status IS NOT NULL
UNION ALL
SELECT 'notifications_with_delivery_status' as table_name, COUNT(*) as record_count FROM notifications WHERE delivery_status IS NOT NULL;
