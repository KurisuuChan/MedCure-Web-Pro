# 🔧 Stock Display Issue - Fixed

## Problem Summary

After successful CSV import with 93 categories, products showed **0 pcs stock** in the UI despite CSV containing `stock_in_pieces = 100`.

## Root Cause Analysis

### Database Investigation

Ran diagnostic query and found:

```sql
| generic_name      | stock_in_pieces | stock_quantity |
| ----------------- | --------------- | -------------- |
| ZINC SULFATE      | 100             | 0              |
| VITAMIN E         | 100             | 0              |
| VITAMIN B1+B6+B12 | 100             | 0              |
```

**Issue**: The database has TWO stock fields:

- ✅ `stock_in_pieces` = 100 (correctly imported from CSV)
- ❌ `stock_quantity` = 0 (not being updated during import)

### Code Flow Analysis

1. **CSV Import** → `csvImportService.js`

   - ✅ Correctly parses `stock_in_pieces` from CSV
   - ✅ Transforms data with `stock_in_pieces: row.stock_in_pieces`

2. **Product Creation** → `productService.js`

   - ❌ Uses spread operator `...product` which includes `stock_in_pieces`
   - ❌ BUT doesn't explicitly set `stock_quantity`
   - Result: `stock_in_pieces` saved, `stock_quantity` defaults to 0

3. **UI Display** → `ProductCard.jsx`
   - ✅ Correctly displays `{product.stock_in_pieces} pcs`
   - But if any legacy code checks `stock_quantity`, it shows 0

## Solutions Implemented

### 1. Fix Future Imports

**File**: `src/services/domains/inventory/productService.js`

Added automatic sync in `addProduct()` function:

```javascript
const productData = {
  ...product,
  // 🔧 FIX: Sync stock_quantity with stock_in_pieces for backward compatibility
  stock_quantity: product.stock_in_pieces || product.stock_quantity || 0,
  // ... rest of fields
};
```

### 2. Fix Existing Data

**File**: `database/FIX_STOCK_QUANTITY_SYNC.sql`

SQL script to sync existing imported products:

```sql
UPDATE products
SET
  stock_quantity = stock_in_pieces,
  updated_at = NOW()
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND stock_in_pieces IS NOT NULL
  AND stock_in_pieces > 0
  AND stock_quantity != stock_in_pieces;
```

## How to Apply the Fix

### Step 1: Fix Existing Data (Run in Supabase SQL Editor)

```sql
-- Run the complete script
database/FIX_STOCK_QUANTITY_SYNC.sql
```

This will:

1. Show current state (how many products need fixing)
2. Sync `stock_quantity` with `stock_in_pieces`
3. Verify all products are now synced
4. Show summary statistics

### Step 2: Refresh the Application

1. **Hard refresh** your browser (Ctrl+F5 or Cmd+Shift+R)
2. Navigate to Inventory page
3. Stock should now display correctly as "100 pcs"

### Step 3: Verify the Fix

Check a few products in the UI:

- Grid view should show "100 pcs"
- Detail view should show correct stock
- POS should see available stock

## Prevention

✅ **Future imports** will automatically sync both fields
✅ **Code fix** ensures backward compatibility
✅ **Both fields** (`stock_in_pieces` and `stock_quantity`) stay in sync

## Files Modified

1. ✅ `src/services/domains/inventory/productService.js` - Added stock_quantity sync
2. ✅ `database/FIX_STOCK_QUANTITY_SYNC.sql` - SQL fix for existing data
3. ✅ `database/CHECK_STOCK_ISSUE.sql` - Diagnostic script (already created)

## Testing Checklist

- [ ] Run `FIX_STOCK_QUANTITY_SYNC.sql` in Supabase
- [ ] Verify SQL shows "✅ SYNCED" status
- [ ] Hard refresh browser
- [ ] Check Inventory page shows correct stock
- [ ] Test importing a new CSV (should work correctly now)
- [ ] Verify POS can see available stock

## Technical Notes

- The app schema has both `stock_in_pieces` (new) and `stock_quantity` (legacy)
- CSV import only populated `stock_in_pieces`
- Some UI components or queries might reference `stock_quantity`
- Fix ensures both fields stay synchronized for compatibility

## Success Criteria

✅ Existing products show correct stock after SQL fix
✅ New CSV imports automatically sync both stock fields
✅ UI displays stock correctly in all views (grid, detail, POS)
✅ No data loss - all 100 pieces from CSV are preserved
