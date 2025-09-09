-- =================================================
-- 🔧 SAFE SCHEMA DEPLOYMENT - NO CONFLICTS
-- Handles existing triggers and functions gracefully
-- =================================================

-- This script safely deploys new features without trigger conflicts
-- Execute this instead if you get trigger errors

BEGIN;

-- =================================================
-- SECTION 1: PWD/SENIOR CITIZEN DISCOUNT SYSTEM
-- =================================================

DO $$
BEGIN
    -- Add discount columns to sales table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'discount_type') THEN
        ALTER TABLE sales ADD COLUMN discount_type VARCHAR(20) DEFAULT 'none' CHECK (discount_type IN ('none', 'pwd', 'senior', 'custom'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'discount_percentage') THEN
        ALTER TABLE sales ADD COLUMN discount_percentage DECIMAL(5,2) DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'discount_amount') THEN
        ALTER TABLE sales ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0 CHECK (discount_amount >= 0);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'subtotal_before_discount') THEN
        ALTER TABLE sales ADD COLUMN subtotal_before_discount DECIMAL(10,2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'pwd_senior_id') THEN
        ALTER TABLE sales ADD COLUMN pwd_senior_id VARCHAR(50);
    END IF;

    RAISE NOTICE 'PWD/Senior discount columns deployed successfully!';
END
$$;

-- =================================================
-- SECTION 2: TRANSACTION EDITING SYSTEM
-- =================================================

DO $$
BEGIN
    -- Add transaction editing audit columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'is_edited') THEN
        ALTER TABLE sales ADD COLUMN is_edited BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'edited_at') THEN
        ALTER TABLE sales ADD COLUMN edited_at TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'edited_by') THEN
        ALTER TABLE sales ADD COLUMN edited_by UUID REFERENCES users(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'edit_reason') THEN
        ALTER TABLE sales ADD COLUMN edit_reason TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'original_total') THEN
        ALTER TABLE sales ADD COLUMN original_total DECIMAL(10,2);
    END IF;

    RAISE NOTICE 'Transaction editing columns deployed successfully!';
END
$$;

-- =================================================
-- SECTION 3: STOCK MOVEMENTS TABLE (SAFE)
-- =================================================

DO $$
BEGIN
    -- Create stock_movements table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stock_movements') THEN
        CREATE TABLE stock_movements (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
            
            -- Movement details
            movement_type VARCHAR(20) CHECK (movement_type IN ('in', 'out', 'adjustment')) NOT NULL,
            quantity INTEGER NOT NULL CHECK (quantity != 0),
            reason VARCHAR(255) NOT NULL,
            
            -- Reference to related transaction (optional)
            reference_id UUID,
            reference_type VARCHAR(20),
            
            -- Stock levels after movement
            stock_before INTEGER NOT NULL,
            stock_after INTEGER NOT NULL,
            
            -- Timestamp
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create indexes
        CREATE INDEX idx_stock_movements_product_id ON stock_movements(product_id);
        CREATE INDEX idx_stock_movements_user_id ON stock_movements(user_id);
        CREATE INDEX idx_stock_movements_date ON stock_movements(created_at);
        CREATE INDEX idx_stock_movements_type ON stock_movements(movement_type);
        
        RAISE NOTICE 'Stock movements table created successfully!';
    ELSE
        RAISE NOTICE 'Stock movements table already exists - skipping creation';
    END IF;
END
$$;

-- =================================================
-- SECTION 4: BATCH INVENTORY (SAFE CREATION)
-- =================================================

DO $$
BEGIN
    -- Create batch inventory table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'batch_inventory') THEN
        CREATE TABLE batch_inventory (
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
            
            UNIQUE(product_id, batch_number)
        );

        -- Create indexes
        CREATE INDEX idx_batch_inventory_product ON batch_inventory(product_id);
        CREATE INDEX idx_batch_inventory_expiry ON batch_inventory(expiry_date);
        CREATE INDEX idx_batch_inventory_batch_number ON batch_inventory(batch_number);
        CREATE INDEX idx_batch_inventory_active ON batch_inventory(is_active);
        
        RAISE NOTICE 'Batch inventory table created successfully!';
    ELSE
        RAISE NOTICE 'Batch inventory table already exists - skipping creation';
    END IF;
END
$$;

-- =================================================
-- SECTION 5: ADD PERFORMANCE INDEXES AND RLS
-- =================================================

DO $$
BEGIN
    -- Add performance indexes (safe to re-run)
    CREATE INDEX IF NOT EXISTS idx_sales_discount_type ON sales(discount_type);
    CREATE INDEX IF NOT EXISTS idx_sales_edited ON sales(is_edited);
    CREATE INDEX IF NOT EXISTS idx_sales_pwd_senior_id ON sales(pwd_senior_id);

    -- Enable RLS for batch_inventory if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'batch_inventory') THEN
        ALTER TABLE batch_inventory ENABLE ROW LEVEL SECURITY;
        
        -- Drop and recreate RLS policy safely
        DROP POLICY IF EXISTS "batch_inventory_access" ON batch_inventory;
        CREATE POLICY "batch_inventory_access" ON batch_inventory FOR ALL TO authenticated USING (true);
    END IF;

    RAISE NOTICE 'Performance indexes and RLS policies created successfully!';
END
$$;

COMMIT;

-- =================================================
-- VERIFICATION
-- =================================================

SELECT 
    'Discount System' as feature,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'discount_type') 
         THEN 'DEPLOYED ✅' ELSE 'MISSING ❌' END as status
UNION ALL
SELECT 
    'Transaction Editing' as feature,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'is_edited') 
         THEN 'DEPLOYED ✅' ELSE 'MISSING ❌' END as status
UNION ALL
SELECT 
    'Stock Movements' as feature,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stock_movements') 
         THEN 'DEPLOYED ✅' ELSE 'MISSING ❌' END as status
UNION ALL
SELECT 
    'Batch Inventory' as feature,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'batch_inventory') 
         THEN 'DEPLOYED ✅' ELSE 'MISSING ❌' END as status;

SELECT '🎉 SAFE DEPLOYMENT COMPLETE! Payment processing should work now.' as result;
