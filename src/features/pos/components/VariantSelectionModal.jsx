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

// Add CSS to remove number input arrows
const styles = `
  input[type="number"]::-webkit-outer-spin-button,
  input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  
  input[type="number"] {
    -moz-appearance: textfield;
  }
`;

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
    <>
      <style>{styles}</style>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[85vh] overflow-hidden flex flex-col">
          {/* Compact Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Select Purchase Unit
                </h3>
                <p className="text-xs text-gray-600">
                  Choose quantity and unit type
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Main Content - Order Summary Right, Product Info & Controls Left */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 h-full">
              {/* Left Panel - Product Info, Purchase Units, Quantity */}
              <div className="lg:col-span-2 p-4 space-y-3">
                {/* Product Information - Compact */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-3 rounded-lg border border-emerald-200">
                  <div className="flex items-start space-x-2">
                    <div className="p-1.5 bg-emerald-100 rounded-md flex-shrink-0">
                      <Info className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-emerald-900 mb-2 text-sm">
                        Product Information
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="font-semibold text-emerald-800">
                            Generic:
                          </span>
                          <div className="text-emerald-700 font-medium">
                            {product.generic_name || "Unknown"}
                          </div>
                        </div>
                        {product.brand_name && (
                          <div>
                            <span className="font-semibold text-emerald-800">
                              Brand:
                            </span>
                            <div className="text-emerald-700 font-medium">
                              {product.brand_name}
                            </div>
                          </div>
                        )}
                        {product.dosage_strength && (
                          <div>
                            <span className="font-semibold text-emerald-800">
                              Dosage:
                            </span>
                            <div className="text-emerald-700 font-medium">
                              {product.dosage_strength}{" "}
                              {product.dosage_form || ""}
                            </div>
                          </div>
                        )}
                        <div>
                          <span className="font-semibold text-emerald-800">
                            Stock:
                          </span>
                          <div className="text-emerald-700 font-medium">
                            {availableStockInPieces.toLocaleString()} pieces
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Purchase Units - Modern, Small & Compact */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <Package className="h-4 w-4 text-blue-600 mr-1.5" />
                    Purchase Units
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {hasVariants ? (
                      Object.entries(variants).map(([key, variant]) => {
                        const IconComponent = variant.icon;
                        const isSelected = selectedVariant === key;
                        const isAvailable = variant.stock > 0;

                        return (
                          <button
                            key={key}
                            onClick={() =>
                              isAvailable && setSelectedVariant(key)
                            }
                            disabled={!isAvailable}
                            className={`relative p-3 border-2 rounded-lg transition-all duration-200 ${
                              isSelected
                                ? "border-blue-500 bg-blue-50 shadow-sm"
                                : isAvailable
                                ? "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                                : "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                            }`}
                          >
                            {isSelected && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                              </div>
                            )}

                            <div className="text-center space-y-2">
                              <div
                                className={`mx-auto w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
                                  isSelected
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                <IconComponent className="h-5 w-5" />
                              </div>

                              <div>
                                <h4
                                  className={`font-bold text-sm ${
                                    isSelected
                                      ? "text-blue-700"
                                      : "text-gray-900"
                                  }`}
                                >
                                  {variant.name}
                                </h4>
                                <p className="text-xs text-gray-500 leading-tight">
                                  {variant.description}
                                </p>
                              </div>

                              <div className="space-y-1">
                                <p
                                  className={`font-bold text-sm ${
                                    isSelected
                                      ? "text-blue-700"
                                      : "text-gray-900"
                                  }`}
                                >
                                  {formatCurrency(variant.price)}
                                </p>
                                <div
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                    isAvailable
                                      ? variant.stock > 10
                                        ? "bg-green-100 text-green-700"
                                        : "bg-yellow-100 text-yellow-700"
                                      : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {isAvailable ? variant.stock : "0"}
                                </div>
                              </div>
                            </div>

                            {!isAvailable && (
                              <div className="absolute inset-0 flex items-center justify-center bg-white/95 rounded-lg">
                                <span className="text-red-600 font-bold text-xs bg-red-50 px-2 py-1 rounded-full">
                                  Out
                                </span>
                              </div>
                            )}
                          </button>
                        );
                      })
                    ) : (
                      <div className="col-span-full p-3 text-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-gray-600 mx-auto mb-1" />
                        <h3 className="text-xs font-semibold text-gray-800">
                          No Options Available
                        </h3>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quantity Selection - Type Only */}
                {!isOutOfStock && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <Minus className="h-4 w-4 text-blue-600 mr-1.5" />
                      Select Quantity
                    </label>
                    <div className="flex flex-col items-center space-y-2">
                      <div className="flex flex-col items-center">
                        <input
                          type="number"
                          value={quantity}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "") {
                              setQuantity("");
                              return;
                            }
                            const newQuantity = parseInt(value);
                            if (
                              !isNaN(newQuantity) &&
                              newQuantity >= 1 &&
                              newQuantity <= maxQuantity
                            ) {
                              setQuantity(newQuantity);
                            }
                          }}
                          onBlur={(e) => {
                            // If field is empty when user leaves, set to 1
                            if (
                              e.target.value === "" ||
                              parseInt(e.target.value) < 1
                            ) {
                              setQuantity(1);
                            }
                          }}
                          onFocus={(e) => e.target.select()}
                          min="1"
                          max={maxQuantity}
                          className="w-24 text-center text-lg font-bold text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                          style={{
                            MozAppearance: "textfield",
                          }}
                          onWheel={(e) => e.preventDefault()}
                        />
                        <span className="mt-1 text-xs font-medium text-gray-500">
                          {currentVariant?.unit || "unit"}
                        </span>
                      </div>

                      <div className="text-center text-xs text-gray-600">
                        Max: {maxQuantity} {currentVariant?.unit || "units"}
                      </div>
                    </div>
                  </div>
                )}

                {/* Alerts - Compact */}
                {isCompletelyOutOfStock && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-bold text-red-800">
                          Out of Stock
                        </div>
                        <div className="text-xs text-red-600">
                          No stock available
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {!isCompletelyOutOfStock && availableStockInPieces <= 20 && (
                  <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-bold text-yellow-800">
                          Low Stock
                        </div>
                        <div className="text-xs text-yellow-600">
                          Only {availableStockInPieces} left
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Panel - Modern Order Summary */}
              <div className="lg:col-span-1 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-l border-gray-200 flex flex-col">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="p-1.5 bg-blue-100 rounded-lg">
                    <Package className="h-4 w-4 text-blue-600" />
                  </div>
                  <h4 className="text-lg font-bold text-blue-900">
                    Order Summary
                  </h4>
                </div>

                {!isOutOfStock && (
                  <div className="space-y-3 flex-1">
                    {/* Selected Product Display - Modern */}
                    <div className="bg-white rounded-lg p-3 border border-blue-200 shadow-sm">
                      <div className="space-y-3">
                        <div className="text-center">
                          <div
                            className={`mx-auto w-12 h-12 flex items-center justify-center rounded-lg mb-2 ${
                              selectedVariant === "piece"
                                ? "bg-blue-600 text-white"
                                : selectedVariant === "sheet"
                                ? "bg-purple-600 text-white"
                                : "bg-orange-600 text-white"
                            }`}
                          >
                            {currentVariant && (
                              <currentVariant.icon className="h-6 w-6" />
                            )}
                          </div>
                          <h5 className="font-bold text-gray-900 text-base">
                            {currentVariant?.name || "Select Unit"}
                          </h5>
                          <p className="text-xs text-gray-600">
                            {currentVariant?.description ||
                              "Choose purchase unit"}
                          </p>
                        </div>

                        <div className="space-y-1.5 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Unit Price:</span>
                            <span className="font-bold text-gray-900">
                              {currentVariant
                                ? formatCurrency(currentVariant.price)
                                : "—"}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Quantity:</span>
                            <span className="font-bold text-gray-900">
                              {quantity} {currentVariant?.unit || "unit"}
                            </span>
                          </div>
                          {totalPieces > 1 && (
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">
                                Total Pieces:
                              </span>
                              <span className="font-bold text-blue-600">
                                {totalPieces.toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="pt-2 border-t border-gray-200">
                          <div className="flex justify-between items-center">
                            <span className="text-base font-bold text-gray-900">
                              Total:
                            </span>
                            <span className="text-xl font-bold text-blue-600">
                              {formatCurrency(totalPrice)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stock Information - Compact */}
                    <div className="bg-white rounded-lg p-3 border border-blue-200">
                      <h6 className="font-semibold text-gray-900 mb-2 text-sm">
                        Stock Info
                      </h6>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Available:</span>
                          <span
                            className={`font-bold ${
                              availableStockInPieces > 20
                                ? "text-green-600"
                                : availableStockInPieces > 0
                                ? "text-yellow-600"
                                : "text-red-600"
                            }`}
                          >
                            {availableStockInPieces.toLocaleString()} pcs
                          </span>
                        </div>
                        {currentVariant && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">
                              Max {currentVariant.unit}:
                            </span>
                            <span className="font-bold text-gray-900">
                              {maxQuantity}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {isOutOfStock && (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center p-4">
                      <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                      <h5 className="text-base font-bold text-red-800 mb-1">
                        Unavailable
                      </h5>
                      <p className="text-xs text-red-600">Out of stock</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Compact Footer */}
          <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all"
            >
              Cancel
            </button>

            <button
              onClick={handleAddToCart}
              disabled={
                isOutOfStock || quantity === 0 || isCompletelyOutOfStock
              }
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center space-x-2 ${
                isOutOfStock || isCompletelyOutOfStock
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
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
    </>
  );
}
