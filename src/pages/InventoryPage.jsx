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
import { useToast } from "../components/ui/Toast";
import ProductSearch from "../features/inventory/components/ProductSearch";
import { UnifiedCategoryService } from "../services/domains/inventory/unifiedCategoryService";
import ProductCard from "../features/inventory/components/ProductCard";
import { useInventory } from "../features/inventory/hooks/useInventory";
import ExportModal from "../components/ui/ExportModal";
import { EnhancedImportModalV2 } from "../components/ui/EnhancedImportModalV2";
import { useAuth } from "../hooks/useAuth"; // Not currently used
import { ProductService } from "../services/domains/inventory/productService";
import AddStockModal from "../components/modals/AddStockModal";
import CategoryManagement from "../features/inventory/components/CategoryManagement";
import ArchivedProductsManagement from "../features/inventory/components/ArchivedProductsManagement";

// Extracted Components
import InventoryHeader from "../features/inventory/components/InventoryHeader";
import InventorySummary from "../features/inventory/components/InventorySummary";
import ProductListSection from "../features/inventory/components/ProductListSection";
import { LoadingInventoryPage } from "../components/ui/loading/PharmacyLoadingStates";

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
  const { success: showSuccess, error: showError, info: showInfo } = useToast();

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
      console.log("🏷️ [Inventory] Loading dynamic categories...");

      // Use UnifiedCategoryService directly to ensure consistency with Management page
      const result = await UnifiedCategoryService.getAllCategories({
        activeOnly: true,
      });

      if (result.success && result.data) {
        setDynamicCategories(result.data);
        console.log(
          "✅ [Inventory] Loaded categories from UnifiedCategoryService:",
          result.data
        );
      } else {
        console.error(
          "❌ [Inventory] UnifiedCategoryService failed:",
          result.error
        );
        // Only use fallback as last resort and log it clearly
        console.warn(
          "⚠️ [Inventory] Using hardcoded fallback categories - this should not happen in production!"
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
      console.error("❌ [Inventory] Error loading categories:", error);
      // Only use fallback as last resort and log it clearly
      console.warn(
        "⚠️ [Inventory] Using hardcoded fallback categories due to error - this should not happen in production!"
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

  // Show full page loading skeleton on initial load
  if (isLoading && allProducts.length === 0) {
    return (
      <div className="space-y-6">
        <LoadingInventoryPage />
      </div>
    );
  }

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
                  console.log("🚀 Attempting to add product:", productData);
                  const result = await addProduct(productData);
                  console.log("✅ Product added successfully:", result);
                  setShowAddModal(false);
                  // Reload products to show the new one
                  await loadProducts();
                  // Success feedback
                  console.log("✅ Product added successfully!");
                  showSuccess(
                    `🎉 Product "${productData.generic_name}" added successfully!`,
                    {
                      duration: 4000,
                      action: {
                        label: "View Products",
                        onClick: () => setActiveTab("inventory"),
                      },
                    }
                  );
                } catch (error) {
                  console.error("❌ Add product error:", error);
                  showError(
                    `Failed to add product: ${
                      error.message || "Unknown error occurred"
                    }`,
                    { duration: 6000 }
                  );
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
                  // Success feedback
                  showSuccess(
                    `✅ Product "${productData.generic_name}" updated successfully!`,
                    {
                      duration: 4000,
                      action: {
                        label: "View Product",
                        onClick: () => {},
                      },
                    }
                  );
                } catch (error) {
                  showError(`Failed to update product: ${error.message}`, {
                    duration: 6000,
                  });
                }
              }}
            />
          )}

          {showDetailsModal && selectedProduct && (
            <ProductDetailsModalNew
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
        onExportSuccess={(exportCount) => {
          showSuccess(
            `📤 Successfully exported ${exportCount} products to CSV!`,
            {
              duration: 5000,
              action: {
                label: "View Files",
                onClick: () => {},
              },
            }
          );
        }}
      />

      {/* Enhanced Import Modal V2 with AI-powered category detection & Modern Progress */}
      <EnhancedImportModalV2
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

            // Show success toast
            showSuccess(
              `📥 Successfully imported ${importedProducts.length} products with smart category detection!`,
              {
                duration: 6000,
                action: {
                  label: "View Products",
                  onClick: () => setActiveTab("inventory"),
                },
              }
            );
          } catch (error) {
            console.error("Enhanced import error:", error);
            showError(`Import failed: ${error.message}`, { duration: 6000 });
            throw new Error(`Import failed: ${error.message}`);
          }
        }}
        addToast={(toast) => {
          // Use our beautiful toast system instead of console logging
          if (toast.type === "success") {
            showSuccess(toast.message, { duration: 4000 });
          } else if (toast.type === "error") {
            showError(toast.message, { duration: 5000 });
          } else if (toast.type === "info") {
            showInfo(toast.message, { duration: 4000 });
          }
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

// Product Modal Component - Ultra-Compact Crosswise Design
function ProductModal({ title, product, categories, onClose, onSave }) {
  // Predefined options for dropdowns - Auto-create will handle new values
  const dosageFormOptions = [
    "Tablet",
    "Capsule",
    "Syrup",
    "Injection",
    "Ointment",
    "Drops",
    "Inhaler",
    "Suspension",
    "Cream",
    "Gel",
    "Patch",
    "Suppository",
    "Powder",
    "Solution",
    "Lotion",
    "Spray",
    "Granules",
    "Emulsion",
  ];

  const dosageStrengthOptions = [
    "5mg",
    "10mg",
    "25mg",
    "50mg",
    "100mg",
    "250mg",
    "500mg",
    "750mg",
    "1000mg",
    "1g",
    "2g",
    "5g",
    "10g",
    "1ml",
    "2ml",
    "5ml",
    "10ml",
    "15ml",
    "30ml",
    "60ml",
    "100ml",
    "120ml",
    "250ml",
    "500ml",
    "1L",
    "5%",
    "10%",
    "15%",
    "20%",
    "25%",
  ];

  const drugClassificationOptions = [
    "Prescription (Rx)",
    "Over-the-Counter (OTC)",
    "Controlled Substance",
    "Generic",
    "Brand",
    "Antibiotic",
    "Analgesic",
    "Antacid",
    "Vitamin",
    "Supplement",
    "Antiseptic",
    "Anti-inflammatory",
    "Antihypertensive",
    "Antihistamine",
    "Antidiabetic",
    "Schedule I",
    "Schedule II",
    "Schedule III",
  ];

  // Smart batch number generation
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
    batch_number:
      product?.batch_number ||
      generateSmartBatchNumber(
        product?.brand_name || product?.generic_name || "",
        product?.category || "Pain Relief",
        product?.expiry_date?.split("T")[0] || ""
      ),
    // Explicitly set active status for new products
    is_active: product?.is_active !== undefined ? product.is_active : true,
    is_archived:
      product?.is_archived !== undefined ? product.is_archived : false,
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

  // Handle cost price change
  const handleCostPriceChange = (value) => {
    const costPrice = parseFloat(value) || 0;
    const sellPrice = parseFloat(formData.price_per_piece) || 0;

    if (costPrice > 0 && sellPrice > 0) {
      const margin = calculateMargin(costPrice, sellPrice);
      setFormData({
        ...formData,
        cost_price: value,
        margin_percentage: margin,
      });
    } else {
      setFormData({ ...formData, cost_price: value });
    }
  };

  // Handle selling price change
  const handleSellPriceChange = (value) => {
    const sellPrice = parseFloat(value) || 0;
    const costPrice = parseFloat(formData.cost_price) || 0;

    if (costPrice > 0 && sellPrice > 0) {
      const margin = calculateMargin(costPrice, sellPrice);
      setFormData({
        ...formData,
        price_per_piece: value,
        margin_percentage: margin,
      });
    } else {
      setFormData({ ...formData, price_per_piece: value });
    }
  };

  // Handle margin change
  const handleMarginChange = (value) => {
    const margin = parseFloat(value) || 0;
    const costPrice = parseFloat(formData.cost_price) || 0;

    if (costPrice > 0 && margin > 0) {
      const sellPrice = calculateSellPrice(costPrice, margin);
      setFormData({
        ...formData,
        margin_percentage: value,
        price_per_piece: sellPrice,
      });
    } else {
      setFormData({ ...formData, margin_percentage: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("📝 Form submitted with data:", formData);

    // Basic validation
    if (!formData.generic_name.trim()) {
      showError("Generic name is required", { duration: 4000 });
      return;
    }

    if (
      !formData.price_per_piece ||
      parseFloat(formData.price_per_piece) <= 0
    ) {
      showError("Valid selling price is required", { duration: 4000 });
      return;
    }

    // Sanitize data before sending - convert empty strings to null for numeric fields
    const sanitizedData = {
      ...formData,
      // Convert numeric fields from empty strings to null
      cost_price:
        formData.cost_price === ""
          ? null
          : parseFloat(formData.cost_price) || null,
      price_per_piece:
        formData.price_per_piece === ""
          ? null
          : parseFloat(formData.price_per_piece) || null,
      margin_percentage:
        formData.margin_percentage === ""
          ? null
          : parseFloat(formData.margin_percentage) || null,
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
          ? 10
          : parseInt(formData.reorder_level) || 10,
      // Handle batch number
      batch_number: formData.batch_number || null,
      // Handle expiry date
      expiry_date: formData.expiry_date || null,
      // Ensure active status is explicitly set
      is_active: true,
      is_archived: false,
    };

    console.log("🧹 Sanitized data:", sanitizedData);
    console.log("🔍 Active status check:", {
      is_active: sanitizedData.is_active,
      is_archived: sanitizedData.is_archived,
    });

    try {
      await onSave(sanitizedData);
    } catch (error) {
      console.error("❌ Form submission error:", error);
      showError(
        `Error saving product: ${
          error.message || "Please check your input and try again"
        }`,
        { duration: 6000 }
      );
    }
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
                <h3 className="text-base font-semibold text-gray-900">
                  {title}
                </h3>
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
                    <div className="grid grid-cols-2 gap-2">
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
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter generic name"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
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
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter brand name (optional)"
                        />
                        <p className="text-xs text-gray-500 mt-0.5">
                          Leave blank to use generic name
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
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
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {categories.map((cat) => (
                            <option key={cat.id || cat.name} value={cat.name}>
                              {cat.name}
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
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter manufacturer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Medicine Details Section */}
                  <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                    <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center">
                      <Pill className="w-4 h-4 mr-1 text-purple-600" />
                      Medicine Specifications
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
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
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                        >
                          <option value="">Select dosage form</option>
                          {dosageFormOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Dosage Strength
                        </label>
                        <select
                          value={formData.dosage_strength}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              dosage_strength: e.target.value,
                            })
                          }
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                        >
                          <option value="">Select dosage strength</option>
                          {dosageStrengthOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="mt-2">
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
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="">Select drug classification</option>
                        {drugClassificationOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Pricing Section */}
                  <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center">
                      <DollarSign className="w-4 h-4 mr-1 text-green-600" />
                      Pricing & Margins
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Cost Price
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.cost_price}
                          onChange={(e) =>
                            handleCostPriceChange(e.target.value)
                          }
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Selling Price *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={formData.price_per_piece}
                          onChange={(e) =>
                            handleSellPriceChange(e.target.value)
                          }
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Margin %
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            value={formData.margin_percentage}
                            onChange={(e) => handleMarginChange(e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500 pr-6"
                            placeholder="0"
                          />
                          <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                            %
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Margin Calculation Display */}
                    {formData.cost_price && formData.price_per_piece && (
                      <div className="mt-2 p-2 bg-white rounded border text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            Profit per piece:
                          </span>
                          <span className="font-semibold text-green-600">
                            ₱
                            {(
                              parseFloat(formData.price_per_piece) -
                              parseFloat(formData.cost_price)
                            ).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-3 overflow-y-auto">
                  {/* Stock Management Section */}
                  <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                    <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center">
                      <BarChart3 className="w-4 h-4 mr-1 text-orange-600" />
                      Stock Management
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Current Stock (pieces)
                        </label>
                        <input
                          type="number"
                          required={!product} // Only required for new products
                          value={formData.stock_in_pieces}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              stock_in_pieces: e.target.value,
                            })
                          }
                          readOnly={!!product} // Only readonly when editing existing product
                          className={`w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500 ${
                            product
                              ? "bg-gray-50 text-gray-700 cursor-not-allowed"
                              : ""
                          }`}
                          placeholder="0"
                        />
                      </div>
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
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                          placeholder="10"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Pieces per Sheet
                        </label>
                        <input
                          type="number"
                          value={formData.pieces_per_sheet}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              pieces_per_sheet: e.target.value,
                            })
                          }
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                          placeholder="10"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Sheets per Box
                        </label>
                        <input
                          type="number"
                          value={formData.sheets_per_box}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              sheets_per_box: e.target.value,
                            })
                          }
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                          placeholder="10"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Supply Chain Section */}
                  <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
                    <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center">
                      <Shield className="w-4 h-4 mr-1 text-indigo-600" />
                      Supply Chain & Batch
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Supplier
                        </label>
                        <input
                          type="text"
                          value={formData.supplier}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              supplier: e.target.value,
                            })
                          }
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Enter supplier name"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
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
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-1">
                            <span>Batch Number *</span>
                            {product && (
                              <span className="text-xs text-gray-500 italic">
                                Read-only when editing
                              </span>
                            )}
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
                            readOnly={!!product} // Only readonly when editing existing product
                            className={`w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${
                              product
                                ? "bg-gray-50 text-gray-700 cursor-not-allowed"
                                : ""
                            }`}
                            placeholder="BT010125-123"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description Section */}
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <h4 className="text-sm font-bold text-gray-900 mb-2">
                      Additional Information
                    </h4>
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
                        rows={3}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        placeholder="Enter product description, usage instructions, or notes..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="border-t border-gray-200 bg-gray-50 px-3 py-3 flex-shrink-0">
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-600">
                    {product
                      ? "Updating existing product"
                      : "Creating new product"}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-100 hover:scale-105 transition-all duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 hover:scale-105 hover:shadow-lg transition-all duration-200 font-medium"
                    >
                      {product ? "Update Product" : "Add Product"}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

// Product Details Modal Component - Simple Working Version
function ProductDetailsModal({ product, onClose, onEdit }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl max-h-[95vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Product Details
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[calc(95vh-160px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Generic Name
                </label>
                <p className="text-lg font-semibold text-gray-900">
                  {product.generic_name || "N/A"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Brand Name
                </label>
                <p className="text-lg font-semibold text-gray-900">
                  {product.brand_name || "N/A"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Category
                </label>
                <p className="text-lg font-semibold text-gray-900">
                  {product.category || "N/A"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Manufacturer
                </label>
                <p className="text-lg font-semibold text-gray-900">
                  {product.manufacturer || "N/A"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Dosage Strength
                </label>
                <p className="text-lg font-semibold text-gray-900">
                  {product.dosage_strength || "N/A"}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Price per Piece
                </label>
                <p className="text-lg font-semibold text-green-600">
                  ?{product.price_per_piece || "0.00"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Stock (pieces)
                </label>
                <p className="text-lg font-semibold text-blue-600">
                  {product.stock_in_pieces || "0"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Reorder Level
                </label>
                <p className="text-lg font-semibold text-orange-600">
                  {product.reorder_level || "0"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Expiry Date
                </label>
                <p className="text-lg font-semibold text-gray-900">
                  {product.expiry_date
                    ? new Date(product.expiry_date).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Batch Number
                </label>
                <p className="text-lg font-semibold text-gray-900">
                  {product.batch_number || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {product.description && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-500 mb-2">
                Description
              </label>
              <p className="text-gray-900 p-3 bg-gray-50 rounded-lg">
                {product.description}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
          <button
            onClick={onEdit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:scale-105 hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Product</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Improved Product Details Modal Component - Ultra-Compact Crosswise Design
function ProductDetailsModalNew({ product, onClose, onEdit }) {
  const [showAddStockModal, setShowAddStockModal] = useState(false);

  const handleStockAdded = () => {
    setShowAddStockModal(false);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="relative w-full max-w-6xl bg-white rounded-xl shadow-2xl max-h-[95vh] overflow-hidden">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                <Eye className="w-3 h-3 text-green-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  Product Details
                </h3>
                <p className="text-xs text-gray-600">
                  Complete product information and current stock status
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
          <div className="p-3 overflow-y-auto max-h-[calc(95vh-140px)]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
              {/* Left Column - Product Details */}
              <div className="space-y-3 overflow-y-auto pr-2">
                {/* General Information */}
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center">
                    <Package className="h-4 w-4 mr-1 text-blue-600" />
                    General Information
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white rounded p-2">
                      <dt className="text-xs font-semibold text-gray-600">
                        Generic Name
                      </dt>
                      <dd className="text-sm font-bold text-blue-900 truncate">
                        {product.generic_name || "Not specified"}
                      </dd>
                    </div>
                    <div className="bg-white rounded p-2">
                      <dt className="text-xs font-semibold text-gray-600">
                        Brand Name
                      </dt>
                      <dd className="text-sm font-bold text-blue-900 truncate">
                        {product.brand_name || "Not specified"}
                      </dd>
                    </div>
                    <div className="bg-white rounded p-2">
                      <dt className="text-xs font-semibold text-gray-600">
                        Category
                      </dt>
                      <dd className="text-sm font-semibold text-gray-900">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
                          {product.category}
                        </span>
                      </dd>
                    </div>
                    <div className="bg-white rounded p-2">
                      <dt className="text-xs font-semibold text-gray-600">
                        Dosage
                      </dt>
                      <dd className="text-sm font-bold text-purple-900 truncate">
                        {product.dosage_strength || "Not specified"}
                      </dd>
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
                      <dt className="text-xs font-semibold text-gray-600">
                        Stock
                      </dt>
                      <dd className="text-sm font-bold text-green-900">
                        {product.stock_in_pieces || 0}
                      </dd>
                    </div>
                    <div className="bg-white rounded p-2 text-center">
                      <dt className="text-xs font-semibold text-gray-600">
                        Price
                      </dt>
                      <dd className="text-sm font-bold text-green-900">
                        ₱{product.price_per_piece || 0}
                      </dd>
                    </div>
                    <div className="bg-white rounded p-2 text-center">
                      <dt className="text-xs font-semibold text-gray-600">
                        Reorder
                      </dt>
                      <dd className="text-sm font-bold text-orange-900">
                        {product.reorder_level || 0}
                      </dd>
                    </div>
                  </div>
                </div>

                {/* Medicine Details */}
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                  <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center">
                    <Pill className="h-4 w-4 mr-1 text-purple-600" />
                    Medicine Details
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white rounded p-2">
                      <dt className="text-xs font-semibold text-gray-600">
                        Dosage Form
                      </dt>
                      <dd className="text-sm font-bold text-purple-900">
                        {product.dosage_form || "N/A"}
                      </dd>
                    </div>
                    <div className="bg-white rounded p-2">
                      <dt className="text-xs font-semibold text-gray-600">
                        Manufacturer
                      </dt>
                      <dd className="text-sm font-bold text-purple-900">
                        {product.manufacturer || "N/A"}
                      </dd>
                    </div>
                    <div className="bg-white rounded p-2 col-span-2">
                      <dt className="text-xs font-semibold text-gray-600">
                        Drug Classification
                      </dt>
                      <dd className="text-sm font-bold text-purple-900">
                        {product.drug_classification || "N/A"}
                      </dd>
                    </div>
                  </div>
                </div>

                {/* Pricing Information */}
                <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                  <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center">
                    <DollarSign className="h-4 w-4 mr-1 text-emerald-600" />
                    Pricing Details
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white rounded p-2">
                      <dt className="text-xs font-semibold text-gray-600">
                        Cost Price
                      </dt>
                      <dd className="text-sm font-bold text-emerald-900">
                        ₱{product.cost_price || "0.00"}
                      </dd>
                    </div>
                    <div className="bg-white rounded p-2">
                      <dt className="text-xs font-semibold text-gray-600">
                        Selling Price
                      </dt>
                      <dd className="text-sm font-bold text-emerald-900">
                        ₱{product.price_per_piece || "0.00"}
                      </dd>
                    </div>
                    <div className="bg-white rounded p-2">
                      <dt className="text-xs font-semibold text-gray-600">
                        Margin
                      </dt>
                      <dd className="text-sm font-bold text-emerald-900">
                        {product.margin_percentage || "0"}%
                      </dd>
                    </div>
                    <div className="bg-white rounded p-2">
                      <dt className="text-xs font-semibold text-gray-600">
                        Total Value
                      </dt>
                      <dd className="text-sm font-bold text-emerald-900">
                        ₱
                        {(
                          (product.stock_in_pieces || 0) *
                          (product.price_per_piece || 0)
                        ).toFixed(2)}
                      </dd>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Supply Chain & Actions */}
              <div className="space-y-3 overflow-y-auto">
                {/* Supply Chain Information */}
                <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
                  <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center">
                    <Shield className="h-4 w-4 mr-1 text-indigo-600" />
                    Supply Chain
                  </h4>
                  <div className="space-y-2">
                    <div className="bg-white rounded p-2">
                      <dt className="text-xs font-semibold text-gray-600">
                        Supplier
                      </dt>
                      <dd className="text-sm font-bold text-indigo-900">
                        {product.supplier || "Not specified"}
                      </dd>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white rounded p-2">
                        <dt className="text-xs font-semibold text-gray-600">
                          Batch Number
                        </dt>
                        <dd className="text-sm font-bold text-indigo-900">
                          {product.batch_number || "N/A"}
                        </dd>
                      </div>
                      <div className="bg-white rounded p-2">
                        <dt className="text-xs font-semibold text-gray-600">
                          Expiry Date
                        </dt>
                        <dd className="text-sm font-bold text-indigo-900">
                          {product.expiry_date
                            ? new Date(product.expiry_date).toLocaleDateString()
                            : "N/A"}
                        </dd>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Packaging Information */}
                <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                  <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center">
                    <Package className="h-4 w-4 mr-1 text-orange-600" />
                    Packaging Details
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white rounded p-2">
                      <dt className="text-xs font-semibold text-gray-600">
                        Pieces/Sheet
                      </dt>
                      <dd className="text-sm font-bold text-orange-900">
                        {product.pieces_per_sheet || "1"}
                      </dd>
                    </div>
                    <div className="bg-white rounded p-2">
                      <dt className="text-xs font-semibold text-gray-600">
                        Sheets/Box
                      </dt>
                      <dd className="text-sm font-bold text-orange-900">
                        {product.sheets_per_box || "1"}
                      </dd>
                    </div>
                    <div className="bg-white rounded p-2 col-span-2">
                      <dt className="text-xs font-semibold text-gray-600">
                        Total pieces per box
                      </dt>
                      <dd className="text-sm font-bold text-orange-900">
                        {(product.pieces_per_sheet || 1) *
                          (product.sheets_per_box || 1)}{" "}
                        pieces
                      </dd>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {product.description && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <h4 className="text-sm font-bold text-gray-900 mb-2">
                      Description
                    </h4>
                    <div className="bg-white rounded p-2">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {product.description}
                      </p>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <h4 className="text-sm font-bold text-gray-900 mb-2">
                    Quick Actions
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={onEdit}
                      className="flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                    >
                      <Edit className="w-3 h-3" />
                      <span>Edit Product</span>
                    </button>
                    <button
                      onClick={() => setShowAddStockModal(true)}
                      className="flex items-center justify-center space-x-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Stock</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="border-t border-gray-200 bg-gray-50 px-3 py-3 flex-shrink-0">
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-600">
                Last updated:{" "}
                {product.updated_at
                  ? new Date(product.updated_at).toLocaleDateString()
                  : "Unknown"}
              </div>
              <button
                onClick={onClose}
                className="px-4 py-1.5 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
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
    </>
  );
}
