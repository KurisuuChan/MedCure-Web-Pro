// Supplier Management Page - Main entry point for supplier management features
// Integrates supplier dashboard, purchase orders, and performance analytics

import React, { useState } from "react";
import {
  Package,
  TrendingUp,
  FileText,
  Settings,
  Users,
  ShoppingCart,
  BarChart3,
} from "lucide-react";
import SupplierManagementDashboard from "../features/admin/components/SupplierManagementDashboard";

const SupplierManagementPage = () => {
  const [activeView, setActiveView] = useState("dashboard");

  const navigationItems = [
    {
      id: "dashboard",
      label: "Supplier Dashboard",
      icon: Package,
      description: "Manage suppliers and view performance metrics",
    },
    {
      id: "purchase-orders",
      label: "Purchase Orders",
      icon: ShoppingCart,
      description: "Create and track purchase orders",
    },
    {
      id: "performance",
      label: "Performance Analytics",
      icon: BarChart3,
      description: "Supplier performance tracking and analytics",
    },
    {
      id: "settings",
      label: "Supplier Settings",
      icon: Settings,
      description: "Configure supplier management settings",
    },
  ];

  const renderActiveView = () => {
    switch (activeView) {
      case "dashboard":
        return <SupplierManagementDashboard />;
      case "purchase-orders":
        return <PurchaseOrdersView />;
      case "performance":
        return <PerformanceAnalyticsView />;
      case "settings":
        return <SupplierSettingsView />;
      default:
        return <SupplierManagementDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Supplier Management
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Comprehensive supplier relationship and procurement management
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Users className="w-4 h-4" />
                  <span>Enterprise Suite</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeView === item.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderActiveView()}
      </div>
    </div>
  );
};

// Purchase Orders View Component
const PurchaseOrdersView = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Purchase Orders</h2>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <ShoppingCart className="w-4 h-4" />
          Create New PO
        </button>
      </div>

      <div className="bg-white rounded-lg shadow border p-6">
        <div className="text-center py-12">
          <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Purchase Order Management
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Comprehensive purchase order creation, tracking, and management
            system would be implemented here.
          </p>
          <div className="mt-6 space-y-2 text-sm text-gray-600">
            <p>• Create and manage purchase orders</p>
            <p>• Track order status and delivery</p>
            <p>• Automated approval workflows</p>
            <p>• Integration with inventory management</p>
            <p>• Supplier communication tools</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Performance Analytics View Component
const PerformanceAnalyticsView = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Performance Analytics
        </h2>
        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Generate Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Delivery Performance
          </h3>
          <div className="text-center py-8">
            <TrendingUp className="mx-auto h-12 w-12 text-green-500" />
            <p className="mt-2 text-sm text-gray-600">
              Advanced delivery performance analytics and KPI tracking dashboard
              would be displayed here.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Quality Metrics
          </h3>
          <div className="text-center py-8">
            <BarChart3 className="mx-auto h-12 w-12 text-blue-500" />
            <p className="mt-2 text-sm text-gray-600">
              Quality scoring, defect rates, and supplier quality trends would
              be visualized here.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Supplier Scorecards
        </h3>
        <div className="text-center py-12">
          <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
          <h4 className="mt-2 text-sm font-medium text-gray-900">
            Comprehensive Supplier Analytics
          </h4>
          <p className="mt-1 text-sm text-gray-500">
            Detailed supplier performance scorecards with the following metrics:
          </p>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div className="space-y-1">
              <p className="font-medium">Delivery Metrics</p>
              <p>• On-time delivery rate</p>
              <p>• Average delivery time</p>
              <p>• Delivery accuracy</p>
            </div>
            <div className="space-y-1">
              <p className="font-medium">Quality Metrics</p>
              <p>• Product quality score</p>
              <p>• Defect rates</p>
              <p>• Return rates</p>
            </div>
            <div className="space-y-1">
              <p className="font-medium">Business Metrics</p>
              <p>• Cost competitiveness</p>
              <p>• Payment terms compliance</p>
              <p>• Communication effectiveness</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Supplier Settings View Component
const SupplierSettingsView = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Supplier Settings
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            General Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Payment Terms
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="net_30">NET 30</option>
                <option value="net_15">NET 15</option>
                <option value="net_60">NET 60</option>
                <option value="cod">Cash on Delivery</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Automatic PO Numbering
              </label>
              <div className="flex items-center">
                <input type="checkbox" className="mr-2" defaultChecked />
                <span className="text-sm text-gray-600">
                  Enable automatic PO number generation
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Performance Thresholds
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum On-Time Delivery Rate (%)
              </label>
              <input
                type="number"
                defaultValue="85"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Average Delivery Time (days)
              </label>
              <input
                type="number"
                defaultValue="7"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Notification Settings
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Late Delivery Alerts</p>
              <p className="text-sm text-gray-500">
                Get notified when deliveries are overdue
              </p>
            </div>
            <input type="checkbox" className="toggle" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">
                Performance Score Changes
              </p>
              <p className="text-sm text-gray-500">
                Alert when supplier performance scores change significantly
              </p>
            </div>
            <input type="checkbox" className="toggle" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">
                New Supplier Approvals
              </p>
              <p className="text-sm text-gray-500">
                Require approval for new supplier registrations
              </p>
            </div>
            <input type="checkbox" className="toggle" defaultChecked />
          </div>
        </div>

        <div className="mt-6 pt-6 border-t">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupplierManagementPage;
