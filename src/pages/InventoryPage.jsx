import React, { useState } from "react";
import {
  Plus,
  Download,
  Upload,
  Package,
  TrendingDown,
  Calendar,
  TrendingUp,
  RefreshCw,
  Grid,
  List,
  Edit,
  Eye,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import {
  getStockStatus,
  getExpiryStatus,
  productCategories,
  productBrands,
} from "../utils/productUtils";
import { formatCurrency, formatNumber } from "../utils/formatting";
import { formatDate } from "../utils/dateTime";
import { getStockBreakdown } from "../utils/unitConversion";
import ProductSearch from "../features/inventory/components/ProductSearch";
import ProductCard from "../features/inventory/components/ProductCard";
import { useInventory } from "../features/inventory/hooks/useInventory";

export default function InventoryPage() {
  const {
    products: filteredProducts,
    allProducts,
    analytics,
    searchTerm,
    filters,
    sortBy,
    sortOrder,
    isLoading,
    addProduct,
    updateProduct,
    deleteProduct,
    handleSearch,
    handleFilter,
    handleSort,
  } = useInventory();

  const [viewMode, setViewMode] = useState("grid"); // "grid" or "table"
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Transform products to match component expectations
  const transformProduct = (product) => ({
    ...product,
    price: product.price_per_piece,
    stock: product.stock_in_pieces,
    expiry: product.expiry_date,
    reorderLevel: product.reorder_level,
    unit: "pieces",
  });

  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setShowDetailsModal(true);
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setShowEditModal(true);
  };

  const handleDeleteProduct = async (product) => {
    if (confirm(`Are you sure you want to delete ${product.name}?`)) {
      try {
        await deleteProduct(product.id);
        // Success feedback could go here
      } catch (error) {
        alert("Error deleting product: " + error.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Inventory Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your pharmacy inventory, track stock levels, and monitor
            expiry dates.
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 lg:mt-0">
          <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            <Upload className="h-4 w-4" />
            <span>Import</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          title="Total Products"
          value={formatNumber(analytics.totalProducts)}
          icon={Package}
          color="blue"
        />
        <SummaryCard
          title="Low Stock Items"
          value={formatNumber(analytics.lowStockProducts)}
          icon={TrendingDown}
          color="yellow"
          alert={analytics.lowStockProducts > 0}
        />
        <SummaryCard
          title="Expiring Soon"
          value={formatNumber(analytics.expiringProducts)}
          icon={Calendar}
          color="red"
          alert={analytics.expiringProducts > 0}
        />
        <SummaryCard
          title="Total Value"
          value={formatCurrency(analytics.totalValue)}
          icon={TrendingUp}
          color="green"
        />
      </div>

      {/* Search and Filters */}
      <ProductSearch
        onSearch={handleSearch}
        onFilter={handleFilter}
        categories={productCategories.slice(1)} // Remove "All Categories"
        brands={productBrands.slice(1)} // Remove "All Brands"
      />

      {/* View Controls and Results Info */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {startIndex + 1}-
          {Math.min(startIndex + itemsPerPage, filteredProducts.length)} of{" "}
          {filteredProducts.length} products
        </p>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "grid"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "table"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <button className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800">
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Products Display */}
      {viewMode === "grid" ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={transformProduct(product)}
              onEdit={handleEditProduct}
              onView={handleViewProduct}
              onDelete={handleDeleteProduct}
            />
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expiry
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedProducts.map((product) => (
                  <ProductRow
                    key={product.id}
                    product={product}
                    onView={() => handleViewProduct(product)}
                    onEdit={() => handleEditProduct(product)}
                    onDelete={() => handleDeleteProduct(product)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No products found
          </h3>
          <p className="text-gray-500">
            Try adjusting your search terms or filters.
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 border border-gray-200 rounded-lg sm:px-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <ProductModal
          title="Add New Product"
          onClose={() => setShowAddModal(false)}
          onSave={async (productData) => {
            try {
              await addProduct(productData);
              setShowAddModal(false);
              // Success feedback could go here
            } catch (error) {
              alert("Error adding product: " + error.message);
            }
          }}
        />
      )}

      {showEditModal && selectedProduct && (
        <ProductModal
          title="Edit Product"
          product={selectedProduct}
          onClose={() => {
            setShowEditModal(false);
            setSelectedProduct(null);
          }}
          onSave={async (productData) => {
            try {
              await updateProduct(selectedProduct.id, productData);
              setShowEditModal(false);
              setSelectedProduct(null);
              // Success feedback could go here
            } catch (error) {
              alert("Error updating product: " + error.message);
            }
          }}
        />
      )}

      {showDetailsModal && selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedProduct(null);
          }}
          onEdit={() => {
            setShowDetailsModal(false);
            setShowEditModal(true);
          }}
        />
      )}
    </div>
  );
}

// Summary Card Component
function SummaryCard({ title, value, icon: Icon, color, alert }) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    yellow: "bg-yellow-50 text-yellow-600",
    red: "bg-red-50 text-red-600",
    green: "bg-green-50 text-green-600",
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div
          className={`p-3 rounded-lg ${colorClasses[color]} ${
            alert ? "animate-pulse" : ""
          }`}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

// Product Row Component
function ProductRow({ product, onView, onEdit, onDelete }) {
  const stockStatus = getStockStatus(product);
  const expiryStatus = getExpiryStatus(product);
  const stockBreakdown = getStockBreakdown(product.stock_in_pieces, product);

  const getStatusColor = (status) => {
    switch (status) {
      case "critical_stock":
      case "expired":
        return "text-red-600 bg-red-50";
      case "low_stock":
      case "expiring_soon":
        return "text-yellow-600 bg-yellow-50";
      case "expiring_warning":
        return "text-orange-600 bg-orange-50";
      default:
        return "text-green-600 bg-green-50";
    }
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <Package className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {product.name}
            </div>
            <div className="text-sm text-gray-500 flex items-center space-x-2">
              <span>{product.brand}</span>
              <span>•</span>
              <span>{product.category}</span>
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
          {product.category}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          <span
            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
              stockStatus
            )}`}
          >
            {product.stock_in_pieces} pcs
          </span>
          <div className="text-xs text-gray-500 mt-1">
            {stockBreakdown.boxes > 0 &&
              `${stockBreakdown.boxes} box${
                stockBreakdown.boxes > 1 ? "es" : ""
              } `}
            {stockBreakdown.sheets > 0 &&
              `${stockBreakdown.sheets} sheet${
                stockBreakdown.sheets > 1 ? "s" : ""
              } `}
            {stockBreakdown.pieces > 0 &&
              `${stockBreakdown.pieces} pc${
                stockBreakdown.pieces > 1 ? "s" : ""
              }`}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        <div>{formatCurrency(product.price_per_piece)}/pc</div>
        <div className="text-xs text-gray-500">
          Value:{" "}
          {formatCurrency(product.stock_in_pieces * product.price_per_piece)}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          {formatDate(product.expiry_date)}
        </div>
        <span
          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
            expiryStatus
          )}`}
        >
          {expiryStatus.replace("_", " ")}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
        <button
          onClick={onView}
          className="text-blue-600 hover:text-blue-900"
          title="View Details"
        >
          <Eye className="h-4 w-4" />
        </button>
        <button
          onClick={onEdit}
          className="text-gray-600 hover:text-gray-900"
          title="Edit Product"
        >
          <Edit className="h-4 w-4" />
        </button>
        <button
          onClick={onDelete}
          className="text-red-600 hover:text-red-900"
          title="Delete Product"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}

// Product Modal Component
function ProductModal({ title, product, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    category: product?.category || "Pain Relief",
    brand: product?.brand || "",
    price_per_piece: product?.price_per_piece || "",
    pieces_per_sheet: product?.pieces_per_sheet || 1,
    sheets_per_box: product?.sheets_per_box || 1,
    stock_in_pieces: product?.stock_in_pieces || "",
    reorder_level: product?.reorder_level || "",
    supplier: product?.supplier || "",
    expiry_date: product?.expiry_date?.split("T")[0] || "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {productCategories.slice(1).map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) =>
                    setFormData({ ...formData, brand: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price per Piece *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.price_per_piece}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price_per_piece: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock (Pieces) *
                </label>
                <input
                  type="number"
                  required
                  value={formData.stock_in_pieces}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      stock_in_pieces: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pieces per Sheet
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.pieces_per_sheet}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pieces_per_sheet: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sheets per Box
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.sheets_per_box}
                  onChange={(e) =>
                    setFormData({ ...formData, sheets_per_box: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reorder Level
                </label>
                <input
                  type="number"
                  value={formData.reorder_level}
                  onChange={(e) =>
                    setFormData({ ...formData, reorder_level: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supplier
                </label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) =>
                    setFormData({ ...formData, supplier: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) =>
                    setFormData({ ...formData, expiry_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {product ? "Update Product" : "Add Product"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Product Details Modal Component
function ProductDetailsModal({ product, onClose, onEdit }) {
  const stockStatus = getStockStatus(product);
  const expiryStatus = getExpiryStatus(product);
  const stockBreakdown = getStockBreakdown(product.stock_in_pieces, product);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              Product Details
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={onEdit}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Edit className="h-4 w-4" />
                <span>Edit</span>
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                Basic Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    Product Name
                  </span>
                  <p className="text-sm text-gray-900">{product.name}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    Brand
                  </span>
                  <p className="text-sm text-gray-900">{product.brand}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    Category
                  </span>
                  <p className="text-sm text-gray-900">{product.category}</p>
                </div>
                <div className="md:col-span-2">
                  <span className="text-sm font-medium text-gray-500">
                    Description
                  </span>
                  <p className="text-sm text-gray-900">{product.description}</p>
                </div>
              </div>
            </div>

            {/* Stock Information */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                Stock Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    Current Stock
                  </span>
                  <p className="text-sm text-gray-900">
                    {product.stock_in_pieces} pieces
                    <span
                      className={`ml-2 inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        stockStatus === "critical_stock"
                          ? "bg-red-100 text-red-800"
                          : stockStatus === "low_stock"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {stockStatus.replace("_", " ")}
                    </span>
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    Stock Breakdown
                  </span>
                  <p className="text-sm text-gray-900">
                    {stockBreakdown.boxes > 0 &&
                      `${stockBreakdown.boxes} boxes, `}
                    {stockBreakdown.sheets > 0 &&
                      `${stockBreakdown.sheets} sheets, `}
                    {stockBreakdown.pieces} pieces
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    Reorder Level
                  </span>
                  <p className="text-sm text-gray-900">
                    {product.reorder_level} pieces
                  </p>
                </div>
              </div>
            </div>

            {/* Pricing Information */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                Pricing Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    Price per Piece
                  </span>
                  <p className="text-sm text-gray-900">
                    {formatCurrency(product.price_per_piece)}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    Total Stock Value
                  </span>
                  <p className="text-sm text-gray-900">
                    {formatCurrency(
                      product.stock_in_pieces * product.price_per_piece
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    Price per Sheet
                  </span>
                  <p className="text-sm text-gray-900">
                    {formatCurrency(
                      product.price_per_piece * product.pieces_per_sheet
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    Price per Box
                  </span>
                  <p className="text-sm text-gray-900">
                    {formatCurrency(
                      product.price_per_piece *
                        product.pieces_per_sheet *
                        product.sheets_per_box
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                Additional Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    Supplier
                  </span>
                  <p className="text-sm text-gray-900">{product.supplier}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    Batch Number
                  </span>
                  <p className="text-sm text-gray-900 font-mono">
                    {product.batch_number}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    Expiry Date
                  </span>
                  <p className="text-sm text-gray-900">
                    {formatDate(product.expiry_date)}
                    <span
                      className={`ml-2 inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        expiryStatus === "expired"
                          ? "bg-red-100 text-red-800"
                          : expiryStatus === "expiring_soon"
                          ? "bg-yellow-100 text-yellow-800"
                          : expiryStatus === "expiring_warning"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {expiryStatus.replace("_", " ")}
                    </span>
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    Status
                  </span>
                  <p className="text-sm text-gray-900">
                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      {product.status.replace("_", " ")}
                    </span>
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    Created
                  </span>
                  <p className="text-sm text-gray-900">
                    {formatDate(product.created_at)}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    Last Updated
                  </span>
                  <p className="text-sm text-gray-900">
                    {formatDate(product.updated_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
