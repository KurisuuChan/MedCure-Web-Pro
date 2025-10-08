# 🔧 Stock Display Issue - Complete Troubleshooting Guide

## Current Status

✅ **Database**: All 373 products have synced stock (mismatched = 0)  
❓ **UI**: Still showing "0 pcs" after re-import

## Root Cause Analysis

The issue is likely one of these:

### 1. Browser Cache (Most Likely)

- React state not refreshing
- Service Worker caching old data
- Browser HTTP cache

### 2. Query Not Including stock_in_pieces

- Supabase query might be missing the field
- RLS (Row Level Security) filtering it out

### 3. UI Component Reading Wrong Field

- Component using `stock_quantity` instead of `stock_in_pieces`
- Old data still in React state

## Step-by-Step Fix

### Step 1: Verify Database Has Correct Data

Run in Supabase SQL Editor:

```sql
-- Check the most recent imports
SELECT
  generic_name,
  stock_in_pieces,
  stock_quantity,
  created_at
FROM products
WHERE created_at > NOW() - INTERVAL '30 minutes'
ORDER BY created_at DESC
LIMIT 10;
```

**Expected Result**: Both `stock_in_pieces` AND `stock_quantity` should be 100

---

### Step 2: Check Browser Console Logs

1. Open your app in the browser
2. Press `F12` to open Developer Tools
3. Go to **Console** tab
4. Look for these logs:
   ```
   🔍 Stock field check for first 5 products:
     1. PRODUCT_NAME: stock_in_pieces=100, stock_quantity=100
   ```

**If you see `stock_in_pieces=0`**: Database issue - stock not saved correctly  
**If you see `stock_in_pieces=100`**: UI/Cache issue - data is correct but not displaying

---

### Step 3: Clear All Caches

#### Option A: Hard Refresh (Quick)

- **Windows**: `Ctrl + Shift + R` or `Ctrl + F5`
- **Mac**: `Cmd + Shift + R`

#### Option B: Clear Browser Cache (Thorough)

1. Open DevTools (`F12`)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

#### Option C: Clear Application Data (Nuclear Option)

1. Open DevTools (`F12`)
2. Go to **Application** tab
3. Click **Clear storage**
4. Check all boxes (Cache, Local Storage, Session Storage, etc.)
5. Click **Clear site data**
6. Refresh page

---

### Step 4: Force React State Refresh

After clearing cache, in the Inventory page:

1. Click any filter dropdown
2. Change a filter (e.g., category)
3. Change it back to "All"
4. This forces React to re-fetch from database

---

### Step 5: Verify the Fix

Check these places in the UI:

- ✅ **Grid View**: Should show "100 pcs" in stock badge
- ✅ **Detail Modal**: Should show stock count
- ✅ **Edit Modal**: Stock field should have value 100
- ✅ **Table View**: Stock column should show 100

---

## If Still Not Working

### Debug Step 1: Check What Data React Has

Open browser console and run:

```javascript
// Find the products in React DevTools or check console logs
// Look for logs starting with "🔍 Stock field check"
```

### Debug Step 2: Check Supabase Response

In the console, look for:

```
📦 Sample product: { ..., stock_in_pieces: 100, stock_quantity: 100, ... }
```

**If stock_in_pieces is 0**: The import isn't working correctly  
**If stock_in_pieces is 100**: The UI isn't reading the data correctly

---

## Emergency Fixes

### Fix 1: Re-import with Fresh Browser Session

1. Close ALL browser tabs with your app
2. Clear browser cache completely
3. Restart browser
4. Login again
5. Delete the incorrectly imported products
6. Import CSV again

### Fix 2: Manual Database Update

If import keeps failing, manually fix in Supabase:

```sql
-- Set all products to 100 stock
UPDATE products
SET
  stock_in_pieces = 100,
  stock_quantity = 100,
  updated_at = NOW()
WHERE created_at > NOW() - INTERVAL '30 minutes';
```

### Fix 3: Check for Duplicate Products

Maybe old "0 stock" products are still showing:

```sql
-- Find duplicate products
SELECT
  generic_name,
  brand_name,
  COUNT(*) as count,
  array_agg(stock_in_pieces) as stock_values,
  array_agg(created_at) as import_dates
FROM products
GROUP BY generic_name, brand_name
HAVING COUNT(*) > 1
ORDER BY count DESC;
```

If duplicates exist, delete the old ones:

```sql
-- Keep only the most recent version of each product
DELETE FROM products p1
WHERE EXISTS (
  SELECT 1 FROM products p2
  WHERE p1.generic_name = p2.generic_name
    AND p1.brand_name = p2.brand_name
    AND p1.created_at < p2.created_at
);
```

---

## Prevention Checklist

✅ **Code Fix Applied**: `productService.js` now syncs both stock fields  
✅ **Database Fixed**: All products have matching stock values  
✅ **Logging Added**: Console shows stock values for debugging

## Next Steps

1. **Run `VERIFY_STOCK_DATA.sql`** to confirm database is correct
2. **Clear browser cache** completely (hard refresh or clear site data)
3. **Check browser console** for stock field logs
4. **Take screenshot** of:
   - Browser console logs (stock field check)
   - Network tab showing Supabase query response
   - UI showing "0 pcs"

This will help identify exactly where the problem is occurring.

---

## Quick Test

Run this in your browser console after opening the Inventory page:

```javascript
// This will show what React has loaded
console.log("Products loaded:", window.products || "Not available");
// Check local storage
console.log("LocalStorage:", localStorage);
// Check session storage
console.log("SessionStorage:", sessionStorage);
```
