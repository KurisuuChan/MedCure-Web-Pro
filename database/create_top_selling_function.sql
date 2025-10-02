-- Create function to get top selling products
-- This aggregates sales_items data to show best sellers

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
    p.name as product_name,
    SUM(si.quantity)::BIGINT as total_quantity,
    SUM(si.subtotal)::NUMERIC as total_revenue
  FROM sales_items si
  INNER JOIN products p ON p.id = si.product_id
  INNER JOIN sales s ON s.id = si.sale_id
  WHERE 
    s.created_at >= NOW() - (days_limit || ' days')::INTERVAL
    AND s.status = 'completed'
    AND p.is_archived = false
  GROUP BY si.product_id, p.name
  ORDER BY total_quantity DESC
  LIMIT product_limit;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_top_selling_products(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_selling_products(INTEGER, INTEGER) TO anon;

COMMENT ON FUNCTION get_top_selling_products IS 'Returns top selling products based on completed sales within the specified time period';
