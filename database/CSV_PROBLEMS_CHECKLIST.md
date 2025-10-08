# 🎯 CSV PROBLEMS - What to Check

## Based on your symptoms, here's what's wrong:

### Problem 1: Stock Column is Empty or Wrong Name ❌

**Check these in your CSV:**

1. **Column header must be EXACTLY:** `stock_in_pieces`

   - ❌ NOT `stock`
   - ❌ NOT `quantity`
   - ❌ NOT `stock_quantity`
   - ❌ NOT `Stock_In_Pieces` (case matters!)
   - ✅ YES `stock_in_pieces`

2. **Column has empty cells** (between commas: `,,`)
   - My fix now defaults empty to 100
   - But old imports defaulted to 0

### Problem 2: Category Column Issues ❌

**Common mistakes:**

1. **Column header must be:** `category_name`

   - ❌ NOT `category`
   - ❌ NOT `type`
   - ✅ YES `category_name`

2. **Using product names as categories:**

   ```
   WRONG:
   generic_name,category_name
   Paracetamol,Paracetamol 500mg Tablet   <-- Product name!

   CORRECT:
   generic_name,category_name
   Paracetamol,Pain Relief & Fever         <-- Category!
   ```

3. **Typos in category names:**

   ```
   WRONG: "Antibiotic" (missing 's')
   CORRECT: "Antibiotics"

   WRONG: "Pain Relief"
   CORRECT: "Pain Relief & Fever"
   ```

---

## 🔧 Quick Diagnosis Tools

### Tool 1: Use the CSV Validator (EASIEST!)

1. Open `csv-validator.html` in your browser
2. Drag and drop your CSV file
3. It will show you EXACTLY what's wrong!

### Tool 2: Open CSV in Notepad

1. Right-click `DATA_PHARMACY.csv`
2. "Open with" → Notepad
3. Look at line 1 (headers)
4. Share the first 3 lines with me

### Tool 3: Check in Excel

1. Open CSV in Excel
2. Look for columns named exactly: `stock_in_pieces` and `category_name`
3. Check if cells are empty in those columns

---

## ✅ What Your CSV Headers Should Look Like

```csv
generic_name,brand_name,category_name,stock_in_pieces,price_per_piece,dosage_form,dosage_strength,drug_classification
```

**Example correct row:**

```csv
Paracetamol,Biogesic,Pain Relief & Fever,100,2.50,Tablet,500mg,Over-the-Counter (OTC)
```

**Example WRONG row (common mistakes):**

```csv
Paracetamol,Biogesic,Paracetamol 500mg,,2.50,Tablet,500mg,OTC
                     ^^^^^^^^^^^^^^^  ^^
                     Product name!    Empty stock!
```

---

## 🚀 Next Steps

**Choose ONE:**

### Option A: Use the Validator Tool (Recommended)

1. Open `csv-validator.html` in browser
2. Upload your CSV
3. Fix the issues it finds
4. Re-import

### Option B: Share First 3 Lines with Me

Copy and paste the first 3 lines of your CSV here (open in Notepad first):

```
Line 1: [paste here]
Line 2: [paste here]
Line 3: [paste here]
```

### Option C: Use the Template

I created a working CSV template in the diagnostic guide. Try importing that first to see if the system works.

---

## 💡 Most Common Issues (90% of problems):

1. ❌ Header is `stock` not `stock_in_pieces`
2. ❌ Header is `category` not `category_name`
3. ❌ Stock column cells are empty
4. ❌ Category column has product names instead of categories
5. ❌ Extra spaces in header names (`stock_in_pieces` with spaces)

---

## 📊 After You Fix the CSV

Run this SQL to verify:

```sql
SELECT
  generic_name,
  category AS "What was imported",
  stock_in_pieces AS "Stock",
  CASE
    WHEN category = generic_name THEN '❌ CATEGORY IS PRODUCT NAME!'
    WHEN stock_in_pieces = 0 THEN '❌ NO STOCK'
    ELSE '✅ OK'
  END as status
FROM products
WHERE created_at > NOW() - INTERVAL '10 minutes'
LIMIT 10;
```

Use the **CSV Validator tool** or **share the first 3 lines** with me! 🔍
