// Professional Customer System Integration
// This component demonstrates how to integrate all the professional improvements

import React, { useState, useCallback } from 'react';
import { Plus, Search, Filter, Download, RefreshCw } from 'lucide-react';

// Import our professional components
import { useCustomerErrorHandler } from './CustomerErrorHandler';
import { useCustomerValidation } from './useCustomerValidation';
import { useCustomerPerformance } from '../hooks/useCustomerPerformance';
import {
  CustomerNotification,
  NotificationTypes,
  LoadingButton,
  CustomerModal,
  CustomerSkeleton,
  CustomerEmptyState,
  ErrorDisplay
} from './CustomerUI';

export const ProfessionalCustomerSystem = ({ customers = [], onCustomerChange }) => {
  // Professional hooks integration
  const { handleError, error, clearError, isRetrying } = useCustomerErrorHandler();
  const validation = useCustomerValidation();
  const {
    customers: displayCustomers,
    handleSearch,
    handleSort,
    pagination,
    searchTerm,
    sortConfig,
    metrics,
    searchInputRef
  } = useCustomerPerformance(customers, {
    pageSize: 20,
    searchDebounce: 300,
    sortable: true
  });

  // State management
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('view'); // view, edit, create
  const [notification, setNotification] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Professional notification system
  const showNotification = useCallback((type, title, message, action = null) => {
    setNotification({
      id: Date.now(),
      type,
      title,
      message,
      action
    });
  }, []);

  const clearNotification = useCallback(() => {
    setNotification(null);
  }, []);

  // Professional error handling with user feedback
  const handleOperationError = useCallback((error, operation) => {
    const mappedError = handleError(error, operation);
    showNotification(
      NotificationTypes.ERROR,
      mappedError.title,
      mappedError.message,
      mappedError.retryable ? {
        label: 'Try Again',
        onClick: () => {
          clearError();
          // Trigger retry logic here
        }
      } : null
    );
  }, [handleError, showNotification, clearError]);

  // Professional CRUD operations with proper error handling
  const handleCreateCustomer = useCallback(async (customerData) => {
    try {
      setIsLoading(true);
      
      // Validate data
      const validationResult = validation.validateCustomer(customerData);
      if (!validationResult.isValid) {
        throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Success notification
      showNotification(
        NotificationTypes.SUCCESS,
        'Customer Created',
        `${customerData.name} has been successfully added to your customer database.`
      );
      
      setIsModalOpen(false);
      onCustomerChange?.();
      
    } catch (error) {
      handleOperationError(error, 'create');
    } finally {
      setIsLoading(false);
    }
  }, [validation, showNotification, handleOperationError, onCustomerChange]);

  const handleUpdateCustomer = useCallback(async (customerId, customerData) => {
    try {
      setIsLoading(true);
      
      // Validate data
      const validationResult = validation.validateCustomer(customerData);
      if (!validationResult.isValid) {
        throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      showNotification(
        NotificationTypes.SUCCESS,
        'Customer Updated',
        `${customerData.name}'s information has been successfully updated.`
      );
      
      setIsModalOpen(false);
      onCustomerChange?.();
      
    } catch (error) {
      handleOperationError(error, 'update');
    } finally {
      setIsLoading(false);
    }
  }, [validation, showNotification, handleOperationError, onCustomerChange]);

  const handleDeleteCustomer = useCallback(async (customerId, customerName) => {
    try {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 600));
      
      showNotification(
        NotificationTypes.SUCCESS,
        'Customer Deleted',
        `${customerName} has been removed from your customer database.`,
        {
          label: 'Undo',
          onClick: () => {
            // Implement undo logic
            showNotification(
              NotificationTypes.INFO,
              'Customer Restored',
              `${customerName} has been restored.`
            );
          }
        }
      );
      
      setIsModalOpen(false);
      onCustomerChange?.();
      
    } catch (error) {
      handleOperationError(error, 'delete');
    } finally {
      setIsLoading(false);
    }
  }, [showNotification, handleOperationError, onCustomerChange]);

  // Modal handlers
  const openModal = useCallback((mode, customer = null) => {
    setModalMode(mode);
    setSelectedCustomer(customer);
    setIsModalOpen(true);
    clearError();
  }, [clearError]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
    clearError();
  }, [clearError]);

  // Professional table rendering
  const renderCustomerTable = () => {
    if (isLoading && displayCustomers.length === 0) {
      return (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <CustomerSkeleton key={i} />
          ))}
        </div>
      );
    }

    if (displayCustomers.length === 0) {
      return (
        <CustomerEmptyState
          icon={Search}
          title={searchTerm ? "No customers found" : "No customers yet"}
          description={
            searchTerm 
              ? `We couldn't find any customers matching "${searchTerm}". Try adjusting your search terms.`
              : "Get started by adding your first customer to the system."
          }
          action={
            <LoadingButton
              onClick={() => openModal('create')}
              icon={Plus}
              variant="primary"
            >
              Add First Customer
            </LoadingButton>
          }
        />
      );
    }

    return (
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              {[
                { key: 'name', label: 'Customer' },
                { key: 'email', label: 'Email' },
                { key: 'phone', label: 'Phone' },
                { key: 'totalSpent', label: 'Total Spent' },
                { key: 'lastPurchase', label: 'Last Purchase' },
                { key: null, label: 'Actions' }
              ].map((column) => (
                <th
                  key={column.key || 'actions'}
                  className={`
                    px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide
                    ${column.key ? 'cursor-pointer hover:bg-gray-100' : ''}
                  `}
                  onClick={column.key ? () => handleSort(column.key) : undefined}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {column.key && sortConfig.key === column.key && (
                      <span className="text-blue-600">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayCustomers.map((customer) => (
              <tr key={customer.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {customer.name?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                      <div className="text-sm text-gray-500">ID: {customer.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {customer.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {customer.phone}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${customer.totalSpent?.toFixed(2) || '0.00'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {customer.lastPurchase ? new Date(customer.lastPurchase).toLocaleDateString() : 'Never'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button
                    onClick={() => openModal('view', customer)}
                    className="text-blue-600 hover:text-blue-900 transition-colors"
                  >
                    View
                  </button>
                  <button
                    onClick={() => openModal('edit', customer)}
                    className="text-green-600 hover:text-green-900 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCustomer(customer.id, customer.name)}
                    className="text-red-600 hover:text-red-900 transition-colors"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Professional Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage your customers with professional tools and insights
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <LoadingButton
            onClick={() => openModal('create')}
            icon={Plus}
            variant="primary"
            loading={isLoading}
          >
            Add Customer
          </LoadingButton>
          
          <LoadingButton
            onClick={() => window.location.reload()}
            icon={RefreshCw}
            variant="secondary"
          >
            Refresh
          </LoadingButton>
        </div>
      </div>

      {/* Professional Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search customers by name, email, phone..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="
                pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                transition-colors
              "
            />
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button className="
            px-4 py-2 border border-gray-300 rounded-lg
            hover:bg-gray-50 transition-colors
            flex items-center space-x-2
          ">
            <Filter className="h-4 w-4" />
            <span>Filter</span>
          </button>
          
          <button className="
            px-4 py-2 border border-gray-300 rounded-lg
            hover:bg-gray-50 transition-colors
            flex items-center space-x-2
          ">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">{metrics.totalCustomers}</div>
            <div className="text-sm text-gray-600">Total Customers</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{metrics.filteredCustomers}</div>
            <div className="text-sm text-gray-600">Filtered Results</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{pagination.currentPage}</div>
            <div className="text-sm text-gray-600">Current Page</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{pagination.totalPages}</div>
            <div className="text-sm text-gray-600">Total Pages</div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <ErrorDisplay
          error={error}
          onRetry={error.retryable ? () => clearError() : undefined}
          onDismiss={clearError}
        />
      )}

      {/* Customer Table */}
      {renderCustomerTable()}

      {/* Professional Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {pagination.startIndex} to {pagination.endIndex} of {pagination.totalItems} customers
          </div>
          
          <div className="flex space-x-2">
            <LoadingButton
              onClick={() => pagination.prevPage()}
              disabled={!pagination.hasPrevPage}
              variant="secondary"
              size="sm"
            >
              Previous
            </LoadingButton>
            
            {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => pagination.goToPage(page)}
                  className={`
                    px-3 py-1 text-sm rounded
                    ${pagination.currentPage === page 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                    }
                    border transition-colors
                  `}
                >
                  {page}
                </button>
              );
            })}
            
            <LoadingButton
              onClick={() => pagination.nextPage()}
              disabled={!pagination.hasNextPage}
              variant="secondary"
              size="sm"
            >
              Next
            </LoadingButton>
          </div>
        </div>
      )}

      {/* Professional Modal */}
      <CustomerModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={
          modalMode === 'create' ? 'Add New Customer' :
          modalMode === 'edit' ? 'Edit Customer' :
          'Customer Details'
        }
        size="lg"
        footer={
          modalMode !== 'view' ? (
            <>
              <LoadingButton
                onClick={closeModal}
                variant="secondary"
              >
                Cancel
              </LoadingButton>
              <LoadingButton
                onClick={() => {
                  if (modalMode === 'create') {
                    handleCreateCustomer(selectedCustomer);
                  } else {
                    handleUpdateCustomer(selectedCustomer?.id, selectedCustomer);
                  }
                }}
                variant="primary"
                loading={isLoading}
              >
                {modalMode === 'create' ? 'Create Customer' : 'Save Changes'}
              </LoadingButton>
            </>
          ) : (
            <LoadingButton onClick={closeModal} variant="secondary">
              Close
            </LoadingButton>
          )
        }
      >
        {/* Modal content would go here */}
        <div className="space-y-4">
          <p>Customer {modalMode} form would be implemented here with validation.</p>
          {selectedCustomer && (
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
              {JSON.stringify(selectedCustomer, null, 2)}
            </pre>
          )}
        </div>
      </CustomerModal>

      {/* Professional Notifications */}
      {notification && (
        <CustomerNotification
          type={notification.type}
          title={notification.title}
          message={notification.message}
          action={notification.action}
          onClose={clearNotification}
        />
      )}
    </div>
  );
};

export default ProfessionalCustomerSystem;