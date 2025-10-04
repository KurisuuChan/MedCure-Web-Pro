# 💊 **MedCure Pro - Enhanced CSV Import System Documentation**

## 📋 **Overview**
MedCure Pro now supports advanced CSV import functionality specifically designed for pharmacy inventory management. The system includes medicine-specific fields, intelligent field mapping, and comprehensive validation.

---

## 🆕 **New CSV Template Structure**

### **Required Fields**
| Field Name | Description | Example | Required |
|------------|-------------|---------|----------|
| `generic_name` | Generic medicine name | Paracetamol | ✅ Yes |
| `category_name` | Product category | Pain Relief | ✅ Yes |
| `price_per_piece` | Price per unit | 2.50 | ✅ Yes |

### **Medicine-Specific Fields**
| Field Name | Description | Example | Data Type |
|------------|-------------|---------|-----------|
| `brand_name` | Brand/trade name | Biogesic | Text |
| `dosage_strength` | Medicine strength | 500mg | Text |
| `dosage_form` | Form of medicine | Tablet, Capsule, Syrup | Enum |
| `drug_classification` | Legal classification | Prescription (Rx), OTC | Enum |
| `pharmacologic_category` | Drug category | Analgesic, Antibiotic | Text |
| `manufacturer` | Manufacturing company | Unilab, GSK | Text |
| `storage_conditions` | Storage requirements | Store at room temperature | Text |
| `registration_number` | FDA/DOH registration | FDA-OTC-2024-001234 | Text |

### **Business Fields**
| Field Name | Description | Example | Data Type |
|------------|-------------|---------|-----------|
| `supplier_name` | Supplier company | MediSupply Corp | Text |
| `description` | Product description | Pain relief medication | Text |
| `cost_price` | Purchase cost | 2.00 | Number |
| `base_price` | Base selling price | 2.25 | Number |
| `margin_percentage` | Profit margin % | 25.00 | Number |

### **Inventory Fields**
| Field Name | Description | Example | Data Type |
|------------|-------------|---------|-----------|
| `pieces_per_sheet` | Units per blister | 10 | Number |
| `sheets_per_box` | Blisters per box | 10 | Number |
| `stock_in_pieces` | Current stock | 1000 | Number |
| `reorder_level` | Minimum stock level | 100 | Number |
| `expiry_date` | Product expiry | 2025-12-31 | Date |
| `batch_number` | Batch identifier | BATCH-2024-001 | Text |

---

## 📝 **Valid Enum Values**

### **Dosage Forms**
- `Tablet`
- `Capsule`  
- `Syrup`
- `Injection`
- `Ointment`
- `Drops`
- `Inhaler`

### **Drug Classifications**
- `Prescription (Rx)` - Requires prescription
- `Over-the-Counter (OTC)` - Available without prescription
- `Controlled Substance` - Regulated substances

---

## 🔄 **Backward Compatibility**

The system supports both **old** and **new** CSV formats:

### **Old Format → New Format Mapping**
| Old Column | New Column | Notes |
|------------|------------|-------|
| `Product Name` | `generic_name` | Automatically mapped |
| `Brand` | `brand_name` | Automatically mapped |
| `Category` | `category_name` | Automatically mapped |
| `Price per Piece` | `price_per_piece` | Automatically mapped |
| `Stock (Pieces)` | `stock_in_pieces` | Automatically mapped |

---

## 📋 **Sample CSV Template**

```csv
generic_name,brand_name,category_name,supplier_name,description,dosage_strength,dosage_form,drug_classification,pharmacologic_category,price_per_piece,pieces_per_sheet,sheets_per_box,reorder_level,storage_conditions,manufacturer,registration_number,cost_price,base_price,margin_percentage,expiry_date,batch_number
Paracetamol,Biogesic,Pain Relief,MediSupply Corp,Analgesic and antipyretic for pain and fever relief,500mg,Tablet,Over-the-Counter (OTC),Analgesic,2.50,10,10,100,Store at room temperature below 25°C,Unilab,FDA-OTC-2024-001234,2.00,2.25,25.00,2025-12-31,BATCH-2024-001
Amoxicillin,Amoxil,Antibiotics,PharmaCorp Distributors,Broad-spectrum antibiotic for bacterial infections,500mg,Capsule,Prescription (Rx),Antibiotic,5.75,10,10,50,Store at room temperature below 25°C,GlaxoSmithKline,FDA-RX-2024-001234,4.60,5.18,25.00,2025-10-15,BATCH-2024-002
```

---

## 🛠 **Features**

### **1. Intelligent Field Mapping**
- Automatically detects old vs new CSV formats
- Maps similar field names (e.g., "Product Name" → "generic_name")
- Supports mixed column naming conventions

### **2. Comprehensive Validation**
- **Required Field Validation**: Ensures critical fields are present
- **Data Type Validation**: Numbers, dates, enums are properly validated
- **Enum Value Validation**: Validates against predefined lists
- **Date Format Validation**: Supports multiple date formats (YYYY-MM-DD, DD/MM/YYYY, etc.)
- **Business Logic Validation**: Ensures logical consistency

### **3. Enhanced Error Reporting**
- **Row-Level Errors**: Shows exactly which row has issues
- **Field-Level Details**: Specifies which field caused the error
- **Clear Error Messages**: User-friendly validation messages
- **Bulk Error Display**: Shows all errors at once for easy fixing

### **4. Smart Category Management**
- **Auto-Detection**: Finds new categories in CSV data
- **Approval Workflow**: Lets you approve new categories before import
- **Category Mapping**: Automatically links products to existing categories

---

## 📥 **How to Use**

### **Step 1: Download Template**
1. Go to Inventory page
2. Click "Import Products" button
3. Click "Download Template" to get the latest CSV format

### **Step 2: Prepare Your Data**
1. Fill in the CSV template with your product data
2. Ensure required fields are complete
3. Use valid enum values for dropdown fields
4. Format dates consistently

### **Step 3: Import Process**
1. Click "Import Products" in the Inventory page
2. Select your CSV file
3. Review any validation errors and fix them
4. Approve new categories if prompted
5. Preview your data before final import
6. Click "Import Products" to complete

### **Step 4: Verification**
1. Check the imported products in your inventory
2. Verify medicine details are correctly populated
3. Ensure categories were created/assigned properly

---

## ⚠️ **Common Issues & Solutions**

### **Issue: "Column does not exist" Error**
**Solution**: Make sure your database schema is updated by running the migration scripts:
1. Run `database/update_products_table_schema.sql`
2. Run `database/create_enhanced_search_functions.sql`

### **Issue: Invalid Enum Values**
**Solution**: Use only the predefined values:
- Dosage Form: Tablet, Capsule, Syrup, Injection, Ointment, Drops, Inhaler
- Drug Classification: Prescription (Rx), Over-the-Counter (OTC), Controlled Substance

### **Issue: Date Format Errors**
**Solution**: Use these supported formats:
- `YYYY-MM-DD` (recommended)
- `DD/MM/YYYY`
- `MM/DD/YYYY`
- `DD-MM-YYYY`

### **Issue: Number Validation Errors**
**Solution**: Ensure numeric fields contain valid numbers:
- No text in price fields
- No negative values for quantities
- Use decimal format for prices (e.g., 2.50, not 2.5)

---

## 🔧 **Technical Implementation**

### **Files Modified/Created**
1. **`public/product_template_v2.csv`** - Updated template with medicine fields
2. **`src/services/domains/inventory/csvImportService.js`** - New import service
3. **`src/components/ui/EnhancedImportModal.jsx`** - Updated import modal
4. **Database migrations** - Schema updates for new fields

### **Key Features**
- **Intelligent Field Mapping**: Handles both old and new CSV formats
- **Comprehensive Validation**: Medicine-specific validation rules
- **Error Handling**: Detailed error reporting and recovery
- **Backward Compatibility**: Works with existing CSV files

---

## 📊 **Import Statistics**

After import, the system provides:
- ✅ **Total rows processed**
- ✅ **Successfully imported items**
- ⚠️ **Validation errors found**
- 📋 **New categories created**
- 🔗 **Category mappings applied**

---

## 💡 **Best Practices**

1. **Always download the latest template** before creating CSV files
2. **Validate your data** in small batches first
3. **Use consistent naming** for categories and suppliers
4. **Include medicine details** for better inventory management
5. **Set appropriate reorder levels** based on usage patterns
6. **Keep batch numbers unique** for traceability

---

*Last Updated: October 3, 2025*
*Version: 2.0 - Enhanced Medicine Import System*