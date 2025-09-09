-- 🚨 CRITICAL FIX: REMOVE COMPETING STOCK TRIGGER
-- The trigger_update_stock_on_sale is causing double stock deduction

-- IMMEDIATE FIX: Remove the competing trigger
DROP TRIGGER IF EXISTS trigger_update_stock_on_sale ON sale_items;

-- VERIFICATION: Check that the trigger is removed
SELECT 
    trigger_name,
    event_object_table,
    'This trigger should be GONE after running the fix' as status
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_update_stock_on_sale'
AND event_object_table = 'sale_items';

-- ADDITIONAL SAFETY: Check for any other stock-related triggers
SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation,
    'Review this trigger - might need removal' as recommendation
FROM information_schema.triggers 
WHERE event_object_table IN ('sales', 'sale_items')
AND (
    trigger_name ILIKE '%stock%' 
    OR trigger_name ILIKE '%deduct%'
    OR trigger_name ILIKE '%inventory%'
)
ORDER BY event_object_table, trigger_name;

-- FINAL VERIFICATION: Ensure only safe triggers remain
SELECT 
    trigger_name,
    event_object_table,
    CASE 
        WHEN trigger_name = 'trigger_validate_sale_total' THEN 'SAFE - Validates totals'
        WHEN trigger_name = 'update_sales_updated_at' THEN 'SAFE - Updates timestamps'
        ELSE 'REVIEW - Might cause conflicts'
    END as safety_status
FROM information_schema.triggers 
WHERE event_object_table IN ('sales', 'sale_items')
ORDER BY event_object_table, trigger_name;
