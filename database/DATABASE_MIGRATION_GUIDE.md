# Database Schema Migration Guide
*Professional Development Edition - September 2025*

## 🚨 CRITICAL DATABASE FIXES

### **Phase 1: FK Reference Standardization** (30 minutes)

#### **Step 1: Identify Broken FK References**
```sql
-- Check all foreign key constraints pointing to wrong tables
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
    AND ccu.table_name = 'users'  -- Find references to deprecated users table
ORDER BY tc.table_name;
```

#### **Step 2: Fix FK References**
```sql
-- Example: Fix audit_log table
ALTER TABLE audit_log DROP CONSTRAINT IF EXISTS audit_log_user_id_fkey;
ALTER TABLE audit_log ADD CONSTRAINT audit_log_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id);

-- Example: Fix sales table  
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_user_id_fkey;
ALTER TABLE sales ADD CONSTRAINT sales_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id);

-- Example: Fix stock_movements table
ALTER TABLE stock_movements DROP CONSTRAINT IF EXISTS stock_movements_user_id_fkey;
ALTER TABLE stock_movements ADD CONSTRAINT stock_movements_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id);
```

### **Phase 2: User Table Consolidation** (1 hour)

#### **Step 1: Migrate Data from users to user_profiles**
```sql
-- Insert missing user_profiles records
INSERT INTO user_profiles (id, email, first_name, last_name, created_at, updated_at)
SELECT 
    id, 
    email, 
    first_name, 
    last_name, 
    created_at, 
    updated_at
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM user_profiles up WHERE up.id = u.id
);
```

#### **Step 2: Update Role System**
```sql
-- Migrate roles to user_roles table
INSERT INTO user_roles (user_id, role, assigned_at, is_active)
SELECT 
    id as user_id,
    role,
    created_at as assigned_at,
    is_active
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id
);
```

#### **Step 3: Drop Deprecated users Table** (ONLY after verification)
```sql
-- DANGER: Only run after confirming all data migrated and FKs updated
-- DROP TABLE users CASCADE;
```

### **Phase 3: Batch Table Consolidation** (1 hour)

#### **Step 1: Migrate batch_inventory to batches**
```sql
-- Insert missing batch records
INSERT INTO batches (
    product_id, 
    batch_number, 
    expiration_date, 
    quantity, 
    original_quantity, 
    cost_price, 
    supplier, 
    created_at, 
    updated_at
)
SELECT 
    product_id,
    batch_number,
    expiry_date as expiration_date,
    stock_quantity as quantity,
    stock_quantity as original_quantity,
    cost_price,
    supplier,
    created_at,
    updated_at
FROM batch_inventory bi
WHERE NOT EXISTS (
    SELECT 1 FROM batches b 
    WHERE b.product_id = bi.product_id 
    AND b.batch_number = bi.batch_number
);
```

#### **Step 2: Update FK References to use batches**
```sql
-- Update sale_items to reference batches instead of batch_inventory
ALTER TABLE sale_items DROP CONSTRAINT IF EXISTS sale_items_batch_id_fkey;
ALTER TABLE sale_items ADD CONSTRAINT sale_items_batch_id_fkey 
    FOREIGN KEY (batch_id) REFERENCES batches(id);

-- Update disposal_items
ALTER TABLE disposal_items DROP CONSTRAINT IF EXISTS disposal_items_batch_id_fkey;
ALTER TABLE disposal_items ADD CONSTRAINT disposal_items_batch_id_fkey 
    FOREIGN KEY (batch_id) REFERENCES batches(id);
```

## 🎯 **VERIFICATION QUERIES**

### **Check Migration Success**
```sql
-- Verify no broken FK constraints
SELECT 
    tc.table_name,
    tc.constraint_name,
    'BROKEN FK - ' || ccu.table_name as issue
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
    AND ccu.table_name = 'users';  -- Should return 0 rows

-- Verify user data consistency
SELECT 
    'auth.users' as source, COUNT(*) as count FROM auth.users
UNION ALL
SELECT 
    'user_profiles' as source, COUNT(*) as count FROM user_profiles;

-- Verify batch data consistency  
SELECT 
    'batches' as source, COUNT(*) as count FROM batches
UNION ALL
SELECT 
    'batch_inventory' as source, COUNT(*) as count FROM batch_inventory;
```

## 🚀 **SUPABASE FREE PLAN OPTIMIZATIONS**

### **Query Optimization for Free Plan**
```sql
-- Add essential indexes to reduce query time
CREATE INDEX IF NOT EXISTS idx_sales_user_date 
    ON sales(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_products_active 
    ON products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_profiles_email 
    ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_batches_product_expiry 
    ON batches(product_id, expiration_date);

-- Analyze table statistics for query planner
ANALYZE sales;
ANALYZE products;
ANALYZE user_profiles;
ANALYZE batches;
```

### **Row Level Security Setup**
```sql
-- Enable RLS on critical tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (customize for your needs)
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid() 
            AND ur.role IN ('admin', 'super_admin')
            AND ur.is_active = true
        )
    );
```

## 🔍 **TROUBLESHOOTING**

### **Common Issues & Solutions**

1. **FK Constraint Violation Error**
   ```sql
   -- Check for orphaned records
   SELECT * FROM sales s 
   WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = s.user_id);
   ```

2. **Duplicate Key Errors**
   ```sql
   -- Find duplicates before migration
   SELECT email, COUNT(*) 
   FROM user_profiles 
   GROUP BY email 
   HAVING COUNT(*) > 1;
   ```

3. **Performance Issues**
   ```sql
   -- Check slow queries
   SELECT query, mean_time, calls 
   FROM pg_stat_statements 
   ORDER BY mean_time DESC 
   LIMIT 10;
   ```

---

*Migration Guide Version: 1.0*  
*Estimated Total Time: 2.5 hours*  
*Risk Level: Medium (requires careful verification)*
