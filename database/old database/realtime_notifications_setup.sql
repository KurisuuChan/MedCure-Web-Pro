-- Real-time Notification System Enhancement
-- This script adds database triggers and functions to support real-time notifications
-- for low stock alerts and stock movements

-- ==========================================
-- 1. NOTIFICATION TRIGGER FUNCTIONS
-- ==========================================

-- Function to check and log low stock events
CREATE OR REPLACE FUNCTION check_low_stock_trigger()
RETURNS TRIGGER AS $$
DECLARE
    stock_threshold INTEGER := 10;
BEGIN
    -- Log when a product drops to or below the threshold
    IF NEW.stock_in_pieces <= stock_threshold AND NEW.stock_in_pieces > 0 THEN
        -- Insert a record that can be picked up by realtime subscriptions
        INSERT INTO stock_movements (
            product_id,
            movement_type,
            quantity_changed,
            new_stock_level,
            notes,
            created_by,
            created_at
        ) VALUES (
            NEW.id,
            'low_stock_alert',
            0, -- No actual movement, just an alert
            NEW.stock_in_pieces,
            'Automated low stock alert triggered',
            NULL, -- System generated
            NOW()
        );
        
        -- Log to console for debugging
        RAISE NOTICE 'Low stock alert triggered for product %: % pieces remaining', NEW.name, NEW.stock_in_pieces;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check for expiring products (can be called periodically)
CREATE OR REPLACE FUNCTION check_expiring_products()
RETURNS TABLE(
    product_id UUID,
    product_name VARCHAR,
    expiry_date DATE,
    days_until_expiry INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.expiry_date,
        EXTRACT(DAY FROM (p.expiry_date - CURRENT_DATE))::INTEGER as days_until_expiry
    FROM products p
    WHERE p.expiry_date IS NOT NULL
        AND p.expiry_date <= CURRENT_DATE + INTERVAL '30 days'
        AND p.expiry_date > CURRENT_DATE
        AND p.stock_in_pieces > 0
    ORDER BY p.expiry_date ASC;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 2. DATABASE TRIGGERS
-- ==========================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS products_low_stock_trigger ON products;

-- Create trigger for low stock detection
CREATE TRIGGER products_low_stock_trigger
    AFTER UPDATE OF stock_in_pieces ON products
    FOR EACH ROW
    WHEN (NEW.stock_in_pieces <= 10 AND NEW.stock_in_pieces > 0)
    EXECUTE FUNCTION check_low_stock_trigger();

-- ==========================================
-- 3. INDEXES FOR PERFORMANCE
-- ==========================================

-- Index for low stock queries
CREATE INDEX IF NOT EXISTS idx_products_low_stock 
ON products (stock_in_pieces) 
WHERE stock_in_pieces <= 10 AND stock_in_pieces > 0;

-- Index for expiry date queries
CREATE INDEX IF NOT EXISTS idx_products_expiry_date 
ON products (expiry_date) 
WHERE expiry_date IS NOT NULL;

-- Index for stock movements by product
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_created 
ON stock_movements (product_id, created_at DESC);

-- ==========================================
-- 4. REALTIME PUBLICATION (For Supabase)
-- ==========================================

-- Enable realtime for stock_movements table (if not already enabled)
-- This allows the frontend to subscribe to real-time changes
-- Note: This might already be enabled in your Supabase setup

-- ALTER PUBLICATION supabase_realtime ADD TABLE stock_movements;
-- ALTER PUBLICATION supabase_realtime ADD TABLE products;

-- ==========================================
-- 5. HELPER FUNCTIONS
-- ==========================================

-- Function to get current low stock products
CREATE OR REPLACE FUNCTION get_low_stock_products()
RETURNS TABLE(
    product_id UUID,
    product_name VARCHAR,
    current_stock INTEGER,
    category VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.stock_in_pieces,
        p.category
    FROM products p
    WHERE p.stock_in_pieces <= 10 
        AND p.stock_in_pieces > 0
        AND p.is_active = true
    ORDER BY p.stock_in_pieces ASC, p.name ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to manually trigger stock checks (useful for testing)
CREATE OR REPLACE FUNCTION trigger_stock_notifications()
RETURNS INTEGER AS $$
DECLARE
    notification_count INTEGER := 0;
    product_record RECORD;
BEGIN
    -- Loop through all low stock products and create alerts
    FOR product_record IN 
        SELECT id, name, stock_in_pieces 
        FROM products 
        WHERE stock_in_pieces <= 10 AND stock_in_pieces > 0
    LOOP
        INSERT INTO stock_movements (
            product_id,
            movement_type,
            quantity_changed,
            new_stock_level,
            notes,
            created_by,
            created_at
        ) VALUES (
            product_record.id,
            'manual_stock_alert',
            0,
            product_record.stock_in_pieces,
            'Manual stock check notification',
            NULL,
            NOW()
        );
        
        notification_count := notification_count + 1;
    END LOOP;
    
    RETURN notification_count;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 6. EXAMPLE USAGE QUERIES
-- ==========================================

-- Get all current low stock products
-- SELECT * FROM get_low_stock_products();

-- Get all expiring products in the next 30 days
-- SELECT * FROM check_expiring_products();

-- Manually trigger stock notifications (for testing)
-- SELECT trigger_stock_notifications();

-- Check recent stock movements for notifications
-- SELECT sm.*, p.name as product_name 
-- FROM stock_movements sm 
-- JOIN products p ON sm.product_id = p.id 
-- WHERE sm.movement_type IN ('low_stock_alert', 'manual_stock_alert')
-- ORDER BY sm.created_at DESC 
-- LIMIT 10;

COMMENT ON FUNCTION check_low_stock_trigger() IS 'Automatically creates stock movement records when products reach low stock levels for real-time notification triggers';
COMMENT ON FUNCTION check_expiring_products() IS 'Returns all products expiring within 30 days for notification purposes';
COMMENT ON FUNCTION get_low_stock_products() IS 'Returns all currently low stock products for dashboard display';
COMMENT ON FUNCTION trigger_stock_notifications() IS 'Manually triggers stock notifications for all low stock products - useful for testing';
