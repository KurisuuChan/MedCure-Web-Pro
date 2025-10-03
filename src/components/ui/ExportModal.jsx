import React, { useState } from "react";
import { X, Download, FileText, Database } from "lucide-react";
import { UnifiedCategoryService } from "../../services/domains/inventory/unifiedCategoryService";

const ExportModal = ({ isOpen, onClose, products, categories }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    exportType: "products", // "products" or "categories"
    format: "csv",
    filters: {
      category: "all",
      stockStatus: "all",
      expiryStatus: "all",
    },
    columns: {
      name: true,
      category: true,
      brand: true,
      stock: true,
      price: true,
      costPrice: false,
      marginPercentage: false,
      expiry: true,
      supplier: false,
      batchNumber: false,
      unitConversion: false,
    },
  });

  const handleExport = async () => {
    setIsExporting(true);

    try {
      if (exportOptions.exportType === "categories") {
        // Export intelligent category insights
        const result = await UnifiedCategoryService.getCategoryInsights();
        if (result.success) {
          const categoryData = result.data.top_value_categories.map(
            (category) => ({
              "Category Name": category.name,
              "Total Products": category.stats?.total_products || 0,
              "Total Value": category.stats?.total_value || 0,
              "Low Stock Count": category.stats?.low_stock_count || 0,
              "Auto Created": category.metadata?.auto_created ? "Yes" : "No",
              "Last Updated": category.last_calculated || "Not calculated",
            })
          );

          if (exportOptions.format === "csv") {
            downloadCSV(categoryData, "category_insights");
          } else {
            downloadJSON(categoryData, "category_insights");
          }
        }
      } else {
        // Export products - Filter products based on selected filters
        let filteredProducts = products || [];

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

          if (exportOptions.columns.name) row["Product Name"] = product.generic_name || product.name || 'Unknown Product';
          if (exportOptions.columns.category)
            row["Category"] = product.category;
          if (exportOptions.columns.brand) row["Brand"] = product.brand;
          if (exportOptions.columns.stock)
            row["Stock (Pieces)"] = product.stock_in_pieces;
          if (exportOptions.columns.price)
            row["Price per Piece"] = product.price_per_piece;
          if (exportOptions.columns.costPrice)
            row["Cost Price"] = product.cost_price || "";
          if (exportOptions.columns.marginPercentage)
            row["Margin Percentage"] = product.margin_percentage || "";
          if (exportOptions.columns.expiry)
            row["Expiry Date"] = product.expiry_date?.split("T")[0];
          if (exportOptions.columns.supplier)
            row["Supplier"] = product.supplier;
          if (exportOptions.columns.batchNumber)
            row["Batch Number"] = product.batch_number;
          if (exportOptions.columns.unitConversion) {
            row["Pieces per Sheet"] = product.pieces_per_sheet || 1;
            row["Sheets per Box"] = product.sheets_per_box || 1;
          }

          return row;
        });

        // Generate and download file
        if (exportOptions.format === "csv") {
          downloadCSV(dataToExport, "inventory_export");
        } else {
          downloadJSON(dataToExport, "inventory_export");
        }
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

  const downloadCSV = (data, filename = "export") => {
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
      `${filename}_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadJSON = (data, filename = "export") => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${filename}_${new Date().toISOString().split("T")[0]}.json`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const updateFilters = (key, value) => {
    setExportOptions((prev) => ({
      ...prev,
      filters: {
        ...prev.filters,
        [key]: value,
      },
    }));
  };

  const updateColumns = (key, value) => {
    setExportOptions((prev) => ({
      ...prev,
      columns: {
        ...prev.columns,
        [key]: value,
      },
    }));
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Export Data</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Export Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Export Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() =>
                  setExportOptions((prev) => ({
                    ...prev,
                    exportType: "products",
                  }))
                }
                className={`p-3 border rounded-lg flex items-center space-x-2 ${
                  exportOptions.exportType === "products"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <FileText className="w-5 h-5" />
                <span>Product Inventory</span>
              </button>
              <button
                onClick={() =>
                  setExportOptions((prev) => ({
                    ...prev,
                    exportType: "categories",
                  }))
                }
                className={`p-3 border rounded-lg flex items-center space-x-2 ${
                  exportOptions.exportType === "categories"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <Database className="w-5 h-5" />
                <span>Category Insights</span>
              </button>
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Export Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() =>
                  setExportOptions((prev) => ({ ...prev, format: "csv" }))
                }
                className={`p-3 border rounded-lg text-center ${
                  exportOptions.format === "csv"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                CSV
              </button>
              <button
                onClick={() =>
                  setExportOptions((prev) => ({ ...prev, format: "json" }))
                }
                className={`p-3 border rounded-lg text-center ${
                  exportOptions.format === "json"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                JSON
              </button>
            </div>
          </div>

          {/* Product-specific options */}
          {exportOptions.exportType === "products" && (
            <>
              {/* Filters */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Filters
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Category
                    </label>
                    <select
                      value={exportOptions.filters.category}
                      onChange={(e) =>
                        updateFilters("category", e.target.value)
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Categories</option>
                      {categories &&
                        categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Stock Status
                    </label>
                    <select
                      value={exportOptions.filters.stockStatus}
                      onChange={(e) =>
                        updateFilters("stockStatus", e.target.value)
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Stock Levels</option>
                      <option value="low">Low Stock</option>
                      <option value="out">Out of Stock</option>
                      <option value="normal">Normal Stock</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Expiry Status
                    </label>
                    <select
                      value={exportOptions.filters.expiryStatus}
                      onChange={(e) =>
                        updateFilters("expiryStatus", e.target.value)
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Products</option>
                      <option value="expired">Expired</option>
                      <option value="expiring">Expiring Soon (30 days)</option>
                      <option value="fresh">Fresh</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Column Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Columns to Export
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries({
                    name: "Product Name",
                    category: "Category",
                    brand: "Brand",
                    stock: "Stock Level",
                    price: "Price per Piece",
                    costPrice: "Cost Price",
                    marginPercentage: "Margin %",
                    expiry: "Expiry Date",
                    supplier: "Supplier",
                    batchNumber: "Batch Number",
                    unitConversion: "Unit Conversion",
                  }).map(([key, label]) => (
                    <label key={key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={exportOptions.columns[key]}
                        onChange={(e) => updateColumns(key, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Category-specific info */}
          {exportOptions.exportType === "categories" && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">
                Category Insights Export
              </h4>
              <p className="text-sm text-blue-700">
                This will export intelligent category insights including total
                products, total value, low stock counts, auto-creation status,
                and last update times for all categories in your inventory.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center space-x-2"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Export</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
