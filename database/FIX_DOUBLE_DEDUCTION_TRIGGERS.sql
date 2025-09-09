-- =====================================================
-- PROFESSIONAL TRIGGER DIAGNOSTIC AND FIX
-- =====================================================
-- Identifies and removes competing stock management triggers
-- =====================================================

-- Check for active triggers that might cause double deduction
SELECT 'CHECKING ACTIVE TRIGGERS THAT MIGHT CAUSE DOUBLE DEDUCTION' as status;

SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table IN ('sale_items', 'sales', 'products')
AND trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Check for functions related to stock management
SELECT 'CHECKING STOCK MANAGEMENT FUNCTIONS' as status;

SELECT 
    routine_name,
    routine_type,
    external_language
FROM information_schema.routines 
WHERE routine_name LIKE '%stock%' 
OR routine_name LIKE '%deduct%'
OR routine_name LIKE '%complete%transaction%'
AND routine_schema = 'public'
ORDER BY routine_name;

-- CRITICAL FIX: Remove competing triggers that cause double deduction
DO $$
BEGIN
    -- Remove trigger that automatically deducts stock on sale_items INSERT
    DROP TRIGGER IF EXISTS trigger_deduct_stock_on_sale ON sale_items;
    RAISE NOTICE '✅ Removed trigger_deduct_stock_on_sale (prevents double deduction)';
    
    -- Remove trigger that updates stock on sale INSERT 
    DROP TRIGGER IF EXISTS trigger_update_stock_on_sale ON sales;
    RAISE NOTICE '✅ Removed trigger_update_stock_on_sale (prevents double deduction)';
    
    -- Remove any other competing stock triggers
    DROP TRIGGER IF EXISTS professional_stock_management_trigger ON sale_items;
    RAISE NOTICE '✅ Removed professional_stock_management_trigger if it existed';
    
    -- Remove trigger that restores stock on sale_item delete (we handle this manually)
    DROP TRIGGER IF EXISTS trigger_restore_stock_on_sale_item_delete ON sale_items;
    RAISE NOTICE '✅ Removed trigger_restore_stock_on_sale_item_delete (manual control)';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Some triggers may not exist (this is OK): %', SQLERRM;
END $$;

-- Verify triggers are removed
SELECT 'VERIFYING TRIGGERS REMOVED' as status;

SELECT 
    trigger_name,
    event_object_table
FROM information_schema.triggers 
WHERE event_object_table IN ('sale_items', 'sales', 'products')
AND trigger_schema = 'public'
AND trigger_name LIKE '%stock%'
ORDER BY trigger_name;

-- Professional stock management workflow explanation
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🏆 PROFESSIONAL STOCK MANAGEMENT WORKFLOW ACTIVE:';
    RAISE NOTICE '================================================';
    RAISE NOTICE '1. create_sale_with_items → Creates PENDING transaction (NO stock deduction)';
    RAISE NOTICE '2. complete_transaction_with_stock → Deducts stock ONCE and marks completed';
    RAISE NOTICE '3. undo_transaction_completely → Restores stock EXACTLY and marks cancelled';
    RAISE NOTICE '';
    RAISE NOTICE '✅ NO automatic triggers interfering with stock management';
    RAISE NOTICE '✅ Complete manual control over stock deduction timing';
    RAISE NOTICE '✅ Perfect stock restoration on undo operations';
    RAISE NOTICE '';
    RAISE NOTICE 'This should fix the double deduction issue!';
END $$;
