-- ==========================================
-- CORRECTED IMMEDIATE SCHEMA ALIGNMENT FIX
-- ==========================================
-- Fixed version that avoids RLS issues with views
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
        
        RAISE NOTICE 'Added status column to products table and initialized data';
    ELSE
        RAISE NOTICE 'Status column already exists in products table';
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
        
        RAISE NOTICE 'Added delivery_status column to notifications table and initialized data';
    ELSE
        RAISE NOTICE 'Delivery_status column already exists in notifications table';
    END IF;
END $$;

-- ==========================================
-- 3. GRANT PERMISSIONS (NO RLS ON VIEWS)
-- ==========================================

-- Grant SELECT permissions on views to authenticated users
GRANT SELECT ON pos_transactions TO authenticated;
GRANT SELECT ON pos_transaction_items TO authenticated;

-- Views inherit security from underlying tables
-- No additional RLS setup needed for views

-- ==========================================
-- 4. VALIDATION QUERIES
-- ==========================================

-- Test that views work correctly
DO $$
DECLARE
    pos_trans_count INTEGER;
    pos_items_count INTEGER;
    products_status_count INTEGER;
    notifications_status_count INTEGER;
BEGIN
    -- Count records in views
    SELECT COUNT(*) INTO pos_trans_count FROM pos_transactions;
    SELECT COUNT(*) INTO pos_items_count FROM pos_transaction_items;
    SELECT COUNT(*) INTO products_status_count FROM products WHERE status IS NOT NULL;
    SELECT COUNT(*) INTO notifications_status_count FROM notifications WHERE delivery_status IS NOT NULL;
    
    -- Output results
    RAISE NOTICE 'Validation Results:';
    RAISE NOTICE 'pos_transactions view: % records', pos_trans_count;
    RAISE NOTICE 'pos_transaction_items view: % records', pos_items_count;
    RAISE NOTICE 'products with status: % records', products_status_count;
    RAISE NOTICE 'notifications with delivery_status: % records', notifications_status_count;
    
    -- Success message
    RAISE NOTICE '✅ Schema alignment completed successfully!';
    RAISE NOTICE 'ML services should now be able to access data through compatibility views';
END $$;

-- Final validation query for manual verification
SELECT 
    'VALIDATION_SUMMARY' as check_type,
    'pos_transactions' as table_name, 
    COUNT(*) as record_count,
    'VIEW_WORKING' as status
FROM pos_transactions
UNION ALL
SELECT 
    'VALIDATION_SUMMARY' as check_type,
    'pos_transaction_items' as table_name, 
    COUNT(*) as record_count,
    'VIEW_WORKING' as status
FROM pos_transaction_items
UNION ALL
SELECT 
    'VALIDATION_SUMMARY' as check_type,
    'products_with_status' as table_name, 
    COUNT(*) as record_count,
    'COLUMN_ADDED' as status
FROM products WHERE status IS NOT NULL
UNION ALL
SELECT 
    'VALIDATION_SUMMARY' as check_type,
    'notifications_with_delivery_status' as table_name, 
    COUNT(*) as record_count,
    'COLUMN_ADDED' as status
FROM notifications WHERE delivery_status IS NOT NULL;
