# 🎯 CSV Import - Visual Quick Reference

## 🔥 Most Important: Only 1 Field Required!

```
✅ REQUIRED: generic_name
❌ THAT'S IT! Everything else is optional!
```

---

## 📊 CSV Template Structure

### Minimal Import (Just 1 Column!)

```csv
generic_name
Paracetamol
Aspirin
Vitamin C
```

**Result**: ✅ All 3 imported with smart defaults

### Recommended Import (5 Columns)

```csv
generic_name,brand_name,category_name,price_per_piece,stock_in_pieces
Paracetamol,Biogesic,Pain Relief,2.50,1000
Aspirin,Bayer,Pain Relief,3.00,500
Vitamin C,Cecon,Vitamins & Supplements,1.50,2000
```

**Result**: ✅ All complete with accurate data

### Full Import (All 17 Columns)

```csv
generic_name,brand_name,category_name,supplier_name,description,dosage_strength,dosage_form,drug_classification,price_per_piece,pieces_per_sheet,sheets_per_box,stock_in_pieces,reorder_level,cost_price,base_price,expiry_date,batch_number
Paracetamol,Biogesic,Pain Relief,MediSupply Corp,Pain and fever relief,500mg,Tablet,Over-the-Counter (OTC),2.50,10,10,1000,100,2.00,2.25,2025-12-31,BT100725-1
```

**Result**: ✅ Maximum detail, auto-calculates 25% margin

---

## 🎨 Color-Coded Fields

### 🔴 RED = Required (1 field)

```
generic_name
```

### 🔵 BLUE = Recommended (4 fields)

```
brand_name          → Defaults to generic_name if empty
price_per_piece     → Defaults to ₱1.00 if empty
category_name       → Defaults to "General" if empty
stock_in_pieces     → Defaults to 0 if empty
```

### 🟢 GREEN = Optional (12 fields)

```
supplier_name
description
dosage_strength     (e.g., 500mg)
dosage_form         (e.g., Tablet)
drug_classification (e.g., OTC)
pieces_per_sheet
sheets_per_box
reorder_level
cost_price          (for margin calculation)
base_price
expiry_date
batch_number
```

---

## ⚡ Smart Defaults Applied

| You Leave Empty     | System Fills With | Example                                |
| ------------------- | ----------------- | -------------------------------------- |
| brand_name          | = generic_name    | "Paracetamol" → "Paracetamol"          |
| price_per_piece     | = ₱1.00           | (empty) → "1.00"                       |
| category_name       | = "General"       | (empty) → "General"                    |
| stock_in_pieces     | = 0               | (empty) → "0"                          |
| pieces_per_sheet    | = 1               | (empty) → "1"                          |
| sheets_per_box      | = 1               | (empty) → "1"                          |
| reorder_level       | = 10              | (empty) → "10"                         |
| drug_classification | = "OTC"           | (empty) → "Over-the-Counter (OTC)"     |
| description         | Auto-generated    | (empty) → "Paracetamol - 500mg Tablet" |
| batch_number        | Auto-generated    | (empty) → "BT100725-1"                 |
| margin_percentage   | Auto-calculated   | cost:2.00, price:2.50 → "25%"          |

---

## 🎯 Examples: Minimal → Complete

### Example 1: Ultra Minimal

```csv
generic_name
Paracetamol
```

**Imported As:**

- generic_name: "Paracetamol"
- brand_name: "Paracetamol" ✨ auto
- category: "General" ✨ auto
- price_per_piece: ₱1.00 ✨ auto
- stock_in_pieces: 0 ✨ auto
- description: "Paracetamol" ✨ auto
- batch_number: "BT100725-1" ✨ auto

---

### Example 2: Basic

```csv
generic_name,brand_name,price_per_piece
Paracetamol,Biogesic,2.50
```

**Imported As:**

- generic_name: "Paracetamol"
- brand_name: "Biogesic"
- price_per_piece: ₱2.50
- category: "General" ✨ auto
- stock_in_pieces: 0 ✨ auto
- description: "Paracetamol" ✨ auto
- batch_number: "BT100725-1" ✨ auto

---

### Example 3: With Medicine Details

```csv
generic_name,brand_name,dosage_strength,dosage_form,price_per_piece
Paracetamol,Biogesic,500mg,Tablet,2.50
```

**Imported As:**

- generic_name: "Paracetamol"
- brand_name: "Biogesic"
- dosage_strength: "500mg"
- dosage_form: "Tablet"
- price_per_piece: ₱2.50
- description: "Paracetamol - 500mg Tablet" ✨ auto-generated!
- category: "General" ✨ auto
- stock_in_pieces: 0 ✨ auto
- batch_number: "BT100725-1" ✨ auto

---

### Example 4: With Pricing & Margins

```csv
generic_name,brand_name,cost_price,price_per_piece,stock_in_pieces
Paracetamol,Biogesic,2.00,2.50,1000
```

**Imported As:**

- generic_name: "Paracetamol"
- brand_name: "Biogesic"
- cost_price: ₱2.00
- price_per_piece: ₱2.50
- **margin_percentage: 25%** ✨ auto-calculated!
- stock_in_pieces: 1000
- category: "General" ✨ auto
- batch_number: "BT100725-1" ✨ auto

---

## 🚫 Common Mistakes

### ❌ Wrong

```csv
generic_name,price
Paracetamol,$2.50
```

**Error**: "price_per_piece must be a number (got: '$2.50')"

### ✅ Right

```csv
generic_name,price_per_piece
Paracetamol,2.50
```

---

### ❌ Wrong

```csv
generic_name,price_per_piece
,2.50
```

**Error**: "Missing required field: generic_name"

### ✅ Right

```csv
generic_name,price_per_piece
Paracetamol,2.50
```

---

### ❌ Wrong

```csv
generic_name,price_per_piece
Paracetamol,-5.00
```

**Error**: "price_per_piece must be greater than 0 (got: -5.00)"

### ✅ Right

```csv
generic_name,price_per_piece
Paracetamol,5.00
```

---

## 🎓 Pro Tips

### Tip 1: Let Defaults Work for You

```csv
generic_name
Paracetamol
Aspirin
Vitamin C
Ibuprofen
```

**Result**: 4 products imported instantly! Edit details later.

---

### Tip 2: Categories Auto-Created

```csv
generic_name,category_name
Paracetamol,Pain Relief
Amoxicillin,Antibiotics
Vitamin C,Vitamins
```

**Result**: System creates 3 new categories automatically!

---

### Tip 3: Automatic Margin Calculation

```csv
generic_name,cost_price,price_per_piece
Paracetamol,2.00,2.50
Aspirin,3.00,4.00
```

**Result**:

- Paracetamol: 25% margin ✨
- Aspirin: 33.33% margin ✨

---

### Tip 4: Flexible Date Formats

```csv
generic_name,expiry_date
Product A,2025-12-31
Product B,31/12/2025
Product C,12/31/2025
Product D,31.12.2025
```

**Result**: All 4 date formats recognized! ✅

---

## 📦 Real-World Example

**Your Pharmacy Has:**

- 50 different medicines
- Some with full details
- Some with just names

**Solution:**

```csv
generic_name,brand_name,category_name,price_per_piece,stock_in_pieces
Paracetamol,Biogesic,Pain Relief,2.50,1000
Aspirin,,Pain Relief,3.00,
Vitamin C,Cecon,Vitamins & Supplements,,2000
Ibuprofen,,,4.50,
Medicine XYZ,,,,
```

**Imported As:**

1. Paracetamol → Full details ✅
2. Aspirin → brand="Aspirin", stock=0 ✨
3. Vitamin C → price=₱1.00 ✨
4. Ibuprofen → brand="Ibuprofen", category="General", stock=0 ✨
5. Medicine XYZ → All defaults applied ✨

**All 5 products imported successfully!** 🎉

---

## 🎯 Quick Decision Tree

```
Do you have the product name?
├─ YES → You can import! ✅
└─ NO  → Cannot import ❌

Do you have the price?
├─ YES → Great! Use it
└─ NO  → System uses ₱1.00 (edit later)

Do you have the category?
├─ YES → Great! System creates if new
└─ NO  → System uses "General"

Do you have stock quantity?
├─ YES → Great! Use it
└─ NO  → System uses 0 (add stock later)

Do you have dosage details?
├─ YES → Great! Full medicine tracking
└─ NO  → Still works! Add later if needed
```

---

## ✅ Success Checklist

Before importing:

- [ ] At minimum, generic_name is filled for all products
- [ ] Numbers don't have currency symbols ($, ₱)
- [ ] Numbers use dots not commas (2.50 not 2,50)
- [ ] Dates in supported format (YYYY-MM-DD recommended)
- [ ] File saved as .csv (not .xlsx)

---

## 🎉 Bottom Line

**Minimum effort**: Just product names → System fills everything else  
**Maximum result**: 99% accurate inventory with smart defaults  
**Time saved**: Hours of manual data entry → Minutes of CSV import

**Start with the basics, perfect later!** 🚀
