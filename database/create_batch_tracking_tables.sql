-- ============================================
-- BATCH TRACKING SYSTEM - DATABASE SCHEMA
-- ============================================
-- Creates the core tables for the new batch tracking system
-- Run this SQL in your Supabase SQL editor

-- 1. Create product_batches table
CREATE TABLE IF NOT EXISTS product_batches (
    id BIGSERIAL PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    batch_number TEXT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    expiry_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Add indexes for better performance
    CONSTRAINT unique_batch_per_product UNIQUE(product_id, batch_number, expiry_date)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_product_batches_product_id ON product_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_product_batches_expiry_date ON product_batches(expiry_date);
CREATE INDEX IF NOT EXISTS idx_product_batches_created_at ON product_batches(created_at);

-- 2. Create inventory_logs table for audit trail
CREATE TABLE IF NOT EXISTS inventory_logs (
    id BIGSERIAL PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity_change INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL CHECK (new_quantity >= 0),
    notes TEXT,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for inventory_logs
CREATE INDEX IF NOT EXISTS idx_inventory_logs_product_id ON inventory_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_user_id ON inventory_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_created_at ON inventory_logs(created_at);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE product_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for product_batches
CREATE POLICY "Users can view product batches" ON product_batches
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert product batches" ON product_batches
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update product batches" ON product_batches
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Admin users can delete product batches" ON product_batches
    FOR DELETE USING (auth.role() = 'authenticated');

-- 5. Create RLS policies for inventory_logs
CREATE POLICY "Users can view inventory logs" ON inventory_logs
    FOR SELECT USING (true);

CREATE POLICY "System can insert inventory logs" ON inventory_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 6. Add comments for documentation
COMMENT ON TABLE product_batches IS 'Stores individual batches of products with their own quantities and expiry dates';
COMMENT ON TABLE inventory_logs IS 'Audit trail for all inventory changes and stock movements';

COMMENT ON COLUMN product_batches.batch_number IS 'Supplier batch number (optional)';
COMMENT ON COLUMN product_batches.quantity IS 'Quantity of items in this specific batch';
COMMENT ON COLUMN product_batches.expiry_date IS 'Expiry date for this batch';

COMMENT ON COLUMN inventory_logs.quantity_change IS 'Amount added (+) or removed (-) from inventory';
COMMENT ON COLUMN inventory_logs.new_quantity IS 'Total stock after this change';
COMMENT ON COLUMN inventory_logs.notes IS 'Description of the inventory change';