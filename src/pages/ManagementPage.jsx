import React, { useState } from "react";
import {
  Users,
  Settings,
  BarChart3,
  FileText,
  Shield,
  Database,
  Bell,
  Download,
  Upload,
  Activity,
  UserPlus,
  Edit,
  Trash2,
  Save,
  RefreshCw,
  Calendar,
  TrendingUp,
  DollarSign,
  Package,
  AlertCircle,
} from "lucide-react";
import { formatCurrency, formatNumber } from "../utils/formatting";
import { formatDate } from "../utils/dateTime";

// Mock data for management
const mockUsers = [
  {
    id: 1,
    name: "John Admin",
    email: "admin@medcure.com",
    role: "Administrator",
    status: "Active",
    lastLogin: "2024-01-15T10:30:00Z",
  },
  {
    id: 2,
    name: "Sarah Pharmacist",
    email: "sarah@medcure.com",
    role: "Pharmacist",
    status: "Active",
    lastLogin: "2024-01-15T09:15:00Z",
  },
  {
    id: 3,
    name: "Mike Cashier",
    email: "mike@medcure.com",
    role: "Cashier",
    status: "Inactive",
    lastLogin: "2024-01-14T16:45:00Z",
  },
];

const mockSystemStats = {
  totalUsers: 12,
  activeUsers: 9,
  totalProducts: 245,
  lowStockItems: 8,
  todaySales: 45600,
  systemUptime: "99.9%",
  storageUsed: "2.3 GB",
  storageTotal: "10 GB",
};

const mockAuditLogs = [
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
];

export default function ManagementPage() {
  const [activeTab, setActiveTab] = useState("users");

  const tabs = [
    { id: "users", label: "User Management", icon: Users },
    { id: "settings", label: "System Settings", icon: Settings },
    { id: "reports", label: "Reports", icon: BarChart3 },
    { id: "audit", label: "Audit Logs", icon: FileText },
    { id: "backup", label: "Backup & Security", icon: Shield },
  ];

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
                  {mockSystemStats.totalUsers}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-green-600 mt-2">
              {mockSystemStats.activeUsers} active users
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Products</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(mockSystemStats.totalProducts)}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-red-600 mt-2">
              {mockSystemStats.lowStockItems} low stock items
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Today's Sales
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(mockSystemStats.todaySales)}
                </p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-xs text-green-600 mt-2">↗ 12% from yesterday</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  System Status
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {mockSystemStats.systemUptime}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              {mockSystemStats.storageUsed} / {mockSystemStats.storageTotal}{" "}
              used
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

// User Management Component
function UserManagement() {
  const [users] = useState(mockUsers);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900">User Management</h3>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
          <UserPlus className="h-4 w-4" />
          <span>Add User</span>
        </button>
      </div>

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
                      {user.name}
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
                      user.status === "Active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(user.lastLogin)}
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
    </div>
  );
}

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
          {mockAuditLogs.map((log) => (
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
          ))}
        </div>
      </div>
    </div>
  );
}

// Backup & Security Component
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
