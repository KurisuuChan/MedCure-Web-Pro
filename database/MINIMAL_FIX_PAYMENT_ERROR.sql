-- =================================================
-- 🚨 MINIMAL FIX FOR PAYMENT PROCESSING ERROR
-- Execute this to fix the "quantity_changed" column error
-- =================================================

-- This script only deploys the essential features needed for payment processing
-- Minimal approach to avoid any conflicts

BEGIN;

-- =================================================
-- ESSENTIAL FIX 1: DISCOUNT SYSTEM COLUMNS
-- =================================================

-- Add only the discount columns needed for payment processing
ALTER TABLE sales ADD COLUMN IF NOT EXISTS discount_type VARCHAR(20) DEFAULT 'none';
ALTER TABLE sales ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5,2) DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS subtotal_before_discount DECIMAL(10,2);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS pwd_senior_id VARCHAR(50);

-- =================================================
-- ESSENTIAL FIX 2: STOCK MOVEMENTS TABLE
-- =================================================

-- Create stock_movements table with correct structure (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    movement_type VARCHAR(20) CHECK (movement_type IN ('in', 'out', 'adjustment')) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity != 0),
    reason VARCHAR(255) NOT NULL,
    reference_id UUID,
    reference_type VARCHAR(20),
    stock_before INTEGER NOT NULL,
    stock_after INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add basic indexes (safe to re-run)
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_user_id ON stock_movements(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(created_at);

-- =================================================
-- ESSENTIAL FIX 3: REMOVE PROBLEMATIC TRIGGERS
-- =================================================

-- Drop any triggers that might cause the quantity_changed error
DROP TRIGGER IF EXISTS low_stock_notification_trigger ON products;
DROP FUNCTION IF EXISTS handle_low_stock_notification();

COMMIT;

-- =================================================
-- VERIFICATION
-- =================================================

SELECT 
    'Discount Columns' as feature,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'discount_type') 
         THEN 'READY ✅' ELSE 'MISSING ❌' END as status
UNION ALL
SELECT 
    'Stock Movements Table' as feature,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stock_movements') 
         THEN 'READY ✅' ELSE 'MISSING ❌' END as status;

SELECT '🎉 MINIMAL FIX COMPLETE! Try payment processing now.' as result;
