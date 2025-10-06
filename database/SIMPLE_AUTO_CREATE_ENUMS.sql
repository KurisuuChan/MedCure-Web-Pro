-- =============================================================================
-- SIMPLE AUTO-CREATE ENUM VALUES
-- =============================================================================
-- Purpose: Add simple functions to auto-create dosage forms and drug classifications
-- This is a minimal implementation for automatic enum value creation during import
-- =============================================================================

-- Function to add new dosage form (if not exists)
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
        RETURN TRUE;
    END IF;
    
    RETURN FALSE; -- Value already existed
END;
$$;

-- Function to add new drug classification (if not exists)
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
        RETURN TRUE;
    END IF;
    
    RETURN FALSE; -- Value already existed
END;
$$;

-- Grant permissions to authenticated users
GRANT EXECUTE ON FUNCTION add_dosage_form_value(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION add_drug_classification_value(TEXT) TO authenticated;

-- Test the functions
SELECT 'Testing enum auto-creation functions:' as status;
SELECT add_dosage_form_value('Test Form') as test_dosage_form;
SELECT add_drug_classification_value('Test Classification') as test_classification;

SELECT '✅ Simple auto-create enum functions ready!' as status;