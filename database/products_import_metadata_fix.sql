-- Add import_metadata column to products table
-- Run this SQL in your Supabase SQL Editor

-- Add import_metadata column to store import-related information
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS import_metadata JSONB DEFAULT '{}';

-- Create index for better performance on import metadata queries
CREATE INDEX IF NOT EXISTS idx_products_import_metadata ON products USING GIN (import_metadata);

-- Grant necessary permissions
GRANT SELECT, UPDATE ON products TO authenticated;

-- Add comment for documentation
COMMENT ON COLUMN products.import_metadata IS 'JSON object containing import-related metadata (batch_id, source_file, import_date, etc.)';

-- Success message
SELECT 'Products import_metadata column added successfully!' as status;
