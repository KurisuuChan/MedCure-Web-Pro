// =============================================================================
// MEDCURE CSV IMPORT SERVICE
// =============================================================================
// Purpose: Handle CSV import with medicine-specific validation
// Features: Auto-create new dosage forms and drug classifications
// Date: October 6, 2025
// Author: System Architect
// =============================================================================

import { parseFlexibleDate, isDateNotInPast, getDateFormatErrorMessage } from "../../../utils/dateParser";
import { logDebug, handleError } from "../../core/serviceUtils";
import { supabase } from "../../../config/supabase";

export class CSVImportService {
  // Medicine-specific field mappings for both old and new formats
  static FIELD_MAPPINGS = {
    // Primary medicine fields (new format)
    generic_name: ['generic_name', 'Product Name', 'name'],
    brand_name: ['brand_name', 'Brand', 'brand'],
    category_name: ['category_name', 'Category', 'category'],
    
    // Medicine details
    dosage_strength: ['dosage_strength', 'Dosage Strength', 'strength'],
    dosage_form: ['dosage_form', 'Dosage Form', 'form'],
    drug_classification: ['drug_classification', 'Drug Classification', 'classification'],
    
    // Basic product fields
    description: ['description', 'Description'],
    supplier_name: ['supplier_name', 'Supplier', 'supplier'],
    
    // Pricing fields
    price_per_piece: ['price_per_piece', 'Price per Piece', 'price'],
    cost_price: ['cost_price', 'Cost Price'],
    base_price: ['base_price', 'Base Price'],
    
    // Package structure
    pieces_per_sheet: ['pieces_per_sheet', 'Pieces per Sheet'],
    sheets_per_box: ['sheets_per_box', 'Sheets per Box'],
    
    // Inventory fields
    stock_in_pieces: ['stock_in_pieces', 'Stock (Pieces)', 'stock'],
    reorder_level: ['reorder_level', 'Reorder Level'],
    
    // Date fields
    expiry_date: ['expiry_date', 'Expiry Date'],
    batch_number: ['batch_number', 'Batch Number'],
  };

  // Valid enum values (will be checked dynamically)
  static ENUM_VALUES = {
    dosage_form: ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops', 'Inhaler'],
    drug_classification: ['Prescription (Rx)', 'Over-the-Counter (OTC)', 'Controlled Substance']
  };

  // Required fields for validation
  static REQUIRED_FIELDS = [
    { name: 'generic_name', required: true },
  ];

  // Optional fields with validation rules
  static OPTIONAL_FIELDS = [
    { name: 'brand_name', required: false },
    { name: 'category_name', required: false },
    { name: 'price_per_piece', required: false, type: 'number', min: 0 },
    { name: 'dosage_strength', required: false },
    { name: 'dosage_form', required: false, enum: 'dosage_form', auto_create: true },
    { name: 'drug_classification', required: false, enum: 'drug_classification', auto_create: true },
    { name: 'pieces_per_sheet', required: false, type: 'number', min: 1 },
    { name: 'sheets_per_box', required: false, type: 'number', min: 1 },
    { name: 'reorder_level', required: false, type: 'number', min: 0 },
    { name: 'cost_price', required: false, type: 'number', min: 0 },
    { name: 'base_price', required: false, type: 'number', min: 0 },
    { name: 'stock_in_pieces', required: false, type: 'number', min: 0 },
  ];

  /**
   * Parse CSV content with intelligent field mapping
   * @param {string} csvText - Raw CSV content
   * @returns {Array} Parsed data with normalized field names
   */
  static parseCSV(csvText) {
    try {
      logDebug('Parsing CSV with intelligent field mapping');
      
      const lines = csvText.trim().split('\n');
      if (lines.length < 2) {
        throw new Error('CSV must have at least a header row and one data row');
      }

      // Improved CSV parsing to handle quoted values properly
      const parseCSVLine = (line) => {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          
          if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
              // Handle escaped quotes
              current += '"';
              i++; // Skip next quote
            } else {
              // Toggle quote state
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            // End of field
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        
        // Add last field
        values.push(current.trim());
        return values;
      };

      const rawHeaders = parseCSVLine(lines[0]);
      const normalizedHeaders = this.normalizeHeaders(rawHeaders);
      
      logDebug('Normalized headers:', normalizedHeaders);

      const data = lines.slice(1).map((line, index) => {
        const values = parseCSVLine(line);
        const row = {};
        
        // Debug logging for problematic rows
        if (values.length !== rawHeaders.length) {
          console.warn(`⚠️ Row ${index + 2}: Expected ${rawHeaders.length} fields, got ${values.length} fields`);
          console.warn(`⚠️ Row data:`, values);
        }
        
        rawHeaders.forEach((header, i) => {
          const normalizedHeader = normalizedHeaders[i];
          if (normalizedHeader) {
            row[normalizedHeader] = values[i] || '';
          }
        });
        
        return row;
      }).filter((row, index) => {
        // Filter out rows where generic_name is empty or contains comma-separated data
        const genericName = row.generic_name?.trim();
        if (!genericName) {
          console.warn(`⚠️ Skipping row ${index + 2}: Missing generic_name`);
          return false;
        }
        
        // Check if generic_name contains what looks like CSV data (multiple commas)
        if (genericName.includes(',') && genericName.split(',').length > 3) {
          console.warn(`⚠️ Skipping row ${index + 2}: Malformed data in generic_name field: ${genericName.substring(0, 50)}...`);
          return false;
        }
        
        // Additional check for brand_name - if it's empty but we have other data, use generic_name
        if (!row.brand_name?.trim() && row.generic_name?.trim()) {
          console.warn(`⚠️ Row ${index + 2}: Empty brand_name, will use generic_name as fallback`);
        }
        
        return true;
      });

      logDebug(`Successfully parsed ${data.length} rows`);
      return data;
    } catch (error) {
      handleError(error, 'Parse CSV');
      throw error;
    }
  }

  /**
   * Normalize headers to standard field names
   * @param {Array} rawHeaders - Original CSV headers
   * @returns {Array} Normalized header names
   */
  static normalizeHeaders(rawHeaders) {
    return rawHeaders.map(header => {
      const headerLower = header.toLowerCase().trim();
      
      // Find matching standard field name
      for (const [standardName, variations] of Object.entries(this.FIELD_MAPPINGS)) {
        for (const variation of variations) {
          if (headerLower === variation.toLowerCase()) {
            return standardName;
          }
        }
      }
      
      // Return original header if no mapping found
      return header;
    });
  }

  /**
   * Auto-create enum value if it doesn't exist
   * @param {string} enumType - Type of enum (dosage_form or drug_classification)
   * @param {string} value - Value to add
   * @returns {Promise<boolean>} Success status
   */
  static async autoCreateEnumValue(enumType, value) {
    try {
      if (!value || !value.trim()) return false;
      
      const cleanValue = value.trim();
      
      // Check if value already exists in our static list
      if (this.ENUM_VALUES[enumType] && this.ENUM_VALUES[enumType].includes(cleanValue)) {
        return true; // Already exists
      }
      
      // Try to add to database enum
      let functionName;
      if (enumType === 'dosage_form') {
        functionName = 'add_dosage_form_value';
      } else if (enumType === 'drug_classification') {
        functionName = 'add_drug_classification_value';
      } else {
        return false;
      }
      
      const { data, error } = await supabase.rpc(functionName, {
        new_value: cleanValue
      });
      
      if (error) {
        console.warn(`⚠️ Could not add ${enumType} value "${cleanValue}":`, error);
        return false;
      }
      
      // Add to our static list for this session
      if (data) {
        this.ENUM_VALUES[enumType].push(cleanValue);
        console.log(`✅ Auto-created new ${enumType}: ${cleanValue}`);
      }
      
      return true;
      
    } catch (error) {
      console.warn(`⚠️ Error auto-creating ${enumType} value:`, error);
      return false;
    }
  }

  /**
   * Validate CSV data with medicine-specific rules and auto-creation
   * @param {Array} data - Parsed CSV data
   * @returns {Promise<Object>} Validation result with valid data and errors
   */
  static async validateData(data) {
    const validationErrors = [];
    const validData = [];
    const newEnumValues = [];

    const allFields = [...this.REQUIRED_FIELDS, ...this.OPTIONAL_FIELDS];

    // First pass: collect unique enum values and try to auto-create them
    const uniqueValues = { dosage_form: new Set(), drug_classification: new Set() };
    
    data.forEach(row => {
      if (row.dosage_form && row.dosage_form.trim()) {
        uniqueValues.dosage_form.add(row.dosage_form.trim());
      }
      if (row.drug_classification && row.drug_classification.trim()) {
        uniqueValues.drug_classification.add(row.drug_classification.trim());
      }
    });

    // Try to auto-create new enum values
    for (const form of uniqueValues.dosage_form) {
      const created = await this.autoCreateEnumValue('dosage_form', form);
      if (created && !this.ENUM_VALUES.dosage_form.includes(form)) {
        newEnumValues.push({ type: 'dosage_form', value: form });
      }
    }

    for (const classification of uniqueValues.drug_classification) {
      const created = await this.autoCreateEnumValue('drug_classification', classification);
      if (created && !this.ENUM_VALUES.drug_classification.includes(classification)) {
        newEnumValues.push({ type: 'drug_classification', value: classification });
      }
    }

    // Second pass: validate each row (now with updated enum values)
    data.forEach((row, index) => {
      const rowErrors = [];

      // Validate all fields
      allFields.forEach(({ name, required, type, min, max, enum: enumType, auto_create }) => {
        const value = row[name];

        // Check required fields
        if (required && (!value || value === '')) {
          rowErrors.push(`${name} is required`);
          return;
        }

        // Skip validation for empty optional fields
        if (!value || value === '') return;

        // Validate number fields
        if (type === 'number') {
          const numValue = parseFloat(value);
          if (isNaN(numValue)) {
            rowErrors.push(`${name} must be a valid number`);
          } else {
            if (min !== undefined && numValue < min) {
              rowErrors.push(`${name} must be at least ${min}`);
            }
            if (max !== undefined && numValue > max) {
              rowErrors.push(`${name} must be at most ${max}`);
            }
            // Special validation for price_per_piece - must be > 0
            if (name === 'price_per_piece' && numValue <= 0) {
              rowErrors.push(`${name} must be greater than 0`);
            }
          }
        }

        // Validate enum fields (now more lenient with auto-creation)
        if (enumType && this.ENUM_VALUES[enumType]) {
          if (!this.ENUM_VALUES[enumType].includes(value)) {
            if (auto_create) {
              // For auto-create fields, just warn but don't fail validation
              console.warn(`⚠️ New ${enumType} value "${value}" will be auto-created`);
            } else {
              rowErrors.push(`${name} must be one of: ${this.ENUM_VALUES[enumType].join(', ')}`);
            }
          }
        }
      });

      // Validate expiry date
      if (row.expiry_date && row.expiry_date !== '') {
        const dateResult = parseFlexibleDate(row.expiry_date);
        if (!dateResult.isValid) {
          rowErrors.push(getDateFormatErrorMessage(row.expiry_date));
        } else if (dateResult.date && !isDateNotInPast(dateResult.date)) {
          rowErrors.push('Cannot import expired medicine - expiry date must be in the future');
        }
      }

      if (rowErrors.length > 0) {
        validationErrors.push(`Row ${index + 2}: ${rowErrors.join(', ')}`);
      } else {
        validData.push(this.transformRowForDatabase(row, index));
      }
    });

    return {
      validData,
      validationErrors,
      totalRows: data.length,
      validRows: validData.length,
      errorRows: validationErrors.length,
      newEnumValues, // List of auto-created enum values
      addedEnumCount: newEnumValues.length
    };
  }

  /**
   * Generate batch number in BTMMDDYY-X format
   * @param {number} index - Row index for incremental numbering
   * @returns {string} Batch number in BTMMDDYY-X format
   */
  static generateBatchNumber(index) {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    
    // Add incremental number starting from 1
    const incrementalNumber = index + 1;
    
    return `BT${month}${day}${year}-${incrementalNumber}`;
  }

  /**
   * Transform row data for database insertion
   * @param {Object} row - Raw row data
   * @param {number} index - Row index for generating batch numbers
   * @returns {Object} Transformed row ready for database
   */
  static transformRowForDatabase(row, index) {
    const transformed = {
      // Primary fields
      generic_name: row.generic_name.trim(),
      brand_name: (row.brand_name && row.brand_name.trim()) ? row.brand_name.trim() : row.generic_name.trim(),
      description: row.description ? row.description.trim() : '',
      category: row.category_name ? row.category_name.trim() : 'General',
      
      // Medicine-specific fields
      dosage_form: row.dosage_form || null,
      dosage_strength: row.dosage_strength || null,
      drug_classification: row.drug_classification || null,
      
      // Pricing fields
      price_per_piece: row.price_per_piece ? parseFloat(row.price_per_piece) : 1.00,
      cost_price: row.cost_price ? parseFloat(row.cost_price) : null,
      base_price: row.base_price ? parseFloat(row.base_price) : null,
      
      // Package structure
      pieces_per_sheet: row.pieces_per_sheet ? parseInt(row.pieces_per_sheet) : 1,
      sheets_per_box: row.sheets_per_box ? parseInt(row.sheets_per_box) : 1,
      
      // Inventory fields
      stock_in_pieces: row.stock_in_pieces ? parseInt(row.stock_in_pieces) : 0,
      reorder_level: row.reorder_level ? parseInt(row.reorder_level) : 10,
      supplier: row.supplier_name ? row.supplier_name.trim() : '',
      
      // Date fields
      expiry_date: row.expiry_date ? parseFlexibleDate(row.expiry_date).isoString : null,
      batch_number: row.batch_number ? row.batch_number.trim() : this.generateBatchNumber(index),
      
      // Status fields
      is_active: true,
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    logDebug('Transformed row:', transformed);
    return transformed;
  }

  /**
   * Generate sample CSV content for download
   * @returns {string} Sample CSV content
   */
  static generateSampleCSV() {
    const headers = [
      'generic_name', 'brand_name', 'category_name', 'supplier_name', 'description',
      'dosage_strength', 'dosage_form', 'drug_classification',
      'price_per_piece', 'pieces_per_sheet', 'sheets_per_box', 'stock_in_pieces', 'reorder_level',
      'cost_price', 'base_price', 'expiry_date', 'batch_number'
    ];

    const sampleRows = [
      [
        'Paracetamol', 'Biogesic', 'Pain Relief', 'MediSupply Corp',
        'Analgesic and antipyretic for pain and fever relief',
        '500mg', 'Tablet', 'Over-the-Counter (OTC)',
        '2.50', '10', '10', '1000', '100',
        '2.00', '2.25', '2025-12-31', 'BT100425-1'
      ],
      [
        'Amoxicillin', 'Amoxil', 'Antibiotics', 'PharmaCorp Distributors',
        'Broad-spectrum antibiotic for bacterial infections',
        '500mg', 'Capsule', 'Prescription (Rx)',
        '5.75', '10', '10', '500', '50',
        '4.60', '5.18', '2025-10-15', 'BT100425-2'
      ],
      [
        'Ascorbic Acid', 'Cecon', 'Vitamins & Supplements', 'VitaCorp International',
        'Essential vitamin for immune system support',
        '500mg', 'Tablet', 'Over-the-Counter (OTC)',
        '1.25', '20', '10', '2000', '200',
        '1.00', '1.13', '2025-06-30', 'BT100425-3'
      ]
    ];

    return [headers.join(','), ...sampleRows.map(row => row.join(','))].join('\n');
  }

  /**
   * Download sample CSV template
   * @param {string} filename - Optional filename for download
   */
  static downloadTemplate(filename = 'medcure_pharmacy_import_template.csv') {
    const csvContent = this.generateSampleCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    logDebug('CSV template downloaded:', filename);
  }
}

export default CSVImportService;