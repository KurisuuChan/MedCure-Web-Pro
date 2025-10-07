-- ============================================================================
-- ADD PWD/SENIOR HOLDER NAME FIELD TO SALES TABLE
-- ============================================================================
-- This migration adds the missing pwd_senior_holder_name field to store
-- the name of the PWD/Senior ID holder (which can be different from the customer)

-- Add the pwd_senior_holder_name field to the sales table
ALTER TABLE public.sales 
ADD COLUMN pwd_senior_holder_name character varying;

-- Add a comment to document this field
COMMENT ON COLUMN public.sales.pwd_senior_holder_name IS 'Name of the PWD/Senior ID holder (can be different from the registered customer)';

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'sales' 
  AND column_name IN ('pwd_senior_id', 'pwd_senior_holder_name', 'discount_type')
ORDER BY column_name;

-- Show current structure of sales table discount-related fields
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'sales' 
  AND column_name IN ('discount_type', 'discount_percentage', 'pwd_senior_id', 'pwd_senior_holder_name')
ORDER BY ordinal_position;