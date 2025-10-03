// =============================================================================
// MEDCURE CSV IMPORT SERVICE
// =============================================================================
// Purpose: Handle CSV import with medicine-specific validation
// Date: October 3, 2025
// Author: System Architect
// =============================================================================

import { parseFlexibleDate, isDateNotInPast, getDateFormatErrorMessage } from "../../../utils/dateParser";
import { logDebug, handleError } from "../../core/serviceUtils";

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
    pharmacologic_category: ['pharmacologic_category', 'Pharmacologic Category', 'pharma_category'],
    manufacturer: ['manufacturer', 'Manufacturer'],
    storage_conditions: ['storage_conditions', 'Storage Conditions', 'storage'],
    registration_number: ['registration_number', 'Registration Number', 'reg_number'],
    
    // Basic product fields
    description: ['description', 'Description'],
    supplier_name: ['supplier_name', 'Supplier', 'supplier'],
    
    // Pricing fields
    price_per_piece: ['price_per_piece', 'Price per Piece', 'price'],
    cost_price: ['cost_price', 'Cost Price'],
    base_price: ['base_price', 'Base Price'],
    margin_percentage: ['margin_percentage', 'Margin Percentage', 'margin'],
    
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

  // Valid enum values
  static ENUM_VALUES = {
    dosage_form: ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops', 'Inhaler'],
    drug_classification: ['Prescription (Rx)', 'Over-the-Counter (OTC)', 'Controlled Substance']
  };

  // Required fields for validation
  static REQUIRED_FIELDS = [
    { name: 'generic_name', required: true },
    { name: 'category_name', required: true },
    { name: 'price_per_piece', required: true, type: 'number', min: 0 },
  ];

  // Optional fields with validation rules
  static OPTIONAL_FIELDS = [
    { name: 'brand_name', required: false },
    { name: 'dosage_strength', required: false },
    { name: 'dosage_form', required: false, enum: 'dosage_form' },
    { name: 'drug_classification', required: false, enum: 'drug_classification' },
    { name: 'pharmacologic_category', required: false },
    { name: 'manufacturer', required: false },
    { name: 'pieces_per_sheet', required: false, type: 'number', min: 1 },
    { name: 'sheets_per_box', required: false, type: 'number', min: 1 },
    { name: 'reorder_level', required: false, type: 'number', min: 0 },
    { name: 'cost_price', required: false, type: 'number', min: 0 },
    { name: 'base_price', required: false, type: 'number', min: 0 },
    { name: 'margin_percentage', required: false, type: 'number', min: 0 },
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

      const rawHeaders = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const normalizedHeaders = this.normalizeHeaders(rawHeaders);
      
      logDebug('Normalized headers:', normalizedHeaders);

      const data = lines.slice(1).map((line, index) => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row = {};
        
        rawHeaders.forEach((header, i) => {
          const normalizedHeader = normalizedHeaders[i];
          if (normalizedHeader) {
            row[normalizedHeader] = values[i] || '';
          }
        });
        
        return row;
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
   * Validate CSV data with medicine-specific rules
   * @param {Array} data - Parsed CSV data
   * @returns {Object} Validation result with valid data and errors
   */
  static validateData(data) {
    const validationErrors = [];
    const validData = [];

    const allFields = [...this.REQUIRED_FIELDS, ...this.OPTIONAL_FIELDS];

    data.forEach((row, index) => {
      const rowErrors = [];

      // Validate all fields
      allFields.forEach(({ name, required, type, min, max, enum: enumType }) => {
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
          }
        }

        // Validate enum fields
        if (enumType && this.ENUM_VALUES[enumType]) {
          if (!this.ENUM_VALUES[enumType].includes(value)) {
            rowErrors.push(`${name} must be one of: ${this.ENUM_VALUES[enumType].join(', ')}`);
          }
        }
      });

      // Validate expiry date
      if (row.expiry_date && row.expiry_date !== '') {
        const dateResult = parseFlexibleDate(row.expiry_date);
        if (!dateResult.isValid) {
          rowErrors.push(getDateFormatErrorMessage(row.expiry_date));
        } else if (dateResult.date && !isDateNotInPast(dateResult.date)) {
          rowErrors.push('Expiry date cannot be in the past');
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
      errorRows: validationErrors.length
    };
  }

  /**
   * Transform row data for database insertion
   * @param {Object} row - Raw row data
   * @param {number} index - Row index for generating batch numbers
   * @returns {Object} Transformed row ready for database
   */
  static transformRowForDatabase(row, index) {
    const transformed = {
      // Primary fields (with backward compatibility)
      name: row.generic_name.trim(),
      generic_name: row.generic_name.trim(),
      brand_name: row.brand_name ? row.brand_name.trim() : '',
      brand: row.brand_name ? row.brand_name.trim() : '', // Backward compatibility
      description: row.description ? row.description.trim() : '',
      category: row.category_name.trim(),
      
      // Medicine-specific fields
      dosage_form: row.dosage_form || null,
      dosage_strength: row.dosage_strength || null,
      manufacturer: row.manufacturer || null,
      drug_classification: row.drug_classification || null,
      pharmacologic_category: row.pharmacologic_category || null,
      storage_conditions: row.storage_conditions || null,
      registration_number: row.registration_number || null,
      
      // Pricing fields
      price_per_piece: parseFloat(row.price_per_piece),
      cost_price: row.cost_price ? parseFloat(row.cost_price) : null,
      base_price: row.base_price ? parseFloat(row.base_price) : null,
      margin_percentage: row.margin_percentage ? parseFloat(row.margin_percentage) : 0,
      
      // Package structure
      pieces_per_sheet: row.pieces_per_sheet ? parseInt(row.pieces_per_sheet) : 1,
      sheets_per_box: row.sheets_per_box ? parseInt(row.sheets_per_box) : 1,
      
      // Inventory fields
      stock_in_pieces: row.stock_in_pieces ? parseInt(row.stock_in_pieces) : 0,
      reorder_level: row.reorder_level ? parseInt(row.reorder_level) : 10,
      supplier: row.supplier_name ? row.supplier_name.trim() : '',
      
      // Date fields
      expiry_date: row.expiry_date ? parseFlexibleDate(row.expiry_date).isoString : null,
      batch_number: row.batch_number ? row.batch_number.trim() : `BATCH-${Date.now()}-${index}`,
      
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
      'dosage_strength', 'dosage_form', 'drug_classification', 'pharmacologic_category',
      'price_per_piece', 'pieces_per_sheet', 'sheets_per_box', 'reorder_level',
      'storage_conditions', 'manufacturer', 'registration_number',
      'cost_price', 'base_price', 'margin_percentage', 'expiry_date', 'batch_number'
    ];

    const sampleRows = [
      [
        'Paracetamol', 'Biogesic', 'Pain Relief', 'MediSupply Corp',
        'Analgesic and antipyretic for pain and fever relief',
        '500mg', 'Tablet', 'Over-the-Counter (OTC)', 'Analgesic',
        '2.50', '10', '10', '100',
        'Store at room temperature below 25°C', 'Unilab', 'FDA-OTC-2024-001234',
        '2.00', '2.25', '25.00', '2025-12-31', 'BATCH-2024-001'
      ],
      [
        'Amoxicillin', 'Amoxil', 'Antibiotics', 'PharmaCorp Distributors',
        'Broad-spectrum antibiotic for bacterial infections',
        '500mg', 'Capsule', 'Prescription (Rx)', 'Antibiotic',
        '5.75', '10', '10', '50',
        'Store at room temperature below 25°C', 'GlaxoSmithKline', 'FDA-RX-2024-001234',
        '4.60', '5.18', '25.00', '2025-10-15', 'BATCH-2024-002'
      ],
      [
        'Ascorbic Acid', 'Cecon', 'Vitamins & Supplements', 'VitaCorp International',
        'Essential vitamin for immune system support',
        '500mg', 'Tablet', 'Over-the-Counter (OTC)', 'Vitamin',
        '1.25', '20', '10', '200',
        'Store in a cool dry place', 'Ricola', 'FDA-OTC-2024-567890',
        '1.00', '1.13', '25.00', '2025-06-30', 'BATCH-2024-003'
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