-- =================================================
-- 🔧 FIX PROBLEMATIC FUNCTIONS WITH QUANTITY_CHANGED
-- Clean up the trigger functions that are causing the payment error
-- =================================================

-- Drop existing functions first to avoid return type conflicts
DROP FUNCTION IF EXISTS check_low_stock_trigger() CASCADE;
DROP FUNCTION IF EXISTS trigger_stock_notifications() CASCADE;

-- Fix check_low_stock_trigger function
CREATE OR REPLACE FUNCTION check_low_stock_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if stock is low after update
    IF NEW.stock_in_pieces <= COALESCE(NEW.reorder_level, 10) THEN
        -- Try to insert notification, handle gracefully if table doesn't exist
        BEGIN
            INSERT INTO notifications (
                user_id, 
                title, 
                message, 
                type, 
                created_at
            ) 
            SELECT 
                u.id,
                'Low Stock Alert',
                'Product ' || NEW.name || ' is running low. Current stock: ' || NEW.stock_in_pieces,
                'stock_alert',
                NOW()
            FROM auth.users u 
            WHERE u.raw_user_meta_data->>'role' IN ('admin', 'manager', 'pharmacist')
            ON CONFLICT DO NOTHING;
        EXCEPTION WHEN OTHERS THEN
            -- Log the issue but don't fail the transaction
            RAISE NOTICE 'Could not create notification: %', SQLERRM;
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix trigger_stock_notifications function
CREATE FUNCTION trigger_stock_notifications()
RETURNS TRIGGER AS $$
DECLARE
    stock_change INTEGER;
    notification_message TEXT;
BEGIN
    -- Calculate stock change
    IF TG_OP = 'UPDATE' THEN
        stock_change := NEW.stock_in_pieces - OLD.stock_in_pieces;
        
        -- Only notify for significant changes
        IF ABS(stock_change) > 0 THEN
            notification_message := format(
                'Stock updated for %s. Previous: %s, Current: %s (Change: %s)',
                NEW.name,
                OLD.stock_in_pieces,
                NEW.stock_in_pieces,
                stock_change
            );
            
            -- Try to insert notification, handle gracefully if table doesn't exist
            BEGIN
                INSERT INTO notifications (
                    user_id,
                    title,
                    message,
                    type,
                    created_at
                )
                SELECT 
                    u.id,
                    'Stock Movement',
                    notification_message,
                    'stock_movement',
                    NOW()
                FROM auth.users u
                WHERE u.raw_user_meta_data->>'role' IN ('admin', 'manager')
                ON CONFLICT DO NOTHING;
            EXCEPTION WHEN OTHERS THEN
                -- Log the issue but don't fail the transaction
                RAISE NOTICE 'Could not create notification: %', SQLERRM;
            END;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate any problematic triggers
DROP TRIGGER IF EXISTS trigger_check_low_stock ON products;
DROP TRIGGER IF EXISTS trigger_stock_notifications ON products;

-- Recreate triggers with the fixed functions
CREATE TRIGGER trigger_check_low_stock
    AFTER UPDATE OF stock_in_pieces ON products
    FOR EACH ROW
    EXECUTE FUNCTION check_low_stock_trigger();

CREATE TRIGGER trigger_stock_notifications
    AFTER UPDATE OF stock_in_pieces ON products
    FOR EACH ROW
    EXECUTE FUNCTION trigger_stock_notifications();

-- Grant permissions
GRANT EXECUTE ON FUNCTION check_low_stock_trigger() TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_stock_notifications() TO authenticated;

-- Verify the functions are clean
DO $$
DECLARE
    func_body TEXT;
BEGIN
    -- Check check_low_stock_trigger
    SELECT pg_get_functiondef(p.oid) INTO func_body
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'check_low_stock_trigger' AND n.nspname = 'public';
    
    IF func_body LIKE '%quantity_changed%' THEN
        RAISE EXCEPTION 'check_low_stock_trigger still contains quantity_changed!';
    ELSE
        RAISE NOTICE 'check_low_stock_trigger is clean ✅';
    END IF;
    
    -- Check trigger_stock_notifications
    SELECT pg_get_functiondef(p.oid) INTO func_body
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'trigger_stock_notifications' AND n.nspname = 'public';
    
    IF func_body LIKE '%quantity_changed%' THEN
        RAISE EXCEPTION 'trigger_stock_notifications still contains quantity_changed!';
    ELSE
        RAISE NOTICE 'trigger_stock_notifications is clean ✅';
    END IF;
END
$$;

SELECT 
    '🎉 TRIGGER FUNCTIONS FIXED!' as status,
    'All quantity_changed references removed from trigger functions' as message,
    NOW() as fixed_at;
