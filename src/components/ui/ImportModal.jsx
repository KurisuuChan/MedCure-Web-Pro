import React, { useState, useRef } from "react";
import {
  X,
  Upload,
  File,
  AlertCircle,
  CheckCircle,
  Download,
} from "lucide-react";

export function ImportModal({ isOpen, onClose, onImport }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [errors, setErrors] = useState([]);
  const [step, setStep] = useState("upload"); // "upload", "preview", "importing"
  const fileInputRef = useRef(null);

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;

    if (
      !selectedFile.name.endsWith(".csv") &&
      !selectedFile.name.endsWith(".json")
    ) {
      setErrors(["Please select a CSV or JSON file"]);
      return;
    }

    setSelectedFile(selectedFile);
    setErrors([]);
    processFile(selectedFile);
  };

  const processFile = async (file) => {
    setIsProcessing(true);

    try {
      const text = await file.text();
      let data = [];

      if (file.name.endsWith(".csv")) {
        data = parseCSV(text);
      } else if (file.name.endsWith(".json")) {
        data = JSON.parse(text);
      }

      const { validData, validationErrors } = validateData(data);
      setPreviewData(validData);
      setErrors(validationErrors);
      setStep("preview");
    } catch (error) {
      setErrors([`Error processing file: ${error.message}`]);
    } finally {
      setIsProcessing(false);
    }
  };

  const parseCSV = (text) => {
    const lines = text.split("\n");
    const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim());

    return lines
      .slice(1)
      .filter((line) => line.trim())
      .map((line) => {
        const values = line.split(",").map((v) => v.replace(/"/g, "").trim());
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || "";
        });
        return row;
      });
  };

  const validateData = (data) => {
    const validData = [];
    const validationErrors = [];
    const requiredFields = [
      "Product Name",
      "Category",
      "Price per Piece",
      "Stock (Pieces)",
    ];

    data.forEach((row, index) => {
      const rowErrors = [];

      // Check required fields
      requiredFields.forEach((field) => {
        if (!row[field] || row[field].toString().trim() === "") {
          rowErrors.push(`Missing ${field}`);
        }
      });

      // Validate price
      if (row["Price per Piece"] && isNaN(parseFloat(row["Price per Piece"]))) {
        rowErrors.push("Price must be a number");
      }

      // Validate stock
      if (row["Stock (Pieces)"] && isNaN(parseInt(row["Stock (Pieces)"]))) {
        rowErrors.push("Stock must be a number");
      }

      // Validate expiry date
      if (row["Expiry Date"] && row["Expiry Date"] !== "") {
        const date = new Date(row["Expiry Date"]);
        if (isNaN(date.getTime())) {
          rowErrors.push("Invalid expiry date format");
        }
      }

      if (rowErrors.length > 0) {
        validationErrors.push(`Row ${index + 2}: ${rowErrors.join(", ")}`);
      } else {
        // Transform data to match our schema
        const transformedRow = {
          name: row["Product Name"],
          description: row["Description"] || "",
          category: row["Category"],
          brand: row["Brand"] || "",
          price_per_piece: parseFloat(row["Price per Piece"]),
          pieces_per_sheet: parseInt(row["Pieces per Sheet"]) || 1,
          sheets_per_box: parseInt(row["Sheets per Box"]) || 1,
          stock_in_pieces: parseInt(row["Stock (Pieces)"]),
          reorder_level: parseInt(row["Reorder Level"]) || 10,
          supplier: row["Supplier"] || "",
          expiry_date: row["Expiry Date"] || null,
          batch_number: row["Batch Number"] || `BATCH-${Date.now()}-${index}`,
        };
        validData.push(transformedRow);
      }
    });

    return { validData, validationErrors };
  };

  const handleImport = async () => {
    setStep("importing");
    setIsProcessing(true);

    try {
      await onImport(previewData);
      setTimeout(() => {
        setIsProcessing(false);
        onClose();
        resetModal();
      }, 1000);
    } catch (error) {
      setErrors([`Import failed: ${error.message}`]);
      setIsProcessing(false);
      setStep("preview");
    }
  };

  const resetModal = () => {
    setSelectedFile(null);
    setPreviewData([]);
    setErrors([]);
    setStep("upload");
    setIsProcessing(false);
  };

  const downloadTemplate = () => {
    const template = [
      "Product Name,Description,Category,Brand,Price per Piece,Pieces per Sheet,Sheets per Box,Stock (Pieces),Reorder Level,Supplier,Expiry Date,Batch Number",
      "Paracetamol 500mg,Pain relief tablet,Pain Relief,GenericPharm,2.50,10,10,1000,100,MediSupply,2025-12-31,BATCH-2024-001",
      "Amoxicillin 250mg,Antibiotic capsule,Antibiotics,PharmaCorp,5.75,8,12,500,50,HealthDistrib,2024-10-15,BATCH-2024-002",
    ].join("\n");

    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "inventory_import_template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Upload className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                Import Products
              </h3>
            </div>
            <button
              onClick={() => {
                onClose();
                resetModal();
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Steps Indicator */}
          <div className="flex items-center space-x-4 mb-6">
            <div
              className={`flex items-center space-x-2 ${
                step === "upload"
                  ? "text-blue-600"
                  : step === "preview" || step === "importing"
                  ? "text-green-600"
                  : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === "upload"
                    ? "bg-blue-100"
                    : step === "preview" || step === "importing"
                    ? "bg-green-100"
                    : "bg-gray-100"
                }`}
              >
                <span className="text-sm font-medium">1</span>
              </div>
              <span className="font-medium">Upload File</span>
            </div>
            <div
              className={`h-px flex-1 ${
                step === "preview" || step === "importing"
                  ? "bg-green-600"
                  : "bg-gray-300"
              }`}
            ></div>
            <div
              className={`flex items-center space-x-2 ${
                step === "preview"
                  ? "text-blue-600"
                  : step === "importing"
                  ? "text-green-600"
                  : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === "preview"
                    ? "bg-blue-100"
                    : step === "importing"
                    ? "bg-green-100"
                    : "bg-gray-100"
                }`}
              >
                <span className="text-sm font-medium">2</span>
              </div>
              <span className="font-medium">Preview & Validate</span>
            </div>
            <div
              className={`h-px flex-1 ${
                step === "importing" ? "bg-green-600" : "bg-gray-300"
              }`}
            ></div>
            <div
              className={`flex items-center space-x-2 ${
                step === "importing" ? "text-blue-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === "importing" ? "bg-blue-100" : "bg-gray-100"
                }`}
              >
                <span className="text-sm font-medium">3</span>
              </div>
              <span className="font-medium">Import</span>
            </div>
          </div>

          {/* Upload Step */}
          {step === "upload" && (
            <div className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json"
                  onChange={(e) => handleFileSelect(e.target.files[0])}
                  className="hidden"
                />
                <File className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Choose a file to import
                </p>
                <p className="text-gray-500 mb-4">
                  Upload a CSV or JSON file with your product data
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  disabled={isProcessing}
                >
                  {isProcessing ? "Processing..." : "Browse Files"}
                </button>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <Download className="h-5 w-5 text-blue-600 mt-0.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 mb-1">
                      Don't have a template?
                    </h4>
                    <p className="text-sm text-blue-700 mb-2">
                      Download our CSV template with the required columns and
                      example data.
                    </p>
                    <button
                      onClick={downloadTemplate}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium underline"
                    >
                      Download Template
                    </button>
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                <h4 className="font-medium mb-2">Required columns:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Product Name</li>
                  <li>Category</li>
                  <li>Price per Piece</li>
                  <li>Stock (Pieces)</li>
                </ul>
                <h4 className="font-medium mt-4 mb-2">Optional columns:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Description, Brand, Pieces per Sheet, Sheets per Box</li>
                  <li>Reorder Level, Supplier, Expiry Date, Batch Number</li>
                </ul>
              </div>
            </div>
          )}

          {/* Preview Step */}
          {step === "preview" && (
            <div className="space-y-6">
              {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-red-900 mb-2">
                        Validation Errors ({errors.length})
                      </h4>
                      <ul className="text-sm text-red-700 space-y-1 max-h-32 overflow-y-auto">
                        {errors.map((error, index) => (
                          <li key={index} className="list-disc list-inside">
                            {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {previewData.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <h4 className="text-sm font-medium text-green-900">
                        Ready to Import
                      </h4>
                      <p className="text-sm text-green-700">
                        {previewData.length} products are valid and ready to be
                        imported.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {previewData.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Preview ({previewData.length} products)
                  </h4>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="max-h-64 overflow-y-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Product Name
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Category
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Price
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Stock
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Expiry
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {previewData.slice(0, 10).map((product, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {product.name}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-600">
                                {product.category}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-600">
                                ${product.price_per_piece}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-600">
                                {product.stock_in_pieces}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-600">
                                {product.expiry_date || "N/A"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {previewData.length > 10 && (
                      <div className="bg-gray-50 px-4 py-2 text-sm text-gray-600">
                        ... and {previewData.length - 10} more products
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Importing Step */}
          {step === "importing" && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Importing Products...
              </h4>
              <p className="text-gray-600">
                Please wait while we add {previewData.length} products to your
                inventory.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-6 border-t">
            <div>
              {step === "preview" && (
                <button
                  onClick={() => {
                    setStep("upload");
                    setSelectedFile(null);
                    setPreviewData([]);
                    setErrors([]);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Back
                </button>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  resetModal();
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={step === "importing"}
              >
                Cancel
              </button>
              {step === "preview" && (
                <button
                  onClick={handleImport}
                  disabled={previewData.length === 0 || isProcessing}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload className="h-4 w-4" />
                  <span>Import {previewData.length} Products</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
