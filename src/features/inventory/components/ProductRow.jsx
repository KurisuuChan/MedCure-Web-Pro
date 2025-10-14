import React from "react";
import { Package, Eye, Edit, Archive } from "lucide-react";
import { getStockStatus, getExpiryStatus } from "../../../utils/productUtils";
import { formatCurrency } from "../../../utils/formatting";
import { formatDate } from "../../../utils/dateTime";
import { getStockBreakdown } from "../../../utils/unitConversion";

/**
 * Product Row Component for Table View
 * Displays a single product row in the inventory table
 *
 * @param {Object} product - Product data object
 * @param {Function} onView - Handler for view details action
 * @param {Function} onEdit - Handler for edit product action
 * @param {Function} onDelete - Handler for archive/delete product action
 * @param {Object} style - Optional inline styles (for animation delays)
 */
function ProductRow({ product, onView, onEdit, onDelete, style }) {
  const stockStatus = getStockStatus(product);
  const expiryStatus = getExpiryStatus(product);
  const stockBreakdown = getStockBreakdown(product.stock_in_pieces, product);

  const getStatusColor = (status) => {
    switch (status) {
      case "critical_stock":
      case "expired":
        return "text-red-600 bg-red-50";
      case "low_stock":
      case "expiring_soon":
        return "text-yellow-600 bg-yellow-50";
      case "expiring_warning":
        return "text-orange-600 bg-orange-50";
      default:
        return "text-green-600 bg-green-50";
    }
  };

  // Get classification colors
  const getClassificationStyle = (classification) => {
    const cleanClassification = classification
      ?.replace("(Rx)", "")
      .replace("(OTC)", "")
      .trim();

    switch (classification) {
      case "Prescription (Rx)":
        return {
          bgColor: "bg-red-100",
          textColor: "text-red-800",
          label: "Prescription",
        };
      case "Over-the-Counter (OTC)":
        return {
          bgColor: "bg-green-100",
          textColor: "text-green-800",
          label: "Over-the-Counter",
        };
      case "Controlled Substance":
        return {
          bgColor: "bg-purple-100",
          textColor: "text-purple-800",
          label: "Controlled Substance",
        };
      default:
        return {
          bgColor: "bg-gray-100",
          textColor: "text-gray-800",
          label: cleanClassification || "Not specified",
        };
    }
  };

  const classificationStyle = getClassificationStyle(
    product.drug_classification
  );

  return (
    <tr
      className="hover:bg-gray-50 transition-colors duration-150 animate-slide-up border-b border-gray-100"
      style={style}
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <Package className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            {/* PRIMARY: Brand Name (largest, most prominent) */}
            <div className="text-sm font-bold text-gray-900 truncate">
              {product.brand_name || product.brand || "Unknown Brand"}
            </div>
            {/* PRIMARY: Generic Name (below brand name) */}
            <div className="text-sm font-medium text-gray-600 truncate">
              {product.generic_name || product.name || "Unknown Generic"}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="inline-flex px-2.5 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full">
          {product.category}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">
          {product.dosage_strength ? (
            <span>{product.dosage_strength}</span>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">
          {product.dosage_form ? (
            <span>{product.dosage_form}</span>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm">
          {product.drug_classification ? (
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${classificationStyle.bgColor} ${classificationStyle.textColor}`}
            >
              {classificationStyle.label}
            </span>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm">
          <span
            className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusColor(
              stockStatus
            )}`}
          >
            {product.stock_in_pieces} pcs
          </span>
          {(stockBreakdown.boxes > 0 ||
            stockBreakdown.sheets > 0 ||
            stockBreakdown.pieces > 0) && (
            <div className="text-xs text-gray-500 mt-1 leading-tight">
              {stockBreakdown.boxes > 0 &&
                `${stockBreakdown.boxes} box${
                  stockBreakdown.boxes > 1 ? "es" : ""
                } `}
              {stockBreakdown.sheets > 0 &&
                `${stockBreakdown.sheets} sheet${
                  stockBreakdown.sheets > 1 ? "s" : ""
                } `}
              {stockBreakdown.pieces > 0 &&
                `${stockBreakdown.pieces} pc${
                  stockBreakdown.pieces > 1 ? "s" : ""
                }`}
            </div>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-semibold text-gray-900">
          {formatCurrency(product.price_per_piece)}
          <span className="text-xs font-normal text-gray-500">/pc</span>
        </div>
        <div className="text-xs text-gray-500 mt-1 leading-tight">
          Value:{" "}
          {formatCurrency(product.stock_in_pieces * product.price_per_piece)}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900 mb-1">
          {formatDate(product.expiry_date)}
        </div>
        <span
          className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusColor(
            expiryStatus
          )}`}
        >
          {expiryStatus.replace("_", " ")}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-1">
          <button
            onClick={onView}
            className="group flex items-center justify-center p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg hover:scale-110 transition-all duration-200"
            title="View Details"
          >
            <Eye className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
          </button>
          <button
            onClick={onEdit}
            className="group flex items-center justify-center p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg hover:scale-110 transition-all duration-200"
            title="Edit Product"
          >
            <Edit className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
          </button>
          <button
            onClick={onDelete}
            className="group flex items-center justify-center p-2 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-lg hover:scale-110 transition-all duration-200"
            title="Archive Product"
          >
            <Archive className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default ProductRow;
