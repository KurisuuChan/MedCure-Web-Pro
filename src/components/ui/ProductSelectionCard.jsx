import React from 'react';
import { Package, Plus, Tag, Box } from 'lucide-react';

const ProductSelectionCard = ({ product, onAddStock }) => {
  const handleAddClick = () => {
    onAddStock(product);
  };

  const getStockStatusColor = (stock) => {
    if (stock === 0) return 'text-red-600 bg-red-50';
    if (stock < 10) return 'text-orange-600 bg-orange-50';
    if (stock < 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getStockStatusText = (stock) => {
    if (stock === 0) return 'Out of Stock';
    if (stock < 10) return 'Low Stock';
    if (stock < 50) return 'Medium Stock';
    return 'In Stock';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 overflow-hidden group h-full flex flex-col">
      {/* Card Header - Fixed Height */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Brand Name & Icon - Fixed Height */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-blue-100 p-2.5 rounded-lg group-hover:bg-blue-200 transition-colors flex-shrink-0">
            <Package className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1 truncate">
              {product.brand_name || product.brand || 'Unknown Brand'}
            </h3>
            <p className="text-sm text-gray-600 font-medium leading-tight truncate">
              {product.generic_name || product.name || 'Unknown Generic'}
            </p>
            {/* Fixed height for dosage strength */}
            <div className="h-4 mt-1">
              {product.dosage_strength && (
                <p className="text-xs text-gray-500 truncate">
                  {product.dosage_strength}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Product Details - Standardized Layout */}
        <div className="space-y-3 flex-1">
          {/* Category - Fixed Height */}
          <div className="flex items-center space-x-2 h-5">
            <Tag className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-600 truncate">
              {product.category || 'Uncategorized'}
            </span>
          </div>

          {/* Stock Information - Fixed Height */}
          <div className="flex items-center justify-between h-5">
            <div className="flex items-center space-x-2">
              <Box className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-600">Current Stock:</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-gray-900">
                {(product.stock_in_pieces || 0).toLocaleString()}
              </span>
              <span className="text-xs text-gray-500">pieces</span>
            </div>
          </div>
        </div>

        {/* Stock Status Badge - Fixed Position */}
        <div className="flex justify-center mt-4">
          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${getStockStatusColor(product.stock_in_pieces || 0)}`}>
            {getStockStatusText(product.stock_in_pieces || 0)}
          </span>
        </div>
      </div>

      {/* Card Footer - Add Stock Button - Fixed Height */}
      <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
        <button
          onClick={handleAddClick}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 shadow-sm hover:shadow-md"
        >
          <Plus className="h-4 w-4" />
          <span>Add Stock</span>
        </button>
      </div>
    </div>
  );
};

export default ProductSelectionCard;