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
  const tax = 0; // VAT EXEMPT for pharmacy products
  const total = subtotal; // No VAT added

  const getItemSubtotal = (item) => {
    return item.totalPrice;
  };

  if (items.length === 0) {
    return (
      <div
        className={`bg-white rounded-lg border border-gray-200 ${className}`}
      >
        <div className="p-6">
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
    <div className={`bg-white rounded-lg border border-gray-200 h-full flex flex-col ${className}`}>
      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-gray-200">
          {items.map((item) => (
            <div key={item.id} className="p-3">
              <div className="flex items-center justify-between">
                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {item.brand_name || item.product?.brand_name || 'Generic'} - {item.generic_name || item.product?.generic_name || 'Unknown Medicine'}
                  </h4>
                  <p className="text-xs text-gray-500 truncate">
                    {item.dosage_strength || item.product?.dosage_strength || ''} {item.dosage_form || item.product?.dosage_form || ''}
                  </p>
                  <div className="text-xs text-gray-600 mt-1">
                    {formatCurrency(item.pricePerUnit)} × {item.quantity} = {formatCurrency(getItemSubtotal(item))}
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center space-x-2 ml-3">
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus className="h-3 w-3" />
                  </button>

                  <span className="text-sm font-medium text-gray-900 min-w-[2rem] text-center">
                    {item.quantity}
                  </span>

                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    disabled={getAvailableStock(item.productId) <= 0}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-3 w-3" />
                  </button>

                  {/* Remove Button */}
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors ml-2"
                    title="Remove from cart"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
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

          {/* VAT Status */}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">VAT Status:</span>
            <span className="text-green-600">EXEMPT</span>
          </div>

          {/* Total */}
          <div className="flex justify-between text-lg font-semibold border-t border-gray-200 pt-2">
            <span className="text-gray-900">Total:</span>
            <span className="text-green-600">{formatCurrency(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
