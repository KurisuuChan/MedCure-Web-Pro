-- Add enhanced columns to categories table for intelligent category system
-- Run this SQL in your Supabase SQL Editor

-- Add stats column to store calculated category statistics
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS stats JSONB DEFAULT '{}';

-- Add last_calculated column to track when stats were last updated
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add metadata column for storing additional category information
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create index for better performance on stats queries
CREATE INDEX IF NOT EXISTS idx_categories_stats ON categories USING GIN (stats);
CREATE INDEX IF NOT EXISTS idx_categories_last_calculated ON categories(last_calculated);
CREATE INDEX IF NOT EXISTS idx_categories_metadata ON categories USING GIN (metadata);

-- Update existing categories to have default stats
UPDATE categories 
SET stats = jsonb_build_object(
    'total_products', 0,
    'active_products', 0,
    'total_value', 0,
    'total_cost_value', 0,
    'total_profit_potential', 0,
    'low_stock_count', 0,
    'out_of_stock_count', 0,
    'average_price', 0
),
last_calculated = NOW()
WHERE stats IS NULL OR stats = '{}';

-- Create function to automatically update category stats when products change
CREATE OR REPLACE FUNCTION update_category_stats_on_product_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the category stats when a product is inserted, updated, or deleted
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Update stats for the new/updated product's category
        UPDATE categories 
        SET last_calculated = NOW()
        WHERE name = NEW.category;
    END IF;
    
    IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.category != NEW.category) THEN
        -- Update stats for the old category if category changed or product deleted
        UPDATE categories 
        SET last_calculated = NOW()
        WHERE name = OLD.category;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update category stats when products change
DROP TRIGGER IF EXISTS trigger_update_category_stats ON products;
CREATE TRIGGER trigger_update_category_stats
    AFTER INSERT OR UPDATE OR DELETE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_category_stats_on_product_change();

-- Grant necessary permissions
GRANT SELECT, UPDATE ON categories TO authenticated;

-- Add comments for documentation
COMMENT ON COLUMN categories.stats IS 'JSON object containing calculated category statistics (products count, total value, etc.)';
COMMENT ON COLUMN categories.last_calculated IS 'Timestamp when category statistics were last calculated';
COMMENT ON COLUMN categories.metadata IS 'JSON object for additional category metadata (auto_created, etc.)';

-- Success message
SELECT 'Category enhancement schema applied successfully!' as status;
