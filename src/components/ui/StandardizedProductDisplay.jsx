import React from 'react';
import { Pill, Shield, Building2 } from 'lucide-react';

// Inline currency formatting to avoid import issues
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

/**
 * Standardized Product Display Component
 * Implements the consistent design hierarchy across all product displays
 * 
 * Design Rule:
 * - PRIMARY: brand_name (prominent), generic_name, dosage_strength/dosage_form
 * - SECONDARY: price_per_piece, category_name  
 * - TERTIARY: manufacturer, drug_classification badge
 * 
 * Excluded from summary views: description, supplier_name, pharmacologic_category
 */
const StandardizedProductDisplay = ({ 
  product, 
  size = 'default', // 'compact', 'default', 'large'
  showPrice = true,
  showStock = false,
  showCategory = true,
  showManufacturer = true,
  showClassification = true,
  isReadOnly = false,
  customActions = null,
  className = ''
}) => {
  // Add safety check for product data
  if (!product) {
    return (
      <div className={`${className} p-3 bg-gray-50 border border-gray-200 rounded-lg`}>
        <p className="text-gray-500 text-sm">No product data available</p>
      </div>
    );
  }
  const getDrugClassificationBadge = (classification) => {
    switch (classification) {
      case 'Prescription (Rx)':
        return {
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          icon: Shield
        };
      case 'Over-the-Counter (OTC)':
        return {
          bgColor: 'bg-green-100', 
          textColor: 'text-green-800',
          icon: Shield
        };
      case 'Controlled Substance':
        return {
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800', 
          icon: Shield
        };
      default:
        return {
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          icon: Shield
        };
    }
  };

  const classificationBadge = product.drug_classification ? getDrugClassificationBadge(product.drug_classification) : null;
  const ClassificationIcon = classificationBadge?.icon;

  // Size-based styling
  const sizeClasses = {
    compact: {
      brandText: 'text-sm font-bold text-gray-900 leading-tight',
      genericText: 'text-xs font-medium text-gray-600',
      dosageText: 'text-xs font-bold',
      priceText: 'text-sm font-bold',
      categoryText: 'text-xs font-medium',
      manufacturerText: 'text-xs text-gray-500',
      spacing: 'space-y-1',
      padding: 'p-2'
    },
    default: {
      brandText: 'text-base font-bold text-gray-900 leading-tight',
      genericText: 'text-sm font-semibold text-gray-600', 
      dosageText: 'text-xs font-bold',
      priceText: 'text-lg font-bold',
      categoryText: 'text-xs font-medium',
      manufacturerText: 'text-xs text-gray-500',
      spacing: 'space-y-2',
      padding: 'p-3'
    },
    large: {
      brandText: 'text-lg font-bold text-gray-900 leading-tight',
      genericText: 'text-base font-semibold text-gray-600',
      dosageText: 'text-sm font-bold', 
      priceText: 'text-xl font-bold',
      categoryText: 'text-sm font-medium',
      manufacturerText: 'text-sm text-gray-500',
      spacing: 'space-y-3',
      padding: 'p-4'
    }
  };

  const styles = sizeClasses[size];

  return (
    <div className={`${styles.padding} ${styles.spacing} ${className}`}>
      {/* PRIMARY: Brand Name (Most Prominent) */}
      <div>
        <h3 className={`${styles.brandText} line-clamp-1`}>
          {product.brand_name || product.brand || 'Unknown Brand'}
        </h3>
      </div>

      {/* PRIMARY: Generic Name */}
      <div>
        <p className={`${styles.genericText} line-clamp-1`}>
          {product.generic_name || product.name || 'Unknown Generic'}
        </p>
      </div>

      {/* PRIMARY: Dosage Strength - Subtle and Small */}
      {product.dosage_strength && (
        <div>
          <span className="text-xs text-gray-500">
            {product.dosage_strength}
          </span>
        </div>
      )}

      {/* SECONDARY: Price (if enabled) */}
      {showPrice && product.price_per_piece && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-2">
          <div className="text-green-600 text-xs font-medium">Price per piece</div>
          <div className={`text-green-700 ${styles.priceText}`}>
            {formatCurrency(product.price_per_piece)}
          </div>
        </div>
      )}

      {/* SECONDARY: Stock (if enabled) */}
      {showStock && product.stock_in_pieces !== undefined && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
          <div className="text-blue-600 text-xs font-medium">Stock Available</div>
          <div className={`text-blue-700 ${styles.priceText}`}>
            {product.stock_in_pieces} pieces
          </div>
        </div>
      )}

      {/* SECONDARY: Category (if enabled) */}
      {showCategory && product.category && (
        <div>
          <span className={`inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded ${styles.categoryText} truncate`}>
            {product.category}
          </span>
        </div>
      )}

      {/* TERTIARY: Manufacturer (if enabled and available) */}
      {showManufacturer && product.manufacturer && (
        <div className="flex items-center space-x-1">
          <Building2 className="h-3 w-3 text-gray-500" />
          <p className={`${styles.manufacturerText} truncate`}>
            by {product.manufacturer}
          </p>
        </div>
      )}

      {/* TERTIARY: Dosage Form (if available) */}
      {product.dosage_form && (
        <div className="flex items-center space-x-1">
          <Pill className="h-3 w-3 text-purple-600" />
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            {product.dosage_form}
          </span>
        </div>
      )}

      {/* TERTIARY: Drug Classification Badge (if enabled and available) */}
      {showClassification && classificationBadge && (
        <div className="flex items-center space-x-1">
          <ClassificationIcon className="h-3 w-3" />
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${classificationBadge.bgColor} ${classificationBadge.textColor}`}>
            {product.drug_classification}
          </span>
        </div>
      )}

      {/* Custom Actions */}
      {customActions && (
        <div className="pt-2">
          {customActions}
        </div>
      )}
    </div>
  );
};

export default StandardizedProductDisplay;