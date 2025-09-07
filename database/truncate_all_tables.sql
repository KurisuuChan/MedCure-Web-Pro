-- 🗑️ **TRUNCATE ALL TABLES - FRESH START**
-- Complete database reset for MedCure-Pro
-- WARNING: This will delete ALL data from your tables!
-- Make sure to backup any important data before running this script
-- 
-- IMPORTANT: Run fix_missing_columns.sql BEFORE running this script
-- to ensure all required columns exist!

-- ==========================================
-- 1. DISABLE TRIGGERS TEMPORARILY
-- ==========================================
-- Disable triggers to avoid issues during truncation

SET session_replication_role = replica;

-- ==========================================
-- 2. TRUNCATE TABLES IN CORRECT ORDER
-- ==========================================
-- Tables must be truncated in reverse dependency order to avoid foreign key conflicts

-- Truncate dependent tables first (child tables)
TRUNCATE TABLE stock_movements RESTART IDENTITY CASCADE;
TRUNCATE TABLE sale_items RESTART IDENTITY CASCADE;
TRUNCATE TABLE sales RESTART IDENTITY CASCADE;

-- Truncate main entity tables
TRUNCATE TABLE products RESTART IDENTITY CASCADE;
TRUNCATE TABLE categories RESTART IDENTITY CASCADE;
TRUNCATE TABLE users RESTART IDENTITY CASCADE;

-- ==========================================
-- 3. RESET SEQUENCES (if any)
-- ==========================================
-- Reset any sequences to start from 1

-- Note: Using RESTART IDENTITY above already resets sequences,
-- but you can manually reset specific sequences if needed:
-- ALTER SEQUENCE your_sequence_name RESTART WITH 1;

-- ==========================================
-- 4. RE-ENABLE TRIGGERS
-- ==========================================
-- Re-enable triggers after truncation

SET session_replication_role = DEFAULT;

-- ==========================================
-- 5. VERIFICATION QUERIES
-- ==========================================
-- Run these to verify all tables are empty

-- Check table counts (should all be 0)
SELECT 
    'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 
    'categories' as table_name, COUNT(*) as row_count FROM categories
UNION ALL
SELECT 
    'products' as table_name, COUNT(*) as row_count FROM products
UNION ALL
SELECT 
    'sales' as table_name, COUNT(*) as row_count FROM sales
UNION ALL
SELECT 
    'sale_items' as table_name, COUNT(*) as row_count FROM sale_items
UNION ALL
SELECT 
    'stock_movements' as table_name, COUNT(*) as row_count FROM stock_movements;

-- ==========================================
-- 6. OPTIONAL: RE-INSERT DEFAULT CATEGORIES
-- ==========================================
-- Uncomment the following if you want to restore default categories

/*
INSERT INTO categories (name, description, color, icon, sort_order) VALUES
('Pain Relief', 'Pain management and relief medications', '#EF4444', 'Heart', 1),
('Antibiotics', 'Antibiotic medications for infections', '#10B981', 'Shield', 2),
('Vitamins', 'Vitamins and nutritional supplements', '#F59E0B', 'Zap', 3),
('Cold & Flu', 'Cold, flu, and respiratory medications', '#6366F1', 'Thermometer', 4),
('Digestive', 'Digestive health and stomach medications', '#8B5CF6', 'Stomach', 5),
('Skin Care', 'Topical treatments and skin care products', '#EC4899', 'Droplets', 6),
('First Aid', 'Emergency and first aid supplies', '#F97316', 'Cross', 7),
('Baby Care', 'Infant and child care products', '#84CC16', 'Baby', 8),
('Prescription', 'Prescription-only medications', '#DC2626', 'FileText', 9),
('Other', 'Miscellaneous pharmaceutical products', '#6B7280', 'Package', 10);
*/

-- ==========================================
-- TRUNCATION COMPLETE
-- ==========================================

-- Your database is now completely clean and ready for fresh data!
-- All tables are empty and sequences are reset to start from 1.

COMMENT ON SCHEMA public IS 'Database truncated and ready for fresh data entry';

-- 🎉 Fresh start ready! You can now add your own data.
