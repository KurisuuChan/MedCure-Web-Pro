# CSV Import Unit Config Fix

## Issue

**Error**: `Could not find the 'unit_config' column of 'products' in the schema cache`

The CSV import service was trying to insert data into a `unit_config` column that doesn't exist in the `products` table schema.

## Root Cause

The smart unit detection feature in `csvImportService.js` was attempting to store unit configuration metadata in a dedicated `unit_config` column, but this column was never added to the database schema.

## Solution Applied

### Immediate Fix (✅ Applied)

Modified `src/services/domains/inventory/csvImportService.js` to store the unit configuration data in the existing `import_metadata` JSONB column instead:

```javascript
// Before (❌ Caused error):
unit_config: {
  detected_units: unitConfig.units,
  primary_pricing_unit: unitConfig.primary_pricing_unit,
  has_sheets: unitConfig.has_sheets,
  has_boxes: unitConfig.has_boxes,
  category: unitConfig.category,
  auto_detected: true
}

// After (✅ Works):
import_metadata: {
  unit_config: {
    detected_units: unitConfig.units,
    primary_pricing_unit: unitConfig.primary_pricing_unit,
    has_sheets: unitConfig.has_sheets,
    has_boxes: unitConfig.has_boxes,
    category: unitConfig.category,
    auto_detected: true
  },
  imported_at: new Date().toISOString(),
  import_source: 'csv'
}
```

### Optional Database Migration

Created `database/add_unit_config_column.sql` for future use if you want to add a dedicated `unit_config` column.

**To apply the migration**:

```sql
-- Run this in your Supabase SQL editor
\i database/add_unit_config_column.sql
```

This migration will:

1. Add the `unit_config` JSONB column to the products table
2. Create a GIN index for better query performance
3. Migrate existing unit_config data from import_metadata to the new column

## Benefits of This Fix

### Current Implementation (import_metadata)

✅ **Works immediately** - No database migration needed  
✅ **Preserves all data** - Uses existing JSONB column  
✅ **Maintains import history** - Includes timestamp and source

### Future Implementation (dedicated column)

✅ **Better separation of concerns** - Unit config has its own column  
✅ **Easier queries** - Direct access without nested JSON navigation  
✅ **Better indexing** - Dedicated index for unit configuration queries

## Testing

After this fix, CSV imports should work correctly. The unit configuration will be stored in:

- **Current**: `products.import_metadata.unit_config`
- **After migration**: `products.unit_config`

## Code Changes Made

1. **Modified**: `src/services/domains/inventory/csvImportService.js` (line ~708)

   - Changed `unit_config` to nested structure in `import_metadata`
   - Added import timestamp and source tracking

2. **Created**: `database/add_unit_config_column.sql`
   - Optional migration for dedicated column
   - Includes data migration from import_metadata

## Next Steps

1. ✅ Test CSV import with the current fix
2. 🔄 Optionally run the database migration if you want a dedicated column
3. 🔄 Update any code that reads `unit_config` to check both locations:
   - `product.unit_config` (if migration applied)
   - `product.import_metadata?.unit_config` (current implementation)

## Date

October 8, 2025
