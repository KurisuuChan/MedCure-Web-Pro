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
  Pill,
  Shield,
} from "lucide-react";
import AnalyticsReportsPage from "../features/analytics/components/AnalyticsReportsPage";
import ArchiveReasonModal from "../components/modals/ArchiveReasonModal";
import {
  getStockStatus,
  getExpiryStatus,
  productCategories,
} from "../utils/productUtils";
import { formatCurrency } from "../utils/formatting";
import { formatDate } from "../utils/dateTime";
import { getStockBreakdown } from "../utils/unitConversion";
import ProductSearch from "../features/inventory/components/ProductSearch";
import { UnifiedCategoryService } from "../services/domains/inventory/unifiedCategoryService";
import ProductCard from "../features/inventory/components/ProductCard";
import { useInventory } from "../features/inventory/hooks/useInventory";
import ExportModal from "../components/ui/ExportModal";
import { EnhancedImportModal } from "../components/ui/EnhancedImportModal";
import { useAuth } from "../hooks/useAuth"; // Not currently used
import { ProductService } from "../services/domains/inventory/productService";
import AddStockModal from "../components/modals/AddStockModal";
import CategoryManagement from "../features/inventory/components/CategoryManagement";
import ArchivedProductsManagement from "../features/inventory/components/ArchivedProductsManagement";

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
    filterOptions,
    isLoading,
    addProduct,
    updateProduct,
    handleSearch,
    handleFilter,
    loadProducts,
    filters,
    searchTerm,
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
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [showArchivedModal, setShowArchivedModal] = useState(false);

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
      console.log("ðŸ·ï¸ [Inventory] Loading dynamic categories...");

      // Use UnifiedCategoryService directly to ensure consistency with Management page
      const result = await UnifiedCategoryService.getAllCategories({
        activeOnly: true,
      });

      if (result.success && result.data) {
        setDynamicCategories(result.data);
        console.log(
          "âœ… [Inventory] Loaded categories from UnifiedCategoryService:",
          result.data
        );
      } else {
        console.error(
          "âŒ [Inventory] UnifiedCategoryService failed:",
          result.error
        );
        // Only use fallback as last resort and log it clearly
        console.warn(
          "âš ï¸ [Inventory] Using hardcoded fallback categories - this should not happen in production!"
        );
        setDynamicCategories(
          productCategories.slice(1).map((name, index) => ({
            id: `fallback-${index}`,
            name,
            description: `Fallback category: ${name}`,
            is_active: true,
          }))
        );
      }
    } catch (error) {
      console.error("âŒ [Inventory] Error loading categories:", error);
      // Only use fallback as last resort and log it clearly
      console.warn(
        "âš ï¸ [Inventory] Using hardcoded fallback categories due to error - this should not happen in production!"
      );
      setDynamicCategories(
        productCategories.slice(1).map((name, index) => ({
          id: `fallback-${index}`,
          name,
          description: `Fallback category: ${name}`,
          is_active: true,
        }))
      );
    }
  };

  // Get categories to use (dynamic or fallback)
  const getCategoriesToUse = () => {
    if (dynamicCategories.length > 0) {
      return dynamicCategories;
    }
    // Fallback with consistent object format
    return productCategories.slice(1).map((name, index) => ({
      id: `fallback-${index}`,
      name,
      description: `Fallback category: ${name}`,
      is_active: true,
    }));
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
          `âœ… ${productToArchive.name} has been archived successfully.`
        );

        // Reload products to update the list and analytics
        await loadProducts();

        // Close modal and reset state
        setShowArchiveModal(false);
        setProductToArchive(null);
      } else {
        console.error("âŒ Error archiving product. Please try again.");
      }
    } catch (error) {
      console.error("Archive error:", error);
      console.error("âŒ Error archiving product: " + error.message);
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
            filterOptions={{
              ...filterOptions,
              categories: filterOptions.categories || [],
            }}
            currentFilters={filters}
            searchTerm={searchTerm}
            setShowCategoriesModal={setShowCategoriesModal}
            setShowArchivedModal={setShowArchivedModal}
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
        // Analytics & Reports Tab
        <AnalyticsReportsPage />
      )}

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        products={allProducts}
        categories={dynamicCategories.map((cat) => cat.name)}
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

      {/* Categories Management Modal */}
      {showCategoriesModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <CategoryManagement
              onClose={() => setShowCategoriesModal(false)}
              onCategoriesChange={loadProducts}
            />
          </div>
        </div>
      )}

      {/* Archived Products Management Modal */}
      {showArchivedModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-7xl max-h-[90vh] overflow-hidden">
            <ArchivedProductsManagement
              onClose={() => setShowArchivedModal(false)}
              onRestore={loadProducts}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Product Modal Component - Original Working Version
function ProductModal({ title, product, categories, onClose, onSave }) {
  const generateSmartBatchNumber = (productName, category, expiryDate) => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const year = String(now.getFullYear()).slice(-2);
    const incrementalNumber = Math.floor(Math.random() * 999) + 1;
    return `BT${month}${day}${year}-${incrementalNumber}`;
  };

  const [formData, setFormData] = useState({
    generic_name: product?.generic_name || "",
    brand_name: product?.brand_name || "",
    description: product?.description || "",
    category: product?.category || "Pain Relief",
    manufacturer: product?.manufacturer || "",
    dosage_form: product?.dosage_form || "",
    dosage_strength: product?.dosage_strength || "",
    drug_classification: product?.drug_classification || "",
    cost_price: product?.cost_price || "",
    price_per_piece: product?.price_per_piece || "",
    margin_percentage: product?.margin_percentage || "",
    pieces_per_sheet: product?.pieces_per_sheet || 1,
    sheets_per_box: product?.sheets_per_box || 1,
    stock_in_pieces: product?.stock_in_pieces || "",
    reorder_level: product?.reorder_level || "",
    supplier: product?.supplier || "",
    expiry_date: product?.expiry_date?.split("T")[0] || "",
    batch_number: product?.batch_number || generateSmartBatchNumber("", "Pain Relief", ""),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const sanitizedData = {
      ...formData,
      cost_price: formData.cost_price === "" ? null : parseFloat(formData.cost_price) || null,
      price_per_piece: formData.price_per_piece === "" ? 0 : parseFloat(formData.price_per_piece) || 0,
      margin_percentage: formData.margin_percentage === "" ? 0 : parseFloat(formData.margin_percentage) || 0,
      pieces_per_sheet: parseInt(formData.pieces_per_sheet) || 1,
      sheets_per_box: parseInt(formData.sheets_per_box) || 1,
      stock_in_pieces: parseInt(formData.stock_in_pieces) || 0,
      reorder_level: parseInt(formData.reorder_level) || 0,
    };
    onSave(sanitizedData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative w-full max-w-5xl bg-white rounded-xl shadow-2xl max-h-[95vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="group p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden">
          <form onSubmit={handleSubmit} className="h-full">
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Basic Information Section */}
                <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
                  <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <Pill className="w-5 h-5 mr-2 text-blue-600" />
                    Basic Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Generic Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.generic_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            generic_name: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-300 bg-blue-50"
                        placeholder="Enter the generic name of the medicine"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Brand Name
                      </label>
                      <input
                        type="text"
                        value={formData.brand_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            brand_name: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
                        placeholder="Enter the brand name"
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
                          setFormData({
                            ...formData,
                            category: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Manufacturer
                      </label>
                      <input
                        type="text"
                        value={formData.manufacturer}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            manufacturer: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
                        placeholder="Enter manufacturer name"
                      />
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
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
                        rows="3"
                        placeholder="Enter a detailed description of the product"
                      />
                    </div>
                  </div>
                </div>

                {/* Medicine-Specific Details Section */}
                <div className="bg-purple-50 rounded-xl p-5 border border-purple-200">
                  <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <Pill className="w-5 h-5 mr-2 text-purple-600" />
                    Medicine Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Dosage Form
                      </label>
                      <input
                        type="text"
                        value={formData.dosage_form}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            dosage_form: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
                        placeholder="Tablet, Capsule, Syrup, etc."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Dosage Strength
                      </label>
                      <input
                        type="text"
                        value={formData.dosage_strength}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            dosage_strength: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
                        placeholder="500mg, 250ml, etc."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Drug Classification
                      </label>
                      <input
                        type="text"
                        value={formData.drug_classification}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            drug_classification: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
                        placeholder="Prescription, OTC, etc."
                      />
                    </div>
                  </div>
                </div>

                {/* Pricing & Stock Section */}
                <div className="bg-green-50 rounded-xl p-5 border border-green-200">
                  <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                    Pricing & Stock Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Cost Price
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.cost_price}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            cost_price: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Price per Piece
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price_per_piece}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            price_per_piece: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Margin Percentage
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.margin_percentage}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            margin_percentage: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Stock in Pieces
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.stock_in_pieces}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            stock_in_pieces: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
                        placeholder="0"
                      />
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
                        Batch Number *
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
                    </div>

                    {!product && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Initial Batch Expiry Date
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
                        <p className="text-xs text-gray-500 mt-1">
                          For the initial batch. Additional batches can have
                          different expiry dates.
                        </p>
                      </div>
                    )}

                    {product && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Expiry Information
                        </label>
                        <div className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-200 rounded-xl text-gray-600">
                          {product.expiry_date
                            ? formatDate(product.expiry_date)
                            : "Varies by batch"}
                        </div>
                        <p className="text-xs text-blue-600 mt-1">
                          💡 Each batch can have different expiry dates. Check
                          Batch Management for details.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
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
                  type="submit"
                  className="group px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <span className="flex items-center space-x-2">
                    <span>{product ? "Update Product" : "Add Product"}</span>
                  </span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Product Details Modal Component
function ProductDetailsModal({ product, onClose, onEdit }) {
  const [batches, setBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [showAddStockModal, setShowAddStockModal] = useState(false);

  const stockStatus = getStockStatus(product);
  const expiryStatus = getExpiryStatus(product);
  const stockBreakdown = getStockBreakdown(product.stock_in_pieces, product);

  useEffect(() => {
    if (product?.id) {
      loadBatches();
    }
  }, [product?.id]);

  const loadBatches = async () => {
    try {
      setLoadingBatches(true);
      const batchData = await ProductService.getBatchesForProduct(product.id);
      setBatches(batchData);
    } catch (error) {
      console.warn("⚠️ Batch functions not available yet:", error);
      setBatches([]);
    } finally {
      setLoadingBatches(false);
    }
  };

  const handleStockAdded = async (result) => {
    console.log("✅ Stock added successfully:", result);
    await loadBatches();
  };

  const getExpiryStatusForBatch = (expiryDate, daysUntilExpiry) => {
    if (!expiryDate)
      return { status: "none", color: "gray", label: "No expiry" };

    if (daysUntilExpiry < 0) {
      return { status: "expired", color: "red", label: "Expired" };
    } else if (daysUntilExpiry === 0) {
      return { status: "expires-today", color: "red", label: "Expires today" };
    } else if (daysUntilExpiry <= 30) {
      return {
        status: "expiring-soon",
        color: "orange",
        label: "Expiring soon",
      };
    } else if (daysUntilExpiry <= 90) {
      return { status: "expiring", color: "yellow", label: "Expiring" };
    } else {
      return { status: "good", color: "green", label: "Good" };
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative w-full max-w-5xl bg-white rounded-xl shadow-2xl max-h-[95vh] overflow-hidden">
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
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAddStockModal(true)}
              className="group flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white font-medium rounded-xl hover:from-green-700 hover:to-green-800 shadow-lg transition-all duration-200"
            >
              <Plus className="h-4 w-4" />
              <span>Add Stock</span>
            </button>
            <button
              onClick={onEdit}
              className="group flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-lg transition-all duration-200"
            >
              <Edit className="h-4 w-4" />
              <span>Edit</span>
            </button>
            <button
              onClick={onClose}
              className="group p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Product Information */}
            <div className="space-y-4">
              {/* General Information */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                  <Package className="h-5 w-5 mr-2 text-blue-600" />
                  General Information
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <dt className="text-xs font-semibold text-gray-600">Generic Name</dt>
                    <dd className="text-sm font-bold text-gray-900">{product.generic_name}</dd>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <dt className="text-xs font-semibold text-gray-600">Brand</dt>
                    <dd className="text-sm font-bold text-blue-900">{product.brand_name || "N/A"}</dd>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <dt className="text-xs font-semibold text-gray-600">Category</dt>
                    <dd className="text-sm font-bold text-purple-900">{product.category}</dd>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <dt className="text-xs font-semibold text-gray-600">Dosage</dt>
                    <dd className="text-sm font-bold text-orange-900">{product.dosage_strength || "Not specified"}</dd>
                  </div>
                  {product.description && (
                    <div className="col-span-2 bg-white rounded-lg p-3 shadow-sm">
                      <dt className="text-xs font-semibold text-gray-600">Description</dt>
                      <dd className="text-sm text-gray-700">{product.description}</dd>
                    </div>
                  )}
                </div>
              </div>

              {/* Stock Breakdown */}
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-yellow-600" />
                  Stock Breakdown
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white rounded-lg p-3 shadow-sm text-center">
                    <dt className="text-xs font-semibold text-gray-600">Pieces</dt>
                    <dd className="text-lg font-bold text-green-900">{stockBreakdown.pieces}</dd>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm text-center">
                    <dt className="text-xs font-semibold text-gray-600">Sheets</dt>
                    <dd className="text-lg font-bold text-blue-900">{stockBreakdown.sheets}</dd>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm text-center">
                    <dt className="text-xs font-semibold text-gray-600">Boxes</dt>
                    <dd className="text-lg font-bold text-purple-900">{stockBreakdown.boxes}</dd>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Batch Information and Status */}
            <div className="space-y-4">
              {/* Batch Tracking */}
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-orange-600" />
                  Batch Tracking
                </h4>
                
                {loadingBatches ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-orange-600 mr-2" />
                    <span className="text-orange-600">Loading batches...</span>
                  </div>
                ) : batches.length > 0 ? (
                  <div className="space-y-2">
                    <div className="max-h-64 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-orange-100 border-b">
                            <th className="px-3 py-2 text-left font-semibold text-orange-700">Batch Number</th>
                            <th className="px-3 py-2 text-left font-semibold text-orange-700">Quantity</th>
                            <th className="px-3 py-2 text-left font-semibold text-orange-700">Expiry Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {batches.map((batch, index) => {
                            const daysUntilExpiry = batch.expiry_date
                              ? Math.ceil((new Date(batch.expiry_date) - new Date()) / (1000 * 60 * 60 * 24))
                              : null;
                            const expiryStatus = getExpiryStatusForBatch(batch.expiry_date, daysUntilExpiry);
                            
                            return (
                              <tr key={index} className="border-b border-orange-100 hover:bg-orange-50">
                                <td className="px-3 py-2 font-mono text-xs font-medium">{batch.batch_number}</td>
                                <td className="px-3 py-2 font-semibold">{batch.quantity}</td>
                                <td className="px-3 py-2">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                                    ${expiryStatus.color === "green" ? "bg-green-100 text-green-700" :
                                      expiryStatus.color === "yellow" ? "bg-yellow-100 text-yellow-700" :
                                      expiryStatus.color === "orange" ? "bg-orange-100 text-orange-700" :
                                      expiryStatus.color === "red" ? "bg-red-100 text-red-700" :
                                      "bg-gray-100 text-gray-700"}`}>
                                    {batch.expiry_date ? formatDate(batch.expiry_date) : "No expiry"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-orange-300 mx-auto mb-3" />
                    <p className="text-orange-600 font-medium">No batch information available</p>
                    <p className="text-orange-500 text-sm">Add stock to create batches</p>
                  </div>
                )}
              </div>

              {/* Consolidated Stock Status */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-green-600" />
                  Stock Status
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-3 shadow-sm text-center">
                    <dt className="text-xs font-semibold text-gray-600">Current Stock</dt>
                    <dd className="text-lg font-bold text-green-900">{product.stock_in_pieces || 0} pcs</dd>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm text-center">
                    <dt className="text-xs font-semibold text-gray-600">Reorder Level</dt>
                    <dd className="text-lg font-bold text-orange-900">{product.reorder_level || 0} pcs</dd>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm text-center">
                    <dt className="text-xs font-semibold text-gray-600">Selling Price</dt>
                    <dd className="text-lg font-bold text-green-900">₱{product.selling_price || 0}</dd>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm text-center">
                    <dt className="text-xs font-semibold text-gray-600">Status</dt>
                    <dd className="text-sm font-bold">
                      {product.stock_in_pieces <= product.reorder_level ? (
                        <span className="text-red-600">⚠️ Low Stock</span>
                      ) : (
                        <span className="text-green-600">✅ Good</span>
                      )}
                    </dd>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Stock Modal */}
      <AddStockModal
        isOpen={showAddStockModal}
        onClose={() => setShowAddStockModal(false)}
        product={product}
        onSuccess={handleStockAdded}
      />
    </div>
  );
}

          {showExportModal && (
            <ExportModal
              isOpen={showExportModal}
              onClose={() => setShowExportModal(false)}
              data={allProducts}
              filename="inventory_export"
            />
          )}

          {showImportModal && (
            <EnhancedImportModal
              isOpen={showImportModal}
              onClose={() => setShowImportModal(false)}
              onSuccess={() => {
                setShowImportModal(false);
                loadProducts(); // Refresh the product list
              }}
            />
          )}

          {showArchiveModal && productToArchive && (
            <ArchiveReasonModal
              isOpen={showArchiveModal}
              onClose={() => {
                setShowArchiveModal(false);
                setProductToArchive(null);
              }}
              onConfirm={handleArchiveConfirm}
              productName={productToArchive.generic_name || productToArchive.brand_name}
              isProcessing={isArchiving}
            />
          )}

          {showCategoriesModal && (
            <CategoryManagement
              isOpen={showCategoriesModal}
              onClose={() => setShowCategoriesModal(false)}
              onCategoryChange={loadDynamicCategories}
            />
          )}

          {showArchivedModal && (
            <ArchivedProductsManagement
              isOpen={showArchivedModal}
              onClose={() => setShowArchivedModal(false)}
              onRestoreSuccess={loadProducts}
            />
          )}
        </>
      ) : (
        /* Analytics/Dashboard Tab */
        <AnalyticsReportsPage />
      )}
    </div>
  );
}

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
      (formData.brand_name ||
        formData.generic_name ||
        formData.category ||
        formData.expiry_date)
    ) {
      const newBatch = generateSmartBatchNumber(
        formData.brand_name || formData.generic_name,
        formData.category,
        formData.expiry_date
      );
      setFormData((prev) => ({ ...prev, batch_number: newBatch }));
    }
  }, [
    formData.brand_name,
    formData.generic_name,
    formData.category,
    formData.expiry_date,
    product,
  ]);

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
          formData.brand_name || formData.generic_name,
          formData.category,
          formData.expiry_date
        ),
    };

    onSave(sanitizedData);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="relative w-full max-w-6xl bg-white rounded-xl shadow-2xl max-h-[95vh] overflow-hidden">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-3 h-3 text-blue-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">{title}</h3>
                <p className="text-xs text-gray-600">
                  {product
                    ? "Update product metadata (stock managed via batches)"
                    : "Create new product with initial batch"}
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
          <div className="flex-1 overflow-hidden p-3">
            <form onSubmit={handleSubmit} className="h-full">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full overflow-y-auto">
                {/* Left Column */}
                <div className="space-y-3 overflow-y-auto">
                  {/* Basic Information Section */}
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center">
                      <Package className="w-4 h-4 mr-1 text-blue-600" />
                      Basic Information
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Generic Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.generic_name}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              generic_name: e.target.value,
                            })
                          }
                          className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., Paracetamol"
                    />
                  </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Brand Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.brand_name}
                          onChange={(e) =>
                            setFormData({ ...formData, brand_name: e.target.value })
                          }
                          className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., Tylenol"
                    />
                  </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Category *
                        </label>
                        <select
                          required
                          value={formData.category}
                          onChange={(e) =>
                            setFormData({ ...formData, category: e.target.value })
                          }
                          className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select category</option>
                      {categories.map((category) => (
                        <option
                          key={category.id || category}
                          value={category.name || category}
                        >
                          {category.name || category}
                        </option>
                      ))}
                    </select>
                  </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Manufacturer
                        </label>
                        <input
                          type="text"
                          value={formData.manufacturer}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              manufacturer: e.target.value,
                            })
                          }
                          className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., Johnson & Johnson"
                        />
                  </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
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
                          rows={2}
                          className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                          placeholder="Enter product description"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Medicine-Specific Details Section */}
                  <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                    <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center">
                      <Pill className="w-4 h-4 mr-1 text-purple-600" />
                      Medicine Details
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Dosage Form
                        </label>
                        <select
                          value={formData.dosage_form}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              dosage_form: e.target.value,
                            })
                          }
                          className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                        >
                          <option value="">Select dosage form</option>
                          <option value="Tablet">Tablet</option>
                          <option value="Capsule">Capsule</option>
                          <option value="Syrup">Syrup</option>
                          <option value="Injection">Injection</option>
                          <option value="Ointment">Ointment</option>
                          <option value="Drops">Drops</option>
                          <option value="Inhaler">Inhaler</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Dosage Strength
                        </label>
                        <input
                          type="text"
                          value={formData.dosage_strength}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              dosage_strength: e.target.value,
                            })
                          }
                          className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="e.g., 500mg, 10ml"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Drug Classification
                        </label>
                        <select
                          value={formData.drug_classification}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              drug_classification: e.target.value,
                            })
                          }
                          className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                        >
                          <option value="">Select classification</option>
                          <option value="Prescription (Rx)">
                            Prescription (Rx)
                          </option>
                          <option value="Over-the-Counter (OTC)">
                            Over-the-Counter (OTC)
                          </option>
                          <option value="Controlled Substance">
                            Controlled Substance
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-3 overflow-y-auto">
                  {/* Pricing Section */}
                  <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center">
                      <DollarSign className="w-4 h-4 mr-1 text-green-600" />
                      Pricing & Costs
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Cost Price (₱)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.cost_price}
                          onChange={(e) => handleCostPriceChange(e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Selling Price (₱) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={formData.price_per_piece}
                          onChange={(e) => handleSellPriceChange(e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-blue-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Margin (%)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.margin_percentage}
                          onChange={(e) => handleMarginChange(e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0.00"
                          readOnly={
                            formData.cost_price && formData.price_per_piece
                          }
                        />
                      </div>
                    </div>
                  </div>
                          â‚±
                          {(
                            parseFloat(formData.price_per_piece) -
                    </div>
                  </div>

                  {/* Stock Management Section */}
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center">
                      <Package className="w-4 h-4 mr-1 text-gray-600" />
                      Stock Details
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {!product && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Initial Stock (Pieces) *
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
                            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter initial stock"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
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
                          className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Supplier
                        </label>
                        <input
                          type="text"
                          value={formData.supplier}
                          onChange={(e) =>
                            setFormData({ ...formData, supplier: e.target.value })
                          }
                          className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter supplier name"
                        />
                      </div>

                      {!product && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Initial Batch Expiry Date
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
                            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Modal Footer */}
          <div className="border-t border-gray-200 bg-gray-50 px-3 py-3 flex-shrink-0">
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm border border-gray-200 text-gray-700 font-medium rounded-lg hover:border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 shadow"
              >
                {product ? "Update Product" : "Add Product"}
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
  const [batches, setBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [showAddStockModal, setShowAddStockModal] = useState(false);

  const stockStatus = getStockStatus(product);
  const expiryStatus = getExpiryStatus(product);
  const stockBreakdown = getStockBreakdown(product.stock_in_pieces, product);

  // Load batches when modal opens
  useEffect(() => {
    if (product?.id) {
      loadBatches();
    }
  }, [product?.id]);

  const loadBatches = async () => {
    try {
      setLoadingBatches(true);
      const batchData = await ProductService.getBatchesForProduct(product.id);
      setBatches(batchData);
    } catch (error) {
      console.warn("⚠️ Batch functions not available yet:", error);
      setBatches([]);
    } finally {
      setLoadingBatches(false);
    }
  };
                      </div>
                      <p className="text-xs text-blue-600 mt-1">
                        ðŸ’¡ Stock is calculated from batches. Use Batch
                        Management to modify.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="flex items-center justify-between text-sm font-semibold text-gray-700 mb-2">
                      <span>Batch Number *</span>
                      <button
                        type="button"
                        onClick={() => {
                          const newBatch = generateSmartBatchNumber(
                            formData.brand_name || formData.generic_name,
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
                        ðŸ”„ Generate
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

                  {/* Expiry date only shown when adding new products */}
                  {!product && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Initial Batch Expiry Date
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
                      <p className="text-xs text-gray-500 mt-1">
                        For the initial batch. Additional batches can have
                        different expiry dates.
                      </p>
                    </div>
                  )}

                  {/* Show expiry info when editing (informational) */}
                  {product && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Expiry Information
                      </label>
                      <div className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-200 rounded-xl text-gray-600">
                        {product.expiry_date
                          ? formatDate(product.expiry_date)
                          : "Varies by batch"}
                      </div>
                      <p className="text-xs text-blue-600 mt-1">
                        ðŸ’¡ Each batch can have different expiry dates. Check
                        Batch Management for details.
                      </p>
                    </div>
                  )}
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
  const [batches, setBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [showAddStockModal, setShowAddStockModal] = useState(false);

  const stockStatus = getStockStatus(product);
  const expiryStatus = getExpiryStatus(product);
  const stockBreakdown = getStockBreakdown(product.stock_in_pieces, product);

  // Load batches when modal opens
  useEffect(() => {
    if (product?.id) {
      loadBatches();
    }
  }, [product?.id]);

  const loadBatches = async () => {
    try {
      setLoadingBatches(true);
      const batchData = await ProductService.getBatchesForProduct(product.id);
      setBatches(batchData);
    } catch (error) {
      console.warn("âš ï¸ Batch functions not available yet:", error);
      setBatches([]);
    } finally {
      setLoadingBatches(false);
    }
  };

  const handleStockAdded = async (result) => {
    console.log("âœ… Stock added successfully:", result);
    // Refresh batches
    await loadBatches();
    // You might want to refresh the main product data here too
  };

  const getExpiryStatusForBatch = (expiryDate, daysUntilExpiry) => {
    if (!expiryDate)
      return { status: "none", color: "gray", label: "No expiry" };

    if (daysUntilExpiry < 0) {
      return { status: "expired", color: "red", label: "Expired" };
    } else if (daysUntilExpiry === 0) {
      return { status: "expires-today", color: "red", label: "Expires today" };
    } else if (daysUntilExpiry <= 30) {
      return {
        status: "expiring-soon",
        color: "orange",
        label: "Expiring soon",
      };
    } else if (daysUntilExpiry <= 90) {
      return { status: "expiring", color: "yellow", label: "Expiring" };
    } else {
      return { status: "good", color: "green", label: "Good" };
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
      >
        <div className="flex flex-col h-full">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-xl">
                <Eye className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                Product Details
              </h3>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowAddStockModal(true)}
                className="group flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white font-medium rounded-lg hover:from-green-700 hover:to-green-800 shadow transition-all duration-200"
              >
                <Plus className="h-4 w-4" />
                <span>Add Stock</span>
              </button>
              <button
                onClick={onEdit}
                className="group flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 shadow transition-all duration-200"
              >
                <Edit className="h-4 w-4" />
                <span>Edit</span>
              </button>
              <button
                onClick={onClose}
                className="group p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Modal Body - Optimized Layout */}
          <div className="flex-1 overflow-hidden p-3">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
              {/* Left Column - Product Details (Scrollable) */}
              <div className="space-y-3 overflow-y-auto pr-2">
                {/* General Information */}
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center">
                    <Package className="h-4 w-4 mr-1 text-blue-600" />
                    General Information
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white rounded p-2">
                      <dt className="text-xs font-semibold text-gray-600">Generic Name</dt>
                      <dd className="text-sm font-bold text-blue-900 truncate">{product.generic_name || "Not specified"}</dd>
                    </div>
                    <div className="bg-white rounded p-2">
                      <dt className="text-xs font-semibold text-gray-600">Brand Name</dt>
                      <dd className="text-sm font-bold text-blue-900 truncate">{product.brand_name || "Not specified"}</dd>
                    </div>
                    <div className="bg-white rounded p-2">
                      <dt className="text-xs font-semibold text-gray-600">Category</dt>
                      <dd className="text-sm font-semibold text-gray-900">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
                          {product.category}
                        </span>
                      </dd>
                    </div>
                    <div className="bg-white rounded p-2">
                      <dt className="text-xs font-semibold text-gray-600">Dosage</dt>
                      <dd className="text-sm font-bold text-purple-900 truncate">{product.dosage_strength || "Not specified"}</dd>
                    </div>
                  </div>
                </div>

                {/* Stock Information */}
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center">
                    <BarChart3 className="h-4 w-4 mr-1 text-green-600" />
                    Stock Status
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white rounded p-2 text-center">
                      <dt className="text-xs font-semibold text-gray-600">Stock</dt>
                      <dd className="text-sm font-bold text-green-900">{product.stock_in_pieces || 0}</dd>
                    </div>
                    <div className="bg-white rounded p-2 text-center">
                      <dt className="text-xs font-semibold text-gray-600">Price</dt>
                      <dd className="text-sm font-bold text-green-900">â‚±{product.selling_price || 0}</dd>
                    </div>
                    <div className="bg-white rounded p-2 text-center">
                      <dt className="text-xs font-semibold text-gray-600">Reorder</dt>
                      <dd className="text-sm font-bold text-orange-900">{product.reorder_level || 0}</dd>
                    </div>
                  </div>
                </div>

                {/* Description if available */}
                {product.description && (
                  <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                    <h4 className="text-xs font-bold text-gray-900 mb-1">Description</h4>
                    <p className="text-xs text-gray-700 leading-tight line-clamp-2">{product.description}</p>
                  </div>
                )}
              </div>

              {/* Right Column - Batch Tracking & Stock Status */}
              <div className="space-y-4">
                {/* Batch Tracking - Top Priority */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-xl font-bold text-gray-900 flex items-center">
                      <Package className="h-6 w-6 mr-3 text-purple-600" />
                      Batch Tracking
                    </h4>
                    <span className="text-sm text-gray-600">
                      {batches.length} batch{batches.length !== 1 ? "es" : ""}{" "}
                      found
                    </span>
                  </div>

                  {loadingBatches ? (
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100 text-center">
                      <div className="animate-spin h-6 w-6 border-2 border-purple-600 border-t-transparent rounded-full mx-auto"></div>
                      <p className="text-xs text-gray-600 mt-2">Loading batches...</p>
                    </div>
                  ) : batches.length === 0 ? (
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100 text-center">
                      <Package className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                      <h5 className="text-xs font-medium text-gray-600">
                        No batch records available
                      </h5>
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg shadow-sm border border-purple-100 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">
                                Batch Number
                              </th>
                              <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">
                                Quantity
                              </th>
                              <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">
                                Expiry Date
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {batches.map((batch) => {
                              const batchExpiryStatus = getExpiryStatusForBatch(
                                batch.expiry_date,
                                batch.days_until_expiry
                              );

                              return (
                                <tr
                                  key={batch.batch_id}
                                  className="hover:bg-gray-50"
                                >
                                  <td className="px-2 py-1 whitespace-nowrap">
                                    <span className="text-xs font-mono font-medium text-gray-900">
                                      {batch.batch_number || `#${batch.batch_id}`}
                                    </span>
                                  </td>
                                  <td className="px-2 py-1 whitespace-nowrap">
                                    <span className="text-xs font-medium text-gray-900">
                                      {batch.quantity?.toLocaleString()} pcs
                                    </span>
                                  </td>
                                  <td className="px-2 py-1 whitespace-nowrap">
                                    <div className="text-xs text-gray-900">
                                      {batch.expiry_date ? formatDate(batch.expiry_date) : '-'}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* Consolidated Stock Status */}
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-green-600" />
                    Stock Status
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 shadow-sm text-center">
                      <dt className="text-xs font-semibold text-gray-600">Current Stock</dt>
                      <dd className="text-lg font-bold text-green-900">{product.stock_in_pieces || 0} pcs</dd>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm text-center">
                      <dt className="text-xs font-semibold text-gray-600">Reorder Level</dt>
                      <dd className="text-lg font-bold text-orange-900">{product.reorder_level || 0} pcs</dd>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm text-center">
                      <dt className="text-xs font-semibold text-gray-600">Selling Price</dt>
                      <dd className="text-lg font-bold text-green-900">â‚±{product.selling_price || 0}</dd>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm text-center">
                      <dt className="text-xs font-semibold text-gray-600">Status</dt>
                      <dd className="text-sm font-bold">
                        {product.stock_in_pieces <= product.reorder_level ? (
                          <span className="text-red-600">âš ï¸ Low Stock</span>
                        ) : (
                          <span className="text-green-600">âœ… Good</span>
                        )}
                      </dd>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Stock Modal */}
      <AddStockModal
        isOpen={showAddStockModal}
        onClose={() => setShowAddStockModal(false)}
        product={product}
        onSuccess={handleStockAdded}
      />
    </div>
  );
}
