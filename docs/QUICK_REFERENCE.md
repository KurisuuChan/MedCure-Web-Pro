# 🎯 QUICK REFERENCE: Variant Selection System

## 📦 How It Works

```
┌─────────────────────────────────────────────────────────┐
│                 PRODUCT CONFIGURATION                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  pieces_per_sheet = 10    →   Sheet option appears     │
│  sheets_per_box = 1       →   Box option HIDDEN        │
│                                                         │
│  Result: POS shows PIECE + SHEET only ✅                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 Visual Flow

```
CSV IMPORT
    ↓
┌─────────────────────────┐
│ Paracetamol (Biogesic)  │
│ pieces_per_sheet: 10    │
│ sheets_per_box: 1       │ ← This is KEY!
│ stock_in_pieces: 500    │
└─────────────────────────┘
    ↓
DATABASE
    ↓
┌─────────────────────────┐
│  POS Store Logic        │
│  getAvailableVariants() │
│                         │
│  IF sheets_per_box > 1  │
│    THEN show box ✅     │
│  ELSE                   │
│    hide box ❌          │
└─────────────────────────┘
    ↓
VARIANT MODAL
    ↓
┌───────────────────────────────┐
│  🔵 Piece  │  🟢 Sheet        │
│  ₱5.00     │  ₱50.00          │
│  500 avail │  50 available    │
└───────────────────────────────┘
          ↓
    Customer selects
          ↓
    Add to cart ✅
```

---

## ⚙️ Configuration Guide

### **Retail Mode** (Current Setup) ✅

```javascript
{
  pieces_per_sheet: 10,
  sheets_per_box: 1,    // ← This hides box option
  stock_in_pieces: 500
}

// POS Shows: Piece, Sheet
```

### **Wholesale Mode** (If Needed)

```javascript
{
  pieces_per_sheet: 10,
  sheets_per_box: 10,   // ← This enables box option
  stock_in_pieces: 1000
}

// POS Shows: Piece, Sheet, Box
```

---

## 🔧 Quick Fixes

### "Need box option for one product?"

```sql
UPDATE products
SET sheets_per_box = 10
WHERE id = 'product-uuid-here';
```

### "Want to disable box globally?"

```sql
UPDATE products
SET sheets_per_box = 1
WHERE sheets_per_box > 1;
```

---

## ✅ Checklist

- [x] POS logic working correctly
- [x] Database has safe defaults
- [x] Product form has helper text
- [x] CSV template updated
- [x] Documentation created
- [x] System optimized for retail

---

## 🎓 Remember

> **"sheets_per_box = 1" means "Don't show box option"**

This is **BY DESIGN**, not a bug! 🎉

---

**Last Updated**: October 7, 2025  
**Status**: Production Ready ✅
