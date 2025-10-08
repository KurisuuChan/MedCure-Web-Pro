-- =============================================================================
-- ADD UNIT_CONFIG COLUMN TO PRODUCTS TABLE
-- =============================================================================
-- Purpose: Add JSONB column to store smart unit detection metadata
-- Date: October 8, 2025
-- Author: System Fix
-- =============================================================================

-- Add unit_config column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS unit_config JSONB DEFAULT '{}'::jsonb;

-- Add comment to explain the column purpose
COMMENT ON COLUMN public.products.unit_config IS 'Stores smart unit detection metadata including detected units, primary pricing unit, sheet/box configuration, and auto-detection flags';

-- Create an index on unit_config for better query performance
CREATE INDEX IF NOT EXISTS idx_products_unit_config ON public.products USING gin (unit_config);

-- Migrate existing data from import_metadata to unit_config if present
UPDATE public.products 
SET unit_config = import_metadata->'unit_config'
WHERE import_metadata ? 'unit_config' 
  AND (unit_config IS NULL OR unit_config = '{}'::jsonb);

-- Example unit_config structure:
/*
{
  "detected_units": ["piece", "sheet", "box"],
  "primary_pricing_unit": "piece",
  "has_sheets": true,
  "has_boxes": true,
  "category": "tablets",
  "auto_detected": true
}
*/
