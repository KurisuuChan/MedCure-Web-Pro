-- 🛠️ **MISSING DATABASE STRUCTURES & FUNCTIONS**
-- Additional structures needed for the MedCure-Pro application

-- ==========================================
-- 1. STORED PROCEDURES FOR COMPLEX OPERATIONS
-- ==========================================

-- Function to create sale with items in a transaction
CREATE OR REPLACE FUNCTION create_sale_with_items(
    sale_data JSONB,
    sale_items JSONB[]
) RETURNS JSONB AS $$
DECLARE
    new_sale_id UUID;
    sale_result JSONB;
    item JSONB;
    sale_item_record RECORD;
BEGIN
    -- Insert the sale
    INSERT INTO sales (
        user_id,
        total_amount,
        payment_method,
        status,
        notes,
        customer_name,
        customer_phone
    ) 
    SELECT 
        (sale_data->>'user_id')::UUID,
        (sale_data->>'total_amount')::DECIMAL,
        sale_data->>'payment_method',
        COALESCE(sale_data->>'status', 'completed'),
        sale_data->>'notes',
        sale_data->>'customer_name',
        sale_data->>'customer_phone'
    RETURNING id INTO new_sale_id;

    -- Insert sale items
    FOREACH item IN ARRAY sale_items LOOP
        INSERT INTO sale_items (
            sale_id,
            product_id,
            quantity,
            unit_type,
            unit_price,
            total_price
        ) VALUES (
            new_sale_id,
            (item->>'product_id')::UUID,
            (item->>'quantity')::INTEGER,
            COALESCE(item->>'unit_type', 'piece'),
            (item->>'unit_price')::DECIMAL,
            (item->>'total_price')::DECIMAL
        );
    END LOOP;

    -- Get the complete sale with items
    SELECT jsonb_build_object(
        'sale_id', new_sale_id,
        'success', true,
        'message', 'Sale created successfully'
    ) INTO sale_result;

    RETURN sale_result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 2. VIEWS FOR COMMON QUERIES
-- ==========================================

-- Drop existing view first to avoid column conflicts
DROP VIEW IF EXISTS sales_summary;

-- Sales summary view with computed totals
CREATE VIEW sales_summary AS
SELECT
    s.id,
    s.created_at,
    s.total_amount,
    s.payment_method,
    s.status,
    s.customer_name,
    s.customer_phone,
    u.first_name || ' ' || u.last_name as cashier_name,
    u.email as cashier_email,
    COUNT(si.id) as items_count,
    SUM(si.quantity) as total_items
FROM sales s
LEFT JOIN users u ON s.user_id = u.id
LEFT JOIN sale_items si ON s.id = si.sale_id
GROUP BY s.id, s.created_at, s.total_amount, s.payment_method, s.status, s.customer_name, s.customer_phone, u.first_name, u.last_name, u.email;-- Drop existing view first to avoid column conflicts
DROP VIEW IF EXISTS product_stock_status;

-- Product stock status view
CREATE VIEW product_stock_status AS
SELECT 
    p.*,
    CASE 
        WHEN p.stock_in_pieces = 0 THEN 'out_of_stock'
        WHEN p.stock_in_pieces < 10 THEN 'low_stock'
        WHEN p.stock_in_pieces < 50 THEN 'medium_stock'
        ELSE 'good_stock'
    END as stock_status,
    (p.stock_in_pieces * p.price_per_piece) as stock_value
FROM products p
WHERE p.is_active = true;

-- Drop existing view first to avoid column conflicts
DROP VIEW IF EXISTS sales_analytics;

-- Sales analytics view
CREATE VIEW sales_analytics AS
SELECT 
    DATE(s.created_at) as sale_date,
    COUNT(s.id) as total_sales,
    SUM(s.total_amount) as total_revenue,
    AVG(s.total_amount) as average_sale_value,
    SUM(si.quantity) as total_items_sold
FROM sales s
LEFT JOIN sale_items si ON s.id = si.sale_id
WHERE s.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(s.created_at)
ORDER BY sale_date DESC;

-- ==========================================
-- 3. INDEXES FOR PERFORMANCE
-- ==========================================

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_stock_in_pieces ON products(stock_in_pieces);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at);

-- ==========================================
-- 4. ADDITIONAL HELPER FUNCTIONS
-- ==========================================

-- Function to get dashboard metrics
CREATE OR REPLACE FUNCTION get_dashboard_metrics()
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_products', (SELECT COUNT(*) FROM products WHERE is_active = true),
        'low_stock_count', (SELECT COUNT(*) FROM products WHERE stock_in_pieces < 10 AND is_active = true),
        'total_sales_today', (SELECT COUNT(*) FROM sales WHERE DATE(created_at) = CURRENT_DATE),
        'revenue_today', (SELECT COALESCE(SUM(total_amount), 0) FROM sales WHERE DATE(created_at) = CURRENT_DATE),
        'total_users', (SELECT COUNT(*) FROM users WHERE is_active = true),
        'revenue_this_month', (SELECT COALESCE(SUM(total_amount), 0) FROM sales WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE))
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get top selling products
CREATE OR REPLACE FUNCTION get_top_selling_products(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    product_id UUID,
    product_name VARCHAR,
    total_sold INTEGER,
    total_revenue DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        SUM(si.quantity)::INTEGER as total_sold,
        SUM(si.total_price) as total_revenue
    FROM products p
    JOIN sale_items si ON p.id = si.product_id
    GROUP BY p.id, p.name
    ORDER BY total_sold DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get critical alerts
CREATE OR REPLACE FUNCTION get_critical_alerts()
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    low_stock_count INTEGER;
    out_of_stock_count INTEGER;
    expired_products_count INTEGER;
BEGIN
    -- Get counts for various alerts
    SELECT COUNT(*) INTO low_stock_count 
    FROM products 
    WHERE stock_in_pieces < 10 AND stock_in_pieces > 0 AND is_active = true;
    
    SELECT COUNT(*) INTO out_of_stock_count 
    FROM products 
    WHERE stock_in_pieces = 0 AND is_active = true;
    
    SELECT COUNT(*) INTO expired_products_count 
    FROM products 
    WHERE expiry_date < CURRENT_DATE AND is_active = true;
    
    SELECT jsonb_build_object(
        'low_stock', jsonb_build_object(
            'count', low_stock_count,
            'type', 'warning',
            'message', CASE 
                WHEN low_stock_count > 0 THEN low_stock_count || ' products are low in stock'
                ELSE 'No low stock alerts'
            END
        ),
        'out_of_stock', jsonb_build_object(
            'count', out_of_stock_count,
            'type', 'danger',
            'message', CASE 
                WHEN out_of_stock_count > 0 THEN out_of_stock_count || ' products are out of stock'
                ELSE 'No out of stock alerts'
            END
        ),
        'expired_products', jsonb_build_object(
            'count', expired_products_count,
            'type', 'danger',
            'message', CASE 
                WHEN expired_products_count > 0 THEN expired_products_count || ' products have expired'
                ELSE 'No expired product alerts'
            END
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 5. PERMISSIONS AND GRANTS
-- ==========================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION create_sale_with_items(JSONB, JSONB[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_selling_products(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_critical_alerts() TO authenticated;
GRANT EXECUTE ON FUNCTION safe_delete_product(UUID) TO authenticated;

-- Grant select permissions on views
GRANT SELECT ON sales_summary TO authenticated;
GRANT SELECT ON product_stock_status TO authenticated;
GRANT SELECT ON sales_analytics TO authenticated;

-- ==========================================
-- 6. SAMPLE DATA FOR TESTING (OPTIONAL)
-- ==========================================

-- Create a test Supabase Auth user in our users table
-- Note: You'll need to get the actual UUID from Supabase Auth dashboard
INSERT INTO users (
    id, 
    email, 
    first_name, 
    last_name, 
    role, 
    phone, 
    is_active
) VALUES (
    '00000000-0000-0000-0000-000000000999'::UUID,
    'test@medcure.com',
    'Test',
    'User',
    'admin',
    '+1234567890',
    true
) ON CONFLICT (email) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active;

-- Function to safely delete products (soft delete)
CREATE OR REPLACE FUNCTION safe_delete_product(product_id UUID)
RETURNS JSONB AS $$
DECLARE
    has_sales INTEGER;
    result JSONB;
BEGIN
    -- Check if product has associated sales
    SELECT COUNT(*) INTO has_sales
    FROM sale_items si
    WHERE si.product_id = safe_delete_product.product_id;
    
    IF has_sales > 0 THEN
        -- Soft delete: set is_active to false
        UPDATE products 
        SET is_active = false, updated_at = NOW()
        WHERE id = safe_delete_product.product_id;
        
        SELECT jsonb_build_object(
            'success', true,
            'type', 'soft_delete',
            'message', 'Product deactivated due to existing sales records'
        ) INTO result;
    ELSE
        -- Hard delete: safe to remove completely
        DELETE FROM products WHERE id = safe_delete_product.product_id;
        
        SELECT jsonb_build_object(
            'success', true,
            'type', 'hard_delete',
            'message', 'Product deleted successfully'
        ) INTO result;
    END IF;
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- COMPLETION MESSAGE
-- ==========================================

SELECT 'Additional database structures created successfully! 🎉' as message;
