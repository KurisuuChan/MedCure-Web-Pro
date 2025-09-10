import React, { useState, useRef } from "react";
import {
  X,
  Upload,
  File,
  AlertCircle,
  CheckCircle,
  Download,
  Tag,
  Plus,
  Info,
} from "lucide-react";
import { UnifiedCategoryService } from "../../services/domains/inventory/unifiedCategoryService";

export function ImportModal({ isOpen, onClose, onImport }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [errors, setErrors] = useState([]);
  const [step, setStep] = useState("upload"); // "upload", "preview", "importing"
  const [categoryCreationSummary, setCategoryCreationSummary] = useState(null);
  const [newCategoriesFound, setNewCategoriesFound] = useState([]);
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

      const { validData, validationErrors, categoriesFound } =
        await validateDataWithIntelligentCategories(data);
      setPreviewData(validData);
      setErrors(validationErrors);
      setNewCategoriesFound(categoriesFound);
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

  // Enhanced validation with intelligent category processing
  const validateDataWithIntelligentCategories = async (data) => {
    const validData = [];
    const validationErrors = [];
    const categoriesFound = new Set();
    const newCategoriesList = [];

    console.log(
      "🧠 Starting intelligent validation with category processing..."
    );

    // First pass: collect all unique categories
    data.forEach((row, index) => {
      if (row["Category"]) {
        const normalizedCategory = UnifiedCategoryService.normalizeCategoryName(
          row["Category"]
        );
        categoriesFound.add(normalizedCategory);
      }
    });

    // Check which categories are new and will be auto-created
    for (const categoryName of categoriesFound) {
      const existsCheck = await UnifiedCategoryService.checkCategoriesExist([
        categoryName,
      ]);
      if (!existsCheck.exists) {
        newCategoriesList.push({
          original: categoryName,
          normalized: existsCheck.normalizedName,
        });
      }
    }

    console.log(
      `📊 Found ${categoriesFound.size} unique categories, ${newCategoriesList.length} will be auto-created`
    );

    // Second pass: validate data with enhanced checks
    data.forEach((row, index) => {
      const rowErrors = [];

      // Required fields validation
      if (!row["Product Name"]) rowErrors.push("Product name is required");
      if (!row["Category"]) rowErrors.push("Category is required");
      if (!row["Price per Piece"] || parseFloat(row["Price per Piece"]) <= 0) {
        rowErrors.push("Valid price per piece is required");
      }
      if (!row["Stock (Pieces)"] || parseInt(row["Stock (Pieces)"]) < 0) {
        rowErrors.push("Valid stock quantity is required");
      }

      // Enhanced numeric validations
      const numericFields = [
        "Cost Price",
        "Price per Piece", // Single authoritative unit price
        "Margin Percentage",
        "Pieces per Sheet",
        "Sheets per Box",
        "Stock (Pieces)",
        "Reorder Level",
      ];

      numericFields.forEach((field) => {
        if (row[field] && row[field] !== "") {
          const value =
            field.includes("Price") || field.includes("Margin")
              ? parseFloat(row[field])
              : parseInt(row[field]);

          if (isNaN(value) || value < 0) {
            rowErrors.push(`${field} must be a valid positive number`);
          }
        }
      });

      // Validate expiry date
      if (row["Expiry Date"] && row["Expiry Date"] !== "") {
        const date = new Date(row["Expiry Date"]);
        if (isNaN(date.getTime())) {
          rowErrors.push("Invalid expiry date format (use YYYY-MM-DD)");
        } else if (date < new Date()) {
          rowErrors.push("Expiry date cannot be in the past");
        }
      }

      // Validate pricing logic with enhanced checks
      if (row["Cost Price"] && row["Price per Piece"]) {
        const costPrice = parseFloat(row["Cost Price"]);
        const sellPrice = parseFloat(row["Price per Piece"]);
        if (!isNaN(costPrice) && !isNaN(sellPrice)) {
          if (costPrice > sellPrice) {
            rowErrors.push("Cost price cannot be higher than selling price");
          }

          // Calculate and validate margin
          const calculatedMargin = ((sellPrice - costPrice) / costPrice) * 100;
          if (calculatedMargin < 5) {
            rowErrors.push("Profit margin is very low (less than 5%)");
          }
        }
      }

      if (rowErrors.length > 0) {
        validationErrors.push(`Row ${index + 2}: ${rowErrors.join(", ")}`);
      } else {
        // Transform data with intelligent category normalization
        const normalizedCategory = UnifiedCategoryService.normalizeCategoryName(
          row["Category"]
        );

        const transformedRow = {
          name: row["Product Name"].trim(),
          description: row["Description"] ? row["Description"].trim() : "",
          category: normalizedCategory, // Use normalized category name
          brand: row["Brand"] ? row["Brand"].trim() : "",
          // Enhanced pricing fields - Single unit price (price_per_piece is authoritative)
          cost_price: row["Cost Price"] ? parseFloat(row["Cost Price"]) : null,
          price_per_piece: parseFloat(row["Price per Piece"]), // Single authoritative unit price
          margin_percentage: row["Margin Percentage"]
            ? parseFloat(row["Margin Percentage"])
            : row["Cost Price"] && row["Price per Piece"]
            ? ((parseFloat(row["Price per Piece"]) -
                parseFloat(row["Cost Price"])) /
                parseFloat(row["Cost Price"])) *
              100
            : 0,
          // Unit conversion fields
          pieces_per_sheet: row["Pieces per Sheet"]
            ? parseInt(row["Pieces per Sheet"])
            : 1,
          sheets_per_box: row["Sheets per Box"]
            ? parseInt(row["Sheets per Box"])
            : 1,
          // Stock management
          stock_in_pieces: parseInt(row["Stock (Pieces)"]),
          reorder_level: row["Reorder Level"]
            ? parseInt(row["Reorder Level"])
            : 10,
          // Additional fields
          supplier: row["Supplier"] ? row["Supplier"].trim() : "",
          expiry_date: row["Expiry Date"] || null,
          batch_number: row["Batch Number"]
            ? row["Batch Number"].trim()
            : `BATCH-${Date.now()}-${index}`,
          // Archive status
          is_archived: false,
          archived_at: null,
          archived_by: null,
          // Metadata for tracking
          import_metadata: {
            original_category: row["Category"],
            normalized_category: normalizedCategory,
            imported_at: new Date().toISOString(),
            row_number: index + 2,
          },
        };
        validData.push(transformedRow);
      }
    });

    return {
      validData,
      validationErrors,
      categoriesFound: Array.from(categoriesFound),
      newCategories: newCategoriesList,
    };
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

    // Valid categories for validation
    const validCategories = [
      "Pain Relief",
      "Antibiotics",
      "Vitamins",
      "Cold & Flu",
      "Heart & Blood Pressure",
      "Diabetes",
      "Digestive Health",
      "Skin Care",
      "Eye Care",
      "Women's Health",
      "Men's Health",
      "Child Care",
      "Respiratory",
      "Mental Health",
      "First Aid",
    ];

    data.forEach((row, index) => {
      const rowErrors = [];

      // Check required fields
      requiredFields.forEach((field) => {
        if (!row[field] || row[field].toString().trim() === "") {
          rowErrors.push(`Missing ${field}`);
        }
      });

      // Validate category
      if (row["Category"] && !validCategories.includes(row["Category"])) {
        rowErrors.push(
          `Invalid category. Must be one of: ${validCategories.join(", ")}`
        );
      }

      // Enhanced numeric validation
      const numericFields = [
        { field: "Price per Piece", min: 0, required: true }, // Single authoritative unit price
        { field: "Cost Price", min: 0, required: false },
        { field: "Margin Percentage", min: 0, max: 1000, required: false },
        { field: "Stock (Pieces)", min: 0, required: true },
        { field: "Pieces per Sheet", min: 1, required: false },
        { field: "Sheets per Box", min: 1, required: false },
        { field: "Reorder Level", min: 0, required: false },
      ];

      numericFields.forEach(({ field, min, max, required }) => {
        const value = row[field];
        if (value && value !== "") {
          const numValue = parseFloat(value);
          if (isNaN(numValue)) {
            rowErrors.push(`${field} must be a number`);
          } else if (numValue < min) {
            rowErrors.push(`${field} must be at least ${min}`);
          } else if (max && numValue > max) {
            rowErrors.push(`${field} must be at most ${max}`);
          }
        } else if (required) {
          rowErrors.push(`${field} is required`);
        }
      });

      // Validate expiry date
      if (row["Expiry Date"] && row["Expiry Date"] !== "") {
        const date = new Date(row["Expiry Date"]);
        if (isNaN(date.getTime())) {
          rowErrors.push("Invalid expiry date format (use YYYY-MM-DD)");
        } else if (date < new Date()) {
          rowErrors.push("Expiry date cannot be in the past");
        }
      }

      // Validate pricing logic
      if (row["Cost Price"] && row["Price per Piece"]) {
        const costPrice = parseFloat(row["Cost Price"]);
        const sellPrice = parseFloat(row["Price per Piece"]);
        if (!isNaN(costPrice) && !isNaN(sellPrice) && costPrice > sellPrice) {
          rowErrors.push("Cost price cannot be higher than selling price");
        }
      }

      if (rowErrors.length > 0) {
        validationErrors.push(`Row ${index + 2}: ${rowErrors.join(", ")}`);
      } else {
        // Transform data to match our enhanced schema with proper sanitization
        const transformedRow = {
          name: row["Product Name"].trim(),
          description: row["Description"] ? row["Description"].trim() : "",
          category: row["Category"].trim(),
          brand: row["Brand"] ? row["Brand"].trim() : "",
          // Enhanced pricing fields with proper null handling - Single unit price
          cost_price: row["Cost Price"] ? parseFloat(row["Cost Price"]) : null,
          price_per_piece: parseFloat(row["Price per Piece"]), // Single authoritative unit price
          margin_percentage: row["Margin Percentage"]
            ? parseFloat(row["Margin Percentage"])
            : 0,
          // Unit conversion fields
          pieces_per_sheet: row["Pieces per Sheet"]
            ? parseInt(row["Pieces per Sheet"])
            : 1,
          sheets_per_box: row["Sheets per Box"]
            ? parseInt(row["Sheets per Box"])
            : 1,
          // Stock management
          stock_in_pieces: parseInt(row["Stock (Pieces)"]),
          reorder_level: row["Reorder Level"]
            ? parseInt(row["Reorder Level"])
            : 10,
          // Additional fields
          supplier: row["Supplier"] ? row["Supplier"].trim() : "",
          expiry_date: row["Expiry Date"] || null,
          batch_number: row["Batch Number"]
            ? row["Batch Number"].trim()
            : `BATCH-${Date.now()}-${index}`,
          // Archive status
          is_archived: false,
          archived_at: null,
          archived_by: null,
          // archive_reason: null, // Temporarily removed until database column is added
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
      console.log("🚀 Starting intelligent import process...");

      // Step 1: Process categories first (auto-create new ones)
      const uniqueCategories = [
        ...new Set(previewData.map((item) => item.category)),
      ];
      console.log(
        `📋 Processing ${uniqueCategories.length} unique categories...`
      );

      const categoryResult =
        await UnifiedCategoryService.createCategoriesFromImport(
          uniqueCategories,
          { user_id: null, import_session: Date.now() }
        );

      setCategoryCreationSummary(categoryResult.summary);
      console.log("✅ Category processing complete:", categoryResult.summary);

      // Step 2: Import products with enhanced category information
      await onImport(previewData);

      // Step 3: Update category statistics after import
      console.log("📊 Updating category statistics...");
      await UnifiedCategoryService.updateAllCategoryStats();

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
    setCategoryCreationSummary(null);
    setNewCategoriesFound([]);
  };

  const downloadTemplate = () => {
    const template = [
      "Product Name,Description,Category,Brand,Cost Price,Price per Piece,Margin Percentage,Pieces per Sheet,Sheets per Box,Stock (Pieces),Reorder Level,Supplier,Expiry Date,Batch Number",
      "Paracetamol 500mg,Pain relief tablet,Pain Relief,GenericPharm,2.00,2.50,25.00,10,10,1000,100,MediSupply,2025-12-31,BATCH-2024-001",
      "Amoxicillin 250mg,Antibiotic capsule,Antibiotics,PharmaCorp,4.60,5.75,25.00,8,12,500,50,HealthDistrib,2024-10-15,BATCH-2024-002",
      "Vitamin C 500mg,Immune support tablet,Vitamins,VitaPlus,1.50,2.50,66.67,20,5,2000,200,NutriCorp,2025-06-30,BATCH-2024-003",
    ].join("\n");

    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "enhanced_inventory_import_template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Modal Header - Fixed */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-xl">
              <Upload className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Import Products</h3>
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

        {/* Modal Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
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
                  <li>
                    <strong>Product Name</strong> - Product identifier
                  </li>
                  <li>
                    <strong>Category</strong> - Must be valid category (Pain
                    Relief, Antibiotics, etc.)
                  </li>
                  <li>
                    <strong>Price per Piece</strong> - Selling price (₱)
                  </li>
                  <li>
                    <strong>Stock (Pieces)</strong> - Current inventory count
                  </li>
                </ul>
                <h4 className="font-medium mt-4 mb-2">
                  Enhanced Pricing (Optional):
                </h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    <strong>Cost Price</strong> - Purchase cost per piece (₱)
                  </li>
                  <li>
                    <strong>Price per Piece</strong> - Selling price per unit
                    (₱) - This is your single authoritative unit price
                  </li>
                  <li>
                    <strong>Margin Percentage</strong> - Profit margin (0-1000%)
                  </li>
                </ul>
                <h4 className="font-medium mt-4 mb-2">
                  Product Details (Optional):
                </h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    <strong>Description, Brand, Supplier</strong> - Product
                    information
                  </li>
                  <li>
                    <strong>Pieces per Sheet, Sheets per Box</strong> - Unit
                    conversion
                  </li>
                  <li>
                    <strong>Reorder Level</strong> - Stock alert threshold
                  </li>
                  <li>
                    <strong>Expiry Date</strong> - Format: YYYY-MM-DD
                  </li>
                  <li>
                    <strong>Batch Number</strong> - Tracking identifier
                  </li>
                </ul>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>💡 Pro Tip:</strong> If Cost Price and Selling Price
                    are provided, margin percentage will be automatically
                    calculated. All pricing fields support automatic markup
                    calculations.
                  </p>
                </div>
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
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-green-900">
                        Ready to Import - Enhanced Data Analysis
                      </h4>
                      <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-green-700">
                        <div>
                          <span className="font-medium">
                            {previewData.length}
                          </span>{" "}
                          products total
                        </div>
                        <div>
                          <span className="font-medium">
                            {previewData.filter((p) => p.cost_price).length}
                          </span>{" "}
                          with cost data
                        </div>
                        <div>
                          <span className="font-medium">
                            {previewData.filter((p) => p.expiry_date).length}
                          </span>{" "}
                          with expiry dates
                        </div>
                        <div>
                          <span className="font-medium">
                            ₱
                            {previewData
                              .reduce(
                                (sum, p) =>
                                  sum + (p.cost_price || 0) * p.stock_in_pieces,
                                0
                              )
                              .toLocaleString()}
                          </span>{" "}
                          total inventory value
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Intelligent Category Information */}
              {newCategoriesFound.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Tag className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">
                        🧠 Intelligent Category Processing
                      </h4>
                      <p className="text-sm text-blue-800 mb-3">
                        <span className="font-medium">
                          {newCategoriesFound.length}
                        </span>{" "}
                        new categories will be automatically created with
                        professional settings:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        {newCategoriesFound.slice(0, 6).map((cat, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-2 bg-white rounded px-2 py-1"
                          >
                            <Plus className="h-3 w-3 text-blue-600" />
                            <span className="text-gray-700">
                              {cat.original}
                            </span>
                            {cat.original !== cat.normalized && (
                              <span className="text-xs text-blue-600">
                                → {cat.normalized}
                              </span>
                            )}
                          </div>
                        ))}
                        {newCategoriesFound.length > 6 && (
                          <div className="text-xs text-blue-700 col-span-full">
                            + {newCategoriesFound.length - 6} more categories...
                          </div>
                        )}
                      </div>
                      <div className="mt-3 text-xs text-blue-700 bg-blue-100 rounded px-2 py-1">
                        <Info className="h-3 w-3 inline mr-1" />
                        Categories are automatically normalized and will include
                        professional icons, colors, and settings.
                      </div>
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
                              Cost Price
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Sell Price
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Margin %
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
                                {product.cost_price
                                  ? `₱${product.cost_price.toFixed(2)}`
                                  : "N/A"}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900 font-medium">
                                ₱{product.price_per_piece.toFixed(2)}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-600">
                                {product.margin_percentage
                                  ? `${product.margin_percentage.toFixed(1)}%`
                                  : "N/A"}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-600">
                                {product.stock_in_pieces.toLocaleString()}
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
                Importing Enhanced Product Data...
              </h4>
              <p className="text-gray-600 mb-4">
                Adding {previewData.length} products with enhanced pricing and
                features.
              </p>
              <div className="bg-blue-50 rounded-lg p-4 mx-auto max-w-md">
                <div className="text-sm text-blue-800 space-y-1">
                  <div className="flex justify-between">
                    <span>Products:</span>
                    <span className="font-medium">{previewData.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>With Pricing Data:</span>
                    <span className="font-medium">
                      {previewData.filter((p) => p.cost_price).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Categories:</span>
                    <span className="font-medium">
                      {new Set(previewData.map((p) => p.category)).size}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions - Fixed at bottom */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex-shrink-0">
          <div className="flex justify-between">
            <div>
              {step === "preview" && (
                <button
                  onClick={() => {
                    setStep("upload");
                    setSelectedFile(null);
                    setPreviewData([]);
                    setErrors([]);
                  }}
                  className="px-4 py-2 border-2 border-gray-200 text-gray-700 font-medium rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
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
                className="px-6 py-2.5 border-2 border-gray-200 text-gray-700 font-medium rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
                disabled={step === "importing"}
              >
                Cancel
              </button>
              {step === "preview" && (
                <button
                  onClick={handleImport}
                  disabled={previewData.length === 0 || isProcessing}
                  className="group flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-xl hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <Upload className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
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
