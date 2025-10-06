import React from "react";
import { Package, Download, Upload, Plus, BarChart3 } from "lucide-react";

/**
 * Inventory Page Header Component - Redesigned for Modern UX
 * Compact header with integrated tabs and action buttons
 */
function InventoryHeader({
  activeTab,
  setActiveTab,
  setShowExportModal,
  setShowImportModal,
  setShowAddModal,
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header Bar */}
      <div className="px-6 py-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {/* Left: Title Section */}
          <div className="flex items-center space-x-4">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  Inventory Management
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  Active
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Manage products and view analytics
              </p>
            </div>
          </div>

          {/* Right: Action Buttons - Contextual */}
          {activeTab === "inventory" && (
            <div className="flex items-center space-x-3">
              {/* Secondary Actions */}
              <button
                onClick={() => setShowExportModal(true)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
                title="Export Products"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>

              <button
                onClick={() => setShowImportModal(true)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
                title="Import Products"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import
              </button>

              {/* Primary Action */}
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm hover:shadow-md transition-all"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Integrated Tab Navigation */}
      <div className="px-6">
        <nav className="flex space-x-1 -mb-px" role="tablist">
          <button
            onClick={() => setActiveTab("inventory")}
            className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "inventory"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
            }`}
            role="tab"
            aria-selected={activeTab === "inventory"}
          >
            <Package className="h-4 w-4" />
            <span>Products</span>
          </button>

          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "dashboard"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
            }`}
            role="tab"
            aria-selected={activeTab === "dashboard"}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Analytics & Reports</span>
          </button>
        </nav>
      </div>
    </div>
  );
}

export default InventoryHeader;
