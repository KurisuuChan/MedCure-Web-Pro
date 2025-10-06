-- =============================================================================
-- DYNAMIC ENUM MANAGEMENT SYSTEM
-- =============================================================================
-- Purpose: Automatically detect and manage new dosage forms and drug classifications
-- Features: Auto-extend enums, validation, detection of unrecognized values
-- Date: October 6, 2025
-- =============================================================================

-- ========================================
-- 1. FUNCTIONS TO GET CURRENT ENUM VALUES
-- ========================================

-- Get all current dosage form enum values
CREATE OR REPLACE FUNCTION get_dosage_form_values()
RETURNS TEXT[]
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT ARRAY(
        SELECT enumlabel::text 
        FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'dosage_form_enum'
        ORDER BY e.enumsortorder
    );
$$;

-- Get all current drug classification enum values
CREATE OR REPLACE FUNCTION get_drug_classification_values()
RETURNS TEXT[]
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT ARRAY(
        SELECT enumlabel::text 
        FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'drug_classification_enum'
        ORDER BY e.enumsortorder
    );
$$;

-- Get enum information in JSON format for API consumption
CREATE OR REPLACE FUNCTION get_enum_values_json()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'dosage_forms', get_dosage_form_values(),
        'drug_classifications', get_drug_classification_values(),
        'last_updated', NOW()
    ) INTO result;
    
    RETURN result;
END;
$$;

-- ========================================
-- 2. FUNCTIONS TO ADD NEW ENUM VALUES
-- ========================================

-- Add new dosage form to enum (if not exists)
CREATE OR REPLACE FUNCTION add_dosage_form_value(new_value TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    enum_exists BOOLEAN;
BEGIN
    -- Check if the value already exists
    SELECT EXISTS(
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'dosage_form_enum' 
        AND e.enumlabel = new_value
    ) INTO enum_exists;
    
    -- If it doesn't exist, add it
    IF NOT enum_exists THEN
        EXECUTE format('ALTER TYPE dosage_form_enum ADD VALUE %L', new_value);
        
        -- Log the addition
        INSERT INTO enum_changes_log (enum_type, action, old_value, new_value, changed_at, changed_by)
        VALUES ('dosage_form_enum', 'ADD', NULL, new_value, NOW(), auth.uid())
        ON CONFLICT DO NOTHING; -- Ignore if logging table doesn't exist
        
        RETURN TRUE;
    END IF;
    
    RETURN FALSE; -- Value already existed
END;
$$;

-- Add new drug classification to enum (if not exists)
CREATE OR REPLACE FUNCTION add_drug_classification_value(new_value TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    enum_exists BOOLEAN;
BEGIN
    -- Check if the value already exists
    SELECT EXISTS(
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'drug_classification_enum' 
        AND e.enumlabel = new_value
    ) INTO enum_exists;
    
    -- If it doesn't exist, add it
    IF NOT enum_exists THEN
        EXECUTE format('ALTER TYPE drug_classification_enum ADD VALUE %L', new_value);
        
        -- Log the addition
        INSERT INTO enum_changes_log (enum_type, action, old_value, new_value, changed_at, changed_by)
        VALUES ('drug_classification_enum', 'ADD', NULL, new_value, NOW(), auth.uid())
        ON CONFLICT DO NOTHING; -- Ignore if logging table doesn't exist
        
        RETURN TRUE;
    END IF;
    
    RETURN FALSE; -- Value already existed
END;
$$;

-- ========================================
-- 3. VALIDATION FUNCTIONS WITH AUTO-EXTENSION
-- ========================================

-- Validate dosage form and auto-add if needed
CREATE OR REPLACE FUNCTION validate_or_add_dosage_form(input_value TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    is_valid BOOLEAN;
    was_added BOOLEAN;
    current_values TEXT[];
    result JSON;
BEGIN
    -- Return null result for null/empty input
    IF input_value IS NULL OR trim(input_value) = '' THEN
        RETURN json_build_object(
            'is_valid', true,
            'value', null,
            'was_added', false,
            'message', 'Empty value - no validation needed'
        );
    END IF;
    
    -- Clean the input value
    input_value := trim(input_value);
    
    -- Get current enum values
    current_values := get_dosage_form_values();
    
    -- Check if value exists (case-insensitive)
    SELECT input_value = ANY(current_values) INTO is_valid;
    
    -- If not valid, try case-insensitive match first
    IF NOT is_valid THEN
        FOR i IN 1..array_length(current_values, 1) LOOP
            IF lower(current_values[i]) = lower(input_value) THEN
                -- Found case-insensitive match, use the existing value
                input_value := current_values[i];
                is_valid := true;
                EXIT;
            END IF;
        END LOOP;
    END IF;
    
    -- If still not valid, add new value
    IF NOT is_valid THEN
        was_added := add_dosage_form_value(input_value);
        is_valid := true; -- Now it's valid since we added it
    ELSE
        was_added := false;
    END IF;
    
    -- Build result
    result := json_build_object(
        'is_valid', is_valid,
        'value', input_value,
        'was_added', was_added,
        'message', CASE 
            WHEN was_added THEN format('New dosage form "%s" added automatically', input_value)
            ELSE format('Dosage form "%s" validated successfully', input_value)
        END
    );
    
    RETURN result;
END;
$$;

-- Validate drug classification and auto-add if needed
CREATE OR REPLACE FUNCTION validate_or_add_drug_classification(input_value TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    is_valid BOOLEAN;
    was_added BOOLEAN;
    current_values TEXT[];
    result JSON;
BEGIN
    -- Return null result for null/empty input
    IF input_value IS NULL OR trim(input_value) = '' THEN
        RETURN json_build_object(
            'is_valid', true,
            'value', null,
            'was_added', false,
            'message', 'Empty value - no validation needed'
        );
    END IF;
    
    -- Clean the input value
    input_value := trim(input_value);
    
    -- Get current enum values
    current_values := get_drug_classification_values();
    
    -- Check if value exists (case-insensitive)
    SELECT input_value = ANY(current_values) INTO is_valid;
    
    -- If not valid, try case-insensitive match first
    IF NOT is_valid THEN
        FOR i IN 1..array_length(current_values, 1) LOOP
            IF lower(current_values[i]) = lower(input_value) THEN
                -- Found case-insensitive match, use the existing value
                input_value := current_values[i];
                is_valid := true;
                EXIT;
            END IF;
        END LOOP;
    END IF;
    
    -- If still not valid, add new value
    IF NOT is_valid THEN
        was_added := add_drug_classification_value(input_value);
        is_valid := true; -- Now it's valid since we added it
    ELSE
        was_added := false;
    END IF;
    
    -- Build result
    result := json_build_object(
        'is_valid', is_valid,
        'value', input_value,
        'was_added', was_added,
        'message', CASE 
            WHEN was_added THEN format('New drug classification "%s" added automatically', input_value)
            ELSE format('Drug classification "%s" validated successfully', input_value)
        END
    );
    
    RETURN result;
END;
$$;

-- ========================================
-- 4. BATCH VALIDATION FUNCTION FOR IMPORTS
-- ========================================

-- Validate multiple values for import (batch processing)
CREATE OR REPLACE FUNCTION validate_enum_values_batch(
    dosage_forms TEXT[],
    drug_classifications TEXT[]
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    form_result JSON;
    class_result JSON;
    all_results JSON[] := '{}';
    validation_summary JSON;
    total_added INTEGER := 0;
    i INTEGER;
BEGIN
    -- Process dosage forms
    IF dosage_forms IS NOT NULL THEN
        FOR i IN 1..array_length(dosage_forms, 1) LOOP
            IF dosage_forms[i] IS NOT NULL AND trim(dosage_forms[i]) != '' THEN
                form_result := validate_or_add_dosage_form(dosage_forms[i]);
                all_results := all_results || form_result;
                
                -- Count additions
                IF (form_result->>'was_added')::boolean THEN
                    total_added := total_added + 1;
                END IF;
            END IF;
        END LOOP;
    END IF;
    
    -- Process drug classifications
    IF drug_classifications IS NOT NULL THEN
        FOR i IN 1..array_length(drug_classifications, 1) LOOP
            IF drug_classifications[i] IS NOT NULL AND trim(drug_classifications[i]) != '' THEN
                class_result := validate_or_add_drug_classification(drug_classifications[i]);
                all_results := all_results || class_result;
                
                -- Count additions
                IF (class_result->>'was_added')::boolean THEN
                    total_added := total_added + 1;
                END IF;
            END IF;
        END LOOP;
    END IF;
    
    -- Build summary
    validation_summary := json_build_object(
        'total_processed', array_length(all_results, 1),
        'total_added', total_added,
        'updated_enum_values', get_enum_values_json(),
        'validation_details', all_results,
        'processed_at', NOW()
    );
    
    RETURN validation_summary;
END;
$$;

-- ========================================
-- 5. CHANGE LOGGING TABLE (OPTIONAL)
-- ========================================

-- Create table to log enum changes
CREATE TABLE IF NOT EXISTS enum_changes_log (
    id BIGSERIAL PRIMARY KEY,
    enum_type TEXT NOT NULL,
    action TEXT NOT NULL, -- 'ADD', 'REMOVE' (future)
    old_value TEXT,
    new_value TEXT,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    import_batch_id TEXT, -- Optional: link to import batch
    notes TEXT
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_enum_changes_log_enum_type ON enum_changes_log(enum_type);
CREATE INDEX IF NOT EXISTS idx_enum_changes_log_changed_at ON enum_changes_log(changed_at);

-- Enable RLS
ALTER TABLE enum_changes_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view all enum changes
CREATE POLICY "enum_changes_log_select_policy" ON enum_changes_log
    FOR SELECT USING (true);

-- RLS Policy: Only authenticated users can insert (automatic via functions)
CREATE POLICY "enum_changes_log_insert_policy" ON enum_changes_log
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ========================================
-- 6. UTILITY FUNCTIONS
-- ========================================

-- Get recent enum changes (for admin dashboard)
CREATE OR REPLACE FUNCTION get_recent_enum_changes(days INTEGER DEFAULT 30)
RETURNS TABLE (
    id BIGINT,
    enum_type TEXT,
    action TEXT,
    new_value TEXT,
    changed_at TIMESTAMPTZ,
    changed_by UUID
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT id, enum_type, action, new_value, changed_at, changed_by
    FROM enum_changes_log
    WHERE changed_at >= NOW() - INTERVAL '1 day' * days
    ORDER BY changed_at DESC
    LIMIT 100;
$$;

-- Check for commonly used values not in enums (analysis function)
CREATE OR REPLACE FUNCTION analyze_unrecognized_enum_values()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_dosage_forms TEXT[];
    current_classifications TEXT[];
    unrecognized_forms JSON;
    unrecognized_classifications JSON;
    result JSON;
BEGIN
    -- Get current enum values
    current_dosage_forms := get_dosage_form_values();
    current_classifications := get_drug_classification_values();
    
    -- Find unrecognized dosage forms in products table
    WITH unrecognized_dosage AS (
        SELECT dosage_form::text as value, COUNT(*) as usage_count
        FROM products
        WHERE dosage_form IS NOT NULL
        AND dosage_form::text != ALL(current_dosage_forms)
        GROUP BY dosage_form::text
        ORDER BY usage_count DESC
    )
    SELECT json_agg(json_build_object('value', value, 'count', usage_count))
    INTO unrecognized_forms
    FROM unrecognized_dosage;
    
    -- Find unrecognized drug classifications in products table
    WITH unrecognized_class AS (
        SELECT drug_classification::text as value, COUNT(*) as usage_count
        FROM products
        WHERE drug_classification IS NOT NULL
        AND drug_classification::text != ALL(current_classifications)
        GROUP BY drug_classification::text
        ORDER BY usage_count DESC
    )
    SELECT json_agg(json_build_object('value', value, 'count', usage_count))
    INTO unrecognized_classifications
    FROM unrecognized_class;
    
    -- Build result
    result := json_build_object(
        'current_dosage_forms', current_dosage_forms,
        'current_drug_classifications', current_classifications,
        'unrecognized_dosage_forms', COALESCE(unrecognized_forms, '[]'::json),
        'unrecognized_drug_classifications', COALESCE(unrecognized_classifications, '[]'::json),
        'analyzed_at', NOW()
    );
    
    RETURN result;
END;
$$;

-- ========================================
-- 7. GRANT PERMISSIONS
-- ========================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_dosage_form_values() TO authenticated;
GRANT EXECUTE ON FUNCTION get_drug_classification_values() TO authenticated;
GRANT EXECUTE ON FUNCTION get_enum_values_json() TO authenticated;
GRANT EXECUTE ON FUNCTION validate_or_add_dosage_form(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_or_add_drug_classification(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_enum_values_batch(TEXT[], TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_enum_changes(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION analyze_unrecognized_enum_values() TO authenticated;

-- Grant table permissions
GRANT SELECT ON enum_changes_log TO authenticated;

-- ========================================
-- 8. TEST THE SYSTEM
-- ========================================

-- Test getting current values
SELECT 'Testing enum value retrieval:' as test_phase;
SELECT get_enum_values_json() as current_enum_values;

-- Test adding new values
SELECT 'Testing new value addition:' as test_phase;
SELECT validate_or_add_dosage_form('Powder') as dosage_form_test;
SELECT validate_or_add_drug_classification('Controlled Substance Schedule II') as classification_test;

-- Test batch validation
SELECT 'Testing batch validation:' as test_phase;
SELECT validate_enum_values_batch(
    ARRAY['Tablet', 'NewFormTest', 'Capsule'],
    ARRAY['OTC', 'NewClassificationTest', 'Prescription (Rx)']
) as batch_validation_test;

-- Show updated values
SELECT 'Updated enum values:' as test_phase;
SELECT get_enum_values_json() as updated_enum_values;

-- ========================================
-- ✅ COMPLETION MESSAGE
-- ========================================

SELECT 
    '✅ DYNAMIC ENUM MANAGEMENT SYSTEM INSTALLED!' as status,
    'Your import system can now automatically detect and add new dosage forms and drug classifications' as message,
    'Use validate_or_add_dosage_form() and validate_or_add_drug_classification() in your import process' as usage,
    'Check enum_changes_log table to track all automatic additions' as logging;