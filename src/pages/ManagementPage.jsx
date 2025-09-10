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
} from "lucide-react";
import { formatCurrency, formatNumber } from "../utils/formatting";
import { UserService, DashboardService } from "../services";
import LoginTrackingTest from "../components/admin/LoginTrackingTest";

export default function ManagementPage() {
  const [activeTab, setActiveTab] = useState("categories");
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
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

      const usersResult = await UserService.getUsers();
      if (usersResult.success && usersResult.data) {
        setSystemStats((prev) => ({
          ...prev,
          totalUsers: usersResult.data.length,
          activeUsers: usersResult.data.filter((u) => u.active).length,
        }));
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? "..." : formatNumber(systemStats.totalUsers)}
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

// Placeholder components - these will be enhanced later
function CategoryManagement() {
  return (
    <div className="text-center py-12">
      <Tag className="h-16 w-16 mx-auto mb-4 text-gray-300" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Category Management
      </h3>
      <p className="text-gray-500 max-w-md mx-auto">
        Manage product categories, hierarchies, and organizational structure.
        This feature helps organize inventory for better management and
        reporting.
      </p>
      <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
        Configure Categories
      </button>
    </div>
  );
}

function ArchivedProductsManagement() {
  return (
    <div className="text-center py-12">
      <Archive className="h-16 w-16 mx-auto mb-4 text-gray-300" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Archived Products
      </h3>
      <p className="text-gray-500 max-w-md mx-auto">
        View and manage archived products. Restore products when needed or
        permanently delete items that are no longer relevant.
      </p>
      <button className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
        View Archives
      </button>
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
