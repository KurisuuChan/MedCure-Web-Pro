import React, { useState, useEffect } from "react";
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  AlertTriangle,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from "lucide-react";
import { DashboardService } from "../services/dataService";
import { formatCurrency, formatNumber } from "../utils/formatting";
import LoadingSpinner from "../components/ui/LoadingSpinner";

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await DashboardService.getDashboardData();
      setDashboardData(data);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setError("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Dashboard Error
          </h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No dashboard data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back! Here's your pharmacy overview.
          </p>
        </div>
        <button
          onClick={loadDashboardData}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Sales"
          value={formatCurrency(dashboardData.totalSales || 0)}
          icon={DollarSign}
          color="blue"
          trend={5.2}
        />
        <MetricCard
          title="Products"
          value={formatNumber(dashboardData.totalProducts || 0)}
          icon={Package}
          color="green"
          trend={2.1}
        />
        <MetricCard
          title="Low Stock Items"
          value={formatNumber(dashboardData.lowStockCount || 0)}
          icon={AlertTriangle}
          color="red"
          trend={-1.3}
        />
        <MetricCard
          title="Active Users"
          value={formatNumber(dashboardData.activeUsers || 0)}
          icon={Users}
          color="purple"
          trend={0.8}
        />
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <QuickActionButton
              icon={ShoppingCart}
              title="New Sale"
              description="Process a new transaction"
              color="blue"
              href="/pos"
            />
            <QuickActionButton
              icon={Package}
              title="Add Product"
              description="Add new inventory item"
              color="green"
              href="/inventory"
            />
            <QuickActionButton
              icon={Activity}
              title="View Reports"
              description="Check detailed analytics"
              color="purple"
              href="/analytics"
            />
          </div>
        </div>

        {/* Recent Sales */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Sales
          </h3>
          <div className="space-y-3">
            {dashboardData.recentSales &&
            dashboardData.recentSales.length > 0 ? (
              dashboardData.recentSales.slice(0, 5).map((sale, index) => (
                <div
                  key={sale.id || index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Sale #{(sale.id || "").toString().slice(-6)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {sale.customer_name || "Walk-in Customer"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(sale.total_amount || 0)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(sale.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <ShoppingCart className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No recent sales</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stock Alerts */}
      {dashboardData.lowStockCount > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Stock Alerts
            </h3>
            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
              {dashboardData.lowStockCount} items
            </span>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  Low stock alert
                </p>
                <p className="text-sm text-red-700">
                  {dashboardData.lowStockCount} product
                  {dashboardData.lowStockCount !== 1 ? "s" : ""} need
                  {dashboardData.lowStockCount === 1 ? "s" : ""} restocking.
                  <a href="/inventory" className="font-medium underline ml-1">
                    View inventory →
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Metric Card Component
function MetricCard({ title, value, icon: IconComponent, color, trend }) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    red: "bg-red-50 text-red-600",
  };

  const isPositive = trend >= 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          <div className="flex items-center mt-2">
            {isPositive ? (
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-500" />
            )}
            <span
              className={`text-sm font-medium ml-1 ${
                isPositive ? "text-green-600" : "text-red-600"
              }`}
            >
              {Math.abs(trend)}%
            </span>
            <span className="text-sm text-gray-500 ml-1">this month</span>
          </div>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <IconComponent className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

// Quick Action Button Component
function QuickActionButton({
  icon: IconComponent,
  title,
  description,
  color,
  href,
}) {
  const colorClasses = {
    blue: "text-blue-600 bg-blue-50 hover:bg-blue-100",
    green: "text-green-600 bg-green-50 hover:bg-green-100",
    purple: "text-purple-600 bg-purple-50 hover:bg-purple-100",
  };

  return (
    <a
      href={href}
      className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
    >
      <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
        <IconComponent className="h-5 w-5" />
      </div>
      <div className="ml-3">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <ArrowUpRight className="h-4 w-4 text-gray-400 ml-auto" />
    </a>
  );
}
