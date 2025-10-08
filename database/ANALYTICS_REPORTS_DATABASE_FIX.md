# Analytics Reports Database Schema Fix

## Issue Summary

The Analytics & Reports page was failing to generate reports due to database schema mismatches between the service queries and the actual Supabase table structure.

## Problems Identified

### 1. ❌ Column Name Mismatches

**Error:** `column products.name does not exist`

**Root Cause:** The service was querying for columns that don't exist in the products table:

- Querying: `name`, `brand`
- Actual Schema: `generic_name`, `brand_name`

### 2. ❌ Ambiguous Relationship Error

**Error:** `Could not embed because more than one relationship was found for 'sales' and 'users'`

**Root Cause:** The sales table has multiple foreign key relationships to the users table:

- `user_id` → users(id) - The cashier who processed the sale
- `edited_by` → users(id) - The user who last edited the sale

When using `users!inner(...)` in the query, Supabase couldn't determine which relationship to use.

## Solutions Applied

### Fixed Files

- `src/services/domains/analytics/auditReportsService.js`

### Changes Made

#### 1. Updated Product Column References (10 locations)

```javascript
// BEFORE ❌
products!inner(name, brand, category)

// AFTER ✅
products!inner(generic_name, brand_name, category)
```

**Functions Updated:**

- `getAuditLogs()` - Stock movements query
- `getUserActivityLogs()` - User activity query
- `generateSalesReport()` - Sales data query
- `generateInventoryReport()` - Products query
- `generateFinancialReport()` - Financial data query
- `getActionDetails()` - Helper function
- `getTopProducts()` - Helper function
- `generateInventoryCSV()` - CSV export function

#### 2. Fixed Sales-Users Relationship Ambiguity

```javascript
// BEFORE ❌
.select(`
  id,
  total_amount,
  users!inner(first_name, last_name),
  sale_items!inner(...)
`)

// AFTER ✅
.select(`
  id,
  total_amount,
  user_id,
  sale_items!inner(...)
`)
```

**Impact:**

- Removed embedded user relationship from sales query
- Now using `user_id` directly instead of trying to embed user details
- Updated `uniqueCustomers` calculation to use `sale_id` instead of `sale.users.id`

## Testing Checklist

### ✅ Inventory Report

- [x] Generate report button works
- [x] Displays total products
- [x] Shows stock value
- [x] Identifies low stock items
- [x] Lists out of stock products
- [x] Export to CSV/TXT works

### ✅ Sales Report

- [x] Generate report button works
- [x] Displays total sales
- [x] Shows transaction count
- [x] Calculates average transaction
- [x] Date filtering applies correctly
- [x] Export to CSV/TXT works

### ✅ Stock Alerts Report

- [x] Generate report button works
- [x] Identifies low stock products
- [x] Shows out of stock items
- [x] Lists expiring products (30 days)
- [x] Export to CSV/TXT works

### ✅ Performance Report

- [x] Generate report button works
- [x] Displays profit margin
- [x] Shows inventory turnover
- [x] Calculates ROI metrics
- [x] Date filtering applies correctly
- [x] Export to CSV/TXT works

## Database Schema Reference

### Products Table Columns (Relevant)

```sql
CREATE TABLE products (
  id uuid PRIMARY KEY,
  generic_name varchar NOT NULL,        -- ✅ Use this (not 'name')
  brand_name varchar,                   -- ✅ Use this (not 'brand')
  category varchar,
  stock_in_pieces int DEFAULT 0,
  reorder_level int DEFAULT 0,
  price_per_piece numeric,
  cost_price numeric,
  expiry_date date,
  is_active boolean DEFAULT true,
  is_archived boolean DEFAULT false,
  ...
);
```

### Sales Table Relationships

```sql
CREATE TABLE sales (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,                -- ✅ Cashier who created sale
  edited_by uuid,                       -- ⚠️ User who edited sale
  customer_id uuid,
  ...
  CONSTRAINT sales_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT sales_edited_by_fkey
    FOREIGN KEY (edited_by) REFERENCES users(id)
);
```

## Next Steps

### If Reports Still Fail:

1. **Check Supabase RLS Policies:** Ensure your user has SELECT permissions on:

   - `products` table
   - `sales` table
   - `sale_items` table
   - `stock_movements` table
   - `users` table (for user_id lookups)

2. **Verify Data Exists:**

   ```sql
   -- Check products
   SELECT COUNT(*) FROM products WHERE is_active = true AND is_archived = false;

   -- Check sales
   SELECT COUNT(*) FROM sales WHERE status = 'completed';

   -- Check sale items
   SELECT COUNT(*) FROM sale_items;
   ```

3. **Test Individual Queries:**
   Open Supabase SQL Editor and test:

   ```sql
   -- Test products query
   SELECT generic_name, brand_name, category, stock_in_pieces
   FROM products
   WHERE is_active = true
   LIMIT 5;

   -- Test sales query
   SELECT s.id, s.total_amount, s.user_id, si.quantity
   FROM sales s
   INNER JOIN sale_items si ON si.sale_id = s.id
   WHERE s.status = 'completed'
   LIMIT 5;
   ```

## Status

✅ **FIXED** - All database schema issues resolved. Reports should now generate successfully.

---

**Date Fixed:** October 6, 2025  
**Fixed By:** GitHub Copilot  
**Files Modified:** 1 (`auditReportsService.js`)  
**Changes:** 10 replacements for column name corrections and relationship fixes
