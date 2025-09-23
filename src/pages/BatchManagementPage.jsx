import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Search,
  Plus,
  Calendar,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  Download,
  RefreshCw,
  ChevronLeft,
  Edit,
  ShoppingCart,
  Zap,
  Upload
} from 'lucide-react';
import { ProductService } from '../services/domains/inventory/productService';
import { formatDate } from '../utils/dateTime';
import { formatCurrency } from '../utils/formatting';
import AddStockModal from '../components/modals/AddStockModal';
import BulkBatchImportModal from '../components/modals/BulkBatchImportModal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ProductSelectionCard from '../components/ui/ProductSelectionCard';

const BatchManagementPage = () => {
  const navigate = useNavigate();
  
  // State Management
  const [batches, setBatches] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Filter and Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [expiryFilter, setExpiryFilter] = useState('all'); // all, expiring, expired
  
  // Modal States
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [selectedProductForStock, setSelectedProductForStock] = useState(null);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  
  // Product Grid Search State
  const [productSearchTerm, setProductSearchTerm] = useState('');

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load products first (this should always work)
      const productsData = await ProductService.getProducts();
      setProducts(productsData);
      
      // Try to load batches (this might fail if RPC functions don't exist)
      try {
        const batchesData = await ProductService.getAllBatches();
        setBatches(batchesData);
      } catch (batchError) {
        console.warn('⚠️ Batch functions not available yet:', batchError);
        setBatches([]);
        setError('Batch tracking functions not yet configured. Please run the SQL setup in Supabase.');
      }
      
    } catch (err) {
      console.error('❌ Error loading data:', err);
      setError('Failed to load data. Please check your database connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Filter and search logic
  const filteredBatches = useMemo(() => {
    let filtered = batches;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(batch =>
        batch.product_name?.toLowerCase().includes(term) ||
        batch.batch_number?.toLowerCase().includes(term) ||
        batch.category_name?.toLowerCase().includes(term)
      );
    }

    // Product filter
    if (selectedProduct) {
      filtered = filtered.filter(batch => batch.product_id === selectedProduct);
    }

    // Expiry filter
    if (expiryFilter !== 'all') {
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      filtered = filtered.filter(batch => {
        if (!batch.expiry_date) return expiryFilter === 'all';
        
        const expiryDate = new Date(batch.expiry_date);
        
        switch (expiryFilter) {
          case 'expired':
            return expiryDate < today;
          case 'expiring':
            return expiryDate >= today && expiryDate <= thirtyDaysFromNow;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [batches, searchTerm, selectedProduct, expiryFilter]);

  // Get expiry status
  const getExpiryStatus = (expiryDate, daysUntilExpiry) => {
    if (!expiryDate) return { status: 'none', color: 'gray', label: 'No expiry' };
    
    if (daysUntilExpiry < 0) {
      return { status: 'expired', color: 'red', label: 'Expired' };
    } else if (daysUntilExpiry === 0) {
      return { status: 'expires-today', color: 'red', label: 'Expires today' };
    } else if (daysUntilExpiry <= 30) {
      return { status: 'expiring-soon', color: 'orange', label: 'Expiring soon' };
    } else if (daysUntilExpiry <= 90) {
      return { status: 'expiring', color: 'yellow', label: 'Expiring' };
    } else {
      return { status: 'good', color: 'green', label: 'Good' };
    }
  };

  const handleAddStock = (product) => {
    setSelectedProductForStock(product);
    setShowAddStockModal(true);
  };

  const handleStockAdded = async (result) => {
    console.log('✅ Stock added successfully:', result);
    // Clear the product search
    setProductSearchTerm('');
    // Refresh the batches data
    await handleRefresh();
  };

  const handleBulkImportSuccess = async (result) => {
    console.log('✅ Bulk import completed:', result);
    // Refresh the batches data
    await handleRefresh();
    // Close the modal
    setShowBulkImportModal(false);
  };

  // Handle card-based stock addition
  const handleCardAddStock = (product) => {
    handleAddStock(product);
  };

  // Filter products for the card grid
  const filteredProducts = useMemo(() => {
    if (!productSearchTerm) return products;
    
    const term = productSearchTerm.toLowerCase();
    return products.filter(product => 
      product.name?.toLowerCase().includes(term) ||
      product.brand?.toLowerCase().includes(term) ||
      product.category?.toLowerCase().includes(term)
    );
  }, [products, productSearchTerm]);



  if (loading && !refreshing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/inventory')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to Inventory"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Box className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Batch Management</h1>
                  <p className="text-gray-600">View, search, and add new inventory batches</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowBulkImportModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                title="Bulk import batches from CSV"
              >
                <Upload className="h-4 w-4" />
                <span>Bulk Import</span>
              </button>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh data"
              >
                <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Primary Action: Add New Stock Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
                  <ShoppingCart className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Add New Stock to Inventory</h2>
                  <p className="text-blue-100 text-sm">Select a product card below to add new batch inventory</p>
                </div>
              </div>
              <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                <Zap className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-6 border-b border-gray-200">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products by name, brand, or category..."
                value={productSearchTerm}
                onChange={(e) => setProductSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {productSearchTerm && (
              <div className="mt-2 text-sm text-gray-500">
                Showing {filteredProducts.length} of {products.length} products
              </div>
            )}
          </div>

          {/* Product Cards Grid */}
          <div className="p-6">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {productSearchTerm ? 'No products found' : 'No products available'}
                </h3>
                <p className="text-gray-500">
                  {productSearchTerm 
                    ? `No products match "${productSearchTerm}". Try adjusting your search.`
                    : 'Please add products to your inventory first.'
                  }
                </p>
                {productSearchTerm && (
                  <button
                    onClick={() => setProductSearchTerm('')}
                    className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <ProductSelectionCard
                    key={product.id}
                    product={product}
                    onAddStock={handleCardAddStock}
                  />
                ))}
              </div>
            )}
          </div>
          
          {error && (
            <div className="mx-6 mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="text-red-800 text-sm">{error}</span>
              </div>
            </div>
          )}
        </div>

        {/* Batch Table Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Existing Batches</h3>
            <div className="text-sm text-gray-500">
              {filteredBatches.length} of {batches.length} batches shown
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Existing Batches */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search existing batches..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            {/* Product Filter */}
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">All Products</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>

            {/* Expiry Filter */}
            <select
              value={expiryFilter}
              onChange={(e) => setExpiryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">All Batches</option>
              <option value="expiring">Expiring (≤30 days)</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>

        {/* Batches Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Batch Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expiry Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBatches.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center space-y-4">
                        <Package className="h-16 w-16 text-gray-400" />
                        <div className="text-center">
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No batches found</h3>
                          <p className="text-gray-500 mb-4">
                            {searchTerm || selectedProduct || expiryFilter !== 'all'
                              ? 'Try adjusting your filters above'
                              : 'Use the "Add New Stock" section above to create your first batch'
                            }
                          </p>
                          {!searchTerm && !selectedProduct && expiryFilter === 'all' && (
                            <button
                              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Your First Batch
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredBatches.map((batch) => {
                    const expiryStatus = getExpiryStatus(batch.expiry_date, batch.days_until_expiry);
                    
                    return (
                      <tr key={batch.batch_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {batch.product_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {batch.category_name}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              Batch #{batch.batch_id}
                            </div>
                            {batch.batch_number && (
                              <div className="text-sm text-gray-500">
                                {batch.batch_number}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {batch.quantity?.toLocaleString()} pieces
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${expiryStatus.color}-100 text-${expiryStatus.color}-800`}>
                              {expiryStatus.label}
                            </span>
                            {batch.expiry_date && (
                              <div className="text-xs text-gray-500">
                                {formatDate(batch.expiry_date)}
                                {batch.days_until_expiry !== null && (
                                  <span className="ml-1">
                                    ({batch.days_until_expiry >= 0 
                                      ? `${batch.days_until_expiry} days left` 
                                      : `${Math.abs(batch.days_until_expiry)} days ago`
                                    })
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(batch.created_at)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Stock Modal */}
      <AddStockModal
        isOpen={showAddStockModal}
        onClose={() => {
          setShowAddStockModal(false);
          setSelectedProductForStock(null);
        }}
        product={selectedProductForStock}
        onSuccess={handleStockAdded}
      />

      {/* Bulk Import Modal */}
      <BulkBatchImportModal
        isOpen={showBulkImportModal}
        onClose={() => setShowBulkImportModal(false)}
        onSuccess={handleBulkImportSuccess}
      />
    </div>
  );
};

export default BatchManagementPage;