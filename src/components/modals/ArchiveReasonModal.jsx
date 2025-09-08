import React, { useState } from "react";
import {
  X,
  AlertTriangle,
  Archive,
  Check,
  FileText,
  Calendar,
  Clock,
  User,
} from "lucide-react";

/**
 * Professional Archive Reason Modal Component
 * Provides a comprehensive interface for archiving products with proper reason tracking
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to close the modal
 * @param {Function} props.onConfirm - Function called when archive is confirmed
 * @param {Object} props.product - Product object being archived
 * @param {boolean} props.isLoading - Whether the archive operation is in progress
 */
const ArchiveReasonModal = ({
  isOpen,
  onClose,
  onConfirm,
  product,
  isLoading = false,
}) => {
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Predefined archive reasons commonly used in pharmacy inventory management
  const archiveReasons = [
    {
      id: "expired",
      label: "Product Expired",
      description: "Product has reached expiration date",
      icon: Calendar,
      category: "safety",
    },
    {
      id: "discontinued",
      label: "Discontinued by Supplier",
      description: "Supplier no longer manufactures this product",
      icon: X,
      category: "business",
    },
    {
      id: "recalled",
      label: "Product Recalled",
      description: "Product recalled by manufacturer or regulatory authority",
      icon: AlertTriangle,
      category: "safety",
    },
    {
      id: "low_demand",
      label: "Low Demand",
      description: "Product has consistently low sales",
      icon: Clock,
      category: "business",
    },
    {
      id: "quality_issues",
      label: "Quality Issues",
      description: "Product quality concerns or defects",
      icon: AlertTriangle,
      category: "safety",
    },
    {
      id: "regulatory",
      label: "Regulatory Compliance",
      description: "No longer meets regulatory requirements",
      icon: FileText,
      category: "compliance",
    },
    {
      id: "supplier_change",
      label: "Supplier Change",
      description: "Switching to different supplier for same product",
      icon: User,
      category: "business",
    },
    {
      id: "inventory_optimization",
      label: "Inventory Optimization",
      description: "Part of inventory reduction strategy",
      icon: Archive,
      category: "business",
    },
  ];

  const handleReasonSelect = (reasonId) => {
    setSelectedReason(reasonId);
    setCustomReason(""); // Clear custom reason when predefined is selected
  };

  const handleCustomReasonChange = (e) => {
    setCustomReason(e.target.value);
    if (e.target.value.trim()) {
      setSelectedReason("custom"); // Auto-select custom when typing
    }
  };

  const getFinalReason = () => {
    if (selectedReason === "custom") {
      return customReason.trim();
    }
    const reason = archiveReasons.find((r) => r.id === selectedReason);
    return reason ? reason.label : "";
  };

  const isValidSelection = () => {
    if (selectedReason === "custom") {
      return customReason.trim().length >= 5; // Minimum 5 characters for custom reason
    }
    return selectedReason !== "";
  };

  const handleProceedToConfirmation = () => {
    if (isValidSelection()) {
      setShowConfirmation(true);
    }
  };

  const handleConfirmArchive = () => {
    const finalReason = getFinalReason();
    onConfirm(finalReason);
  };

  const resetModal = () => {
    setSelectedReason("");
    setCustomReason("");
    setShowConfirmation(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const getCategoryColor = (category) => {
    const colors = {
      safety: "text-red-600 bg-red-50",
      business: "text-blue-600 bg-blue-50",
      compliance: "text-purple-600 bg-purple-50",
    };
    return colors[category] || "text-gray-600 bg-gray-50";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl">
        {!showConfirmation ? (
          // Step 1: Reason Selection
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-red-50">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Archive className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Archive Product
                  </h3>
                  <p className="text-sm text-gray-600">
                    Please specify the reason for archiving "
                    {product?.name || "this product"}"
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isLoading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 max-h-96 overflow-y-auto">
              <div className="space-y-4">
                {/* Product Information */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Product Details
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Name:</span>
                      <span className="ml-2 font-medium">{product?.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Category:</span>
                      <span className="ml-2 font-medium">
                        {product?.category}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Current Stock:</span>
                      <span className="ml-2 font-medium">
                        {product?.stock_quantity || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <span className="ml-2 font-medium capitalize">
                        {product?.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Archive Reasons */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Select Archive Reason
                  </h4>
                  <div className="space-y-2">
                    {archiveReasons.map((reason) => {
                      const IconComponent = reason.icon;
                      return (
                        <button
                          key={reason.id}
                          onClick={() => handleReasonSelect(reason.id)}
                          className={`w-full text-left p-3 rounded-lg border transition-all ${
                            selectedReason === reason.id
                              ? "border-blue-500 bg-blue-50 ring-1 ring-blue-200"
                              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div
                              className={`flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center ${getCategoryColor(
                                reason.category
                              )}`}
                            >
                              <IconComponent className="w-3 h-3" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900">
                                  {reason.label}
                                </p>
                                {selectedReason === reason.id && (
                                  <Check className="w-4 h-4 text-blue-600" />
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {reason.description}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Reason */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Or Enter Custom Reason
                  </h4>
                  <div className="relative">
                    <textarea
                      value={customReason}
                      onChange={handleCustomReasonChange}
                      placeholder="Enter a detailed reason for archiving this product..."
                      className={`w-full p-3 border rounded-lg resize-none transition-colors ${
                        selectedReason === "custom"
                          ? "border-blue-500 ring-1 ring-blue-200"
                          : "border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                      } focus:outline-none`}
                      rows={3}
                      maxLength={200}
                    />
                    <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                      {customReason.length}/200
                    </div>
                  </div>
                  {selectedReason === "custom" && customReason.length < 5 && (
                    <p className="text-xs text-red-500 mt-1">
                      Custom reason must be at least 5 characters long
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleProceedToConfirmation}
                disabled={!isValidSelection() || isLoading}
                className="px-6 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Continue
              </button>
            </div>
          </>
        ) : (
          // Step 2: Confirmation
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-orange-50">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Confirm Archive
                  </h3>
                  <p className="text-sm text-gray-600">
                    Please review the details before proceeding
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isLoading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Confirmation Content */}
            <div className="p-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800">
                      Important Notice
                    </h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      This action will archive the product and remove it from
                      active inventory. The product can be restored later if
                      needed.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Archive Summary
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Product:</span>
                      <span className="text-sm font-medium">
                        {product?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Reason:</span>
                      <span className="text-sm font-medium">
                        {getFinalReason()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Current Stock:
                      </span>
                      <span className="text-sm font-medium">
                        {product?.stock_quantity || 0} units
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Archive Date:
                      </span>
                      <span className="text-sm font-medium">
                        {new Date().toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                Back
              </button>
              <button
                onClick={handleConfirmArchive}
                disabled={isLoading}
                className="px-6 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Archiving...</span>
                  </>
                ) : (
                  <>
                    <Archive className="w-4 h-4" />
                    <span>Archive Product</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ArchiveReasonModal;
