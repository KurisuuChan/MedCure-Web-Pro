import React, { useState } from "react";
import {
  X,
  Package,
  Layers,
  Box,
  ShoppingCart,
  Plus,
  Minus,
  Info,
  AlertTriangle,
} from "lucide-react";
import { formatCurrency } from "../../../utils/formatting";
import { usePOSStore } from "../../../stores/posStore";
import "../../../components/ui/ScrollableModal.css";

export default function VariantSelectionModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
}) {
  const [selectedVariant, setSelectedVariant] = useState("piece");
  const [quantity, setQuantity] = useState(1);

  // 🎯 Professional: Get real-time cart data
  const { getAvailableStock, getAvailableVariants } = usePOSStore();

  if (!isOpen || !product) return null;

  // 🚀 Professional: Calculate real-time available stock (original - cart items)
  const availableStockInPieces = getAvailableStock
    ? getAvailableStock(product.id)
    : 0;

  // 🎯 Professional: Get dynamic variants based on real available stock
  const availableVariants = getAvailableVariants
    ? getAvailableVariants(product.id)
    : [];

  if (!isOpen || !product) return null;

  // � Professional: Check if product is completely out of stock
  const isCompletelyOutOfStock = availableStockInPieces <= 0;

  // �🚀 Professional: Convert dynamic variants to modal format
  const variants = {};

  availableVariants.forEach((variant) => {
    const icons = {
      piece: Package,
      sheet: Layers,
      box: Box,
    };

    variants[variant.unit] = {
      name: variant.label,
      icon: icons[variant.unit] || Package,
      price: variant.pricePerUnit,
      stock: variant.maxQuantity,
      unit: variant.unit,
      description:
        variant.unit === "piece"
          ? "Individual pieces"
          : variant.unit === "sheet"
          ? `${product.pieces_per_sheet} pieces per sheet`
          : `${product.sheets_per_box} sheets per box (${
              product.pieces_per_sheet * product.sheets_per_box
            } pieces)`,
      multiplier:
        variant.unit === "piece"
          ? 1
          : variant.unit === "sheet"
          ? product.pieces_per_sheet
          : product.pieces_per_sheet * product.sheets_per_box,
      availableStock: availableStockInPieces, // 🎯 Real-time available stock
    };
  });

  // 🛡️ Professional: Safe access to current variant with fallback
  const currentVariant = variants[selectedVariant] || {
    name: "Out of Stock",
    icon: AlertTriangle,
    price: 0,
    stock: 0,
    unit: selectedVariant,
    description: "No stock available",
    multiplier: 1,
    availableStock: 0,
  };

  const maxQuantity = Math.max(0, Math.min(currentVariant.stock || 0, 9999));
  const totalPrice = (currentVariant.price || 0) * quantity;
  const totalPieces = (currentVariant.multiplier || 1) * quantity;

  const isOutOfStock = (currentVariant.stock || 0) <= 0;
  const hasVariants = Object.keys(variants).length > 0;

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= maxQuantity) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    if (!isOutOfStock && quantity > 0) {
      console.log("🎯 Variant Modal - Adding to cart:", {
        product: `${product.brand_name || "Generic"} - ${
          product.generic_name || "Unknown Medicine"
        }`,
        brand_name: product.brand_name,
        generic_name: product.generic_name,
        quantity: quantity,
        selectedVariant: selectedVariant,
        currentVariant: currentVariant,
        totalPrice: totalPrice,
        totalPieces: totalPieces,
      });

      // Call onAddToCart with product, quantity, and unit - matching POS store expectations
      onAddToCart(product, quantity, selectedVariant);
      onClose();
      // Reset for next time
      setQuantity(1);
      setSelectedVariant("piece");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modern Compact Header - Matching Export Modal Style */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Select Purchase Unit
              </h3>
              <p className="text-sm text-gray-600">
                Choose quantity and unit type for this product
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="group p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
          >
            <X className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" />
          </button>
        </div>

        {/* Main Content - Scrollable */}
        <div className="flex-1 overflow-y-auto scrollable-modal-content">
          <div className="p-6">
            <div className="space-y-6">
              {/* Enhanced Product Information Card */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-5 rounded-xl border border-emerald-200">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-emerald-100 rounded-lg flex-shrink-0">
                    <Info className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-emerald-900 mb-2">
                      Product Information
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <span className="text-sm font-semibold text-emerald-800 w-32 flex-shrink-0">
                          Generic Name:
                        </span>
                        <span className="text-sm text-emerald-700 font-medium">
                          {product.generic_name || "Unknown Medicine"}
                        </span>
                      </div>
                      {product.brand_name && (
                        <div className="flex items-start">
                          <span className="text-sm font-semibold text-emerald-800 w-32 flex-shrink-0">
                            Brand Name:
                          </span>
                          <span className="text-sm text-emerald-700 font-medium">
                            {product.brand_name}
                          </span>
                        </div>
                      )}
                      {product.dosage_strength && (
                        <div className="flex items-start">
                          <span className="text-sm font-semibold text-emerald-800 w-32 flex-shrink-0">
                            Dosage:
                          </span>
                          <span className="text-sm text-emerald-700 font-medium">
                            {product.dosage_strength}{" "}
                            {product.dosage_form || ""}
                          </span>
                        </div>
                      )}
                      {product.description && (
                        <div className="flex items-start">
                          <span className="text-sm font-semibold text-emerald-800 w-32 flex-shrink-0">
                            Description:
                          </span>
                          <span className="text-sm text-emerald-700 font-medium leading-relaxed">
                            {product.description}
                          </span>
                        </div>
                      )}
                      <div className="flex items-start">
                        <span className="text-sm font-semibold text-emerald-800 w-32 flex-shrink-0">
                          Available Stock:
                        </span>
                        <span
                          className={`text-sm font-bold ${
                            availableStockInPieces > 20
                              ? "text-green-700"
                              : availableStockInPieces > 0
                              ? "text-yellow-700"
                              : "text-red-700"
                          }`}
                        >
                          {availableStockInPieces.toLocaleString()} pieces
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stock Status Alerts - Compact Design */}
              {isCompletelyOutOfStock && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center">
                    <div className="bg-red-100 p-2 rounded-lg mr-3 flex-shrink-0">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-red-800">
                        Product Unavailable
                      </h3>
                      <p className="text-xs text-red-600 mt-0.5">
                        All stock is in your cart or out of stock
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!isCompletelyOutOfStock && availableStockInPieces <= 20 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <div className="flex items-center">
                    <div className="bg-yellow-100 p-2 rounded-lg mr-3 flex-shrink-0">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-yellow-800">
                        Low Stock Alert
                      </h3>
                      <p className="text-xs text-yellow-600 mt-0.5">
                        Only {availableStockInPieces} pieces remaining
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Modern Compact Variant Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  📦 Choose Purchase Unit
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {hasVariants ? (
                    Object.entries(variants).map(([key, variant]) => {
                      const IconComponent = variant.icon;
                      const isSelected = selectedVariant === key;
                      const isAvailable = variant.stock > 0;

                      return (
                        <button
                          key={key}
                          onClick={() => isAvailable && setSelectedVariant(key)}
                          disabled={!isAvailable}
                          className={`group relative p-4 border-2 rounded-xl transition-all duration-200 ${
                            isSelected
                              ? "border-blue-500 bg-blue-50 shadow-md"
                              : isAvailable
                              ? "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                              : "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          )}

                          <div className="text-center space-y-2">
                            <div
                              className={`mx-auto w-12 h-12 flex items-center justify-center rounded-xl transition-colors ${
                                isSelected
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600"
                              }`}
                            >
                              <IconComponent className="h-6 w-6" />
                            </div>

                            <div>
                              <h4
                                className={`font-bold text-sm ${
                                  isSelected ? "text-blue-700" : "text-gray-900"
                                }`}
                              >
                                {variant.name}
                              </h4>
                              <p className="text-xs text-gray-500 mt-1 min-h-[2.5rem] flex items-center justify-center px-1">
                                {variant.description}
                              </p>
                            </div>

                            <div className="space-y-1.5">
                              <p
                                className={`font-bold text-base ${
                                  isSelected ? "text-blue-700" : "text-gray-900"
                                }`}
                              >
                                {formatCurrency(variant.price)}
                              </p>

                              <div
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                  isAvailable
                                    ? variant.stock > 10
                                      ? "bg-green-100 text-green-700"
                                      : "bg-yellow-100 text-yellow-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {!isAvailable && (
                                  <AlertTriangle className="h-3 w-3" />
                                )}
                                {isAvailable
                                  ? `${variant.stock} available`
                                  : "Out of stock"}
                              </div>

                              {variant.availableStock &&
                                variant.unit !== "piece" && (
                                  <div className="text-xs text-gray-400">
                                    ({variant.availableStock} pcs)
                                  </div>
                                )}
                            </div>
                          </div>

                          {!isAvailable && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/95 rounded-xl backdrop-blur-sm">
                              <span className="text-red-600 font-bold text-xs bg-red-50 px-3 py-1.5 rounded-full border border-red-200">
                                Out of Stock
                              </span>
                            </div>
                          )}
                        </button>
                      );
                    })
                  ) : (
                    <div className="col-span-full p-6 text-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl">
                      <div className="bg-gray-100 p-2 rounded-lg inline-block mb-2">
                        <AlertTriangle className="h-5 w-5 text-gray-600" />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-800 mb-1">
                        No Purchase Options Available
                      </h3>
                      <p className="text-xs text-gray-600">
                        This product is currently unavailable for purchase
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Compact Quantity Selection */}
              {!isOutOfStock && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    🔢 Select Quantity
                  </label>

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleQuantityChange(-1)}
                        disabled={quantity <= 1}
                        className="p-2 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        <Minus className="h-4 w-4 text-gray-600" />
                      </button>

                      <div className="flex flex-col items-center">
                        <input
                          type="number"
                          value={quantity}
                          onChange={(e) => {
                            const newQuantity = parseInt(e.target.value) || 1;
                            if (
                              newQuantity >= 1 &&
                              newQuantity <= maxQuantity
                            ) {
                              setQuantity(newQuantity);
                            }
                          }}
                          min="1"
                          max={maxQuantity}
                          className="w-20 text-center text-xl font-bold text-gray-900 border-2 border-gray-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                        <span className="mt-1 text-xs font-medium text-gray-500">
                          {currentVariant.unit}
                        </span>
                      </div>

                      <button
                        onClick={() => handleQuantityChange(1)}
                        disabled={quantity >= maxQuantity}
                        className="p-2 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        <Plus className="h-4 w-4 text-gray-600" />
                      </button>
                    </div>

                    <div className="flex-1 space-y-1.5">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Available:</span>
                        <span className="font-bold text-gray-900">
                          {maxQuantity} {currentVariant.unit}
                        </span>
                      </div>
                      {totalPieces > 1 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Total Pieces:</span>
                          <span className="font-bold text-blue-600">
                            {totalPieces.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Compact Price Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
                  <Package className="h-4 w-4 text-blue-600 mr-2" />
                  Order Summary
                </h4>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Unit Price:</span>
                    <span className="font-bold text-gray-900">
                      {formatCurrency(currentVariant.price)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Quantity:</span>
                    <span className="font-bold text-gray-900">
                      {quantity} {currentVariant.unit}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                    <span className="text-base font-bold text-gray-900">
                      Total Amount:
                    </span>
                    <span className="text-xl font-bold text-blue-600">
                      {formatCurrency(totalPrice)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Compact Footer - Matching Export Modal */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
          >
            Cancel
          </button>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock || quantity === 0 || isCompletelyOutOfStock}
            className={`px-5 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              isOutOfStock || isCompletelyOutOfStock
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "text-white bg-gradient-to-r from-blue-500 to-blue-600 border border-transparent hover:from-blue-600 hover:to-blue-700"
            }`}
          >
            {isCompletelyOutOfStock ? (
              <>
                <AlertTriangle className="h-4 w-4" />
                <span>Out of Stock</span>
              </>
            ) : isOutOfStock ? (
              <>
                <AlertTriangle className="h-4 w-4" />
                <span>Unavailable</span>
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4" />
                <span>Add to Cart • {formatCurrency(totalPrice)}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
