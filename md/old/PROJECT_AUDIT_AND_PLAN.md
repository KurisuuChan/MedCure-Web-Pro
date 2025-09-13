# PROFESSIONAL DEVELOPMENT PLAN - MedCure Pro

## 📊 Executive Summary

MedCure-Web-Pro is a React 19 + Vite pharmacy management system with Supabase PostgreSQL backend and enterprise service architecture. The system has **strong foundations** with completed **enterprise service organization**, **build optimization**, and **professional code structure**. Current status: **85% complete** with completed enterprise architecture and remaining feature integration tasks.

**Key Principle**: Maintain enterprise-grade code structure with components <200 lines, domain-organized services, and optimized build system.

## ✅ Recently Completed (Build on This Success)

### **Enterprise Service Architecture** ✅ COMPLETED
- **Domain Organization**: Services organized into `domains/` structure
  - `domains/auth/` - Authentication and user management
  - `domains/sales/` - Transaction and POS operations  
  - `domains/inventory/` - Product and stock management
  - `domains/analytics/` - Reporting and business intelligence
  - `domains/notifications/` - System alerts and messaging
  - `domains/infrastructure/` - Core system services
- **Professional Standards**: All services follow single responsibility principle
- **Import System**: Static imports implemented, dynamic import warnings eliminated

### **Build System Optimization** ✅ COMPLETED  
- **Bundle Size Reduction**: 97% reduction (1,629KB → 30KB main bundle)
- **Code Splitting**: Manual chunks implemented
  - `vendor-react` (249KB), `vendor-supabase` (122KB)
  - `app-services` (81KB), `app-components` (87KB)
  - `app-pages` (97KB), `app-features` (123KB)
- **Warning Elimination**: All build warnings resolved

## ✅ Production-Ready Components

- **Authentication System**: Complete auth flow with role-based access using enterprise authService
- **POS Transaction Engine**: Professional transaction processing with `domains/sales/transactionService.js`
- **Inventory Management**: Enhanced stock management through `domains/inventory/` services
- **Dashboard Analytics**: Real-time metrics via optimized `domains/analytics/reportingService.js`
- **User Administration**: Comprehensive user management with `domains/auth/userManagementService.js`
- **Database Schema**: Complete 12-table structure aligned with COMPLETE_MEDCURE_MIGRATION.sql
- **Enterprise Architecture**: Domain-driven service organization for scalability
- **Build Optimization**: Production-ready with code splitting and optimized bundles

## 🚨 Current Priority Tasks (Build on Success)

### 1. **Schema-Service Alignment** - Ensure all services use current schema

- **Issue**: Services may reference outdated table structures
- **Action**: Verify all domain services align with COMPLETE_MEDCURE_MIGRATION.sql
- **Time**: 2-3 hours
- **Files**: All services in `src/services/domains/`

### 2. **Missing Service Methods** - Complete enterprise service coverage

- **Issue**: Some advanced features need service method implementation
- **Action**: Add missing methods identified in recent service calls
- **Time**: 3-4 hours
- **Priority**: Complete `getCategoryInsights`, `getUserStatistics`, `getActiveSessions`

### 3. **UI-Service Integration** - Connect frontend to enterprise services

- **Issue**: Some UI components may still use old import paths
- **Action**: Update all imports to use `domains/` service structure
- **Time**: 2-3 hours
- **Priority**: Update pages and components to use new service architecture

## 🎯 UPDATED DATABASE SCHEMA REFERENCE

### **Current Schema Status** ✅
- **Source of Truth**: `database/COMPLETE_MEDCURE_MIGRATION.sql`
- **Core Tables**: 12 optimized tables for pharmacy operations
- **Business Functions**: 4 professional transaction management functions
- **Performance**: Indexed for production workloads

### **Table Structure (Aligned with Current Schema)**

#### **Core Business Tables**
```sql
users                 -- Core user authentication and roles
categories           -- Product categorization with analytics
products             -- Complete medicine inventory 
sales                -- Transaction records with edit/undo support
sale_items           -- Transaction line items
stock_movements      -- Complete inventory audit trail
audit_log           -- System audit for compliance
notifications       -- User notification system
```

#### **Professional Transaction Functions** 
```sql
create_sale_with_items()              -- Creates pending transaction
complete_transaction_with_stock()     -- Finalizes with stock deduction  
edit_transaction_with_stock_management() -- Professional edit workflow
undo_transaction_completely()         -- Complete reversal with audit
```

### **Schema Alignment Priority**
1. ✅ **Verify Services Use Current Tables** - Check all domain services reference correct schema
2. ✅ **Validate Function Calls** - Ensure all transaction functions work as expected  
3. ✅ **Update RLS Policies** - Row Level Security aligned with current user model
4. ✅ **Performance Verification** - Confirm indexes support enterprise load

## � Code Quality & Professional Standards

### **File Size Guidelines** (GitHub Copilot/Claude Friendly)

- **Components**: Maximum 200 lines (current: InventoryPage.jsx ~600 lines)
- **Services**: Maximum 300 lines (current: dataService.js ~880 lines)
- **Hooks**: Maximum 100 lines
- **Utilities**: Maximum 150 lines

### **Current Violations Requiring Refactoring**

1. **`src/pages/InventoryPage.jsx`** - 600+ lines → Split into 4 focused components
2. **`src/services/dataService.js`** - 880+ lines → Split into domain services
3. **`src/components/ui/TransactionEditor.jsx`** - 500+ lines → Extract subcomponents

### **Professional Development Rules**

- ✅ Single Responsibility Principle per file
- ✅ Clear, descriptive function names
- ✅ Consistent error handling patterns
- ✅ Proper TypeScript usage (if applicable)
- ✅ Component composition over large monoliths

## � Next Development Priorities (Building on Success)

### **Phase 1: Service-Schema Validation** (Days 1-2) 🔍

_Ensure enterprise services align with current database schema_

#### **Task 1.1: Schema Alignment Verification** (2-3 hours)
- Verify all `domains/` services use tables from COMPLETE_MEDCURE_MIGRATION.sql
- Update any references to deprecated table structures
- Test all service methods against current schema

#### **Task 1.2: Service Method Completion** (3-4 hours)  
- Complete missing methods in enterprise services
- Add `getCategoryInsights()` to smartCategoryService.js
- Add `getUserStatistics()` and `getActiveSessions()` to userManagementService.js
- Verify all service exports work correctly

#### **Task 1.3: Import Path Migration** (2-3 hours)
- Update all pages and components to use `domains/` imports
- Remove any remaining references to old service structure
- Test all imports resolve correctly

### **Phase 2: Advanced Feature Integration** (Days 3-5) ⭐

_Connect database-ready features to enterprise services_

#### **Task 2.1: Enhanced Analytics** (1 day)
- Connect enhanced reporting features through `domains/analytics/`
- Implement advanced dashboard metrics
- Add category performance analytics

#### **Task 2.2: Advanced User Management** (1 day) 
- Complete user statistics and session tracking features
- Add audit log viewing capabilities
- Implement user preference management

#### **Task 2.3: Smart Inventory Features** (1 day)
- Integrate intelligent category insights
- Add advanced stock management features  
- Implement reorder prediction algorithms

### **Phase 3: Production Readiness** (Days 6-7) 🚀

_Final optimization and deployment preparation_

#### **Task 3.1: Performance Validation** (Half day)
- Verify build optimization still optimal after updates
- Check code splitting performance 
- Run performance benchmarks

#### **Task 3.2: Security Review** (Half day)
- Validate all service security patterns
- Check enterprise service access controls
- Review audit logging implementation

#### **Task 3.3: Documentation Updates** (Half day)
- Update API documentation for enterprise services
- Document new service architecture patterns
- Create deployment guides for enterprise structure

## 🏆 Professional Development Guidelines

### **Enterprise Service Standards** ✅ IMPLEMENTED

1. **Domain Organization**: Services organized by business domain
2. **Single Responsibility**: Each service focused on one business area  
3. **Static Imports**: Build optimization complete, no dynamic import warnings
4. **Size Compliance**: All services under 300 lines, components under 200 lines
5. **Performance First**: Code splitting reduces main bundle to 30KB

### **For AI-Assisted Development (GitHub Copilot/Claude)**

- **Service Structure**: Use existing `domains/` organization pattern
- **Import Patterns**: Follow static import structure already implemented
- **File Naming**: Use established domain service naming conventions
- **Error Handling**: Follow patterns established in enterprise services

### **Development Workflow** ✅ OPTIMIZED

1. **Use Enterprise Services**: Import from `domains/` structure
2. **Check Schema Alignment**: Verify against COMPLETE_MEDCURE_MIGRATION.sql
3. **Maintain Standards**: Keep file sizes within enterprise limits
4. **Test Integration**: Verify all imports and exports work correctly

### **Code Quality Checklist**

- ✅ Service under 300 lines
- ✅ Component under 200 lines  
- ✅ Uses `domains/` import structure
- ✅ Aligns with current database schema
- ✅ Follows enterprise error handling patterns
- ✅ Maintains static import optimization

## 🚀 Optimization & Hardening Recommendations

### Database

- Add indexes: `CREATE INDEX idx_sales_created_at ON sales(created_at);`
- Verify RLS policies: `SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public';`
- Add foreign key constraints validation

### Frontend

- Implement lazy loading: `const InventoryPage = React.lazy(() => import('./pages/InventoryPage'));`
- Add React.memo to list components in `src/features/inventory/components/ProductCard.jsx`
- Bundle analysis: `npm run build && npx vite-bundle-analyzer dist`

### Security

- **CRITICAL**: Remove credentials from `.env` and `.env.example`
- Add env validation: `if (!import.meta.env.VITE_SUPABASE_URL) throw new Error('Missing Supabase URL');`
- Implement CSP headers and security middleware

## 🧪 Testing Plan

### Unit Tests (Vitest)

- Services: `src/services/__tests__/dataService.test.js` - Test CRUD operations
- Hooks: `src/hooks/__tests__/useAuth.test.js` - Authentication flow
- Components: `src/pages/__tests__/POSPage.test.jsx` - Transaction processing

### Integration Tests

- POS workflow: Add product → Apply discount → Complete transaction
- Inventory management: Create product → Update stock → Verify analytics
- User authentication: Login → Role verification → Access control

### E2E Tests (Playwright/Cypress)

- Complete sale transaction end-to-end
- Admin user management workflow
- Dashboard real-time updates

## 🛠 Professional Development Tools & Commands

**Find service organization:**
```bash
find src/services/domains -name "*.js" | head -20
```

**Verify enterprise imports:**
```bash
grep -r "from.*domains/" src/pages --include="*.jsx" | head -10
```

**Check build optimization:**
```bash
npm run build && ls -la dist/assets/
```

**Verify current schema:**
```bash
grep -A 5 "CREATE TABLE" database/COMPLETE_MEDCURE_MIGRATION.sql
```

**Check service file sizes:**
```bash
find src/services/domains -name "*.js" -exec wc -l {} + | sort -nr
```

## 🚀 **OPTIMIZED DEVELOPMENT SEQUENCE**

_Maximized for Speed & Supabase Free Plan Efficiency_

### **🎯 PHASE 1: CRITICAL FOUNDATION** (Day 1 - 4 hours) ⚡

_Must complete first - prevents deployment blockers_

#### **1.1 Security & Environment** (30 minutes)

```bash
# Remove all credentials immediately
git rm .env .env.example
echo "VITE_SUPABASE_URL=your_supabase_url_here" > .env.template
echo "VITE_SUPABASE_ANON_KEY=your_anon_key_here" >> .env.template
git add .env.template && git commit -m "security: remove exposed credentials"
```

#### **1.2 Fix Routing Issues** (1 hour)

- ✅ **Route Conflicts**: `/analytics` vs `/enhanced-analytics` (consolidate to one)
- ✅ **Missing Error Boundaries**: Add proper error handling for each route
- ✅ **Role Validation**: Ensure all admin routes have proper role checks
- ✅ **Navigation Sync**: Update Sidebar.jsx to match App.jsx routes

**Quick Fix Commands:**

```bash
# Check for broken routes
grep -r "to=" src/components --include="*.jsx" | grep -v "//\|/\*"
# Verify all imported pages exist
grep -r "import.*Page" src/App.jsx
```

#### **1.3 Database Schema Critical Fixes** (2.5 hours)

**Priority Order:**

1. **FK Reference Standardization** (30 min) - Prevents database errors
2. **User Table Consolidation** (1 hour) - Core to all features
3. **Batch Table Cleanup** (1 hour) - Essential for inventory

### **🏗️ PHASE 2: CODE ORGANIZATION** (Day 2 - 6 hours) 🔧

_Optimizes development speed for all future features_

#### **2.1 Component Refactoring** (4 hours)

**InventoryPage.jsx Split Strategy:**

```
src/pages/InventoryPage.jsx (600+ lines) →
├── src/components/inventory/InventoryDashboard.jsx (150 lines)
├── src/components/inventory/ProductTable.jsx (150 lines)
├── src/components/inventory/ProductForm.jsx (150 lines)
└── src/components/inventory/BatchManagement.jsx (150 lines)
```

#### **2.2 Service Architecture** (2 hours)

**dataService.js Split Strategy:**

```
src/services/dataService.js (880+ lines) →
├── src/services/core/ProductService.js (200 lines)
├── src/services/core/UserService.js (200 lines)
├── src/services/core/SalesService.js (200 lines)
└── src/services/core/AnalyticsService.js (200 lines)
```

### **🚀 PHASE 3: HIGH-IMPACT FEATURES** (Days 3-4 - 8 hours) ⭐

_Maximum business value with existing database support_

#### **3.1 User Preferences Connection** (2 hours)

- Connect `SettingsPage.jsx` to `user_preferences` table
- **Impact**: Immediate user experience improvement
- **Effort**: Low (database ready)

#### **3.2 Audit Log Viewer** (3 hours)

- Add admin tab to `UserManagementPage.jsx`
- **Impact**: Critical for compliance & monitoring
- **Effort**: Medium (UI development needed)

#### **3.3 Batch Management UI** (3 hours)

- Connect to existing `batches` table
- **Impact**: Pharmaceutical compliance essential
- **Effort**: Medium (complex UI, but database ready)

### **⚡ PHASE 4: PERFORMANCE & POLISH** (Day 5 - 4 hours) ✨

_Supabase Free Plan Optimization_

#### **4.1 Supabase Free Plan Optimization** (2 hours)

```javascript
// Optimize queries for free plan limits
const optimizedQueries = {
  // Reduce API calls with better caching
  staleTime: 5 * 60 * 1000, // 5 minutes
  // Implement proper pagination
  pageSize: 20, // Instead of loading all records
  // Use selective field querying
  select: "id,name,price", // Only needed fields
};
```

#### **4.2 Performance Enhancements** (2 hours)

- **React.lazy**: Route-based code splitting
- **React.memo**: List component optimization
- **useCallback/useMemo**: Prevent unnecessary re-renders

---

## 🎯 **ROUTING & NAVIGATION FIXES**

### **Current Route Issues Identified:**

1. **Duplicate Analytics Routes** - `/analytics` and `/enhanced-analytics`
2. **Missing Route Guards** - Some admin routes lack proper role validation
3. **Inconsistent Navigation** - Sidebar doesn't match all App.jsx routes

### **Route Consolidation Plan:**

```jsx
// REMOVE duplicate routes
❌ <Route path="/analytics" ... />           // Remove this
✅ <Route path="/enhanced-analytics" ... />  // Keep this

// ADD missing routes for Phase 3 features
✅ <Route path="/reports" element={<ReportsPage />} />
✅ <Route path="/disposal" element={<DisposalManagementPage />} />

// STANDARDIZE admin routes
✅ <Route path="/admin/*" element={<AdminLayout />}>
    <Route path="users" element={<UserManagementPage />} />
    <Route path="audit" element={<AuditLogPage />} />
    <Route path="settings" element={<AdminSettingsPage />} />
   </Route>
```

---

## 🗃️ **SUPABASE FREE PLAN OPTIMIZATION**

### **Free Plan Limits & Optimization:**

- **Database**: 500MB storage → Optimize queries, use pagination
- **API Requests**: 2GB bandwidth → Cache aggressively, batch requests
- **Auth Users**: Unlimited → No concerns
- **Edge Functions**: 500,000 invocations → Use client-side processing where possible

### **Optimization Strategies:**

```javascript
// 1. Implement proper pagination
const { data, error } = await supabase
  .from("products")
  .select("*")
  .range(0, 19); // Load 20 items at a time

// 2. Use selective querying
const { data } = await supabase
  .from("sales")
  .select("id, total_amount, created_at") // Only needed fields
  .eq("status", "completed");

// 3. Implement client-side filtering when possible
const filteredProducts = products.filter((p) => p.name.includes(searchTerm));
```

---

## 🚨 **CRITICAL PATH DEPENDENCIES**

### **Must Complete in Order:**

```
1. Security Fixes → 2. Database Schema → 3. Routing → 4. Component Refactoring → 5. Features
```

### **Parallel Development Opportunities:**

- **UI Components** can be developed while database is being fixed
- **Service splitting** can happen alongside route optimization
- **Performance optimization** can be planned during feature development

---

## � PROFESSIONAL DEVELOPMENT ROADMAP

### **PHASE 1: Critical Fixes & Security** (Days 1-2) 🚨

_Total Time: 1-2 days_

#### **Task 1.1: Remove Security Vulnerabilities** (30 minutes)

- Remove production credentials from `.env` and `.env.example`
- Create `.env.template` with placeholder values
- Add environment validation in `src/config/supabase.js`

#### **Task 1.2: Resolve Database Schema Conflicts** (4-6 hours)

- **User Tables**: Migrate `users` data to `user_profiles`, update all references
- **Batch Tables**: Consolidate `batch_inventory` into `batches`, update FK references
- **FK Standardization**: Change all user FKs to point to `auth.users(id)`

#### **Task 1.3: Code Cleanup** (2-3 hours)

- Delete unused hooks: `useRealTimePredictions.js`, `useErrorHandler.js`
- Remove redundant services: `salesService.js`, `salesServiceFixed.js`
- Archive mock data to `src/data/dev/` folder

---

### **PHASE 2: Component Refactoring** (Days 3-4) 🔧

_Total Time: 1-2 days_

#### **Task 2.1: Break Down Large Components** (6-8 hours)

- **InventoryPage.jsx** (600+ lines) → Split into:
  - `InventoryDashboard.jsx` (analytics, summary cards)
  - `ProductTable.jsx` (product list, filtering)
  - `ProductForm.jsx` (add/edit product modal)
  - `BatchManagement.jsx` (batch tracking interface)

#### **Task 2.2: Refactor Large Services** (4-6 hours)

- **dataService.js** (880+ lines) → Split into:
  - `src/services/products/ProductService.js` (max 200 lines)
  - `src/services/users/UserService.js` (max 200 lines)
  - `src/services/sales/SalesService.js` (max 200 lines)
  - `src/services/analytics/AnalyticsService.js` (max 200 lines)

---

### **PHASE 3: Feature Completion** (Days 5-9) ⭐

_Total Time: 4-5 days_

#### **Task 3.1: High-Priority Features** (2-3 days)

1. **User Preferences Integration** (2-3 hours)

   - Connect `SettingsPage.jsx` to `user_preferences` table
   - Add theme, language, notification preferences

2. **Audit Log Viewer** (3-4 hours)

   - Add audit log tab to `UserManagementPage.jsx`
   - Include filtering, search, and export functionality

3. **Batch Management UI** (6-8 hours)
   - Add batch tracking to inventory management
   - Implement expiry alerts and FIFO management

#### **Task 3.2: Medium-Priority Features** (2 days)

1. **Comprehensive Reporting** (4-5 hours)

   - Create `ReportsPage.jsx` (max 150 lines)
   - Connect to existing `reportingService.js`
   - Add PDF export for sales, inventory, audit reports

2. **Advanced Disposal Management** (8-10 hours)
   - Create `DisposalManagementPage.jsx`
   - Implement disposal workflow with approvals
   - Connect to `disposal_*` database tables

---

### **PHASE 4: Polish & Optimization** (Days 10-12) ✨

_Total Time: 2-3 days_

#### **Task 4.1: Performance Optimization** (1 day)

- Implement lazy loading for major routes
- Add React.memo to list components
- Optimize database queries and indexes

#### **Task 4.2: Testing & Documentation** (1-2 days)

- Add unit tests for critical services
- Create comprehensive API documentation
- Update deployment guides

---

## 🎯 **Professional Development Guidelines**

### **When Working on Each Task:**

1. **Ask if unsure**: If implementation details are unclear, ask for clarification
2. **Keep components small**: Maximum 200 lines per component
3. **Single responsibility**: Each file should have one clear purpose
4. **Consistent patterns**: Follow established naming and structure conventions
5. **Error handling**: Implement proper error boundaries and user feedback
6. **Performance first**: Consider React performance best practices

### **Questions to Ask Before Implementation:**

- "Should this component be split further?"
- "Does this service handle too many responsibilities?"
- "Are there any edge cases I should consider?"
- "What's the expected user experience for this feature?"
- "How should errors be handled in this workflow?"

### **Code Review Checklist:**

- ✅ Component under 200 lines
- ✅ Service under 300 lines
- ✅ Clear, descriptive variable names
- ✅ Proper error handling
- ✅ No hardcoded values
- ✅ Responsive design considerations
- ✅ Accessibility features included

---

## 🏆 PROFESSIONAL DEVELOPMENT BEST PRACTICES

### **For AI-Assisted Development (GitHub Copilot/Claude)**

- **File Size Limits**: Keep components under 200 lines, services under 300 lines
- **Clear Naming**: Use descriptive, intention-revealing names for functions and variables
- **Single Responsibility**: Each file should have one clear, focused purpose
- **Consistent Structure**: Follow established patterns for easier AI understanding

### **Code Quality Standards**

- **Error Handling**: Always implement proper try-catch blocks and user feedback
- **TypeScript Ready**: Write code that can easily be migrated to TypeScript
- **Performance First**: Consider React best practices (memo, useMemo, useCallback)
- **Accessibility**: Include ARIA labels and keyboard navigation

### **Development Workflow**

1. **Start Small**: Implement one feature at a time, test thoroughly
2. **Ask Questions**: If requirements are unclear, ask for specific guidance
3. **Review Often**: Check code against the guidelines checklist
4. **Document Changes**: Write clear commit messages and PR descriptions

---

## 📞 IMPLEMENTATION SUPPORT

### **When You Need Help**

- "The database schema shows conflicting tables - which should I use?"
- "This component is getting large - how should I split it?"
- "What's the expected user flow for this feature?"
- "Should I implement this as a new service or extend existing?"

### **Common Questions & Answers**

**Q**: "Should I use `users` or `user_profiles` table?"  
**A**: Always use `user_profiles` table - `users` table is deprecated

**Q**: "How should I handle errors in services?"  
**A**: Return consistent error objects with `{ success: false, error: 'message' }`

**Q**: "What's the routing structure for new pages?"  
**A**: Add to `App.jsx` and create page in `src/pages/`

---

## CI/CD / Deployment Checklist

- [ ] **Build**: `npm run build` succeeds without warnings
- [ ] **Lint**: `npm run lint` passes with no errors
- [ ] **Test**: `npm run test` achieves >80% coverage
- [ ] **Security Scan**: No credentials in repository
- [ ] **Environment Config**: Production env vars configured in deployment platform
- [ ] **Database Migration**: `database/COMPLETE_MEDCURE_MIGRATION.sql` executed on production Supabase
- [ ] **Health Check**: `/health` endpoint returns 200 with database connectivity
- [ ] **Smoke Tests**: Core flows (login, POS transaction, inventory update) functional

## ✅ Final Checklist to Mark "Project Complete"

- [ ] **Database Schema**: User table conflicts resolved, batch tables consolidated, all FK references valid
- [ ] **Authentication**: Login/logout works with proper role-based access control using `user_profiles` table
- [ ] **POS System**: Complete transaction workflow with audit logging and stock management
- [ ] **Inventory**: CRUD operations with batch tracking, expiry management, and supplier integration
- [ ] **Security**: No credentials in repository, RLS policies verified, proper input validation
- [ ] **Advanced Features**: Disposal management, comprehensive reporting, notification system
- [ ] **Performance**: Page load times <2s, code splitting implemented, optimized components
- [ ] **Mobile**: Responsive design works on tablet/mobile devices
- [ ] **Testing**: Core features have automated test coverage >80%
- [ ] **Documentation**: Updated deployment guide and user documentation
- [ ] **Monitoring**: Error tracking and performance monitoring configured

## Appendix — Needs Review

### Database Schema Verification

**Commands to run:**

```sql
-- Verify user table conflicts
SELECT 'users table' as source, COUNT(*) as count FROM users
UNION ALL
SELECT 'user_profiles table' as source, COUNT(*) as count FROM user_profiles;

-- Check FK reference consistency
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public';

-- Verify batch table overlap
SELECT 'batch_inventory' as table_name, COUNT(*) as records FROM batch_inventory
UNION ALL
SELECT 'batches' as table_name, COUNT(*) as records FROM batches;
```

### RLS Policy Verification

**Commands to run:**

```sql
-- Check which tables have RLS enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = false;

-- List all existing policies
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Performance Baseline

**Commands to run:**

```bash
# Lighthouse audit for performance baseline
npx lighthouse http://localhost:5173 --output json --only-categories=performance

# Bundle analysis
npm run build && npx vite-bundle-analyzer dist/assets

# Check for large components
find src/ -name "*.jsx" -exec wc -l {} + | sort -nr | head -10
```

---

_Document Version: 2.0 - Professional Development Edition_  
_Last Updated: December 2024_  
_Focus: Maintainable Code for AI-Assisted Development_  
_Next Review: After Phase 1 Completion_

````

### RLS Policy Verification

**Commands to run:**

```sql
-- Check which tables have RLS enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = false;

-- List all existing policies
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
````

### Performance Baseline

**Commands to run:**

```bash
# Lighthouse audit for performance baseline
npx lighthouse http://localhost:5173 --output json --only-categories=performance

# Bundle analysis
npm run build && npx vite-bundle-analyzer dist/assets

# Check for large components
find src/ -name "*.jsx" -exec wc -l {} + | sort -nr | head -10
```
