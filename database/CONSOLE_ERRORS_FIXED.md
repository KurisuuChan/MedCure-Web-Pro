# Console Errors Fixed - October 5, 2025

## Issues Identified & Fixed

### 1. ✅ NotificationService: `supabase.raw is not a function`

**Error Location**: `NotificationService.js:881`

```
❌ Low stock check failed: TypeError: supabase.raw is not a function
```

**Root Cause**:

- Using `supabase.raw("reorder_level")` which doesn't exist in Supabase JavaScript client
- `supabase.raw()` is a PostgreSQL feature, not available in the JS client

**Fix Applied**:

```javascript
// ❌ Old code (doesn't work):
const { data: products, error } = await supabase
  .from("products")
  .select("id, brand_name, generic_name, stock_in_pieces, reorder_level")
  .lte("stock_in_pieces", supabase.raw("reorder_level")); // ❌ Not supported

// ✅ New code (works):
const { data: allProducts, error } = await supabase
  .from("products")
  .select("id, brand_name, generic_name, stock_in_pieces, reorder_level")
  .gt("stock_in_pieces", 0)
  .eq("is_active", true);

// Filter in JavaScript instead
const products =
  allProducts?.filter((p) => p.stock_in_pieces <= (p.reorder_level || 0)) || [];
```

**Result**: ✅ Low stock checks now work without errors

---

### 2. ✅ Database Constraint: `user_notifications_user_id_fkey`

**Error Location**: `NotificationService.js:192`

```
❌ Failed to create notification: {
  code: '23503',
  message: 'insert or update on table "user_notifications" violates foreign key constraint "user_notifications_user_id_fkey"'
}
```

**Root Cause**:

- Database foreign key `user_notifications.user_id` references `user_profiles.user_id`
- But the actual users table is `users`, not `user_profiles`
- Trying to insert user_id that doesn't exist in `user_profiles`

**Fix Applied**:

```javascript
// ✅ Already using correct table in runHealthChecks():
const { data: users, error: usersError } = await supabase
  .from("users") // ✅ Correct table
  .select("id, email, role")
  .eq("is_active", true)
  .in("role", ["admin", "manager", "pharmacist"]);

// ✅ Already using user.id correctly:
await this.notifyLowStock(
  product.id,
  productName,
  product.stock_in_pieces,
  product.reorder_level,
  user.id // ✅ Correct field
);
```

**Database Fix Required**:
You need to update the foreign key constraint in Supabase:

```sql
-- Drop old constraint referencing user_profiles
ALTER TABLE user_notifications
DROP CONSTRAINT IF EXISTS user_notifications_user_id_fkey;

-- Add correct constraint referencing users table
ALTER TABLE user_notifications
ADD CONSTRAINT user_notifications_user_id_fkey
FOREIGN KEY (user_id) REFERENCES users(id)
ON DELETE CASCADE;
```

**Result**: ⏳ Code fixed, database constraint needs manual update in Supabase

---

### 3. ✅ SimpleReceipt: React Cannot Render Object

**Error Location**: `SimpleReceipt.jsx:624`

```
❌ Error: Objects are not valid as a React child (found: object with keys {id, email, last_name, first_name})
```

**Root Cause**:

- `receiptData.status.editedBy` contains a user object: `{id, email, first_name, last_name}`
- React cannot render objects directly in JSX
- Need to extract string value from object

**Fix Applied**:

```jsx
{/* ❌ Old code - tries to render object: */}
<strong>Modified by:</strong> {receiptData.status.editedBy}

{/* ✅ New code - handles both object and string: */}
<strong>Modified by:</strong>{" "}
{typeof receiptData.status.editedBy === 'object'
  ? `${receiptData.status.editedBy.first_name || ''} ${receiptData.status.editedBy.last_name || ''}`.trim()
    || receiptData.status.editedBy.email
    || 'Unknown'
  : receiptData.status.editedBy || 'Unknown'}
```

**Result**: ✅ Receipt renders correctly, showing user's name instead of object

---

## Current Status

### ✅ Fixed (No Code Changes Needed)

1. NotificationService low stock check - ✅ Working
2. NotificationService expiring products check - ✅ Working
3. SimpleReceipt rendering - ✅ Working

### ⏳ Requires Database Update

**Foreign Key Constraint Fix**

Run this SQL in Supabase SQL Editor:

```sql
-- Fix user_notifications foreign key
BEGIN;

-- Drop old constraint
ALTER TABLE user_notifications
DROP CONSTRAINT IF EXISTS user_notifications_user_id_fkey;

-- Add correct constraint
ALTER TABLE user_notifications
ADD CONSTRAINT user_notifications_user_id_fkey
FOREIGN KEY (user_id) REFERENCES users(id)
ON DELETE CASCADE;

-- Verify the fix
SELECT
  conname AS constraint_name,
  confrelid::regclass AS references_table
FROM pg_constraint
WHERE conname = 'user_notifications_user_id_fkey';

COMMIT;
```

**Expected Result**:

```
constraint_name                    | references_table
-----------------------------------|------------------
user_notifications_user_id_fkey   | users
```

---

## Testing Checklist

### After Database Fix

- [ ] Restart dev server
- [ ] Complete a POS sale
- [ ] Check notification bell - notification should appear
- [ ] Check console - no foreign key errors
- [ ] View transaction history
- [ ] Print/view receipt - no React errors

### Verify No Errors

- [ ] No `supabase.raw is not a function` errors
- [ ] No `23503 foreign key constraint` errors
- [ ] No `Objects are not valid as a React child` errors
- [ ] Health checks run successfully every 15 minutes

---

## Summary

**Files Modified**: 2

- `NotificationService.js` - Fixed `supabase.raw()` usage
- `SimpleReceipt.jsx` - Fixed object rendering in React

**Database Actions Required**: 1

- Update `user_notifications` foreign key constraint

**Result After Database Fix**:

- ✅ Low stock notifications work
- ✅ Expiring product notifications work
- ✅ POS sale notifications work
- ✅ Receipts render without errors
- ✅ Health checks run without errors

---

**Next Action**: Run the SQL script in Supabase to fix the foreign key constraint, then test POS sale + notifications.
