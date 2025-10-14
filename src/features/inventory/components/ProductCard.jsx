import React from "react";
import {
  Package,
  AlertTriangle,
  Calendar,
  Edit,
  Eye,
  Trash2,
  Archive,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Pill,
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
  // 🔍 DEBUG: Log product stock data
  if (import.meta.env.DEV) {
    console.log(`🃏 ProductCard for "${product.generic_name}":`, {
      stock_in_pieces: product.stock_in_pieces,
      stock_quantity: product.stock_quantity,
      reorder_level: product.reorder_level,
    });
  }

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

  const getDrugClassificationBadge = (classification) => {
    switch (classification) {
      case "Prescription (Rx)":
        return {
          icon: ShieldAlert,
          bgColor: "bg-red-100",
          textColor: "text-red-800",
          borderColor: "border-red-200",
          label: "Prescription",
        };
      case "Over-the-Counter (OTC)":
        return {
          icon: ShieldCheck,
          bgColor: "bg-green-100",
          textColor: "text-green-800",
          borderColor: "border-green-200",
          label: "Over-the-Counter",
        };
      case "Controlled Substance":
        return {
          icon: Shield,
          bgColor: "bg-purple-100",
          textColor: "text-purple-800",
          borderColor: "border-purple-200",
          label: "Controlled Substance",
        };
      default:
        return {
          icon: Pill,
          bgColor: "bg-gray-100",
          textColor: "text-gray-800",
          borderColor: "border-gray-200",
          label: "N/A",
        };
    }
  };

  const classificationBadge = getDrugClassificationBadge(
    product.drug_classification
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all duration-200 overflow-hidden">
      {/* Header with Status Badge */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between gap-3 mb-3">
          {/* Status Badge */}
          <div className="flex items-center gap-2 flex-wrap flex-1">
            {product.is_archived && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                <Archive className="h-3 w-3 mr-1" />
                Archived
              </span>
            )}
            {/* Drug Classification Badge */}
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${classificationBadge.bgColor} ${classificationBadge.textColor} ${classificationBadge.borderColor}`}
            >
              <classificationBadge.icon className="h-3 w-3 mr-1.5" />
              {classificationBadge.label}
            </span>
          </div>

          {showActions && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => onView(product)}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md hover:scale-110 transition-all duration-200"
                title="View Details"
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                onClick={() => onEdit(product)}
                className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md hover:scale-110 transition-all duration-200"
                title="Edit Product"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(product)}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md hover:scale-110 transition-all duration-200"
                title="Delete Product"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Product Name */}
        <h3 className="font-bold text-gray-900 text-base leading-tight mb-1 line-clamp-1">
          {product.brand_name || product.brand || "Unknown Brand"}
        </h3>
        <p className="text-sm text-gray-600 font-medium mb-2 leading-snug line-clamp-1">
          {product.generic_name || product.name || "Unknown Generic"}
        </p>

        {/* Dosage Strength */}
        {product.dosage_strength && (
          <p className="text-xs text-gray-500 mb-2 font-medium">
            {product.dosage_strength}
          </p>
        )}

        {/* Dosage Form Badge */}
        {product.dosage_form && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
            <Pill className="h-3 w-3 mr-1.5" />
            {product.dosage_form}
          </span>
        )}

        {/* Category */}
        <div className="mt-2.5 text-xs text-gray-500">
          Category:{" "}
          <span className="font-semibold text-gray-700">
            {product.category}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {/* Price */}
        <div className="text-center mb-4 py-2.5">
          <div className="text-2xl font-semibold text-gray-900 tracking-tight leading-none">
            {formatCurrency(product.price_per_piece)}
          </div>
          <div className="text-xs text-gray-500 mt-1 font-medium">
            per piece
          </div>
        </div>

        {/* Stock and Expiry Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Stock */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-500 uppercase font-semibold tracking-wide">
                Stock
              </span>
              <Package className="h-3.5 w-3.5 text-gray-400" />
            </div>
            <div
              className={`text-center py-2.5 px-3 rounded-md text-sm font-semibold ${stockBadge.bgColor} ${stockBadge.textColor} border ${stockBadge.borderColor}`}
            >
              {product.stock_in_pieces} pcs
            </div>
          </div>

          {/* Expiry */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-500 uppercase font-semibold tracking-wide">
                Expiry
              </span>
              <Calendar className="h-3.5 w-3.5 text-gray-400" />
            </div>
            <div
              className={`text-center py-2.5 px-3 rounded-md text-xs font-semibold leading-tight ${expiryBadge.bgColor} ${expiryBadge.textColor} border ${expiryBadge.borderColor}`}
            >
              {getExpiryText(product.expiry_date)}
            </div>
          </div>
        </div>

        {/* Product ID */}
        <div className="flex justify-between items-center text-xs pt-3 border-t border-gray-100">
          <span className="font-medium text-gray-500">Product ID:</span>
          <span className="font-mono font-semibold text-gray-700">
            #{product.id.slice(-8)}
          </span>
        </div>

        {/* Low Stock Alert */}
        {product.stock_in_pieces <= product.reorder_level && (
          <div className="flex items-start gap-2 p-3 mt-3 bg-amber-50 border border-amber-200 rounded-md hover:shadow-sm transition-shadow duration-200">
            <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-amber-900 leading-tight">
                Low Stock Alert
              </div>
              <div className="text-xs text-amber-700 mt-1 leading-tight">
                Reorder level: {product.reorder_level} pieces
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
