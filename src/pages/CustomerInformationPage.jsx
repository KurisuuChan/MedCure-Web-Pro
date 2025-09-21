import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Search, 
  ArrowLeft, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  ShoppingBag,
  TrendingUp,
  User,
  Filter,
  Download,
  Plus,
  Eye,
  Edit,
  Trash2,
  X,
  History,
  FileText,
  BarChart3,
  RefreshCw,
  Copy,
  Receipt
} from 'lucide-react';
import { useCustomers } from '../hooks/useCustomers';
import unifiedTransactionService from '../services/domains/sales/transactionService';
import { formatCurrency, formatDate } from '../utils/formatting';
import SimpleReceipt from '../components/ui/SimpleReceipt';

const CustomerInformationPage = () => {
  const navigate = useNavigate();
  const { customers, fetchCustomers, deleteCustomer, updateCustomer } = useCustomers();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name'); // 'name', 'date', 'purchases', 'amount'
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editForm, setEditForm] = useState({
    customer_name: '',
    phone: '',
    email: '',
    address: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [customerTransactions, setCustomerTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [transactionSearchTerm, setTransactionSearchTerm] = useState('');
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Filter and sort customers
  const filteredAndSortedCustomers = customers
    .filter(customer => {
      return !searchTerm || 
        customer.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.phone && customer.phone.includes(searchTerm)) ||
        (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()));
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.customer_name.toLowerCase();
          bValue = b.customer_name.toLowerCase();
          break;
        case 'date':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'purchases':
          aValue = a.purchase_count || 0;
          bValue = b.purchase_count || 0;
          break;
        case 'amount':
          aValue = a.total_purchases || 0;
          bValue = b.total_purchases || 0;
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const getCustomerBadge = (customer) => {
    const totalSpent = customer.total_purchases || 0;
    const purchaseCount = customer.purchase_count || 0;
    
    if (totalSpent > 10000 || purchaseCount > 20) {
      return { label: 'Premium', color: 'bg-purple-100 text-purple-800' };
    } else if (totalSpent > 3000 || purchaseCount > 5) {
      return { label: 'Regular', color: 'bg-blue-100 text-blue-800' };
    } else {
      return { label: 'New', color: 'bg-green-100 text-green-800' };
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return;
    
    try {
      // Use database deleteCustomer method instead of localStorage
      await deleteCustomer(selectedCustomer.id);
      
      // Refresh customer data
      await fetchCustomers();
      
      // Close modal
      setShowDeleteConfirm(false);
      setSelectedCustomer(null);
      
      console.log('Customer deleted successfully from database');
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('Failed to delete customer. Please try again.');
    }
  };

  const openEditModal = (customer) => {
    setSelectedCustomer(customer);
    setEditForm({
      customer_name: customer.customer_name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateCustomer = async () => {
    if (!selectedCustomer || !editForm.customer_name.trim()) {
      alert('Customer name is required');
      return;
    }

    setIsUpdating(true);
    try {
      // Use database updateCustomer method instead of localStorage
      await updateCustomer(selectedCustomer.id, editForm);
      
      // Close modal
      closeAllModals();
      
      console.log('Customer updated successfully in database');
    } catch (error) {
      console.error('Error updating customer:', error);
      alert('Failed to update customer. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const fetchCustomerTransactions = async (customer) => {
    setLoadingTransactions(true);
    try {
      console.log('🔍 Fetching transactions for customer:', customer);
      
      // Get all transactions - the service returns an array directly
      const allTransactions = await unifiedTransactionService.getTransactions({
        limit: 1000,
        offset: 0,
        sortBy: 'created_at',
        sortOrder: 'desc'
      });
      
      console.log('📊 All transactions fetched:', allTransactions);
      console.log('📊 Transaction data type:', typeof allTransactions);
      console.log('📊 Is array:', Array.isArray(allTransactions));
      
      // Use whichever has more data or prefer today's transactions
      const transactionData = Array.isArray(allTransactions) ? allTransactions : [];
      
      console.log('📋 Using transaction data:', transactionData);
      console.log('📋 Sample transaction (first one):', transactionData[0]);
      
      // If no transactions at all, let's try a different approach
      if (transactionData.length === 0) {
        console.log('🔄 No transactions found, trying alternative approach...');
        
        // Try getting transactions by date range
        const dateRangeOptions = {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
          endDate: new Date().toISOString(),
          limit: 1000
        };
        
        const rangeTransactions = await unifiedTransactionService.getTransactions(dateRangeOptions);
        console.log('� Date range transactions:', rangeTransactions);
        
        setCustomerTransactions(Array.isArray(rangeTransactions) ? rangeTransactions : []);
        return;
      }
      
      // Filter transactions for this specific customer
      const customerTxns = transactionData.filter(txn => {
        if (!txn) return false;
        
        // Skip deleted customer transactions
        if (txn.customer_name === '[DELETED CUSTOMER]' || !txn.customer_name) {
          return false;
        }
        
        console.log('🔄 Checking transaction:', {
          transaction_id: txn.id,
          txn_customer_name: txn.customer_name,
          txn_customer_phone: txn.customer_phone,
          target_customer_name: customer.customer_name,
          target_customer_phone: customer.phone,
          target_customer_id: customer.id,
          created_at: txn.created_at
        });
        
        // Primary matching: Phone number (most reliable)
        if (txn.customer_phone && customer.phone) {
          // Normalize phone numbers by removing all non-digits
          const normalizePhone = (phone) => phone.toString().replace(/\D/g, '');
          
          const txnPhone = normalizePhone(txn.customer_phone);
          const customerPhone = normalizePhone(customer.phone);
          
          if (txnPhone && customerPhone && txnPhone === customerPhone) {
            console.log('✅ Phone match found!', {txnPhone, customerPhone});
            return true;
          }
        }
        
        // Secondary matching: Name (case insensitive) BUT only if phones match or both are empty
        if (txn.customer_name && customer.customer_name) {
          const txnName = txn.customer_name.toString().toLowerCase().trim();
          const customerName = customer.customer_name.toString().toLowerCase().trim();
          
          if (txnName === customerName) {
            // Only match by name if:
            // 1. Both have matching phone numbers, OR
            // 2. Both have no phone numbers (empty/null)
            const txnPhone = txn.customer_phone ? txn.customer_phone.toString().trim() : '';
            const customerPhone = customer.phone ? customer.phone.toString().trim() : '';
            
            if (txnPhone && customerPhone && txnPhone === customerPhone) {
              console.log('✅ Name + Phone match found!');
              return true;
            } else if (!txnPhone && !customerPhone) {
              console.log('✅ Name match found (both have no phone)!');
              return true;
            } else {
              console.log('❌ Name matches but phones don\'t match:', {txnPhone, customerPhone});
              return false;
            }
          }
        }
        
        return false;
      });
      
      console.log(`✅ Found ${customerTxns.length} transactions for ${customer.customer_name}`);
      
      // For debugging - if no matches, show all transactions to see what's available
      if (customerTxns.length === 0 && transactionData.length > 0) {
        console.log('🔍 DEBUG - No matches found. Here are all available transactions:');
        transactionData.forEach((txn, index) => {
          console.log(`Transaction ${index + 1}:`, {
            id: txn.id,
            customer_name: txn.customer_name,
            customer_phone: txn.customer_phone,
            total_amount: txn.total_amount,
            created_at: txn.created_at
          });
        });
      }
      
      setCustomerTransactions(customerTxns);
    } catch (error) {
      console.error('❌ Error fetching customer transactions:', error);
      setCustomerTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const openTransactionHistory = (customer) => {
    setSelectedCustomer(customer);
    setShowTransactionHistory(true);
    setTransactionSearchTerm('');
    fetchCustomerTransactions(customer);
  };

  const openReceiptModal = (transaction) => {
    setSelectedTransaction(transaction);
    setShowReceiptModal(true);
  };

  const closeAllModals = () => {
    setShowViewModal(false);
    setShowEditModal(false);
    setShowDeleteConfirm(false);
    setShowTransactionHistory(false);
    setShowReceiptModal(false);
    setSelectedCustomer(null);
    setSelectedTransaction(null);
    setEditForm({ customer_name: '', phone: '', email: '', address: '' });
    setCustomerTransactions([]);
    setTransactionSearchTerm('');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/pos')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to POS"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Customer Information</h1>
                  <p className="text-gray-600">Manage and view your customer database</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-lg border">
                {filteredAndSortedCustomers.length} of {customers.length} customers
              </div>
              <button
                onClick={() => fetchCustomers()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Customers
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search by name, phone, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="purchases-desc">Most Purchases</option>
                <option value="amount-desc">Highest Spent</option>
              </select>
            </div>
          </div>
        </div>

        {/* Customer Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th 
                    className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center space-x-1">
                      <User className="h-4 w-4" />
                      <span>Customer</span>
                      <span className="text-blue-600">{getSortIcon('name')}</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <Phone className="h-4 w-4" />
                      <span>Contact</span>
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>Joined</span>
                      <span className="text-blue-600">{getSortIcon('date')}</span>
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('purchases')}
                  >
                    <div className="flex items-center space-x-1">
                      <ShoppingBag className="h-4 w-4" />
                      <span>Purchases</span>
                      <span className="text-blue-600">{getSortIcon('purchases')}</span>
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="h-4 w-4" />
                      <span>Total Spent</span>
                      <span className="text-blue-600">{getSortIcon('amount')}</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedCustomers.map((customer) => {
                  const badge = getCustomerBadge(customer);
                  return (
                    <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium text-sm">
                              {customer.customer_name?.charAt(0)?.toUpperCase() || 'C'}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {customer.customer_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {customer.id.slice(-8)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          {customer.phone && (
                            <div className="flex items-center text-sm text-gray-900">
                              <Phone className="h-3 w-3 mr-2 text-gray-400" />
                              {customer.phone}
                            </div>
                          )}
                          {customer.email && (
                            <div className="flex items-center text-sm text-gray-500">
                              <Mail className="h-3 w-3 mr-2 text-gray-400" />
                              <span className="truncate max-w-xs">{customer.email}</span>
                            </div>
                          )}
                          {customer.address && (
                            <div className="flex items-center text-sm text-gray-500">
                              <MapPin className="h-3 w-3 mr-2 text-gray-400" />
                              <span className="truncate max-w-xs">{customer.address}</span>
                            </div>
                          )}
                          {!customer.phone && !customer.email && !customer.address && (
                            <span className="text-sm text-gray-400 italic">No contact info</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(customer.created_at).toLocaleDateString('en-PH', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                        <div className="text-sm text-gray-500">
                          {Math.ceil(
                            (new Date() - new Date(customer.created_at)) / (1000 * 60 * 60 * 24)
                          )} days ago
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {customer.purchase_count || 0} orders
                        </div>
                        {customer.last_purchase_date && (
                          <div className="text-sm text-gray-500">
                            Last: {new Date(customer.last_purchase_date).toLocaleDateString('en-PH')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ₱{(customer.total_purchases || 0).toLocaleString('en-PH', { 
                            minimumFractionDigits: 2 
                          })}
                        </div>
                        {customer.purchase_count > 0 && (
                          <div className="text-sm text-gray-500">
                            Avg: ₱{Math.round((customer.total_purchases || 0) / customer.purchase_count).toLocaleString('en-PH')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setShowViewModal(true);
                            }}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200"
                            title="View Customer"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openTransactionHistory(customer)}
                            className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-all duration-200"
                            title="Transaction History"
                          >
                            <History className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(customer)}
                            className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-all duration-200"
                            title="Edit Customer"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setShowDeleteConfirm(true);
                            }}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200"
                            title="Delete Customer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredAndSortedCustomers.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No customers found' : 'No customers yet'}
              </h3>
              <p className="text-gray-600">
                {searchTerm 
                  ? 'Try adjusting your search criteria' 
                  : 'Customer information will appear here after purchases are made'}
              </p>
            </div>
          )}
        </div>

        {/* View Customer Modal */}
        {showViewModal && selectedCustomer && (
          <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none" style={{ zIndex: 9999 }}>
            <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative pointer-events-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Customer Details</h3>
                  <button
                    onClick={closeAllModals}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-xl">
                      {selectedCustomer.customer_name?.charAt(0)?.toUpperCase() || 'C'}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900">{selectedCustomer.customer_name}</h4>
                    <p className="text-gray-500">Customer ID: {selectedCustomer.id.slice(-8)}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-medium text-gray-900 mb-3">Contact Information</h5>
                    <div className="space-y-2">
                      {selectedCustomer.phone && (
                        <div className="flex items-center text-sm">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{selectedCustomer.phone}</span>
                        </div>
                      )}
                      {selectedCustomer.email && (
                        <div className="flex items-center text-sm">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{selectedCustomer.email}</span>
                        </div>
                      )}
                      {selectedCustomer.address && (
                        <div className="flex items-center text-sm">
                          <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{selectedCustomer.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-gray-900 mb-3">Purchase Statistics</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Orders:</span>
                        <span className="font-medium">{selectedCustomer.purchase_count || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Spent:</span>
                        <span className="font-medium">
                          ₱{(selectedCustomer.total_purchases || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Joined:</span>
                        <span className="font-medium">
                          {new Date(selectedCustomer.created_at).toLocaleDateString('en-PH')}
                        </span>
                      </div>
                      {selectedCustomer.last_purchase_date && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Last Purchase:</span>
                          <span className="font-medium">
                            {new Date(selectedCustomer.last_purchase_date).toLocaleDateString('en-PH')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Customer Modal */}
        {showEditModal && selectedCustomer && (
          <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none" style={{ zIndex: 9999 }}>
            <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-md w-full relative pointer-events-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Edit Customer</h3>
                  <button
                    onClick={closeAllModals}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <form onSubmit={(e) => { e.preventDefault(); handleUpdateCustomer(); }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      value={editForm.customer_name}
                      onChange={(e) => setEditForm({...editForm, customer_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter customer name"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter phone number"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter email address"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <textarea
                      value={editForm.address}
                      onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter address"
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={closeAllModals}
                      className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      disabled={isUpdating}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isUpdating}
                    >
                      {isUpdating ? 'Updating...' : 'Update Customer'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && selectedCustomer && (
          <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none" style={{ zIndex: 9999 }}>
            <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-md w-full relative pointer-events-auto">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="bg-red-100 p-3 rounded-full mr-4">
                    <Trash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Delete Customer</h3>
                    <p className="text-gray-600">This action cannot be undone.</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <p className="text-sm text-gray-700">
                    Are you sure you want to delete <strong>{selectedCustomer.customer_name}</strong>?
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    This will permanently remove all customer data and purchase history.
                  </p>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={closeAllModals}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteCustomer}
                    className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete Customer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Customer Transaction History Modal */}
        {showTransactionHistory && selectedCustomer && (
          <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none" style={{ zIndex: 9999 }}>
            <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-6xl w-full max-h-[90vh] overflow-hidden relative pointer-events-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <History className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
                      <p className="text-gray-500">{selectedCustomer.customer_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => fetchCustomerTransactions(selectedCustomer)}
                      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-200"
                      title="Refresh"
                      disabled={loadingTransactions}
                    >
                      <RefreshCw className={`h-4 w-4 ${loadingTransactions ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={closeAllModals}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                {/* Transaction Summary Cards */}
                <div className="p-6 bg-gray-50 border-b border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <ShoppingBag className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-600">Total Orders</p>
                          <p className="text-xl font-bold text-gray-900">{customerTransactions.length}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center">
                        <div className="bg-green-100 p-2 rounded-lg">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-600">Total Spent</p>
                          <p className="text-xl font-bold text-gray-900">
                            {formatCurrency(customerTransactions.reduce((sum, txn) => sum + (parseFloat(txn.total_amount) || 0), 0))}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center">
                        <div className="bg-purple-100 p-2 rounded-lg">
                          <BarChart3 className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-600">Avg. Order</p>
                          <p className="text-xl font-bold text-gray-900">
                            {customerTransactions.length > 0 
                              ? formatCurrency(customerTransactions.reduce((sum, txn) => sum + (parseFloat(txn.total_amount) || 0), 0) / customerTransactions.length)
                              : formatCurrency(0)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center">
                        <div className="bg-orange-100 p-2 rounded-lg">
                          <Calendar className="h-4 w-4 text-orange-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-600">Last Order</p>
                          <p className="text-xl font-bold text-gray-900">
                            {customerTransactions.length > 0 
                              ? formatDate(customerTransactions[0].created_at).split(' ')[0]
                              : 'None'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Search Bar for Transactions */}
                {customerTransactions.length > 0 && (
                  <div className="p-4 border-b border-gray-200">
                    <div className="relative max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="text"
                        placeholder="Search transactions..."
                        value={transactionSearchTerm}
                        onChange={(e) => setTransactionSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </div>
                )}

                {/* Transaction List */}
                <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 400px)' }}>
                  {loadingTransactions ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                      <span className="ml-3 text-gray-600">Loading transactions...</span>
                    </div>
                  ) : customerTransactions.length === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No Transactions Found</h4>
                      <p className="text-gray-600">This customer hasn't made any purchases yet.</p>
                    </div>
                  ) : (
                    <div className="p-6">
                      <div className="space-y-4">
                        {customerTransactions
                          .filter(transaction => {
                            if (!transactionSearchTerm) return true;
                            const searchLower = transactionSearchTerm.toLowerCase();
                            return (
                              transaction.id?.toLowerCase().includes(searchLower) ||
                              transaction.payment_method?.toLowerCase().includes(searchLower) ||
                              (transaction.items && transaction.items.some(item => 
                                item.product_name?.toLowerCase().includes(searchLower) ||
                                item.name?.toLowerCase().includes(searchLower)
                              ))
                            );
                          })
                          .map((transaction, index) => (
                          <div 
                            key={transaction.id || index} 
                            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer hover:border-purple-300"
                            onClick={() => openReceiptModal(transaction)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="bg-gray-100 p-3 rounded-lg">
                                  <Receipt className="h-5 w-5 text-gray-600" />
                                </div>
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <h4 className="font-medium text-gray-900">
                                      Order #{transaction.id?.slice(-8) || `${index + 1}`}
                                    </h4>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                      transaction.status === 'completed' 
                                        ? 'bg-green-100 text-green-800' 
                                        : transaction.status === 'pending'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {transaction.status || 'Completed'}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600">
                                    {formatDate(transaction.created_at)}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="text-right">
                                <p className="text-lg font-bold text-gray-900">
                                  {formatCurrency(parseFloat(transaction.total_amount) || 0)}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {transaction.payment_method || 'Cash'}
                                </p>
                              </div>
                            </div>
                            
                            {/* Transaction Items */}
                            {transaction.items && transaction.items.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-100">
                                <div className="space-y-2">
                                  {transaction.items.slice(0, 3).map((item, itemIndex) => (
                                    <div key={itemIndex} className="flex justify-between text-sm">
                                      <span className="text-gray-600">
                                        {item.quantity}x {item.product_name || item.name}
                                      </span>
                                      <span className="font-medium text-gray-900">
                                        {formatCurrency((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1))}
                                      </span>
                                    </div>
                                  ))}
                                  {transaction.items.length > 3 && (
                                    <p className="text-xs text-gray-500 italic">
                                      +{transaction.items.length - 3} more items
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Transaction Details */}
                            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                <span>Subtotal: {formatCurrency((parseFloat(transaction.subtotal) || parseFloat(transaction.total)) || 0)}</span>
                                <span>Tax: {formatCurrency((parseFloat(transaction.tax) || (parseFloat(transaction.total) * 0.12)) || 0)}</span>
                                {transaction.discount && parseFloat(transaction.discount) > 0 && (
                                  <span>Discount: -{formatCurrency(parseFloat(transaction.discount))}</span>
                                )}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent opening receipt modal
                                  navigator.clipboard.writeText(transaction.id || `Order-${index + 1}`);
                                  alert('Transaction ID copied to clipboard!');
                                }}
                                className="text-xs px-3 py-1 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-all duration-200 flex items-center space-x-1"
                              >
                                <Copy className="h-3 w-3" />
                                <span>Copy ID</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Receipt Modal using your existing SimpleReceipt component */}
        <SimpleReceipt
          transaction={selectedTransaction}
          isOpen={showReceiptModal}
          onClose={closeAllModals}
        />
      </div>
    </div>
  );
};

export default CustomerInformationPage;