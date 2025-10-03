-- =============================================================================
-- CORRECTED ENHANCED SEARCH FUNCTIONS
-- =============================================================================
-- Purpose: Fix search functions to work with actual database schema
-- Date: October 3, 2025
-- Author: Database Architect
-- =============================================================================

-- Begin transaction
BEGIN;

-- =============================================================================
-- Create enhanced search_products RPC function (CORRECTED VERSION)
-- =============================================================================

CREATE OR REPLACE FUNCTION search_products(search_term text DEFAULT '')
RETURNS TABLE (
    id uuid,
    generic_name character varying,
    brand_name character varying,
    name character varying, -- For backward compatibility in frontend
    brand character varying, -- For backward compatibility in frontend
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
        p.generic_name as name, -- Return generic_name as name for backward compatibility
        p.brand_name as brand, -- Return brand_name as brand for backward compatibility
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
            ELSE 3
        END,
        -- Then by relevance (starts with search term)
        CASE 
            WHEN p.brand_name IS NOT NULL AND LOWER(p.brand_name) LIKE LOWER(search_term || '%') THEN 1
            WHEN p.generic_name IS NOT NULL AND LOWER(p.generic_name) LIKE LOWER(search_term || '%') THEN 2
            ELSE 3
        END,
        -- Finally alphabetically by brand name, then generic name
        p.brand_name,
        p.generic_name;
END;
$$;

-- =============================================================================
-- Create filtered search function with additional filters (CORRECTED VERSION)
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
        p.generic_name as name,
        p.brand_name as brand,
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
            ELSE 3
        END,
        -- Then by relevance
        CASE 
            WHEN p.brand_name IS NOT NULL AND LOWER(p.brand_name) LIKE LOWER(search_term || '%') THEN 1
            WHEN p.generic_name IS NOT NULL AND LOWER(p.generic_name) LIKE LOWER(search_term || '%') THEN 2
            ELSE 3
        END,
        -- Finally alphabetically
        p.brand_name,
        p.generic_name
    LIMIT limit_count;
END;
$$;

-- =============================================================================
-- Keep other functions as they are (they don't reference old columns)
-- =============================================================================

-- get_distinct_manufacturers() and get_distinct_drug_classifications() should work fine

-- =============================================================================
-- Completion message
-- =============================================================================

DO $$ 
BEGIN
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'CORRECTED ENHANCED PRODUCT SEARCH FUNCTIONS DEPLOYED';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'Fixed issues:';
    RAISE NOTICE '• Removed references to non-existent p.name and p.brand columns';
    RAISE NOTICE '• Maintained backward compatibility by returning generic_name as name';
    RAISE NOTICE '• Maintained backward compatibility by returning brand_name as brand';
    RAISE NOTICE '• All search functionality preserved with new column structure';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'Functions updated:';
    RAISE NOTICE '• search_products(search_term) - Fixed column references';
    RAISE NOTICE '• search_products_filtered(...) - Fixed column references';
    RAISE NOTICE '=============================================================================';
END $$;

-- Commit the transaction
COMMIT;