# 🎯 MedCure Pro - Modern Loading States Guide

## Why These Are Better

### ❌ Old Approach (Generic Skeletons)

- Gray boxes that don't represent actual content
- No context about what's loading
- Feels slow and disconnected
- Users don't know what to expect

### ✅ New Approach (Progressive & Contextual)

- **Content-Aware**: Shows actual structure of what's loading
- **Branded Icons**: Uses pharmacy-related icons (pills, packages)
- **Progressive Loading**: Shimmer effect shows active loading
- **Better UX**: Users see familiar layout immediately

---

## 📦 Components Overview

### 1. **ProgressiveProductCard** - For Product Grid Loading

```jsx
import { LoadingInventoryGrid } from "../components/ui/loading/PharmacyLoadingStates";

{
  loading ? (
    <LoadingInventoryGrid count={8} />
  ) : (
    <ProductGrid products={products} />
  );
}
```

**When to use:**

- Inventory page (grid view)
- Product catalog
- Search results

---

### 2. **ProgressiveTableRow** - For Table Loading

```jsx
import { LoadingTransactionTable } from "../components/ui/loading/PharmacyLoadingStates";

{
  loading ? (
    <LoadingTransactionTable rows={10} />
  ) : (
    <TransactionTable data={transactions} />
  );
}
```

**When to use:**

- Transaction history
- Inventory list (table view)
- Reports tables

---

### 3. **LoadingState** - Centered Loading Indicator

```jsx
import { LoadingState } from "../components/ui/loading/PharmacyLoadingStates";

{
  loading && (
    <LoadingState message="Loading products..." icon={Package} size="default" />
  );
}
```

**Props:**

- `message`: Text to display (default: "Loading...")
- `icon`: Lucide icon component (default: Package)
- `size`: "small" | "default" | "large"

**When to use:**

- Initial page load
- Full-screen loading
- Modal content loading

---

### 4. **InlineLoader** - For Buttons & Small Actions

```jsx
import { InlineLoader } from "../components/ui/loading/PharmacyLoadingStates";

<button disabled={loading}>
  {loading ? <InlineLoader text="Saving" size="sm" /> : "Save Product"}
</button>;
```

**When to use:**

- Button loading states
- Inline form submissions
- Quick actions

---

### 5. **ProgressBar** - For Upload/Export Operations

```jsx
import { ProgressBar } from "../components/ui/loading/PharmacyLoadingStates";

<ProgressBar
  progress={uploadProgress}
  label="Importing products"
  showPercentage={true}
/>;
```

**When to use:**

- CSV imports
- Bulk operations
- PDF generation
- File uploads

---

### 6. **StepIndicator** - For Multi-Step Processes

```jsx
import { StepIndicator } from "../components/ui/loading/PharmacyLoadingStates";

<StepIndicator
  steps={["Upload File", "Validate Data", "Import Products"]}
  currentStep={currentStep}
  loading={isProcessing}
/>;
```

**When to use:**

- CSV import wizard
- Product creation wizard
- Multi-step forms

---

### 7. **EmptyState** - When No Data Exists

```jsx
import { EmptyState } from "../components/ui/loading/PharmacyLoadingStates";

{
  products.length === 0 && (
    <EmptyState
      icon={Package}
      title="No products found"
      description="Add your first product to get started"
      action={
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Add Product
        </button>
      }
    />
  );
}
```

**When to use:**

- Empty inventory
- No search results
- No transactions
- Empty categories

---

### 8. **SmartLoader** - All-in-One Wrapper

```jsx
import { SmartLoader } from "../components/ui/loading/PharmacyLoadingStates";

<SmartLoader
  loading={loading}
  error={error}
  empty={products.length === 0}
  emptyState={{
    icon: Package,
    title: "No products yet",
    description: "Start by adding your first product",
  }}
  loadingComponent={<LoadingInventoryGrid count={8} />}
>
  <ProductGrid products={products} />
</SmartLoader>;
```

**Automatically handles:**

- Loading state
- Error state
- Empty state
- Success state (shows children)

---

## 🎨 Dashboard Loading Example

```jsx
import { LoadingDashboardStats } from "../components/ui/loading/PharmacyLoadingStates";

function Dashboard() {
  const { loading, stats } = useDashboardData();

  return (
    <div>
      {loading ? <LoadingDashboardStats /> : <StatsGrid stats={stats} />}
    </div>
  );
}
```

---

## 🔄 Migration Guide

### Before (Old Skeleton)

```jsx
import { TableSkeleton } from "../components/ui/loading/SkeletonLoader";

{
  loading && <TableSkeleton rows={5} columns={4} />;
}
```

### After (New Loading State)

```jsx
import { LoadingTransactionTable } from "../components/ui/loading/PharmacyLoadingStates";

{
  loading && <LoadingTransactionTable rows={5} />;
}
```

---

## 📊 Recommended Usage by Page

| Page                    | Loading Component                       |
| ----------------------- | --------------------------------------- |
| **Dashboard**           | `LoadingDashboardStats`                 |
| **Inventory (Grid)**    | `LoadingInventoryGrid`                  |
| **Inventory (Table)**   | `LoadingTransactionTable`               |
| **Transaction History** | `LoadingTransactionTable`               |
| **POS**                 | `LoadingState` with `ShoppingCart` icon |
| **Analytics**           | `LoadingDashboardStats` + charts        |
| **Product Details**     | `LoadingState` with `Package` icon      |

---

## 🎯 Best Practices

### ✅ DO:

- Use content-aware loaders that match your UI
- Show progress for long operations
- Use inline loaders for button actions
- Provide empty states with helpful actions
- Match icon to context (Package, Pill, ShoppingCart)

### ❌ DON'T:

- Use generic gray boxes
- Show "Loading..." without context
- Block entire screen for small actions
- Leave users guessing what's happening
- Use skeletons for quick operations (<200ms)

---

## 🚀 Quick Start

1. **Replace all generic skeletons:**

```bash
# Find all skeleton usage
grep -r "TableSkeleton\|CardSkeleton" src/
```

2. **Update imports:**

```jsx
// Old
import { TableSkeleton } from "./loading/SkeletonLoader";

// New
import { LoadingTransactionTable } from "./loading/PharmacyLoadingStates";
```

3. **Use SmartLoader for simple cases:**

```jsx
<SmartLoader loading={loading} error={error} empty={!data.length}>
  {/* Your content */}
</SmartLoader>
```

---

## 🎨 Customization

All components support Tailwind classes for customization:

```jsx
<EmptyState
  className="bg-gray-50 rounded-lg p-8"
  icon={Package}
  title="Custom title"
/>
```

---

## 📱 Responsive Behavior

All loading states are fully responsive:

- Cards adjust grid columns automatically
- Tables scroll horizontally on mobile
- Text sizes scale appropriately

---

## ⚡ Performance Tips

1. **Debounce fast data:**

```jsx
const debouncedLoading = loading && searchTerm.length > 2;
```

2. **Show optimistic updates:**

```jsx
// Add item immediately, show loader only on save
```

3. **Cache loaded data:**

```jsx
// Use React Query or SWR to cache and reduce loading states
```

---

## 🔧 Animation Customization

Update `tailwind.config.js` for custom animations:

```js
animation: {
  shimmer: 'shimmer 2s infinite',
},
keyframes: {
  shimmer: {
    '100%': { transform: 'translateX(100%)' },
  },
}
```

---

## 📞 Support

Need help? Check:

- Component source: `src/components/ui/loading/PharmacyLoadingStates.jsx`
- Examples in action: Dashboard, Inventory, Transactions
- Team documentation: UI/UX guide
