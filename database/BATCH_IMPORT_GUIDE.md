# Batch Management CSV Import Guide

## 📋 CSV Template Format

Your simplified CSV template contains only 4 essential columns:

```csv
generic_name,brand_name,expiry_date,stock_to_add
Paracetamol 500mg,Biogesic,2025-12-31,100
Ibuprofen 400mg,Advil,2025-11-30,50
Amoxicillin 500mg,Amoxil,2025-10-15,75
Metformin 500mg,Glucophage,2026-01-20,200
Losartan 50mg,Cozaar,2025-12-25,80
```

## 🔍 How It Works

### 1. **Medicine Matching**
- System automatically checks if the medicine exists in your inventory
- Matches by **exact** generic name AND brand name combination
- Case-insensitive matching (Paracetamol = paracetamol = PARACETAMOL)

### 2. **Automatic Features**
- **Batch Numbers**: Automatically generated (BT + Date + ID format)
- **Validation**: Checks for expired dates, invalid quantities
- **Error Reporting**: Shows exactly which rows failed and why

### 3. **Data Validation**
- ✅ **Generic Name**: Must match existing medicine in system
- ✅ **Brand Name**: Must match existing medicine in system  
- ✅ **Expiry Date**: Must be YYYY-MM-DD format and future date
- ✅ **Stock to Add**: Must be positive number

## 💡 Best Practices

### ✅ Do This:
- Use exact medicine names as they appear in your system
- Double-check expiry dates (YYYY-MM-DD format only)
- Use positive numbers for stock quantities
- Download the template from the system for proper format

### ❌ Avoid:
- Adding medicines not in your system (they'll be skipped)
- Past expiry dates
- Zero or negative stock quantities
- Incorrect date formats (like MM/DD/YYYY or DD-MM-YYYY)

## 🚀 Import Process

1. **Download Template**: Click "Download CSV Template" button
2. **Fill Data**: Add your batch information to the template
3. **Upload File**: Select your completed CSV file
4. **Preview**: System shows first 5 rows for verification
5. **Import**: Click "Import Batches" to process
6. **Review Results**: Check success/failure summary

## 📊 What Gets Created

For each successful row:
- ✅ New batch entry with auto-generated batch number
- ✅ Stock quantity added to medicine inventory
- ✅ Expiry date tracking enabled
- ✅ Import notes added for audit trail

## 🔧 Error Handling

Common errors and solutions:

| Error | Solution |
|-------|----------|
| "Medicine not found in system" | Check generic name and brand name spelling |
| "Invalid expiry date format" | Use YYYY-MM-DD format only |
| "Expiry date cannot be in the past" | Use future dates only |
| "Stock to add must be positive" | Use numbers > 0 |

## 📁 Files Created

- `batch_import_template_simple.csv` - Your new simple template
- Template includes 5 example rows for reference
- Download directly from the Batch Management page

This simplified approach makes bulk importing much faster and reduces errors!