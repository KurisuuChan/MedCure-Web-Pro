-- Add documentation comment to price_per_piece column for clarity
-- Run this SQL in your Supabase SQL Editor

-- Add comment to clarify that price_per_piece is the single authoritative unit price
COMMENT ON COLUMN products.price_per_piece IS 'Single authoritative unit price per piece - This is the primary pricing field for all calculations';

-- Success message
SELECT 'Database schema documentation updated - price_per_piece is now clearly documented as the single authoritative unit price!' as status;
