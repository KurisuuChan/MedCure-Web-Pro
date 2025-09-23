-- ============================================
-- REVERT TO ORIGINAL POS SYSTEM
-- ============================================
-- This restores your original POS functionality before FEFO

-- Step 1: Drop all FEFO functions
DROP FUNCTION IF EXISTS process_sale_fefo(UUID, INTEGER, UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS process_fefo_sale(UUID, INTEGER, UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS process_simple_sale(UUID, INTEGER, UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS update_product_stock(UUID, INTEGER);

-- Step 2: Add missing column to sales table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales' AND column_name = 'completed_at'
    ) THEN
        ALTER TABLE sales ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Step 3: Ensure your sales table has the basic structure for POS
-- (This is just a check - won't create the table if it exists)
DO $$
BEGIN
    -- Just ensure the table exists and has basic columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales') THEN
        RAISE NOTICE 'Sales table does not exist - please create it first';
    END IF;
END $$;

-- Step 4: Simple stock update function (optional helper)
CREATE OR REPLACE FUNCTION simple_stock_update(
    p_product_id UUID,
    p_quantity_change INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Simple stock update
    UPDATE products 
    SET stock_in_pieces = GREATEST(0, COALESCE(stock_in_pieces, 0) + p_quantity_change),
        updated_at = NOW()
    WHERE id = p_product_id;
    
    RETURN TRUE;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION simple_stock_update(UUID, INTEGER) TO authenticated;

-- Success message
SELECT '✅ REVERTED TO ORIGINAL POS SYSTEM!' as message,
       'Your POS should now work like it did before FEFO was added' as info;