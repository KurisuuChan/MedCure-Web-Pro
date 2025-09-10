# MedCure Pro AI Development Context

_Professional Development Edition - September 2025_

## 🎯 **QUICK CONTEXT FOR AI ASSISTANTS**

**Project**: MedCure Pro Pharmacy Management System  
**Stack**: React 19 + Vite + Supabase PostgreSQL + TailwindCSS  
**Status**: 75% complete, requires professional refactoring  
**Development Standards**: GitHub Copilot/Claude compatible (components <200 lines, services <300 lines)

---

## 🚨 **CRITICAL ISSUES TO RESOLVE FIRST (Phase 1)**

### **1. Security Vulnerability** ⚠️

- **Problem**: Production credentials exposed in `.env` and `.env.example`
- **Action**: Remove credentials, create `.env.template` with placeholders
- **Time**: 30 minutes
- **Priority**: Critical

### **2. Database Schema Conflicts** ⚠️

- **Problem**: Duplicate tables causing confusion and broken references
- **Conflicts**:
  - `users` vs `user_profiles` (use `user_profiles` + `auth.users`)
  - `batch_inventory` vs `batches` (use `batches`)
  - Mixed FK references (`public.users(id)` vs `auth.users(id)`)
- **Action**: Consolidate tables, migrate data, fix all FK references
- **Time**: 4-6 hours
- **Priority**: Critical

### **3. Code Quality Issues** ⚠️

- **Problem**: Large files not compatible with AI development
- **Issues**:
  - `InventoryPage.jsx` ~600 lines (should be <200)
  - `dataService.js` ~880 lines (should be <300)
- **Action**: Split into focused components/services
- **Time**: 6-8 hours
- **Priority**: High

---

## 🗃️ **DATABASE USAGE GUIDE**

### **CORRECT Tables to Use** ✅

```sql
user_profiles          -- User data (NOT users table)
batches               -- Batch tracking (NOT batch_inventory)
sales                 -- Transaction records
sale_items            -- Transaction line items
products              -- Product catalog
categories            -- Product categories
audit_log             -- System audit trail
disposal_records      -- Disposal management (ready for UI)
user_preferences      -- Settings (ready for UI connection)
```

### **DEPRECATED Tables to Avoid** ❌

```sql
users                 -- Use user_profiles instead
batch_inventory       -- Use batches instead
```

### **FK Reference Standards**

- **User References**: Always use `user_profiles(id)` or `auth.users(id)`
- **Batch References**: Always use `batches(id)`
- **Never Reference**: `public.users(id)` (deprecated)

---

## 📂 **FILE STRUCTURE GUIDE**

### **Large Files Requiring Refactoring**

```
src/pages/InventoryPage.jsx (600+ lines)
├── Split into: InventoryDashboard.jsx (~150 lines)
├── Split into: ProductTable.jsx (~150 lines)
├── Split into: ProductForm.jsx (~150 lines)
└── Split into: BatchManagement.jsx (~150 lines)

src/services/dataService.js (880+ lines)
├── Split into: ProductService.js (200 lines)
├── Split into: UserService.js (200 lines)
├── Split into: SalesService.js (200 lines)
└── Split into: AnalyticsService.js (200 lines)
```

### **Cleanup Required**

```
DELETE: src/hooks/useRealTimePredictions.js (0 imports)
DELETE: src/hooks/useErrorHandler.js (0 imports)
DELETE: src/services/salesService.js (redundant)
DELETE: src/services/salesServiceFixed.js (outdated)
ARCHIVE: src/data/mock*.js → src/data/dev/
```

---

## 🚀 **READY-TO-IMPLEMENT FEATURES**

### **High Priority** (Database ready, needs UI)

1. **User Preferences Integration** (2-3 hours)

   - Connect `SettingsPage.jsx` to `user_preferences` table
   - Add theme, language, notification preferences

2. **Audit Log Viewer** (3-4 hours)

   - Add audit tab to `UserManagementPage.jsx`
   - Connect to existing `audit_log` table

3. **Batch Management UI** (6-8 hours)
   - Connect to `batches` and `batch_movements` tables
   - Add to inventory management interface

### **Medium Priority** (Full implementation needed)

1. **Disposal Management System** (8-10 hours)

   - Create `DisposalManagementPage.jsx`
   - Connect to `disposal_*` tables workflow

2. **Comprehensive Reporting** (4-5 hours)
   - Create `ReportsPage.jsx`
   - Connect to existing `reportingService.js`

---

## 🎯 **DEVELOPMENT GUIDELINES**

### **When Working on Any Task:**

1. **Ask if unclear**: "Should this component be split further?"
2. **Check file size**: Keep components <200 lines, services <300 lines
3. **Use correct tables**: Always `user_profiles` (not `users`), `batches` (not `batch_inventory`)
4. **Follow patterns**: Use established naming and structure conventions
5. **Handle errors**: Implement proper try-catch and user feedback

### **Common Questions & Quick Answers:**

- **Q**: "Which user table should I use?"  
  **A**: Always `user_profiles` table (linked to `auth.users(id)`)

- **Q**: "Which batch table should I use?"  
  **A**: Always `batches` table (not `batch_inventory`)

- **Q**: "How to handle service errors?"  
  **A**: Return `{ success: false, error: 'message' }` format

- **Q**: "Where to add new pages?"  
  **A**: Create in `src/pages/` and add route to `App.jsx`

### **Code Review Checklist:**

- [ ] Component under 200 lines
- [ ] Service under 300 lines
- [ ] Uses correct database tables
- [ ] Proper error handling implemented
- [ ] Clear, descriptive variable names
- [ ] No hardcoded values
- [ ] Responsive design considered

---

## 📋 **PHASE-BY-PHASE IMPLEMENTATION**

### **Phase 1: Critical Fixes** (Days 1-2)

1. Remove credentials from `.env` files (30 min)
2. Resolve database schema conflicts (4-6 hours)
3. Clean up dead code (2-3 hours)

### **Phase 2: Refactoring** (Days 3-4)

1. Split large components (6-8 hours)
2. Split large services (4-6 hours)

### **Phase 3: Feature Completion** (Days 5-9)

1. High-priority features (2-3 days)
2. Medium-priority features (2 days)

### **Phase 4: Polish** (Days 10-12)

1. Performance optimization (1 day)
2. Testing and documentation (1-2 days)

---

## 🔍 **QUICK VERIFICATION COMMANDS**

### **Check Current State:**

```bash
# Find large components
find src/components -name "*.jsx" -exec wc -l {} + | sort -nr | head -5

# Find large services
find src/services -name "*.js" -exec wc -l {} + | sort -nr | head -5

# Check for credentials
grep -r "VITE_SUPABASE\|supabase" . --include="*.env*"

# Verify build
npm run build
```

### **Database Verification:**

```sql
-- Check user table conflicts
SELECT 'users' as table_name, COUNT(*) FROM users
UNION ALL
SELECT 'user_profiles' as table_name, COUNT(*) FROM user_profiles;

-- Check FK consistency
SELECT table_name, column_name, foreign_table_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu USING (constraint_name)
WHERE constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
ORDER BY table_name;
```

---

_AI Context Version: 2.0_  
_Last Updated: September 2025_  
_Next Review: After Phase 1 Completion_
