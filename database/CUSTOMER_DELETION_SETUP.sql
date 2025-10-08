-- =====================================================
-- CUSTOMER DELETION SETUP FOR SUPABASE
-- =====================================================
-- This script sets up proper permissions and functions for customer deletion
-- Run this in your Supabase SQL Editor

-- Step 1: Check current RLS policies on customers table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'customers';

-- Step 2: Create/Update RLS policies for customers table
-- Enable RLS if not already enabled
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (optional - only if you need to recreate them)
-- DROP POLICY IF EXISTS "Enable read access for authenticated users" ON customers;
-- DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON customers;
-- DROP POLICY IF EXISTS "Enable update access for authenticated users" ON customers;
-- DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON customers;

-- Create comprehensive RLS policies for customers table
CREATE POLICY "Enable all access for authenticated users" ON customers
    FOR ALL 
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Alternative: Separate policies for each operation (more granular control)
/*
CREATE POLICY "Enable read access for authenticated users" ON customers
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON customers
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON customers
    FOR UPDATE USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for authenticated users" ON customers
    FOR DELETE USING (auth.role() = 'authenticated');
*/

-- Step 3: Create a stored function for complete customer deletion
CREATE OR REPLACE FUNCTION delete_customer_completely(customer_uuid UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    customer_record RECORD;
    affected_sales INTEGER;
BEGIN
    -- Check if customer exists
    SELECT * INTO customer_record 
    FROM customers 
    WHERE id = customer_uuid;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Customer not found',
            'customer_id', customer_uuid
        );
    END IF;
    
    -- Check if customer is already deleted
    IF customer_record.customer_name = '[DELETED CUSTOMER]' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Customer is already deleted',
            'customer_id', customer_uuid
        );
    END IF;
    
    -- Store original data
    DECLARE
        original_name TEXT := customer_record.customer_name;
        original_phone TEXT := customer_record.phone;
        original_email TEXT := customer_record.email;
    BEGIN
        -- Delete customer data permanently
        UPDATE customers 
        SET 
            customer_name = '[DELETED CUSTOMER]',
            phone = NULL,
            email = NULL,
            address = NULL,
            is_active = false,
            updated_at = NOW()
        WHERE id = customer_uuid;
        
        -- Also anonymize any sales records (preserve transaction amounts)
        UPDATE sales 
        SET 
            customer_name = '[DELETED CUSTOMER]',
            customer_phone = NULL,
            customer_email = NULL,
            customer_address = NULL,
            notes = COALESCE(notes, '') || ' | Customer deleted on ' || NOW()::TEXT
        WHERE (customer_name = original_name AND customer_name IS NOT NULL)
           OR (customer_phone = original_phone AND customer_phone IS NOT NULL)
           OR (customer_email = original_email AND customer_email IS NOT NULL);
        
        GET DIAGNOSTICS affected_sales = ROW_COUNT;
        
        -- Return success result
        RETURN json_build_object(
            'success', true,
            'message', 'Customer deleted permanently',
            'customer_id', customer_uuid,
            'original_name', original_name,
            'affected_sales_records', affected_sales,
            'deleted_at', NOW()
        );
    END;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Return detailed error result
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'error_detail', SQLSTATE,
            'customer_id', customer_uuid
        );
END;
$$;

-- Step 4: Create a function for customer anonymization (alternative approach)
CREATE OR REPLACE FUNCTION anonymize_customer_data(customer_uuid UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    customer_record RECORD;
    affected_sales INTEGER;
    result JSON;
BEGIN
    -- Check if customer exists and is active
    SELECT * INTO customer_record 
    FROM customers 
    WHERE id = customer_uuid;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Customer not found',
            'customer_id', customer_uuid
        );
    END IF;
    
    -- Check if customer is already anonymized
    IF customer_record.customer_name = '[DELETED CUSTOMER]' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Customer is already anonymized',
            'customer_id', customer_uuid
        );
    END IF;
    
    -- Store original data for logging
    DECLARE
        original_name TEXT := customer_record.customer_name;
        original_phone TEXT := customer_record.phone;
        original_email TEXT := customer_record.email;
    BEGIN
        -- Anonymize customer data
        UPDATE customers 
        SET 
            customer_name = '[DELETED CUSTOMER]',
            phone = NULL,
            email = NULL,
            address = '[DELETED]',
            is_active = false,
            updated_at = NOW()
        WHERE id = customer_uuid;
        
        -- Also anonymize any sales records (if they exist)
        UPDATE sales 
        SET 
            customer_name = '[DELETED CUSTOMER]',
            customer_phone = NULL,
            customer_email = NULL,
            customer_address = '[DELETED]',
            notes = COALESCE(notes, '') || ' | Customer anonymized on ' || NOW()::TEXT
        WHERE (customer_name = original_name AND customer_name IS NOT NULL)
           OR (customer_phone = original_phone AND customer_phone IS NOT NULL)
           OR (customer_email = original_email AND customer_email IS NOT NULL);
        
        GET DIAGNOSTICS affected_sales = ROW_COUNT;
        
        -- Create audit log entry (if audit table exists)
        BEGIN
            INSERT INTO customer_audit_log (
                customer_id,
                action_type,
                original_data,
                new_data,
                performed_at,
                performed_by
            ) VALUES (
                customer_uuid,
                'ANONYMIZE',
                json_build_object(
                    'name', original_name,
                    'phone', original_phone,
                    'email', original_email
                ),
                json_build_object(
                    'name', '[DELETED CUSTOMER]',
                    'phone', NULL,
                    'email', NULL
                ),
                NOW(),
                auth.uid()
            );
        EXCEPTION
            WHEN undefined_table THEN
                -- Ignore if audit table doesn't exist
                NULL;
        END;
        
        -- Return success result
        RETURN json_build_object(
            'success', true,
            'message', 'Customer data anonymized permanently',
            'customer_id', customer_uuid,
            'original_name', original_name,
            'affected_sales_records', affected_sales,
            'anonymized_at', NOW(),
            'warning', 'This action cannot be undone'
        );
    END;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Return detailed error result
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'error_detail', SQLSTATE,
            'customer_id', customer_uuid,
            'hint', 'Check database permissions and table structure'
        );
END;
$$;

-- Step 4b: Create optional audit table for tracking deletions
CREATE TABLE IF NOT EXISTS customer_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL,
    action_type TEXT NOT NULL,
    original_data JSONB,
    new_data JSONB,
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    performed_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on audit table
ALTER TABLE customer_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON customer_audit_log
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON customer_audit_log
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Step 5: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON customers TO authenticated;
GRANT EXECUTE ON FUNCTION delete_customer_safely(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION anonymize_customer_data(UUID) TO authenticated;

-- Step 6: Test the setup
-- SELECT delete_customer_safely('your-customer-uuid-here');
-- SELECT anonymize_customer_data('your-customer-uuid-here');

-- Step 7: Check if policies are working
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual 
FROM pg_policies 
WHERE tablename = 'customers';

-- Display success message
SELECT 'Customer deletion setup completed successfully! You can now use the delete_customer_safely() or anonymize_customer_data() functions.' as setup_status;