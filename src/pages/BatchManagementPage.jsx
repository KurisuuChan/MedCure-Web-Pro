import React, { useState, useEffect, useMemo } from "react";
import StandardizedProductDisplay from "../components/ui/StandardizedProductDisplay";
import ProfessionalPagination, {
  PaginatedCardGrid,
  usePagination,
} from "../components/ui/ProfessionalPagination";
import {
  Box,
  Search,
  Plus,
  Calendar,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  Download,
  RefreshCw,
  Edit,
  ShoppingCart,
  Zap,
  Upload,
  Settings,
  Shield,
} from "lucide-react";
import { ProductService } from "../services/domains/inventory/productService";
import { EnhancedBatchService } from "../services/domains/inventory/enhancedBatchService";
import { formatDate } from "../utils/dateTime";
import { formatCurrency } from "../utils/formatting";
import AddStockModal from "../components/modals/AddStockModal";
import BulkBatchImportModal from "../components/modals/BulkBatchImportModal";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import ProductSelectionCard from "../components/ui/ProductSelectionCard";

const BatchManagementPage = () => {
  // State Management
  const [batches, setBatches] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filter and Search States
  const [searchTerm, setSearchTerm] = useState("");
  const [batchAgeFilter, setBatchAgeFilter] = useState("all");
  const [expiryFilter, setExpiryFilter] = useState("all"); // all, expiring, expired
  const [statusFilter, setStatusFilter] = useState("all"); // all, active, expired, depleted

  // Enhanced Filter States
  const [supplierFilter, setSupplierFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortBy, setSortBy] = useState("expiry_date"); // expiry_date, created_at, quantity, product_name
  const [sortOrder, setSortOrder] = useState("asc"); // asc, desc
  const [quantityFilter, setQuantityFilter] = useState("all"); // all, low_stock, out_of_stock
  const [dateRangeFilter, setDateRangeFilter] = useState({
    startDate: "",
    endDate: "",
  });

  // Modal States
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [selectedProductForStock, setSelectedProductForStock] = useState(null);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Product Grid Search State
  const [productSearchTerm, setProductSearchTerm] = useState("");

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load products first (this should always work)
      const productsData = await ProductService.getProducts();
      setProducts(productsData);

      // Try to load batches using enhanced service first, fallback to basic service
      try {
        const batchesData = await EnhancedBatchService.getAllBatches({
          status: statusFilter === "all" ? null : statusFilter,
          expiryFilter: expiryFilter,
          limit: 200,
        });
        setBatches(batchesData);

        // Debug: Log the first batch to see what data structure we're getting
        if (batchesData && batchesData.length > 0) {
          console.log("🔍 Sample batch data structure:", {
            firstBatch: batchesData[0],
            hasNames: {
              product_brand_name: !!batchesData[0].product_brand_name,
              product_generic_name: !!batchesData[0].product_generic_name,
              product_name: !!batchesData[0].product_name,
            },
          });
        } else {
          console.log("⚠️ No batch data returned from EnhancedBatchService");
        }


      } catch (enhancedError) {
        console.warn(
          "⚠️ Enhanced batch service not available, using basic service:",
          enhancedError
        );

        // Fallback to basic service
        try {
          const batchesData = await ProductService.getAllBatches();
          setBatches(batchesData);
        } catch (basicError) {
          console.warn(
            "⚠️ Basic batch functions not available yet:",
            basicError
          );
          setBatches([]);
          setError(
            "Batch tracking functions not yet configured. Please run the SQL setup in Supabase."
          );
        }
      }
    } catch (err) {
      console.error("❌ Error loading data:", err);
      setError("Failed to load data. Please check your database connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Comprehensive filter and search logic
  const filteredBatches = useMemo(() => {
    let filtered = batches;

    // Text search filter (searches across multiple fields)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (batch) =>
          batch.product_name?.toLowerCase().includes(term) ||
          batch.product_brand_name?.toLowerCase().includes(term) ||
          batch.product_generic_name?.toLowerCase().includes(term) ||
          batch.batch_number?.toLowerCase().includes(term) ||
          batch.category_name?.toLowerCase().includes(term) ||
          batch.supplier_name?.toLowerCase().includes(term) ||
          batch.product_manufacturer?.toLowerCase().includes(term) ||
          batch.product_drug_classification?.toLowerCase().includes(term)
      );
    }

    // Batch age filter
    if (batchAgeFilter !== "all") {
      const today = new Date();
      filtered = filtered.filter((batch) => {
        if (!batch.received_date) return true;
        
        const receivedDate = new Date(batch.received_date);
        const daysDiff = Math.floor((today - receivedDate) / (1000 * 60 * 60 * 24));
        
        switch (batchAgeFilter) {
          case "new":
            return daysDiff <= 30;
          case "recent":
            return daysDiff > 30 && daysDiff <= 90;
          case "old":
            return daysDiff > 90 && daysDiff <= 180;
          case "very-old":
            return daysDiff > 180;
          default:
            return true;
        }
      });
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((batch) => batch.status === statusFilter);
    }

    // Supplier filter
    if (supplierFilter) {
      filtered = filtered.filter((batch) =>
        batch.supplier_name
          ?.toLowerCase()
          .includes(supplierFilter.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter) {
      filtered = filtered.filter((batch) =>
        batch.category_name
          ?.toLowerCase()
          .includes(categoryFilter.toLowerCase())
      );
    }

    // Quantity filter
    if (quantityFilter !== "all") {
      filtered = filtered.filter((batch) => {
        const quantity = batch.quantity || 0;
        switch (quantityFilter) {
          case "out_of_stock":
            return quantity === 0;
          case "low_stock":
            return quantity > 0 && quantity <= 50; // Adjustable threshold
          default:
            return true;
        }
      });
    }

    // Expiry filter
    if (expiryFilter !== "all") {
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      filtered = filtered.filter((batch) => {
        if (!batch.expiry_date) return expiryFilter === "all";

        const expiryDate = new Date(batch.expiry_date);

        switch (expiryFilter) {
          case "expired":
            return expiryDate < today;
          case "expiring":
            return expiryDate >= today && expiryDate <= thirtyDaysFromNow;
          case "valid":
            return expiryDate > thirtyDaysFromNow;
          default:
            return true;
        }
      });
    }

    // Date range filter
    if (dateRangeFilter.startDate || dateRangeFilter.endDate) {
      filtered = filtered.filter((batch) => {
        const createdDate = new Date(batch.created_at);
        const startDate = dateRangeFilter.startDate
          ? new Date(dateRangeFilter.startDate)
          : new Date("1900-01-01");
        const endDate = dateRangeFilter.endDate
          ? new Date(dateRangeFilter.endDate)
          : new Date();

        return createdDate >= startDate && createdDate <= endDate;
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "expiry_date":
          aValue = a.expiry_date
            ? new Date(a.expiry_date)
            : new Date("9999-12-31");
          bValue = b.expiry_date
            ? new Date(b.expiry_date)
            : new Date("9999-12-31");
          break;
        case "created_at":
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case "quantity":
          aValue = a.quantity || 0;
          bValue = b.quantity || 0;
          break;
        case "product_name":
          aValue = (a.product_brand_name || a.product_name || "").toLowerCase();
          bValue = (b.product_brand_name || b.product_name || "").toLowerCase();
          break;
        case "total_value":
          aValue = a.total_value || 0;
          bValue = b.total_value || 0;
          break;
        default:
          aValue = a[sortBy] || "";
          bValue = b[sortBy] || "";
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [
    batches,
    searchTerm,
    batchAgeFilter,
    statusFilter,
    supplierFilter,
    categoryFilter,
    quantityFilter,
    expiryFilter,
    dateRangeFilter,
    sortBy,
    sortOrder,
  ]);

  // Pagination for batch table (ensuring safe access to filteredBatches)
  const batchPagination = usePagination({
    totalItems: filteredBatches?.length || 0,
    itemsPerPage: 20,
  });

  // Get current page batches (with safe access)
  const currentBatches = useMemo(() => {
    if (!filteredBatches || filteredBatches.length === 0) return [];
    return filteredBatches.slice(
      batchPagination.startIndex,
      batchPagination.endIndex
    );
  }, [filteredBatches, batchPagination.startIndex, batchPagination.endIndex]);

  // Get unique values for filter dropdowns
  const uniqueSuppliers = useMemo(() => {
    const suppliers = batches
      .map((batch) => batch.supplier_name)
      .filter(Boolean)
      .filter((supplier, index, arr) => arr.indexOf(supplier) === index);
    return suppliers.sort();
  }, [batches]);

  const uniqueCategories = useMemo(() => {
    const categories = batches
      .map((batch) => batch.category_name)
      .filter(Boolean)
      .filter((category, index, arr) => arr.indexOf(category) === index);
    return categories.sort();
  }, [batches]);

  // Clear all filters function
  const clearAllFilters = () => {
    setSearchTerm("");
    setBatchAgeFilter("all");
    setStatusFilter("all");
    setSupplierFilter("");
    setCategoryFilter("");
    setQuantityFilter("all");
    setExpiryFilter("all");
    setDateRangeFilter({ startDate: "", endDate: "" });
    setSortBy("expiry_date");
    setSortOrder("asc");
  };

  // Get enhanced expiry status with more granular information
  const getExpiryStatus = (expiryDate, daysUntilExpiry) => {
    if (!expiryDate)
      return { status: "none", color: "gray", label: "No expiry", priority: 5 };

    if (daysUntilExpiry < 0) {
      return { status: "expired", color: "red", label: "Expired", priority: 1 };
    } else if (daysUntilExpiry === 0) {
      return {
        status: "expires-today",
        color: "red",
        label: "Expires today",
        priority: 2,
      };
    } else if (daysUntilExpiry <= 7) {
      return {
        status: "critical",
        color: "red",
        label: "Critical (≤7 days)",
        priority: 3,
      };
    } else if (daysUntilExpiry <= 30) {
      return {
        status: "expiring-soon",
        color: "orange",
        label: "Expiring soon (≤30 days)",
        priority: 4,
      };
    } else if (daysUntilExpiry <= 90) {
      return {
        status: "expiring",
        color: "yellow",
        label: "Expiring (≤90 days)",
        priority: 6,
      };
    } else {
      return {
        status: "good",
        color: "green",
        label: "Good (>90 days)",
        priority: 7,
      };
    }
  };

  const handleAddStock = (product) => {
    setSelectedProductForStock(product);
    setShowAddStockModal(true);
  };

  const handleStockAdded = async (result) => {
    console.log("✅ Stock added successfully:", result);
    // Clear the product search
    setProductSearchTerm("");
    // Refresh the batches data
    await handleRefresh();
  };

  const handleBulkImportSuccess = async (result) => {
    console.log("✅ Bulk import completed:", result);
    // Refresh the batches data
    await handleRefresh();
    // Close the modal
    setShowBulkImportModal(false);
  };

  // Enhanced maintenance actions
  const handleQuarantineExpired = async () => {
    try {
      setRefreshing(true);
      const result = await EnhancedBatchService.quarantineExpiredBatches();

      if (result.success) {
        alert(
          `Successfully quarantined ${result.quarantined_batches} expired batches`
        );
        await handleRefresh();
      } else {
        alert("Failed to quarantine expired batches: " + result.error);
      }
    } catch (error) {
      console.error("❌ Error quarantining expired batches:", error);
      alert("Failed to quarantine expired batches: " + error.message);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRunMaintenance = async () => {
    try {
      setRefreshing(true);
      const result = await EnhancedBatchService.runMaintenance();

      if (result.error) {
        alert("Maintenance completed with errors: " + result.error);
      } else {
        alert(
          `Maintenance completed successfully:\n- Quarantined: ${
            result.quarantined?.quarantined_batches || 0
          } batches`
        );
      }

      await handleRefresh();
    } catch (error) {
      console.error("❌ Error running maintenance:", error);
      alert("Failed to run maintenance: " + error.message);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle card-based stock addition
  const handleCardAddStock = (product) => {
    handleAddStock(product);
  };

  // Filter products for the card grid
  const filteredProducts = useMemo(() => {
    if (!productSearchTerm) return products;

    const term = productSearchTerm.toLowerCase();
    return products.filter(
      (product) =>
        product.name?.toLowerCase().includes(term) ||
        product.brand_name?.toLowerCase().includes(term) ||
        product.generic_name?.toLowerCase().includes(term) ||
        product.brand?.toLowerCase().includes(term) ||
        product.category?.toLowerCase().includes(term)
    );
  }, [products, productSearchTerm]);

  if (loading && !refreshing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
              <Box className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  Batch Management
                </h1>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                View, search, and add new inventory batches
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowBulkImportModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              title="Bulk import batches from CSV"
            >
              <Upload className="h-4 w-4" />
              <span>Bulk Import</span>
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCw
                className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>
      </div>



      {/* Primary Action: Add New Stock Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-1">
                  Add New Stock to Inventory
                </h2>
                <p className="text-blue-100 text-sm">
                  Select a product card below to add new batch inventory
                </p>
              </div>
            </div>
            <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
              <Zap className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products by name, brand, or category..."
              value={productSearchTerm}
              onChange={(e) => setProductSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {productSearchTerm && (
            <div className="mt-2 text-sm text-gray-500">
              Showing {filteredProducts.length} of {products.length} products
            </div>
          )}
        </div>

        {/* Product Cards Grid with Pagination */}
        <PaginatedCardGrid
          items={filteredProducts}
          renderItem={(product) => (
            <ProductSelectionCard
              key={product.id}
              product={product}
              onAddStock={handleCardAddStock}
            />
          )}
          itemsPerPage={12}
          gridCols="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          gap="gap-5"
          emptyState={
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {productSearchTerm
                  ? "No products found"
                  : "No products available"}
              </h3>
              <p className="text-gray-500 mb-4">
                {productSearchTerm
                  ? `No products match "${productSearchTerm}". Try adjusting your search.`
                  : "Please add products to your inventory first."}
              </p>
              {productSearchTerm && (
                <button
                  onClick={() => setProductSearchTerm("")}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Clear search
                </button>
              )}
            </div>
          }
          loading={loading}
          loadingComponent={
            <div className="flex items-center justify-center p-12">
              <LoadingSpinner size="lg" />
            </div>
          }
          paginationProps={{
            showPageSizeSelect: true,
            pageSizeOptions: [8, 12, 24, 48],
            variant: "default",
            size: "medium",
          }}
          className="p-6"
        />

        {error && (
          <div className="mx-6 mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="text-red-800 text-sm">{error}</span>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Batch Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Batch Management & Filters
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {filteredBatches?.length || 0} of {batches.length} batches shown
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="inline-flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Filter className="h-4 w-4 mr-2" />
              {showAdvancedFilters ? "Hide" : "Show"} Advanced Filters
            </button>
            {(searchTerm ||
              batchAgeFilter !== "all" ||
              statusFilter !== "all" ||
              supplierFilter ||
              categoryFilter ||
              quantityFilter !== "all" ||
              expiryFilter !== "all" ||
              dateRangeFilter.startDate ||
              dateRangeFilter.endDate) && (
              <button
                onClick={clearAllFilters}
                className="inline-flex items-center px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>
        </div>

        {/* Primary Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search batches, products, suppliers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Batch Age Filter */}
          <select
            value={batchAgeFilter}
            onChange={(e) => setBatchAgeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Batch Ages</option>
            <option value="new">New (≤30 days)</option>
            <option value="recent">Recent (31-90 days)</option>
            <option value="old">Old (91-180 days)</option>
            <option value="very-old">Very Old (&gt;180 days)</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="depleted">Depleted</option>
            <option value="quarantined">Quarantined</option>
          </select>

          {/* Expiry Filter */}
          <select
            value={expiryFilter}
            onChange={(e) => setExpiryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Expiry Status</option>
            <option value="expired">Expired</option>
            <option value="expiring">Expiring (≤30 days)</option>
            <option value="valid">Valid (&gt;30 days)</option>
          </select>
        </div>

        {/* Advanced Filters Section */}
        {showAdvancedFilters && (
          <div className="border-t border-gray-200 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Supplier Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier
                </label>
                <select
                  value={supplierFilter}
                  onChange={(e) => setSupplierFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Suppliers</option>
                  {uniqueSuppliers.map((supplier) => (
                    <option key={supplier} value={supplier}>
                      {supplier}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Categories</option>
                  {uniqueCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Level
                </label>
                <select
                  value={quantityFilter}
                  onChange={(e) => setQuantityFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Stock Levels</option>
                  <option value="out_of_stock">Out of Stock (0)</option>
                  <option value="low_stock">Low Stock (≤50)</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort By
                </label>
                <div className="flex space-x-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="expiry_date">Expiry Date</option>
                    <option value="created_at">Created Date</option>
                    <option value="product_name">Product Name</option>
                    <option value="quantity">Quantity</option>
                    <option value="total_value">Total Value</option>
                  </select>
                  <button
                    onClick={() =>
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 transition-colors"
                    title={`Sort ${
                      sortOrder === "asc" ? "Descending" : "Ascending"
                    }`}
                  >
                    {sortOrder === "asc" ? "↑" : "↓"}
                  </button>
                </div>
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Created Date From
                </label>
                <input
                  type="date"
                  value={dateRangeFilter.startDate}
                  onChange={(e) =>
                    setDateRangeFilter((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Created Date To
                </label>
                <input
                  type="date"
                  value={dateRangeFilter.endDate}
                  onChange={(e) =>
                    setDateRangeFilter((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Batch Number
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity & Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expiry Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentBatches.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center space-y-4">
                      <Package className="h-16 w-16 text-gray-400" />
                      <div className="text-center">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No batches found
                        </h3>
                        <p className="text-gray-500 mb-4">
                          {searchTerm ||
                          batchAgeFilter !== "all" ||
                          expiryFilter !== "all"
                            ? "Try adjusting your filters above"
                            : 'Use the "Add New Stock" section above to create your first batch'}
                        </p>
                        {!searchTerm &&
                          batchAgeFilter === "all" &&
                          expiryFilter === "all" && (
                            <button
                              onClick={() =>
                                window.scrollTo({
                                  top: 0,
                                  behavior: "smooth",
                                })
                              }
                              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Your First Batch
                            </button>
                          )}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                currentBatches.map((batch) => {
                  const expiryStatus = getExpiryStatus(
                    batch.expiry_date,
                    batch.days_until_expiry
                  );

                  return (
                    <tr key={batch.batch_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {/* Standardized Product Display - Compact Version */}
                        <StandardizedProductDisplay
                          product={{
                            brand_name:
                              batch.product_brand_name ||
                              batch.brand_name ||
                              batch.product_name ||
                              "Unknown Brand",
                            generic_name:
                              batch.product_generic_name ||
                              batch.generic_name ||
                              batch.product_name ||
                              "Unknown Generic",
                            dosage_strength:
                              batch.product_dosage_strength ||
                              batch.dosage_strength,
                            dosage_form:
                              batch.product_dosage_form || batch.dosage_form,
                            category: batch.category_name || batch.category,
                            manufacturer:
                              batch.product_manufacturer || batch.manufacturer,
                            drug_classification:
                              batch.product_drug_classification ||
                              batch.drug_classification,
                          }}
                          size="compact"
                          showPrice={false}
                          showCategory={true}
                          showManufacturer={true}
                          showClassification={false}
                          className="max-w-xs"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {batch.batch_number ||
                              `BT${new Date()
                                .toISOString()
                                .slice(5, 7)}${new Date()
                                .toISOString()
                                .slice(8, 10)}${new Date()
                                .toISOString()
                                .slice(2, 4)}-${String(
                                batch.batch_id || 1
                              ).padStart(3, "0")}`}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {batch.quantity?.toLocaleString()} pieces
                          </div>
                          <div className="text-xs text-gray-500">
                            Original:{" "}
                            {batch.original_quantity?.toLocaleString()}
                          </div>
                          {batch.reserved_quantity > 0 && (
                            <div className="text-xs text-orange-600">
                              Reserved:{" "}
                              {batch.reserved_quantity?.toLocaleString()}
                            </div>
                          )}
                          <div className="mt-1">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                batch.status === "active"
                                  ? "bg-green-100 text-green-800"
                                  : batch.status === "expired"
                                  ? "bg-red-100 text-red-800"
                                  : batch.status === "depleted"
                                  ? "bg-gray-100 text-gray-800"
                                  : "bg-orange-100 text-orange-800"
                              }`}
                            >
                              {batch.status || "active"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${expiryStatus.color}-100 text-${expiryStatus.color}-800`}
                          >
                            {expiryStatus.label}
                          </span>
                          {batch.expiry_date && (
                            <div className="text-xs text-gray-500">
                              {formatDate(batch.expiry_date)}
                              {batch.days_until_expiry !== null && (
                                <span className="ml-1">
                                  (
                                  {batch.days_until_expiry >= 0
                                    ? `${batch.days_until_expiry} days left`
                                    : `${Math.abs(
                                        batch.days_until_expiry
                                      )} days ago`}
                                  )
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(batch.created_at)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Batch Table Pagination */}
        {filteredBatches && filteredBatches.length > 0 && (
          <div className="border-t border-gray-200">
            <ProfessionalPagination
              currentPage={batchPagination.currentPage}
              totalPages={batchPagination.totalPages}
              totalItems={batchPagination.totalItems}
              itemsPerPage={batchPagination.itemsPerPage}
              onPageChange={batchPagination.goToPage}
              onPageSizeChange={batchPagination.changePageSize}
              showPageSizeSelect={true}
              pageSizeOptions={[10, 20, 50, 100]}
              variant="default"
              size="medium"
            />
          </div>
        )}
      </div>

      {/* Add Stock Modal */}
      <AddStockModal
        isOpen={showAddStockModal}
        onClose={() => {
          setShowAddStockModal(false);
          setSelectedProductForStock(null);
        }}
        product={selectedProductForStock}
        onSuccess={handleStockAdded}
      />

      {/* Bulk Import Modal */}
      <BulkBatchImportModal
        isOpen={showBulkImportModal}
        onClose={() => setShowBulkImportModal(false)}
        onSuccess={handleBulkImportSuccess}
      />
    </div>
  );
};

export default BatchManagementPage;
