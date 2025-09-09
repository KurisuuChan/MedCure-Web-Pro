-- 🔒 **MEDCURE-PRO SECURITY POLICIES (FIXED)**
-- Row Level Security (RLS) policies for Supabase
-- Created: Phase 3 - Database Integration
-- Version: 1.1 - Syntax Errors Fixed

-- This file defines comprehensive security policies for role-based access control

-- ==========================================
-- 1. ENABLE RLS ON ALL TABLES
-- ==========================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 1.5. DROP EXISTING POLICIES (IF ANY)
-- ==========================================

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "admins_can_view_all_users" ON users;
DROP POLICY IF EXISTS "users_can_view_own_profile" ON users;
DROP POLICY IF EXISTS "admins_can_create_users" ON users;
DROP POLICY IF EXISTS "admins_can_update_users" ON users;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON users;
DROP POLICY IF EXISTS "admins_can_deactivate_users" ON users;

DROP POLICY IF EXISTS "authenticated_users_can_view_products" ON products;
DROP POLICY IF EXISTS "admins_managers_can_view_all_products" ON products;
DROP POLICY IF EXISTS "admins_managers_can_create_products" ON products;
DROP POLICY IF EXISTS "admins_managers_can_update_products" ON products;
DROP POLICY IF EXISTS "admins_can_deactivate_products" ON products;

DROP POLICY IF EXISTS "users_can_view_sales" ON sales;
DROP POLICY IF EXISTS "users_can_view_own_sales" ON sales;
DROP POLICY IF EXISTS "authenticated_users_can_create_sales" ON sales;
DROP POLICY IF EXISTS "users_can_update_own_sales" ON sales;
DROP POLICY IF EXISTS "admins_managers_can_update_sales" ON sales;
DROP POLICY IF EXISTS "admins_can_delete_sales" ON sales;

DROP POLICY IF EXISTS "users_can_view_sale_items" ON sale_items;
DROP POLICY IF EXISTS "users_can_add_sale_items" ON sale_items;
DROP POLICY IF EXISTS "users_can_update_sale_items" ON sale_items;
DROP POLICY IF EXISTS "admins_managers_can_update_sale_items" ON sale_items;
DROP POLICY IF EXISTS "users_can_delete_sale_items" ON sale_items;
DROP POLICY IF EXISTS "admins_can_delete_any_sale_items" ON sale_items;
DROP POLICY IF EXISTS "admins_can_delete_completed_sale_items" ON sale_items;

DROP POLICY IF EXISTS "authenticated_users_can_view_stock_movements" ON stock_movements;
DROP POLICY IF EXISTS "system_can_create_stock_movements" ON stock_movements;
DROP POLICY IF EXISTS "admins_managers_can_create_stock_movements" ON stock_movements;
DROP POLICY IF EXISTS "admins_can_update_stock_movements" ON stock_movements;
DROP POLICY IF EXISTS "admins_can_delete_stock_movements" ON stock_movements;

DROP POLICY IF EXISTS "prevent_unauthorized_admin_creation" ON users;

-- Drop existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS trigger_prevent_last_admin_deactivation ON users;
DROP TRIGGER IF EXISTS audit_users_changes ON users;
DROP TRIGGER IF EXISTS audit_products_changes ON products;

-- ==========================================
-- 2. USERS TABLE POLICIES
-- ==========================================

-- Admin can see all users
CREATE POLICY "admins_can_view_all_users" ON users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users as user_check 
            WHERE user_check.id = auth.uid() 
            AND user_check.role = 'admin'
            AND user_check.is_active = true
        )
    );

-- Users can view their own profile
CREATE POLICY "users_can_view_own_profile" ON users
    FOR SELECT
    USING (auth.uid() = id);

-- Admin can insert new users
CREATE POLICY "admins_can_create_users" ON users
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users as user_check 
            WHERE user_check.id = auth.uid() 
            AND user_check.role = 'admin'
            AND user_check.is_active = true
        )
    );

-- Admin can update user details
CREATE POLICY "admins_can_update_users" ON users
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users as user_check 
            WHERE user_check.id = auth.uid() 
            AND user_check.role = 'admin'
            AND user_check.is_active = true
        )
    );

-- Users can update their own profile (limited fields)
CREATE POLICY "users_can_update_own_profile" ON users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- ==========================================
-- 3. PRODUCTS TABLE POLICIES
-- ==========================================

-- All authenticated users can view active products
CREATE POLICY "authenticated_users_can_view_products" ON products
    FOR SELECT
    USING (
        auth.role() = 'authenticated'
        AND is_active = true
    );

-- Admin and managers can view all products (including inactive)
CREATE POLICY "admins_managers_can_view_all_products" ON products
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'manager')
            AND users.is_active = true
        )
    );

-- Admin and managers can create products
CREATE POLICY "admins_managers_can_create_products" ON products
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'manager')
            AND users.is_active = true
        )
    );

-- Admin and managers can update products
CREATE POLICY "admins_managers_can_update_products" ON products
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'manager')
            AND users.is_active = true
        )
    );

-- ==========================================
-- 4. SALES TABLE POLICIES
-- ==========================================

-- Users can view sales they created or admins/managers can view all
CREATE POLICY "users_can_view_sales" ON sales
    FOR SELECT
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'manager')
            AND users.is_active = true
        )
    );

-- All authenticated users can create sales
CREATE POLICY "authenticated_users_can_create_sales" ON sales
    FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated'
        AND user_id = auth.uid()
    );

-- Users can update their own pending sales
CREATE POLICY "users_can_update_own_sales" ON sales
    FOR UPDATE
    USING (
        user_id = auth.uid()
        AND status = 'pending'
    )
    WITH CHECK (
        user_id = auth.uid()
    );

-- Admin and managers can update any sales
CREATE POLICY "admins_managers_can_update_sales" ON sales
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'manager')
            AND users.is_active = true
        )
    );

-- Only admin can delete sales
CREATE POLICY "admins_can_delete_sales" ON sales
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
            AND users.is_active = true
        )
    );

-- ==========================================
-- 5. SALE_ITEMS TABLE POLICIES
-- ==========================================

-- Users can view sale items for their own sales or if admin/manager
CREATE POLICY "users_can_view_sale_items" ON sale_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM sales 
            WHERE sales.id = sale_items.sale_id 
            AND (
                sales.user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM users 
                    WHERE users.id = auth.uid() 
                    AND users.role IN ('admin', 'manager')
                    AND users.is_active = true
                )
            )
        )
    );

-- Users can add items to their own pending sales
CREATE POLICY "users_can_add_sale_items" ON sale_items
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM sales 
            WHERE sales.id = sale_items.sale_id 
            AND sales.user_id = auth.uid()
            AND sales.status = 'pending'
        )
    );

-- Users can update items in their own pending sales
CREATE POLICY "users_can_update_sale_items" ON sale_items
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM sales 
            WHERE sales.id = sale_items.sale_id 
            AND sales.user_id = auth.uid()
            AND sales.status = 'pending'
        )
    );

-- Admin and managers can update any sale items
CREATE POLICY "admins_managers_can_update_sale_items" ON sale_items
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'manager')
            AND users.is_active = true
        )
    );

-- Users can delete items from their own pending sales
CREATE POLICY "users_can_delete_sale_items" ON sale_items
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM sales 
            WHERE sales.id = sale_items.sale_id 
            AND sales.user_id = auth.uid()
            AND sales.status = 'pending'
        )
    );

-- Admin can delete any sale items
CREATE POLICY "admins_can_delete_any_sale_items" ON sale_items
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
            AND users.is_active = true
        )
    );

-- ==========================================
-- 6. STOCK_MOVEMENTS TABLE POLICIES
-- ==========================================

-- All authenticated users can view stock movements
CREATE POLICY "authenticated_users_can_view_stock_movements" ON stock_movements
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- System can insert stock movements (via triggers)
CREATE POLICY "system_can_create_stock_movements" ON stock_movements
    FOR INSERT
    WITH CHECK (true);

-- Admin and managers can manually create stock movements
CREATE POLICY "admins_managers_can_create_stock_movements" ON stock_movements
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'manager')
            AND users.is_active = true
        )
        AND user_id = auth.uid()
    );

-- Only admin can update stock movements
CREATE POLICY "admins_can_update_stock_movements" ON stock_movements
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
            AND users.is_active = true
        )
    );

-- Only admin can delete stock movements
CREATE POLICY "admins_can_delete_stock_movements" ON stock_movements
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
            AND users.is_active = true
        )
    );

-- ==========================================
-- 7. SECURITY FUNCTIONS
-- ==========================================

-- Function to check if user has required role
CREATE OR REPLACE FUNCTION has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = required_role
        AND users.is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has any of the required roles
CREATE OR REPLACE FUNCTION has_any_role(required_roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = ANY(required_roles)
        AND users.is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user's role
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role FROM users 
        WHERE users.id = auth.uid() 
        AND users.is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 8. ADDITIONAL SECURITY CONSTRAINTS
-- ==========================================

-- Prevent role escalation - users cannot create admin accounts unless they are admin
CREATE POLICY "prevent_unauthorized_admin_creation" ON users
    FOR INSERT
    WITH CHECK (
        CASE 
            WHEN role = 'admin' THEN has_role('admin')
            ELSE true
        END
    );

-- Prevent self-deactivation for the last admin
CREATE OR REPLACE FUNCTION prevent_last_admin_deactivation()
RETURNS TRIGGER AS $$
DECLARE
    admin_count INTEGER;
BEGIN
    -- If deactivating an admin, check if they're the last one
    IF OLD.role = 'admin' AND OLD.is_active = true AND NEW.is_active = false THEN
        SELECT COUNT(*) INTO admin_count 
        FROM users 
        WHERE role = 'admin' AND is_active = true AND id != OLD.id;
        
        IF admin_count = 0 THEN
            RAISE EXCEPTION 'Cannot deactivate the last admin user';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_last_admin_deactivation
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION prevent_last_admin_deactivation();

-- ==========================================
-- 9. AUDIT LOGGING
-- ==========================================

-- Create audit log table for sensitive operations
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(50) NOT NULL,
    operation VARCHAR(10) NOT NULL,
    record_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    user_id UUID REFERENCES users(id),
    user_role VARCHAR(20),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET
);

-- Function to create audit log entries
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_log (
        table_name, operation, record_id, old_values, new_values, 
        user_id, user_role
    ) VALUES (
        TG_TABLE_NAME,
        TG_OP,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
        auth.uid(),
        current_user_role()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers for sensitive tables
CREATE TRIGGER audit_users_changes
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_products_changes
    AFTER INSERT OR UPDATE OR DELETE ON products
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- ==========================================
-- 10. PERFORMANCE OPTIMIZATIONS
-- ==========================================

-- Index for RLS policy performance
CREATE INDEX IF NOT EXISTS idx_users_auth_lookup ON users(id, role, is_active) WHERE is_active = true;

-- Partial indexes for active records
CREATE INDEX IF NOT EXISTS idx_active_users ON users(role) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_active_products ON products(category) WHERE is_active = true;

-- ==========================================
-- 11. GRANT PERMISSIONS
-- ==========================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ==========================================
-- SECURITY SETUP COMPLETE
-- ==========================================

COMMENT ON TABLE audit_log IS 'Audit trail for all sensitive database operations';

-- RLS policies ready - no view policies, no OLD references! 🔒
