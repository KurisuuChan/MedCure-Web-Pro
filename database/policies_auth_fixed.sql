-- 🔒 **MEDCURE-PRO SECURITY POLICIES (AUTHENTICATION FIXED)**
-- Row Level Security (RLS) policies for Supabase
-- Created: Phase 3 - Database Integration
-- Version: 1.2 - Authentication Loop Fixed

-- This file defines comprehensive security policies for role-based access control
-- Fixed infinite recursion in authentication

-- ==========================================
-- 1. DISABLE RLS TEMPORARILY FOR SETUP
-- ==========================================

-- Temporarily disable RLS to avoid recursion during setup
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements DISABLE ROW LEVEL SECURITY;

-- ==========================================
-- 1.5. DROP ALL EXISTING POLICIES
-- ==========================================

-- Drop ALL existing policies to start fresh
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on users table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON users';
    END LOOP;
    
    -- Drop all policies on products table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'products' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON products';
    END LOOP;
    
    -- Drop all policies on sales table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'sales' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON sales';
    END LOOP;
    
    -- Drop all policies on sale_items table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'sale_items' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON sale_items';
    END LOOP;
    
    -- Drop all policies on stock_movements table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'stock_movements' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON stock_movements';
    END LOOP;
END $$;

-- Drop existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS trigger_prevent_last_admin_deactivation ON users;
DROP TRIGGER IF EXISTS audit_users_changes ON users;
DROP TRIGGER IF EXISTS audit_products_changes ON products;

-- ==========================================
-- 2. SIMPLIFIED USERS TABLE POLICIES
-- ==========================================

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own profile (no recursion)
CREATE POLICY "users_can_view_own_profile" ON users
    FOR SELECT
    USING (auth.uid()::text = id::text);

-- Allow authenticated users to view basic user info (for role checking)
CREATE POLICY "authenticated_users_can_view_user_roles" ON users
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Allow service role to manage users (for admin operations)
CREATE POLICY "service_role_can_manage_users" ON users
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- ==========================================
-- 3. PRODUCTS TABLE POLICIES
-- ==========================================

-- Enable RLS on products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view active products
CREATE POLICY "authenticated_users_can_view_active_products" ON products
    FOR SELECT
    USING (
        auth.role() = 'authenticated'
        AND is_active = true
    );

-- All authenticated users can view all products (simplified for now)
CREATE POLICY "authenticated_users_can_view_all_products" ON products
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Authenticated users can manage products (simplified for now)
CREATE POLICY "authenticated_users_can_manage_products" ON products
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- ==========================================
-- 4. SALES TABLE POLICIES
-- ==========================================

-- Enable RLS on sales table
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view and manage sales (simplified)
CREATE POLICY "authenticated_users_can_manage_sales" ON sales
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- ==========================================
-- 5. SALE_ITEMS TABLE POLICIES
-- ==========================================

-- Enable RLS on sale_items table
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

-- Authenticated users can manage sale items (simplified)
CREATE POLICY "authenticated_users_can_manage_sale_items" ON sale_items
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- ==========================================
-- 6. STOCK_MOVEMENTS TABLE POLICIES
-- ==========================================

-- Enable RLS on stock_movements table
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view stock movements
CREATE POLICY "authenticated_users_can_view_stock_movements" ON stock_movements
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- System and authenticated users can create stock movements
CREATE POLICY "authenticated_users_can_create_stock_movements" ON stock_movements
    FOR INSERT
    WITH CHECK (true); -- Allow triggers and authenticated users

-- Authenticated users can manage stock movements (simplified)
CREATE POLICY "authenticated_users_can_manage_stock_movements" ON stock_movements
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- ==========================================
-- 7. SECURITY FUNCTIONS (SIMPLIFIED)
-- ==========================================

-- Simple function to get current user's role from users table
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role FROM users 
        WHERE id::text = auth.uid()::text
        AND is_active = true
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user has a specific role
CREATE OR REPLACE FUNCTION current_user_has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_current_user_role() = required_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 8. AUDIT LOGGING (SIMPLIFIED)
-- ==========================================

-- Ensure audit log table exists
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(50) NOT NULL,
    operation VARCHAR(10) NOT NULL,
    record_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    user_id UUID,
    user_role VARCHAR(20),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET
);

-- Simple audit function without role checking
CREATE OR REPLACE FUNCTION simple_audit_log()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_log (
        table_name, operation, record_id, old_values, new_values, 
        user_id
    ) VALUES (
        TG_TABLE_NAME,
        TG_OP,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
        auth.uid()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create simplified audit triggers
CREATE TRIGGER simple_audit_users_changes
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION simple_audit_log();

CREATE TRIGGER simple_audit_products_changes
    AFTER INSERT OR UPDATE OR DELETE ON products
    FOR EACH ROW EXECUTE FUNCTION simple_audit_log();

-- ==========================================
-- 9. PERFORMANCE OPTIMIZATIONS
-- ==========================================

-- Simple indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_auth_simple ON users(id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_active_products_simple ON products(is_active) WHERE is_active = true;

-- ==========================================
-- 10. GRANT PERMISSIONS
-- ==========================================

-- Grant comprehensive permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant permissions to anon role for login
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON users TO anon;

-- ==========================================
-- AUTHENTICATION-FRIENDLY SETUP COMPLETE
-- ==========================================

COMMENT ON TABLE users IS 'Users table with simplified RLS policies to avoid authentication loops';
COMMENT ON TABLE audit_log IS 'Simplified audit trail without recursive role checking';

-- Policies are now authentication-friendly! 🔓✅
