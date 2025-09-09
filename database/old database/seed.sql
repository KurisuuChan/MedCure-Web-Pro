-- 🏥 **MEDCURE-PRO SEED DATA**
-- Initial data for testing and development
-- Created: Phase 3 - Database Integration
-- Version: 1.0

-- This file populates the database with realistic pharmaceutical data for testing

-- ==========================================
-- 1. SEED USERS
-- ==========================================
-- Initial user accounts for testing

INSERT INTO users (id, email, role, first_name, last_name, phone, is_active) VALUES
-- Admin user
('550e8400-e29b-41d4-a716-446655440001', 'admin@medcure.com', 'admin', 'John', 'Administrator', '+1234567890', true),

-- Manager users
('550e8400-e29b-41d4-a716-446655440002', 'manager@medcure.com', 'manager', 'Sarah', 'Manager', '+1234567891', true),
('550e8400-e29b-41d4-a716-446655440003', 'jane.smith@medcure.com', 'manager', 'Jane', 'Smith', '+1234567892', true),

-- Cashier users
('550e8400-e29b-41d4-a716-446655440004', 'cashier@medcure.com', 'cashier', 'Mike', 'Johnson', '+1234567893', true),
('550e8400-e29b-41d4-a716-446655440005', 'alex.brown@medcure.com', 'cashier', 'Alex', 'Brown', '+1234567894', true),
('550e8400-e29b-41d4-a716-446655440006', 'lisa.davis@medcure.com', 'cashier', 'Lisa', 'Davis', '+1234567895', true);

-- ==========================================
-- 2. SEED PRODUCTS
-- ==========================================
-- Realistic pharmaceutical products with proper categorization

INSERT INTO products (id, name, brand, category, description, price_per_piece, pieces_per_sheet, sheets_per_box, stock_in_pieces, reorder_level, expiry_date, supplier, batch_number) VALUES

-- Pain Relief & Anti-inflammatory
('660e8400-e29b-41d4-a716-446655440001', 'Paracetamol 500mg', 'MedLife', 'Pain Relief', 'Fast-acting pain relief tablets for headaches, fever, and body aches', 0.25, 10, 10, 5000, 500, '2025-12-31', 'PharmaCorp Ltd', 'PC2024001'),

('660e8400-e29b-41d4-a716-446655440002', 'Ibuprofen 400mg', 'HealthPlus', 'Pain Relief', 'Anti-inflammatory tablets for pain and swelling reduction', 0.35, 10, 10, 3200, 400, '2025-11-15', 'MediSupply Inc', 'MS2024002'),

('660e8400-e29b-41d4-a716-446655440003', 'Aspirin 75mg', 'CardioGuard', 'Cardiovascular', 'Low-dose aspirin for heart protection and blood thinning', 0.15, 14, 4, 2800, 300, '2026-03-20', 'HeartMed Solutions', 'HM2024003'),

-- Antibiotics
('660e8400-e29b-41d4-a716-446655440004', 'Amoxicillin 500mg', 'BioMed', 'Antibiotics', 'Broad-spectrum antibiotic for bacterial infections', 1.25, 21, 2, 1680, 200, '2025-08-10', 'AntibioTech Corp', 'AT2024004'),

('660e8400-e29b-41d4-a716-446655440005', 'Ciprofloxacin 250mg', 'InfectionFree', 'Antibiotics', 'Fluoroquinolone antibiotic for urinary tract infections', 2.50, 10, 3, 900, 100, '2025-09-25', 'UTI Solutions Ltd', 'US2024005'),

-- Gastrointestinal
('660e8400-e29b-41d4-a716-446655440006', 'Omeprazole 20mg', 'GastroHeal', 'Gastrointestinal', 'Proton pump inhibitor for acid reflux and ulcers', 0.85, 14, 2, 1400, 150, '2025-10-12', 'DigestWell Pharma', 'DW2024006'),

('660e8400-e29b-41d4-a716-446655440007', 'Loperamide 2mg', 'StopFlow', 'Gastrointestinal', 'Anti-diarrheal medication for acute diarrhea', 0.45, 6, 10, 1800, 200, '2026-01-08', 'GI Solutions', 'GI2024007'),

-- Respiratory
('660e8400-e29b-41d4-a716-446655440008', 'Salbutamol Inhaler 100mcg', 'BreathEasy', 'Respiratory', 'Bronchodilator inhaler for asthma and COPD', 12.50, 1, 12, 144, 24, '2025-07-30', 'RespiCare Medical', 'RC2024008'),

('660e8400-e29b-41d4-a716-446655440009', 'Cetirizine 10mg', 'AllergyFree', 'Antihistamines', 'Non-drowsy antihistamine for allergies and hay fever', 0.30, 10, 3, 2100, 250, '2026-02-14', 'Allergy Solutions', 'AS2024009'),

-- Cardiovascular
('660e8400-e29b-41d4-a716-446655440010', 'Amlodipine 5mg', 'PressureControl', 'Cardiovascular', 'Calcium channel blocker for high blood pressure', 0.75, 28, 1, 1400, 150, '2025-12-05', 'CardioMed Inc', 'CM2024010'),

('660e8400-e29b-41d4-a716-446655440011', 'Atorvastatin 20mg', 'CholestrolBuster', 'Cardiovascular', 'Statin medication for cholesterol management', 1.15, 30, 1, 1200, 120, '2025-11-22', 'LipidCare Pharma', 'LC2024011'),

-- Diabetes Management
('660e8400-e29b-41d4-a716-446655440012', 'Metformin 500mg', 'GlucoBalance', 'Diabetes', 'First-line medication for type 2 diabetes', 0.20, 28, 2, 3360, 400, '2026-04-18', 'DiaCare Solutions', 'DC2024012'),

-- Vitamins & Supplements
('660e8400-e29b-41d4-a716-446655440013', 'Vitamin D3 1000 IU', 'SunVitamin', 'Vitamins', 'Essential vitamin for bone health and immunity', 0.10, 30, 6, 5400, 600, '2027-01-15', 'NutriHealth Corp', 'NH2024013'),

('660e8400-e29b-41d4-a716-446655440014', 'Multivitamin Complex', 'VitaBoost', 'Vitamins', 'Complete daily vitamin and mineral supplement', 0.55, 30, 4, 2400, 300, '2026-09-30', 'WellnessPlus Ltd', 'WP2024014'),

-- Mental Health
('660e8400-e29b-41d4-a716-446655440015', 'Sertraline 50mg', 'MoodBalance', 'Mental Health', 'SSRI antidepressant for depression and anxiety', 1.85, 28, 1, 840, 100, '2025-10-28', 'MentalWell Pharma', 'MW2024015'),

-- Cold & Flu
('660e8400-e29b-41d4-a716-446655440016', 'Paracetamol + Caffeine', 'ColdRelief', 'Cold & Flu', 'Combination tablet for cold and flu symptoms', 0.40, 12, 5, 1800, 200, '2025-08-20', 'FluFree Solutions', 'FF2024016'),

-- Topical Medications
('660e8400-e29b-41d4-a716-446655440017', 'Hydrocortisone Cream 1%', 'SkinSoothe', 'Topical', 'Anti-inflammatory cream for skin irritations', 3.25, 1, 24, 72, 12, '2025-06-15', 'DermaCare Ltd', 'DM2024017'),

-- First Aid
('660e8400-e29b-41d4-a716-446655440018', 'Antiseptic Wipes', 'CleanCare', 'First Aid', 'Sterile antiseptic wipes for wound cleaning', 0.05, 10, 20, 4000, 500, '2026-12-31', 'FirstAid Supply', 'FA2024018'),

-- Low stock items for testing alerts
('660e8400-e29b-41d4-a716-446655440019', 'Emergency Epinephrine', 'LifeSaver', 'Emergency', 'Auto-injector for severe allergic reactions', 85.00, 1, 6, 8, 12, '2025-05-10', 'Emergency Medical', 'EM2024019'),

('660e8400-e29b-41d4-a716-446655440020', 'Insulin Rapid Acting', 'DiabetesControl', 'Diabetes', 'Fast-acting insulin for diabetes management', 45.50, 1, 5, 3, 10, '2025-04-30', 'InsulinTech Corp', 'IT2024020');

-- ==========================================
-- 3. SEED SALES TRANSACTIONS
-- ==========================================
-- Sample sales for testing and reporting

INSERT INTO sales (id, user_id, total_amount, payment_method, status, customer_name, customer_phone, created_at) VALUES

-- Recent sales (last 7 days)
('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', 15.75, 'cash', 'completed', 'John Smith', '+1987654321', NOW() - INTERVAL '1 day'),
('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440005', 28.50, 'card', 'completed', 'Mary Johnson', '+1987654322', NOW() - INTERVAL '2 days'),
('770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440006', 42.25, 'digital', 'completed', 'Robert Brown', '+1987654323', NOW() - INTERVAL '3 days'),
('770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 156.80, 'card', 'completed', 'Sarah Wilson', '+1987654324', NOW() - INTERVAL '4 days'),
('770e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', 73.45, 'cash', 'completed', 'Michael Davis', '+1987654325', NOW() - INTERVAL '5 days'),

-- This month's sales
('770e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440006', 89.60, 'card', 'completed', 'Lisa Anderson', '+1987654326', NOW() - INTERVAL '10 days'),
('770e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440004', 31.25, 'cash', 'completed', 'David Miller', '+1987654327', NOW() - INTERVAL '15 days'),
('770e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440005', 124.75, 'digital', 'completed', 'Jennifer Taylor', '+1987654328', NOW() - INTERVAL '20 days'),

-- Pending/test sales
('770e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440006', 67.30, 'card', 'pending', 'Test Customer', '+1987654329', NOW() - INTERVAL '1 hour'),
('770e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440004', 25.40, 'cash', 'cancelled', 'Cancelled Order', '+1987654330', NOW() - INTERVAL '2 hours');

-- ==========================================
-- 4. SEED SALE ITEMS
-- ==========================================
-- Individual items for each sale transaction

INSERT INTO sale_items (sale_id, product_id, quantity, unit_type, unit_price, total_price) VALUES

-- Sale 1 items (John Smith - $15.75)
('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 20, 'piece', 0.25, 5.00),  -- Paracetamol
('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440009', 15, 'piece', 0.30, 4.50),  -- Cetirizine
('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440013', 25, 'piece', 0.10, 2.50),  -- Vitamin D3
('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440018', 75, 'piece', 0.05, 3.75),  -- Antiseptic Wipes

-- Sale 2 items (Mary Johnson - $28.50)
('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', 30, 'piece', 0.35, 10.50), -- Ibuprofen
('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440006', 21, 'piece', 0.85, 17.85), -- Omeprazole
('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440003', 1, 'piece', 0.15, 0.15),  -- Aspirin

-- Sale 3 items (Robert Brown - $42.25)
('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440012', 56, 'piece', 0.20, 11.20), -- Metformin
('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440010', 28, 'piece', 0.75, 21.00), -- Amlodipine
('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440013', 30, 'piece', 0.10, 3.00),  -- Vitamin D3
('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440007', 15, 'piece', 0.45, 6.75),  -- Loperamide
('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440001', 1, 'piece', 0.25, 0.25),  -- Paracetamol
('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440018', 1, 'piece', 0.05, 0.05),  -- Antiseptic Wipes

-- Sale 4 items (Sarah Wilson - $156.80)
('770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440008', 2, 'piece', 12.50, 25.00), -- Salbutamol Inhaler
('770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440004', 42, 'piece', 1.25, 52.50), -- Amoxicillin
('770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440011', 30, 'piece', 1.15, 34.50), -- Atorvastatin
('770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440015', 28, 'piece', 1.85, 51.80), -- Sertraline
('770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440017', 1, 'piece', 3.25, 3.25); -- Hydrocortisone Cream

-- Sale 5 items (Michael Davis - $73.45)
INSERT INTO sale_items (sale_id, product_id, quantity, unit_type, unit_price, total_price) VALUES
('770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440005', 10, 'piece', 2.50, 25.00), -- Ciprofloxacin
('770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440014', 60, 'piece', 0.55, 33.00), -- Multivitamin
('770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440016', 36, 'piece', 0.40, 14.40), -- Cold Relief
('770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440001', 4, 'piece', 0.25, 1.00), -- Paracetamol
('770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440018', 1, 'piece', 0.05, 0.05); -- Antiseptic Wipes

-- ==========================================
-- 5. INITIAL STOCK MOVEMENTS
-- ==========================================
-- Record initial stock entries for audit trail

INSERT INTO stock_movements (product_id, user_id, movement_type, quantity, reason, stock_before, stock_after) VALUES

-- Initial stock entries (simulating initial inventory)
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'in', 5000, 'Initial inventory - Paracetamol', 0, 5000),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'in', 3200, 'Initial inventory - Ibuprofen', 0, 3200),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'in', 2800, 'Initial inventory - Aspirin', 0, 2800),
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'in', 1680, 'Initial inventory - Amoxicillin', 0, 1680),
('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001', 'in', 900, 'Initial inventory - Ciprofloxacin', 0, 900),

-- Recent stock adjustments
('660e8400-e29b-41d4-a716-446655440019', '550e8400-e29b-41d4-a716-446655440002', 'adjustment', -4, 'Stock correction - damaged items', 12, 8),
('660e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440002', 'adjustment', -2, 'Stock correction - expired items', 5, 3);

-- ==========================================
-- DATA VERIFICATION QUERIES
-- ==========================================

-- Count records in each table
DO $$
DECLARE
    user_count INTEGER;
    product_count INTEGER;
    sales_count INTEGER;
    items_count INTEGER;
    movements_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO product_count FROM products;
    SELECT COUNT(*) INTO sales_count FROM sales;
    SELECT COUNT(*) INTO items_count FROM sale_items;
    SELECT COUNT(*) INTO movements_count FROM stock_movements;
    
    RAISE NOTICE 'Seed Data Summary:';
    RAISE NOTICE '- Users: %', user_count;
    RAISE NOTICE '- Products: %', product_count;
    RAISE NOTICE '- Sales: %', sales_count;
    RAISE NOTICE '- Sale Items: %', items_count;
    RAISE NOTICE '- Stock Movements: %', movements_count;
END $$;

-- ==========================================
-- SEED DATA COMPLETE
-- ==========================================

COMMENT ON TABLE users IS 'Seeded with 6 test users (1 admin, 2 managers, 3 cashiers)';
COMMENT ON TABLE products IS 'Seeded with 20 pharmaceutical products across multiple categories';
COMMENT ON TABLE sales IS 'Seeded with 10 test sales transactions';
COMMENT ON TABLE sale_items IS 'Seeded with corresponding sale items for all transactions';
COMMENT ON TABLE stock_movements IS 'Seeded with initial stock entries and adjustments';

-- Database ready for testing! 🎯
