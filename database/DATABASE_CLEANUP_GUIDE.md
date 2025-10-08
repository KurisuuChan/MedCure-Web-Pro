# 🧹 Database & Code Cleanup Guide

**Complete cleanup of duplicate and unused tables + old notification system files**

---

## 📋 Summary

Your project has **duplicate tables** and **old notification system files** that need to be removed:

### **Database Issues:**

- ❌ **Duplicate user tables**: `user_profiles`, `user_roles`, `user_permissions`, etc.
- ❌ **Duplicate batch tables**: `batch_inventory`, `product_batches` (using `batches` instead)
- ❌ **Unused tables**: `audit_log`, `login_attempts`, `password_reset_tokens`, etc.
- ✅ **Keep**: `user_notifications` (your new database-backed notification system)

### **Code Issues:**

- ❌ **Old notification files**: `NotificationSystem.js` (localStorage-based)
- ❌ **Old migration file**: `NotificationMigration.js`
- ❌ **Old UI component**: `NotificationDropdownV2.jsx`
- ✅ **Keep**: New notification system in `src/services/notifications/`

---

## 🎯 What Will Be Removed

### **Database Tables to Delete:**

#### **1. Duplicate User Management (7 tables)**

```
❌ user_profiles         → Using 'users' table instead
❌ user_roles           → Using 'users.role' column instead
❌ user_permissions     → Not implemented yet
❌ user_preferences     → Not implemented yet
❌ user_sessions        → Not tracking sessions
❌ password_reset_tokens → Handled by Supabase Auth
❌ login_attempts       → Not tracking attempts
```

#### **2. Duplicate Batch Tracking (3 tables)**

```
❌ batch_inventory      → Using 'batches' table
❌ product_batches      → Using 'batches' table
❌ expired_products_clearance → Using 'disposal_records'
```

#### **3. Unused Audit System (1 table)**

```
❌ audit_log           → Not implemented
```

### **Files to Delete:**

```
❌ src/services/NotificationSystem.js
❌ src/services/NotificationMigration.js
❌ src/components/layout/NotificationDropdownV2.jsx
```

---

## ✅ What Will Be Kept

### **Active Database Tables (18 tables)**

#### **Core Tables:**

- ✅ `users` - User accounts with role column
- ✅ `products` - Product catalog
- ✅ `categories` - Product categories
- ✅ `batches` - Single batch tracking table
- ✅ `sales` - Transaction records
- ✅ `sale_items` - Transaction line items
- ✅ `customers` - Customer information
- ✅ `suppliers` - Supplier information

#### **Inventory Management:**

- ✅ `stock_movements` - Stock change history
- ✅ `inventory_logs` - Inventory audit trail

#### **Disposal System:**

- ✅ `disposal_records` - Disposal documentation
- ✅ `disposal_items` - Items being disposed
- ✅ `disposal_approvals` - Approval workflow

#### **Purchasing:**

- ✅ `purchase_orders` - Purchase order management
- ✅ `purchase_order_items` - PO line items
- ✅ `product_suppliers` - Product-supplier relationships

#### **Notifications:**

- ✅ `user_notifications` - **NEW** Database-backed notifications

#### **Settings:**

- ✅ `system_settings` - Application configuration

---

## 🚀 Step-by-Step Cleanup

### **Step 1: Backup Database** ⚠️ **CRITICAL**

1. Open Supabase Dashboard
2. Go to **Settings** → **Database** → **Backups**
3. Click **"Create Backup"**
4. Wait for confirmation
5. **Download backup** to your computer

### **Step 2: Run Database Cleanup**

1. Open **Supabase SQL Editor**
2. Open file: `database/migrations/cleanup_duplicates_and_unused_tables.sql`
3. Copy entire content
4. Paste into SQL Editor
5. Review the script (see what it does)
6. Click **"Run"** ▶️
7. Check for success messages

**Expected Output:**

```sql
✅ Reconnected user_notifications to users table
🗑️  Dropped: user_sessions (not used)
🗑️  Dropped: user_preferences (not used)
🗑️  Dropped: user_permissions (not used)
... (10 more tables)
✅ Updated foreign keys to reference correct tables
📊 Database cleanup complete!
📋 Remaining tables: 18
🎉 Your database is now clean and optimized!
```

### **Step 3: Delete Old Notification Files**

**Option A: Using File Explorer**

1. Navigate to `src/services/`
2. Delete: `NotificationSystem.js`
3. Delete: `NotificationMigration.js`
4. Navigate to `src/components/layout/`
5. Delete: `NotificationDropdownV2.jsx`

**Option B: Using Terminal (PowerShell)**

```powershell
cd "C:\Users\Christian\Downloads\FINALLLLL\CAPSTONE\medcure-pharmacy\MedCure-Pro"
Remove-Item "src\services\NotificationSystem.js"
Remove-Item "src\services\NotificationMigration.js"
Remove-Item "src\components\layout\NotificationDropdownV2.jsx"
```

**Option C: Using Command Prompt**

```cmd
cd "C:\Users\Christian\Downloads\FINALLLLL\CAPSTONE\medcure-pharmacy\MedCure-Pro"
del "src\services\NotificationSystem.js"
del "src\services\NotificationMigration.js"
del "src\components\layout\NotificationDropdownV2.jsx"
```

### **Step 4: Verify Cleanup**

**Database Verification:**

```sql
-- Check remaining tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Should show exactly 18 tables
```

**Code Verification:**

1. Search project for old imports:
   - Search: `NotificationSystem.js`
   - Search: `NotificationMigration.js`
   - Search: `NotificationDropdownV2`
2. Should find **0 results** (already fixed in Header.jsx and App.jsx)

### **Step 5: Test Everything**

1. **Refresh browser** (Ctrl+Shift+R)
2. **Check for errors** in console (should be none)
3. **Test notifications**:
   - Click bell icon in header
   - Should open dropdown panel
   - Should show existing notifications
4. **Test POS transaction**:
   - Create a sale
   - Check for "cart is not defined" error (should be fixed)
5. **Test inventory archive**:
   - Archive a product
   - Should track user who archived it

---

## 📊 Before vs After

### **Before Cleanup:**

**Database:**

- 28 tables (10 duplicates, 11 unused)
- Confusing structure
- Multiple notification systems
- Duplicate batch tracking

**Code:**

- 2 notification systems (localStorage + database)
- 3 notification components
- Import errors
- Duplicated logic

### **After Cleanup:**

**Database:**

- ✅ 18 tables (all active and used)
- ✅ Clear structure
- ✅ Single notification system
- ✅ Single batch tracking

**Code:**

- ✅ 1 notification system (database-backed)
- ✅ 2 notification components (Bell + Panel)
- ✅ No import errors
- ✅ Clean architecture

---

## 🔍 Verification Checklist

After cleanup, verify these work:

### **Notifications:**

- [ ] Bell icon appears in header
- [ ] Click bell → opens dropdown
- [ ] Notifications display correctly
- [ ] Mark as read works
- [ ] Dismiss works
- [ ] Real-time updates work
- [ ] No console errors

### **POS System:**

- [ ] Add products to cart
- [ ] Complete transaction
- [ ] Receipt generated
- [ ] No "cart is not defined" error
- [ ] Sale notification appears

### **Inventory:**

- [ ] Archive product
- [ ] User tracked correctly
- [ ] Unarchive product
- [ ] Stock movements work

### **Database:**

- [ ] No foreign key errors
- [ ] All queries work
- [ ] RLS policies functional
- [ ] No orphaned data

---

## 🆘 Rollback (If Something Goes Wrong)

### **Database Rollback:**

**Option 1: If you ran the script in a transaction (default):**

```sql
ROLLBACK;
```

**Option 2: Restore from backup:**

1. Go to Supabase Dashboard
2. Settings → Database → Backups
3. Select backup from before cleanup
4. Click **"Restore"**
5. Confirm restoration

### **Code Rollback:**

**Git restore (if using Git):**

```bash
git checkout HEAD -- src/services/NotificationSystem.js
git checkout HEAD -- src/services/NotificationMigration.js
git checkout HEAD -- src/components/layout/NotificationDropdownV2.jsx
```

**Manual restore:**

- Look in VS Code's **Local History**
- Or re-download from your backup

---

## 🎓 What You Learned

### **Database Design:**

- ✅ Avoid duplicate tables
- ✅ Use foreign keys properly
- ✅ Keep one source of truth
- ✅ Remove unused tables regularly

### **Code Architecture:**

- ✅ Don't maintain multiple systems for same feature
- ✅ Migrate old code to new system completely
- ✅ Clean up after refactoring
- ✅ Use singleton pattern for services

---

## 📈 Benefits of Cleanup

### **Performance:**

- ⚡ Faster queries (fewer tables to scan)
- ⚡ Smaller database size
- ⚡ Cleaner indexes

### **Maintainability:**

- 🧹 Clearer codebase
- 🧹 Easier to understand
- 🧹 Fewer bugs
- 🧹 Faster development

### **Reliability:**

- 🛡️ Single source of truth
- 🛡️ No data conflicts
- 🛡️ Better data integrity
- 🛡️ Simpler debugging

---

## 🎉 Completion

Once you've completed all steps:

✅ **Database is clean** (18 active tables)  
✅ **Code is clean** (no old notification files)  
✅ **System works** (all tests pass)  
✅ **Performance improved**  
✅ **Ready for production**

**Your MedCure Pharmacy system is now optimized and production-ready!** 🚀

---

## 📞 Support

If you encounter issues:

1. **Check console** for error messages
2. **Review logs** in browser DevTools
3. **Restore from backup** if needed
4. **Re-run notification migration** if needed
5. **Check this guide** for troubleshooting

---

**Created:** October 5, 2025  
**Version:** 1.0.0  
**For:** MedCure Pharmacy Pro
