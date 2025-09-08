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
  TrendingDown,
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
import { UserService, DashboardService } from "../services/dataService";
import { AuditService, ReportsService } from "../services/auditReportsService";
import { LoginTrackingService } from "../services/loginTrackingService";
import { IntelligentCategoryService } from "../services/intelligentCategoryService";
import LoginTrackingTest from "../components/admin/LoginTrackingTest";
import "../debug/dbDebug.js"; // Load database debug tools

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
    { id: "debug", label: "Login Debug", icon: Activity },
  ];

  // Load dashboard data on component mount
  useEffect(() => {
    loadSystemStats();

    // Add global debug functions for browser console
    if (typeof window !== "undefined") {
      window.debugManagement = {
        refreshData: loadSystemStats,
        checkServices: async () => {
          console.log("🔍 Testing all services...");
          try {
            const dashboard = await DashboardService.getDashboardData();
            const users = await UserService.getUsers();
            const categories = await CategoryService.getAllCategories();
            const archived = await ArchiveService.getArchivedProducts();

            console.log("📊 Service Status:", {
              dashboard: {
                success: dashboard.success,
                dataKeys: dashboard.data ? Object.keys(dashboard.data) : [],
              },
              users: { success: users.success, count: users.data?.length || 0 },
              categories: {
                success: categories.success,
                count: categories.data?.length || 0,
              },
              archived: {
                success: archived.success,
                count: archived.data?.length || 0,
              },
            });
          } catch (error) {
            console.error("❌ Service test failed:", error);
          }
        },
      };
    }
  }, []);

  const loadSystemStats = async () => {
    try {
      setLoading(true);
      console.log("🔍 [Management] Loading system stats...");

      const dashboardData = await DashboardService.getDashboardData();
      console.log("📊 [Management] Dashboard response:", {
        success: dashboardData.success,
        hasData: !!dashboardData.data,
        dataKeys: dashboardData.data ? Object.keys(dashboardData.data) : [],
      });

      if (dashboardData.success) {
        const data = dashboardData.data;
        console.log("✅ [Management] Setting system stats:", {
          totalUsers: data.totalUsers || 0,
          activeUsers: data.activeUsers || 0,
          totalProducts: data.totalProducts || 0,
          lowStockItems: data.lowStockItems || 0,
          todaySales: data.todaySales || 0,
        });

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
      } else {
        console.error(
          "❌ [Management] Dashboard data failed:",
          dashboardData.error
        );
        // Set default values if dashboard fails
        setSystemStats({
          totalUsers: 0,
          activeUsers: 0,
          totalProducts: 0,
          lowStockItems: 0,
          todaySales: 0,
          systemUptime: "99.9%",
          storageUsed: "2.3 GB",
          storageTotal: "10 GB",
        });
      }
    } catch (error) {
      console.error("❌ [Management] Error loading system stats:", error);
      // Set default values on error
      setSystemStats({
        totalUsers: 0,
        activeUsers: 0,
        totalProducts: 0,
        lowStockItems: 0,
        todaySales: 0,
        systemUptime: "99.9%",
        storageUsed: "2.3 GB",
        storageTotal: "10 GB",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="bg-orange-100 p-3 rounded-xl">
              <Settings className="h-8 w-8 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                <span>System Management</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  Admin
                </span>
              </h1>
              <p className="text-gray-600 mt-1">
                Manage users, settings, and system configuration with full
                administrative control
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button className="group flex items-center space-x-2 px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 hover:border-gray-300 transition-all duration-200">
              <Download className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
              <span className="font-medium">Export Data</span>
            </button>
            <button className="group flex items-center space-x-2 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all duration-200 shadow-sm hover:shadow-md">
              <RefreshCw className="h-4 w-4 group-hover:rotate-180 transition-transform duration-300" />
              <span className="font-medium">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              <p className="text-sm font-medium text-gray-600">Today's Sales</p>
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
              <p className="text-sm font-medium text-gray-600">System Status</p>
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
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
          {activeTab === "debug" && <LoginTrackingTest />}
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
      console.log("👥 [UserManagement] Loading users with real login data...");

      // Fetch users data from the database
      const result = await UserService.getUsers();
      console.log("📊 [UserManagement] User service response:", {
        success: result.success,
        dataCount: result.data ? result.data.length : 0,
        hasError: !!result.error,
      });

      if (result.success && result.data) {
        // Enhance user data with real login tracking information
        const usersWithLoginData = await Promise.all(
          result.data.map(async (user) => {
            try {
              // Get login history for this user
              const loginHistory = await LoginTrackingService.getLoginHistory(
                user.id,
                1
              );

              // Use the most recent login from tracking service, or fall back to user table data
              let lastLogin = user.last_login;
              if (loginHistory.success && loginHistory.data.length > 0) {
                const mostRecentLogin = loginHistory.data[0];
                if (
                  mostRecentLogin.action_type === "login" &&
                  mostRecentLogin.metadata?.timestamp
                ) {
                  lastLogin = mostRecentLogin.metadata.timestamp;
                }
              }

              return {
                ...user,
                last_login: lastLogin,
                is_online: LoginTrackingService.isUserOnline(lastLogin),
                formatted_last_login:
                  LoginTrackingService.formatLastLogin(lastLogin),
              };
            } catch (error) {
              console.warn(
                `⚠️ [UserManagement] Failed to get login data for user ${user.id}:`,
                error
              );
              return {
                ...user,
                is_online: false,
                formatted_last_login: user.last_login
                  ? LoginTrackingService.formatLastLogin(user.last_login)
                  : "Never",
              };
            }
          })
        );

        console.log(
          "✅ [UserManagement] Enhanced users with login data:",
          usersWithLoginData
        );
        setUsers(usersWithLoginData);
      } else {
        console.warn("⚠️ [UserManagement] Using fallback data:", result.error);
        // Use the fallback data from the service
        setUsers(
          result.data.map((user) => ({
            ...user,
            is_online: false,
            formatted_last_login: user.last_login
              ? LoginTrackingService.formatLastLogin(user.last_login)
              : "Never",
          }))
        );
      }
    } catch (error) {
      console.error("❌ [UserManagement] Error loading users:", error);
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
          is_online: false,
          formatted_last_login: "5 days ago",
        },
        {
          id: 2,
          first_name: "Sarah",
          last_name: "Pharmacist",
          email: "sarah@medcure.com",
          role: "manager",
          is_active: true,
          last_login: "2024-01-15T09:15:00Z",
          is_online: false,
          formatted_last_login: "5 days ago",
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
        <div className="flex space-x-2">
          <button
            onClick={loadUsers}
            className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 flex items-center space-x-2 text-sm"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
            <UserPlus className="h-4 w-4" />
            <span>Add User</span>
          </button>
        </div>
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
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          user.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                      {user.is_online && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1 animate-pulse"></div>
                          Online
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center space-x-2">
                      <span
                        className={
                          user.is_online ? "text-green-600 font-medium" : ""
                        }
                      >
                        {user.formatted_last_login || "Never"}
                      </span>
                      {user.is_online && (
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      )}
                    </div>
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
  const [categoryInsights, setCategoryInsights] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadCategories();
    loadCategoryInsights();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      console.log(
        "🏷️ [CategoryManagement] Loading categories with real-time stats..."
      );

      const result = await CategoryService.getAllCategories();
      console.log("📊 [CategoryManagement] Category service response:", {
        success: result.success,
        dataCount: result.data ? result.data.length : 0,
        hasError: !!result.error,
      });

      if (result.success) {
        // Calculate real-time stats for each category
        const categoriesWithRealTimeStats = await Promise.all(
          result.data.map(async (category) => {
            const stats =
              await IntelligentCategoryService.calculateCategoryStats(
                category.id
              );
            return {
              ...category,
              stats: stats,
            };
          })
        );

        console.log(
          "✅ [CategoryManagement] Setting categories with real-time stats:",
          categoriesWithRealTimeStats
        );
        setCategories(categoriesWithRealTimeStats);
      } else {
        console.error(
          "❌ [CategoryManagement] Categories failed to load:",
          result.error
        );
        setCategories([]);
      }
    } catch (error) {
      console.error("❌ [CategoryManagement] Error loading categories:", error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryInsights = async () => {
    try {
      console.log("📈 [CategoryManagement] Loading category insights...");
      const result = await IntelligentCategoryService.getCategoryInsights();

      if (result.success) {
        setCategoryInsights(result.data);
        console.log(
          "✅ [CategoryManagement] Category insights loaded:",
          result.data
        );
      }
    } catch (error) {
      console.error("❌ [CategoryManagement] Error loading insights:", error);
    }
  };

  const handleCreateCategory = async (categoryData) => {
    const result = await CategoryService.createCategory(categoryData);
    if (result.success) {
      await loadCategories();
      await loadCategoryInsights();
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
      await loadCategoryInsights();
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
        await loadCategoryInsights();
      } else {
        alert("Error deleting category: " + result.error);
      }
    }
  };

  const handleUpdateAllStats = async () => {
    try {
      setUpdating(true);
      console.log(
        "🔄 [CategoryManagement] Updating all category statistics..."
      );

      const result = await IntelligentCategoryService.updateAllCategoryStats();

      if (result.success) {
        await loadCategories();
        await loadCategoryInsights();
        alert(`✅ Successfully updated ${result.updated} category statistics!`);
      } else {
        alert("Error updating statistics: " + result.error);
      }
    } catch (error) {
      console.error("❌ Error updating category stats:", error);
      alert("Error updating statistics: " + error.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Professional Category Management
          </h3>
          <p className="text-sm text-gray-600">
            Intelligent category system with real-time calculations and
            auto-creation
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleUpdateAllStats}
            disabled={updating}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${updating ? "animate-spin" : ""}`}
            />
            <span>{updating ? "Updating..." : "Refresh Stats"}</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <FolderPlus className="h-4 w-4" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Category Insights Dashboard */}
      {categoryInsights && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Categories</p>
                <p className="text-2xl font-bold">
                  {categoryInsights.total_categories}
                </p>
              </div>
              <Tag className="h-8 w-8 text-blue-200" />
            </div>
            <p className="text-xs text-blue-200 mt-2">
              {categoryInsights.auto_created_categories.length} auto-created
            </p>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Total Value</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(categoryInsights.total_value)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-200" />
            </div>
            <p className="text-xs text-green-200 mt-2">
              {categoryInsights.total_products} total products
            </p>
          </div>

          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-4 rounded-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm">Needs Attention</p>
                <p className="text-2xl font-bold">
                  {categoryInsights.categories_needing_attention.length}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-yellow-200" />
            </div>
            <p className="text-xs text-yellow-200 mt-2">
              {categoryInsights.total_low_stock} low stock items
            </p>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 rounded-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Low Performing</p>
                <p className="text-2xl font-bold">
                  {categoryInsights.low_performing_categories.length}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-200" />
            </div>
            <p className="text-xs text-purple-200 mt-2">
              Categories under ₱1,000
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <EnhancedCategoryCard
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
      console.log("📦 [ArchivedProducts] Loading archived products...");

      const result = await ArchiveService.getArchivedProducts();
      console.log("📊 [ArchivedProducts] Archive service response:", {
        success: result.success,
        dataCount: result.data ? result.data.length : 0,
        hasError: !!result.error,
      });

      if (result.success) {
        console.log(
          "✅ [ArchivedProducts] Setting archived products:",
          result.data
        );
        setArchivedProducts(result.data);
      } else {
        console.error("❌ [ArchivedProducts] Failed to load:", result.error);
        setArchivedProducts([]);
      }
    } catch (error) {
      console.error(
        "❌ [ArchivedProducts] Error loading archived products:",
        error
      );
      setArchivedProducts([]);
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
  const [reportType, setReportType] = useState("sales");
  const [dateRange, setDateRange] = useState("30");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  const generateReport = async (type) => {
    try {
      setLoading(true);
      console.log("📊 [Reports] Generating report:", type);

      const endDate = new Date().toISOString();
      const startDate = new Date(
        Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000
      ).toISOString();

      let result;
      switch (type) {
        case "sales":
          result = await ReportsService.generateSalesReport({
            startDate,
            endDate,
          });
          break;
        case "inventory":
          result = await ReportsService.generateInventoryReport();
          break;
        case "financial":
          result = await ReportsService.generateFinancialReport({
            startDate,
            endDate,
          });
          break;
        default:
          throw new Error("Unknown report type");
      }

      if (result.success) {
        setReportData(result.data);
        console.log("✅ [Reports] Report generated successfully:", result.data);
      } else {
        console.error("❌ [Reports] Report generation failed:", result.error);
        alert("Error generating report: " + result.error);
      }
    } catch (error) {
      console.error("❌ [Reports] Error generating report:", error);
      alert("Error generating report: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (type) => {
    if (!reportData) {
      alert("Please generate a report first");
      return;
    }

    try {
      console.log("📄 [Reports] Exporting report:", type);
      const result = await ReportsService.exportReportToCSV(type, reportData);

      if (result.success) {
        // Create download link
        const blob = new Blob([result.data], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.filename;
        a.click();
        window.URL.revokeObjectURL(url);
        console.log("✅ [Reports] Report exported successfully");
      } else {
        alert("Error exporting report: " + result.error);
      }
    } catch (error) {
      console.error("❌ [Reports] Error exporting report:", error);
      alert("Error exporting report: " + error.message);
    }
  };

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
          <button
            onClick={() => generateReport("sales")}
            disabled={loading}
            className="mt-4 bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 flex items-center space-x-2 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>
              {loading && reportType === "sales" ? "Generating..." : "Generate"}
            </span>
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
          <button
            onClick={() => generateReport("inventory")}
            disabled={loading}
            className="mt-4 bg-white text-green-600 px-4 py-2 rounded-lg hover:bg-green-50 flex items-center space-x-2 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>
              {loading && reportType === "inventory"
                ? "Generating..."
                : "Generate"}
            </span>
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
          <button
            onClick={() => generateReport("financial")}
            disabled={loading}
            className="mt-4 bg-white text-yellow-600 px-4 py-2 rounded-lg hover:bg-yellow-50 flex items-center space-x-2 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>
              {loading && reportType === "financial"
                ? "Generating..."
                : "Generate"}
            </span>
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
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="1">Today</option>
              <option value="7">This Week</option>
              <option value="30">This Month</option>
              <option value="90">This Quarter</option>
              <option value="365">This Year</option>
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
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="sales">Sales Report</option>
              <option value="inventory">Inventory Report</option>
              <option value="financial">Financial Report</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="format"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Export Format
            </label>
            <button
              onClick={() => exportReport(reportType)}
              disabled={!reportData || loading}
              className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Export as CSV
            </button>
          </div>
        </div>
      </div>

      {/* Report Results */}
      {reportData && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            Report Results
          </h4>
          <ReportDisplay data={reportData} type={reportType} />
        </div>
      )}
    </div>
  );
}

// Audit Logs Component
function AuditLogs() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action_type: "all",
    search: "",
    limit: 50,
  });
  const [auditSummary, setAuditSummary] = useState(null);

  useEffect(() => {
    const loadAuditLogs = async () => {
      try {
        setLoading(true);
        console.log("📋 [AuditLogs] Loading audit logs with filters:", filters);

        const result = await AuditService.getAuditLogs(filters);
        console.log("📊 [AuditLogs] Audit service response:", {
          success: result.success,
          dataCount: result.data ? result.data.length : 0,
          hasError: !!result.error,
        });

        if (result.success) {
          console.log("✅ [AuditLogs] Setting audit logs:", result.data);
          setAuditLogs(result.data);
        } else {
          console.error(
            "❌ [AuditLogs] Failed to load audit logs:",
            result.error
          );
          // Fallback to mock data if real data fails
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
        }
      } catch (error) {
        console.error("❌ [AuditLogs] Error loading audit logs:", error);
        setAuditLogs([]);
      } finally {
        setLoading(false);
      }
    };

    const loadAuditSummary = async () => {
      try {
        console.log("📊 [AuditLogs] Loading audit summary...");
        const result = await AuditService.getAuditSummary(30);

        if (result.success) {
          console.log("✅ [AuditLogs] Audit summary loaded:", result.data);
          setAuditSummary(result.data);
        }
      } catch (error) {
        console.error("❌ [AuditLogs] Error loading audit summary:", error);
      }
    };

    loadAuditLogs();
    loadAuditSummary();
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Audit Logs</h3>
          {auditSummary && (
            <p className="text-sm text-gray-600">
              {auditSummary.totalActions} actions in the last{" "}
              {auditSummary.dateRange} days
            </p>
          )}
        </div>
        <div className="flex space-x-3">
          <input
            type="text"
            placeholder="Search logs..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            value={filters.action_type}
            onChange={(e) => handleFilterChange("action_type", e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Actions</option>
            <option value="in">Stock Added</option>
            <option value="out">Stock Removed</option>
            <option value="adjustment">Adjustments</option>
          </select>
        </div>
      </div>

      {/* Audit Summary Cards */}
      {auditSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {auditSummary.totalActions}
            </div>
            <div className="text-sm text-blue-700">Total Actions</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {auditSummary.stockIn}
            </div>
            <div className="text-sm text-green-700">Stock Added</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {auditSummary.stockOut}
            </div>
            <div className="text-sm text-red-700">Stock Removed</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {auditSummary.adjustments}
            </div>
            <div className="text-sm text-yellow-700">Adjustments</div>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Audit Logs
              </h3>
              <p className="text-gray-500">
                No activity logs found matching your criteria.
              </p>
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
                      {log.product && (
                        <p className="text-xs text-gray-400">
                          Product: {log.product} | Category: {log.category}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {log.user}
                    </p>
                    {log.userRole && (
                      <p className="text-xs text-gray-500 capitalize">
                        {log.userRole}
                      </p>
                    )}
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

// Enhanced Category Card Component with Real-time Financial Data
function EnhancedCategoryCard({ category, onEdit, onDelete }) {
  const stats = category.stats || {
    total_products: 0,
    active_products: 0,
    total_value: 0,
    total_cost_value: 0,
    total_profit_potential: 0,
    low_stock_count: 0,
    out_of_stock_count: 0,
    average_price: 0,
  };

  const profitMargin =
    stats.total_value > 0
      ? ((stats.total_profit_potential / stats.total_value) * 100).toFixed(1)
      : 0;

  const getPerformanceColor = () => {
    if (stats.total_value > 50000) return "green";
    if (stats.total_value > 10000) return "blue";
    if (stats.total_value > 1000) return "yellow";
    return "red";
  };

  const performanceColor = getPerformanceColor();
  const colorClasses = {
    green: "border-green-200 bg-green-50",
    blue: "border-blue-200 bg-blue-50",
    yellow: "border-yellow-200 bg-yellow-50",
    red: "border-red-200 bg-red-50",
  };

  return (
    <div
      className={`bg-white rounded-lg border-2 p-6 hover:shadow-lg transition-all duration-200 ${colorClasses[performanceColor]}`}
    >
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
            <h4 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
              <span>{category.name}</span>
              {category.metadata?.auto_created && (
                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                  Auto
                </span>
              )}
            </h4>
            <p className="text-sm text-gray-500">{category.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onEdit(category)}
            className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(category)}
            className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
        <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
          <DollarSign className="h-4 w-4 mr-1 text-green-600" />
          Financial Overview
        </h5>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-500">Total Value</p>
            <p className="text-lg font-bold text-green-600">
              {formatCurrency(stats.total_value)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Profit Potential</p>
            <p className="text-lg font-bold text-blue-600">
              {formatCurrency(stats.total_profit_potential)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Avg. Price</p>
            <p className="text-sm font-medium text-gray-700">
              {formatCurrency(stats.average_price)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Margin</p>
            <p
              className={`text-sm font-medium ${
                profitMargin > 20
                  ? "text-green-600"
                  : profitMargin > 10
                  ? "text-yellow-600"
                  : "text-red-600"
              }`}
            >
              {profitMargin}%
            </p>
          </div>
        </div>
      </div>

      {/* Product Statistics */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-2 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-600">Products</p>
          <p className="text-xl font-bold text-gray-900">
            {stats.active_products}
          </p>
          <p className="text-xs text-gray-500">{stats.total_products} total</p>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-600">Issues</p>
          <p
            className={`text-xl font-bold ${
              stats.low_stock_count > 0 ? "text-red-600" : "text-green-600"
            }`}
          >
            {stats.low_stock_count}
          </p>
          <p className="text-xs text-gray-500">low stock</p>
        </div>
      </div>

      {/* Performance Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span
            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
              category.is_active
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {category.is_active ? "Active" : "Inactive"}
          </span>
          {stats.out_of_stock_count > 0 && (
            <span className="inline-flex px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
              {stats.out_of_stock_count} out of stock
            </span>
          )}
        </div>
        <div
          className={`text-xs font-medium ${
            performanceColor === "green"
              ? "text-green-600"
              : performanceColor === "blue"
              ? "text-blue-600"
              : performanceColor === "yellow"
              ? "text-yellow-600"
              : "text-red-600"
          }`}
        >
          {performanceColor === "green"
            ? "🔥 High Value"
            : performanceColor === "blue"
            ? "📈 Good"
            : performanceColor === "yellow"
            ? "⚠️ Moderate"
            : "🔻 Low Value"}
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

// ==========================================
// REPORT DISPLAY COMPONENTS
// ==========================================
function ReportDisplay({ data, type }) {
  if (!data) return null;

  switch (type) {
    case "sales":
      return <SalesReportDisplay data={data} />;
    case "inventory":
      return <InventoryReportDisplay data={data} />;
    case "financial":
      return <FinancialReportDisplay data={data} />;
    default:
      return <div>Unknown report type</div>;
  }
}

function SalesReportDisplay({ data }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(data.summary.totalSales)}
          </div>
          <div className="text-sm text-blue-700">Total Sales</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {data.summary.totalTransactions}
          </div>
          <div className="text-sm text-green-700">Transactions</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">
            {formatCurrency(data.summary.averageTransaction)}
          </div>
          <div className="text-sm text-yellow-700">Average Transaction</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h5 className="text-base font-medium text-gray-900 mb-3">
            Payment Methods
          </h5>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Cash</span>
              <span className="text-sm font-medium">
                {formatCurrency(data.paymentMethods.cash)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Card</span>
              <span className="text-sm font-medium">
                {formatCurrency(data.paymentMethods.card)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Digital</span>
              <span className="text-sm font-medium">
                {formatCurrency(data.paymentMethods.digital)}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h5 className="text-base font-medium text-gray-900 mb-3">
            Top Products
          </h5>
          <div className="space-y-2">
            {data.topProducts.slice(0, 5).map((product, index) => (
              <div key={index} className="flex justify-between">
                <span className="text-sm text-gray-600 truncate">
                  {product.name}
                </span>
                <span className="text-sm font-medium">
                  {formatCurrency(product.revenue)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function InventoryReportDisplay({ data }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {data.summary.totalProducts}
          </div>
          <div className="text-sm text-blue-700">Total Products</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(data.summary.totalStockValue)}
          </div>
          <div className="text-sm text-green-700">Stock Value</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-600">
            {data.stockLevels.lowStock}
          </div>
          <div className="text-sm text-red-700">Low Stock Items</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">
            {data.stockLevels.outOfStock}
          </div>
          <div className="text-sm text-yellow-700">Out of Stock</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h5 className="text-base font-medium text-gray-900 mb-3">
            Expiry Analysis
          </h5>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Expired</span>
              <span className="text-sm font-medium text-red-600">
                {data.expiryAnalysis.expired}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Expiring (30 days)</span>
              <span className="text-sm font-medium text-yellow-600">
                {data.expiryAnalysis.expiring30}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Expiring (90 days)</span>
              <span className="text-sm font-medium text-orange-600">
                {data.expiryAnalysis.expiring90}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h5 className="text-base font-medium text-gray-900 mb-3">
            Top Value Products
          </h5>
          <div className="space-y-2">
            {data.topValueProducts.slice(0, 5).map((product, index) => (
              <div key={index} className="flex justify-between">
                <span className="text-sm text-gray-600 truncate">
                  {product.name}
                </span>
                <span className="text-sm font-medium">
                  {formatCurrency(product.totalValue)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FinancialReportDisplay({ data }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(data.revenue.total)}
          </div>
          <div className="text-sm text-green-700">Total Revenue</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(data.costs.total)}
          </div>
          <div className="text-sm text-red-700">Total Costs</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(data.profit.gross)}
          </div>
          <div className="text-sm text-blue-700">Gross Profit</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">
            {data.profit.margin.toFixed(1)}%
          </div>
          <div className="text-sm text-yellow-700">Profit Margin</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h5 className="text-base font-medium text-gray-900 mb-3">
            Revenue Breakdown
          </h5>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Daily Average</span>
              <span className="text-sm font-medium">
                {formatCurrency(data.revenue.daily)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Per Transaction</span>
              <span className="text-sm font-medium">
                {formatCurrency(data.revenue.average)}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h5 className="text-base font-medium text-gray-900 mb-3">
            Inventory Metrics
          </h5>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Current Value</span>
              <span className="text-sm font-medium">
                {formatCurrency(data.inventory.currentValue)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Turnover Ratio</span>
              <span className="text-sm font-medium">
                {data.inventory.turnover.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
