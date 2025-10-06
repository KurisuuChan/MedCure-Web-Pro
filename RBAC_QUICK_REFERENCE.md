# 🎯 RBAC Quick Reference Card

## Role Overview

| Role              | Badge | Permissions                | Typical Users                 |
| ----------------- | ----- | -------------------------- | ----------------------------- |
| 🔴 **ADMIN**      | Red   | **18** - All access        | Christian Santiago (you!)     |
| 🟢 **PHARMACIST** | Green | **13** - Inventory + Sales | Rhealiza Nabong               |
| 🔵 **EMPLOYEE**   | Blue  | **3** - Basic sales        | Charles Vincent, Testing User |

---

## Permission Quick Check

### Can they...?

| Action            | Admin | Pharmacist |    Employee     |
| ----------------- | :---: | :--------: | :-------------: |
| Manage users      |  ✅   |     ❌     |       ❌        |
| Add/edit products |  ✅   |     ✅     |       ❌        |
| Process sales     |  ✅   |     ✅     |       ✅        |
| Handle returns    |  ✅   |     ✅     |       ❌        |
| View reports      |  ✅   |     ✅     | ✅ (sales only) |
| Manage pricing    |  ✅   |     ✅     |       ❌        |
| System settings   |  ✅   |     ❌     |       ❌        |

---

## When to Assign Which Role?

### 👑 ADMIN

**Assign to:** Owner, System Administrator, IT Manager
**Reason:** Full control needed

### 💊 PHARMACIST

**Assign to:** Licensed Pharmacists, Pharmacy Managers
**Reason:** Need to manage inventory and operations

### 👤 EMPLOYEE

**Assign to:** Cashiers, Sales Staff, Pharmacy Assistants
**Reason:** Only need to process sales

---

## Migration Needed?

If you see these OLD roles, run the migration:

- ❌ `cashier` → 🔵 `employee`
- ❌ `staff` → 🔵 `employee`
- ❌ `manager` → 🟢 `pharmacist`
- ❌ `super_admin` → 🔴 `admin`

**Quick Fix SQL:**

```sql
UPDATE users SET role = 'employee' WHERE role IN ('cashier', 'staff');
UPDATE users SET role = 'pharmacist' WHERE role = 'manager';
UPDATE users SET role = 'admin' WHERE role = 'super_admin';
```

---

## Color Coding

### Role Badges:

- 🔴 **Red** = ADMIN (super admin power)
- 🟢 **Green** = PHARMACIST (pharmacist operations)
- 🔵 **Blue** = EMPLOYEE (basic staff)

### Online Status:

- 🟢 **Green** = ONLINE (< 5 min)
- 🟡 **Yellow** = RECENTLY ACTIVE (< 24 hrs)
- ⚫ **Gray** = OFFLINE (> 24 hrs)
- 🔴 **Red** = INACTIVE (disabled)

---

## Permission Counts

| Role       | Permissions | % of Total |
| ---------- | ----------- | ---------- |
| Admin      | 18          | 100%       |
| Pharmacist | 13          | 72%        |
| Employee   | 3           | 17%        |

---

**Updated:** October 6, 2025
**System:** MedCure Pharmacy Management
