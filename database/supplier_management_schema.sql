-- Supplier Management Database Schema for MedCure-Pro
-- This file contains the database schema for supplier and purchase order management

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address JSONB,
    categories JSONB DEFAULT '[]'::jsonb,
    payment_terms VARCHAR(50) DEFAULT 'net_30' CHECK (payment_terms IN ('cod', 'net_15', 'net_30', 'net_60', 'net_90')),
    credit_limit DECIMAL(15,2) DEFAULT 0,
    tax_id VARCHAR(50),
    website VARCHAR(255),
    notes TEXT,
    bank_details JSONB,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'deleted')),
    rating INTEGER DEFAULT 0 CHECK (rating >= 0 AND rating <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Supplier contacts table
CREATE TABLE IF NOT EXISTS supplier_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    role VARCHAR(100),
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supplier products table (products they can supply)
CREATE TABLE IF NOT EXISTS supplier_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    product_id UUID, -- Would reference products table
    sku VARCHAR(100),
    supplier_sku VARCHAR(100),
    cost_price DECIMAL(10,2) NOT NULL,
    minimum_order_quantity INTEGER DEFAULT 1,
    lead_time_days INTEGER DEFAULT 0,
    availability_status VARCHAR(50) DEFAULT 'available' CHECK (availability_status IN ('available', 'limited', 'discontinued', 'out_of_stock')),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchase orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    shipping_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    delivery_date DATE,
    notes TEXT,
    shipping_address JSONB,
    bill_to_address JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT
);

-- Purchase order items table
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id UUID, -- Would reference products table
    sku VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(15,2) NOT NULL,
    received_quantity INTEGER DEFAULT 0,
    specifications JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supplier performance metrics table
CREATE TABLE IF NOT EXISTS supplier_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    overall_score INTEGER DEFAULT 0 CHECK (overall_score >= 0 AND overall_score <= 100),
    delivery_performance INTEGER DEFAULT 0 CHECK (delivery_performance >= 0 AND delivery_performance <= 100),
    quality_score INTEGER DEFAULT 0 CHECK (quality_score >= 0 AND quality_score <= 100),
    total_orders INTEGER DEFAULT 0,
    on_time_deliveries INTEGER DEFAULT 0,
    average_delivery_time INTEGER DEFAULT 0, -- in days
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(supplier_id)
);

-- Supplier documents table
CREATE TABLE IF NOT EXISTS supplier_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    file_url TEXT,
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_by UUID, -- Would reference user_profiles table
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supplier activity logs table
CREATE TABLE IF NOT EXISTS supplier_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchase order activity logs table
CREATE TABLE IF NOT EXISTS purchase_order_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_suppliers_email ON suppliers(email);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
CREATE INDEX IF NOT EXISTS idx_suppliers_rating ON suppliers(rating);
CREATE INDEX IF NOT EXISTS idx_suppliers_categories ON suppliers USING gin(categories);

CREATE INDEX IF NOT EXISTS idx_supplier_contacts_supplier_id ON supplier_contacts(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_contacts_email ON supplier_contacts(email);
CREATE INDEX IF NOT EXISTS idx_supplier_contacts_primary ON supplier_contacts(is_primary);

CREATE INDEX IF NOT EXISTS idx_supplier_products_supplier_id ON supplier_products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_products_product_id ON supplier_products(product_id);
CREATE INDEX IF NOT EXISTS idx_supplier_products_sku ON supplier_products(sku);
CREATE INDEX IF NOT EXISTS idx_supplier_products_availability ON supplier_products(availability_status);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_po_number ON purchase_orders(po_number);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_created_at ON purchase_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_delivery_date ON purchase_orders(delivery_date);

CREATE INDEX IF NOT EXISTS idx_purchase_order_items_po_id ON purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_product_id ON purchase_order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_sku ON purchase_order_items(sku);

CREATE INDEX IF NOT EXISTS idx_supplier_performance_supplier_id ON supplier_performance_metrics(supplier_id);

CREATE INDEX IF NOT EXISTS idx_supplier_documents_supplier_id ON supplier_documents(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_documents_type ON supplier_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_supplier_documents_expires ON supplier_documents(expires_at);

CREATE INDEX IF NOT EXISTS idx_supplier_activity_logs_supplier_id ON supplier_activity_logs(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_activity_logs_type ON supplier_activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_supplier_activity_logs_created_at ON supplier_activity_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_po_activity_logs_po_id ON purchase_order_activity_logs(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_po_activity_logs_type ON purchase_order_activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_po_activity_logs_created_at ON purchase_order_activity_logs(created_at);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_activity_logs ENABLE ROW LEVEL SECURITY;

-- Suppliers policies
CREATE POLICY "Authenticated users can view suppliers" ON suppliers
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Managers can manage suppliers" ON suppliers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('super_admin', 'admin', 'manager') 
            AND is_active = true
        )
    );

-- Supplier contacts policies
CREATE POLICY "Authenticated users can view supplier contacts" ON supplier_contacts
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Managers can manage supplier contacts" ON supplier_contacts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('super_admin', 'admin', 'manager') 
            AND is_active = true
        )
    );

-- Purchase orders policies
CREATE POLICY "Authenticated users can view purchase orders" ON purchase_orders
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authorized users can manage purchase orders" ON purchase_orders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('super_admin', 'admin', 'manager', 'pharmacist') 
            AND is_active = true
        )
    );

-- Purchase order items policies
CREATE POLICY "Authenticated users can view purchase order items" ON purchase_order_items
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authorized users can manage purchase order items" ON purchase_order_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('super_admin', 'admin', 'manager', 'pharmacist') 
            AND is_active = true
        )
    );

-- Supplier performance metrics policies
CREATE POLICY "Authenticated users can view supplier performance" ON supplier_performance_metrics
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "System can update supplier performance" ON supplier_performance_metrics
    FOR ALL USING (true);

-- Activity logs policies
CREATE POLICY "System can insert supplier activity logs" ON supplier_activity_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Managers can view supplier activity logs" ON supplier_activity_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('super_admin', 'admin', 'manager') 
            AND is_active = true
        )
    );

CREATE POLICY "System can insert PO activity logs" ON purchase_order_activity_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Authorized users can view PO activity logs" ON purchase_order_activity_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('super_admin', 'admin', 'manager', 'pharmacist') 
            AND is_active = true
        )
    );

-- Triggers

-- Update updated_at timestamp for suppliers
CREATE OR REPLACE FUNCTION update_supplier_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_suppliers_updated_at
    BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_supplier_updated_at();

CREATE TRIGGER update_supplier_contacts_updated_at
    BEFORE UPDATE ON supplier_contacts
    FOR EACH ROW EXECUTE FUNCTION update_supplier_updated_at();

-- Update updated_at timestamp for purchase orders
CREATE TRIGGER update_purchase_orders_updated_at
    BEFORE UPDATE ON purchase_orders
    FOR EACH ROW EXECUTE FUNCTION update_supplier_updated_at();

-- Calculate total price for purchase order items
CREATE OR REPLACE FUNCTION calculate_po_item_total()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_price = NEW.quantity * NEW.unit_price;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_po_item_total_trigger
    BEFORE INSERT OR UPDATE ON purchase_order_items
    FOR EACH ROW EXECUTE FUNCTION calculate_po_item_total();

-- Update purchase order totals when items change
CREATE OR REPLACE FUNCTION update_purchase_order_totals()
RETURNS TRIGGER AS $$
DECLARE
    po_id UUID;
    new_subtotal DECIMAL(15,2);
    new_tax DECIMAL(15,2);
    new_total DECIMAL(15,2);
BEGIN
    -- Get the purchase order ID
    IF TG_OP = 'DELETE' THEN
        po_id := OLD.purchase_order_id;
    ELSE
        po_id := NEW.purchase_order_id;
    END IF;

    -- Calculate new subtotal
    SELECT COALESCE(SUM(total_price), 0) INTO new_subtotal
    FROM purchase_order_items
    WHERE purchase_order_id = po_id;

    -- Calculate tax (10% for now)
    new_tax := new_subtotal * 0.1;
    
    -- Calculate total (subtotal + tax + shipping)
    SELECT new_subtotal + new_tax + COALESCE(shipping_amount, 0) INTO new_total
    FROM purchase_orders
    WHERE id = po_id;

    -- Update the purchase order
    UPDATE purchase_orders
    SET 
        subtotal = new_subtotal,
        tax_amount = new_tax,
        total_amount = new_total,
        updated_at = NOW()
    WHERE id = po_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_purchase_order_totals_trigger
    AFTER INSERT OR UPDATE OR DELETE ON purchase_order_items
    FOR EACH ROW EXECUTE FUNCTION update_purchase_order_totals();

-- Helper functions

-- Function to get supplier by email
CREATE OR REPLACE FUNCTION get_supplier_by_email(supplier_email VARCHAR)
RETURNS TABLE(
    id UUID,
    name VARCHAR,
    email VARCHAR,
    status VARCHAR,
    rating INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT s.id, s.name, s.email, s.status, s.rating
    FROM suppliers s
    WHERE s.email = supplier_email AND s.status != 'deleted';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get supplier performance summary
CREATE OR REPLACE FUNCTION get_supplier_performance_summary(supplier_uuid UUID)
RETURNS TABLE(
    total_orders INTEGER,
    completed_orders INTEGER,
    on_time_deliveries INTEGER,
    average_delivery_days INTEGER,
    total_spent DECIMAL,
    performance_score INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_orders,
        COUNT(CASE WHEN po.status = 'delivered' THEN 1 END)::INTEGER as completed_orders,
        COUNT(CASE WHEN po.status = 'delivered' AND po.delivered_at <= po.delivery_date THEN 1 END)::INTEGER as on_time_deliveries,
        COALESCE(AVG(CASE WHEN po.delivered_at IS NOT NULL THEN EXTRACT(day FROM po.delivered_at - po.created_at) END), 0)::INTEGER as average_delivery_days,
        COALESCE(SUM(CASE WHEN po.status = 'delivered' THEN po.total_amount ELSE 0 END), 0) as total_spent,
        COALESCE(spm.overall_score, 0) as performance_score
    FROM purchase_orders po
    LEFT JOIN supplier_performance_metrics spm ON spm.supplier_id = supplier_uuid
    WHERE po.supplier_id = supplier_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments and documentation
COMMENT ON TABLE suppliers IS 'Master supplier information and contact details';
COMMENT ON TABLE supplier_contacts IS 'Contact persons for each supplier';
COMMENT ON TABLE supplier_products IS 'Products that each supplier can provide';
COMMENT ON TABLE purchase_orders IS 'Purchase orders placed with suppliers';
COMMENT ON TABLE purchase_order_items IS 'Individual line items within purchase orders';
COMMENT ON TABLE supplier_performance_metrics IS 'Performance tracking and scoring for suppliers';
COMMENT ON TABLE supplier_documents IS 'Documents related to suppliers (contracts, certificates, etc.)';
COMMENT ON TABLE supplier_activity_logs IS 'Audit trail of supplier-related activities';
COMMENT ON TABLE purchase_order_activity_logs IS 'Audit trail of purchase order activities';

COMMENT ON FUNCTION get_supplier_by_email(VARCHAR) IS 'Retrieve supplier information by email address';
COMMENT ON FUNCTION get_supplier_performance_summary(UUID) IS 'Get comprehensive performance metrics for a supplier';

-- Sample data for testing (commented out for production)
/*
-- Insert sample suppliers
INSERT INTO suppliers (name, email, phone, address, categories, payment_terms, notes) VALUES
('MedSupply Corp', 'orders@medsupply.com', '+1-555-0101', '{"street": "123 Medical Plaza", "city": "Springfield", "state": "IL", "zip": "62701"}', '["pharmaceuticals", "medical devices"]', 'net_30', 'Primary pharmaceutical supplier'),
('HealthTech Solutions', 'procurement@healthtech.com', '+1-555-0102', '{"street": "456 Tech Avenue", "city": "Boston", "state": "MA", "zip": "02101"}', '["medical devices", "technology"]', 'net_15', 'Specialized in medical technology'),
('Pharma Direct', 'sales@pharmadirect.com', '+1-555-0103', '{"street": "789 Industry Blvd", "city": "Phoenix", "state": "AZ", "zip": "85001"}', '["pharmaceuticals"]', 'net_60', 'Generic pharmaceutical supplier');

-- Insert sample contacts
INSERT INTO supplier_contacts (supplier_id, name, email, phone, role, is_primary) VALUES
((SELECT id FROM suppliers WHERE email = 'orders@medsupply.com'), 'John Smith', 'john.smith@medsupply.com', '+1-555-0111', 'Sales Manager', true),
((SELECT id FROM suppliers WHERE email = 'procurement@healthtech.com'), 'Sarah Johnson', 'sarah.johnson@healthtech.com', '+1-555-0112', 'Account Manager', true),
((SELECT id FROM suppliers WHERE email = 'sales@pharmadirect.com'), 'Mike Wilson', 'mike.wilson@pharmadirect.com', '+1-555-0113', 'Sales Representative', true);
*/
