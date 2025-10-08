# 🔍 CSV File Diagnostic Guide

## Common CSV Problems & Solutions

Based on your symptoms (no stock values, categories not created), here are the most likely issues:

---

## Problem 1: Missing or Incorrect Column Headers ❌

### ❌ Wrong Headers

```csv
name,brand,stock,category
Paracetamol,Biogesic,100,Pain Relief
```

### ✅ Correct Headers (Required)

```csv
generic_name,brand_name,stock_in_pieces,category_name
Paracetamol,Biogesic,100,Pain Relief
```

### 📋 Required Column Names:

- `generic_name` (NOT `name` or `generic`)
- `brand_name` (NOT `brand`)
- `stock_in_pieces` (NOT `stock`, `quantity`, or `stock_quantity`)
- `category_name` (NOT `category` or `type`)

---

## Problem 2: Empty Stock Cells ❌

### ❌ Empty Values

```csv
generic_name,brand_name,stock_in_pieces,category_name
Paracetamol,Biogesic,,Pain Relief          <-- Empty!
Amoxicillin,Amoxil,,Antibiotic             <-- Empty!
```

### ✅ Filled Values

```csv
generic_name,brand_name,stock_in_pieces,category_name
Paracetamol,Biogesic,100,Pain Relief
Amoxicillin,Amoxil,100,Antibiotic
```

**Why**: Empty cells are treated as 0. Now defaults to 100 after my fix, but old imports had 0.

---

## Problem 3: Wrong Category Format ❌

### ❌ Product Names as Categories

```csv
generic_name,category_name
Paracetamol,Paracetamol 500mg          <-- DON'T use product name!
Amoxicillin,Amoxicillin Capsule        <-- DON'T use product name!
```

### ✅ Proper Category Names

```csv
generic_name,category_name
Paracetamol,Pain Relief & Fever
Amoxicillin,Antibiotics
Cetirizine,Antihistamines
```

**Valid Categories** (from your system):

- Pain Relief & Fever
- Antibiotics
- Antihistamines
- Antifungal
- Vitamins & Supplements
- Cardiovascular
- Gastrointestinal
- Respiratory
- Dermatological
- Diabetes Management
- Iron Supplement
- Antihypertensive
- Cholesterol-lowering Agent
- Prokinetic Agent/Antiemetic
- ARB (Angiotensin Receptor Blocker)
- Antitussive/Cough Suppressant
- Statin/Cholesterol-lowering Agent

---

## Problem 4: Special Characters or Encoding Issues ❌

### ❌ Special Characters Causing Problems

```csv
generic_name,category_name
Paracetamol™,Pain Relief®           <-- Special symbols!
Amoxicillin®,Antibiotic™            <-- Can break parsing!
```

### ✅ Plain Text Only

```csv
generic_name,category_name
Paracetamol,Pain Relief
Amoxicillin,Antibiotic
```

---

## Problem 5: Inconsistent Separators ❌

### ❌ Mixed Separators

```csv
generic_name;brand_name,stock_in_pieces    <-- Mixing ; and ,
Paracetamol;Biogesic,100
```

### ✅ Consistent Commas

```csv
generic_name,brand_name,stock_in_pieces
Paracetamol,Biogesic,100
```

---

## 🔍 How to Check Your CSV File

### Step 1: Open in Text Editor

1. Right-click `DATA_PHARMACY.csv`
2. Select "Open with Notepad" (NOT Excel)
3. Check the first 3 lines

### Step 2: Verify Header Row

**First line should be:**

```
generic_name,brand_name,category_name,stock_in_pieces,price_per_piece,dosage_form,dosage_strength,drug_classification,supplier_name,description,pieces_per_sheet,sheets_per_box,reorder_level,cost_price,base_price,expiry_date,batch_number
```

### Step 3: Check Data Rows

**Look for:**

- ❌ Empty cells (two commas together: `,,`)
- ❌ Product names in category column
- ❌ Missing stock values
- ❌ Special characters or weird spacing

---

## 🛠️ Quick Fix Template

Here's a **minimal working CSV** you can use as a template:

```csv
generic_name,brand_name,category_name,stock_in_pieces,price_per_piece
Paracetamol,Biogesic,Pain Relief & Fever,100,2.50
Amoxicillin,Amoxil,Antibiotics,100,15.00
Cetirizine,Zyrtec,Antihistamines,100,8.50
Ibuprofen,Advil,Pain Relief & Fever,100,5.00
Omeprazole,Losec,Gastrointestinal,100,12.00
```

**Save this as `test_import.csv` and try importing it first!**

---

## 📊 Run This SQL to Check Your Data

After importing, run this in Supabase:

```sql
-- Check what was actually imported
SELECT
  generic_name,
  category,
  stock_in_pieces,
  CASE
    WHEN stock_in_pieces IS NULL THEN '❌ NULL STOCK'
    WHEN stock_in_pieces = 0 THEN '❌ ZERO STOCK'
    WHEN stock_in_pieces > 0 THEN '✅ HAS STOCK'
  END as stock_status,
  CASE
    WHEN category IS NULL THEN '❌ NO CATEGORY'
    WHEN category = generic_name THEN '❌ CATEGORY IS PRODUCT NAME!'
    ELSE '✅ VALID CATEGORY'
  END as category_status
FROM products
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 20;
```

---

## 🎯 Most Likely Issues in Your CSV

Based on your symptoms, I suspect:

1. **Header names don't match** exactly

   - You might have `stock` instead of `stock_in_pieces`
   - You might have `category` instead of `category_name`

2. **Stock column is empty**

   - Check if there are values after `stock_in_pieces,`
   - Look for patterns like `,,` (two commas = empty cell)

3. **Category column has product names**
   - Instead of "Pain Relief", you might have "Paracetamol 500mg"
   - System rejects product names as categories

---

## ✅ Action Steps

1. **Copy the first 5 lines of your CSV** and share them with me
2. Or **take a screenshot** of your CSV opened in Notepad
3. I'll tell you exactly what's wrong!

Example of what to share:

```
Line 1: generic_name,brand_name,stock_in_pieces,category_name
Line 2: Paracetamol,Biogesic,100,Pain Relief
Line 3: Amoxicillin,Amoxil,,Antibiotics
Line 4: ...
```

This will help me identify the exact problem! 🔍
