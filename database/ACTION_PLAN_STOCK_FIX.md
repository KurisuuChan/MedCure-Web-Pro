# 🎯 IMMEDIATE ACTION PLAN - Fix Stock Display

## What You Need to Do Right Now

### 1️⃣ First: Check Browser Console (30 seconds)

1. Open your app in the browser
2. Press `F12` to open Developer Tools
3. Click the **Console** tab
4. Look for these messages:

```
🔍 Stock field check for first 5 products:
  1. PRODUCT_NAME: stock_in_pieces=?, stock_quantity=?
  2. ...
```

**Take a screenshot and share it with me!**

---

### 2️⃣ Clear Browser Cache Completely (1 minute)

**Method 1: Nuclear Option (Recommended)**

1. Press `F12` (DevTools)
2. Click **Application** tab
3. Click **Clear storage** (left sidebar)
4. Check ALL boxes
5. Click **Clear site data**
6. Close DevTools
7. Press `Ctrl+Shift+R` (hard refresh)

**Method 2: Quick Hard Refresh**

- Windows: `Ctrl + Shift + R` or `Ctrl + F5`
- Mac: `Cmd + Shift + R`

---

### 3️⃣ Verify Database (30 seconds)

Run this in Supabase SQL Editor:

```sql
SELECT
  generic_name,
  stock_in_pieces,
  stock_quantity
FROM products
ORDER BY created_at DESC
LIMIT 5;
```

**Expected**: Both columns should show 100  
**If not**: Database wasn't updated correctly

---

### 4️⃣ Check What the Console Shows

After clearing cache, go back to browser console and look for:

#### Good Signs ✅

```
🃏 ProductCard for "STALIP-40":
  stock_in_pieces: 100,
  stock_quantity: 100
```

```
📦 Sample product: { stock_in_pieces: 100, ... }
```

#### Bad Signs ❌

```
🃏 ProductCard for "STALIP-40":
  stock_in_pieces: 0,
  stock_quantity: 0
```

---

## Quick Diagnosis Tree

```
Is database showing stock_in_pieces = 100?
├─ NO  → Run: database/FIX_STOCK_QUANTITY_SYNC.sql
└─ YES → Is console showing stock_in_pieces = 100?
    ├─ NO  → Check Supabase RLS policies
    └─ YES → Is UI showing "0 pcs"?
        ├─ NO  → ✅ FIXED!
        └─ YES → Clear browser cache (nuclear option)
```

---

## What I've Already Fixed

✅ **productService.js** - Now syncs `stock_quantity` with `stock_in_pieces`  
✅ **Database SQL** - Script to fix all existing products  
✅ **Debugging** - Added console logs to track data flow

## What You Need to Check

📍 **Browser Cache** - Might be showing old data  
📍 **Console Logs** - Will show if data is reaching the UI  
📍 **Database Values** - Confirm both stock fields are 100

---

## Share These Screenshots

Please take screenshots of:

1. **Browser Console** showing:
   - The "Stock field check" logs
   - Any errors in red
2. **Supabase SQL Result** showing:
   - generic_name, stock_in_pieces, stock_quantity columns
3. **UI** showing:
   - The product cards with "0 pcs"

This will tell me exactly where the problem is!

---

## If Nothing Works

Try this emergency fix:

1. **Delete** all recently imported products from Supabase
2. **Restart** your dev server (`npm run dev`)
3. **Close** all browser tabs
4. **Clear** browser cache
5. **Open** fresh browser tab
6. **Import** CSV again

The new import should work with the code fixes I applied.
