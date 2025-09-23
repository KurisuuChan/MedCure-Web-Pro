import React, { useState } from 'react';
import { Upload, Download, X, FileText, AlertTriangle, CheckCircle, Loader } from 'lucide-react';
import { ProductService } from '../../services/domains/inventory/productService';

const BulkBatchImportModal = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState([]);
  const [previewData, setPreviewData] = useState([]);

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setErrors([]);
      setResults(null);
      previewCSV(selectedFile);
    } else {
      setErrors(['Please select a valid CSV file']);
      setFile(null);
      setPreviewData([]);
    }
  };

  const previewCSV = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target.result;
      const lines = csv.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        setErrors(['CSV file must have at least a header row and one data row']);
        return;
      }

      // Show first few rows as preview
      const preview = lines.slice(0, 6).map(line => line.split(',').map(cell => cell.trim()));
      setPreviewData(preview);
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const template = `product_id,product_name,quantity,expiry_date,supplier,notes
"Enter product ID or leave blank to match by name","Product Name for Reference",100,"2025-12-31","Supplier Name","Optional notes"
"","Paracetamol 500mg",50,"2025-06-30","PharmaCorp","Example entry"
"","Amoxicillin 250mg",25,"2025-09-15","MediSupply","Another example"`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'batch_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!file) {
      setErrors(['Please select a CSV file first']);
      return;
    }

    setImporting(true);
    setErrors([]);
    setResults(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const csv = e.target.result;
          const lines = csv.split('\n').filter(line => line.trim());
          
          if (lines.length < 2) {
            throw new Error('CSV file must have at least a header row and one data row');
          }

          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          const dataLines = lines.slice(1);

          const importResults = {
            total: dataLines.length,
            successful: 0,
            failed: 0,
            errors: []
          };

          // Get all products for name matching
          const allProducts = await ProductService.getProducts();

          for (let i = 0; i < dataLines.length; i++) {
            const rowNum = i + 2; // +2 because we start from line 2 (after header)
            const values = dataLines[i].split(',').map(v => v.trim().replace(/"/g, ''));
            
            try {
              const rowData = {};
              headers.forEach((header, index) => {
                rowData[header] = values[index] || '';
              });

              // Find product by ID or name
              let productId = rowData.product_id;
              if (!productId && rowData.product_name) {
                const matchedProduct = allProducts.find(p => 
                  p.name.toLowerCase().includes(rowData.product_name.toLowerCase()) ||
                  rowData.product_name.toLowerCase().includes(p.name.toLowerCase())
                );
                if (matchedProduct) {
                  productId = matchedProduct.id;
                } else {
                  throw new Error(`Product not found: ${rowData.product_name}`);
                }
              }

              if (!productId) {
                throw new Error('Product ID is required or product name must match existing product');
              }

              // Validate required fields
              const quantity = parseInt(rowData.quantity);
              if (!quantity || quantity <= 0) {
                throw new Error('Valid quantity is required');
              }

              // Parse expiry date
              let expiryDate = null;
              if (rowData.expiry_date && rowData.expiry_date !== '') {
                expiryDate = new Date(rowData.expiry_date);
                if (isNaN(expiryDate.getTime())) {
                  throw new Error('Invalid expiry date format. Use YYYY-MM-DD');
                }
              }

              // Add the batch (batch_number will be auto-generated)
              const batchData = {
                productId: productId,
                quantity: quantity,
                expiryDate: expiryDate ? expiryDate.toISOString().split('T')[0] : null,
                supplier: rowData.supplier || null,
                notes: rowData.notes || `Bulk import - Row ${rowNum}`
              };

              await ProductService.addProductBatch(batchData);
              importResults.successful++;

            } catch (rowError) {
              importResults.failed++;
              importResults.errors.push(`Row ${rowNum}: ${rowError.message}`);
            }
          }

          setResults(importResults);
          
          if (importResults.successful > 0) {
            onSuccess?.(importResults);
          }

        } catch (parseError) {
          setErrors([`Error parsing CSV: ${parseError.message}`]);
        } finally {
          setImporting(false);
        }
      };

      reader.readAsText(file);

    } catch (error) {
      setErrors([`Import failed: ${error.message}`]);
      setImporting(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreviewData([]);
    setResults(null);
    setErrors([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <Upload className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Bulk Batch Import</h3>
              <p className="text-sm text-gray-600">Import multiple product batches from CSV file</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Import Instructions
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Use the template CSV format with required columns</li>
              <li>• Product ID can be left blank if product name matches exactly</li>
              <li>• Quantity must be a positive number</li>
              <li>• Expiry date format: YYYY-MM-DD (optional)</li>
              <li>• Batch numbers are automatically generated (BT + Date + ID)</li>
              <li>• Supplier and notes are optional for tracking purposes</li>
            </ul>
          </div>

          {/* Template Download */}
          <div className="mb-6">
            <button
              onClick={downloadTemplate}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Download CSV Template</span>
            </button>
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select CSV File
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="h-12 w-12 text-gray-400 mb-2" />
                <span className="text-gray-600">
                  {file ? file.name : 'Click to select CSV file or drag and drop'}
                </span>
              </label>
            </div>
          </div>

          {/* Preview */}
          {previewData.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-2">Preview (First 5 rows)</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 rounded-lg">
                  <tbody>
                    {previewData.map((row, i) => (
                      <tr key={i} className={i === 0 ? 'bg-gray-50 font-medium' : 'hover:bg-gray-50'}>
                        {row.map((cell, j) => (
                          <td key={j} className="px-3 py-2 border-r border-gray-200 text-sm">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-900 mb-2 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Errors
              </h4>
              <ul className="text-sm text-red-800 space-y-1">
                {errors.map((error, i) => (
                  <li key={i}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2 flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Import Results
              </h4>
              <div className="text-sm text-green-800 space-y-1">
                <p>• Total rows processed: {results.total}</p>
                <p>• Successfully imported: {results.successful}</p>
                <p>• Failed: {results.failed}</p>
              </div>
              {results.errors.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-red-800 mb-1">Import Errors:</p>
                  <ul className="text-xs text-red-700 space-y-1 max-h-32 overflow-y-auto">
                    {results.errors.map((error, i) => (
                      <li key={i}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-between items-center">
          <button
            onClick={reset}
            className="text-gray-600 hover:text-gray-800 font-medium"
            disabled={importing}
          >
            Reset
          </button>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={importing}
            >
              Close
            </button>
            <button
              onClick={handleImport}
              disabled={!file || importing}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {importing ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span>Import Batches</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkBatchImportModal;