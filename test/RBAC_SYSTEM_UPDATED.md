# ✅ Role-Based Access Control (RBAC) System - Updated

## 🎯 Simplified 3-Tier Role Structure

Your MedCure pharmacy system now uses a clean, simple 3-role hierarchy:

| Role           | Display Name | Description                                           | Access Level |
| -------------- | ------------ | ----------------------------------------------------- | ------------ |
| **admin**      | ADMIN        | Super administrator with full system access           | 🔴 Highest   |
| **pharmacist** | PHARMACIST   | Licensed pharmacist with inventory & sales management | 🟢 Medium    |
| **employee**   | EMPLOYEE     | Basic employee with sales and view access             | 🔵 Basic     |

---

## 🔐 Role Permissions Matrix

### ADMIN (Super Administrator)

**Badge Color:** 🔴 Red (`bg-red-100 text-red-800`)

**Full System Access:**

- ✅ All User Management permissions
- ✅ All Inventory Management permissions
- ✅ All Sales & POS permissions
- ✅ All Financial permissions
- ✅ All System Administration permissions

**Specific Permissions:**

```javascript
[
  // User Management
  "create_users",
  "edit_users",
  "delete_users",
  "view_users",
  "manage_roles",

  // Inventory Management
  "create_products",
  "edit_products",
  "delete_products",
  "view_inventory",
  "manage_stock",

  // Sales & POS
  "process_sales",
  "handle_returns",
  "void_transactions",
  "view_sales_reports",
  "manage_discounts",

  // Financial
  "view_financial_reports",
  "manage_pricing",
  "view_profit_margins",

  // System Administration
  "manage_settings",
  "view_audit_logs",
];
```

**Can Do:**

- ✅ Create, edit, delete users
- ✅ Manage all roles and permissions
- ✅ Full inventory control (add, edit, delete products)
- ✅ Manage stock levels and pricing
- ✅ Process sales, returns, void transactions
- ✅ View all financial reports and profit margins
- ✅ Manage system settings
- ✅ View audit logs and system activity

---

### PHARMACIST

**Badge Color:** 🟢 Green (`bg-green-100 text-green-800`)

**Inventory & Sales Management Access:**

- ✅ View users (cannot create/edit/delete)
- ✅ Full inventory management
- ✅ Full sales operations
- ✅ Financial reporting (view only)
- ❌ No system administration access

**Specific Permissions:**

```javascript
[
  // User Management (View Only)
  "view_users",

  // Inventory Management (Full Access)
  "create_products",
  "edit_products",
  "delete_products",
  "view_inventory",
  "manage_stock",

  // Sales & POS (Full Access)
  "process_sales",
  "handle_returns",
  "void_transactions",
  "view_sales_reports",
  "manage_discounts",

  // Financial (View & Pricing)
  "view_financial_reports",
  "manage_pricing",
];
```

**Can Do:**

- ✅ View user list (cannot modify users)
- ✅ Add new products to inventory
- ✅ Edit product details (name, price, stock)
- ✅ Delete products from inventory
- ✅ Manage stock levels (add/remove inventory)
- ✅ Process sales transactions
- ✅ Handle customer returns
- ✅ Void incorrect transactions
- ✅ Apply discounts to sales
- ✅ View sales reports
- ✅ View financial reports
- ✅ Update product pricing

**Cannot Do:**

- ❌ Create, edit, or delete users
- ❌ Change user roles
- ❌ Manage system settings
- ❌ View audit logs
- ❌ View profit margins (admin only)

---

### EMPLOYEE

**Badge Color:** 🔵 Blue (`bg-blue-100 text-blue-800`)

**Basic Sales & View Access:**

- ✅ View inventory
- ✅ Process sales transactions
- ✅ View sales reports
- ❌ No inventory management
- ❌ No user management
- ❌ No financial access

**Specific Permissions:**

```javascript
[
  // Inventory (View Only)
  "view_inventory",

  // Sales & POS (Basic Sales)
  "process_sales",
  "view_sales_reports",
];
```

**Can Do:**

- ✅ View product catalog and inventory levels
- ✅ Process sales transactions (checkout)
- ✅ View sales reports

**Cannot Do:**

- ❌ Add, edit, or delete products
- ❌ Manage stock levels
- ❌ Handle returns or void transactions
- ❌ Apply discounts
- ❌ View financial reports
- ❌ Manage pricing
- ❌ View or manage users
- ❌ Access system settings

---

## 🔄 What Changed from Previous System

### Removed Roles:

- ❌ `super_admin` - Consolidated into `admin`
- ❌ `manager` - Functionality moved to `pharmacist`
- ❌ `cashier` - Renamed to `employee` for clarity
- ❌ `staff` - Consolidated into `employee`

### Role Mapping (Old → New):

```
super_admin → admin (keeps all permissions)
admin       → admin (now has full permissions)
manager     → pharmacist (pharmacy-specific role)
pharmacist  → pharmacist (enhanced permissions)
cashier     → employee (basic sales access)
staff       → employee (basic sales access)
```

---

## 💻 Technical Implementation

### Backend (`userManagementService.js`)

#### Role Constants:

```javascript
static ROLES = {
  ADMIN: "admin",        // Super admin with full access
  PHARMACIST: "pharmacist", // Pharmacist with inventory and sales access
  EMPLOYEE: "employee",     // Employee with basic access
};
```

#### Permission Mapping:

```javascript
static ROLE_PERMISSIONS = {
  // ADMIN: Full system access (super admin)
  [this.ROLES.ADMIN]: Object.values(this.PERMISSIONS),

  // PHARMACIST: Inventory, sales, and reporting access
  [this.ROLES.PHARMACIST]: [
    this.PERMISSIONS.VIEW_USERS,
    this.PERMISSIONS.CREATE_PRODUCTS,
    this.PERMISSIONS.EDIT_PRODUCTS,
    this.PERMISSIONS.DELETE_PRODUCTS,
    this.PERMISSIONS.VIEW_INVENTORY,
    this.PERMISSIONS.MANAGE_STOCK,
    this.PERMISSIONS.PROCESS_SALES,
    this.PERMISSIONS.HANDLE_RETURNS,
    this.PERMISSIONS.VOID_TRANSACTIONS,
    this.PERMISSIONS.VIEW_SALES_REPORTS,
    this.PERMISSIONS.MANAGE_DISCOUNTS,
    this.PERMISSIONS.VIEW_FINANCIAL_REPORTS,
    this.PERMISSIONS.MANAGE_PRICING,
  ],

  // EMPLOYEE: Basic sales and inventory view only
  [this.ROLES.EMPLOYEE]: [
    this.PERMISSIONS.VIEW_INVENTORY,
    this.PERMISSIONS.PROCESS_SALES,
    this.PERMISSIONS.VIEW_SALES_REPORTS,
  ],
};
```

### Frontend (`UserManagementDashboard.jsx`)

#### Role Color Coding:

```javascript
const getRoleColor = (role) => {
  const colors = {
    admin: "bg-red-100 text-red-800", // Super admin
    pharmacist: "bg-green-100 text-green-800",
    employee: "bg-blue-100 text-blue-800",
  };
  return colors[role] || "bg-gray-100 text-gray-800";
};
```

#### Dynamic Role Dropdowns:

- **Create User Modal:** Automatically populated from `UserManagementService.ROLES`
- **Edit User Modal:** Automatically populated from `UserManagementService.ROLES`
- **Filter Dropdown:** Automatically populated from `UserManagementService.ROLES`

---

## 🎨 UI Display

### User Table - Role Column

| User               | Role Badge        |
| ------------------ | ----------------- |
| Christian Santiago | 🔴 **ADMIN**      |
| Rhealiza Nabong    | 🟢 **PHARMACIST** |
| Charles Vincent    | 🔵 **EMPLOYEE**   |

### Create/Edit User - Role Dropdown

```
Role: [Select Role ▼]
  ├─ ADMIN
  ├─ PHARMACIST
  └─ EMPLOYEE
```

### Filter Dropdown

```
All Roles ▼
  ├─ All Roles
  ├─ ADMIN
  ├─ PHARMACIST
  └─ EMPLOYEE
```

---

## 🔒 Permission Enforcement

### How to Check Permissions in Code:

```javascript
import { UserManagementService } from "./services/domains/auth/userManagementService";

// Get user permissions
const userRole = user.role; // "admin", "pharmacist", or "employee"
const permissions = UserManagementService.getUserPermissions(userRole);

// Check if user has specific permission
const canDeleteUsers = permissions.includes(
  UserManagementService.PERMISSIONS.DELETE_USERS
);
const canManageStock = permissions.includes(
  UserManagementService.PERMISSIONS.MANAGE_STOCK
);
const canProcessSales = permissions.includes(
  UserManagementService.PERMISSIONS.PROCESS_SALES
);

// Conditional rendering
{
  canDeleteUsers && <button onClick={handleDeleteUser}>Delete User</button>;
}
```

### Route Protection Examples:

```javascript
// Admin-only routes
if (user.role !== UserManagementService.ROLES.ADMIN) {
  return <Navigate to="/dashboard" />;
}

// Pharmacist or Admin routes
const allowedRoles = [
  UserManagementService.ROLES.ADMIN,
  UserManagementService.ROLES.PHARMACIST,
];
if (!allowedRoles.includes(user.role)) {
  return <Navigate to="/dashboard" />;
}

// Employee can access sales
const canAccessSales = permissions.includes(
  UserManagementService.PERMISSIONS.PROCESS_SALES
);
```

---

## 📊 Permission Summary Table

| Feature                   | Admin | Pharmacist | Employee |
| ------------------------- | ----- | ---------- | -------- |
| **User Management**       |
| View Users                | ✅    | ✅         | ❌       |
| Create Users              | ✅    | ❌         | ❌       |
| Edit Users                | ✅    | ❌         | ❌       |
| Delete Users              | ✅    | ❌         | ❌       |
| Manage Roles              | ✅    | ❌         | ❌       |
| **Inventory Management**  |
| View Inventory            | ✅    | ✅         | ✅       |
| Create Products           | ✅    | ✅         | ❌       |
| Edit Products             | ✅    | ✅         | ❌       |
| Delete Products           | ✅    | ✅         | ❌       |
| Manage Stock              | ✅    | ✅         | ❌       |
| **Sales & POS**           |
| Process Sales             | ✅    | ✅         | ✅       |
| Handle Returns            | ✅    | ✅         | ❌       |
| Void Transactions         | ✅    | ✅         | ❌       |
| View Sales Reports        | ✅    | ✅         | ✅       |
| Manage Discounts          | ✅    | ✅         | ❌       |
| **Financial**             |
| View Financial Reports    | ✅    | ✅         | ❌       |
| Manage Pricing            | ✅    | ✅         | ❌       |
| View Profit Margins       | ✅    | ❌         | ❌       |
| **System Administration** |
| Manage Settings           | ✅    | ❌         | ❌       |
| View Audit Logs           | ✅    | ❌         | ❌       |

---

## 🧪 Testing the RBAC System

### Test as ADMIN:

1. Login as Christian Santiago (admin)
2. ✅ Can access User Management
3. ✅ Can create new users
4. ✅ Can edit/delete users
5. ✅ Can access all inventory features
6. ✅ Can view financial reports
7. ✅ Can manage system settings

### Test as PHARMACIST:

1. Login as Rhealiza Nabong (pharmacist)
2. ✅ Can view user list (read-only)
3. ❌ Cannot create/edit/delete users
4. ✅ Can add/edit/delete products
5. ✅ Can manage stock levels
6. ✅ Can process sales and returns
7. ✅ Can view financial reports
8. ❌ Cannot access system settings

### Test as EMPLOYEE:

1. Login as Charles Vincent (employee)
2. ❌ Cannot access User Management
3. ✅ Can view inventory
4. ❌ Cannot edit inventory
5. ✅ Can process sales
6. ✅ Can view sales reports
7. ❌ Cannot handle returns or void transactions
8. ❌ Cannot view financial reports

---

## 🔄 Migration Guide

### Updating Existing Users:

If you have existing users with old roles, update them:

```sql
-- Update super_admin to admin
UPDATE users SET role = 'admin' WHERE role = 'super_admin';

-- Update manager to pharmacist
UPDATE users SET role = 'pharmacist' WHERE role = 'manager';

-- Update cashier to employee
UPDATE users SET role = 'employee' WHERE role = 'cashier';

-- Update staff to employee
UPDATE users SET role = 'employee' WHERE role = 'staff';
```

### Verify Changes:

```sql
-- Check all roles in database
SELECT role, COUNT(*) as count
FROM users
GROUP BY role;

-- Expected result:
-- admin       | 1
-- pharmacist  | X
-- employee    | Y
```

---

## ✨ Benefits of Simplified RBAC

### Before (6 roles):

- ❌ Confusing overlap between roles
- ❌ Unclear permission boundaries
- ❌ Difficult to maintain
- ❌ Over-complicated for pharmacy needs

### After (3 roles):

- ✅ Clear role hierarchy
- ✅ Easy to understand permissions
- ✅ Simple to maintain and extend
- ✅ Perfectly suited for pharmacy operations
- ✅ No redundant roles

---

## 📝 Summary

**Your RBAC system is now:**

1. ✅ **Simplified** - Only 3 roles instead of 6
2. ✅ **Clear** - Each role has distinct, well-defined permissions
3. ✅ **Accurate** - Matches your actual pharmacy workflow
4. ✅ **Maintainable** - Easy to update and extend
5. ✅ **Professional** - Industry-standard 3-tier hierarchy

**Role Hierarchy:**

```
🔴 ADMIN (Super Admin)
    ↓ Full system control
🟢 PHARMACIST
    ↓ Inventory & sales management
🔵 EMPLOYEE
    ↓ Basic sales operations
```

**All existing features continue to work - role names updated automatically throughout the system!** 🎉
