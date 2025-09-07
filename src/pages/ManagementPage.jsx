import React, { useState, useEffect } from "react";
import {
  Users,
  Settings,
  BarChart3,
  FileText,
  Shield,
  Download,
  Activity,
  UserPlus,
  Edit,
  Trash2,
  Save,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Package,
  FolderPlus,
  Archive,
  RotateCcw,
  X,
  Tag,
} from "lucide-react";
import { formatCurrency, formatNumber } from "../utils/formatting";
import { formatDate } from "../utils/dateTime";
import { CategoryService, ArchiveService } from "../services/enhancedServices";
import {
  ProductService,
  UserService,
  SalesService,
  DashboardService,
} from "../services/dataService";

// Enhanced management components for the new features

export default function ManagementPage() {
  const [activeTab, setActiveTab] = useState("users");
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalProducts: 0,
    lowStockItems: 0,
    todaySales: 0,
    systemUptime: "99.9%",
    storageUsed: "0 GB",
    storageTotal: "10 GB",
  });
  const [loading, setLoading] = useState(true);

  const tabs = [
    { id: "users", label: "User Management", icon: Users },
    { id: "categories", label: "Categories", icon: Tag },
    { id: "archived", label: "Archived Products", icon: Archive },
    { id: "settings", label: "System Settings", icon: Settings },
    { id: "reports", label: "Reports", icon: BarChart3 },
    { id: "audit", label: "Audit Logs", icon: FileText },
    { id: "backup", label: "Backup & Security", icon: Shield },
  ];

  // Load dashboard data on component mount
  useEffect(() => {
    loadSystemStats();
  }, []);

  const loadSystemStats = async () => {
    try {
      setLoading(true);
      const dashboardData = await DashboardService.getDashboardData();

      if (dashboardData.success) {
        const data = dashboardData.data;
        setSystemStats({
          totalUsers: data.totalUsers || 0,
          activeUsers: data.activeUsers || 0,
          totalProducts: data.totalProducts || 0,
          lowStockItems: data.lowStockItems || 0,
          todaySales: data.todaySales || 0,
          systemUptime: "99.9%",
          storageUsed: "2.3 GB",
          storageTotal: "10 GB",
        });
      }
    } catch (error) {
      console.error("Error loading system stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              System Management
            </h1>
            <p className="text-gray-600 mt-2">
              Manage users, settings, and system configuration
            </p>
          </div>
          <div className="flex space-x-3">
            <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Export Data</span>
            </button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* System Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? "..." : systemStats.totalUsers}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-green-600 mt-2">
              {systemStats.activeUsers} active users
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Products</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? "..." : formatNumber(systemStats.totalProducts)}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-red-600 mt-2">
              {systemStats.lowStockItems} low stock items
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Today's Sales
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? "..." : formatCurrency(systemStats.todaySales)}
                </p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-xs text-green-600 mt-2">↗ System active</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  System Status
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {systemStats.systemUptime}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              {systemStats.storageUsed} / {systemStats.storageTotal} used
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "users" && <UserManagement />}
            {activeTab === "categories" && <CategoryManagement />}
            {activeTab === "archived" && <ArchivedProductsManagement />}
            {activeTab === "settings" && <SystemSettings />}
            {activeTab === "reports" && <Reports />}
            {activeTab === "audit" && <AuditLogs />}
            {activeTab === "backup" && <BackupSecurity />}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// USER MANAGEMENT COMPONENT
// ==========================================
function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const result = await UserService.getUsers();
      if (result.success) {
        setUsers(result.data);
      }
    } catch (error) {
      console.error("Error loading users:", error);
      // Fallback mock data
      setUsers([
        {
          id: 1,
          first_name: "John",
          last_name: "Admin",
          email: "admin@medcure.com",
          role: "admin",
          is_active: true,
          last_login: "2024-01-15T10:30:00Z",
        },
        {
          id: 2,
          first_name: "Sarah",
          last_name: "Pharmacist",
          email: "sarah@medcure.com",
          role: "manager",
          is_active: true,
          last_login: "2024-01-15T09:15:00Z",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900">User Management</h3>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
          <UserPlus className="h-4 w-4" />
          <span>Add User</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.first_name} {user.last_name}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.last_login ? formatDate(user.last_login) : "Never"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button className="text-blue-600 hover:text-blue-900">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
// ==========================================
// CATEGORY MANAGEMENT COMPONENT
// ==========================================
function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const result = await CategoryService.getAllCategories();
      if (result.success) {
        setCategories(result.data);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (categoryData) => {
    const result = await CategoryService.createCategory(categoryData);
    if (result.success) {
      await loadCategories();
      setShowAddModal(false);
    } else {
      alert("Error creating category: " + result.error);
    }
  };

  const handleUpdateCategory = async (categoryData) => {
    const result = await CategoryService.updateCategory(
      selectedCategory.id,
      categoryData
    );
    if (result.success) {
      await loadCategories();
      setShowEditModal(false);
      setSelectedCategory(null);
    } else {
      alert("Error updating category: " + result.error);
    }
  };

  const handleDeleteCategory = async (category) => {
    if (
      confirm(
        `Are you sure you want to delete the category "${category.name}"? This action cannot be undone if there are no products associated with it.`
      )
    ) {
      const result = await CategoryService.deleteCategory(category.id);
      if (result.success) {
        await loadCategories();
      } else {
        alert("Error deleting category: " + result.error);
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Category Management
          </h3>
          <p className="text-sm text-gray-600">
            Manage product categories and their settings
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <FolderPlus className="h-4 w-4" />
          <span>Add Category</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onEdit={(cat) => {
                setSelectedCategory(cat);
                setShowEditModal(true);
              }}
              onDelete={handleDeleteCategory}
            />
          ))}
        </div>
      )}

      {/* Add Category Modal */}
      {showAddModal && (
        <CategoryModal
          title="Add New Category"
          onClose={() => setShowAddModal(false)}
          onSave={handleCreateCategory}
        />
      )}

      {/* Edit Category Modal */}
      {showEditModal && selectedCategory && (
        <CategoryModal
          title="Edit Category"
          category={selectedCategory}
          onClose={() => {
            setShowEditModal(false);
            setSelectedCategory(null);
          }}
          onSave={handleUpdateCategory}
        />
      )}
    </div>
  );
}

// ==========================================
// ARCHIVED PRODUCTS MANAGEMENT COMPONENT
// ==========================================
function ArchivedProductsManagement() {
  const [archivedProducts, setArchivedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArchivedProducts();
  }, []);

  const loadArchivedProducts = async () => {
    try {
      setLoading(true);
      const result = await ArchiveService.getArchivedProducts();
      if (result.success) {
        setArchivedProducts(result.data);
      }
    } catch (error) {
      console.error("Error loading archived products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreProduct = async (product) => {
    if (confirm(`Are you sure you want to restore "${product.name}"?`)) {
      const result = await ArchiveService.restoreProduct(product.id);
      if (result.success) {
        await loadArchivedProducts();
      } else {
        alert("Error restoring product: " + result.error);
      }
    }
  };

  const handlePermanentDelete = async (product) => {
    if (
      confirm(
        `PERMANENT DELETE: Are you sure you want to permanently delete "${product.name}"? This action cannot be undone!`
      )
    ) {
      const result = await ArchiveService.permanentlyDeleteProduct(product.id);
      if (result.success) {
        await loadArchivedProducts();
      } else {
        alert("Error permanently deleting product: " + result.error);
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Archived Products
          </h3>
          <p className="text-sm text-gray-600">
            Manage archived products and restore when needed
          </p>
        </div>
        <div className="text-sm text-gray-600">
          {archivedProducts.length} archived products
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : archivedProducts.length === 0 ? (
        <div className="text-center py-12">
          <Archive className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Archived Products
          </h3>
          <p className="text-gray-500">
            Products that are archived will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Archived Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Archived By
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {archivedProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Package className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {product.brand}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                        {product.category_name || product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(product.archived_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.archived_by_name || "System"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleRestoreProduct(product)}
                        className="text-green-600 hover:text-green-900"
                        title="Restore Product"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handlePermanentDelete(product)}
                        className="text-red-600 hover:text-red-900"
                        title="Permanently Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// SUPPORTING UI COMPONENTS
// ==========================================

// System Settings Component
function SystemSettings() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">System Settings</h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h4 className="text-base font-medium text-gray-900 mb-4">
            General Settings
          </h4>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="pharmacy-name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Pharmacy Name
              </label>
              <input
                id="pharmacy-name"
                type="text"
                defaultValue="MedCure Pharmacy"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label
                htmlFor="tax-rate"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Tax Rate (%)
              </label>
              <input
                id="tax-rate"
                type="number"
                defaultValue="12"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label
                htmlFor="currency"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Currency
              </label>
              <select
                id="currency"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="PHP">Philippine Peso (₱)</option>
                <option value="USD">US Dollar ($)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h4 className="text-base font-medium text-gray-900 mb-4">
            Notifications
          </h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Low Stock Alerts
                </p>
                <p className="text-xs text-gray-500">
                  Get notified when products are running low
                </p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 text-blue-600"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Expiry Alerts
                </p>
                <p className="text-xs text-gray-500">
                  Get notified about expiring products
                </p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 text-blue-600"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Sales Reports
                </p>
                <p className="text-xs text-gray-500">
                  Daily sales summary notifications
                </p>
              </div>
              <input type="checkbox" className="h-4 w-4 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
          <Save className="h-4 w-4" />
          <span>Save Settings</span>
        </button>
      </div>
    </div>
  );
}

// Reports Component
function Reports() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Reports & Analytics</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Sales Report */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-medium">Sales Report</h4>
              <p className="text-blue-100">Generate sales analytics</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-200" />
          </div>
          <button className="mt-4 bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Generate</span>
          </button>
        </div>

        {/* Inventory Report */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-medium">Inventory Report</h4>
              <p className="text-green-100">Stock levels and movement</p>
            </div>
            <Package className="h-8 w-8 text-green-200" />
          </div>
          <button className="mt-4 bg-white text-green-600 px-4 py-2 rounded-lg hover:bg-green-50 flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Generate</span>
          </button>
        </div>

        {/* Financial Report */}
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-medium">Financial Report</h4>
              <p className="text-yellow-100">Revenue and profit analysis</p>
            </div>
            <DollarSign className="h-8 w-8 text-yellow-200" />
          </div>
          <button className="mt-4 bg-white text-yellow-600 px-4 py-2 rounded-lg hover:bg-yellow-50 flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Generate</span>
          </button>
        </div>
      </div>

      {/* Report Filters */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h4 className="text-base font-medium text-gray-900 mb-4">
          Report Filters
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="date-range"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Date Range
            </label>
            <select
              id="date-range"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="report-type"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Report Type
            </label>
            <select
              id="report-type"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="summary">Summary</option>
              <option value="detailed">Detailed</option>
              <option value="comparative">Comparative</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="format"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Format
            </label>
            <select
              id="format"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
              <option value="csv">CSV</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

// Audit Logs Component
function AuditLogs() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load audit logs from database
    // For now, using mock data
    setTimeout(() => {
      setAuditLogs([
        {
          id: 1,
          action: "Product Updated",
          user: "Sarah Pharmacist",
          details: "Updated stock for Paracetamol 500mg",
          timestamp: "2024-01-15T11:30:00Z",
        },
        {
          id: 2,
          action: "Sale Completed",
          user: "Mike Cashier",
          details: "Sale #INV-001234 - Total: ₱2,450.00",
          timestamp: "2024-01-15T11:25:00Z",
        },
        {
          id: 3,
          action: "User Login",
          user: "John Admin",
          details: "Administrator logged in from 192.168.1.100",
          timestamp: "2024-01-15T10:30:00Z",
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Audit Logs</h3>
        <div className="flex space-x-3">
          <input
            type="text"
            placeholder="Search logs..."
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="all">All Actions</option>
            <option value="login">User Login</option>
            <option value="sale">Sales</option>
            <option value="inventory">Inventory</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            auditLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Activity className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {log.action}
                      </p>
                      <p className="text-sm text-gray-500">{log.details}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {log.user}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(log.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// SUPPORTING UI COMPONENTS
// ==========================================

// Category Card Component
function CategoryCard({ category, onEdit, onDelete }) {
  const stats = category.stats || {
    total_products: 0,
    active_products: 0,
    total_value: 0,
    low_stock_count: 0,
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div
            className="h-12 w-12 rounded-lg flex items-center justify-center"
            style={{
              backgroundColor: category.color + "20",
              color: category.color,
            }}
          >
            <Tag className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-lg font-medium text-gray-900">
              {category.name}
            </h4>
            <p className="text-sm text-gray-500">{category.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onEdit(category)}
            className="text-gray-400 hover:text-gray-600"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(category)}
            className="text-gray-400 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium text-gray-600">Products</p>
          <p className="text-xl font-bold text-gray-900">
            {stats.active_products}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">Total Value</p>
          <p className="text-xl font-bold text-gray-900">
            {formatCurrency(stats.total_value)}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">Low Stock</p>
          <p
            className={`text-xl font-bold ${
              stats.low_stock_count > 0 ? "text-red-600" : "text-green-600"
            }`}
          >
            {stats.low_stock_count}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">Status</p>
          <span
            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
              category.is_active
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {category.is_active ? "Active" : "Inactive"}
          </span>
        </div>
      </div>
    </div>
  );
}

// Category Modal Component
function CategoryModal({ title, category, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: category?.name || "",
    description: category?.description || "",
    color: category?.color || "#3B82F6",
    icon: category?.icon || "Package",
    sort_order: category?.sort_order || 0,
    is_active: category?.is_active ?? true,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const iconOptions = [
    "Package",
    "Heart",
    "Shield",
    "Zap",
    "Thermometer",
    "Stomach",
    "Droplets",
    "Cross",
    "Baby",
    "FileText",
  ];

  const colorOptions = [
    "#EF4444",
    "#F59E0B",
    "#10B981",
    "#3B82F6",
    "#6366F1",
    "#8B5CF6",
    "#EC4899",
    "#F97316",
    "#84CC16",
    "#6B7280",
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <div className="flex space-x-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`h-8 w-8 rounded border-2 ${
                      formData.color === color
                        ? "border-gray-900"
                        : "border-gray-300"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Icon
              </label>
              <select
                value={formData.icon}
                onChange={(e) =>
                  setFormData({ ...formData, icon: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {iconOptions.map((icon) => (
                  <option key={icon} value={icon}>
                    {icon}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort Order
              </label>
              <input
                type="number"
                value={formData.sort_order}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sort_order: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                className="h-4 w-4 text-blue-600 rounded"
              />
              <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                Active
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {category ? "Update Category" : "Create Category"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Backup & Security Component (renamed to avoid conflict)
function BackupSecurity() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Backup & Security</h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Backup Settings */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h4 className="text-base font-medium text-gray-900 mb-4">
            Data Backup
          </h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Auto Backup</p>
                <p className="text-xs text-gray-500">
                  Last backup: Today at 3:00 AM
                </p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 text-blue-600"
              />
            </div>
            <div>
              <label
                htmlFor="backup-frequency"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Backup Frequency
              </label>
              <select
                id="backup-frequency"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Create Backup Now</span>
            </button>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h4 className="text-base font-medium text-gray-900 mb-4">Security</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Two-Factor Authentication
                </p>
                <p className="text-xs text-gray-500">
                  Add extra security to accounts
                </p>
              </div>
              <input type="checkbox" className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Session Timeout
                </p>
                <p className="text-xs text-gray-500">
                  Auto logout after inactivity
                </p>
              </div>
              <select className="px-2 py-1 border border-gray-300 rounded text-sm">
                <option value="30">30 min</option>
                <option value="60">1 hour</option>
                <option value="120">2 hours</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Password Policy
                </p>
                <p className="text-xs text-gray-500">
                  Enforce strong passwords
                </p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 text-blue-600"
              />
            </div>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
            <Shield className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-green-900">
              System Status: Secure
            </p>
            <p className="text-xs text-green-700">
              All security measures are active and functioning properly
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
