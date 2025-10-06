# Categories & Archived Buttons - Troubleshooting Guide

**Date:** October 6, 2025  
**Issue:** Categories and Archived buttons not working after moving to ProductSearch component

---

## ✅ Current Setup (Verified)

### 1. **State Management** ✅

Location: `src/pages/InventoryPage.jsx` (Lines 104-105)

```javascript
const [showCategoriesModal, setShowCategoriesModal] = useState(false);
const [showArchivedModal, setShowArchivedModal] = useState(false);
```

### 2. **Props Passed to ProductSearch** ✅

Location: `src/pages/InventoryPage.jsx` (Lines 293-303)

```javascript
<ProductSearch
  onSearch={handleSearch}
  onFilter={handleFilter}
  filterOptions={{
    ...filterOptions,
    categories: filterOptions.categories || [],
  }}
  currentFilters={filters}
  searchTerm={searchTerm}
  setShowCategoriesModal={setShowCategoriesModal} // ✅ PASSED
  setShowArchivedModal={setShowArchivedModal} // ✅ PASSED
/>
```

### 3. **Buttons in ProductSearch** ✅

Location: `src/features/inventory/components/ProductSearch.jsx`

```javascript
{
  /* Categories Button - Icon Only */
}
{
  setShowCategoriesModal && (
    <button
      onClick={() => setShowCategoriesModal(true)}
      className="group flex items-center justify-center w-10 h-10 bg-white border border-gray-300 text-purple-600 rounded-lg hover:bg-purple-50 hover:border-purple-400 hover:text-purple-700 transition-all duration-200 shadow-sm hover:shadow"
      title="Manage Categories"
      aria-label="Manage Categories"
    >
      <Tag className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
    </button>
  );
}

{
  /* Archived Button - Icon Only */
}
{
  setShowArchivedModal && (
    <button
      onClick={() => setShowArchivedModal(true)}
      className="group flex items-center justify-center w-10 h-10 bg-white border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 hover:border-gray-400 hover:text-gray-700 transition-all duration-200 shadow-sm hover:shadow"
      title="View Archived Products"
      aria-label="View Archived Products"
    >
      <Archive className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
    </button>
  );
}
```

### 4. **Modal Rendering** ✅

Location: `src/pages/InventoryPage.jsx` (Lines 423-483)

```javascript
{
  /* Categories Modal */
}
{
  showCategoriesModal && (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={() => setShowCategoriesModal(false)}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
            <Tag className="h-6 w-6 text-purple-600" />
            <span>Category Management</span>
          </h2>
          <button
            onClick={() => setShowCategoriesModal(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6">
          <CategoryManagement />
        </div>
      </div>
    </div>
  );
}

{
  /* Archived Modal - Same structure */
}
```

### 5. **Component Imports** ✅

Location: `src/pages/InventoryPage.jsx` (Lines 1-49)

```javascript
import CategoryManagement from "../features/inventory/components/CategoryManagement";
import ArchivedProductsManagement from "../features/inventory/components/ArchivedProductsManagement";
import { Tag, Archive, X } from "lucide-react";
```

---

## 🔍 Troubleshooting Steps

### Step 1: Check if Buttons are Visible

1. Open browser DevTools (F12)
2. Go to Inventory Page
3. Look for the buttons in the search area
4. They should appear as:
   - **Purple tag icon** (Categories)
   - **Filters button** (with text)
   - **Gray archive icon** (Archived)

### Step 2: Check Console for Errors

Open browser console and look for any errors related to:

- `CategoryManagement`
- `ArchivedProductsManagement`
- `ProductSearch`
- State management errors

### Step 3: Test Button Click

1. Click the **Categories button** (purple tag icon)
2. Modal should open with "Category Management" title
3. Click the **Archived button** (gray archive icon)
4. Modal should open with "Archived Products" title

### Step 4: Verify Database Connection

The components connect to Supabase tables:

- **Categories**: `public.categories` table
- **Archived Products**: `public.products` table (where `is_archived = true`)

Check if these tables exist and have data:

```sql
-- Check categories table
SELECT * FROM public.categories LIMIT 5;

-- Check archived products
SELECT * FROM public.products
WHERE is_archived = true
LIMIT 5;
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Buttons Not Visible

**Symptom:** No buttons appear beside the search bar

**Possible Causes:**

- Props not passed to ProductSearch
- Conditional rendering `{setShowCategoriesModal && ...}` evaluating to false

**Solution:**

```javascript
// In InventoryPage.jsx, verify props are passed:
<ProductSearch
  setShowCategoriesModal={setShowCategoriesModal}
  setShowArchivedModal={setShowArchivedModal}
  // ... other props
/>
```

### Issue 2: Buttons Visible But Not Clickable

**Symptom:** Buttons appear but clicking does nothing

**Possible Causes:**

- onClick handler not firing
- State not updating

**Solution:**
Add console.log to verify:

```javascript
<button
  onClick={() => {
    console.log('Categories button clicked');
    setShowCategoriesModal(true);
  }}
  ...
>
```

### Issue 3: Modal Opens But Shows Nothing

**Symptom:** Modal backdrop appears but content is empty

**Possible Causes:**

- CategoryManagement or ArchivedProductsManagement component errors
- Database connection issues

**Solution:**

1. Check browser console for component errors
2. Verify Supabase connection
3. Check if user has permissions to access data

### Issue 4: Modal Doesn't Close

**Symptom:** Can't close modal after opening

**Possible Causes:**

- Click event propagation issues
- State not updating on close

**Solution:**
Verify close handlers:

```javascript
// Backdrop click
onClick={() => setShowCategoriesModal(false)}

// X button click
<button onClick={() => setShowCategoriesModal(false)}>

// Prevent propagation on modal content
onClick={(e) => e.stopPropagation()}
```

---

## 📊 Database Schema Reference

### Categories Table

```sql
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name varchar NOT NULL UNIQUE,
  description text,
  color varchar DEFAULT '#3B82F6',
  icon varchar DEFAULT 'Package',
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  stats jsonb DEFAULT '{}',
  last_calculated timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'
);
```

### Products Table (Archived Products)

```sql
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  generic_name varchar NOT NULL,
  brand_name varchar,
  category varchar,
  -- ... other fields
  is_archived boolean DEFAULT false,
  archived_at timestamptz,
  archived_by uuid,
  archive_reason text,
  -- ...
);
```

---

## 🔧 Service Layer

### UnifiedCategoryService

Location: `src/services/domains/inventory/unifiedCategoryService.js`

Key Methods:

- `getAllCategories()` - Fetch all categories
- `createCategory(data)` - Create new category
- `updateCategory(id, data)` - Update category
- `deleteCategory(id)` - Delete category
- `getCategoryStats(categoryId)` - Get category statistics

### ProductService

Location: `src/services/domains/inventory/productService.js`

Key Methods for Archived:

- `getArchivedProducts()` - Fetch all archived products
- `archiveProduct(productId, reason)` - Archive a product
- `restoreProduct(productId)` - Restore archived product

---

## ✅ Verification Checklist

Before reporting an issue, verify:

- [ ] Buttons are visible in the UI
- [ ] No console errors in browser DevTools
- [ ] Props are passed to ProductSearch component
- [ ] Modal state variables exist in InventoryPage
- [ ] CategoryManagement component is imported
- [ ] ArchivedProductsManagement component is imported
- [ ] Database tables exist and are accessible
- [ ] User has permissions to view categories/archived products
- [ ] Supabase connection is working
- [ ] No network errors in Network tab

---

## 🚀 Expected Behavior

### Categories Button Flow:

1. User clicks purple tag icon
2. Modal opens with backdrop blur
3. CategoryManagement component renders
4. User can view/create/edit/delete categories
5. User clicks X or backdrop to close
6. Modal closes, state resets

### Archived Button Flow:

1. User clicks gray archive icon
2. Modal opens with backdrop blur
3. ArchivedProductsManagement component renders
4. User can view archived products
5. User can restore products
6. User clicks X or backdrop to close
7. Modal closes, state resets

---

## 📝 Next Steps

If buttons still not working after verification:

1. **Clear browser cache** and reload
2. **Restart development server**
3. **Check Supabase dashboard** for data
4. **Verify RLS policies** allow access to categories/products tables
5. **Test with different user roles** (admin, manager, etc.)

---

## 🆘 Still Not Working?

If after all troubleshooting steps the buttons still don't work:

1. Check browser console for specific error messages
2. Verify network requests in Network tab
3. Test with a different browser
4. Check if other modals (Export, Import) work correctly
5. Verify ProductSearch component is receiving props correctly

---

**Last Updated:** October 6, 2025  
**Status:** Setup Complete - Ready for Testing
