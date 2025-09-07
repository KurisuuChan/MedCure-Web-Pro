import React from "react";
import {
  Package,
  AlertTriangle,
  Calendar,
  Edit,
  Eye,
  Trash2,
  Archive,
} from "lucide-react";
import { formatCurrency } from "../../../utils/formatting";
import { formatDate } from "../../../utils/dateTime";
import {
  getStockStatusBadge,
  getExpiryStatusBadge,
} from "../../../utils/productUtils";

export default function ProductCard({
  product,
  onEdit,
  onView,
  onDelete,
  showActions = true,
}) {
  const stockBadge = getStockStatusBadge(product);
  const expiryBadge = getExpiryStatusBadge(product);

  const getExpiryText = (expiryDate) => {
    if (!expiryDate) return "No expiry";

    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) return "Expired";
    if (daysUntilExpiry === 0) return "Expires today";
    if (daysUntilExpiry <= 30) return `Expires in ${daysUntilExpiry} days`;
    return formatDate(expiryDate);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              {product.is_archived && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  <Archive className="h-3 w-3 mr-1" />
                  Archived
                </span>
              )}
            </div>
            <h3 className="font-semibold text-gray-900 text-lg leading-tight truncate">
              {product.name}
            </h3>
            <div className="mt-2 flex items-center space-x-3">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {product.brand}
              </span>
              <span className="text-sm text-gray-600">{product.category}</span>
            </div>
          </div>

          {showActions && (
            <div className="flex items-center space-x-1 ml-3">
              <button
                onClick={() => onView(product)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="View Details"
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                onClick={() => onEdit(product)}
                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="Edit Product"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(product)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete Product"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Price */}
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(product.price_per_piece)}
          </div>
          <div className="text-sm text-gray-500">per piece</div>
        </div>

        {/* Stock and Expiry */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                Stock
              </span>
              <Package className="h-3 w-3 text-gray-400" />
            </div>
            <div
              className={`text-center py-2 px-3 rounded-lg text-sm font-semibold ${stockBadge.bgColor} ${stockBadge.textColor} border ${stockBadge.borderColor}`}
            >
              {product.stock_in_pieces} pcs
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                Expiry
              </span>
              <Calendar className="h-3 w-3 text-gray-400" />
            </div>
            <div
              className={`text-center py-2 px-3 rounded-lg text-xs font-semibold ${expiryBadge.bgColor} ${expiryBadge.textColor} border ${expiryBadge.borderColor}`}
            >
              {getExpiryText(product.expiry_date)}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Category:</span>
            <span className="text-gray-900 font-medium">
              {product.category}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Brand:</span>
            <span className="text-gray-900 font-medium">{product.brand}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Product ID:</span>
            <span className="text-gray-900 font-mono text-xs">
              #{product.id.slice(-8)}
            </span>
          </div>
        </div>

        {/* Low Stock Alert */}
        {product.stock_in_pieces <= product.reorder_level && (
          <div className="flex items-center space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-amber-800">
                Low Stock Alert
              </div>
              <div className="text-xs text-amber-700">
                Reorder level: {product.reorder_level} pieces
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
