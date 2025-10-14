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
import { UnifiedCategoryService } from "../../services/domains/inventory/unifiedCategoryService";
import { CSVImportService } from "../../services/domains/inventory/csvImportService";
import { useAuth } from "../../hooks/useAuth";
import notificationService from "../../services/notifications/NotificationService";
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
        // Use new CSV service for intelligent parsing
        data = CSVImportService.parseCSV(text);
      } else if (file.name.endsWith(".json")) {
        data = JSON.parse(text);
      }

      // Use new validation service
      const validationResult = await CSVImportService.validateData(data);

      if (validationResult.validationErrors.length > 0) {
        setErrors(validationResult.validationErrors);
        setStep("upload");
      } else {
        // Smart category detection
        const categoryAnalysis =
          await UnifiedCategoryService.detectAndProcessCategories(
            validationResult.validData,
            user?.id || "system"
          );

        if (!categoryAnalysis.success) {
          throw new Error(categoryAnalysis.error);
        }

        if (categoryAnalysis.data.requiresApproval) {
          setPendingCategories(categoryAnalysis.data.newCategories);
          setPreviewData(validationResult.validData);
          setStep("categories");
        } else {
          setPreviewData(validationResult.validData);
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

  // CSV parsing and validation now handled by CSVImportService

  const handleCategoryApproval = async () => {
    try {
      setIsProcessing(true);

      // Show loading toast
      addToast({
        type: "info",
        message: `Creating ${approvedCategories.length} categories...`,
      });

      // Create approved categories with enhanced logic
      const createResult =
        await UnifiedCategoryService.createApprovedCategories(
          approvedCategories,
          user?.id || "system"
        );

      // Check for failures and show detailed feedback
      if (createResult.hasFailures) {
        const { summary } = createResult;

        // Show warning for partial failures
        if (summary.created > 0) {
          addToast({
            type: "warning",
            message: `Partially completed: ${summary.created} created, ${summary.failed} failed`,
          });
        } else {
          // All failed
          const errorDetails = summary.failedCategories
            .map((f) => `${f.name}: ${f.error}`)
            .join("\n");

          setErrors([
            `Failed to create categories:`,
            ...summary.failedCategories.map(
              (f) => `• ${f.name}: ${f.error || "Unknown error"}`
            ),
          ]);

          addToast({
            type: "error",
            message: `Failed to create ${summary.failed} categories`,
          });

          console.error(
            "❌ [EnhancedImportModal] Category creation failed:",
            createResult
          );
          return; // Don't proceed to preview
        }
      }

      // Enhanced success feedback with detailed statistics
      const summary = createResult.summary || {};
      const successCount = summary.created || 0;
      const skippedCount = summary.skipped || 0;

      let message = `Successfully processed ${approvedCategories.length} categories`;
      if (successCount > 0) {
        message += `\n• Created: ${successCount} new categories`;
      }
      if (skippedCount > 0) {
        message += `\n• Skipped: ${skippedCount} (already existed)`;
      }

      addToast({
        type: "success",
        message,
      });

      console.log(
        "✅ [EnhancedImportModal] Categories processed successfully:",
        {
          approved: approvedCategories.length,
          created: successCount,
          skipped: skippedCount,
          failed: summary.failed || 0,
        }
      );

      setStep("preview");
    } catch (error) {
      console.error(
        "❌ [EnhancedImportModal] Category creation failed:",
        error
      );
      setErrors([`Failed to create categories: ${error.message}`]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    try {
      setStep("importing");
      setIsProcessing(true);

      // Enhanced category mapping with detailed feedback
      const mappingResult = await UnifiedCategoryService.mapCategoriesToIds(
        previewData
      );

      if (!mappingResult.success) {
        throw new Error(mappingResult.error);
      }

      // Log mapping statistics for transparency
      if (mappingResult.stats) {
        console.log(
          "📊 [EnhancedImportModal] Category Mapping Stats:",
          mappingResult.stats
        );

        // Show mapping feedback to user
        const { unmapped, total } = mappingResult.stats;
        if (unmapped > 0) {
          console.warn(
            `⚠️ [EnhancedImportModal] ${unmapped} of ${total} products have unmapped categories`
          );
        }
      }

      // Execute the import
      await onImport(mappingResult.data);

      // Enhanced success feedback
      const importedCount = mappingResult.data?.length || previewData.length;
      console.log(
        `✅ [EnhancedImportModal] Successfully imported ${importedCount} products`
      );

      // Trigger notification for successful import
      try {
        await notificationService.create({
          userId: user?.id,
          title: "Products Imported",
          message: `Successfully imported ${importedCount} product${
            importedCount > 1 ? "s" : ""
          } to inventory`,
          type: "success",
          priority: 2,
          category: "inventory",
        });
        console.log("✅ Import notification added");
      } catch (error) {
        console.warn("⚠️ Failed to add import notification:", error);
      }

      setTimeout(() => {
        setIsProcessing(false);
        onClose();
        resetModal();
      }, 1000);
    } catch (error) {
      console.error("❌ [EnhancedImportModal] Import failed:", error);
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
    CSVImportService.downloadTemplate("medcure_pharmacy_import_template.csv");
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
                        <Lightbulb className="inline mr-1" size={14} />
                        Smart Import Tips
                        <span className="ml-2 px-2 py-1 bg-amber-200 text-amber-800 text-xs rounded-full font-medium">
                          AI-Powered
                        </span>
                      </h4>

                      <div className="space-y-4">
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                            <File className="inline" size={14} />
                            Field Requirements
                          </h5>
                          <div className="text-xs text-gray-600 space-y-1">
                            <div className="mb-2">
                              <span className="font-bold text-red-600">
                                Required:
                              </span>
                            </div>
                            <div className="ml-3">
                              <span className="font-medium">generic_name</span>{" "}
                              - Generic medicine name
                            </div>

                            <div className="mt-2 mb-2">
                              <span className="font-bold text-blue-600">
                                Recommended:
                              </span>
                            </div>
                            <div className="ml-3 space-y-1">
                              <div>
                                <span className="font-medium">brand_name</span>{" "}
                                - Brand name (defaults to generic_name)
                              </div>
                              <div>
                                <span className="font-medium">
                                  price_per_piece
                                </span>{" "}
                                - Unit price in ₱ (defaults to ₱1.00)
                              </div>
                              <div>
                                <span className="font-medium">
                                  category_name
                                </span>{" "}
                                - e.g., "Pain Relief", "Antibiotics" (defaults
                                to "General")
                              </div>
                              <div>
                                <span className="font-medium">
                                  dosage_strength
                                </span>{" "}
                                - e.g., 500mg, 10ml
                              </div>
                              <div>
                                <span className="font-medium">dosage_form</span>{" "}
                                - Tablet, Capsule, Syrup, Injection, etc.
                              </div>
                              <div>
                                <span className="font-medium">
                                  stock_in_pieces
                                </span>{" "}
                                - Initial stock quantity (defaults to 0)
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                            <Calendar className="inline" size={14} />
                            Date Formats
                          </h5>
                          <div className="text-xs text-gray-600 space-y-1">
                            <div>✓ 2024-12-31 (ISO standard)</div>
                            <div>✓ 31/12/2024 (European)</div>
                            <div>✓ 12/31/2024 (US format)</div>
                            <div>✓ 31.12.2024 (Dot notation)</div>
                          </div>
                        </div>

                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                            <CheckCircle className="inline" size={14} />
                            Smart Medicine Features
                          </h5>
                          <div className="text-xs text-gray-600 space-y-1">
                            <div>• Auto-creates missing categories</div>
                            <div>• Validates medicine data and pricing</div>
                            <div>
                              • Handles dosage forms and classifications
                            </div>
                            <div>• Smart batch number generation</div>
                            <div>• Flexible date format detection</div>
                            <div>• Intelligent error prevention</div>
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

                {/* Select All/None Controls */}
                <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-gray-700">
                      {approvedCategories.length} of {pendingCategories.length}{" "}
                      selected
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() =>
                        setApprovedCategories([...pendingCategories])
                      }
                      className="px-3 py-1 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => setApprovedCategories([])}
                      className="px-3 py-1 text-sm bg-gray-600 text-white hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      Select None
                    </button>
                  </div>
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
                    className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
                  >
                    {isProcessing ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        <span>
                          Creating {approvedCategories.length} categories...
                        </span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        <span>
                          Create {approvedCategories.length} Categories
                        </span>
                      </>
                    )}
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
                            ₱{item.price_per_piece}
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
                  <Download className="h-12 w-12 text-blue-600 animate-pulse" />
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
