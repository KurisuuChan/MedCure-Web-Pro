import React, { useState } from 'react';
import { X, Package, Calendar, Hash, AlertCircle } from 'lucide-react';

// Simple fallback AddStockModal without external dependencies
const AddStockModal = ({ isOpen, onClose, product, onSuccess }) => {
  const [formData, setFormData] = useState({
    quantity: '',
    batchNumber: '',
    expiryDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        quantity: '',
        batchNumber: '',
        expiryDate: ''
      });
      setError('');
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Import ProductService dynamically to avoid circular dependency issues
      const { ProductService } = await import('../../../services/domains/inventory/productService');
      
      const batchData = {
        productId: product.id,
        quantity: parseInt(formData.quantity),
        batchNumber: formData.batchNumber || null,
        expiryDate: formData.expiryDate || null
      };

      console.log('🔄 Adding product batch:', batchData);
      
      const result = await ProductService.addProductBatch(batchData);
      
      if (result && result.success) {
        console.log('✅ Batch added successfully:', result);
        onSuccess && onSuccess();
        onClose();
      } else {
        throw new Error(result?.error || 'Failed to add batch');
      }
    } catch (error) {
      console.error('❌ Error adding batch:', error);
      
      // Check if it's a database function issue
      if (error.message?.includes('function') || error.message?.includes('does not exist')) {
        setError('Batch tracking is not fully set up yet. Please run the SQL setup first.');
      } else {
        setError(error.message || 'Failed to add stock. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            Add Stock
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {product && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900">{product.name}</h3>
              <p className="text-sm text-gray-600">
                Current Stock: <span className="font-semibold">{product.stock_in_pieces || 0}</span> pieces
              </p>
              {product.reorder_level && (
                <p className="text-sm text-gray-600">
                  Reorder Level: <span className="font-semibold">{product.reorder_level}</span> pieces
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-800 text-sm font-medium">Error</p>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Quantity Input */}
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                Quantity to Add *
              </label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  placeholder="Enter quantity"
                  min="1"
                  required
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Batch Number Input */}
            <div>
              <label htmlFor="batchNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Batch Number <span className="text-gray-500">(Optional)</span>
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  id="batchNumber"
                  name="batchNumber"
                  value={formData.batchNumber}
                  onChange={handleInputChange}
                  placeholder="e.g., BT2024001"
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Expiry Date Input */}
            <div>
              <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-1">
                Expiry Date <span className="text-gray-500">(Optional)</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  id="expiryDate"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.quantity}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <Package className="w-4 h-4" />
                    Add Stock
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Batch Tracking Info */}
          <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-xs font-medium mb-1">💡 Batch Tracking</p>
            <p className="text-blue-700 text-xs">
              This will create a new batch record and update your inventory. Make sure your database has the batch tracking functions set up.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddStockModal;