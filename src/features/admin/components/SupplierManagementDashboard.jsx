// Supplier Management Dashboard Component
// Comprehensive supplier and purchase order management interface

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Package,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Truck,
  Calendar,
  Star,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import supplierService from "../../../services/supplierService";

const SupplierManagementDashboard = () => {
  // State management
  const [suppliers, setSuppliers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter] = useState("all");
  const [sortBy] = useState("name");
  const [sortOrder] = useState("asc");
  const [currentPage] = useState(1);
  const [pageSize] = useState(20);

  // Modal states
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [activeTab, setActiveTab] = useState("suppliers");

  // Load initial data
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load suppliers
      const supplierOptions = {
        page: currentPage,
        limit: pageSize,
        search: searchTerm,
        status: statusFilter !== "all" ? statusFilter : null,
        category: categoryFilter !== "all" ? categoryFilter : null,
        sortBy,
        sortOrder,
      };

      const [suppliersData, analyticsData] = await Promise.all([
        supplierService.getAllSuppliers(supplierOptions),
        supplierService.getSupplierAnalytics("30d"),
      ]);

      setSuppliers(suppliersData.suppliers || []);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    pageSize,
    searchTerm,
    statusFilter,
    categoryFilter,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleSupplierAction = async (action, supplierId, data = null) => {
    try {
      switch (action) {
        case "create":
          await supplierService.createSupplier(data);
          break;
        case "update":
          await supplierService.updateSupplier(supplierId, data);
          break;
        case "delete":
          if (
            window.confirm("Are you sure you want to delete this supplier?")
          ) {
            await supplierService.deleteSupplier(supplierId);
          }
          break;
        default:
          break;
      }
      await loadDashboardData();
      setShowSupplierModal(false);
      setSelectedSupplier(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreatePO = async (supplierId) => {
    // For now, just show an alert - full PO creation would be implemented
    const supplier = suppliers.find((s) => s.id === supplierId);
    alert(
      `Create Purchase Order for ${
        supplier?.name || "Selected Supplier"
      }\n\nThis feature would open a comprehensive PO creation form.`
    );
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-gray-100 text-gray-800",
      suspended: "bg-red-100 text-red-800",
      pending: "bg-yellow-100 text-yellow-800",
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${
          statusStyles[status] || statusStyles.pending
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getPerformanceIndicator = (score) => {
    if (score >= 80) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (score >= 60) return <Clock className="w-4 h-4 text-yellow-500" />;
    return <TrendingDown className="w-4 h-4 text-red-500" />;
  };

  const getRatingStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating / 20); // Convert 0-100 to 0-5 stars

    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-4 h-4 ${
            i < fullStars ? "text-yellow-400 fill-current" : "text-gray-300"
          }`}
        />
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading supplier data...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Supplier Management
        </h1>
        <p className="text-gray-600">
          Manage suppliers, purchase orders, and track performance metrics
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Suppliers
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.overview.totalSuppliers}
                </p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Orders
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.overview.totalOrders}
                </p>
              </div>
              <Truck className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${analytics.overview.totalSpent.toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Avg Order Value
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  ${analytics.overview.avgOrderValue.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("suppliers")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "suppliers"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Suppliers ({suppliers.length})
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "analytics"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Analytics
          </button>
        </nav>
      </div>

      {/* Suppliers Tab */}
      {activeTab === "suppliers" && (
        <>
          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search suppliers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>

              <button
                onClick={() => setShowSupplierModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Supplier
              </button>
            </div>
          </div>

          {/* Suppliers Table */}
          <div className="bg-white rounded-lg shadow border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Supplier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orders
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Spent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {suppliers.map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {supplier.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {supplier.categories?.join(", ") || "No categories"}
                          </div>
                          <div className="flex items-center mt-1">
                            {getRatingStars(supplier.rating || 0)}
                            <span className="ml-1 text-xs text-gray-500">
                              ({supplier.rating || 0}/100)
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-gray-400" />
                            {supplier.email}
                          </div>
                          {supplier.phone && (
                            <div className="flex items-center gap-1 mt-1">
                              <Phone className="w-3 h-3 text-gray-400" />
                              {supplier.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getPerformanceIndicator(
                            supplier.performanceScore || 0
                          )}
                          <span className="text-sm text-gray-900">
                            {supplier.performanceScore || 0}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div>{supplier.totalOrders || 0} total</div>
                          <div className="text-xs text-gray-500">
                            {supplier.activeOrders || 0} active
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ${(supplier.totalSpent || 0).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(supplier.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedSupplier(supplier);
                              setShowSupplierModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleCreatePO(supplier.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Create Purchase Order"
                          >
                            <Package className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedSupplier(supplier);
                              setShowSupplierModal(true);
                            }}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Edit Supplier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              handleSupplierAction("delete", supplier.id)
                            }
                            className="text-red-600 hover:text-red-900"
                            title="Delete Supplier"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {suppliers.length === 0 && (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No suppliers found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by adding your first supplier.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => setShowSupplierModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
                  >
                    <Plus className="w-4 h-4" />
                    Add Supplier
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Analytics Tab */}
      {activeTab === "analytics" && analytics && (
        <div className="space-y-6">
          {/* Top Suppliers */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Top Suppliers by Spend
            </h3>
            <div className="space-y-3">
              {analytics.topSuppliers.map((supplier, index) => (
                <div
                  key={supplier.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {supplier.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {supplier.orderCount} orders
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">
                      ${supplier.totalSpent.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Status Distribution */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Order Status Distribution
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(analytics.orderStatusDistribution).map(
                ([status, count]) => (
                  <div
                    key={status}
                    className="text-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="text-2xl font-bold text-gray-900">
                      {count}
                    </div>
                    <div className="text-sm text-gray-600 capitalize">
                      {status.replace("_", " ")}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modals would go here - simplified for brevity */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">
              {selectedSupplier ? "Supplier Details" : "Add New Supplier"}
            </h3>
            <p className="text-gray-600 mb-4">
              Supplier management form would be implemented here with full CRUD
              functionality.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowSupplierModal(false);
                  setSelectedSupplier(null);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierManagementDashboard;
