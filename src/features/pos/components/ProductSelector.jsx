import React, { useState, useEffect, memo } from "react";
import {
  Search,
  Package,
  Plus,
  AlertTriangle,
  Filter,
  Tag,
  ShoppingCart,
  ChevronDown,
  X,
  Pill,
  Shield,
  Clock,
  TrendingUp,
} from "lucide-react";
import { formatCurrency } from "../../../utils/formatting";
import { UnifiedCategoryService } from "../../../services/domains/inventory/unifiedCategoryService";
import { EnhancedProductSearchService } from "../../../services/domains/inventory/enhancedProductSearchService";
import VariantSelectionModal from "./VariantSelectionModal";
import { useDebounce } from "../../../hooks/useDebounce";

function ProductSelector({
  products = [],
  onAddToCart,
  cartItems = [],
  className = "",
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300); // Debounce search for better performance
  const [filteredProducts, setFilteredProducts] = useState(products);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showVariantModal, setShowVariantModal] = useState(false);

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDrugClassification, setSelectedDrugClassification] =
    useState("all");
  const [selectedDosageForm, setSelectedDosageForm] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Filter options
  const [availableCategories, setAvailableCategories] = useState([]);
  const [availableDrugClassifications, setAvailableDrugClassifications] =
    useState([]);
  const [availableDosageForms, setAvailableDosageForms] = useState([]);
  const [intelligentCategories, setIntelligentCategories] = useState([]);

  // Load intelligent categories
  useEffect(() => {
    const loadIntelligentCategories = async () => {
      try {
        const result = await UnifiedCategoryService.getCategoryInsights();
        if (result.success) {
          setIntelligentCategories(result.data.top_value_categories || []);
        }
      } catch (error) {
        console.error("Failed to load intelligent categories:", error);
      }
    };
    loadIntelligentCategories();
  }, []);

  // Load drug classifications
  useEffect(() => {
    const loadDrugClassifications = async () => {
      try {
        const result =
          await EnhancedProductSearchService.getDistinctDrugClassifications();
        if (result.success) {
          setAvailableDrugClassifications(result.data);
        }
      } catch (error) {
        console.error("Failed to load drug classifications:", error);
      }
    };
    loadDrugClassifications();
  }, []);

  // Extract unique categories, dosage forms from products
  useEffect(() => {
    const categories = [...new Set(products.map((p) => p.category))].filter(
      Boolean
    );
    const dosageForms = [...new Set(products.map((p) => p.dosage_form))].filter(
      Boolean
    );

    // Sort categories by intelligent category insights (value-based)
    const sortedCategories = categories.sort((a, b) => {
      const categoryA = intelligentCategories.find((cat) => cat.name === a);
      const categoryB = intelligentCategories.find((cat) => cat.name === b);
      const valueA = categoryA?.stats?.total_value || 0;
      const valueB = categoryB?.stats?.total_value || 0;
      return valueB - valueA;
    });

    setAvailableCategories(sortedCategories);
    setAvailableDosageForms(dosageForms.sort());
  }, [products, intelligentCategories]);

  // Filter products based on all filter criteria
  useEffect(() => {
    let filtered = products;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (product) => product.category === selectedCategory
      );
    }

    // Filter by drug classification
    if (selectedDrugClassification !== "all") {
      filtered = filtered.filter(
        (product) => product.drug_classification === selectedDrugClassification
      );
    }

    // Filter by dosage form
    if (selectedDosageForm !== "all") {
      filtered = filtered.filter(
        (product) => product.dosage_form === selectedDosageForm
      );
    }

    // Filter by stock status
    if (stockFilter !== "all") {
      filtered = filtered.filter((product) => {
        const cartQuantity = cartItems
          .filter((item) => item.productId === product.id)
          .reduce((total, item) => total + item.quantityInPieces, 0);
        const availableStock = Math.max(
          0,
          product.stock_in_pieces - cartQuantity
        );

        switch (stockFilter) {
          case "in-stock":
            return availableStock > 0;
          case "low-stock":
            return (
              availableStock > 0 &&
              availableStock <= (product.reorder_level || 0)
            );
          case "out-of-stock":
            return availableStock === 0;
          default:
            return true;
        }
      });
    }

    // Filter by price range
    if (priceRange !== "all") {
      filtered = filtered.filter((product) => {
        const price = product.price_per_piece || product.price || 0;
        switch (priceRange) {
          case "under-10":
            return price < 10;
          case "10-50":
            return price >= 10 && price <= 50;
          case "50-100":
            return price >= 50 && price <= 100;
          case "over-100":
            return price > 100;
          default:
            return true;
        }
      });
    }

    // Filter by search term
    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          (product.generic_name &&
            product.generic_name.toLowerCase().includes(term)) ||
          (product.brand && product.brand.toLowerCase().includes(term)) ||
          (product.brand_name &&
            product.brand_name.toLowerCase().includes(term)) ||
          (product.category && product.category.toLowerCase().includes(term)) ||
          (product.dosage_form &&
            product.dosage_form.toLowerCase().includes(term)) ||
          (product.drug_classification &&
            product.drug_classification.toLowerCase().includes(term))
      );
    }

    setFilteredProducts(filtered);
  }, [
    debouncedSearchTerm,
    selectedCategory,
    selectedDrugClassification,
    selectedDosageForm,
    stockFilter,
    priceRange,
    products,
    cartItems,
  ]);

  const handleProductClick = (product) => {
    if (product.stock_in_pieces > 0) {
      setSelectedProduct(product);
      setShowVariantModal(true);
    }
  };

  const handleAddToCart = (product, quantity, selectedVariant) => {
    console.log("🔄 ProductSelector - Received:", {
      product: `${product.brand_name || "Generic"} - ${
        product.generic_name || "Unknown Medicine"
      }`,
      generic_name: product.generic_name,
      brand_name: product.brand_name,
      quantity,
      selectedVariant,
    });

    onAddToCart(product, quantity, selectedVariant);
    setShowVariantModal(false);
    setSelectedProduct(null);
  };

  const isProductAvailable = (product) => {
    const cartQuantity = cartItems
      .filter((item) => item.productId === product.id)
      .reduce((total, item) => total + item.quantityInPieces, 0);
    const availableStock = Math.max(0, product.stock_in_pieces - cartQuantity);
    return availableStock > 0;
  };

  const clearAllFilters = () => {
    setSelectedCategory("all");
    setSelectedDrugClassification("all");
    setSelectedDosageForm("all");
    setStockFilter("all");
    setPriceRange("all");
    setSearchTerm("");
  };

  const getDrugClassificationStyle = (classification) => {
    if (!classification)
      return { bg: "bg-gray-50", text: "text-gray-500", label: "" };

    const normalizedClassification = classification.toLowerCase();

    if (
      normalizedClassification.includes("prescription") ||
      normalizedClassification.includes("rx")
    ) {
      return {
        bg: "bg-red-50",
        text: "text-red-600",
        label: "Rx",
      };
    } else if (
      normalizedClassification.includes("otc") ||
      normalizedClassification.includes("over-the-counter")
    ) {
      return {
        bg: "bg-green-50",
        text: "text-green-600",
        label: "OTC",
      };
    } else if (normalizedClassification.includes("controlled")) {
      return {
        bg: "bg-orange-50",
        text: "text-orange-600",
        label: "Controlled",
      };
    } else {
      return {
        bg: "bg-blue-50",
        text: "text-blue-600",
        label:
          classification.length > 12
            ? classification.substring(0, 12) + "..."
            : classification,
      };
    }
  };

  const activeFiltersCount = [
    selectedCategory !== "all",
    selectedDrugClassification !== "all",
    selectedDosageForm !== "all",
    stockFilter !== "all",
    priceRange !== "all",
  ].filter(Boolean).length;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">
            Select Products
          </h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              showFilters || activeFiltersCount > 0
                ? "bg-blue-100 text-blue-700 border-2 border-blue-300"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent"
            }`}
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
                {activeFiltersCount}
              </span>
            )}
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                showFilters ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Advanced Filters</h4>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800"
                >
                  <X className="h-4 w-4" />
                  Clear All
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Tag className="h-4 w-4 inline mr-1" />
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  {availableCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Drug Classification Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Shield className="h-4 w-4 inline mr-1" />
                  Drug Classification
                </label>
                <select
                  value={selectedDrugClassification}
                  onChange={(e) =>
                    setSelectedDrugClassification(e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Classifications</option>
                  {availableDrugClassifications.map((classification) => (
                    <option key={classification} value={classification}>
                      {classification}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dosage Form Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Pill className="h-4 w-4 inline mr-1" />
                  Dosage Form
                </label>
                <select
                  value={selectedDosageForm}
                  onChange={(e) => setSelectedDosageForm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Forms</option>
                  {availableDosageForms.map((form) => (
                    <option key={form} value={form}>
                      {form}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stock Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Package className="h-4 w-4 inline mr-1" />
                  Stock Status
                </label>
                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Items</option>
                  <option value="in-stock">In Stock</option>
                  <option value="low-stock">Low Stock</option>
                  <option value="out-of-stock">Out of Stock</option>
                </select>
              </div>

              {/* Price Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <TrendingUp className="h-4 w-4 inline mr-1" />
                  Price Range
                </label>
                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Prices</option>
                  <option value="under-10">Under ₱10</option>
                  <option value="10-50">₱10 - ₱50</option>
                  <option value="50-100">₱50 - ₱100</option>
                  <option value="over-100">Over ₱100</option>
                </select>
              </div>
            </div>

            {/* Filter Summary */}
            <div className="text-sm text-gray-600">
              Showing {filteredProducts.length} of {products.length} products
            </div>
          </div>
        )}
      </div>

      {/* Product Grid - Card Layout */}
      <div className="max-h-[calc(100vh-320px)] overflow-y-auto p-6">
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-xl font-medium text-gray-400">
              No products found
            </p>
            <p className="text-gray-400 mt-2">
              Try adjusting your search terms
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => {
              const isAvailable = isProductAvailable(product);
              const cartQuantity = cartItems
                .filter((item) => item.productId === product.id)
                .reduce((total, item) => total + item.quantityInPieces, 0);
              const availableStock = Math.max(
                0,
                product.stock_in_pieces - cartQuantity
              );
              const isLowStock = availableStock <= (product.reorder_level || 0);

              return (
                <div
                  key={product.id}
                  onClick={() => isAvailable && handleProductClick(product)}
                  className={`group relative bg-white border rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden ${
                    isAvailable
                      ? "border-gray-200 hover:border-blue-300 cursor-pointer hover:scale-[1.02]"
                      : "opacity-60 cursor-not-allowed border-gray-200"
                  }`}
                >
                  {/* Status Badges */}
                  <div className="absolute top-3 right-3 z-10 flex flex-col gap-1">
                    {!isAvailable && (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                        Out of Stock
                      </span>
                    )}
                    {isLowStock && isAvailable && (
                      <span className="bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                        Low Stock
                      </span>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    {/* Brand Name */}
                    <h3 className="font-bold text-gray-900 text-base leading-tight mb-1 line-clamp-1">
                      {product.brand_name || product.brand || "Unknown Brand"}
                    </h3>

                    {/* Generic Name */}
                    <p className="text-gray-600 text-sm font-medium mb-3 line-clamp-2">
                      {product.generic_name || "Unknown Medicine"}
                    </p>

                    {/* Dosage Info & Drug Classification */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      {product.dosage_strength && (
                        <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded font-medium">
                          {product.dosage_strength}
                        </span>
                      )}
                      {product.dosage_form && (
                        <span className="text-xs text-white bg-purple-500 px-2 py-1 rounded font-medium">
                          {product.dosage_form}
                        </span>
                      )}
                      {product.drug_classification && (
                        <span
                          className={`text-xs px-2 py-1 rounded-md font-medium ${
                            getDrugClassificationStyle(
                              product.drug_classification
                            ).bg
                          } ${
                            getDrugClassificationStyle(
                              product.drug_classification
                            ).text
                          }`}
                        >
                          {
                            getDrugClassificationStyle(
                              product.drug_classification
                            ).label
                          }
                        </span>
                      )}
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xl font-bold text-green-600">
                        {formatCurrency(
                          product.price_per_piece || product.price || 0
                        )}
                      </span>
                      <span className="text-xs text-gray-500">per piece</span>
                    </div>

                    {/* Stock Info */}
                    <div className="flex items-center justify-between text-sm">
                      <span
                        className={`font-medium ${
                          availableStock === 0
                            ? "text-red-600"
                            : isLowStock
                            ? "text-amber-600"
                            : "text-gray-700"
                        }`}
                      >
                        Stock: {availableStock}
                      </span>
                      {cartQuantity > 0 && (
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium text-xs">
                          {cartQuantity} in cart
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Hover Overlay */}
                  {isAvailable && (
                    <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/5 transition-all duration-200 pointer-events-none rounded-xl" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Variant Selection Modal */}
      <VariantSelectionModal
        product={selectedProduct}
        isOpen={showVariantModal}
        onClose={() => {
          setShowVariantModal(false);
          setSelectedProduct(null);
        }}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}

// Memoize component to prevent unnecessary re-renders
export default memo(ProductSelector);
