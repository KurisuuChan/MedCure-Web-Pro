import React from "react";
import {
  Package,
  AlertTriangle,
  Calendar,
  Edit,
  Eye,
  Trash2,
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
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
      {/* Header with Professional Medical Design */}
      <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 p-6">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-black/5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: "20px 20px",
            }}
          ></div>
        </div>

        <div className="relative flex items-start justify-between">
          <div className="flex items-center space-x-4">
            {/* Professional Medical Icon */}
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl border border-white/30">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg leading-tight">
                {product.name}
              </h3>
              <p className="text-blue-100 font-medium">
                {product.brand} • {product.category}
              </p>
            </div>
          </div>

          {showActions && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onView(product)}
                className="p-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30 text-white hover:bg-white/30 transition-all duration-200"
                title="View Details"
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                onClick={() => onEdit(product)}
                className="p-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30 text-white hover:bg-white/30 transition-all duration-200"
                title="Edit Product"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(product)}
                className="p-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30 text-white hover:bg-red-500/50 transition-all duration-200"
                title="Delete Product"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content with Professional Medical Layout */}
      <div className="p-6 space-y-4">
        {/* Price - Featured prominently */}
        <div className="text-center py-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border">
          <div className="text-sm text-gray-500 uppercase tracking-wide font-medium mb-1">
            Price per piece
          </div>
          <div className="text-3xl font-bold text-blue-600">
            {formatCurrency(product.price_per_piece)}
          </div>
        </div>

        {/* Professional Info Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Stock Status */}
          <div className="bg-gray-50 p-4 rounded-xl">
            <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2">
              Stock Level
            </div>
            <div className="flex items-center space-x-2">
              <span
                className={`px-3 py-1 text-sm font-bold rounded-full ${stockBadge.bgColor} ${stockBadge.textColor} ${stockBadge.borderColor} border-2`}
              >
                {product.stock_in_pieces}
              </span>
              <span className="text-xs text-gray-500">pieces</span>
            </div>
          </div>

          {/* Expiry Status */}
          <div className="bg-gray-50 p-4 rounded-xl">
            <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2 flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              Expiry Date
            </div>
            <span
              className={`px-3 py-1 text-sm font-bold rounded-full ${expiryBadge.bgColor} ${expiryBadge.textColor} ${expiryBadge.borderColor} border-2 inline-block`}
            >
              {getExpiryText(product.expiry_date)}
            </span>
          </div>
        </div>

        {/* Professional Details */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-600">Category</span>
            <span className="text-sm font-semibold text-gray-900 bg-blue-50 px-3 py-1 rounded-full">
              {product.category}
            </span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-600">
              Manufacturer
            </span>
            <span className="text-sm font-semibold text-gray-900">
              {product.brand}
            </span>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-gray-600">SKU</span>
            <span className="text-sm font-mono font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded">
              {product.id}
            </span>
          </div>
        </div>

        {/* Critical Alerts */}
        {product.stock_in_pieces <= product.reorder_level && (
          <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-400 rounded-lg">
            <div className="bg-amber-100 p-2 rounded-full">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <div className="font-semibold text-amber-800">
                Low Stock Alert
              </div>
              <div className="text-sm text-amber-700">
                Reorder level: {product.reorder_level} pieces
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
