# Category Creation Failure - Debugging Guide

## Problem

Categories fail to create during CSV import with error:

```
❌ [UnifiedCategory] Failed to create category: [Category Name]
```

## Root Causes

### 1. **Duplicate Key Violation** (Most Likely)

The `categories` table has a UNIQUE constraint on the `name` column:

```sql
name character varying NOT NULL UNIQUE
```

If a category with that exact name already exists, the insert will fail.

### 2. **Row Level Security (RLS) Policies**

If RLS is enabled on the `categories` table without proper INSERT policies, the operation will be denied.

### 3. **Case Sensitivity / Normalization Issues**

The category name might exist with slightly different:

- Capitalization: "Dietary supplement" vs "Dietary Supplement"
- Whitespace: "Dietary Supplement" (double space) vs "Dietary Supplement"
- Special characters: "Antihistamine(First Generation)" vs "Antihistamine (First Generation)"

---

## Immediate Fixes Applied

### 1. Enhanced Error Logging

Added detailed error information in `unifiedCategoryService.js`:

```javascript
console.error(
  `❌ [UnifiedCategory] Failed to create category: ${category.name}`,
  {
    error: result.error,
    message: result.message,
    action: result.action,
    fullResult: result,
  }
);
```

**Action:** Check browser console for the full error details

### 2. Duplicate Key Handling

Added automatic handling for duplicate key violations:

```javascript
if (error.code === "23505" || error.message?.includes("duplicate key")) {
  // Fetch and return existing category instead of failing
  const existingResult = await this.getCategoryByName(normalizedData.name);
  if (existingResult.success && existingResult.data) {
    return {
      success: true,
      data: existingResult.data,
      action: "existing",
      message: `Category "${existingResult.data.name}" already exists`,
    };
  }
}
```

---

## Diagnostic Steps

### Step 1: Run the Debug Script

```bash
node debug_categories.js
```

This will show:

- All existing categories in database
- Whether each failing category already exists (exact or similar match)
- Suggestions for fixing the issue

### Step 2: Check Browser Console

After the fix, the browser console will now show:

```javascript
{
  error: "duplicate key value violates unique constraint...",
  message: "Failed to create category: ...",
  action: "failed",
  fullResult: { ... }
}
```

This will tell you the EXACT error from Supabase.

### Step 3: Check Database Directly

Run this SQL in Supabase SQL Editor:

```sql
-- Check if categories exist
SELECT name, id, is_active, created_at
FROM categories
WHERE name IN (
  'Antihistamine (First Generation)',
  'Dietary Supplement',
  'Iron Supplement',
  'Renal Supplement',
  'Antihypertensive',
  'Energy Supplement',
  'Brain Health Supplement',
  'Liver Health Supplement',
  'General Supplement',
  'Infant Supplement',
  'Electrolyte Supplement',
  'Statin/Cholesterol Lowering'
)
ORDER BY name;

-- Check for similar names (case-insensitive)
SELECT name, id, is_active
FROM categories
WHERE LOWER(name) LIKE '%supplement%'
   OR LOWER(name) LIKE '%antihistamine%'
   OR LOWER(name) LIKE '%antihypertensive%'
   OR LOWER(name) LIKE '%statin%'
ORDER BY name;

-- Check RLS status
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'categories';

-- If RLS is enabled, check policies
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'categories';
```

---

## Solutions

### Solution 1: Categories Already Exist

If the debug script shows categories already exist:

**Option A: Use existing categories**

- Update your CSV to use the exact names from the database
- Example: If database has "Dietary Supplements" use that instead of "Dietary Supplement"

**Option B: Delete and recreate**

```sql
-- Only if you're sure you want to delete
DELETE FROM categories
WHERE name IN ('Dietary Supplement', 'Iron Supplement', ...);
```

### Solution 2: RLS Policy Issues

If RLS is blocking inserts:

```sql
-- Option A: Disable RLS (not recommended for production)
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;

-- Option B: Add proper INSERT policy
CREATE POLICY "Allow authenticated users to insert categories"
ON categories
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Option C: Add policy for specific role
CREATE POLICY "Allow admins to insert categories"
ON categories
FOR INSERT
TO authenticated
USING (
  auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
);
```

### Solution 3: Name Normalization Issues

If names are slightly different:

The code already handles this with `normalizeCategoryName()`, but you can manually fix:

```sql
-- Find all categories with "supplement" in the name
SELECT name FROM categories WHERE LOWER(name) LIKE '%supplement%';

-- Update to match your CSV exactly
UPDATE categories
SET name = 'Dietary Supplement'
WHERE name = 'Dietary Supplements';
```

---

## Prevention

### 1. Pre-validate Categories

Before import, check if categories exist:

```javascript
const existingCategories = await UnifiedCategoryService.getAllCategories();
const existingNames = existingCategories.data.map((c) => c.name.toLowerCase());

const newCategories = importData.filter((item) => {
  return !existingNames.includes(item.category.toLowerCase());
});
```

### 2. Use Upsert Instead of Insert

Modify the code to use upsert (insert or update):

```javascript
const { data, error } = await supabase
  .from("categories")
  .upsert([newCategory], {
    onConflict: "name",
    ignoreDuplicates: false,
  })
  .select()
  .single();
```

### 3. Batch Create with Error Handling

```javascript
const results = await Promise.allSettled(
  categories.map((cat) => this.createCategory(cat, context))
);

const succeeded = results.filter((r) => r.status === "fulfilled").length;
const failed = results.filter((r) => r.status === "rejected").length;

console.log(`✅ Created ${succeeded} categories, ❌ Failed ${failed}`);
```

---

## Quick Fix Commands

```bash
# 1. Check what's in the console (already running)
# Look for the detailed error object

# 2. Run diagnostic script
node debug_categories.js

# 3. If categories exist, option to delete them:
# Go to Supabase SQL Editor and run:
DELETE FROM categories WHERE name LIKE '%Supplement%';
DELETE FROM categories WHERE name LIKE '%Antihistamine%';
DELETE FROM categories WHERE name LIKE '%Antihypertensive%';
DELETE FROM categories WHERE name LIKE '%Statin%';

# 4. Then retry import
```

---

## Expected Behavior After Fix

With the improvements made, you should now see:

### If category already exists:

```
ℹ️ [UnifiedCategory] Category "Dietary Supplement" already exists (caught duplicate key error)
✅ [UnifiedCategory] Created category: Dietary Supplement
```

### If RLS blocks it:

```
❌ [UnifiedCategory] Failed to create category: Dietary Supplement
{
  error: "new row violates row-level security policy...",
  message: "Failed to create category: new row violates row-level security policy",
  action: "failed"
}
```

### If successful:

```
✅ [UnifiedCategory] Created category: Dietary Supplement
```

---

## Next Steps

1. **Check browser console** for the detailed error object
2. **Run** `node debug_categories.js` to see what categories exist
3. **Based on the output**, choose the appropriate solution above
4. **Report back** with the console output so I can provide specific fix
