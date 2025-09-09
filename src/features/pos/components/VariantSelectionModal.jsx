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
        product: product.name,
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
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Select Product Unit
                </h2>
                <p className="text-sm text-gray-600">{product.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {/* 🚨 Professional: Out of Stock Indicator */}
          {isCompletelyOutOfStock && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center">
                <div className="bg-red-100 p-2 rounded-xl mr-3">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-800">
                    Product Unavailable
                  </h3>
                  <p className="text-red-600 text-sm mt-1">
                    All stock for {product.name} is currently in your cart or
                    out of stock. Available: {availableStockInPieces} pieces
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 🎯 Professional: Low Stock Warning */}
          {!isCompletelyOutOfStock && availableStockInPieces <= 20 && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="flex items-center">
                <div className="bg-yellow-100 p-2 rounded-xl mr-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-yellow-800">
                    Low Stock Alert
                  </h3>
                  <p className="text-yellow-600 text-sm mt-1">
                    Only {availableStockInPieces} pieces remaining for{" "}
                    {product.name}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Variant Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <div className="bg-blue-100 p-2 rounded-xl mr-3">
                <Info className="h-5 w-5 text-blue-600" />
              </div>
              Select Purchase Unit
              {hasVariants && (
                <span className="ml-2 text-sm text-gray-500">
                  ({Object.keys(variants).length} available)
                </span>
              )}
            </h3>

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
                      className={`relative p-4 border-2 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                        isSelected
                          ? "border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg scale-105"
                          : isAvailable
                          ? "border-gray-200 hover:border-blue-300 hover:shadow-md"
                          : "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full p-2 shadow-lg">
                          <div className="w-3 h-3 bg-white rounded-full"></div>
                        </div>
                      )}

                      <div className="text-center">
                        <div
                          className={`mx-auto mb-3 p-3 rounded-xl transition-all duration-300 ${
                            isSelected
                              ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          <IconComponent className="h-6 w-6 mx-auto" />
                        </div>

                        <h4
                          className={`font-bold text-base mb-2 ${
                            isSelected ? "text-blue-700" : "text-gray-900"
                          }`}
                        >
                          {variant.name}
                        </h4>

                        <p className="text-sm text-gray-600 mb-3 min-h-[2rem] flex items-center justify-center">
                          {variant.description}
                        </p>

                        <div className="space-y-2">
                          <p
                            className={`font-bold text-lg ${
                              isSelected ? "text-blue-700" : "text-gray-900"
                            }`}
                          >
                            {formatCurrency(variant.price)}
                          </p>

                          {/* 🎯 Professional: Real-time stock display */}
                          <div className="space-y-1">
                            <div
                              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center justify-center gap-1 ${
                                isAvailable
                                  ? variant.stock > 10
                                    ? "bg-green-100 text-green-700 border border-green-200"
                                    : "bg-yellow-100 text-yellow-700 border border-yellow-200"
                                  : "bg-red-100 text-red-700 border border-red-200"
                              }`}
                            >
                              {!isAvailable && (
                                <AlertTriangle className="h-3 w-3" />
                              )}
                              {isAvailable
                                ? `${variant.stock} available`
                                : "Out of stock"}
                            </div>

                            {/* Show remaining pieces for transparency */}
                            {variant.availableStock &&
                              variant.unit !== "piece" && (
                                <div className="text-xs text-gray-500">
                                  ({variant.availableStock} pieces remaining)
                                </div>
                              )}
                          </div>
                        </div>

                        {!isAvailable && (
                          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-95 rounded-xl">
                            <span className="text-red-600 font-bold text-sm bg-red-50 px-3 py-2 rounded-full border border-red-200">
                              Out of Stock
                            </span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })
              ) : (
                // 🚨 Professional: No variants available fallback
                <div className="col-span-full p-8 text-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl">
                  <div className="bg-gray-100 p-3 rounded-xl inline-block mb-3">
                    <AlertTriangle className="h-6 w-6 text-gray-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    No Purchase Options Available
                  </h3>
                  <p className="text-gray-600">
                    This product is currently out of stock or unavailable for
                    purchase.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Quantity Selection */}
          {!isOutOfStock && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <div className="bg-green-100 p-2 rounded-xl mr-3">
                  <ShoppingCart className="h-5 w-5 text-green-600" />
                </div>
                Select Quantity
              </h3>

              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4">
                <div className="flex items-center justify-center space-x-4 mb-4">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className="p-3 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <Minus className="h-5 w-5 text-gray-600" />
                  </button>

                  <div className="flex flex-col items-center space-y-2">
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => {
                        const newQuantity = parseInt(e.target.value) || 1;
                        if (newQuantity >= 1 && newQuantity <= maxQuantity) {
                          setQuantity(newQuantity);
                        }
                      }}
                      min="1"
                      max={maxQuantity}
                      className="w-24 text-center text-2xl font-bold text-gray-900 border-2 border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-md"
                    />
                    <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold border border-blue-200">
                      {currentVariant.unit}
                    </div>
                  </div>

                  <button
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= maxQuantity}
                    className="p-3 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <Plus className="h-5 w-5 text-gray-600" />
                  </button>
                </div>

                <div className="text-center space-y-2">
                  <div className="bg-white rounded-xl p-3 border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">
                      Available Stock
                    </p>
                    <p className="text-base font-bold text-gray-900">
                      {maxQuantity} {currentVariant.unit}
                    </p>
                  </div>
                  {totalPieces > 1 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-2">
                      <p className="text-sm font-semibold text-blue-800">
                        📊 Total: {totalPieces.toLocaleString()} pieces
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Price Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-4 border border-blue-200">
            <h4 className="text-base font-bold text-gray-900 mb-3 flex items-center">
              <div className="bg-blue-100 p-2 rounded-xl mr-3">
                <Package className="h-4 w-4 text-blue-600" />
              </div>
              Order Summary
            </h4>

            <div className="space-y-2">
              <div className="flex justify-between items-center py-1 border-b border-blue-200">
                <span className="text-gray-700 font-medium">Unit Price:</span>
                <span className="font-bold text-gray-900">
                  {formatCurrency(currentVariant.price)}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-blue-200">
                <span className="text-gray-700 font-medium">Quantity:</span>
                <span className="font-bold text-gray-900">
                  {quantity} {currentVariant.unit}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-lg font-bold text-gray-900">
                  Total Amount:
                </span>
                <span className="text-2xl font-bold text-blue-600">
                  {formatCurrency(totalPrice)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Footer with Add to Cart */}
        <div className="border-t border-gray-200 p-6 bg-gradient-to-r from-gray-50 to-gray-100 flex-shrink-0">
          <div className="flex space-x-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-white hover:border-gray-400 transition-all duration-200 font-medium text-base shadow-md hover:shadow-lg"
            >
              Cancel
            </button>

            <button
              onClick={handleAddToCart}
              disabled={
                isOutOfStock || quantity === 0 || isCompletelyOutOfStock
              }
              className={`flex-1 px-6 py-3 rounded-xl transition-all duration-200 font-medium text-base flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl ${
                isOutOfStock || isCompletelyOutOfStock
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800"
              }`}
            >
              {isCompletelyOutOfStock ? (
                <>
                  <AlertTriangle className="h-5 w-5" />
                  <span>Out of Stock</span>
                </>
              ) : isOutOfStock ? (
                <>
                  <AlertTriangle className="h-5 w-5" />
                  <span>Variant Unavailable</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="h-5 w-5" />
                  <span>Add to Cart - {formatCurrency(totalPrice)}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
