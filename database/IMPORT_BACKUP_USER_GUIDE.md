# 📖 Import Backup Feature - Quick User Guide

## 🎯 How to Import Your Downloaded JSON Backup

This guide shows you exactly how to import a backup file that you previously downloaded from MedCure.

---

## 📋 Prerequisites

Before you start, make sure you have:

- ✅ A MedCure backup JSON file on your computer
- ✅ File name format: `medcure-backup-YYYY-MM-DDTHH-MM-SS-MMMZ.json`
- ✅ File size: Typically 2-5 MB
- ✅ Browser: Chrome, Firefox, Safari, or Edge

---

## 🚀 Step-by-Step Instructions

### Step 1: Navigate to System Settings

1. Open MedCure Pharmacy System
2. Log in as Admin
3. Click **"Settings"** in the left sidebar
4. Scroll down to **"Security & Backup"** section

You'll see the **Backup Management** area with 4 buttons:

```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│  Create  │ │ Download │ │  Import  │ │ Restore  │
│  Backup  │ │  Backup  │ │  Backup  │ │  Backup  │
│   Blue   │ │  Green   │ │  Orange  │ │  Purple  │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

---

### Step 2: Click Import Backup (Orange Button)

Click the **orange "Import Backup"** button (3rd button from left).

This will open the **Import Backup Modal** with an orange gradient header.

---

### Step 3: Upload Your Backup File

You have two options:

#### Option A: Click to Upload

1. Click anywhere in the **dashed border box**
2. File picker opens
3. Navigate to your backup file
4. Select the JSON file
5. Click **"Open"**

#### Option B: Drag & Drop (Visual)

1. Find your backup JSON file on your computer
2. Drag it to the dashed border box
3. Drop it

**What the upload zone looks like:**

```
┌─────────────────────────────────────┐
│                                     │
│           📄 FileJson Icon          │
│                                     │
│     Click to upload or drag here    │
│                                     │
│         JSON backup files only      │
│                                     │
└─────────────────────────────────────┘
```

---

### Step 4: Verify Selected File

After selecting a file, you'll see a **green box** appear with:

```
┌────────────────────────────────────────┐
│ 📄 medcure-backup-2025-01-15...json  ❌│
│ 2.34 MB                                │
└────────────────────────────────────────┘
```

**Check:**

- ✅ File name is correct
- ✅ File size looks right (2-5 MB typical)
- ✅ It's a `.json` file

**Wrong file?** Click the ❌ to remove it and select another.

---

### Step 5: Review "What Happens After Import"

The modal shows 4 steps that will happen:

1. **🔍 File Validation**

   - System checks file integrity and format

2. **💾 Local Storage**

   - Backup is stored locally in your browser

3. **📊 Backup Info Updated**

   - Latest backup info will be displayed

4. **🔄 Ready to Restore**
   - Use "Restore Backup" to apply the imported data

---

### Step 6: Read Security Note

**Important Security Warning:**

```
┌─────────────────────────────────────────┐
│ 🛡️ Security Note                        │
│                                         │
│ Only import backup files from trusted  │
│ sources. Corrupted or malicious files  │
│ may cause data issues.                 │
└─────────────────────────────────────────┘
```

**Make sure:**

- ✅ The file is from your own download
- ✅ The file hasn't been modified
- ✅ You trust the source

---

### Step 7: Click "Import Backup" Button

At the bottom of the modal:

```
┌──────────┐              ┌──────────────────┐
│  Cancel  │              │  Import Backup   │
└──────────┘              └──────────────────┘
                              (Orange)
```

1. Click the **orange "Import Backup"** button
2. Button shows **"Importing..."** with spinner
3. Wait 1-2 seconds for validation

---

### Step 8: Success! 🎉

You'll see a success alert:

```
✅ Backup Imported Successfully!

Timestamp: Jan 15, 2025, 10:30:00 AM
Total Records: 477
Tables: 7

You can now use the "Restore Backup" feature
to apply this data.
```

**What happened:**

- ✅ File validated successfully
- ✅ Backup stored in localStorage
- ✅ Last backup info updated
- ✅ Download & Restore buttons enabled

---

### Step 9: Verify Import (Optional)

Check that the import worked:

1. Modal closes automatically
2. Look at **"Last backup:"** info at top of Backup Management
3. You should see:
   ```
   Last backup: Jan 15, 2025, 10:30:00 AM (477 records)
   ```
4. **Download Backup** button (green) is now **enabled**
5. **Restore Backup** button (purple) is now **enabled**

---

### Step 10: Restore Imported Backup (Optional)

If you want to actually restore the data:

1. Click the **purple "Restore Backup"** button
2. Review the backup information
3. Read the **RED warning boxes** carefully
4. Follow the restoration instructions
5. Your data will be restored

---

## ❌ Troubleshooting Common Errors

### Error 1: "Please select a backup file to import"

**Cause:** No file selected  
**Solution:** Click the upload zone and select a file

---

### Error 2: "Invalid JSON file or corrupted backup"

**Causes:**

- File is not valid JSON
- File is corrupted
- File is not a MedCure backup

**Solutions:**

1. Check the file extension is `.json`
2. Try opening the file in a text editor to verify it's valid JSON
3. Re-download the original backup file
4. Make sure you didn't accidentally modify the file

---

### Error 3: "Invalid backup file structure. Missing required fields."

**Cause:** File is missing required fields (`timestamp`, `tables`, or `totalRecords`)

**Solution:**

- Use a backup file created by MedCure's "Create Backup" feature
- Don't edit the backup file manually

---

### Error 4: "Invalid MedCure backup file. Missing required data tables."

**Cause:** File doesn't have `products` or `categories` tables

**Solution:**

- Verify you selected a MedCure backup file
- Not all JSON files are MedCure backups
- Check the file was created by MedCure's backup system

---

## 🎯 Use Cases

### Use Case 1: Restore After Browser Clear

**Scenario:** You cleared your browser data accidentally

**Steps:**

1. Have your backup file ready (from previous download)
2. Follow Steps 1-8 above to import
3. Click **Restore Backup** to apply data
4. Your data is back! ✅

---

### Use Case 2: Move to New Computer

**Scenario:** Setting up MedCure on a new computer

**Steps:**

1. Copy backup file to new computer
2. Open MedCure on new computer
3. Import the backup file (Steps 1-8)
4. Restore the backup
5. Continue working with your data ✅

---

### Use Case 3: Disaster Recovery

**Scenario:** System crashed, data lost

**Steps:**

1. Access your backup file (external storage, USB, cloud)
2. Import the backup (Steps 1-8)
3. Restore to recover your data
4. Back to business! ✅

---

### Use Case 4: Switch Browsers

**Scenario:** Moving from Chrome to Firefox

**Steps:**

1. In Chrome: Download backup
2. In Firefox: Import that backup
3. Restore the data
4. All data transferred! ✅

---

## 📊 What Gets Imported

Your backup file contains data from **7 database tables**:

| Table           | Typical Records | What It Contains           |
| --------------- | --------------- | -------------------------- |
| products        | 373             | Medicine inventory         |
| categories      | 94              | Product categories         |
| customers       | 3               | Customer information       |
| sales           | 3               | Sales transactions         |
| users           | 4               | System users               |
| inventory_logs  | 0               | Stock movement logs        |
| system_settings | 0               | System configuration       |
| **TOTAL**       | **~477**        | **All your pharmacy data** |

---

## 🔒 Security Best Practices

### ✅ DO:

- ✅ Only import files you personally downloaded from MedCure
- ✅ Store backup files in secure locations
- ✅ Keep multiple backup versions (daily, weekly)
- ✅ Test imports on a test system first (if available)
- ✅ Verify file size matches expected size (~2-5 MB)

### ❌ DON'T:

- ❌ Import files from untrusted sources
- ❌ Import files sent via email (unless verified)
- ❌ Edit backup files manually
- ❌ Share backup files publicly
- ❌ Import files from unknown origins

---

## 💡 Pro Tips

### Tip 1: Name Your Backups

The default name is:

```
medcure-backup-2025-01-15T10-30-00-123Z.json
```

You can rename it (keep the `.json` extension):

```
medcure-backup-before-major-update-jan-15.json
medcure-backup-end-of-month-january.json
medcure-backup-good-working-state.json
```

### Tip 2: Keep Multiple Backups

Don't overwrite old backups! Keep:

- Daily backups (last 7 days)
- Weekly backups (last 4 weeks)
- Monthly backups (last 12 months)

### Tip 3: External Storage

Store backups on:

- ☁️ Cloud storage (Google Drive, Dropbox)
- 💾 External hard drive
- 🔌 USB flash drive
- 📧 Email to yourself (encrypted)

### Tip 4: Test Restores

Occasionally test your backup files:

1. Import the backup
2. Verify the data looks correct
3. This ensures your backups are valid

### Tip 5: Document Your Backups

Keep a log:

```
Backup Log:
- 2025-01-15 10:30 AM - 477 records - Stored in Google Drive ✅
- 2025-01-16 10:30 AM - 480 records - Stored in USB drive ✅
- 2025-01-17 10:30 AM - 485 records - Stored in Dropbox ✅
```

---

## 📞 Need Help?

### Quick Checklist

- [ ] File is `.json` format
- [ ] File name starts with `medcure-backup-`
- [ ] File size is 2-5 MB
- [ ] File created by MedCure backup feature
- [ ] File not manually edited
- [ ] Browser: Chrome/Firefox/Safari/Edge

### Still Having Issues?

1. **Try another browser**: Sometimes browser issues occur
2. **Clear cache**: Ctrl+Shift+Delete → Clear cache
3. **Check file**: Open in text editor, should start with `{`
4. **Re-download**: Get a fresh copy of the backup file
5. **Contact support**: Provide error message details

---

## 🎓 Summary

**Importing a backup is easy:**

1. ⚙️ **Open System Settings** → Security & Backup
2. 🟠 **Click Import Backup** (orange button)
3. 📁 **Select your JSON file** (click or drag)
4. ✅ **Verify file** (green box shows details)
5. 🚀 **Click Import Backup** (in modal)
6. ⏳ **Wait 1-2 seconds** (validation)
7. 🎉 **Success!** (alert confirms import)
8. 🔄 **Optional: Restore** (purple button)

**Total time:** Less than 1 minute! ⚡

---

## 🆘 Emergency Quick Start

**Need to restore data NOW?**

```
1. Find your backup file (.json)
2. Settings → Security & Backup
3. Click orange "Import Backup"
4. Choose file
5. Click "Import Backup" in modal
6. Click purple "Restore Backup"
7. Done! ✅
```

---

_MedCure Pharmacy System - Backup Management_  
_Version 2.0.0 - January 2025_  
_Feature: Import Backup ✅_
