-- =====================================================
-- 🚨 COMPREHENSIVE TRANSACTION WORKFLOW DIAGNOSTIC
-- =====================================================
-- Tests the complete transaction system end-to-end
-- Verifies unified service integration
-- =====================================================

\echo '🚨 COMPREHENSIVE TRANSACTION WORKFLOW DIAGNOSTIC STARTING...'

-- Step 1: Clean test environment
\echo '🧹 Step 1: Cleaning test environment...'

BEGIN;

-- Delete any test transactions from today
DELETE FROM sale_items WHERE sale_id IN (
  SELECT id FROM sales 
  WHERE customer_name LIKE 'TEST_CUSTOMER_%' 
  AND created_at >= CURRENT_DATE
);

DELETE FROM sales 
WHERE customer_name LIKE 'TEST_CUSTOMER_%' 
AND created_at >= CURRENT_DATE;

COMMIT;

\echo '✅ Test environment cleaned'

-- Step 2: Test Database Functions Exist
\echo '🔍 Step 2: Verifying database functions exist...'

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_sale_with_items') 
    THEN '✅ create_sale_with_items EXISTS'
    ELSE '❌ create_sale_with_items MISSING'
  END as function_1,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'complete_transaction_with_stock') 
    THEN '✅ complete_transaction_with_stock EXISTS'
    ELSE '❌ complete_transaction_with_stock MISSING'
  END as function_2,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'edit_transaction_with_stock_management') 
    THEN '✅ edit_transaction_with_stock_management EXISTS'
    ELSE '❌ edit_transaction_with_stock_management MISSING'
  END as function_3,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'undo_transaction_completely') 
    THEN '✅ undo_transaction_completely EXISTS'
    ELSE '❌ undo_transaction_completely MISSING'
  END as function_4;

-- Step 3: Test Product Stock Levels
\echo '🎯 Step 3: Checking initial stock levels...'

SELECT 
  id,
  name,
  stock_quantity,
  unit_type,
  price_per_piece
FROM products 
WHERE stock_quantity > 0 
LIMIT 3;

-- Get a test product
DO $$
DECLARE
  test_product_id INT;
  test_product_name TEXT;
  initial_stock INT;
  test_transaction_id UUID;
  pending_result JSONB;
  completion_result JSONB;
  final_stock INT;
BEGIN
  -- Get first available product
  SELECT id, name, stock_quantity 
  INTO test_product_id, test_product_name, initial_stock
  FROM products 
  WHERE stock_quantity >= 5 
  LIMIT 1;

  IF test_product_id IS NULL THEN
    RAISE EXCEPTION '❌ No products with sufficient stock for testing';
  END IF;

  RAISE NOTICE '🎯 Testing with product: % (ID: %, Initial Stock: %)', test_product_name, test_product_id, initial_stock;

  -- Step 4: Test Pending Transaction Creation
  RAISE NOTICE '🔧 Step 4: Creating pending transaction...';

  SELECT create_sale_with_items(
    ROW(
      'test-user-123'::TEXT,           -- user_id
      150.00,                          -- total_amount
      'cash'::TEXT,                    -- payment_method  
      'TEST_CUSTOMER_PENDING'::TEXT,   -- customer_name
      '09123456789'::TEXT,             -- customer_phone
      'Test pending transaction'::TEXT, -- notes
      'none'::TEXT,                    -- discount_type
      0,                               -- discount_percentage
      0,                               -- discount_amount
      150.00,                          -- subtotal_before_discount
      NULL                             -- pwd_senior_id
    )::sale_record,
    ARRAY[
      ROW(
        test_product_id,               -- product_id
        2,                             -- quantity (in pieces)
        'piece'::TEXT,                 -- unit_type
        75.00,                         -- unit_price
        150.00                         -- total_price
      )::sale_item_record
    ]
  ) INTO pending_result;

  test_transaction_id := (pending_result->>'id')::UUID;
  RAISE NOTICE '✅ Pending transaction created: %', test_transaction_id;

  -- Verify stock NOT deducted yet
  SELECT stock_quantity INTO final_stock 
  FROM products 
  WHERE id = test_product_id;
  
  IF final_stock = initial_stock THEN
    RAISE NOTICE '✅ Stock correctly NOT deducted during pending phase: %', final_stock;
  ELSE
    RAISE NOTICE '❌ PROBLEM: Stock was deducted during pending phase: % -> %', initial_stock, final_stock;
  END IF;

  -- Step 5: Test Transaction Completion
  RAISE NOTICE '🔧 Step 5: Completing transaction...';

  SELECT complete_transaction_with_stock(test_transaction_id) INTO completion_result;
  RAISE NOTICE '✅ Transaction completed: %', completion_result;

  -- Verify stock IS deducted now
  SELECT stock_quantity INTO final_stock 
  FROM products 
  WHERE id = test_product_id;
  
  IF final_stock = (initial_stock - 2) THEN
    RAISE NOTICE '✅ Stock correctly deducted after completion: % -> %', initial_stock, final_stock;
  ELSE
    RAISE NOTICE '❌ PROBLEM: Stock deduction incorrect: Expected %, Got %', (initial_stock - 2), final_stock;
  END IF;

  -- Step 6: Test Transaction Editing
  RAISE NOTICE '🔧 Step 6: Testing transaction editing...';

  PERFORM edit_transaction_with_stock_management(
    test_transaction_id,
    ARRAY[
      ROW(
        test_product_id,               -- product_id
        3,                             -- NEW quantity (increased by 1)
        'piece'::TEXT,                 -- unit_type
        75.00,                         -- unit_price
        225.00                         -- total_price
      )::sale_item_record
    ],
    ROW(
      'test-editor-123'::TEXT,         -- edited_by
      'Testing edit functionality'::TEXT, -- edit_reason
      225.00,                          -- total_amount
      225.00,                          -- subtotal_before_discount
      'none'::TEXT,                    -- discount_type
      0,                               -- discount_percentage
      0,                               -- discount_amount
      NULL                             -- pwd_senior_id
    )::edit_data_record
  );

  RAISE NOTICE '✅ Transaction edit completed';

  -- Verify stock adjustment
  SELECT stock_quantity INTO final_stock 
  FROM products 
  WHERE id = test_product_id;
  
  IF final_stock = (initial_stock - 3) THEN
    RAISE NOTICE '✅ Stock correctly adjusted after edit: % -> %', initial_stock, final_stock;
  ELSE
    RAISE NOTICE '❌ PROBLEM: Stock adjustment incorrect after edit: Expected %, Got %', (initial_stock - 3), final_stock;
  END IF;

  -- Step 7: Test Transaction Undo
  RAISE NOTICE '🔧 Step 7: Testing transaction undo...';

  PERFORM undo_transaction_completely(
    test_transaction_id,
    'Testing undo functionality'
  );

  RAISE NOTICE '✅ Transaction undo completed';

  -- Verify stock restored
  SELECT stock_quantity INTO final_stock 
  FROM products 
  WHERE id = test_product_id;
  
  IF final_stock = initial_stock THEN
    RAISE NOTICE '✅ Stock correctly restored after undo: %', final_stock;
  ELSE
    RAISE NOTICE '❌ PROBLEM: Stock not properly restored: Expected %, Got %', initial_stock, final_stock;
  END IF;

  -- Final Status Check
  RAISE NOTICE '📊 Final transaction status check...';
  
  SELECT 
    status,
    is_edited,
    total_amount,
    created_at,
    edited_at
  FROM sales 
  WHERE id = test_transaction_id;

END $$;

-- Step 8: Verify Database Integrity
\echo '🔍 Step 8: Database integrity check...'

SELECT 
  'sales' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
  COUNT(*) FILTER (WHERE is_edited = true) as edited_transactions
FROM sales
WHERE created_at >= CURRENT_DATE

UNION ALL

SELECT 
  'sale_items' as table_name,
  COUNT(*) as total_records,
  NULL as completed,
  NULL as pending, 
  NULL as cancelled,
  NULL as edited_transactions
FROM sale_items si
JOIN sales s ON si.sale_id = s.id
WHERE s.created_at >= CURRENT_DATE;

-- Step 9: Check Stock Movement Audit Trail
\echo '📋 Step 9: Stock movement audit trail...'

SELECT 
  sm.product_id,
  p.name,
  sm.movement_type,
  sm.quantity_change,
  sm.reference_type,
  sm.created_at
FROM stock_movements sm
JOIN products p ON sm.product_id = p.id
WHERE sm.created_at >= CURRENT_DATE
ORDER BY sm.created_at DESC
LIMIT 10;

-- Step 10: Summary Report
\echo '📊 DIAGNOSTIC SUMMARY REPORT'

SELECT 
  '🎯 UNIFIED SALES SERVICE DIAGNOSTIC COMPLETE' as status,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Database functions operational'
    ELSE '❌ Database functions missing'
  END as function_status,
  NOW() as completed_at
FROM pg_proc 
WHERE proname IN (
  'create_sale_with_items',
  'complete_transaction_with_stock', 
  'edit_transaction_with_stock_management',
  'undo_transaction_completely'
);

\echo '✅ COMPREHENSIVE DIAGNOSTIC COMPLETED'
\echo '📋 Check the output above for any ❌ errors'
\echo '🚀 If all tests pass, the unified service is ready for use'
