import React, { useState, useRef } from "react";
import {
  X,
  Upload,
  File,
  AlertCircle,
  CheckCircle,
  Download,
  Plus,
  Lightbulb,
  Users,
  Calendar,
  Info,
} from "lucide-react";
import { SmartCategoryService } from "../../services/domains/inventory/smartCategoryService";
import { useAuth } from "../../hooks/useAuth";
import {
  parseFlexibleDate,
  isDateNotInPast,
  getDateFormatErrorMessage,
} from "../../utils/dateParser";
import "./ScrollableModal.css";

export function EnhancedImportModal({ isOpen, onClose, onImport, addToast }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [errors, setErrors] = useState([]);
  const [step, setStep] = useState("upload"); // "upload", "categories", "preview", "importing"
  const [pendingCategories, setPendingCategories] = useState([]);
  const [approvedCategories, setApprovedCategories] = useState([]);
  const fileInputRef = useRef(null);
  const { user } = useAuth();

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

      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        setStep("upload");
      } else {
        // Smart category detection
        const categoryAnalysis =
          await SmartCategoryService.detectAndProcessCategories(
            validData,
            user?.id || "system"
          );

        if (!categoryAnalysis.success) {
          throw new Error(categoryAnalysis.error);
        }

        if (categoryAnalysis.data.requiresApproval) {
          setPendingCategories(categoryAnalysis.data.newCategories);
          setPreviewData(validData);
          setStep("categories");
        } else {
          setPreviewData(validData);
          setStep("preview");
        }
      }
    } catch (error) {
      setErrors([`Error processing file: ${error.message}`]);
      setStep("upload");
    } finally {
      setIsProcessing(false);
    }
  };

  const parseCSV = (text) => {
    const lines = text.trim().split("\n");
    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));

    return lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });
      return row;
    });
  };

  const validateData = (data) => {
    const validationErrors = [];
    const validData = [];

    const requiredFields = [
      { name: "Product Name", required: true },
      { name: "Category", required: true },
      { name: "Price per Piece", required: true, type: "number", min: 0 },
      { name: "Stock (Pieces)", required: true, type: "number", min: 0 },
    ];

    data.forEach((row, index) => {
      const rowErrors = [];

      requiredFields.forEach(({ name, required, type, min, max }) => {
        const value = row[name];

        if (type === "number" && value && value !== "") {
          const numValue = parseFloat(value);
          if (isNaN(numValue)) {
            rowErrors.push(`${name} must be a valid number`);
          } else if (numValue < min) {
            rowErrors.push(`${name} must be at least ${min}`);
          } else if (max && numValue > max) {
            rowErrors.push(`${name} must be at most ${max}`);
          }
        } else if (required && (!value || value === "")) {
          rowErrors.push(`${name} is required`);
        }
      });

      // Enhanced expiry date validation with flexible parsing
      if (row["Expiry Date"] && row["Expiry Date"] !== "") {
        const dateResult = parseFlexibleDate(row["Expiry Date"]);
        if (!dateResult.isValid) {
          rowErrors.push(getDateFormatErrorMessage(row["Expiry Date"]));
        } else if (dateResult.date && !isDateNotInPast(dateResult.date)) {
          rowErrors.push("Expiry date cannot be in the past");
        }
      }

      if (rowErrors.length > 0) {
        validationErrors.push(`Row ${index + 2}: ${rowErrors.join(", ")}`);
      } else {
        const transformedRow = {
          name: row["Product Name"].trim(),
          description: row["Description"] ? row["Description"].trim() : "",
          category: row["Category"].trim(),
          brand: row["Brand"] ? row["Brand"].trim() : "",
          cost_price: row["Cost Price"] ? parseFloat(row["Cost Price"]) : null,
          base_price: row["Base Price"] ? parseFloat(row["Base Price"]) : null,
          price_per_piece: parseFloat(row["Price per Piece"]),
          margin_percentage: row["Margin Percentage"]
            ? parseFloat(row["Margin Percentage"])
            : 0,
          pieces_per_sheet: row["Pieces per Sheet"]
            ? parseInt(row["Pieces per Sheet"])
            : 1,
          sheets_per_box: row["Sheets per Box"]
            ? parseInt(row["Sheets per Box"])
            : 1,
          stock_in_pieces: parseInt(row["Stock (Pieces)"]),
          reorder_level: row["Reorder Level"]
            ? parseInt(row["Reorder Level"])
            : 10,
          supplier: row["Supplier"] ? row["Supplier"].trim() : "",
          expiry_date: row["Expiry Date"]
            ? parseFlexibleDate(row["Expiry Date"]).isoString
            : null,
          batch_number: row["Batch Number"]
            ? row["Batch Number"].trim()
            : `BATCH-${Date.now()}-${index}`,
          is_archived: false,
          archived_at: null,
          archived_by: null,
        };
        validData.push(transformedRow);
      }
    });

    return { validData, validationErrors };
  };

  const handleCategoryApproval = async () => {
    try {
      setIsProcessing(true);

      // Create approved categories
      const createResult = await SmartCategoryService.createApprovedCategories(
        approvedCategories,
        user?.id || "system"
      );

      if (!createResult.success) {
        throw new Error(createResult.error);
      }

      addToast({
        type: "success",
        message: `Created ${createResult.data.length} new categories`,
      });

      setStep("preview");
    } catch (error) {
      setErrors([`Failed to create categories: ${error.message}`]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    try {
      setStep("importing");
      setIsProcessing(true);

      // Map categories to IDs
      const mappingResult = await SmartCategoryService.mapCategoriesToIds(
        previewData
      );
      if (!mappingResult.success) {
        throw new Error(mappingResult.error);
      }

      await onImport(mappingResult.data);

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
    setPendingCategories([]);
    setApprovedCategories([]);
    setStep("upload");
    setIsProcessing(false);
  };

  const toggleCategoryApproval = (categoryIndex) => {
    const category = pendingCategories[categoryIndex];
    const isApproved = approvedCategories.some((c) => c.name === category.name);

    if (isApproved) {
      setApprovedCategories((approved) =>
        approved.filter((c) => c.name !== category.name)
      );
    } else {
      setApprovedCategories((approved) => [...approved, category]);
    }
  };

  const downloadTemplate = () => {
    const template = [
      "Product Name,Description,Category,Brand,Cost Price,Base Price,Price per Piece,Margin Percentage,Pieces per Sheet,Sheets per Box,Stock (Pieces),Reorder Level,Supplier,Expiry Date,Batch Number",
      "Paracetamol 500mg,Pain relief tablet,Pain Relief,GenericPharm,2.00,2.25,2.50,25.00,10,10,1000,100,MediSupply,2025-12-31,BATCH-2024-001",
      "Amoxicillin 250mg,Antibiotic capsule,Antibiotics,PharmaCorp,4.60,5.18,5.75,25.00,8,12,500,50,HealthDistrib,15/10/2024,BATCH-2024-002",
      "Vitamin C 500mg,Immune support tablet,Vitamins,VitaPlus,1.50,1.88,2.50,66.67,20,5,2000,200,NutriCorp,30-06-2025,BATCH-2024-003",
      "Aspirin 100mg,Blood thinner tablet,Pain Relief,CardioMed,1.80,2.03,2.25,25.00,15,8,800,80,PharmaLink,12/31/2025,BATCH-2024-004",
    ].join("\n");

    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "smart_inventory_import_template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header - Sticky */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Upload className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Smart Import System
              </h3>
              <p className="text-sm text-gray-600">
                AI-powered category detection and validation
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              onClose();
              resetModal();
            }}
            className="group p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
          >
            <X className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" />
          </button>
        </div>

        {/* Steps Indicator - Sticky */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-4">
            <div
              className={`flex items-center space-x-2 ${
                step === "upload"
                  ? "text-blue-600"
                  : step === "categories" ||
                    step === "preview" ||
                    step === "importing"
                  ? "text-green-600"
                  : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === "upload"
                    ? "bg-blue-100"
                    : step === "categories" ||
                      step === "preview" ||
                      step === "importing"
                    ? "bg-green-100"
                    : "bg-gray-100"
                }`}
              >
                <span className="text-sm font-medium">1</span>
              </div>
              <span className="font-medium">Upload</span>
            </div>

            <div
              className={`h-px flex-1 ${
                step === "categories" ||
                step === "preview" ||
                step === "importing"
                  ? "bg-green-600"
                  : "bg-gray-300"
              }`}
            ></div>

            <div
              className={`flex items-center space-x-2 ${
                step === "categories"
                  ? "text-blue-600"
                  : step === "preview" || step === "importing"
                  ? "text-green-600"
                  : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === "categories"
                    ? "bg-blue-100"
                    : step === "preview" || step === "importing"
                    ? "bg-green-100"
                    : "bg-gray-100"
                }`}
              >
                <span className="text-sm font-medium">2</span>
              </div>
              <span className="font-medium">Categories</span>
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
                <span className="text-sm font-medium">3</span>
              </div>
              <span className="font-medium">Preview</span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        {/* Main Content - Scrollable */}
        <div className="flex-1 overflow-y-auto scrollable-modal-content">
          <div className="p-6">
            {/* Upload Step */}
            {step === "upload" && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Upload className="h-12 w-12 text-blue-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Upload your inventory file
                  </h4>
                  <p className="text-gray-600 mb-6">
                    Our AI will automatically detect and suggest new categories
                  </p>
                </div>

                <div
                  className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all duration-200 cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <File className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Drop your file here or click to browse
                  </p>
                  <p className="text-gray-600">Supports CSV and JSON formats</p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json"
                  onChange={(e) => handleFileSelect(e.target.files[0])}
                  className="hidden"
                />

                <div className="flex justify-center">
                  <button
                    onClick={downloadTemplate}
                    className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Template</span>
                  </button>
                </div>

                {/* Smart Import Guide */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Calendar className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-amber-900 mb-2 flex items-center">
                        � Smart Import Tips
                        <span className="ml-2 px-2 py-1 bg-amber-200 text-amber-800 text-xs rounded-full font-medium">
                          AI-Powered
                        </span>
                      </h4>

                      <div className="space-y-4">
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">
                            📄 Required Fields
                          </h5>
                          <div className="text-xs text-gray-600 space-y-1">
                            <div>
                              <span className="font-medium">name</span> -
                              Product name
                            </div>
                            <div>
                              <span className="font-medium">price</span> - Unit
                              price (number)
                            </div>
                            <div>
                              <span className="font-medium">quantity</span> -
                              Stock quantity
                            </div>
                            <div>
                              <span className="font-medium">category</span> -
                              Product category
                            </div>
                            <div>
                              <span className="font-medium">
                                expiration_date
                              </span>{" "}
                              - See formats below
                            </div>
                          </div>
                        </div>

                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">
                            📅 Date Formats
                          </h5>
                          <div className="text-xs text-gray-600 space-y-1">
                            <div>✓ 2024-12-31 (ISO standard)</div>
                            <div>✓ 31/12/2024 (European)</div>
                            <div>✓ 12/31/2024 (US format)</div>
                            <div>✓ 31.12.2024 (Dot notation)</div>
                          </div>
                        </div>

                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">
                            🤖 Smart Features
                          </h5>
                          <div className="text-xs text-gray-600 space-y-1">
                            <div>• Auto-creates missing categories</div>
                            <div>• Validates dates and prices</div>
                            <div>• Flexible date format detection</div>
                            <div>• Smart error prevention</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Category Approval Step */}
            {step === "categories" && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="mx-auto w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                    <Lightbulb className="h-12 w-12 text-yellow-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    New Categories Detected
                  </h4>
                  <p className="text-gray-600 mb-6">
                    Our AI found {pendingCategories.length} new categories.
                    Review and approve them below.
                  </p>
                </div>

                <div className="space-y-4">
                  {pendingCategories.map((category, index) => {
                    const isApproved = approvedCategories.some(
                      (c) => c.name === category.name
                    );
                    return (
                      <div
                        key={index}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                          isApproved
                            ? "border-green-200 bg-green-50"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                        onClick={() => toggleCategoryApproval(index)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: category.color }}
                            ></div>
                            <div>
                              <h5 className="font-medium text-gray-900">
                                {category.name}
                              </h5>
                              <p className="text-sm text-gray-600">
                                {category.count} products • Suggested icon:{" "}
                                {category.icon}
                              </p>
                            </div>
                          </div>
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              isApproved
                                ? "border-green-500 bg-green-500"
                                : "border-gray-300"
                            }`}
                          >
                            {isApproved && (
                              <CheckCircle className="h-4 w-4 text-white" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => setStep("upload")}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCategoryApproval}
                    disabled={approvedCategories.length === 0 || isProcessing}
                    className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 rounded-lg transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create {approvedCategories.length} Categories</span>
                  </button>
                </div>
              </div>
            )}

            {/* Preview Step */}
            {step === "preview" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      Import Preview
                    </h4>
                    <p className="text-gray-600">
                      {previewData.length} products ready for import
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-700 rounded-full">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Ready to Import</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">
                          Product
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">
                          Category
                        </th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">
                          Price
                        </th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">
                          Stock
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {previewData.slice(0, 10).map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium text-gray-900">
                                {item.name}
                              </div>
                              <div className="text-sm text-gray-600">
                                {item.description}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {item.category}
                          </td>
                          <td className="py-3 px-4 text-right font-medium">
                            ${item.price_per_piece}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {item.stock_in_pieces}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {previewData.length > 10 && (
                    <p className="text-center py-3 text-gray-600">
                      And {previewData.length - 10} more products...
                    </p>
                  )}
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => setStep("upload")}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleImport}
                    className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Import Products</span>
                  </button>
                </div>
              </div>
            )}

            {/* Importing Step */}
            {step === "importing" && (
              <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                  <Users className="h-12 w-12 text-blue-600 animate-pulse" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  Importing Products...
                </h4>
                <p className="text-gray-600 mb-6">
                  Please wait while we add your products to the inventory
                </p>
                <div className="w-64 h-2 bg-gray-200 rounded-full mx-auto overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full animate-pulse"></div>
                </div>
              </div>
            )}

            {/* Errors */}
            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h5 className="font-medium text-red-800 mb-1">
                      Validation Errors
                    </h5>
                    <ul className="text-sm text-red-700 space-y-1">
                      {errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
