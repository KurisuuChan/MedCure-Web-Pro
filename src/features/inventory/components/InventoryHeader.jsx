import React from "react";
import { Package, Download, Upload, Plus, BarChart3 } from "lucide-react";

/**
 * Inventory Page Header Component
 * Contains title, action buttons with modal triggers for Categories and Archived
 */
function InventoryHeader({
  activeTab,
  setActiveTab,
  setShowExportModal,
  setShowImportModal,
  setShowAddModal,
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="bg-blue-100 p-3 rounded-xl">
            <Package className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <span>Inventory Management</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Active
              </span>
            </h1>
            <p className="text-gray-600 mt-1">
              Complete inventory management with categories and analytics
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Export Button */}
          <button
            onClick={() => setShowExportModal(true)}
            className="group flex items-center space-x-2 px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg hover:bg-green-50 hover:border-green-200 hover:text-green-700 transition-all duration-200"
          >
            <Download className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
            <span className="font-medium">Export</span>
          </button>

          {/* Import Button */}
          <button
            onClick={() => setShowImportModal(true)}
            className="group flex items-center space-x-2 px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all duration-200"
          >
            <Upload className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
            <span className="font-medium">Import</span>
          </button>

          {/* Add Product Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="group flex items-center space-x-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-200" />
            <span className="font-semibold">Add Product</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation - Only for Products vs Analytics */}
      <div className="border-t border-gray-200 mt-6 pt-6">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("inventory")}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${
              activeTab === "inventory"
                ? "bg-blue-600 text-white shadow-md"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            <Package className="h-4 w-4" />
            <span>Products</span>
          </button>
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${
              activeTab === "dashboard"
                ? "bg-blue-600 text-white shadow-md"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Analytics</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default InventoryHeader;
