-- Simple working function that returns top products by revenue
-- Run this in Supabase SQL editor

-- Drop any existing function
DROP FUNCTION IF EXISTS get_top_selling_products(integer, integer);

-- Create a simple, working function ordered by sales amount (revenue)
CREATE OR REPLACE FUNCTION get_top_selling_products(
  days_limit INTEGER DEFAULT 30,
  product_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  product_id UUID,
  generic_name TEXT,
  brand_name TEXT,
  total_quantity BIGINT,
  total_revenue NUMERIC
) 
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    si.product_id::UUID,
    p.generic_name::TEXT,
    p.brand_name::TEXT,
    SUM(si.quantity)::BIGINT,
    SUM(si.total_price)::NUMERIC
  FROM sale_items si
  JOIN products p ON p.id = si.product_id
  JOIN sales s ON s.id = si.sale_id
  WHERE 
    s.created_at >= CURRENT_DATE - INTERVAL '1 day' * days_limit
    AND s.status = 'completed'
    AND p.is_archived = false
  GROUP BY si.product_id, p.generic_name, p.brand_name
  ORDER BY SUM(si.total_price) DESC  -- Changed: Order by revenue instead of quantity
  LIMIT product_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test it immediately
SELECT 
  product_id,
  generic_name,
  brand_name,
  total_quantity,
  total_revenue
FROM get_top_selling_products(30, 5);