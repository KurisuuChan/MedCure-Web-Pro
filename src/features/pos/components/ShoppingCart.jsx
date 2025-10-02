import React from "react";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Package,
  X,
} from "lucide-react";
import { formatCurrency } from "../../../utils/formatting";

export default function ShoppingCartComponent({
  items = [],
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  className = "",
}) {
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const tax = subtotal * 0.12; // 12% VAT
  const total = subtotal + tax;

  if (items.length === 0) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
        <div className="p-4">
          <div className="flex items-center space-x-2 mb-3">
            <ShoppingCart className="h-4 w-4 text-gray-600" />
            <h3 className="text-sm font-medium text-gray-900">Shopping Cart</h3>
          </div>
          <div className="text-center py-6">
            <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-gray-500">Cart is empty</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Compact Header */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="h-4 w-4 text-gray-600" />
            <h3 className="text-sm font-medium text-gray-900">Shopping Cart</h3>
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-1.5 py-0.5 rounded">
              {items.length}
            </span>
          </div>
          <button
            onClick={onClearCart}
            className="text-xs text-red-600 hover:text-red-800"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Compact Cart Items - No Scroll */}
      <div className="p-3 space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center space-x-2 bg-gray-50 rounded-lg p-2">
            {/* Product Icon - Smaller */}
            <div className="bg-blue-500 p-1 rounded flex-shrink-0">
              <Package className="h-3 w-3 text-white" />
            </div>

            {/* Product Info - Compact */}
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-medium text-gray-900 truncate">
                {item.name}
              </h4>
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <span>{formatCurrency(item.pricePerUnit)}</span>
                <span>×</span>
                <span>{item.quantity}</span>
              </div>
            </div>

            {/* Quantity Controls - Compact */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                disabled={item.quantity <= 1}
                className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <Minus className="h-3 w-3" />
              </button>
              
              <span className="text-xs font-medium w-6 text-center">
                {item.quantity}
              </span>
              
              <button
                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>

            {/* Item Total */}
            <div className="text-xs font-medium text-gray-900 min-w-[3rem] text-right">
              {formatCurrency(item.totalPrice)}
            </div>

            {/* Remove Button - Compact */}
            <button
              onClick={() => onRemoveItem(item.id)}
              className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-600"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Compact Summary */}
      <div className="border-t border-gray-200 p-3 space-y-1">
        <div className="flex justify-between text-xs text-gray-600">
          <span>Subtotal:</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-xs text-gray-600">
          <span>VAT (12%):</span>
          <span>{formatCurrency(tax)}</span>
        </div>
        <div className="flex justify-between text-sm font-bold text-gray-900 pt-1 border-t border-gray-200">
          <span>Total:</span>
          <span>{formatCurrency(total)}</span>
        </div>
        <div className="text-center text-xs text-gray-500 pt-1">
          {items.reduce((sum, item) => sum + item.quantityInPieces, 0)} total items
        </div>
      </div>
    </div>
  );
}