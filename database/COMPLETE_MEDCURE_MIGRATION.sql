-- ================================================================
-- MEDCURE PRO - COMPLETE DATABASE MIGRATION SCRIPT
-- ================================================================
-- This script contains the complete database schema and functions
-- for MedCure Pro Pharmacy Management System
-- Ready for migration to any Supabase instance
-- ================================================================

BEGIN;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================================================
-- CORE TABLES
-- ================================================================

-- Users table (core authentication and user management)
CREATE TABLE public.users (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    email character varying NOT NULL UNIQUE,
    role character varying NOT NULL DEFAULT 'cashier'::character varying 
        CHECK (role::text = ANY (ARRAY['admin'::character varying, 'manager'::character varying, 'cashier'::character varying]::text[])),
    first_name character varying,
    last_name character varying,
    phone character varying,
    is_active boolean DEFAULT true,
    last_login timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT users_pkey PRIMARY KEY (id)
);

-- Categories table (product categorization)
CREATE TABLE public.categories (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    name character varying NOT NULL UNIQUE,
    description text,
    color character varying DEFAULT '#3B82F6'::character varying,
    icon character varying DEFAULT 'Package'::character varying,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    stats jsonb DEFAULT '{}'::jsonb,
    last_calculated timestamp with time zone DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb,
    CONSTRAINT categories_pkey PRIMARY KEY (id)
);

-- Products table (main inventory items)
CREATE TABLE public.products (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    name character varying NOT NULL,
    brand character varying,
    category character varying,
    description text,
    price_per_piece numeric NOT NULL CHECK (price_per_piece > 0::numeric),
    pieces_per_sheet integer DEFAULT 1 CHECK (pieces_per_sheet > 0),
    sheets_per_box integer DEFAULT 1 CHECK (sheets_per_box > 0),
    stock_in_pieces integer DEFAULT 0 CHECK (stock_in_pieces >= 0),
    reorder_level integer DEFAULT 0 CHECK (reorder_level >= 0),
    expiry_date date,
    supplier character varying,
    batch_number character varying,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_archived boolean DEFAULT false,
    archived_at timestamp with time zone,
    archived_by uuid,
    cost_price numeric CHECK (cost_price >= 0::numeric),
    base_price numeric CHECK (base_price >= 0::numeric),
    margin_percentage numeric DEFAULT 0 CHECK (margin_percentage >= 0::numeric),
    category_id uuid,
    archive_reason text,
    import_metadata jsonb DEFAULT '{}'::jsonb,
    status character varying DEFAULT 'active'::character varying 
        CHECK (status::text = ANY (ARRAY['active'::character varying, 'inactive'::character varying, 'discontinued'::character varying, 'out_of_stock'::character varying]::text[])),
    expiry_status character varying DEFAULT 'valid'::character varying 
        CHECK (expiry_status::text = ANY (ARRAY['valid'::character varying, 'expiring_soon'::character varying, 'expired'::character varying]::text[])),
    expiry_alert_days integer DEFAULT 30,
    last_reorder_date date,
    reorder_frequency_days integer DEFAULT 30,
    is_critical_medicine boolean DEFAULT false,
    supplier_lead_time_days integer DEFAULT 7,
    CONSTRAINT products_pkey PRIMARY KEY (id),
    CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id),
    CONSTRAINT products_archived_by_fkey FOREIGN KEY (archived_by) REFERENCES public.users(id)
);

-- Sales table (transaction records)
CREATE TABLE public.sales (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL,
    total_amount numeric NOT NULL CHECK (total_amount >= 0::numeric),
    payment_method character varying NOT NULL 
        CHECK (payment_method::text = ANY (ARRAY['cash'::character varying, 'card'::character varying, 'digital'::character varying]::text[])),
    status character varying DEFAULT 'completed'::character varying 
        CHECK (status::text = ANY (ARRAY['completed'::character varying, 'pending'::character varying, 'cancelled'::character varying]::text[])),
    notes text,
    customer_name character varying,
    customer_phone character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    customer_email character varying,
    discount_amount numeric DEFAULT 0 CHECK (discount_amount >= 0::numeric),
    tax_amount numeric DEFAULT 0 CHECK (tax_amount >= 0::numeric),
    payment_amount numeric,
    change_amount numeric DEFAULT 0,
    discount_type character varying DEFAULT 'none'::character varying 
        CHECK (discount_type::text = ANY (ARRAY['none'::character varying, 'pwd'::character varying, 'senior'::character varying, 'custom'::character varying]::text[])),
    discount_percentage numeric DEFAULT 0 CHECK (discount_percentage >= 0::numeric AND discount_percentage <= 100::numeric),
    subtotal_before_discount numeric,
    pwd_senior_id character varying,
    is_edited boolean DEFAULT false,
    edited_at timestamp with time zone,
    edited_by uuid,
    edit_reason text,
    original_total numeric,
    CONSTRAINT sales_pkey PRIMARY KEY (id),
    CONSTRAINT sales_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
    CONSTRAINT sales_edited_by_fkey FOREIGN KEY (edited_by) REFERENCES public.users(id)
);

-- Sale items table (line items for each sale)
CREATE TABLE public.sale_items (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    sale_id uuid NOT NULL,
    product_id uuid NOT NULL,
    quantity integer NOT NULL CHECK (quantity > 0),
    unit_type character varying NOT NULL 
        CHECK (unit_type::text = ANY (ARRAY['piece'::character varying, 'sheet'::character varying, 'box'::character varying]::text[])),
    unit_price numeric NOT NULL CHECK (unit_price > 0::numeric),
    total_price numeric NOT NULL CHECK (total_price > 0::numeric),
    created_at timestamp with time zone DEFAULT now(),
    batch_id uuid,
    expiry_date date,
    CONSTRAINT sale_items_pkey PRIMARY KEY (id),
    CONSTRAINT sale_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
    CONSTRAINT sale_items_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(id)
);

-- Stock movements table (inventory tracking)
CREATE TABLE public.stock_movements (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    product_id uuid NOT NULL,
    user_id uuid NOT NULL,
    movement_type character varying NOT NULL 
        CHECK (movement_type::text = ANY (ARRAY['in'::character varying, 'out'::character varying, 'adjustment'::character varying]::text[])),
    quantity integer NOT NULL CHECK (quantity <> 0),
    reason character varying NOT NULL,
    reference_id uuid,
    reference_type character varying,
    stock_before integer NOT NULL,
    stock_after integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT stock_movements_pkey PRIMARY KEY (id),
    CONSTRAINT stock_movements_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
    CONSTRAINT stock_movements_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);

-- Audit log table (system audit trail)
CREATE TABLE public.audit_log (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    table_name character varying NOT NULL,
    operation character varying NOT NULL,
    record_id uuid NOT NULL,
    old_values jsonb,
    new_values jsonb,
    user_id uuid,
    user_role character varying,
    timestamp timestamp with time zone DEFAULT now(),
    ip_address inet,
    CONSTRAINT audit_log_pkey PRIMARY KEY (id),
    CONSTRAINT audit_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- User notifications table (system notifications)
CREATE TABLE public.notifications (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid,
    title text NOT NULL,
    message text NOT NULL,
    type text NOT NULL DEFAULT 'info'::text,
    read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT notifications_pkey PRIMARY KEY (id)
    -- Note: user_id references auth.users(id) which is handled by Supabase Auth
);

-- ================================================================
-- CORE BUSINESS FUNCTIONS
-- ================================================================

-- Function: Create sale with items (NO stock deduction)
-- This creates a pending sale without deducting stock
CREATE OR REPLACE FUNCTION create_sale_with_items(
    sale_data JSONB,
    sale_items JSONB[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_sale_id UUID;
    sale_item JSONB;
    current_stock INTEGER;
    result JSONB;
BEGIN
    -- Insert the sale record with 'pending' status initially
    INSERT INTO sales (
        user_id,
        total_amount,
        payment_method,
        customer_name,
        customer_phone,
        notes,
        discount_type,
        discount_percentage,
        discount_amount,
        subtotal_before_discount,
        pwd_senior_id,
        status
    ) VALUES (
        (sale_data->>'user_id')::UUID,
        (sale_data->>'total_amount')::DECIMAL,
        sale_data->>'payment_method',
        sale_data->>'customer_name',
        sale_data->>'customer_phone',
        sale_data->>'notes',
        COALESCE(sale_data->>'discount_type', 'none'),
        COALESCE((sale_data->>'discount_percentage')::DECIMAL, 0),
        COALESCE((sale_data->>'discount_amount')::DECIMAL, 0),
        COALESCE((sale_data->>'subtotal_before_discount')::DECIMAL, (sale_data->>'total_amount')::DECIMAL),
        sale_data->>'pwd_senior_id',
        'pending' -- Start as pending, not completed
    ) RETURNING id INTO new_sale_id;

    -- Process each sale item WITHOUT deducting stock
    FOR i IN array_lower(sale_items, 1) .. array_upper(sale_items, 1)
    LOOP
        sale_item := sale_items[i];
        
        -- Check stock availability (but don't deduct yet)
        SELECT stock_in_pieces INTO current_stock 
        FROM products 
        WHERE id = (sale_item->>'product_id')::UUID;

        IF current_stock < (sale_item->>'quantity')::INTEGER THEN
            RAISE EXCEPTION 'Insufficient stock. Available: %, Required: %', current_stock, (sale_item->>'quantity')::INTEGER;
        END IF;
        
        -- Insert sale item
        INSERT INTO sale_items (
            sale_id,
            product_id,
            quantity,
            unit_type,
            unit_price,
            total_price
        ) VALUES (
            new_sale_id,
            (sale_item->>'product_id')::UUID,
            (sale_item->>'quantity')::INTEGER,
            sale_item->>'unit_type',
            (sale_item->>'unit_price')::DECIMAL,
            (sale_item->>'total_price')::DECIMAL
        );
    END LOOP;

    -- Return the complete sale with items
    SELECT jsonb_build_object(
        'id', s.id,
        'user_id', s.user_id,
        'total_amount', s.total_amount,
        'payment_method', s.payment_method,
        'customer_name', s.customer_name,
        'customer_phone', s.customer_phone,
        'notes', s.notes,
        'discount_type', s.discount_type,
        'discount_percentage', s.discount_percentage,
        'discount_amount', s.discount_amount,
        'subtotal_before_discount', s.subtotal_before_discount,
        'pwd_senior_id', s.pwd_senior_id,
        'status', s.status,
        'created_at', s.created_at,
        'updated_at', s.updated_at,
        'items', COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', si.id,
                        'product_id', si.product_id,
                        'quantity', si.quantity,
                        'unit_type', si.unit_type,
                        'unit_price', si.unit_price,
                        'total_price', si.total_price
                    )
                )
                FROM sale_items si
                WHERE si.sale_id = s.id
            ),
            '[]'::jsonb
        )
    ) INTO result
    FROM sales s
    WHERE s.id = new_sale_id;

    RETURN result;
END;
$$;

-- Function: Complete transaction with stock deduction
-- This finalizes the transaction and deducts stock
CREATE OR REPLACE FUNCTION complete_transaction_with_stock(p_transaction_id UUID)
RETURNS JSONB AS $$
DECLARE
    sale_item RECORD;
    pieces_needed INTEGER;
    system_user_id UUID;
    result JSONB;
BEGIN
    -- Get system user (first available user)
    SELECT id INTO system_user_id FROM users LIMIT 1;
    
    -- Deduct stock for each item in the transaction
    FOR sale_item IN 
        SELECT si.product_id, si.quantity, si.unit_type, p.pieces_per_sheet, p.sheets_per_box, p.brand_name, p.generic_name, p.stock_in_pieces
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        WHERE si.sale_id = p_transaction_id
    LOOP
        -- Calculate pieces needed based on unit type
        CASE COALESCE(sale_item.unit_type, 'piece')
            WHEN 'piece' THEN pieces_needed := sale_item.quantity;
            WHEN 'sheet' THEN pieces_needed := sale_item.quantity * COALESCE(sale_item.pieces_per_sheet, 1);
            WHEN 'box' THEN pieces_needed := sale_item.quantity * COALESCE(sale_item.pieces_per_sheet, 1) * COALESCE(sale_item.sheets_per_box, 1);
            ELSE pieces_needed := sale_item.quantity;
        END CASE;
        
        -- Final stock check
        IF sale_item.stock_in_pieces < pieces_needed THEN
            RAISE EXCEPTION 'Insufficient stock for %: needed %, available %', 
                COALESCE(sale_item.brand_name, sale_item.generic_name, 'Unknown Product'), pieces_needed, sale_item.stock_in_pieces;
        END IF;
        
        -- Deduct stock (SINGLE DEDUCTION)
        UPDATE products 
        SET stock_in_pieces = stock_in_pieces - pieces_needed,
            updated_at = NOW()
        WHERE id = sale_item.product_id;
        
        -- Log stock movement
        INSERT INTO stock_movements (
            product_id, user_id, movement_type, quantity, reason, 
            reference_type, reference_id, stock_before, stock_after, created_at
        ) VALUES (
            sale_item.product_id, system_user_id, 'out', pieces_needed,
            'Stock deducted for completed transaction', 'sale_complete', p_transaction_id,
            sale_item.stock_in_pieces, sale_item.stock_in_pieces - pieces_needed, NOW()
        );
    END LOOP;
    
    -- Mark transaction as completed
    UPDATE sales 
    SET status = 'completed',
        updated_at = NOW()
    WHERE id = p_transaction_id;
    
    result := jsonb_build_object(
        'success', true,
        'message', 'Transaction completed and stock deducted',
        'transaction_id', p_transaction_id
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    result := jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'message', 'Failed to complete transaction'
    );
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function: Undo transaction completely
-- This restores stock and marks transaction as cancelled
CREATE OR REPLACE FUNCTION undo_transaction_completely(p_transaction_id UUID)
RETURNS JSONB AS $$
DECLARE
    sale_item RECORD;
    pieces_to_restore INTEGER;
    system_user_id UUID;
    result JSONB;
    products_restored INTEGER := 0;
    products_not_found INTEGER := 0;
    missing_products TEXT[];
BEGIN
    -- Get system user
    SELECT id INTO system_user_id FROM users LIMIT 1;
    
    -- Check if transaction exists and is completed
    IF NOT EXISTS (SELECT 1 FROM sales WHERE id = p_transaction_id AND status = 'completed') THEN
        result := jsonb_build_object(
            'success', false,
            'message', 'Transaction not found or not completed'
        );
        RETURN result;
    END IF;
    
    -- Initialize array for missing products
    missing_products := ARRAY[]::TEXT[];
    
    -- Restore stock for each item in the transaction
    FOR sale_item IN 
        SELECT si.product_id, si.quantity, si.unit_type, p.pieces_per_sheet, p.sheets_per_box, p.name, p.brand, p.stock_in_pieces
        FROM sale_items si
        LEFT JOIN products p ON si.product_id = p.id
        WHERE si.sale_id = p_transaction_id
    LOOP
        -- Check if product still exists
        IF sale_item.name IS NULL THEN
            -- Product no longer exists, log it but continue
            products_not_found := products_not_found + 1;
            missing_products := array_append(missing_products, sale_item.product_id::TEXT);
            
            -- Log the missing product attempt
            INSERT INTO stock_movements (
                product_id, user_id, movement_type, quantity, reason, 
                reference_type, reference_id, stock_before, stock_after, created_at
            ) VALUES (
                sale_item.product_id, system_user_id, 'in', sale_item.quantity,
                'Attempted stock restore for deleted product', 'sale_undo_missing', p_transaction_id,
                0, 0, NOW()
            );
            
            CONTINUE;
        END IF;
        
        -- Calculate pieces to restore based on unit type
        CASE COALESCE(sale_item.unit_type, 'piece')
            WHEN 'piece' THEN pieces_to_restore := sale_item.quantity;
            WHEN 'sheet' THEN pieces_to_restore := sale_item.quantity * COALESCE(sale_item.pieces_per_sheet, 1);
            WHEN 'box' THEN pieces_to_restore := sale_item.quantity * COALESCE(sale_item.pieces_per_sheet, 1) * COALESCE(sale_item.sheets_per_box, 1);
            ELSE pieces_to_restore := sale_item.quantity;
        END CASE;
        
        -- Restore the stock
        UPDATE products 
        SET stock_in_pieces = stock_in_pieces + pieces_to_restore,
            updated_at = NOW()
        WHERE id = sale_item.product_id;
        
        -- Log the restoration
        INSERT INTO stock_movements (
            product_id, user_id, movement_type, quantity, reason, 
            reference_type, reference_id, stock_before, stock_after, created_at
        ) VALUES (
            sale_item.product_id, system_user_id, 'in', pieces_to_restore,
            'Stock restored for transaction undo', 'sale_undo', p_transaction_id,
            sale_item.stock_in_pieces, sale_item.stock_in_pieces + pieces_to_restore, NOW()
        );
        
        products_restored := products_restored + 1;
    END LOOP;
    
    -- Mark transaction as cancelled (CRITICAL: excludes from revenue)
    UPDATE sales 
    SET status = 'cancelled',
        is_edited = true,
        edited_at = NOW(),
        edit_reason = 'Transaction undone and stock restored',
        updated_at = NOW()
    WHERE id = p_transaction_id;
    
    -- Build result with detailed information
    IF products_not_found > 0 THEN
        result := jsonb_build_object(
            'success', true,
            'message', format('Transaction undone successfully. %s products restored, %s products not found (likely deleted)', products_restored, products_not_found),
            'transaction_id', p_transaction_id,
            'products_restored', products_restored,
            'products_not_found', products_not_found,
            'missing_product_ids', missing_products,
            'warning', 'Some products were not found and could not have stock restored'
        );
    ELSE
        result := jsonb_build_object(
            'success', true,
            'message', format('Transaction undone successfully. All %s products had stock restored', products_restored),
            'transaction_id', p_transaction_id,
            'products_restored', products_restored
        );
    END IF;
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    result := jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'message', 'Failed to undo transaction'
    );
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function: Edit transaction with stock management
-- This undos the old transaction and creates a new pending one
CREATE OR REPLACE FUNCTION edit_transaction_with_stock_management(p_edit_data JSONB)
RETURNS JSONB AS $$
DECLARE
    p_transaction_id UUID;
    p_new_items JSONB;
    transaction_status TEXT;
    item JSONB;
    result JSONB;
BEGIN
    -- Extract data
    p_transaction_id := (p_edit_data->>'transaction_id')::UUID;
    p_new_items := p_edit_data->'items';
    
    -- Check current status
    SELECT status INTO transaction_status 
    FROM sales 
    WHERE id = p_transaction_id;
    
    -- If transaction is completed, first undo it completely
    IF transaction_status = 'completed' THEN
        SELECT undo_transaction_completely(p_transaction_id) INTO result;
        IF NOT (result->>'success')::BOOLEAN THEN
            RETURN result;
        END IF;
    END IF;
    
    -- Update transaction details
    UPDATE sales SET
        total_amount = (p_edit_data->>'total_amount')::DECIMAL,
        subtotal_before_discount = (p_edit_data->>'subtotal_before_discount')::DECIMAL,
        discount_type = COALESCE(p_edit_data->>'discount_type', 'none'),
        discount_percentage = COALESCE((p_edit_data->>'discount_percentage')::DECIMAL, 0),
        discount_amount = COALESCE((p_edit_data->>'discount_amount')::DECIMAL, 0),
        pwd_senior_id = p_edit_data->>'pwd_senior_id',
        payment_method = p_edit_data->>'payment_method',
        is_edited = true,
        edited_at = NOW(),
        edit_reason = p_edit_data->>'editReason',
        status = 'pending', -- Reset to pending for re-completion
        updated_at = NOW()
    WHERE id = p_transaction_id;
    
    -- Clear old sale items
    DELETE FROM sale_items WHERE sale_id = p_transaction_id;
    
    -- Insert new items (without deducting stock yet)
    FOR i IN 1..jsonb_array_length(p_new_items)
    LOOP
        item := p_new_items -> (i-1);
        
        INSERT INTO sale_items (
            id, sale_id, product_id, quantity, unit_type, unit_price, total_price, created_at
        ) VALUES (
            gen_random_uuid(), p_transaction_id, (item->>'product_id')::UUID, 
            (item->>'quantity')::INTEGER, COALESCE(item->>'unit_type', 'piece'), 
            (item->>'unit_price')::DECIMAL, (item->>'total_price')::DECIMAL, NOW()
        );
    END LOOP;
    
    result := jsonb_build_object(
        'success', true,
        'message', 'Transaction edited successfully - call complete_transaction_with_stock to finalize',
        'transaction_id', p_transaction_id
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    result := jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'message', 'Failed to edit transaction'
    );
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- ANALYTICS AND REPORTING FUNCTIONS
-- ================================================================

-- Function: Get daily revenue (completed transactions only)
CREATE OR REPLACE FUNCTION get_daily_revenue(target_date DATE DEFAULT CURRENT_DATE)
RETURNS DECIMAL AS $$
BEGIN
    RETURN COALESCE(
        (SELECT SUM(total_amount) 
         FROM sales 
         WHERE DATE(created_at) = target_date 
         AND status = 'completed'),
        0
    );
END;
$$ LANGUAGE plpgsql;

-- Function: Get monthly revenue (completed transactions only)
CREATE OR REPLACE FUNCTION get_monthly_revenue(target_month INTEGER DEFAULT EXTRACT(MONTH FROM CURRENT_DATE), target_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE))
RETURNS DECIMAL AS $$
BEGIN
    RETURN COALESCE(
        (SELECT SUM(total_amount) 
         FROM sales 
         WHERE EXTRACT(MONTH FROM created_at) = target_month 
         AND EXTRACT(YEAR FROM created_at) = target_year
         AND status = 'completed'),
        0
    );
END;
$$ LANGUAGE plpgsql;

-- Function: Get dashboard analytics
CREATE OR REPLACE FUNCTION get_dashboard_analytics()
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'today_revenue', COALESCE((
            SELECT SUM(total_amount) 
            FROM sales 
            WHERE DATE(created_at) = CURRENT_DATE 
            AND status = 'completed'
        ), 0),
        'today_transactions', COALESCE((
            SELECT COUNT(*) 
            FROM sales 
            WHERE DATE(created_at) = CURRENT_DATE 
            AND status = 'completed'
        ), 0),
        'month_revenue', COALESCE((
            SELECT SUM(total_amount) 
            FROM sales 
            WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
            AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
            AND status = 'completed'
        ), 0),
        'month_transactions', COALESCE((
            SELECT COUNT(*) 
            FROM sales 
            WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
            AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
            AND status = 'completed'
        ), 0),
        'low_stock_products', COALESCE((
            SELECT COUNT(*) 
            FROM products 
            WHERE stock_in_pieces <= 20 AND is_active = true
        ), 0),
        'total_products', COALESCE((
            SELECT COUNT(*) 
            FROM products 
            WHERE is_active = true
        ), 0)
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- AUDIT AND SECURITY TRIGGERS
-- ================================================================

-- Function: Audit trigger for sales table
CREATE OR REPLACE FUNCTION audit_sales_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Log all changes to sales table
    INSERT INTO audit_log (
        table_name,
        operation,
        record_id,
        old_values,
        new_values,
        user_id,
        timestamp
    ) VALUES (
        TG_TABLE_NAME,
        TG_OP,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' THEN to_jsonb(NEW) 
             WHEN TG_OP = 'UPDATE' THEN to_jsonb(NEW) 
             ELSE NULL END,
        COALESCE(NEW.user_id, OLD.user_id),
        NOW()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create audit trigger for sales table
DROP TRIGGER IF EXISTS trigger_audit_sales ON sales;
CREATE TRIGGER trigger_audit_sales
    AFTER INSERT OR UPDATE OR DELETE ON sales
    FOR EACH ROW EXECUTE FUNCTION audit_sales_changes();

-- Function: Update products timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create update timestamp triggers
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- ESSENTIAL INDEXES FOR PERFORMANCE
-- ================================================================

-- Sales table indexes
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_status_created_at ON sales(status, created_at);

-- Products table indexes
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_stock_level ON products(stock_in_pieces);
CREATE INDEX IF NOT EXISTS idx_products_name_search ON products USING gin(to_tsvector('english', name));

-- Sale items indexes
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);

-- Stock movements indexes
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_movements_reference ON stock_movements(reference_type, reference_id);

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);

-- ================================================================
-- INITIAL DATA AND SETUP
-- ================================================================

-- Insert default admin user (if not exists)
INSERT INTO users (email, role, first_name, last_name, is_active)
SELECT 'admin@medcure.com', 'admin', 'System', 'Administrator', true
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@medcure.com');

-- Insert default categories
INSERT INTO categories (name, description, color, icon) 
SELECT * FROM (VALUES 
    ('General Medicine', 'Common medicines and treatments', '#3B82F6', 'Pill'),
    ('Antibiotics', 'Prescription antibiotics', '#EF4444', 'Shield'),
    ('Vitamins', 'Health supplements and vitamins', '#10B981', 'Heart'),
    ('Pain Relief', 'Pain management medications', '#F59E0B', 'Zap'),
    ('First Aid', 'Emergency and first aid supplies', '#8B5CF6', 'Cross')
) AS new_categories(name, description, color, icon)
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE categories.name = new_categories.name);

COMMIT;

-- ================================================================
-- COMPLETION MESSAGE
-- ================================================================
DO $$ 
BEGIN
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'MEDCURE PRO DATABASE MIGRATION COMPLETED SUCCESSFULLY';
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'Core Features Deployed:';
    RAISE NOTICE '✅ Complete table schema with constraints';
    RAISE NOTICE '✅ Professional stock management functions';
    RAISE NOTICE '✅ Revenue-accurate edit/undo system';
    RAISE NOTICE '✅ Comprehensive audit logging';
    RAISE NOTICE '✅ Performance optimized indexes';
    RAISE NOTICE '✅ Essential analytics functions';
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'System ready for production use!';
    RAISE NOTICE '================================================================';
END $$;
