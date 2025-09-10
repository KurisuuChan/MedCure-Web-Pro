import React, { useState, useEffect } from "react";
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
  Archive,
  X,
  DollarSign,
  BarChart3,
} from "lucide-react";
import EnhancedInventoryDashboard from "../features/inventory/components/EnhancedInventoryDashboard";
import ArchiveReasonModal from "../components/modals/ArchiveReasonModal";
import {
  getStockStatus,
  getExpiryStatus,
  productCategories,
  productBrands,
} from "../utils/productUtils";
import { formatCurrency } from "../utils/formatting";
import { formatDate } from "../utils/dateTime";
import { getStockBreakdown } from "../utils/unitConversion";
import ProductSearch from "../features/inventory/components/ProductSearch";
import ProductCard from "../features/inventory/components/ProductCard";
import { useInventory } from "../features/inventory/hooks/useInventory";
import ExportModal from "../components/ui/ExportModal";
import { EnhancedImportModal } from "../components/ui/EnhancedImportModal";
import { useAuth } from "../hooks/useAuth"; // Not currently used
import { ProductService } from "../services";

// Extracted Components
import InventoryHeader from "../features/inventory/components/InventoryHeader";
import InventorySummary from "../features/inventory/components/InventorySummary";
import ProductListSection from "../features/inventory/components/ProductListSection";

// Enhanced scrollbar styles
const scrollbarStyles = `
  .modal-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 #f1f5f9;
  }
  
  .modal-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  
  .modal-scrollbar::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
  }
  
  .modal-scrollbar::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
    transition: background-color 0.2s ease;
  }
  
  .modal-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
`;

export default function InventoryPage() {
  const {
    products: filteredProducts,
    allProducts,
    analytics,
    isLoading,
    addProduct,
    updateProduct,
    handleSearch,
    handleFilter,
    loadProducts,
  } = useInventory();

  // Get current authenticated user
  const { user: _user } = useAuth(); // Not currently used

  const [viewMode, setViewMode] = useState("grid"); // "grid" or "table" - Default to table (list) view
  const [activeTab, setActiveTab] = useState("inventory"); // "inventory" or "dashboard"
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);

  // Archive modal state
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [productToArchive, setProductToArchive] = useState(null);
  const [isArchiving, setIsArchiving] = useState(false);

  // Dynamic categories state
  const [dynamicCategories, setDynamicCategories] = useState([]);

  // Inject scrollbar styles
  React.useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.textContent = scrollbarStyles;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Load dynamic categories from CategoryService
  React.useEffect(() => {
    loadDynamicCategories();
  }, []);

  const loadDynamicCategories = async () => {
    try {
      console.log("🏷️ [Inventory] Loading dynamic categories...");

      const categories = await ProductService.getProductCategories();
      setDynamicCategories(categories);
      console.log("✅ [Inventory] Loaded categories:", categories);
    } catch (error) {
      console.error("❌ [Inventory] Error loading categories:", error);
      // Fallback to hardcoded categories
      setDynamicCategories(productCategories.slice(1));
    }
  };

  // Get categories to use (dynamic or fallback)
  const getCategoriesToUse = () => {
    return dynamicCategories.length > 0
      ? dynamicCategories
      : productCategories.slice(1);
  };

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

  const handleArchiveProduct = (product) => {
    setProductToArchive(product);
    setShowArchiveModal(true);
  };

  const handleConfirmArchive = async (reason) => {
    if (!productToArchive) return;

    setIsArchiving(true);
    try {
      // Get current user from context or service
      const currentUser = await ProductService.getCurrentUser();
      const userId = currentUser?.id || null;

      const result = await ProductService.archiveProduct(
        productToArchive.id,
        reason,
        userId
      );

      if (result) {
        // Show success notification
        console.log(
          `✅ ${productToArchive.name} has been archived successfully.`
        );

        // Reload products to update the list and analytics
        await loadProducts();

        // Close modal and reset state
        setShowArchiveModal(false);
        setProductToArchive(null);
      } else {
        console.error("❌ Error archiving product. Please try again.");
      }
    } catch (error) {
      console.error("Archive error:", error);
      console.error("❌ Error archiving product: " + error.message);
    } finally {
      setIsArchiving(false);
    }
  };

  const handleCloseArchiveModal = () => {
    setShowArchiveModal(false);
    setProductToArchive(null);
    setIsArchiving(false);
  };

  return (
    <div className="space-y-6">
      {/* Header with Tab Navigation */}
      <InventoryHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setShowExportModal={setShowExportModal}
        setShowImportModal={setShowImportModal}
        setShowAddModal={setShowAddModal}
      />

      {/* Tab Content */}
      {activeTab === "inventory" ? (
        <>
          {/* Summary Cards */}
          <InventorySummary analytics={analytics} />

          {/* Search and Filters */}
          <ProductSearch
            onSearch={handleSearch}
            onFilter={handleFilter}
            categories={getCategoriesToUse().slice(1)} // Remove "All Categories"
            brands={productBrands.slice(1)} // Remove "All Brands"
          />

          {/* Product List/Grid Section */}
          <ProductListSection
            viewMode={viewMode}
            setViewMode={setViewMode}
            paginatedProducts={paginatedProducts}
            filteredProducts={filteredProducts}
            isLoading={isLoading}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            transformProduct={transformProduct}
            handleViewProduct={handleViewProduct}
            handleEditProduct={handleEditProduct}
            handleArchiveProduct={handleArchiveProduct}
            loadProducts={loadProducts}
          />

          {/* Modals */}
          {showAddModal && (
            <ProductModal
              title="Add New Product"
              categories={getCategoriesToUse()}
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
              categories={getCategoriesToUse()}
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

          {/* Archive Reason Modal */}
          <ArchiveReasonModal
            isOpen={showArchiveModal}
            onClose={handleCloseArchiveModal}
            onConfirm={handleConfirmArchive}
            product={productToArchive}
            isLoading={isArchiving}
          />
        </>
      ) : (
        // Enhanced Dashboard Tab
        <EnhancedInventoryDashboard />
      )}

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        products={allProducts}
      />

      {/* Enhanced Import Modal with AI-powered category detection */}
      <EnhancedImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={async (importedProducts) => {
          try {
            // Add all imported products with enhanced processing
            for (const product of importedProducts) {
              await addProduct(product);
            }
            console.log(
              `Successfully imported ${importedProducts.length} products with intelligent category processing`
            );
          } catch (error) {
            console.error("Enhanced import error:", error);
            throw new Error(`Import failed: ${error.message}`);
          }
        }}
        addToast={(toast) => {
          // Simple console logging for now - can be enhanced later
          console.log(`${toast.type.toUpperCase()}: ${toast.message}`);
        }}
      />
    </div>
  );
}

// Product Modal Component
function ProductModal({ title, product, categories, onClose, onSave }) {
  // Smart Batch Number Generation Function
  const generateSmartBatchNumber = (productName, category, expiryDate) => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2); // Last 2 digits of year
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const day = now.getDate().toString().padStart(2, "0");

    // Generate category prefix (2 chars)
    const categoryPrefix = category
      ? category.substring(0, 2).toUpperCase()
      : "GN";

    // Generate product prefix (2 chars) from first letters of words
    let productPrefix = "PR";
    if (productName) {
      const words = productName.split(" ").filter((word) => word.length > 0);
      if (words.length >= 2) {
        productPrefix = (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
      } else if (words.length === 1) {
        productPrefix = words[0].substring(0, 2).toUpperCase();
      }
    }

    // Random 3-digit sequence for uniqueness
    const randomSequence = Math.floor(Math.random() * 900) + 100;

    // Generate expiry-aware batch (if expiry is far out, mark as extended shelf life)
    let shelfLifeIndicator = "";
    if (expiryDate) {
      const expiry = new Date(expiryDate);
      const monthsUntilExpiry = (expiry - now) / (1000 * 60 * 60 * 24 * 30);
      shelfLifeIndicator = monthsUntilExpiry > 24 ? "X" : "S"; // X for extended, S for standard
    } else {
      shelfLifeIndicator = "S";
    }

    // Format: CC-PP-YYMMDD-SSS-L (Category-Product-Date-Sequence-ShelfLife)
    return `${categoryPrefix}${productPrefix}${year}${month}${day}${randomSequence}${shelfLifeIndicator}`;
  };

  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    category: product?.category || "Pain Relief",
    brand: product?.brand || "",
    cost_price: product?.cost_price || "",
    price_per_piece: product?.price_per_piece || "", // Single authoritative unit price
    margin_percentage: product?.margin_percentage || "",
    pieces_per_sheet: product?.pieces_per_sheet || 1,
    sheets_per_box: product?.sheets_per_box || 1,
    stock_in_pieces: product?.stock_in_pieces || "",
    reorder_level: product?.reorder_level || "",
    supplier: product?.supplier || "",
    expiry_date: product?.expiry_date?.split("T")[0] || "",
    batch_number:
      product?.batch_number ||
      generateSmartBatchNumber(
        product?.name || "",
        product?.category || "Pain Relief",
        product?.expiry_date?.split("T")[0] || ""
      ),
  });

  // Calculate margin percentage when cost price or selling price changes
  const calculateMargin = (cost, sell) => {
    if (!cost || cost <= 0 || !sell || sell <= 0) return 0;
    return (((sell - cost) / cost) * 100).toFixed(2);
  };

  // Calculate selling price from cost price and margin
  const calculateSellPrice = (cost, margin) => {
    if (!cost || cost <= 0 || !margin || margin <= 0) return 0;
    return (cost * (1 + margin / 100)).toFixed(2);
  };

  // Auto-regenerate batch number when key fields change (for new products only)
  useEffect(() => {
    if (
      !product &&
      (formData.name || formData.category || formData.expiry_date)
    ) {
      const newBatch = generateSmartBatchNumber(
        formData.name,
        formData.category,
        formData.expiry_date
      );
      setFormData((prev) => ({ ...prev, batch_number: newBatch }));
    }
  }, [formData.name, formData.category, formData.expiry_date, product]);

  // Handle cost price change
  const handleCostPriceChange = (value) => {
    const costPrice = parseFloat(value) || 0;
    const sellPrice = parseFloat(formData.price_per_piece) || 0;

    setFormData({
      ...formData,
      cost_price: value,
      margin_percentage: calculateMargin(costPrice, sellPrice),
    });
  };

  // Handle selling price change
  const handleSellPriceChange = (value) => {
    const sellPrice = parseFloat(value) || 0;
    const costPrice = parseFloat(formData.cost_price) || 0;

    setFormData({
      ...formData,
      price_per_piece: value,
      margin_percentage: calculateMargin(costPrice, sellPrice),
    });
  };

  // Handle margin change
  const handleMarginChange = (value) => {
    const margin = parseFloat(value) || 0;
    const costPrice = parseFloat(formData.cost_price) || 0;

    setFormData({
      ...formData,
      margin_percentage: value,
      price_per_piece: calculateSellPrice(costPrice, margin),
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Sanitize numeric fields - convert empty strings to null or proper numbers
    const sanitizedData = {
      ...formData,
      cost_price:
        formData.cost_price === ""
          ? null
          : parseFloat(formData.cost_price) || null,
      // Single authoritative unit price
      price_per_piece:
        formData.price_per_piece === ""
          ? 0
          : parseFloat(formData.price_per_piece) || 0,
      margin_percentage:
        formData.margin_percentage === ""
          ? 0
          : parseFloat(formData.margin_percentage) || 0,
      pieces_per_sheet:
        formData.pieces_per_sheet === ""
          ? 1
          : parseInt(formData.pieces_per_sheet) || 1,
      sheets_per_box:
        formData.sheets_per_box === ""
          ? 1
          : parseInt(formData.sheets_per_box) || 1,
      stock_in_pieces:
        formData.stock_in_pieces === ""
          ? 0
          : parseInt(formData.stock_in_pieces) || 0,
      reorder_level:
        formData.reorder_level === ""
          ? 0
          : parseInt(formData.reorder_level) || 0,
      expiry_date: formData.expiry_date === "" ? null : formData.expiry_date,
      batch_number:
        formData.batch_number ||
        generateSmartBatchNumber(
          formData.name,
          formData.category,
          formData.expiry_date
        ),
    };

    onSave(sanitizedData);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-hidden">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-600">
                  {product
                    ? "Update product information"
                    : "Enter product details"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 max-h-96 overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information Section */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <Package className="w-4 h-4 mr-2 text-gray-600" />
                  Basic Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
                      placeholder="Enter product name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
                    >
                      <option value="">Select category</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-300 resize-none"
                      placeholder="Enter product description"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Brand
                    </label>
                    <input
                      type="text"
                      value={formData.brand}
                      onChange={(e) =>
                        setFormData({ ...formData, brand: e.target.value })
                      }
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
                      placeholder="Enter brand name"
                    />
                  </div>
                </div>
              </div>

              {/* Enhanced Pricing Section */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-100">
                <h4 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <DollarSign className="h-6 w-6 mr-2 text-blue-600" />
                  Enhanced Pricing Structure
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Cost Price (₱)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.cost_price}
                      onChange={(e) => handleCostPriceChange(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Selling Price (₱) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.price_per_piece}
                      onChange={(e) => handleSellPriceChange(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-300 bg-white"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Margin (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.margin_percentage}
                      onChange={(e) => handleMarginChange(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
                      placeholder="0.00"
                      readOnly={
                        !formData.cost_price || formData.cost_price <= 0
                      }
                    />
                  </div>
                </div>

                {/* Enhanced Pricing Summary */}
                {formData.cost_price && formData.price_per_piece && (
                  <div className="mt-6 p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-blue-200">
                    <h5 className="text-sm font-semibold text-gray-700 mb-3">
                      Pricing Summary
                    </h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-500 uppercase tracking-wide">
                          Cost Price
                        </div>
                        <div className="text-lg font-bold text-gray-900">
                          ₱{parseFloat(formData.cost_price).toFixed(2)}
                        </div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-xs text-blue-600 uppercase tracking-wide">
                          Selling Price
                        </div>
                        <div className="text-lg font-bold text-blue-900">
                          ₱{parseFloat(formData.price_per_piece).toFixed(2)}
                        </div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-xs text-green-600 uppercase tracking-wide">
                          Profit per Unit
                        </div>
                        <div className="text-lg font-bold text-green-700">
                          ₱
                          {(
                            parseFloat(formData.price_per_piece) -
                            parseFloat(formData.cost_price)
                          ).toFixed(2)}
                        </div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-xs text-purple-600 uppercase tracking-wide">
                          Margin
                        </div>
                        <div className="text-lg font-bold text-purple-700">
                          {formData.margin_percentage}%
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Stock and Inventory Section */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <Package className="h-5 w-5 mr-2 text-gray-600" />
                  Stock Management
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
                      placeholder="Enter stock quantity"
                    />
                  </div>

                  <div>
                    <label className="flex items-center justify-between text-sm font-semibold text-gray-700 mb-2">
                      <span>Batch Number *</span>
                      <button
                        type="button"
                        onClick={() => {
                          const newBatch = generateSmartBatchNumber(
                            formData.name,
                            formData.category,
                            formData.expiry_date
                          );
                          setFormData({
                            ...formData,
                            batch_number: newBatch,
                          });
                        }}
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-md hover:bg-blue-200 transition-colors"
                        title="Generate new batch number"
                      >
                        🔄 Generate
                      </button>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.batch_number}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          batch_number: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-300 bg-blue-50 font-mono text-sm"
                      placeholder="Auto-generated batch number"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Format: CategoryProduct-Date-Sequence-ShelfLife
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
                      placeholder="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Sheets per Box
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.sheets_per_box}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          sheets_per_box: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
                      placeholder="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Reorder Level
                    </label>
                    <input
                      type="number"
                      value={formData.reorder_level}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          reorder_level: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Supplier
                    </label>
                    <input
                      type="text"
                      value={formData.supplier}
                      onChange={(e) =>
                        setFormData({ ...formData, supplier: e.target.value })
                      }
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
                      placeholder="Enter supplier name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      value={formData.expiry_date}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          expiry_date: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
                    />
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Modal Footer */}
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex-shrink-0">
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="group px-6 py-2.5 border-2 border-gray-200 text-gray-700 font-medium rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="group px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <span className="flex items-center space-x-2">
                  <span>{product ? "Update Product" : "Add Product"}</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Product Details Modal Component
function ProductDetailsModal({ product, onClose, onEdit }) {
  const stockStatus = getStockStatus(product);
  const expiryStatus = getExpiryStatus(product);
  const stockBreakdown = getStockBreakdown(product.stock_in_pieces, product);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 py-8 overflow-y-auto">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col my-auto"
        style={{ minHeight: "90vh", maxHeight: "fit-content" }}
      >
        <div className="flex flex-col h-full min-h-0">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-xl">
                <Eye className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Product Details
              </h3>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={onEdit}
                className="group flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <Edit className="h-4 w-4 group-hover:rotate-12 transition-transform duration-200" />
                <span>Edit</span>
              </button>
              <button
                onClick={onClose}
                className="group p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
              >
                <X className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-6 modal-scrollbar">
            <div className="space-y-8">
              {/* Basic Information */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <Package className="h-6 w-6 mr-3 text-blue-600" />
                  Basic Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                      Product Name
                    </span>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {product.name}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                      Brand
                    </span>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {product.brand || "Not specified"}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                      Category
                    </span>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {product.category}
                      </span>
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm md:col-span-1">
                    <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                      Status
                    </span>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    </p>
                  </div>
                  {product.description && (
                    <div className="bg-white rounded-lg p-4 shadow-sm md:col-span-2">
                      <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                        Description
                      </span>
                      <p className="text-base text-gray-800 mt-2 leading-relaxed">
                        {product.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Stock Information */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <Package className="h-6 w-6 mr-3 text-indigo-600" />
                  Stock Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
                    <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                      Current Stock
                    </span>
                    <div className="mt-3">
                      <p className="text-2xl font-bold text-gray-900">
                        {product.stock_in_pieces.toLocaleString()} pieces
                      </p>
                      <span
                        className={`mt-2 inline-flex px-4 py-2 text-sm font-bold rounded-xl ${
                          stockStatus === "critical_stock"
                            ? "bg-red-100 text-red-800 border border-red-200"
                            : stockStatus === "low_stock"
                            ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                            : "bg-green-100 text-green-800 border border-green-200"
                        }`}
                      >
                        {stockStatus.replace("_", " ").toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
                    <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                      Stock Breakdown
                    </span>
                    <div className="mt-3 space-y-2">
                      <p className="text-lg font-semibold text-gray-900">
                        {stockBreakdown.boxes} boxes, {stockBreakdown.sheets}{" "}
                        sheets, {stockBreakdown.pieces} pieces
                      </p>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          •{" "}
                          <span className="font-medium">
                            {product.pieces_per_sheet}
                          </span>{" "}
                          pieces per sheet
                        </p>
                        <p>
                          •{" "}
                          <span className="font-medium">
                            {product.sheets_per_box}
                          </span>{" "}
                          sheets per box
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
                    <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                      Reorder Level
                    </span>
                    <p className="text-xl font-bold text-gray-900 mt-2">
                      {product.reorder_level} pieces
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
                    <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                      Stock Status
                    </span>
                    <p className="text-lg font-semibold text-gray-900 mt-2">
                      {product.stock_in_pieces <= product.reorder_level ? (
                        <span className="text-red-600">⚠️ Needs Reorder</span>
                      ) : (
                        <span className="text-green-600">
                          ✅ Adequate Stock
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Pricing Information */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <DollarSign className="h-6 w-6 mr-3 text-green-600" />
                  Pricing Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-green-100">
                    <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                      Price per Piece
                    </span>
                    <p className="text-2xl font-bold text-green-700 mt-2">
                      {formatCurrency(product.price_per_piece)}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-green-100">
                    <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                      Price per Sheet
                    </span>
                    <p className="text-xl font-bold text-gray-900 mt-2">
                      {formatCurrency(
                        product.price_per_piece * product.pieces_per_sheet
                      )}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-green-100">
                    <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                      Price per Box
                    </span>
                    <p className="text-xl font-bold text-gray-900 mt-2">
                      {formatCurrency(
                        product.price_per_piece *
                          product.pieces_per_sheet *
                          product.sheets_per_box
                      )}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-green-100">
                    <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                      Total Stock Value
                    </span>
                    <p className="text-2xl font-bold text-green-700 mt-2">
                      {formatCurrency(
                        product.stock_in_pieces * product.price_per_piece
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <Package className="h-6 w-6 mr-3 text-purple-600" />
                  Additional Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                      Supplier
                    </span>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {product.supplier || "Not specified"}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                      Batch Number
                    </span>
                    <p className="text-lg font-mono font-bold text-gray-900 mt-1 bg-gray-100 px-2 py-1 rounded">
                      {product.batch_number}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                      Expiry Date
                    </span>
                    <div className="mt-2">
                      <p className="text-lg font-semibold text-gray-900">
                        {formatDate(product.expiry_date)}
                      </p>
                      <span
                        className={`mt-1 inline-flex px-3 py-1 text-sm font-bold rounded-xl ${
                          expiryStatus === "expired"
                            ? "bg-red-100 text-red-800 border border-red-200"
                            : expiryStatus === "expiring_soon"
                            ? "bg-orange-100 text-orange-800 border border-orange-200"
                            : expiryStatus === "expiring_warning"
                            ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                            : "bg-green-100 text-green-800 border border-green-200"
                        }`}
                      >
                        {expiryStatus.replace("_", " ").toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                      Last Updated
                    </span>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {formatDate(new Date())}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
