import React from "react";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Package,
  AlertTriangle,
} from "lucide-react";
import { formatCurrency } from "../../../utils/formatting";
import { usePOSStore } from "../../../stores/posStore";

export default function ShoppingCartComponent({
  items = [],
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  className = "",
}) {
  // 🎯 Professional: Get real-time stock data
  const { getAvailableStock } = usePOSStore();
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const tax = subtotal * 0.12; // 12% VAT
  const total = subtotal + tax;

  const getItemSubtotal = (item) => {
    return item.totalPrice;
  };

  if (items.length === 0) {
    return (
      <div
        className={`bg-white rounded-lg border border-gray-200 ${className}`}
      >
        <div className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <ShoppingCart className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900">Shopping Cart</h3>
          </div>

          <div className="text-center py-8">
            <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Your cart is empty
            </p>
            <p className="text-gray-500">
              Add products to start a new transaction
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900">Shopping Cart</h3>
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
              {items.length} item{items.length !== 1 ? "s" : ""}
            </span>
          </div>

          {items.length > 0 && (
            <button
              onClick={onClearCart}
              className="text-sm text-red-600 hover:text-red-800 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Cart Items */}
      <div className="max-h-80 overflow-y-auto">
        <div className="divide-y divide-gray-200">
          {items.map((item) => (
            <div key={item.id} className="p-4">
              <div className="flex items-start space-x-3">
                {/* Product Icon */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg flex-shrink-0 shadow-sm">
                  <Package className="h-4 w-4 text-white" />
                </div>

                {/* Product Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {item.generic_name || item.name || 'Unknown Product'}
                  </h4>
                  <p className="text-xs text-gray-500 truncate">
                    {item.product.brand_name || item.product.brand || 'Unknown Brand'} • {item.product.category}
                  </p>
                  <div className="mt-1 flex items-center space-x-2">
                    <span className="text-sm text-gray-600">
                      {formatCurrency(item.pricePerUnit)} per {item.unit}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({item.quantityInPieces} pieces total)
                    </span>
                  </div>

                  {/* 🎯 Professional: Real-time stock indicator */}
                  {(() => {
                    const availableStock = getAvailableStock(item.productId);
                    const currentCartQuantity = items
                      .filter(
                        (cartItem) => cartItem.productId === item.productId
                      )
                      .reduce(
                        (total, cartItem) => total + cartItem.quantityInPieces,
                        0
                      );
                    const remainingAfterCart =
                      availableStock + currentCartQuantity; // Add back current cart to get original stock

                    return (
                      <div className="mt-1 flex items-center space-x-2">
                        {remainingAfterCart <= 20 && (
                          <div className="flex items-center space-x-1">
                            <AlertTriangle className="h-3 w-3 text-yellow-500" />
                            <span className="text-xs text-yellow-600 font-medium">
                              Low stock: {remainingAfterCart} pieces left
                            </span>
                          </div>
                        )}
                        {availableStock === 0 && (
                          <div className="flex items-center space-x-1">
                            <AlertTriangle className="h-3 w-3 text-red-500" />
                            <span className="text-xs text-red-600 font-medium">
                              No additional stock available
                            </span>
                          </div>
                        )}
                        {availableStock > 0 && remainingAfterCart > 20 && (
                          <span className="text-xs text-green-600">
                            ✓ {availableStock} more available
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                  title="Remove from cart"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Quantity Controls */}
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus className="h-4 w-4" />
                  </button>

                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900 min-w-[2rem] text-center">
                      {item.quantity}
                    </span>
                    <span className="text-xs text-gray-500">{item.unit}</span>
                  </div>

                  {/* 🎯 Professional: Stock-aware quantity increase */}
                  {(() => {
                    const availableStock = getAvailableStock(item.productId);
                    const canIncrease = availableStock > 0;

                    return (
                      <button
                        onClick={() =>
                          onUpdateQuantity(item.id, item.quantity + 1)
                        }
                        disabled={!canIncrease}
                        className={`p-1 transition-colors ${
                          canIncrease
                            ? "text-gray-400 hover:text-gray-600"
                            : "text-red-300 cursor-not-allowed opacity-50"
                        }`}
                        title={
                          canIncrease ? "Add more" : "No more stock available"
                        }
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    );
                  })()}
                </div>

                {/* Item Subtotal */}
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    {formatCurrency(getItemSubtotal(item))}
                  </div>
                  {item.quantity > 1 && (
                    <div className="text-xs text-gray-500">
                      {item.quantity} × {formatCurrency(item.pricePerUnit)}
                    </div>
                  )}
                </div>
              </div>

              {/* Stock info display */}
              {item.quantityInPieces > item.product.stock_in_pieces * 0.8 && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-xs text-yellow-800">
                    High quantity: You're ordering {item.quantityInPieces}{" "}
                    pieces (
                    {(
                      (item.quantityInPieces / item.product.stock_in_pieces) *
                      100
                    ).toFixed(1)}
                    % of stock)
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Cart Summary */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="space-y-2">
          {/* Subtotal */}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal:</span>
            <span className="text-gray-900">{formatCurrency(subtotal)}</span>
          </div>

          {/* Tax */}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">VAT (12%):</span>
            <span className="text-gray-900">{formatCurrency(tax)}</span>
          </div>

          {/* Total */}
          <div className="flex justify-between text-lg font-semibold border-t border-gray-200 pt-2">
            <span className="text-gray-900">Total:</span>
            <span className="text-gray-900">{formatCurrency(total)}</span>
          </div>

          {/* Item Count */}
          <div className="text-xs text-gray-500 text-center">
            {items.reduce((sum, item) => sum + item.quantity, 0)} total items
          </div>
        </div>
      </div>
    </div>
  );
}
