# 🔧 User Management Fix - Complete Guide

## Problem Summary

The user management features (add, edit, delete users) were not working due to a **role mismatch** between the database schema and the application code.

### Root Cause:

- **Database**: Only allowed roles: `admin`, `manager`, `cashier`
- **Application**: Used roles: `admin`, `pharmacist`, `employee`
- **Result**: CREATE/UPDATE operations failed with CHECK constraint violation

---

## ✅ Fixes Applied

### 1. Database Schema Update (`FIX_USER_MANAGEMENT_ROLES.sql`)

**Location**: `database/FIX_USER_MANAGEMENT_ROLES.sql`

**What it does**:

- ✅ Removes old role CHECK constraint
- ✅ Adds new constraint supporting BOTH old and new roles:
  - **New roles**: `admin`, `pharmacist`, `employee`
  - **Legacy roles**: `manager`, `cashier`, `staff`, `super_admin` (for backward compatibility)
- ✅ Creates `user_has_permission()` function for permission checks
- ✅ Provides queries to check role distribution

### 2. Service Layer Fixes

**File**: `src/services/domains/auth/userManagementService.js`

**Changes made**:

- ✅ Fixed all references to `this.ROLES.CASHIER` → `this.ROLES.EMPLOYEE`
- ✅ Fixed all references to `this.ROLES.MANAGER` → `this.ROLES.PHARMACIST`
- ✅ Updated `getRoleLevel()` to support legacy roles
- ✅ Added comprehensive logging to `createUser()` and `updateUser()`
- ✅ Added role validation before database operations
- ✅ Improved error messages with details

### 3. UI Component Fixes

**File**: `src/features/admin/components/UserManagementDashboard.jsx`

**Changes made**:

- ✅ Changed default role from `staff` → `employee`
- ✅ Enhanced error handling in `handleCreateUser()`
- ✅ Enhanced error handling in `handleUpdateUser()`
- ✅ Enhanced error handling in `handleDeleteUser()`
- ✅ Added user-friendly error messages
- ✅ Added success notifications
- ✅ Clear error state after successful operations

---

## 📋 Installation Steps

### Step 1: Run the Database Migration

1. **Open Supabase Dashboard**
2. Go to **SQL Editor**
3. Copy and paste the contents of `database/FIX_USER_MANAGEMENT_ROLES.sql`
4. Click **Run**

**Expected output**:

```
✅ User Management Roles Fixed!
Database now supports both new and legacy role systems
Run the CREATE USER test from the UI to verify everything works
```

### Step 2: Verify the Fix

Run this query in Supabase SQL Editor:

```sql
-- Check constraint was updated
SELECT
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'users_role_check';
```

You should see the new constraint allowing all roles.

### Step 3: Test the Application

The code changes are already applied. Now test the features:

1. **Reload your application** (clear cache if needed: Ctrl+Shift+R)
2. Navigate to **User Management** page
3. Try the following operations:

---

## 🧪 Testing Checklist

### ✅ Test 1: Create New User

1. Click **"Add User"** button
2. Fill in the form:
   - First Name: Test
   - Last Name: User
   - Email: test@medcure.com
   - Password: TestPassword123!
   - Phone: +1234567890
   - Role: Employee
   - Department: Testing
3. Click **"Create User"**

**Expected Result**:

- ✅ User created successfully
- ✅ Alert shows "User created successfully!"
- ✅ New user appears in the table
- ✅ User statistics update

**If it fails**:

- Check browser console (F12) for detailed error logs
- Look for errors starting with `❌ [UserManagement]`
- Common issues:
  - Email already exists → Use different email
  - Database constraint error → Run the migration script again

### ✅ Test 2: Edit Existing User

1. Find a user in the table
2. Click the **Edit (pencil) icon**
3. Change the name or role
4. Click **"Update User"**

**Expected Result**:

- ✅ User updated successfully
- ✅ Alert shows "User updated successfully!"
- ✅ Changes reflected in the table

### ✅ Test 3: Delete User

1. Find a test user in the table
2. Click the **Delete (trash) icon**
3. Confirm deletion (type "DELETE")

**Expected Result**:

- ✅ User deleted successfully
- ✅ Alert shows "User [name] has been permanently deleted"
- ✅ User removed from table
- ✅ User statistics update

### ✅ Test 4: Change User Role

1. Edit a user
2. Change role to:
   - **Admin** (full access)
   - **Pharmacist** (management access)
   - **Employee** (basic access)
3. Save changes

**Expected Result**:

- ✅ Role updated without errors
- ✅ Role badge shows correct color and text

### ✅ Test 5: Search and Filter

1. Use search box to find users
2. Filter by role dropdown
3. Filter by status dropdown

**Expected Result**:

- ✅ Filters work correctly
- ✅ User list updates in real-time

---

## 🎨 Role System Explained

### New 3-Tier Role System

| Role           | Access Level   | Permissions                                                                 |
| -------------- | -------------- | --------------------------------------------------------------------------- |
| **Admin**      | 🔴 Super Admin | ✅ Everything (user management, system settings, all reports)               |
| **Pharmacist** | 🟢 Management  | ✅ Inventory, Sales, Reports, Customers<br>❌ User management               |
| **Employee**   | 🔵 Basic       | ✅ View inventory, Process sales, View customers<br>❌ Management functions |

### Legacy Roles (Backward Compatible)

| Old Role      | Maps To    | Status    |
| ------------- | ---------- | --------- |
| `super_admin` | Admin      | ⚠️ Legacy |
| `manager`     | Pharmacist | ⚠️ Legacy |
| `cashier`     | Employee   | ⚠️ Legacy |
| `staff`       | Employee   | ⚠️ Legacy |

---

## 🐛 Troubleshooting

### Error: "Invalid role selected. Please run the database migration script."

**Solution**: Run `FIX_USER_MANAGEMENT_ROLES.sql` in Supabase

### Error: "A user with this email already exists"

**Solution**: Use a different email or delete the existing user first

### Error: "Failed to create auth user - no user data returned"

**Possible causes**:

1. **Email confirmation required**: Check Supabase → Authentication → Email Templates

   - Disable email confirmation for development:
     - Go to Authentication → Settings
     - Uncheck "Enable email confirmations"

2. **Password too weak**: Use stronger password (8+ chars, mix of letters/numbers)

3. **Supabase auth disabled**: Check Supabase project status

### Users not appearing in table

**Solution**:

1. Click the **Refresh button** (circular arrow icon)
2. Check browser console for errors
3. Verify Supabase connection

### Console shows errors starting with `❌ [UserManagement]`

**Solution**: These are detailed error logs. Read the full error message for specific issues.

---

## 📊 Verification Queries

### Check Current Users and Roles

```sql
SELECT
  id,
  email,
  first_name,
  last_name,
  role,
  is_active,
  last_login,
  created_at
FROM public.users
ORDER BY created_at DESC;
```

### Check Role Distribution

```sql
SELECT
  role,
  COUNT(*) as user_count,
  CASE
    WHEN role IN ('admin', 'pharmacist', 'employee') THEN '✅ New System'
    WHEN role IN ('super_admin', 'manager', 'cashier', 'staff') THEN '⚠️  Legacy'
    ELSE '❌ Unknown'
  END as system_type
FROM public.users
GROUP BY role;
```

### Test Permission Function

```sql
SELECT
  email,
  role,
  user_has_permission(id, 'create_products') as can_create_products,
  user_has_permission(id, 'create_users') as can_manage_users,
  user_has_permission(id, 'process_sales') as can_process_sales
FROM public.users
WHERE is_active = true
ORDER BY role;
```

---

## 🔍 Debug Mode

### Enable Detailed Logging

The fixes include comprehensive console logging. Open browser console (F12) to see:

- `🔧 [UserManagement] Creating user with data:` - User creation start
- `📧 [UserManagement] Creating auth user for:` - Auth signup
- `✅ [UserManagement] Auth user created:` - Auth success
- `💾 [UserManagement] Creating user record in database...` - Database insert
- `✅ [UserManagement] User created successfully:` - Complete success
- `❌ [UserManagement] Error:` - Detailed error information

### Example Console Output (Success):

```
🔧 [UserManagement] Creating user with data: {email: "test@medcure.com", ...}
📧 [UserManagement] Creating auth user for: test@medcure.com
✅ [UserManagement] Auth user created: abc-123-def-456
💾 [UserManagement] Creating user record in database...
✅ [UserManagement] User created successfully: abc-123-def-456
📝 [UserManagementDashboard] Creating user: {email: "test@medcure.com", ...}
✅ [UserManagementDashboard] User created successfully
```

### Example Console Output (Error):

```
❌ [UserManagement] Database insert error: {...}
Error details: {
  message: "duplicate key value violates unique constraint",
  code: "23505",
  hint: "Key (email) already exists"
}
```

---

## 📝 Summary of Changes

### Files Modified:

1. ✅ `database/FIX_USER_MANAGEMENT_ROLES.sql` (NEW)
2. ✅ `src/services/domains/auth/userManagementService.js`
3. ✅ `src/features/admin/components/UserManagementDashboard.jsx`

### Key Improvements:

- ✅ Fixed role system mismatch
- ✅ Added backward compatibility for legacy roles
- ✅ Enhanced error handling and logging
- ✅ Better user feedback (alerts and error messages)
- ✅ Role validation before database operations
- ✅ Permission checking helper function

### Breaking Changes:

- ❌ None! The fix maintains backward compatibility with existing roles

---

## 🎉 What's Working Now

After applying these fixes, you should be able to:

1. ✅ **Create new users** with any role (admin, pharmacist, employee)
2. ✅ **Edit user information** (name, phone, role, department, status)
3. ✅ **Delete users** with double confirmation
4. ✅ **Change user roles** between all available roles
5. ✅ **Reset user passwords** via email
6. ✅ **Search and filter users** by name, email, role, status
7. ✅ **View user statistics** (total, online, roles, recent signups)
8. ✅ **Track online status** (online, recently active, offline, inactive)

---

## 🚀 Next Steps

1. **Run the database migration** (`FIX_USER_MANAGEMENT_ROLES.sql`)
2. **Reload the application** (Ctrl+Shift+R)
3. **Test all features** using the checklist above
4. **Report any remaining issues** with console logs

---

## 💡 Tips

- **Use strong passwords**: At least 8 characters, mix of letters and numbers
- **Employee role is default**: New users start with basic access
- **Admins can do everything**: Only create admin users for trusted personnel
- **Delete is permanent**: There's no "restore" - be careful!
- **Check console for details**: Always check F12 console when something doesn't work

---

**All fixes have been applied!** 🎊

Just run the database migration and you're ready to test! 🚀
