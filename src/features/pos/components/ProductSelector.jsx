import React, { useState, useEffect } from "react";
import {
  Search,
  Package,
  Plus,
  AlertTriangle,
  Filter,
  Tag,
  ShoppingCart,
} from "lucide-react";
import { formatCurrency } from "../../../utils/formatting";
import { UnifiedCategoryService } from "../../../services/domains/inventory/unifiedCategoryService";
import VariantSelectionModal from "./VariantSelectionModal";

export default function ProductSelector({
  products = [],
  onAddToCart,
  cartItems = [],
  className = "",
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState(products);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [availableCategories, setAvailableCategories] = useState([]);
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

  // Extract unique categories from products and sort by intelligent category insights
  useEffect(() => {
    const categories = [...new Set(products.map((p) => p.category))].filter(
      Boolean
    );

    // Sort categories by intelligent category insights (value-based)
    const sortedCategories = categories.sort((a, b) => {
      const categoryA = intelligentCategories.find((cat) => cat.name === a);
      const categoryB = intelligentCategories.find((cat) => cat.name === b);

      const valueA = categoryA?.stats?.total_value || 0;
      const valueB = categoryB?.stats?.total_value || 0;

      return valueB - valueA; // Sort by highest value first
    });

    setAvailableCategories(sortedCategories);
  }, [products, intelligentCategories]);

  // Filter products based on search term and category
  useEffect(() => {
    let filtered = products;

    // Filter by category first
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (product) => product.category === selectedCategory
      );
    }

    // Then filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          (product.name && product.name.toLowerCase().includes(term)) ||
          (product.generic_name && product.generic_name.toLowerCase().includes(term)) ||
          (product.brand && product.brand.toLowerCase().includes(term)) ||
          (product.brand_name && product.brand_name.toLowerCase().includes(term)) ||
          (product.manufacturer && product.manufacturer.toLowerCase().includes(term)) ||
          (product.pharmacologic_category && product.pharmacologic_category.toLowerCase().includes(term)) ||
          (product.registration_number && product.registration_number.toLowerCase().includes(term)) ||
          (product.category && product.category.toLowerCase().includes(term))
      );
    }

    setFilteredProducts(filtered);
  }, [searchTerm, selectedCategory, products]);

  const handleProductClick = (product) => {
    if (product.stock_in_pieces > 0) {
      setSelectedProduct(product);
      setShowVariantModal(true);
    }
  };

  const handleAddToCart = (product, quantity, selectedVariant) => {
    console.log("🔄 ProductSelector - Received:", {
      product: product.generic_name || product.name || 'Unknown Product',
      quantity,
      selectedVariant,
    });

    // Pass the parameters correctly to the POS page
    onAddToCart(product, quantity, selectedVariant);
    setShowVariantModal(false);
    setSelectedProduct(null);
  };

  const isProductAvailable = (product) => {
    // Calculate real-time available stock considering cart items
    const cartQuantity = cartItems
      .filter((item) => item.productId === product.id)
      .reduce((total, item) => total + item.quantityInPieces, 0);

    const availableStock = Math.max(0, product.stock_in_pieces - cartQuantity);
    return availableStock > 0;
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Select Products
        </h3>

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

        {/* Category Filter */}
        <div className="space-y-2">
          <label className="flex items-center text-sm font-medium text-gray-700">
            <Filter className="h-4 w-4 mr-2" />
            Filter by Category
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === "all"
                  ? "bg-blue-100 text-blue-700 border-2 border-blue-300"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent"
              }`}
            >
              <Tag className="h-4 w-4 mr-1 inline" />
              All Categories
            </button>
            {availableCategories.map((category) => {
              const categoryInsight = intelligentCategories.find(
                (cat) => cat.name === category
              );
              const isHighValue =
                categoryInsight && categoryInsight.stats?.total_value > 1000;

              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                    selectedCategory === category
                      ? "bg-blue-100 text-blue-700 border-2 border-blue-300"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent"
                  }`}
                >
                  {category}
                  {isHighValue && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredProducts.map((product) => {
              const isAvailable = isProductAvailable(product);
              const cartQuantity = cartItems
                .filter((item) => item.productId === product.id)
                .reduce((total, item) => total + item.quantityInPieces, 0);
              const availableStock = Math.max(0, product.stock_in_pieces - cartQuantity);
              const isLowStock = availableStock <= (product.reorder_level || 0);

              return (
                <button
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  disabled={!isAvailable}
                  className={`group relative bg-white border-2 rounded-lg overflow-hidden transition-all duration-200 text-left hover:scale-[1.02] aspect-[3/4] flex flex-col ${
                    isAvailable
                      ? "border-gray-200 hover:border-blue-400 hover:shadow-lg cursor-pointer"
                      : "opacity-60 cursor-not-allowed border-gray-200"
                  }`}
                >
                  {/* Status Indicator - Top Right - Only for Out of Stock */}
                  {!isAvailable && (
                    <div className="absolute top-2 right-2 z-10">
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        Out of Stock
                      </span>
                    </div>
                  )}

                  {/* Card Content - Standardized Medicine Display */}
                  <div className="p-3 flex-1 flex flex-col">
                    {/* PRIMARY: Brand Name (Most Prominent) */}
                    <div className="mb-1">
                      <h4 className="font-bold text-gray-900 text-lg leading-tight line-clamp-1">
                        {product.brand_name || product.brand || 'Unknown Brand'}
                      </h4>
                    </div>

                    {/* PRIMARY: Generic Name */}
                    <div className="mb-2">
                      <p className="text-gray-600 text-sm font-semibold line-clamp-1">
                        {product.generic_name || product.name || 'Unknown Generic'}
                      </p>
                    </div>

                    {/* PRIMARY: Dosage Information - Always Visible */}
                    <div className="mb-3 flex-shrink-0">
                      {(product.dosage_strength || product.dosage_form) ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                          {product.dosage_strength || 'N/A'} {product.dosage_form || ''}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          No dosage info
                        </span>
                      )}
                    </div>

                    {/* SECONDARY: Price (Prominent) */}
                    <div className="mb-3 flex-shrink-0">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                        <div className="text-green-600 text-xs font-medium">Price per piece</div>
                        <div className="font-bold text-green-700 text-lg">
                          {formatCurrency(product.price_per_piece)}
                        </div>
                      </div>
                    </div>

                    {/* SECONDARY: Category */}
                    <div className="mb-3 flex-shrink-0">
                      <span className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium truncate max-w-full">
                        {product.category || 'No category'}
                      </span>
                    </div>

                    {/* TERTIARY: Manufacturer (if available) */}
                    {product.manufacturer && (
                      <div className="mb-2 flex-shrink-0">
                        <p className="text-gray-500 text-xs truncate">
                          by {product.manufacturer}
                        </p>
                      </div>
                    )}

                    {/* TERTIARY: Drug Classification Badge */}
                    {product.drug_classification && (
                      <div className="mb-3 flex-shrink-0">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          product.drug_classification === 'Prescription (Rx)' 
                            ? 'bg-red-100 text-red-800'
                            : product.drug_classification === 'Over-the-Counter (OTC)'
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {product.drug_classification}
                        </span>
                      </div>
                    )}

                    {/* Stock Info - Takes remaining space */}
                    <div className="flex-1 flex flex-col justify-end">
                      <div className="mb-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">Available:</span>
                          <span className={`font-bold text-base ${
                            availableStock === 0
                              ? 'text-red-600'
                              : isLowStock 
                              ? 'text-amber-600' 
                              : 'text-green-600'
                          }`}>
                            {availableStock}
                          </span>
                        </div>
                      </div>
                      
                      {cartQuantity > 0 && (
                        <div className="text-center">
                          <span className="text-xs text-gray-500 font-medium">
                            {cartQuantity} in cart
                          </span>
                        </div>
                      )}
                      
                      {isAvailable && isLowStock && (
                        <div className="bg-amber-50 p-1 rounded text-center mt-1">
                          <div className="flex items-center justify-center gap-1 text-amber-600">
                            <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                            <span className="text-xs font-semibold">Low Stock!</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Hover Overlay Effect */}
                  {isAvailable && (
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-600/0 to-blue-600/0 group-hover:from-blue-600/5 group-hover:to-blue-600/10 transition-all duration-200 pointer-events-none rounded-lg" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary */}
      {cartItems.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              {cartItems.length} item{cartItems.length !== 1 ? "s" : ""} in cart
            </span>
            <span className="font-medium text-gray-900">
              Total:{" "}
              {formatCurrency(
                cartItems.reduce(
                  (sum, item) => sum + item.price * item.quantity,
                  0
                )
              )}
            </span>
          </div>
        </div>
      )}

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
