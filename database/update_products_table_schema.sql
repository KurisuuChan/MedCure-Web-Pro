-- =============================================================================
-- MEDCURE PHARMACY MANAGEMENT SYSTEM
-- Products Table Schema Enhancement Script
-- =============================================================================
-- Purpose: Update the public.products table to be more descriptive and compliant
-- Date: October 3, 2025
-- Author: Database Architect
-- =============================================================================

-- Begin transaction to ensure all changes are applied atomically
BEGIN;

-- =============================================================================
-- STEP 1: Create ENUM types for controlled vocabularies
-- =============================================================================

-- Create dosage form enumeration
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dosage_form_enum') THEN
        CREATE TYPE dosage_form_enum AS ENUM (
            'Tablet',
            'Capsule', 
            'Syrup',
            'Injection',
            'Ointment',
            'Drops',
            'Inhaler'
        );
        RAISE NOTICE 'Created dosage_form_enum type';
    ELSE
        RAISE NOTICE 'dosage_form_enum type already exists, skipping creation';
    END IF;
END $$;

-- Create drug classification enumeration
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'drug_classification_enum') THEN
        CREATE TYPE drug_classification_enum AS ENUM (
            'Prescription (Rx)',
            'Over-the-Counter (OTC)',
            'Controlled Substance'
        );
        RAISE NOTICE 'Created drug_classification_enum type';
    ELSE
        RAISE NOTICE 'drug_classification_enum type already exists, skipping creation';
    END IF;
END $$;

-- =============================================================================
-- STEP 2: Rename existing columns for better clarity
-- =============================================================================

-- Rename 'name' column to 'generic_name' for better clarity
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name = 'name'
    ) THEN
        ALTER TABLE public.products RENAME COLUMN name TO generic_name;
        RAISE NOTICE 'Renamed column "name" to "generic_name"';
    ELSE
        RAISE NOTICE 'Column "name" does not exist or already renamed, skipping';
    END IF;
END $$;

-- Rename 'brand' column to 'brand_name' for consistency
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name = 'brand'
    ) THEN
        ALTER TABLE public.products RENAME COLUMN brand TO brand_name;
        RAISE NOTICE 'Renamed column "brand" to "brand_name"';
    ELSE
        RAISE NOTICE 'Column "brand" does not exist or already renamed, skipping';
    END IF;
END $$;

-- =============================================================================
-- STEP 3: Add new descriptive columns for medicine information
-- =============================================================================

-- Add dosage_form column using the ENUM type
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name = 'dosage_form'
    ) THEN
        ALTER TABLE public.products 
        ADD COLUMN dosage_form dosage_form_enum;
        RAISE NOTICE 'Added dosage_form column';
    ELSE
        RAISE NOTICE 'Column dosage_form already exists, skipping';
    END IF;
END $$;

-- Add dosage_strength column for medicine strength information
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name = 'dosage_strength'
    ) THEN
        ALTER TABLE public.products 
        ADD COLUMN dosage_strength VARCHAR(100);
        RAISE NOTICE 'Added dosage_strength column';
    ELSE
        RAISE NOTICE 'Column dosage_strength already exists, skipping';
    END IF;
END $$;

-- Add manufacturer column for product manufacturer information
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name = 'manufacturer'
    ) THEN
        ALTER TABLE public.products 
        ADD COLUMN manufacturer TEXT;
        RAISE NOTICE 'Added manufacturer column';
    ELSE
        RAISE NOTICE 'Column manufacturer already exists, skipping';
    END IF;
END $$;

-- Add drug_classification column using the ENUM type
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name = 'drug_classification'
    ) THEN
        ALTER TABLE public.products 
        ADD COLUMN drug_classification drug_classification_enum;
        RAISE NOTICE 'Added drug_classification column';
    ELSE
        RAISE NOTICE 'Column drug_classification already exists, skipping';
    END IF;
END $$;

-- Add pharmacologic_category column for drug categorization
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name = 'pharmacologic_category'
    ) THEN
        ALTER TABLE public.products 
        ADD COLUMN pharmacologic_category VARCHAR(255);
        RAISE NOTICE 'Added pharmacologic_category column';
    ELSE
        RAISE NOTICE 'Column pharmacologic_category already exists, skipping';
    END IF;
END $$;

-- Add storage_conditions column for storage requirements
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name = 'storage_conditions'
    ) THEN
        ALTER TABLE public.products 
        ADD COLUMN storage_conditions TEXT;
        RAISE NOTICE 'Added storage_conditions column';
    ELSE
        RAISE NOTICE 'Column storage_conditions already exists, skipping';
    END IF;
END $$;

-- Add registration_number column with unique constraint
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name = 'registration_number'
    ) THEN
        ALTER TABLE public.products 
        ADD COLUMN registration_number VARCHAR(255);
        RAISE NOTICE 'Added registration_number column';
    ELSE
        RAISE NOTICE 'Column registration_number already exists, skipping';
    END IF;
END $$;

-- =============================================================================
-- STEP 4: Add constraints and indexes for performance and data integrity
-- =============================================================================

-- Add unique constraint for registration_number (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND constraint_name = 'products_registration_number_unique'
    ) THEN
        ALTER TABLE public.products 
        ADD CONSTRAINT products_registration_number_unique 
        UNIQUE (registration_number);
        RAISE NOTICE 'Added unique constraint for registration_number';
    ELSE
        RAISE NOTICE 'Unique constraint for registration_number already exists, skipping';
    END IF;
END $$;

-- Create index on generic_name for better search performance
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'products' 
        AND indexname = 'idx_products_generic_name'
    ) THEN
        CREATE INDEX idx_products_generic_name ON public.products(generic_name);
        RAISE NOTICE 'Created index on generic_name';
    ELSE
        RAISE NOTICE 'Index on generic_name already exists, skipping';
    END IF;
END $$;

-- Create index on brand_name for better search performance
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'products' 
        AND indexname = 'idx_products_brand_name'
    ) THEN
        CREATE INDEX idx_products_brand_name ON public.products(brand_name);
        RAISE NOTICE 'Created index on brand_name';
    ELSE
        RAISE NOTICE 'Index on brand_name already exists, skipping';
    END IF;
END $$;

-- Create index on manufacturer for better filtering
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'products' 
        AND indexname = 'idx_products_manufacturer'
    ) THEN
        CREATE INDEX idx_products_manufacturer ON public.products(manufacturer);
        RAISE NOTICE 'Created index on manufacturer';
    ELSE
        RAISE NOTICE 'Index on manufacturer already exists, skipping';
    END IF;
END $$;

-- Create index on drug_classification for better filtering
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'products' 
        AND indexname = 'idx_products_drug_classification'
    ) THEN
        CREATE INDEX idx_products_drug_classification ON public.products(drug_classification);
        RAISE NOTICE 'Created index on drug_classification';
    ELSE
        RAISE NOTICE 'Index on drug_classification already exists, skipping';
    END IF;
END $$;

-- Create index on pharmacologic_category for better filtering
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'products' 
        AND indexname = 'idx_products_pharmacologic_category'
    ) THEN
        CREATE INDEX idx_products_pharmacologic_category ON public.products(pharmacologic_category);
        RAISE NOTICE 'Created index on pharmacologic_category';
    ELSE
        RAISE NOTICE 'Index on pharmacologic_category already exists, skipping';
    END IF;
END $$;

-- =============================================================================
-- STEP 5: Add comments for documentation
-- =============================================================================

-- Add column comments for better documentation
COMMENT ON COLUMN public.products.generic_name IS 'Generic name of the medicine (e.g., Paracetamol)';
COMMENT ON COLUMN public.products.brand_name IS 'Brand name of the medicine (e.g., Tylenol)';
COMMENT ON COLUMN public.products.dosage_form IS 'Form of the medicine (Tablet, Capsule, Syrup, etc.)';
COMMENT ON COLUMN public.products.dosage_strength IS 'Strength of the medicine (e.g., 500mg, 10mg/5ml)';
COMMENT ON COLUMN public.products.manufacturer IS 'Company that manufactured the product';
COMMENT ON COLUMN public.products.drug_classification IS 'Legal classification (Prescription, OTC, Controlled Substance)';
COMMENT ON COLUMN public.products.pharmacologic_category IS 'Category of the drug (e.g., Antibiotic, Analgesic)';
COMMENT ON COLUMN public.products.storage_conditions IS 'Storage instructions (e.g., Refrigerate, Store at room temperature)';
COMMENT ON COLUMN public.products.registration_number IS 'Official registration number from regulatory body (unique)';

-- =============================================================================
-- STEP 6: Update the updated_at trigger to include new columns
-- =============================================================================

-- Ensure the updated_at trigger function exists and works with new columns
DO $$ 
BEGIN
    -- Check if trigger function exists, create if not
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'update_updated_at_column'
    ) THEN
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $trigger$
        BEGIN
            NEW.updated_at = now();
            RETURN NEW;
        END;
        $trigger$ LANGUAGE plpgsql;
        RAISE NOTICE 'Created update_updated_at_column function';
    END IF;

    -- Check if trigger exists, create if not
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_products_updated_at'
    ) THEN
        CREATE TRIGGER update_products_updated_at
            BEFORE UPDATE ON public.products
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created update_products_updated_at trigger';
    END IF;
END $$;

-- =============================================================================
-- STEP 7: Sample data update (optional - uncomment to use)
-- =============================================================================

-- Uncomment the following section if you want to populate some sample data
-- for testing the new columns:

/*
-- Update existing products with sample data for new columns
UPDATE public.products 
SET 
    dosage_form = 'Tablet',
    dosage_strength = '500mg',
    drug_classification = 'Over-the-Counter (OTC)',
    pharmacologic_category = 'Analgesic',
    storage_conditions = 'Store at room temperature',
    manufacturer = 'Generic Pharmaceutical Company'
WHERE generic_name ILIKE '%paracetamol%' OR generic_name ILIKE '%acetaminophen%';

UPDATE public.products 
SET 
    dosage_form = 'Tablet',
    dosage_strength = '250mg',
    drug_classification = 'Prescription (Rx)',
    pharmacologic_category = 'Antibiotic',
    storage_conditions = 'Store at room temperature',
    manufacturer = 'PharmaCorp Industries'
WHERE generic_name ILIKE '%amoxicillin%';
*/

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

-- Print completion message
DO $$ 
BEGIN
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'PRODUCTS TABLE SCHEMA UPDATE COMPLETED SUCCESSFULLY';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'Changes applied:';
    RAISE NOTICE '• Renamed "name" column to "generic_name"';
    RAISE NOTICE '• Renamed "brand" column to "brand_name"';
    RAISE NOTICE '• Added dosage_form column (ENUM)';
    RAISE NOTICE '• Added dosage_strength column (VARCHAR)';
    RAISE NOTICE '• Added manufacturer column (TEXT)';
    RAISE NOTICE '• Added drug_classification column (ENUM)';
    RAISE NOTICE '• Added pharmacologic_category column (VARCHAR)';
    RAISE NOTICE '• Added storage_conditions column (TEXT)';
    RAISE NOTICE '• Added registration_number column (VARCHAR, UNIQUE)';
    RAISE NOTICE '• Created appropriate indexes for performance';
    RAISE NOTICE '• Added column documentation comments';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Update your application code to use new column names';
    RAISE NOTICE '2. Populate new columns with appropriate data';
    RAISE NOTICE '3. Update any views or stored procedures that reference old column names';
    RAISE NOTICE '4. Consider adding validation rules in your application layer';
    RAISE NOTICE '=============================================================================';
END $$;

-- Commit the transaction
COMMIT;

-- =============================================================================
-- VERIFICATION QUERIES (Run these after the script to verify changes)
-- =============================================================================

-- Uncomment and run these queries to verify the changes:

/*
-- 1. Check the updated table structure
\d+ public.products;

-- 2. Verify new ENUM types were created
SELECT typname, enumlabel 
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE typname IN ('dosage_form_enum', 'drug_classification_enum')
ORDER BY typname, enumsortorder;

-- 3. Check indexes were created
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'products' 
AND schemaname = 'public'
ORDER BY indexname;

-- 4. Verify constraints
SELECT conname, contype, consrc 
FROM pg_constraint 
WHERE conrelid = 'public.products'::regclass
ORDER BY conname;

-- 5. Check column comments
SELECT column_name, column_comment 
FROM information_schema.columns 
LEFT JOIN (
    SELECT a.attname as column_name, d.description as column_comment
    FROM pg_attribute a 
    JOIN pg_class c ON a.attrelid = c.oid 
    LEFT JOIN pg_description d ON d.objoid = c.oid AND d.objsubid = a.attnum
    WHERE c.relname = 'products' AND a.attnum > 0
) comments USING (column_name)
WHERE table_name = 'products' 
AND table_schema = 'public'
AND column_comment IS NOT NULL
ORDER BY column_name;
*/
