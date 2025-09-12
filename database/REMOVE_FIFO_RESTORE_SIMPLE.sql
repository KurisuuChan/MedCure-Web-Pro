-- COMPLETE FIFO REMOVAL AND SYSTEM RESTORATION
-- This script removes all FIFO-related additions and restores simple stock management
-- =============================================================================
-- STEP 1: REMOVE FIFO DATABASE FUNCTIONS
-- =============================================================================

-- Remove FIFO functions
DROP FUNCTION IF EXISTS execute_fifo_deduction(uuid, integer, uuid, uuid);
DROP FUNCTION IF EXISTS get_fifo_available_stock(uuid, integer);
DROP FUNCTION IF EXISTS validate_fifo_stock_availability(uuid, integer);

-- Remove any FIFO-related triggers
DROP TRIGGER IF EXISTS trigger_update_product_stock_after_batch_change ON batches;
DROP FUNCTION IF EXISTS update_product_stock_from_batches();

-- =============================================================================
-- STEP 2: REMOVE FIFO-RELATED TABLES AND COLUMNS
-- =============================================================================

-- Remove FIFO-related columns from sales table
ALTER TABLE public.sales DROP COLUMN IF EXISTS completed_at;
ALTER TABLE public.sales DROP COLUMN IF EXISTS fifo_processed;
ALTER TABLE public.sales DROP COLUMN IF EXISTS fifo_results;

-- Remove FIFO-related tables
DROP TABLE IF EXISTS public.batch_movements CASCADE;
DROP TABLE IF EXISTS public.stock_escalations CASCADE;

-- Remove FIFO-related views
DROP VIEW IF EXISTS fifo_stock_status;
DROP VIEW IF EXISTS batch_expiry_monitor;

-- =============================================================================
-- STEP 3: RESTORE SIMPLE STOCK MANAGEMENT
-- =============================================================================

-- Create simple stock deduction function (replaces all FIFO complexity)
CREATE OR REPLACE FUNCTION simple_stock_deduction(
  p_product_id uuid,
  p_quantity integer,
  p_sale_id uuid DEFAULT NULL,
  p_user_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_stock integer;
  product_name text;
BEGIN
  -- Get current stock and product name
  SELECT stock_in_pieces, name INTO current_stock, product_name
  FROM products 
  WHERE id = p_product_id AND is_archived = false;
  
  -- Check if product exists
  IF current_stock IS NULL THEN
    RAISE EXCEPTION 'Product not found or is archived';
  END IF;
  
  -- Check sufficient stock
  IF current_stock < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock for product "%". Available: %, Requested: %', 
      product_name, current_stock, p_quantity;
  END IF;
  
  -- Deduct stock
  UPDATE products 
  SET stock_in_pieces = stock_in_pieces - p_quantity,
      updated_at = now()
  WHERE id = p_product_id;
  
  -- Log the stock movement (simple tracking)
  INSERT INTO stock_movements (
    product_id, movement_type, quantity, 
    reference_id, reference_type, performed_by, notes
  ) VALUES (
    p_product_id, 'out', p_quantity,
    p_sale_id, 'sale', p_user_id, 'Stock deduction from sale'
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'product_id', p_product_id,
    'deducted_quantity', p_quantity,
    'remaining_stock', current_stock - p_quantity,
    'message', format('Successfully deducted %s pieces from %s', p_quantity, product_name)
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'product_id', p_product_id,
      'requested_quantity', p_quantity
    );
END;
$$;

-- =============================================================================
-- STEP 4: ENSURE SIMPLE STOCK MOVEMENTS TABLE EXISTS
-- =============================================================================

-- Create simple stock movements table for tracking (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id),
  movement_type varchar(10) NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment')),
  quantity integer NOT NULL CHECK (quantity > 0),
  reference_id uuid, -- Can reference sales, purchases, etc.
  reference_type varchar(50), -- 'sale', 'purchase', 'adjustment', etc.
  performed_by uuid REFERENCES users(id),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at);

-- =============================================================================
-- STEP 5: RESTORE ORIGINAL PAYMENT METHOD CONSTRAINTS
-- =============================================================================

-- Restore original payment method constraint (remove gcash if it was added for FIFO)
ALTER TABLE public.sales DROP CONSTRAINT IF EXISTS sales_payment_method_check;
ALTER TABLE public.sales ADD CONSTRAINT sales_payment_method_check 
  CHECK (payment_method::text = ANY (ARRAY[
    'cash'::character varying, 
    'card'::character varying, 
    'digital'::character varying
  ]::text[]));

-- =============================================================================
-- STEP 6: CLEAN UP SYSTEM SETTINGS
-- =============================================================================

-- Remove FIFO-related system settings (if system_settings table exists)
DELETE FROM system_settings 
WHERE setting_key IN (
  'enable_fifo_inventory',
  'fifo_expiry_warning_days',
  'auto_escalate_critical_stock',
  'emergency_reorder_threshold',
  'batch_tracking_enabled'
);

-- =============================================================================
-- STEP 7: VERIFICATION QUERIES
-- =============================================================================

-- Verify the cleanup
SELECT 'FIFO Cleanup Verification' as status;

-- Check for remaining FIFO functions
SELECT 'Remaining FIFO functions:' as check_type, count(*) as count
FROM information_schema.routines 
WHERE routine_name LIKE '%fifo%' 
  AND routine_schema = 'public';

-- Check for remaining FIFO columns
SELECT 'Remaining FIFO columns in sales:' as check_type, count(*) as count
FROM information_schema.columns 
WHERE table_name = 'sales' 
  AND column_name IN ('completed_at', 'fifo_processed', 'fifo_results');

-- Check products with stock
SELECT 'Products with stock:' as check_type, count(*) as count
FROM products 
WHERE stock_in_pieces > 0 AND is_archived = false;

-- Test the simple stock function exists
SELECT 'Simple stock function test:' as test_type, 
       'Function exists and is ready to use' as result
WHERE EXISTS (
  SELECT 1 FROM information_schema.routines 
  WHERE routine_name = 'simple_stock_deduction'
    AND routine_schema = 'public'
);

-- Final status
SELECT 'System restored to simple stock management!' as final_status;

-- =============================================================================
-- USAGE EXAMPLE
-- =============================================================================

/*
-- Example usage of the new simple stock deduction function:

SELECT simple_stock_deduction(
  'your-product-uuid-here'::uuid,  -- Product ID
  2,                                -- Quantity to deduct
  'your-sale-uuid-here'::uuid,      -- Sale reference (optional)
  'your-user-uuid-here'::uuid       -- User who performed the action (optional)
);

-- Expected response:
{
  "success": true,
  "product_id": "uuid",
  "deducted_quantity": 2,
  "remaining_stock": 8,
  "message": "Successfully deducted 2 pieces from Product Name"
}
*/