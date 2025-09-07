import React, { useState } from "react";
import { X, Download, FileText, Check } from "lucide-react";

export function ExportModal({ isOpen, onClose, products = [] }) {
  const [exportOptions, setExportOptions] = useState({
    format: "csv",
    columns: {
      name: true,
      category: true,
      brand: true,
      stock: true,
      price: true,
      expiry: true,
      supplier: true,
      batchNumber: true,
    },
    filters: {
      category: "all",
      stockStatus: "all",
      expiryStatus: "all",
    },
  });

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      // Filter products based on selected filters
      let filteredProducts = products;

      if (exportOptions.filters.category !== "all") {
        filteredProducts = filteredProducts.filter(
          (product) => product.category === exportOptions.filters.category
        );
      }

      if (exportOptions.filters.stockStatus !== "all") {
        filteredProducts = filteredProducts.filter((product) => {
          const stockLevel = product.stock_in_pieces || 0;
          const reorderLevel = product.reorder_level || 0;

          switch (exportOptions.filters.stockStatus) {
            case "low":
              return stockLevel <= reorderLevel && stockLevel > 0;
            case "out":
              return stockLevel === 0;
            case "normal":
              return stockLevel > reorderLevel;
            default:
              return true;
          }
        });
      }

      if (exportOptions.filters.expiryStatus !== "all") {
        filteredProducts = filteredProducts.filter((product) => {
          const expiryDate = new Date(product.expiry_date);
          const today = new Date();
          const daysUntilExpiry = Math.ceil(
            (expiryDate - today) / (1000 * 60 * 60 * 24)
          );

          switch (exportOptions.filters.expiryStatus) {
            case "expired":
              return daysUntilExpiry < 0;
            case "expiring":
              return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
            case "fresh":
              return daysUntilExpiry > 30;
            default:
              return true;
          }
        });
      }

      // Prepare data for export
      const dataToExport = filteredProducts.map((product) => {
        const row = {};

        if (exportOptions.columns.name) row["Product Name"] = product.name;
        if (exportOptions.columns.category) row["Category"] = product.category;
        if (exportOptions.columns.brand) row["Brand"] = product.brand;
        if (exportOptions.columns.stock)
          row["Stock (Pieces)"] = product.stock_in_pieces;
        if (exportOptions.columns.price)
          row["Price per Piece"] = product.price_per_piece;
        if (exportOptions.columns.expiry)
          row["Expiry Date"] = product.expiry_date?.split("T")[0];
        if (exportOptions.columns.supplier) row["Supplier"] = product.supplier;
        if (exportOptions.columns.batchNumber)
          row["Batch Number"] = product.batch_number;

        return row;
      });

      // Generate and download file
      if (exportOptions.format === "csv") {
        downloadCSV(dataToExport);
      } else {
        downloadJSON(dataToExport);
      }

      // Close modal after successful export
      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 1000);
    } catch (error) {
      console.error("Export error:", error);
      setIsExporting(false);
    }
  };

  const downloadCSV = (data) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers.map((header) => `"${row[header] || ""}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `inventory_export_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadJSON = (data) => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `inventory_export_${new Date().toISOString().split("T")[0]}.json`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const categories = [...new Set(products.map((p) => p.category))].filter(
    Boolean
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Download className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                Export Inventory
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Export Format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Export Format
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() =>
                    setExportOptions({ ...exportOptions, format: "csv" })
                  }
                  className={`p-4 border-2 rounded-lg flex items-center space-x-3 transition-colors ${
                    exportOptions.format === "csv"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <FileText className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">CSV</div>
                    <div className="text-xs text-gray-500">
                      Comma-separated values
                    </div>
                  </div>
                  {exportOptions.format === "csv" && (
                    <Check className="h-5 w-5 text-blue-600 ml-auto" />
                  )}
                </button>
                <button
                  onClick={() =>
                    setExportOptions({ ...exportOptions, format: "json" })
                  }
                  className={`p-4 border-2 rounded-lg flex items-center space-x-3 transition-colors ${
                    exportOptions.format === "json"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <FileText className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">JSON</div>
                    <div className="text-xs text-gray-500">
                      JavaScript Object Notation
                    </div>
                  </div>
                  {exportOptions.format === "json" && (
                    <Check className="h-5 w-5 text-blue-600 ml-auto" />
                  )}
                </button>
              </div>
            </div>

            {/* Columns to Export */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Columns to Export
              </label>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries({
                  name: "Product Name",
                  category: "Category",
                  brand: "Brand",
                  stock: "Stock Level",
                  price: "Price",
                  expiry: "Expiry Date",
                  supplier: "Supplier",
                  batchNumber: "Batch Number",
                }).map(([key, label]) => (
                  <label
                    key={key}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={exportOptions.columns[key]}
                      onChange={(e) =>
                        setExportOptions({
                          ...exportOptions,
                          columns: {
                            ...exportOptions.columns,
                            [key]: e.target.checked,
                          },
                        })
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Filters
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Category
                  </label>
                  <select
                    value={exportOptions.filters.category}
                    onChange={(e) =>
                      setExportOptions({
                        ...exportOptions,
                        filters: {
                          ...exportOptions.filters,
                          category: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Stock Status
                  </label>
                  <select
                    value={exportOptions.filters.stockStatus}
                    onChange={(e) =>
                      setExportOptions({
                        ...exportOptions,
                        filters: {
                          ...exportOptions.filters,
                          stockStatus: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="all">All Stock Levels</option>
                    <option value="low">Low Stock</option>
                    <option value="out">Out of Stock</option>
                    <option value="normal">Normal Stock</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Expiry Status
                  </label>
                  <select
                    value={exportOptions.filters.expiryStatus}
                    onChange={(e) =>
                      setExportOptions({
                        ...exportOptions,
                        filters: {
                          ...exportOptions.filters,
                          expiryStatus: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="all">All Products</option>
                    <option value="expired">Expired</option>
                    <option value="expiring">Expiring Soon</option>
                    <option value="fresh">Fresh Products</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Products to export:</span>
                <span className="font-semibold text-gray-900">
                  {products.length} products
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={isExporting}
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={
                isExporting ||
                Object.values(exportOptions.columns).every((v) => !v)
              }
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>Export Data</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
