-- 🚀 **DIRECT FIX FOR ARCHIVE_REASON COLUMN**
-- Simple, direct approach to add the missing column
-- Run this in your Supabase SQL Editor

-- Check if column exists first
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'archive_reason';

-- Add the column directly (will error if it already exists, which is fine)
ALTER TABLE products ADD COLUMN archive_reason TEXT;

-- Verify it was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'archive_reason';

-- If you need to refresh the schema cache in Supabase, you can also run:
-- REFRESH MATERIALIZED VIEW IF EXISTS your_view_name; (if you have any materialized views)

-- Show all columns in products table to verify structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'products'
ORDER BY ordinal_position;
