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
          (product.generic_name && product.generic_name.toLowerCase().includes(term)) ||
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
      product: `${product.brand_name || 'Generic'} - ${product.generic_name || 'Unknown Medicine'}`,
      generic_name: product.generic_name,
      brand_name: product.brand_name,
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => {
              const isAvailable = isProductAvailable(product);
              const cartQuantity = cartItems
                .filter((item) => item.productId === product.id)
                .reduce((total, item) => total + item.quantityInPieces, 0);
              const availableStock = Math.max(0, product.stock_in_pieces - cartQuantity);
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
                      {product.brand_name || product.brand || 'Unknown Brand'}
                    </h3>

                    {/* Generic Name */}
                    <p className="text-gray-600 text-sm font-medium mb-3 line-clamp-2">
                      {product.generic_name || 'Unknown Medicine'}
                    </p>

                    {/* Dosage Info */}
                    {(product.dosage_strength || product.dosage_form) && (
                      <div className="flex items-center gap-2 mb-3">
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
                      </div>
                    )}

                    {/* Price */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xl font-bold text-green-600">
                        {formatCurrency(product.price_per_piece || product.price || 0)}
                      </span>
                      <span className="text-xs text-gray-500">per piece</span>
                    </div>

                    {/* Stock Info */}
                    <div className="flex items-center justify-between text-sm">
                      <span className={`font-medium ${
                        availableStock === 0 ? 'text-red-600' : 
                        isLowStock ? 'text-amber-600' : 'text-gray-700'
                      }`}>
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
