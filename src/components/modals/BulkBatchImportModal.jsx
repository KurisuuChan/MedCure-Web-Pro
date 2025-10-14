import React, { useState } from "react";
import {
  X,
  Upload,
  Download,
  FileText,
  AlertCircle,
  CheckCircle2,
  Info,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "../ui/Toast";
import { ProductService } from "../../services/domains/inventory/productService";
import { UnifiedSpinner } from "../ui/loading/UnifiedSpinner";

const BulkBatchImportModal = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState([]);
  const [previewData, setPreviewData] = useState([]);
  const { success: showSuccess, info: showInfo } = useToast();

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
      setErrors([]);
      setResults(null);
      previewCSV(selectedFile);
    } else {
      setErrors(["Please select a valid CSV file"]);
      setFile(null);
      setPreviewData([]);
    }
  };

  const previewCSV = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target.result;
      const lines = csv.split("\n").filter((line) => line.trim());

      if (lines.length < 2) {
        setErrors([
          "CSV file must have at least a header row and one data row",
        ]);
        return;
      }

      // Show first few rows as preview
      const preview = lines
        .slice(0, 6)
        .map((line) => line.split(",").map((cell) => cell.trim()));
      setPreviewData(preview);
    };
    reader.readAsText(file);
  };

  const downloadTemplate = async () => {
    try {
      // Get all products with current stock levels
      const allProducts = await ProductService.getProducts();

      console.log(`📦 Total products fetched: ${allProducts.length}`);
      console.log("🔍 Sample product structure:", allProducts[0]);

      // Filter for low stock and out of stock items
      const lowStockItems = allProducts.filter((product) => {
        const currentStock =
          product.stock_in_pieces || product.stock_quantity || 0;
        const minimumStock = product.reorder_level || 10; // Default minimum

        const isLowStock = currentStock === 0 || currentStock <= minimumStock;

        // Debug logging for first few products
        if (allProducts.indexOf(product) < 5) {
          console.log(
            `🔍 ${product.generic_name}: stock=${currentStock}, min=${minimumStock}, isLowStock=${isLowStock}`
          );
        }

        return isLowStock;
      });

      console.log(
        `🎯 Found ${lowStockItems.length} low stock items out of ${allProducts.length} total products`
      );

      // Create CSV header with simplified details
      const headers = [
        "generic_name",
        "brand_name",
        "current_stock",
        "stock_status",
        "expiry_date",
        "quantity_to_add",
      ];

      // Generate CSV rows
      const csvRows = [headers.join(",")];

      if (lowStockItems.length === 0) {
        // If no low stock items, create a CSV with instructions
        csvRows.push(
          '"No items need restocking","All medicines are well stocked",0,"WELL_STOCKED","",""'
        );
        csvRows.push(
          '"Instructions: ","All medicines have sufficient stock levels",,,"",""'
        );
      } else {
        lowStockItems.forEach((product) => {
          const currentStock =
            product.stock_in_pieces || product.stock_quantity || 0;
          const stockStatus = currentStock === 0 ? "OUT_OF_STOCK" : "LOW_STOCK";

          const row = [
            `"${product.generic_name || product.name || "Unknown"}"`,
            `"${product.brand_name || "Generic"}"`,
            currentStock,
            stockStatus,
            "", // Empty expiry_date for user to fill
            "", // Empty quantity_to_add for user to fill
          ];

          csvRows.push(row.join(","));
        });
      }

      const csvContent = csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `low_stock_items_${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      // Show success toast
      showSuccess(
        `Successfully downloaded CSV with ${lowStockItems.length} low stock items ready for restocking!`,
        {
          duration: 6000,
          action: {
            label: "Got it!",
            onClick: () => {},
          },
        }
      );

      // Show additional info toast with instructions
      setTimeout(() => {
        showInfo(
          "📝 Next steps: Fill in expiry_date (MM-DD-YY format) and quantity_to_add columns, then upload the file back here",
          {
            duration: 8000,
            persistent: false,
          }
        );
      }, 1000);
    } catch (error) {
      console.error("Error generating smart template:", error);
      alert("Failed to generate smart template: " + error.message);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setErrors(["Please select a CSV file first"]);
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
          const lines = csv.split("\n").filter((line) => line.trim());

          if (lines.length < 2) {
            throw new Error(
              "CSV file must have at least a header row and one data row"
            );
          }

          const headers = lines[0]
            .split(",")
            .map((h) => h.trim().replace(/"/g, ""));
          const dataLines = lines.slice(1);

          const importResults = {
            total: dataLines.length,
            successful: 0,
            failed: 0,
            errors: [],
          };

          // Get all products for name matching
          const allProducts = await ProductService.getProducts();

          for (let i = 0; i < dataLines.length; i++) {
            const rowNum = i + 2; // +2 because we start from line 2 (after header)
            const values = dataLines[i]
              .split(",")
              .map((v) => v.trim().replace(/"/g, ""));

            try {
              const rowData = {};
              headers.forEach((header, index) => {
                rowData[header] = values[index] || "";
              });

              // Handle both simple and smart template formats
              const quantityToAdd =
                rowData.quantity_to_add || rowData.stock_to_add;

              // Skip empty rows or rows with no quantity to add
              if (!quantityToAdd || quantityToAdd.toString().trim() === "") {
                console.log(`Skipping row ${rowNum}: No quantity specified`);
                continue;
              }

              // Validate required CSV columns
              if (
                !rowData.generic_name ||
                !rowData.brand_name ||
                !rowData.expiry_date
              ) {
                throw new Error(
                  "Missing required fields. Need: generic_name, brand_name, expiry_date"
                );
              }

              // Find product by generic name and brand name combination
              const matchedProduct = allProducts.find((p) => {
                const productGeneric = (p.generic_name || "")
                  .toLowerCase()
                  .trim();
                const productBrand = (p.brand_name || "").toLowerCase().trim();
                const csvGeneric = rowData.generic_name.toLowerCase().trim();
                const csvBrand = rowData.brand_name.toLowerCase().trim();

                return (
                  productGeneric === csvGeneric && productBrand === csvBrand
                );
              });

              if (!matchedProduct) {
                throw new Error(
                  `Medicine not found in system: ${rowData.generic_name} (${rowData.brand_name})`
                );
              }

              // Validate stock quantity
              const quantity = parseInt(quantityToAdd);
              if (!quantity || quantity <= 0) {
                throw new Error("Quantity to add must be a positive number");
              }

              // Parse and validate expiry date (MM-DD-YY format)
              const expiryDateStr = rowData.expiry_date.trim();
              if (
                expiryDateStr.length !== 8 ||
                !/^\d{2}-\d{2}-\d{2}$/.test(expiryDateStr)
              ) {
                throw new Error(
                  "Invalid expiry date format. Use MM-DD-YY (example: 12-31-25 for Dec 31, 2025)"
                );
              }

              // Parse MM-DD-YY format
              const [monthStr, dayStr, yearStr] = expiryDateStr.split("-");
              const month = parseInt(monthStr);
              const day = parseInt(dayStr);
              const year = parseInt("20" + yearStr); // Assume 20xx

              // Validate month and day
              if (month < 1 || month > 12) {
                throw new Error(
                  "Invalid month in expiry date. Month must be 01-12"
                );
              }
              if (day < 1 || day > 31) {
                throw new Error(
                  "Invalid day in expiry date. Day must be 01-31"
                );
              }

              const expiryDate = new Date(year, month - 1, day); // month is 0-indexed
              if (isNaN(expiryDate.getTime())) {
                throw new Error(
                  "Invalid expiry date. Please check the date values"
                );
              }

              // Check if expiry date is not in the past
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              if (expiryDate < today) {
                throw new Error("Expiry date cannot be in the past");
              }

              // Add the batch (batch_number will be auto-generated)
              const batchData = {
                productId: matchedProduct.id,
                quantity: quantity,
                expiryDate: expiryDate.toISOString().split("T")[0],
                supplier: null, // Not included in simple template
                notes: `Bulk import - ${rowData.generic_name} (${rowData.brand_name})`,
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
            // ✅ Show success toast notification
            showSuccess(
              `Successfully imported ${importResults.successful} batch${
                importResults.successful > 1 ? "es" : ""
              }!${
                importResults.failed > 0
                  ? ` (${importResults.failed} failed)`
                  : ""
              }`,
              {
                duration: 5000,
                action: {
                  label: "View Batches",
                  onClick: () => onClose(),
                },
              }
            );
            onSuccess?.(importResults);
          } else if (importResults.failed > 0) {
            // Show error info for failed imports
            showInfo(
              `Import completed with ${importResults.failed} error${
                importResults.failed > 1 ? "s" : ""
              }. Check the error list below.`,
              {
                duration: 6000,
              }
            );
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
              <h3 className="text-xl font-bold text-gray-900">
                Bulk Batch Import
              </h3>
              <p className="text-sm text-gray-600">
                Smart template shows low-stock items ready for restocking
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Main Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="space-y-6">
            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">
                    Quick Import Instructions
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>
                      • Download the smart template to get all low-stock items
                    </li>
                    <li>
                      • Update the quantities you want to add to each medicine
                    </li>
                    <li>
                      • Upload the completed CSV file for bulk batch creation
                    </li>
                    <li>
                      • Date format: MM-DD-YY (e.g., 12-31-25 for Dec 31, 2025)
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Template Download */}
            <div className="mb-6">
              <button
                onClick={downloadTemplate}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Get Low Stock Items</span>
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
                    {file
                      ? file.name
                      : "Click to select CSV file or drag and drop"}
                  </span>
                </label>
              </div>
            </div>

            {/* Preview */}
            {previewData.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">
                  Preview (First 5 rows)
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200 rounded-lg">
                    <tbody>
                      {previewData.map((row, i) => (
                        <tr
                          key={i}
                          className={
                            i === 0
                              ? "bg-gray-50 font-medium"
                              : "hover:bg-gray-50"
                          }
                        >
                          {row.map((cell, j) => (
                            <td
                              key={j}
                              className="px-3 py-2 border-r border-gray-200 text-sm"
                            >
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
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Import Results
                </h4>
                <div className="text-sm text-green-800 space-y-1">
                  <p>• Total rows processed: {results.total}</p>
                  <p>• Successfully imported: {results.successful}</p>
                  <p>• Failed: {results.failed}</p>
                </div>
                {results.errors.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-red-800 mb-1">
                      Import Errors:
                    </p>
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
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
            >
              {importing ? (
                <>
                  <UnifiedSpinner variant="dots" size="xs" color="white" />
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
