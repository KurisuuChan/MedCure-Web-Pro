import React, { useState, useEffect } from "react";
import {
  Users,
  Settings,
  FileText,
  Shield,
  Activity,
  Tag,
  Archive,
  DollarSign,
  Package,
  RefreshCw,
  Info,
} from "lucide-react";
import { formatCurrency, formatNumber } from "../utils/formatting";
import { DashboardService } from "../services/domains/analytics/dashboardService";
import { supabase } from "../config/supabase";
import { UnifiedCategoryService } from "../services/domains/inventory/unifiedCategoryService";
import LoginTrackingTest from "../components/admin/LoginTrackingTest";

export default function ManagementPage() {
  const [activeTab, setActiveTab] = useState("categories");
  const [systemStats, setSystemStats] = useState({
    totalProducts: 0,
    lowStockItems: 0,
    todaySales: 0,
    systemUptime: "99.9%",
    storageUsed: "2.3 GB",
    storageTotal: "10 GB",
  });
  const [loading, setLoading] = useState(true);

  const tabs = [
    { id: "categories", label: "Categories", icon: Tag },
    { id: "archived", label: "Archived Products", icon: Archive },
    { id: "settings", label: "System Settings", icon: Settings },
    { id: "audit", label: "Audit Logs", icon: FileText },
    { id: "backup", label: "Backup & Security", icon: Shield },
    { id: "debug", label: "Login Debug", icon: Activity },
  ];

  // Load dashboard data on component mount
  useEffect(() => {
    loadSystemStats();
  }, []);

  const loadSystemStats = async () => {
    try {
      setLoading(true);
      console.log("🔄 [Management] Loading system stats...");

      const dashboardResult = await DashboardService.getDashboardData();
      if (dashboardResult.success && dashboardResult.data) {
        const { analytics } = dashboardResult.data;
        if (analytics) {
          setSystemStats((prev) => ({
            ...prev,
            totalProducts: analytics.totalProducts || 0,
            lowStockItems: analytics.lowStockProducts || 0,
            todaySales: analytics.todaysSales || 0,
          }));
        }
      }

      console.log("✅ [Management] System stats loaded successfully");
    } catch (error) {
      console.error("❌ [Management] Error loading system stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-orange-100 p-3 rounded-xl">
                  <Users className="h-8 w-8 text-orange-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                    <span>System Administration</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      Admin
                    </span>
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Core system configuration, security, and administrative
                    controls
                  </p>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={loadSystemStats}
                  className="group flex items-center space-x-2 px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 hover:border-gray-300 transition-all duration-200"
                >
                  <Activity className="h-4 w-4 group-hover:text-blue-600" />
                  <span>Refresh Stats</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Overview Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Products
                </p>
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
                  System Health
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {systemStats.systemUptime}
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {systemStats.storageUsed}/{systemStats.storageTotal} storage
            </p>
          </div>
        </div>

        {/* Admin Access Info Panel */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-1">
                Admin Access Required
              </h3>
              <p className="text-sm text-blue-700 mb-3">
                Management features require admin privileges. For testing, use
                these credentials:
              </p>
              <div className="bg-white rounded p-3 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <strong>Admin:</strong>
                    <br />
                    Email: admin@medcure.com
                    <br />
                    Password: admin123
                  </div>
                  <div>
                    <strong>Manager:</strong>
                    <br />
                    Email: manager@medcure.com
                    <br />
                    Password: manager123
                  </div>
                  <div>
                    <strong>Staff:</strong>
                    <br />
                    Email: staff@medcure.com
                    <br />
                    Password: staff123
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
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
            {activeTab === "categories" && <CategoryManagement />}
            {activeTab === "archived" && <ArchivedProductsManagement />}
            {activeTab === "settings" && <SystemSettings />}
            {activeTab === "audit" && <AuditLogs />}
            {activeTab === "backup" && <BackupSecurity />}
            {activeTab === "debug" && <LoginTrackingTest />}
          </div>
        </div>
      </div>
    </div>
  );
}

// Category Management Component - Now with real Supabase integration
function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);

      console.log(
        "🏷️ [ManagementPage] Loading categories via UnifiedCategoryService"
      );

      // Use the unified category service
      const result = await UnifiedCategoryService.getAllCategories({
        activeOnly: true,
      });

      if (result.success) {
        setCategories(result.data || []);
        console.log(
          `✅ [ManagementPage] Loaded ${result.data.length} categories`
        );
      } else {
        console.error(
          "❌ [ManagementPage] Error loading categories:",
          result.error
        );
        setCategories([]);
      }
    } catch (error) {
      console.error("❌ [ManagementPage] Error loading categories:", error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (categoryData) => {
    try {
      console.log(
        "➕ [ManagementPage] Creating category via enhanced UnifiedCategoryService"
      );

      const result = await UnifiedCategoryService.createCategory(categoryData, {
        userId: "current-user", // Replace with actual user ID
        source: "management_page",
        description: "Manual category creation from Management UI"
      });

      if (result.success) {
        // Handle different response types
        if (result.action === "existing") {
          console.log("ℹ️ [ManagementPage] Category already exists:", result.message);
          alert(`Info: ${result.message}`);
          setCategories([...categories]); // Refresh to show existing category
        } else if (result.action === "similar_found") {
          // Handle similar category found
          const useExisting = window.confirm(
            `${result.message}\n\nDo you want to use the existing category "${result.existingCategory.name}" instead?`
          );
          
          if (useExisting) {
            console.log("✅ [ManagementPage] User chose to use existing similar category");
            setCategories([...categories]); // Refresh categories
          } else {
            // Ask for a different name
            const newName = window.prompt(
              `Please enter a different name for the category:`,
              result.proposedCategory.name + " (New)"
            );
            
            if (newName && newName.trim()) {
              // Retry with new name
              const retryResult = await UnifiedCategoryService.createCategory({
                ...categoryData,
                name: newName.trim()
              }, {
                userId: "current-user",
                source: "management_page",
                description: "Manual category creation with renamed category"
              });
              
              if (retryResult.success) {
                console.log("✅ [ManagementPage] Category created with new name");
                setCategories([...categories, retryResult.data]);
                setShowCreateModal(false);
              } else {
                alert(`Failed to create category: ${retryResult.message}`);
              }
            }
          }
        } else if (result.action === "created") {
          console.log("✅ [ManagementPage] Category created successfully:", result.message);
          setCategories([...categories, result.data]);
          setShowCreateModal(false);
          
          // Show success message
          if (result.data) {
            alert(`Success: Category "${result.data.name}" created successfully!`);
          }
        }
      } else {
        console.error(
          "❌ [ManagementPage] Error creating category:",
          result.error
        );
        alert(`Failed to create category: ${result.message || result.error}`);
      }
    } catch (error) {
      console.error("❌ [ManagementPage] Error creating category:", error);
      alert("Failed to create category");
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm("Are you sure you want to delete this category?"))
      return;

    try {
      console.log(`🗑️ [ManagementPage] Deleting category ${categoryId}`);

      const result = await UnifiedCategoryService.deleteCategory(categoryId, {
        userId: "current-user", // Replace with actual user ID
      });

      if (result.success) {
        console.log("✅ [ManagementPage] Category deleted successfully");
        setCategories(categories.filter((cat) => cat.id !== categoryId));
      } else {
        console.error(
          "❌ [ManagementPage] Error deleting category:",
          result.error
        );
        alert(`Failed to delete category: ${result.error}`);
      }
    } catch (error) {
      console.error("❌ [ManagementPage] Error deleting category:", error);
      alert("Failed to delete category");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-blue-600 mr-2" />
        <span>Loading categories...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Category Management
        </h3>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Tag className="h-4 w-4" />
          <span>Add Category</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <div
            key={category.id}
            className="bg-white border border-gray-200 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: category.color }}
                ></div>
                <h4 className="font-medium text-gray-900">{category.name}</h4>
              </div>
              <button
                onClick={() => handleDeleteCategory(category.id)}
                className="text-red-600 hover:text-red-800"
              >
                <Archive className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-gray-600">{category.description}</p>
          </div>
        ))}
      </div>

      {showCreateModal && (
        <CreateCategoryModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateCategory}
        />
      )}
    </div>
  );
}

function ArchivedProductsManagement() {
  const [archivedProducts, setArchivedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArchivedProducts();
  }, []);

  const loadArchivedProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_archived", true)
        .order("archived_at", { ascending: false });

      if (error) throw error;
      setArchivedProducts(data || []);
    } catch (error) {
      console.error("Error loading archived products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreProduct = async (productId) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({
          is_archived: false,
          archived_at: null,
          archived_by: null,
          archive_reason: null,
        })
        .eq("id", productId);

      if (error) throw error;
      setArchivedProducts(
        archivedProducts.filter((product) => product.id !== productId)
      );
    } catch (error) {
      console.error("Error restoring product:", error);
      alert("Failed to restore product");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-blue-600 mr-2" />
        <span>Loading archived products...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Archived Products</h3>
        <span className="text-sm text-gray-500">
          {archivedProducts.length} items
        </span>
      </div>

      {archivedProducts.length === 0 ? (
        <div className="text-center py-12">
          <Archive className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">No archived products found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Archived Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {archivedProducts.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {product.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {product.brand}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.archived_at
                      ? new Date(product.archived_at).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.archive_reason || "No reason provided"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleRestoreProduct(product.id)}
                      className="text-green-600 hover:text-green-900"
                    >
                      Restore
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

function SystemSettings() {
  return (
    <div className="text-center py-12">
      <Settings className="h-16 w-16 mx-auto mb-4 text-gray-300" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        System Settings
      </h3>
      <p className="text-gray-500 max-w-md mx-auto">
        Configure global system preferences, default values, currency settings,
        and other administrative options that affect the entire application.
      </p>
      <button className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
        Open Settings
      </button>
    </div>
  );
}

function AuditLogs() {
  return (
    <div className="text-center py-12">
      <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Audit Logs</h3>
      <p className="text-gray-500 max-w-md mx-auto">
        Review comprehensive system activity logs, user actions, security
        events, and compliance tracking for full operational transparency.
      </p>
      <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
        View Logs
      </button>
    </div>
  );
}

function BackupSecurity() {
  return (
    <div className="text-center py-12">
      <Shield className="h-16 w-16 mx-auto mb-4 text-gray-300" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Backup & Security
      </h3>
      <p className="text-gray-500 max-w-md mx-auto">
        Manage automated backups, security policies, data retention settings,
        and recovery procedures to ensure data safety and compliance.
      </p>
      <button className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
        Security Center
      </button>
    </div>
  );
}

// Create Category Modal Component
const CreateCategoryModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3B82F6",
    icon: "Package",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Create Category
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Color
              </label>
              <input
                type="color"
                value={formData.color}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })
                }
                className="mt-1 block w-full h-10 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
              >
                Create Category
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
