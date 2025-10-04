-- Final corrected function based on actual data analysis
-- Execute this in Supabase SQL editor

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
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    si.product_id,
    p.generic_name::TEXT,
    p.brand_name::TEXT,
    SUM(si.quantity)::BIGINT as total_quantity,
    -- Use total_price as it represents the actual charged amount
    SUM(si.total_price)::NUMERIC as total_revenue
  FROM sale_items si
  INNER JOIN products p ON p.id = si.product_id
  INNER JOIN sales s ON s.id = si.sale_id
  WHERE 
    s.created_at >= NOW() - (days_limit || ' days')::INTERVAL
    AND s.status = 'completed'
    AND p.is_archived = false
  GROUP BY si.product_id, p.generic_name, p.brand_name
  ORDER BY total_quantity DESC
  LIMIT product_limit;
END;
$$;

-- Test the function
SELECT * FROM get_top_selling_products(30, 5);