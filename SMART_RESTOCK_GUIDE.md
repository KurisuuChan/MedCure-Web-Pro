# Smart Restock CSV Template Guide

## 🚀 What's New: Smart Template

Your CSV template now **automatically shows all medicines that need restocking**! No more guessing what's low or out of stock.

## 📊 Smart Template Columns

When you download the template, you'll get:

| Column | Description | Example |
|--------|-------------|---------|
| `generic_name` | Medicine generic name | Paracetamol 500mg |
| `brand_name` | Medicine brand name | Biogesic |
| `current_stock` | Current quantity in stock | 5 |
| `minimum_stock` | Minimum required level | 20 |
| `stock_status` | OUT_OF_STOCK or LOW_STOCK | LOW_STOCK |
| `last_batch_expiry` | When last batch expires | 2025-03-15 |
| `suggested_quantity` | System suggested amount | 150 |
| `expiry_date` | New batch expiry (pre-filled) | 2025-12-31 |
| `quantity_to_add` | **YOU FILL THIS** | 100 |

## ✅ How to Use

### 1. **Download Smart Template**
- Click "Download Smart Restock Template"
- File automatically contains all medicines needing restock
- Shows current stock levels and suggestions

### 2. **Review & Fill Quantities**
- Look at `current_stock` vs `minimum_stock` 
- Check `suggested_quantity` for recommendations
- **Fill `quantity_to_add`** with amount you want to add
- Leave empty to skip that medicine

### 3. **Adjust Details (Optional)**
- Modify `expiry_date` if needed (keep YYYY-MM-DD format)
- All other columns are for reference only

### 4. **Upload & Import**
- Upload your completed CSV
- System processes only rows with `quantity_to_add` filled
- Get detailed success/failure report

## 🎯 Example Template Output

```csv
generic_name,brand_name,current_stock,minimum_stock,stock_status,last_batch_expiry,suggested_quantity,expiry_date,quantity_to_add
"Paracetamol 500mg","Biogesic",5,20,LOW_STOCK,2025-03-15,75,2025-12-31,100
"Amoxicillin 250mg","Amoxil",0,15,OUT_OF_STOCK,N/A,50,2025-11-30,200
"Metformin 500mg","Glucophage",8,25,LOW_STOCK,2025-04-20,100,2026-01-15,150
```

## 💡 Smart Features

### ✨ **Automatic Detection**
- Finds all OUT_OF_STOCK medicines (current_stock = 0)
- Finds all LOW_STOCK medicines (current_stock ≤ minimum_stock)
- No manual searching needed!

### 🧮 **Intelligent Suggestions**
- `suggested_quantity` calculated to reach double minimum stock
- `expiry_date` pre-filled with 6 months from today
- Shows current stock status for informed decisions

### 🎛️ **Flexible Usage**
- Fill only medicines you want to restock
- Adjust quantities based on your needs
- Skip items by leaving `quantity_to_add` empty

## 🔍 What Happens During Import

1. **Validation**: Checks medicine exists in system
2. **Quantity Check**: Only processes rows with quantity_to_add filled
3. **Batch Creation**: Auto-generates batch numbers
4. **Stock Update**: Adds quantity to current inventory
5. **Audit Trail**: Records import details

## 📋 Benefits

- **Save Time**: No manual stock checking needed
- **Never Miss**: Automatically finds everything needing restock  
- **Smart Suggestions**: Calculated recommendations
- **Complete Picture**: See current vs minimum stock levels
- **Flexible**: Choose what to restock and how much

Your restocking process is now **fully automated and intelligent**! 🎉