# 📦 MedCure Pharmacy - Packaging & Unit System Guide

## 🎯 System Overview

MedCure uses a **flexible 2-3 tier packaging system** that automatically adapts based on your inventory data.

---

## 🏗️ Understanding the Three Tiers

### **Tier 1: PIECE (Base Unit)** 🔵

- **Always Available**
- Individual tablets, capsules, or units
- **Example**: 1 Biogesic tablet = ₱5.00

### **Tier 2: SHEET** 🟢

- **Shows only if `pieces_per_sheet > 1`**
- Blister pack, strip, or sheet containing multiple pieces
- **Example**: 1 sheet = 10 tablets = ₱50.00

### **Tier 3: BOX** 🟠

- **Shows only if `sheets_per_box > 1`**
- Box containing multiple sheets
- **Example**: 1 box = 10 sheets = 100 tablets = ₱500.00

---

## 📊 Current Recommended Configuration

### **For Philippine Retail Pharmacy Operations:**

```
✅ RECOMMENDED: 2-Tier System (Piece + Sheet)
├── pieces_per_sheet: 10 (standard blister pack)
└── sheets_per_box: 1 (disable box option)
```

### **Why This Works Best:**

1. **✅ Matches Customer Buying Patterns**

   - Customers buy: Single tablets OR full blister packs
   - Rarely buy boxes (that's wholesale level)

2. **✅ Simpler POS Experience**

   - Cashiers see: "Piece" or "Sheet"
   - Faster checkout, less confusion

3. **✅ Accurate Inventory**
   - Track by pieces (most granular)
   - Group by sheets when needed
   - No unnecessary box calculations

---

## 🔧 Configuration Examples

### **Example 1: Tablet/Capsule (Standard Blister)**

```csv
generic_name,pieces_per_sheet,sheets_per_box
Biogesic 500mg,10,1
```

**POS will show:**

- 🔵 Piece (₱5.00 each)
- 🟢 Sheet (₱50.00 = 10 pieces)

---

### **Example 2: Syrup/Liquid (Single Unit)**

```csv
generic_name,pieces_per_sheet,sheets_per_box
Tempra Syrup 60ml,1,1
```

**POS will show:**

- 🔵 Piece (₱85.00 each) _only_

---

### **Example 3: Wholesale Product (Full 3-Tier)**

```csv
generic_name,pieces_per_sheet,sheets_per_box
Paracetamol Generic,10,10
```

**POS will show:**

- 🔵 Piece (₱3.50 each)
- 🟢 Sheet (₱35.00 = 10 pieces)
- 🟠 Box (₱350.00 = 100 pieces)

---

## 📝 CSV Import Template

### **Standard Retail Template (2-Tier):**

```csv
generic_name,brand_name,category_name,price_per_piece,pieces_per_sheet,sheets_per_box,stock_in_pieces
Paracetamol,Biogesic,Pain Relief,5.00,10,1,500
Amoxicillin,Amoxil,Antibiotics,8.50,10,1,300
Cetirizine,Zyrtec,Antihistamines,6.00,10,1,400
```

### **Wholesale Template (3-Tier):**

```csv
generic_name,brand_name,category_name,price_per_piece,pieces_per_sheet,sheets_per_box,stock_in_pieces
Paracetamol Generic,Generic,Pain Relief,3.50,10,10,1000
Amoxicillin Generic,Generic,Antibiotics,6.00,10,5,500
```

---

## 🎨 How It Appears in POS

### **When Customer Selects a Product:**

#### **2-Tier Product (sheets_per_box = 1):**

```
┌─────────────────────────────────────────┐
│  🔵 Piece        │  🟢 Sheet            │
│  ₱5.00          │  ₱50.00              │
│  500 available  │  50 available        │
│  ✅ Selected    │  ○                   │
└─────────────────────────────────────────┘
```

#### **3-Tier Product (sheets_per_box = 10):**

```
┌────────────────────────────────────────────────────────┐
│  🔵 Piece   │  🟢 Sheet   │  🟠 Box                   │
│  ₱5.00      │  ₱50.00     │  ₱500.00                  │
│  500 avail  │  50 avail   │  5 available              │
│  ○          │  ✅ Selected│  ○                        │
└────────────────────────────────────────────────────────┘
```

---

## 🔍 Troubleshooting

### **Problem: "Box option not showing"**

**Check your data:**

```sql
SELECT
    generic_name,
    pieces_per_sheet,
    sheets_per_box,
    stock_in_pieces,
    -- Calculate if box should show
    CASE
        WHEN sheets_per_box > 1 THEN 'Box will show ✅'
        ELSE 'Box hidden (2-tier) ✅'
    END as box_status
FROM products
WHERE id = 'your-product-id';
```

**Reasons box is hidden:**

1. ✅ `sheets_per_box = 1` (intended 2-tier system)
2. ❌ `sheets_per_box = NULL` (set to 1 via DEFAULT)
3. ❌ Not enough stock to form a complete box

---

### **Problem: "Want to enable box for specific products"**

**Update specific products:**

```sql
-- Enable box for wholesale products
UPDATE products
SET sheets_per_box = 10
WHERE category_name = 'Wholesale'
  AND sheets_per_box <= 1;
```

---

## 💡 Best Practices

### **DO:**

✅ Use `pieces_per_sheet = 10` for standard blister packs  
✅ Use `sheets_per_box = 1` for retail-only products  
✅ Use `sheets_per_box > 1` only for wholesale/bulk items  
✅ Always keep stock in pieces (base unit)

### **DON'T:**

❌ Set `pieces_per_sheet = 0` (minimum is 1)  
❌ Set `sheets_per_box = 0` (minimum is 1)  
❌ Mix units in stock (always track in pieces)  
❌ Create box option if you don't sell boxes

---

## 📊 Database Schema Reference

```sql
CREATE TABLE products (
    -- ... other fields ...

    -- Packaging Configuration
    pieces_per_sheet INTEGER DEFAULT 1 CHECK (pieces_per_sheet > 0),
    sheets_per_box INTEGER DEFAULT 1 CHECK (sheets_per_box > 0),

    -- Inventory (always in pieces)
    stock_in_pieces INTEGER DEFAULT 0 CHECK (stock_in_pieces >= 0),

    -- ... other fields ...
);
```

---

## 🎓 Training Tips for Staff

### **For Inventory Managers:**

1. "We track everything in **pieces** (tablets/capsules)"
2. "A **sheet** is a blister pack (usually 10 pieces)"
3. "A **box** is for wholesale only (usually 10 sheets)"
4. "Most medicines: Set `pieces_per_sheet = 10`, `sheets_per_box = 1`"

### **For Cashiers:**

1. "Select the medicine"
2. "Choose how customer wants to buy: **Piece** or **Sheet**"
3. "Box option only appears for wholesale products"
4. "Price automatically calculates based on selection"

---

## 🔗 Related Files

- **POS Store Logic**: `src/stores/posStore.js` (lines 243-297)
- **Variant Modal**: `src/features/pos/components/VariantSelectionModal.jsx`
- **CSV Import**: `src/services/domains/inventory/csvImportService.js`
- **Product Form**: `src/components/forms/EnhancedProductForm.jsx`
- **Database Schema**: `database/COMPLETE_MEDCURE_MIGRATION.sql`

---

## 📞 Support

If you need to change between 2-tier and 3-tier systems, contact your system administrator.

**Last Updated**: October 7, 2025  
**Version**: 2.0  
**Status**: ✅ Production Ready
