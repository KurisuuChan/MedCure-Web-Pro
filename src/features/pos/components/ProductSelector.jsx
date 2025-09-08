import React, { useState, useEffect } from "react";
import {
  Search,
  Package,
  Plus,
  AlertTriangle,
  Filter,
  Tag,
} from "lucide-react";
import { formatCurrency } from "../../../utils/formatting";
import { IntelligentCategoryService } from "../../../services/intelligentCategoryService";
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
        const result = await IntelligentCategoryService.getCategoryInsights();
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
          product.name.toLowerCase().includes(term) ||
          product.brand.toLowerCase().includes(term) ||
          product.category.toLowerCase().includes(term)
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
      product: product.name,
      quantity,
      selectedVariant,
    });

    // Pass the parameters correctly to the POS page
    onAddToCart(product, quantity, selectedVariant);
    setShowVariantModal(false);
    setSelectedProduct(null);
  };

  const isProductAvailable = (product) => {
    return product.stock_in_pieces > 0;
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

      {/* Product List */}
      <div className="max-h-[600px] overflow-y-auto">
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
          <div className="p-4 space-y-3">
            {filteredProducts.map((product) => {
              const isAvailable = isProductAvailable(product);

              return (
                <button
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleProductClick(product);
                    }
                  }}
                  disabled={!isAvailable}
                  className={`group p-6 border-2 rounded-2xl transition-all duration-300 text-left w-full transform hover:scale-[1.02] ${
                    isAvailable
                      ? "border-gray-200 hover:border-blue-400 hover:shadow-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 cursor-pointer"
                      : "opacity-60 cursor-not-allowed border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    {/* Product Info */}
                    <div className="flex items-center space-x-5 flex-1 min-w-0">
                      {/* Professional Medical Icon */}
                      <div
                        className={`p-4 rounded-2xl transition-all duration-300 ${
                          isAvailable
                            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg group-hover:from-blue-600 group-hover:to-blue-700"
                            : "bg-gray-200 text-gray-400"
                        }`}
                      >
                        <Package className="h-7 w-7" />
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Product Name */}
                        <h4 className="font-bold text-gray-900 truncate text-xl mb-1">
                          {product.name}
                        </h4>

                        {/* Brand & Category */}
                        <div className="flex items-center space-x-3 mb-3">
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                            {product.brand}
                          </span>
                          <span className="text-gray-500 font-medium">
                            {product.category}
                          </span>
                        </div>

                        {/* Pricing and Stock Info */}
                        <div className="flex items-center space-x-6">
                          <div className="bg-green-50 px-4 py-2 rounded-xl border border-green-200">
                            <span className="text-green-600 text-sm font-medium">
                              From{" "}
                            </span>
                            <span className="font-bold text-green-700 text-lg">
                              {formatCurrency(product.price_per_piece)}
                            </span>
                            <span className="text-green-600 text-sm font-medium">
                              /piece
                            </span>
                          </div>

                          <div
                            className={`px-4 py-2 rounded-xl border ${
                              product.stock_in_pieces <=
                              (product.reorder_level || 0)
                                ? "bg-amber-50 border-amber-200"
                                : "bg-gray-50 border-gray-200"
                            }`}
                          >
                            <span className="text-gray-600 text-sm font-medium">
                              Stock:{" "}
                            </span>
                            <span
                              className={`font-bold text-lg ${
                                product.stock_in_pieces <=
                                (product.reorder_level || 0)
                                  ? "text-amber-600"
                                  : "text-gray-800"
                              }`}
                            >
                              {product.stock_in_pieces}
                            </span>
                            <span className="text-gray-600 text-sm font-medium">
                              {" "}
                              pieces
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Professional Add Button */}
                    <div className="flex-shrink-0 ml-6">
                      {isAvailable ? (
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-2xl group-hover:from-blue-700 group-hover:to-blue-800 transition-all duration-300 shadow-lg">
                          <Plus className="h-6 w-6" />
                        </div>
                      ) : (
                        <div className="bg-gray-200 text-gray-500 px-6 py-3 rounded-2xl text-sm font-bold border-2 border-gray-300">
                          Out of Stock
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Enhanced Low Stock Warning */}
                  {isAvailable &&
                    product.stock_in_pieces <= (product.reorder_level || 0) && (
                      <div className="mt-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-400 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className="bg-amber-100 p-1 rounded-full">
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                          </div>
                          <p className="text-sm font-semibold text-amber-800">
                            ⚠️ Low Stock Alert: Only {product.stock_in_pieces}{" "}
                            pieces remaining
                          </p>
                        </div>
                      </div>
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
