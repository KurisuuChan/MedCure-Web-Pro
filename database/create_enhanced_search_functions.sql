-- =============================================================================
-- MEDCURE PHARMACY MANAGEMENT SYSTEM
-- Enhanced Product Search RPC Function
-- =============================================================================
-- Purpose: Create comprehensive search function for products table
-- Date: October 3, 2025
-- Author: Database Architect
-- =============================================================================

-- Begin transaction
BEGIN;

-- =============================================================================
-- Create enhanced search_products RPC function
-- =============================================================================

CREATE OR REPLACE FUNCTION search_products(search_term text DEFAULT '')
RETURNS TABLE (
    id uuid,
    generic_name character varying,
    brand_name character varying,
    name character varying, -- Backward compatibility
    brand character varying, -- Backward compatibility
    category character varying,
    description text,
    dosage_form dosage_form_enum,
    dosage_strength character varying,
    manufacturer text,
    drug_classification drug_classification_enum,
    pharmacologic_category character varying,
    storage_conditions text,
    registration_number character varying,
    price_per_piece numeric,
    pieces_per_sheet integer,
    sheets_per_box integer,
    stock_in_pieces integer,
    reorder_level integer,
    expiry_date date,
    supplier character varying,
    batch_number character varying,
    is_active boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    is_archived boolean,
    archived_at timestamp with time zone,
    archived_by uuid,
    cost_price numeric,
    base_price numeric,
    margin_percentage numeric,
    category_id uuid,
    archive_reason text,
    import_metadata jsonb,
    status character varying,
    expiry_status character varying,
    expiry_alert_days integer,
    last_reorder_date date,
    reorder_frequency_days integer,
    is_critical_medicine boolean,
    supplier_lead_time_days integer,
    sku character varying,
    stock_quantity integer,
    unit_type character varying,
    price numeric,
    supplier_id uuid
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.generic_name,
        p.brand_name,
        COALESCE(p.generic_name, p.name) as name, -- Backward compatibility
        COALESCE(p.brand_name, p.brand) as brand, -- Backward compatibility
        p.category,
        p.description,
        p.dosage_form,
        p.dosage_strength,
        p.manufacturer,
        p.drug_classification,
        p.pharmacologic_category,
        p.storage_conditions,
        p.registration_number,
        p.price_per_piece,
        p.pieces_per_sheet,
        p.sheets_per_box,
        p.stock_in_pieces,
        p.reorder_level,
        p.expiry_date,
        p.supplier,
        p.batch_number,
        p.is_active,
        p.created_at,
        p.updated_at,
        p.is_archived,
        p.archived_at,
        p.archived_by,
        p.cost_price,
        p.base_price,
        p.margin_percentage,
        p.category_id,
        p.archive_reason,
        p.import_metadata,
        p.status,
        p.expiry_status,
        p.expiry_alert_days,
        p.last_reorder_date,
        p.reorder_frequency_days,
        p.is_critical_medicine,
        p.supplier_lead_time_days,
        p.sku,
        p.stock_quantity,
        p.unit_type,
        p.price,
        p.supplier_id
    FROM public.products p
    WHERE 
        p.is_active = true
        AND p.is_archived = false
        AND (
            search_term = '' 
            OR search_term IS NULL
            OR (
                -- Generic name search
                (p.generic_name IS NOT NULL AND LOWER(p.generic_name) LIKE LOWER('%' || search_term || '%'))
                OR
                -- Brand name search
                (p.brand_name IS NOT NULL AND LOWER(p.brand_name) LIKE LOWER('%' || search_term || '%'))
                OR
                -- Backward compatibility - old name column
                (p.name IS NOT NULL AND LOWER(p.name) LIKE LOWER('%' || search_term || '%'))
                OR
                -- Backward compatibility - old brand column
                (p.brand IS NOT NULL AND LOWER(p.brand) LIKE LOWER('%' || search_term || '%'))
                OR
                -- Manufacturer search
                (p.manufacturer IS NOT NULL AND LOWER(p.manufacturer) LIKE LOWER('%' || search_term || '%'))
                OR
                -- Pharmacologic category search
                (p.pharmacologic_category IS NOT NULL AND LOWER(p.pharmacologic_category) LIKE LOWER('%' || search_term || '%'))
                OR
                -- Registration number search
                (p.registration_number IS NOT NULL AND LOWER(p.registration_number) LIKE LOWER('%' || search_term || '%'))
                OR
                -- Category search
                (p.category IS NOT NULL AND LOWER(p.category) LIKE LOWER('%' || search_term || '%'))
                OR
                -- SKU search
                (p.sku IS NOT NULL AND LOWER(p.sku) LIKE LOWER('%' || search_term || '%'))
                OR
                -- Dosage strength search
                (p.dosage_strength IS NOT NULL AND LOWER(p.dosage_strength) LIKE LOWER('%' || search_term || '%'))
                OR
                -- Description search
                (p.description IS NOT NULL AND LOWER(p.description) LIKE LOWER('%' || search_term || '%'))
            )
        )
    ORDER BY 
        -- Prioritize exact matches in brand and generic names
        CASE 
            WHEN p.brand_name IS NOT NULL AND LOWER(p.brand_name) = LOWER(search_term) THEN 1
            WHEN p.generic_name IS NOT NULL AND LOWER(p.generic_name) = LOWER(search_term) THEN 2
            WHEN p.name IS NOT NULL AND LOWER(p.name) = LOWER(search_term) THEN 3
            WHEN p.brand IS NOT NULL AND LOWER(p.brand) = LOWER(search_term) THEN 4
            ELSE 5
        END,
        -- Then by relevance (starts with search term)
        CASE 
            WHEN p.brand_name IS NOT NULL AND LOWER(p.brand_name) LIKE LOWER(search_term || '%') THEN 1
            WHEN p.generic_name IS NOT NULL AND LOWER(p.generic_name) LIKE LOWER(search_term || '%') THEN 2
            WHEN p.name IS NOT NULL AND LOWER(p.name) LIKE LOWER(search_term || '%') THEN 3
            WHEN p.brand IS NOT NULL AND LOWER(p.brand) LIKE LOWER(search_term || '%') THEN 4
            ELSE 5
        END,
        -- Finally alphabetically by brand name, then generic name
        COALESCE(p.brand_name, p.brand, ''),
        COALESCE(p.generic_name, p.name, '');
END;
$$;

-- =============================================================================
-- Create filtered search function with additional filters
-- =============================================================================

CREATE OR REPLACE FUNCTION search_products_filtered(
    search_term text DEFAULT '',
    drug_classification_filter text DEFAULT '',
    manufacturer_filter text DEFAULT '',
    category_filter text DEFAULT '',
    limit_count integer DEFAULT 100
)
RETURNS TABLE (
    id uuid,
    generic_name character varying,
    brand_name character varying,
    name character varying,
    brand character varying,
    category character varying,
    description text,
    dosage_form dosage_form_enum,
    dosage_strength character varying,
    manufacturer text,
    drug_classification drug_classification_enum,
    pharmacologic_category character varying,
    storage_conditions text,
    registration_number character varying,
    price_per_piece numeric,
    pieces_per_sheet integer,
    sheets_per_box integer,
    stock_in_pieces integer,
    reorder_level integer,
    expiry_date date,
    supplier character varying,
    batch_number character varying,
    is_active boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    is_archived boolean,
    archived_at timestamp with time zone,
    archived_by uuid,
    cost_price numeric,
    base_price numeric,
    margin_percentage numeric,
    category_id uuid,
    archive_reason text,
    import_metadata jsonb,
    status character varying,
    expiry_status character varying,
    expiry_alert_days integer,
    last_reorder_date date,
    reorder_frequency_days integer,
    is_critical_medicine boolean,
    supplier_lead_time_days integer,
    sku character varying,
    stock_quantity integer,
    unit_type character varying,
    price numeric,
    supplier_id uuid
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.generic_name,
        p.brand_name,
        COALESCE(p.generic_name, p.name) as name,
        COALESCE(p.brand_name, p.brand) as brand,
        p.category,
        p.description,
        p.dosage_form,
        p.dosage_strength,
        p.manufacturer,
        p.drug_classification,
        p.pharmacologic_category,
        p.storage_conditions,
        p.registration_number,
        p.price_per_piece,
        p.pieces_per_sheet,
        p.sheets_per_box,
        p.stock_in_pieces,
        p.reorder_level,
        p.expiry_date,
        p.supplier,
        p.batch_number,
        p.is_active,
        p.created_at,
        p.updated_at,
        p.is_archived,
        p.archived_at,
        p.archived_by,
        p.cost_price,
        p.base_price,
        p.margin_percentage,
        p.category_id,
        p.archive_reason,
        p.import_metadata,
        p.status,
        p.expiry_status,
        p.expiry_alert_days,
        p.last_reorder_date,
        p.reorder_frequency_days,
        p.is_critical_medicine,
        p.supplier_lead_time_days,
        p.sku,
        p.stock_quantity,
        p.unit_type,
        p.price,
        p.supplier_id
    FROM public.products p
    WHERE 
        p.is_active = true
        AND p.is_archived = false
        -- Search term filter
        AND (
            search_term = '' 
            OR search_term IS NULL
            OR (
                (p.generic_name IS NOT NULL AND LOWER(p.generic_name) LIKE LOWER('%' || search_term || '%'))
                OR (p.brand_name IS NOT NULL AND LOWER(p.brand_name) LIKE LOWER('%' || search_term || '%'))
                OR (p.name IS NOT NULL AND LOWER(p.name) LIKE LOWER('%' || search_term || '%'))
                OR (p.brand IS NOT NULL AND LOWER(p.brand) LIKE LOWER('%' || search_term || '%'))
                OR (p.manufacturer IS NOT NULL AND LOWER(p.manufacturer) LIKE LOWER('%' || search_term || '%'))
                OR (p.pharmacologic_category IS NOT NULL AND LOWER(p.pharmacologic_category) LIKE LOWER('%' || search_term || '%'))
                OR (p.registration_number IS NOT NULL AND LOWER(p.registration_number) LIKE LOWER('%' || search_term || '%'))
                OR (p.category IS NOT NULL AND LOWER(p.category) LIKE LOWER('%' || search_term || '%'))
                OR (p.sku IS NOT NULL AND LOWER(p.sku) LIKE LOWER('%' || search_term || '%'))
                OR (p.dosage_strength IS NOT NULL AND LOWER(p.dosage_strength) LIKE LOWER('%' || search_term || '%'))
            )
        )
        -- Drug classification filter
        AND (
            drug_classification_filter = ''
            OR drug_classification_filter IS NULL
            OR drug_classification_filter = 'All'
            OR p.drug_classification::text = drug_classification_filter
        )
        -- Manufacturer filter
        AND (
            manufacturer_filter = ''
            OR manufacturer_filter IS NULL
            OR manufacturer_filter = 'All'
            OR (p.manufacturer IS NOT NULL AND LOWER(p.manufacturer) = LOWER(manufacturer_filter))
        )
        -- Category filter
        AND (
            category_filter = ''
            OR category_filter IS NULL
            OR category_filter = 'All'
            OR (p.category IS NOT NULL AND LOWER(p.category) = LOWER(category_filter))
        )
    ORDER BY 
        -- Prioritize exact matches
        CASE 
            WHEN p.brand_name IS NOT NULL AND LOWER(p.brand_name) = LOWER(search_term) THEN 1
            WHEN p.generic_name IS NOT NULL AND LOWER(p.generic_name) = LOWER(search_term) THEN 2
            WHEN p.name IS NOT NULL AND LOWER(p.name) = LOWER(search_term) THEN 3
            WHEN p.brand IS NOT NULL AND LOWER(p.brand) = LOWER(search_term) THEN 4
            ELSE 5
        END,
        -- Then by relevance
        CASE 
            WHEN p.brand_name IS NOT NULL AND LOWER(p.brand_name) LIKE LOWER(search_term || '%') THEN 1
            WHEN p.generic_name IS NOT NULL AND LOWER(p.generic_name) LIKE LOWER(search_term || '%') THEN 2
            WHEN p.name IS NOT NULL AND LOWER(p.name) LIKE LOWER(search_term || '%') THEN 3
            WHEN p.brand IS NOT NULL AND LOWER(p.brand) LIKE LOWER(search_term || '%') THEN 4
            ELSE 5
        END,
        -- Finally alphabetically
        COALESCE(p.brand_name, p.brand, ''),
        COALESCE(p.generic_name, p.name, '')
    LIMIT limit_count;
END;
$$;

-- =============================================================================
-- Create function to get distinct manufacturers for filtering
-- =============================================================================

CREATE OR REPLACE FUNCTION get_distinct_manufacturers()
RETURNS TABLE (manufacturer text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT p.manufacturer
    FROM public.products p
    WHERE 
        p.manufacturer IS NOT NULL 
        AND p.manufacturer != ''
        AND p.is_active = true
        AND p.is_archived = false
    ORDER BY p.manufacturer;
END;
$$;

-- =============================================================================
-- Create function to get distinct drug classifications
-- =============================================================================

CREATE OR REPLACE FUNCTION get_distinct_drug_classifications()
RETURNS TABLE (drug_classification text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT p.drug_classification::text as drug_classification
    FROM public.products p
    WHERE 
        p.drug_classification IS NOT NULL
        AND p.is_active = true
        AND p.is_archived = false
    ORDER BY p.drug_classification::text;
END;
$$;

-- =============================================================================
-- Add comments for documentation
-- =============================================================================

COMMENT ON FUNCTION search_products(text) IS 'Comprehensive search function for products table with full-text search across multiple columns';
COMMENT ON FUNCTION search_products_filtered(text, text, text, text, integer) IS 'Enhanced search function with additional filtering options for drug classification, manufacturer, and category';
COMMENT ON FUNCTION get_distinct_manufacturers() IS 'Returns distinct list of manufacturers for filter dropdown';
COMMENT ON FUNCTION get_distinct_drug_classifications() IS 'Returns distinct list of drug classifications for filter dropdown';

-- =============================================================================
-- Grant necessary permissions (adjust as needed for your setup)
-- =============================================================================

-- Grant execute permissions to authenticated users (adjust role as needed)
GRANT EXECUTE ON FUNCTION search_products(text) TO authenticated;
GRANT EXECUTE ON FUNCTION search_products_filtered(text, text, text, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_distinct_manufacturers() TO authenticated;
GRANT EXECUTE ON FUNCTION get_distinct_drug_classifications() TO authenticated;

-- =============================================================================
-- Completion message
-- =============================================================================

DO $$ 
BEGIN
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'ENHANCED PRODUCT SEARCH FUNCTIONS CREATED SUCCESSFULLY';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'Functions created:';
    RAISE NOTICE '• search_products(search_term) - Basic comprehensive search';
    RAISE NOTICE '• search_products_filtered(...) - Advanced search with filters';
    RAISE NOTICE '• get_distinct_manufacturers() - For manufacturer filter dropdown';
    RAISE NOTICE '• get_distinct_drug_classifications() - For classification filter dropdown';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'Usage examples:';
    RAISE NOTICE '• SELECT * FROM search_products(''paracetamol'');';
    RAISE NOTICE '• SELECT * FROM search_products_filtered(''amoxicillin'', ''Prescription (Rx)'', '''', '''', 50);';
    RAISE NOTICE '• SELECT * FROM get_distinct_manufacturers();';
    RAISE NOTICE '• SELECT * FROM get_distinct_drug_classifications();';
    RAISE NOTICE '=============================================================================';
END $$;

-- Commit the transaction
COMMIT;

-- =============================================================================
-- Test queries (uncomment to test)
-- =============================================================================

/*
-- Test basic search
SELECT generic_name, brand_name, manufacturer, drug_classification 
FROM search_products('paracetamol') 
LIMIT 5;

-- Test filtered search
SELECT generic_name, brand_name, manufacturer, drug_classification 
FROM search_products_filtered('', 'Prescription (Rx)', '', '', 10);

-- Test manufacturer list
SELECT * FROM get_distinct_manufacturers();

-- Test drug classification list
SELECT * FROM get_distinct_drug_classifications();
*/