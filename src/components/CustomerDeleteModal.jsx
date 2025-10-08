import React, { useState } from 'react';
import { 
  Trash2, 
  AlertTriangle, 
  User, 
  Loader2,
  X,
  CheckCircle
} from 'lucide-react';

const CustomerDeleteModal = ({ 
  customer, 
  isOpen, 
  onClose, 
  onDelete,
  isLoading = false 
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const resetModal = () => {
    setConfirmText('');
    setShowSuccess(false);
  };

  const handleClose = () => {
    if (!isLoading) {
      resetModal();
      onClose();
    }
  };

  const handleDelete = async () => {
    try {
      await onDelete(customer.id);
      setShowSuccess(true);
      // Auto close after 2 seconds
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      console.error('Delete failed:', error);
      // Error handling is done in parent component
    }
  };

  const requiredConfirmText = customer?.customer_name || 'DELETE';
  const isConfirmTextValid = confirmText === requiredConfirmText;

  if (!isOpen || !customer) return null;

  // Success state
  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full relative">
          <div className="p-8 text-center">
            <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Customer Deleted Successfully
            </h3>
            <p className="text-gray-600 mb-4">
              <strong>{customer.customer_name}</strong> has been permanently removed from the system.
            </p>
            <div className="text-sm text-gray-500">
              Closing automatically...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full relative">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="bg-red-100 p-2 rounded-full mr-3">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Delete Customer</h3>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content - Crosswise layout */}
        <div className="flex">
          {/* Left Side - Customer Info & Warning */}
          <div className="flex-1 p-4 border-r border-gray-200">
            {/* Customer Info */}
            <div className="bg-gray-50 p-3 rounded-lg mb-4">
              <div className="flex items-center mb-2">
                <User className="h-4 w-4 text-gray-500 mr-2" />
                <span className="font-medium text-gray-900">{customer.customer_name}</span>
              </div>
              <div className="text-sm text-gray-600">
                Phone: {customer.phone}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Customer ID: {customer.id}
              </div>
            </div>
            
            {/* Simplified Warning */}
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center mb-2">
                <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                <span className="font-medium text-red-900 text-sm">Permanent Deletion Warning</span>
              </div>
              <p className="text-sm text-red-800 mb-2">
                This will permanently delete all customer data and cannot be undone. Transaction history will be preserved for reporting.
              </p>
              <div className="text-xs text-red-700 space-y-1">
                <div>⚠️ Customer information will be deleted permanently</div>
                <div>⚠️ This action cannot be reversed</div>
                <div>✅ Transaction amounts will be preserved for reports</div>
              </div>
            </div>
          </div>

          {/* Right Side - Confirmation */}
          <div className="flex-1 p-4">
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                <span className="font-medium text-red-900 text-sm">Confirmation Required</span>
              </div>
              <p className="text-sm text-red-800 mb-3">Type "CONFIRM" to proceed:</p>
              
              <div className="bg-white p-3 rounded border-2 border-red-300">
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500 text-center font-mono text-lg"
                  placeholder="Type: CONFIRM"
                  disabled={isLoading}
                  autoFocus
                />
              </div>
              
              {/* Confirmation Status */}
              <div className="mt-2 text-xs text-center">
                {confirmText.length > 0 && (
                  <span className={`${
                    confirmText === 'CONFIRM'
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {confirmText === 'CONFIRM'
                      ? '✅ Ready to delete' 
                      : '❌ Type "CONFIRM" exactly'
                    }
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isLoading || confirmText !== 'CONFIRM'}
                className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDeleteModal;