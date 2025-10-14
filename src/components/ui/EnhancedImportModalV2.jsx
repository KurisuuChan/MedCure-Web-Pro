/**
 * Enhanced Import Modal V2 - With Modern Animations & Loading States
 * Professional multi-stage import process with real-time feedback
 */

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
  Zap,
  Package,
} from "lucide-react";
import { UnifiedCategoryService } from "../../services/domains/inventory/unifiedCategoryService";
import { CSVImportService } from "../../services/domains/inventory/csvImportService";
import { useAuth } from "../../hooks/useAuth";
import notificationService from "../../services/notifications/NotificationService";
import { UnifiedSpinner, ProgressBar } from "./loading/UnifiedSpinner";
import "./ScrollableModal.css";

export function EnhancedImportModalV2({ isOpen, onClose, onImport, addToast }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [errors, setErrors] = useState([]);
  const [step, setStep] = useState("upload"); // "upload", "categories", "preview", "importing"
  const [pendingCategories, setPendingCategories] = useState([]);
  const [approvedCategories, setApprovedCategories] = useState([]);

  // New: Import progress tracking
  const [importProgress, setImportProgress] = useState({
    stage: "",
    percentage: 0,
    current: 0,
    total: 0,
    stages: [],
  });

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
        data = CSVImportService.parseCSV(text);
      } else if (file.name.endsWith(".json")) {
        data = JSON.parse(text);
      }

      const validationResult = await CSVImportService.validateData(data);

      if (validationResult.validationErrors.length > 0) {
        setErrors(validationResult.validationErrors);
        setStep("upload");
      } else {
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

  const handleCategoryApproval = async () => {
    try {
      setStep("creating-categories");
      setIsProcessing(true);

      // Initialize category creation progress
      const categoryStages = [
        { name: "Validating categories", weight: 20 },
        { name: "Creating categories", weight: 50 },
        { name: "Mapping relationships", weight: 20 },
        { name: "Finalizing setup", weight: 10 },
      ];

      setImportProgress({
        stage: categoryStages[0].name,
        percentage: 0,
        current: 0,
        total: approvedCategories.length,
        stages: categoryStages.map((s) => ({ ...s, status: "pending" })),
      });

      addToast({
        type: "info",
        message: `Creating ${approvedCategories.length} categories...`,
      });

      // Stage 1: Validating (20%)
      setImportProgress((prev) => ({
        ...prev,
        stage: categoryStages[0].name,
        percentage: 5,
        current: 0,
        stages: prev.stages.map((s, idx) => ({
          ...s,
          status: idx === 0 ? "active" : "pending",
        })),
      }));

      await new Promise((resolve) => setTimeout(resolve, 300));

      setImportProgress((prev) => ({
        ...prev,
        percentage: 20,
        stages: prev.stages.map((s, idx) => ({
          ...s,
          status: idx === 0 ? "completed" : idx === 1 ? "active" : "pending",
        })),
      }));

      // Stage 2: Creating categories (50%) - Track actual creation
      setImportProgress((prev) => ({
        ...prev,
        stage: categoryStages[1].name,
        percentage: 25,
      }));

      const createResult =
        await UnifiedCategoryService.createApprovedCategories(
          approvedCategories,
          user?.id || "system"
        );

      // Update progress after creation (70%)
      setImportProgress((prev) => ({
        ...prev,
        percentage: 70,
        current: approvedCategories.length,
        stages: prev.stages.map((s, idx) => ({
          ...s,
          status: idx <= 1 ? "completed" : idx === 2 ? "active" : "pending",
        })),
      }));

      if (createResult.hasFailures) {
        const { summary } = createResult;

        if (summary.created > 0) {
          addToast({
            type: "warning",
            message: `Partially completed: ${summary.created} created, ${summary.failed} failed`,
          });
        } else {
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

          setStep("categories");
          setIsProcessing(false);
          return;
        }
      }

      // Stage 3: Mapping relationships (20%)
      setImportProgress((prev) => ({
        ...prev,
        stage: categoryStages[2].name,
        percentage: 80,
      }));

      await new Promise((resolve) => setTimeout(resolve, 300));

      // Stage 4: Finalizing (10%)
      setImportProgress((prev) => ({
        ...prev,
        stage: categoryStages[3].name,
        percentage: 95,
        stages: prev.stages.map((s, idx) => ({
          ...s,
          status: idx <= 2 ? "completed" : idx === 3 ? "active" : "pending",
        })),
      }));

      await new Promise((resolve) => setTimeout(resolve, 200));

      const summary = createResult.summary || {};
      const successCount = summary.created || 0;
      const skippedCount = summary.skipped || 0;

      // Final progress update
      setImportProgress((prev) => ({
        ...prev,
        stage: "Complete!",
        percentage: 100,
        current: approvedCategories.length,
        stages: prev.stages.map((s) => ({ ...s, status: "completed" })),
      }));

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

      setTimeout(() => {
        setStep("preview");
        setIsProcessing(false);
      }, 1000);
    } catch (error) {
      setErrors([`Failed to create categories: ${error.message}`]);
      setStep("categories");
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    try {
      setStep("importing");
      setIsProcessing(true);

      // Initialize progress tracking with weight-based stages
      const stages = [
        { name: "Parsing file", weight: 10 },
        { name: "Validating data", weight: 15 },
        { name: "Mapping categories", weight: 15 },
        { name: "Creating products", weight: 50 },
        { name: "Finalizing import", weight: 10 },
      ];

      setImportProgress({
        stage: stages[0].name,
        percentage: 0,
        current: 0,
        total: previewData.length,
        stages: stages.map((s) => ({ ...s, status: "pending" })),
      });

      // Stage 1: Parsing file (10%)
      setImportProgress((prev) => ({
        ...prev,
        stage: stages[0].name,
        percentage: 5,
        current: 0,
        stages: prev.stages.map((s, idx) => ({
          ...s,
          status: idx === 0 ? "active" : "pending",
        })),
      }));

      await new Promise((resolve) => setTimeout(resolve, 200));

      setImportProgress((prev) => ({
        ...prev,
        percentage: 10,
        stages: prev.stages.map((s, idx) => ({
          ...s,
          status: idx === 0 ? "completed" : idx === 1 ? "active" : "pending",
        })),
      }));

      // Stage 2: Validating data (15%)
      setImportProgress((prev) => ({
        ...prev,
        stage: stages[1].name,
        percentage: 15,
      }));

      await new Promise((resolve) => setTimeout(resolve, 300));

      setImportProgress((prev) => ({
        ...prev,
        percentage: 25,
        current: Math.floor(previewData.length * 0.25),
        stages: prev.stages.map((s, idx) => ({
          ...s,
          status: idx <= 1 ? "completed" : idx === 2 ? "active" : "pending",
        })),
      }));

      // Stage 3: Mapping categories (15%)
      setImportProgress((prev) => ({
        ...prev,
        stage: stages[2].name,
        percentage: 30,
      }));

      const mappingResult = await UnifiedCategoryService.mapCategoriesToIds(
        previewData
      );

      if (!mappingResult.success) {
        throw new Error(mappingResult.error);
      }

      setImportProgress((prev) => ({
        ...prev,
        percentage: 40,
        current: Math.floor(previewData.length * 0.4),
        stages: prev.stages.map((s, idx) => ({
          ...s,
          status: idx <= 2 ? "completed" : idx === 3 ? "active" : "pending",
        })),
      }));

      // Stage 4: Creating products (50%) - This is the main work
      setImportProgress((prev) => ({
        ...prev,
        stage: stages[3].name,
        percentage: 45,
      }));

      // Call the actual import with progress callback
      await onImport(mappingResult.data);

      // Simulate gradual progress during product creation
      const progressSteps = 10;
      for (let i = 1; i <= progressSteps; i++) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        const progressPercent = 45 + (45 * i) / progressSteps; // 45% to 90%
        const currentProducts = Math.floor(
          (previewData.length * i) / progressSteps
        );

        setImportProgress((prev) => ({
          ...prev,
          percentage: Math.min(progressPercent, 90),
          current: Math.min(currentProducts, previewData.length),
        }));
      }

      // Stage 5: Finalizing import (10%)
      setImportProgress((prev) => ({
        ...prev,
        stage: stages[4].name,
        percentage: 92,
        current: previewData.length,
        stages: prev.stages.map((s, idx) => ({
          ...s,
          status: idx <= 3 ? "completed" : idx === 4 ? "active" : "pending",
        })),
      }));

      await new Promise((resolve) => setTimeout(resolve, 300));

      const importedCount = mappingResult.data?.length || previewData.length;

      // Final progress update
      setImportProgress((prev) => ({
        ...prev,
        stage: "Complete!",
        percentage: 100,
        current: previewData.length,
        stages: prev.stages.map((s) => ({ ...s, status: "completed" })),
      }));

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
      } catch (error) {
        console.warn("⚠️ Failed to add import notification:", error);
      }

      setTimeout(() => {
        setIsProcessing(false);
        onClose();
        resetModal();
      }, 1500);
    } catch (error) {
      console.error("❌ Import failed:", error);
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
    setImportProgress({
      stage: "",
      percentage: 0,
      current: 0,
      total: 0,
      stages: [],
    });
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full h-[90vh] flex flex-col overflow-hidden animate-scale-up">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <Upload className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                Smart Import System
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                  AI-Powered
                </span>
              </h3>
              <p className="text-sm text-gray-600">
                Intelligent category detection and validation
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
            <X className="h-6 w-6 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {/* Steps Indicator */}
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-4">
            {/* Step 1: Upload */}
            <div
              className={`flex items-center space-x-2 transition-all duration-300 ${
                step === "upload"
                  ? "text-blue-600 scale-105"
                  : ["categories", "preview", "importing"].includes(step)
                  ? "text-green-600"
                  : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                  step === "upload"
                    ? "bg-blue-500 text-white shadow-lg"
                    : ["categories", "preview", "importing"].includes(step)
                    ? "bg-green-500 text-white"
                    : "bg-gray-200"
                }`}
              >
                {["categories", "preview", "importing"].includes(step) ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <span className="text-sm font-medium">1</span>
                )}
              </div>
              <span className="font-medium">Upload</span>
            </div>

            <div
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                ["categories", "preview", "importing"].includes(step)
                  ? "bg-green-500"
                  : "bg-gray-300"
              }`}
            ></div>

            {/* Step 2: Categories */}
            <div
              className={`flex items-center space-x-2 transition-all duration-300 ${
                step === "categories"
                  ? "text-blue-600 scale-105"
                  : ["preview", "importing"].includes(step)
                  ? "text-green-600"
                  : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                  step === "categories"
                    ? "bg-blue-500 text-white shadow-lg"
                    : ["preview", "importing"].includes(step)
                    ? "bg-green-500 text-white"
                    : "bg-gray-200"
                }`}
              >
                {["preview", "importing"].includes(step) ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <span className="text-sm font-medium">2</span>
                )}
              </div>
              <span className="font-medium">Categories</span>
            </div>

            <div
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                ["preview", "importing"].includes(step)
                  ? "bg-green-500"
                  : "bg-gray-300"
              }`}
            ></div>

            {/* Step 3: Preview */}
            <div
              className={`flex items-center space-x-2 transition-all duration-300 ${
                step === "preview"
                  ? "text-blue-600 scale-105"
                  : step === "importing"
                  ? "text-green-600"
                  : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                  step === "preview"
                    ? "bg-blue-500 text-white shadow-lg"
                    : step === "importing"
                    ? "bg-green-500 text-white"
                    : "bg-gray-200"
                }`}
              >
                {step === "importing" ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <span className="text-sm font-medium">3</span>
                )}
              </div>
              <span className="font-medium">Preview</span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto scrollable-modal-content">
          <div className="p-6">
            {/* Upload Step */}
            {step === "upload" && (
              <div className="space-y-6 animate-slide-up">
                <div className="text-center">
                  <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-4 animate-bounce-gentle">
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
                  className="group border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 cursor-pointer transform hover:scale-[1.02]"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <File className="h-12 w-12 text-gray-400 group-hover:text-blue-500 mx-auto mb-4 transition-all duration-300 group-hover:animate-bounce-gentle" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Drop your file here or click to browse
                  </p>
                  <p className="text-gray-600">Supports CSV and JSON formats</p>
                  {selectedFile && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg animate-slide-up">
                      <p className="text-sm text-green-700 font-medium">
                        ✓ {selectedFile.name}
                      </p>
                    </div>
                  )}
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
                    className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-105"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Template</span>
                  </button>
                </div>

                {/* Smart Import Guide */}
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4 animate-slide-up">
                  <div className="flex items-start space-x-3">
                    <Zap className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-amber-900 mb-2 flex items-center">
                        <Lightbulb className="inline mr-1" size={14} />
                        Smart Import Tips
                        <span className="ml-2 px-2 py-1 bg-gradient-to-r from-amber-200 to-yellow-200 text-amber-800 text-xs rounded-full font-medium">
                          AI-Powered
                        </span>
                      </h4>

                      <div className="space-y-3 text-xs text-gray-700">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="font-semibold text-red-600">
                              Required Fields:
                            </p>
                            <p>• generic_name</p>
                          </div>
                          <div className="space-y-1">
                            <p className="font-semibold text-blue-600">
                              Recommended:
                            </p>
                            <p>• brand_name, price_per_piece</p>
                            <p>• category_name, stock</p>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-amber-200">
                          <p className="font-medium mb-1">✨ Features:</p>
                          <div className="grid grid-cols-2 gap-1">
                            <p>• Auto-creates categories</p>
                            <p>• Flexible date formats</p>
                            <p>• Smart validation</p>
                            <p>• Batch numbering</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {isProcessing && (
                  <div className="flex justify-center p-6 animate-fade-in">
                    <UnifiedSpinner
                      variant="gradient"
                      size="lg"
                      text="Processing your file..."
                    />
                  </div>
                )}
              </div>
            )}

            {/* Categories Step */}
            {step === "categories" && (
              <div className="space-y-6 animate-slide-up">
                <div className="text-center">
                  <div className="mx-auto w-24 h-24 bg-gradient-to-br from-yellow-100 to-amber-100 rounded-full flex items-center justify-center mb-4 animate-pulse-ring">
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

                {/* Select Controls */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-gray-700">
                      <span className="text-blue-600 font-bold">
                        {approvedCategories.length}
                      </span>{" "}
                      of {pendingCategories.length} selected
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() =>
                        setApprovedCategories([...pendingCategories])
                      }
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-all duration-200 hover:scale-105 shadow-sm"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => setApprovedCategories([])}
                      className="px-3 py-1.5 text-sm bg-gray-600 text-white hover:bg-gray-700 rounded-lg transition-all duration-200 hover:scale-105 shadow-sm"
                    >
                      Select None
                    </button>
                  </div>
                </div>

                {/* Category Cards with Stagger Animation */}
                <div className="space-y-3">
                  {pendingCategories.map((category, index) => {
                    const isApproved = approvedCategories.some(
                      (c) => c.name === category.name
                    );
                    return (
                      <div
                        key={index}
                        className={`p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer transform hover:scale-[1.02] animate-slide-up ${
                          isApproved
                            ? "border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 shadow-md"
                            : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm"
                        }`}
                        style={{ animationDelay: `${index * 0.05}s` }}
                        onClick={() => toggleCategoryApproval(index)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div
                              className="w-5 h-5 rounded-full shadow-sm transition-transform duration-200 hover:scale-110"
                              style={{ backgroundColor: category.color }}
                            ></div>
                            <div>
                              <h5 className="font-medium text-gray-900 flex items-center gap-2">
                                {category.name}
                                {isApproved && (
                                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                    Approved
                                  </span>
                                )}
                              </h5>
                              <p className="text-sm text-gray-600">
                                {category.count} products • Icon:{" "}
                                {category.icon}
                              </p>
                            </div>
                          </div>
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                              isApproved
                                ? "border-green-500 bg-green-500 scale-110"
                                : "border-gray-300 hover:border-blue-400"
                            }`}
                          >
                            {isApproved && (
                              <CheckCircle className="h-4 w-4 text-white animate-success-scale" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    onClick={() => setStep("upload")}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCategoryApproval}
                    disabled={approvedCategories.length === 0 || isProcessing}
                    className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:shadow-none transform hover:scale-105 disabled:scale-100"
                  >
                    {isProcessing ? (
                      <>
                        <UnifiedSpinner
                          variant="default"
                          size="sm"
                          color="white"
                        />
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
              <div className="space-y-6 animate-slide-up">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Package className="h-5 w-5 text-blue-600" />
                      Import Preview
                    </h4>
                    <p className="text-gray-600">
                      <span className="font-bold text-blue-600">
                        {previewData.length}
                      </span>{" "}
                      products ready for import
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-full shadow-sm">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Ready to Import</span>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">
                          Product
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">
                          Category
                        </th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">
                          Price
                        </th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">
                          Stock
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {previewData.slice(0, 10).map((item, index) => (
                        <tr
                          key={index}
                          className="hover:bg-blue-50/30 transition-colors duration-150 animate-slide-up"
                          style={{ animationDelay: `${index * 0.03}s` }}
                        >
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium text-gray-900">
                                {item.name}
                              </div>
                              {item.description && (
                                <div className="text-sm text-gray-600">
                                  {item.description}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                              {item.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-gray-900">
                            ₱{item.price_per_piece}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-600">
                            {item.stock_in_pieces}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {previewData.length > 10 && (
                    <div className="bg-gray-50 border-t border-gray-200 py-3 text-center">
                      <p className="text-sm text-gray-600">
                        And{" "}
                        <span className="font-semibold text-gray-900">
                          {previewData.length - 10}
                        </span>{" "}
                        more products...
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    onClick={() => setStep("upload")}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleImport}
                    className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Import {previewData.length} Products</span>
                  </button>
                </div>
              </div>
            )}

            {/* Importing Step - Unified Clean Loading Screen */}
            {step === "importing" && (
              <div className="text-center py-4 sm:py-8 px-4 space-y-4 sm:space-y-6 animate-fade-in">
                {/* Simplified Animated Icon - No Exaggerated Rings */}
                <div className="mx-auto w-20 h-20 sm:w-24 sm:h-24 relative flex items-center justify-center">
                  {/* Single subtle rotating ring */}
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin"></div>
                  {/* Icon container */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                    <Package className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600" />
                  </div>
                </div>

                {/* Progress Percentage - Large and Clear */}
                <div className="text-center">
                  <div className="text-4xl sm:text-5xl font-bold text-blue-600 mb-2">
                    {importProgress.percentage}%
                  </div>
                  <h4 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1">
                    {importProgress.stage}
                  </h4>
                  <p className="text-sm sm:text-base text-gray-600">
                    Please wait while we import your products
                  </p>
                </div>

                {/* Stage Progress - Compact List */}
                <div className="max-w-sm sm:max-w-md mx-auto space-y-2">
                  {importProgress.stages.map((stage, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg transition-all duration-300 ${
                        stage.status === "completed"
                          ? "bg-green-50"
                          : stage.status === "active"
                          ? "bg-blue-50"
                          : "bg-gray-50"
                      }`}
                    >
                      {stage.status === "completed" ? (
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                      ) : stage.status === "active" ? (
                        <UnifiedSpinner variant="dots" size="sm" color="blue" />
                      ) : (
                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-gray-300 flex-shrink-0"></div>
                      )}
                      <span
                        className={`text-sm sm:text-base font-medium ${
                          stage.status === "completed"
                            ? "text-green-700"
                            : stage.status === "active"
                            ? "text-blue-700"
                            : "text-gray-500"
                        }`}
                      >
                        {stage.name}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Progress Bar - Clean Design */}
                <div className="max-w-sm sm:max-w-md mx-auto">
                  <ProgressBar
                    progress={importProgress.percentage}
                    variant="gradient"
                    size="md"
                  />
                </div>

                {/* Product Count - Below Progress Bar */}
                {importProgress.total > 0 && (
                  <p className="text-xs sm:text-sm font-semibold text-gray-700">
                    Processing{" "}
                    <span className="text-blue-600">
                      {importProgress.current}
                    </span>{" "}
                    of{" "}
                    <span className="text-blue-600">
                      {importProgress.total}
                    </span>{" "}
                    products
                  </p>
                )}
              </div>
            )}

            {/* Creating Categories Step - Unified Clean Loading Screen */}
            {step === "creating-categories" && (
              <div className="text-center py-4 sm:py-8 px-4 space-y-4 sm:space-y-6 animate-fade-in">
                {/* Simplified Animated Icon - No Exaggerated Rings */}
                <div className="mx-auto w-20 h-20 sm:w-24 sm:h-24 relative flex items-center justify-center">
                  {/* Single subtle rotating ring */}
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-green-500 animate-spin"></div>
                  {/* Icon container */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
                    <Plus className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />
                  </div>
                </div>

                {/* Progress Percentage - Large and Clear */}
                <div className="text-center">
                  <div className="text-4xl sm:text-5xl font-bold text-green-600 mb-2">
                    {importProgress.percentage}%
                  </div>
                  <h4 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1">
                    {importProgress.stage}
                  </h4>
                  <p className="text-sm sm:text-base text-gray-600">
                    Creating new categories for your products
                  </p>
                </div>

                {/* Stage Progress - Compact List */}
                <div className="max-w-sm sm:max-w-md mx-auto space-y-2">
                  {importProgress.stages.map((stage, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg transition-all duration-300 ${
                        stage.status === "completed"
                          ? "bg-green-50"
                          : stage.status === "active"
                          ? "bg-emerald-50"
                          : "bg-gray-50"
                      }`}
                    >
                      {stage.status === "completed" ? (
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                      ) : stage.status === "active" ? (
                        <UnifiedSpinner
                          variant="dots"
                          size="sm"
                          color="green"
                        />
                      ) : (
                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-gray-300 flex-shrink-0"></div>
                      )}
                      <span
                        className={`text-sm sm:text-base font-medium ${
                          stage.status === "completed"
                            ? "text-green-700"
                            : stage.status === "active"
                            ? "text-emerald-700"
                            : "text-gray-500"
                        }`}
                      >
                        {stage.name}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Progress Bar - Clean Design */}
                <div className="max-w-sm sm:max-w-md mx-auto">
                  <ProgressBar
                    progress={importProgress.percentage}
                    variant="gradient"
                    size="md"
                  />
                </div>

                {/* Category Count - Below Progress Bar */}
                {importProgress.total > 0 && (
                  <p className="text-xs sm:text-sm font-semibold text-gray-700">
                    Processing{" "}
                    <span className="text-green-600">
                      {importProgress.current}
                    </span>{" "}
                    of{" "}
                    <span className="text-green-600">
                      {importProgress.total}
                    </span>{" "}
                    categories
                  </p>
                )}
              </div>
            )}

            {/* Errors */}
            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 animate-shake">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0 animate-wiggle" />
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

export default EnhancedImportModalV2;
