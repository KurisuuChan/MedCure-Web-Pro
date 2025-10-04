-- Updated Top Selling Products Function with proper field mapping
-- Execute this in Supabase SQL editor to replace the existing function

CREATE OR REPLACE FUNCTION get_top_selling_products(
  days_limit INTEGER DEFAULT 30,
  product_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
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
    CASE 
      WHEN p.brand_name IS NOT NULL AND p.brand_name != '' 
      THEN p.brand_name || ' (' || p.generic_name || ')'
      ELSE p.generic_name
    END as product_name,
    SUM(si.quantity)::BIGINT as total_quantity,
    -- Use total_price if available, fallback to price * quantity
    SUM(
      COALESCE(si.total_price, p.price * si.quantity)
    )::NUMERIC as total_revenue
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