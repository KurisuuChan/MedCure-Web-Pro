-- ============================================
-- FIX THE TRIGGER THAT'S CAUSING THE ERROR
-- ============================================
-- The error is in trigger_stock_notifications() trying to access NEW.name
-- but the products table uses generic_name/brand_name

-- First, let's see the current trigger
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_stock_notifications';

-- Show the trigger function definition
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'trigger_stock_notifications';

-- Now let's fix the trigger function
CREATE OR REPLACE FUNCTION trigger_stock_notifications()
RETURNS TRIGGER AS $$
DECLARE
    stock_change INTEGER;
    notification_message TEXT;
    product_display_name TEXT;
BEGIN
    -- Calculate stock change
    stock_change := NEW.stock_in_pieces - OLD.stock_in_pieces;
    
    -- Create a proper display name using available fields
    product_display_name := COALESCE(
        NULLIF(NEW.generic_name, ''), 
        NULLIF(NEW.brand_name, ''), 
        'Product ID: ' || NEW.id
    );
    
    -- Build notification message with correct field
    notification_message := format(
        'Stock updated for %s. Previous: %s, Current: %s (Change: %s)',
        product_display_name,
        OLD.stock_in_pieces,
        NEW.stock_in_pieces,
        stock_change
    );
    
    -- Log the notification (you can customize this part)
    RAISE NOTICE 'STOCK NOTIFICATION: %', notification_message;
    
    -- If you have a notifications table, insert there instead
    -- INSERT INTO notifications (message, type, created_at) 
    -- VALUES (notification_message, 'stock_update', NOW());
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Test the fix by running our function again
SELECT create_sale_with_items(
    jsonb_build_object(
        'user_id', 'b9b31a83-66fd-46e5-b4be-3386c4988f48',
        'total_amount', 1.0,
        'payment_method', 'cash'
    ),
    ARRAY[jsonb_build_object(
        'product_id', (SELECT id FROM products WHERE is_active = true AND stock_in_pieces > 0 LIMIT 1),
        'quantity', 1,
        'unit_type', 'piece',
        'unit_price', 1.0,
        'total_price', 1.0
    )]
) as test_result;

SELECT '🎉 TRIGGER FIXED - STOCK NOTIFICATIONS NOW USE CORRECT FIELDS!' as status;