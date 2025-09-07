import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  AlertTriangle,
  Clock,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
} from "lucide-react";
import { DashboardService } from "../services/dataService";
import { formatCurrency, formatNumber } from "../utils/formatting";
import { formatDateTime, getRelativeTime } from "../utils/dateTime";
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
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const {
    todayMetrics,
    yesterdayMetrics,
    weeklyData,
    topProducts,
    recentTransactions,
    formatGrowth,
    getCriticalAlerts,
  } = dashboardData;

  const criticalAlerts = getCriticalAlerts();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back! Here's what's happening at your pharmacy today.
          </p>
        </div>
        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>Last updated: {formatDateTime(new Date())}</span>
          </div>
        </div>
      </div>

      {/* Critical Alerts */}
      {(criticalAlerts.lowStock.length > 0 ||
        criticalAlerts.expiring.length > 0 ||
        criticalAlerts.system.length > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-semibold text-red-800">
                Critical Alerts
              </h3>
              <div className="mt-2 space-y-1">
                {criticalAlerts.lowStock.map((item) => (
                  <p key={item.id} className="text-sm text-red-700">
                    • {item.name} is critically low ({item.currentStock} left)
                  </p>
                ))}
                {criticalAlerts.system.map((alert) => (
                  <p key={alert.id} className="text-sm text-red-700">
                    • {alert.message}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Today's Sales"
          value={formatCurrency(todayMetrics.totalSales)}
          comparison={formatGrowth(
            todayMetrics.totalSales,
            yesterdayMetrics.totalSales
          )}
          icon={DollarSign}
          color="blue"
        />
        <MetricCard
          title="Transactions"
          value={formatNumber(todayMetrics.totalTransactions)}
          comparison={formatGrowth(
            todayMetrics.totalTransactions,
            yesterdayMetrics.totalTransactions
          )}
          icon={ShoppingCart}
          color="green"
        />
        <MetricCard
          title="Items Sold"
          value={formatNumber(todayMetrics.totalItems)}
          comparison={formatGrowth(
            todayMetrics.totalItems,
            yesterdayMetrics.totalItems
          )}
          icon={Package}
          color="purple"
        />
        <MetricCard
          title="Avg. Transaction"
          value={formatCurrency(todayMetrics.averageTransaction)}
          comparison={formatGrowth(
            todayMetrics.averageTransaction,
            yesterdayMetrics.averageTransaction
          )}
          icon={BarChart3}
          color="orange"
        />
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Sales Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Weekly Sales
            </h3>
            <Activity className="h-5 w-5 text-gray-400" />
          </div>
          <WeeklySalesChart data={weeklyData} />
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Payment Methods
            </h3>
            <PieChart className="h-5 w-5 text-gray-400" />
          </div>
          <PaymentMethodsChart data={dashboardData.paymentMethods} />
        </div>
      </div>

      {/* Top Products and Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Top Products
            </h3>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {topProducts.slice(0, 5).map((product, index) => (
              <TopProductItem
                key={product.id}
                product={product}
                rank={index + 1}
              />
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Transactions
            </h3>
            <Clock className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {recentTransactions.slice(0, 5).map((transaction) => (
              <RecentTransactionItem
                key={transaction.id}
                transaction={transaction}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Stock Alerts */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Stock Alerts</h3>
          <AlertTriangle className="h-5 w-5 text-gray-400" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {dashboardData.lowStockAlerts.map((alert) => (
            <StockAlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({ title, value, comparison, icon: Icon, color }) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          <div className="flex items-center mt-2">
            {comparison.isPositive ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <span
              className={`text-sm font-medium ml-1 ${
                comparison.isPositive ? "text-green-600" : "text-red-600"
              }`}
            >
              {comparison.value}%
            </span>
            <span className="text-sm text-gray-500 ml-1">vs yesterday</span>
          </div>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

// Weekly Sales Chart Component (Simple Bar Chart)
function WeeklySalesChart({ data }) {
  const maxSales = Math.max(...data.map((d) => d.sales));

  return (
    <div className="space-y-4">
      {data.map((day) => (
        <div key={day.day} className="flex items-center space-x-3">
          <span className="text-sm font-medium text-gray-600 w-10">
            {day.day}
          </span>
          <div className="flex-1 bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${(day.sales / maxSales) * 100}%` }}
            />
          </div>
          <span className="text-sm font-medium text-gray-900 w-20 text-right">
            {formatCurrency(day.sales)}
          </span>
        </div>
      ))}
    </div>
  );
}

// Payment Methods Chart Component
function PaymentMethodsChart({ data }) {
  return (
    <div className="space-y-4">
      {data.map((method) => (
        <div key={method.method} className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`w-3 h-3 rounded-full ${
                method.method === "Cash"
                  ? "bg-blue-500"
                  : method.method === "GCash"
                  ? "bg-green-500"
                  : "bg-purple-500"
              }`}
            />
            <span className="text-sm font-medium text-gray-700">
              {method.method}
            </span>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-gray-900">
              {formatCurrency(method.amount)}
            </div>
            <div className="text-xs text-gray-500">{method.percentage}%</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Top Product Item Component
function TopProductItem({ product, rank }) {
  return (
    <div className="flex items-center space-x-4 p-3 rounded-lg bg-gray-50">
      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
        <span className="text-sm font-bold text-blue-600">#{rank}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {product.name}
        </p>
        <p className="text-xs text-gray-500">
          {product.quantitySold} units sold
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-gray-900">
          {formatCurrency(product.revenue)}
        </p>
        <div className="flex items-center">
          {product.growth >= 0 ? (
            <TrendingUp className="h-3 w-3 text-green-500" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-500" />
          )}
          <span
            className={`text-xs ml-1 ${
              product.growth >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {Math.abs(product.growth)}%
          </span>
        </div>
      </div>
    </div>
  );
}

// Recent Transaction Item Component
function RecentTransactionItem({ transaction }) {
  const paymentMethodColors = {
    cash: "bg-blue-100 text-blue-800",
    gcash: "bg-green-100 text-green-800",
    card: "bg-purple-100 text-purple-800",
  };

  return (
    <div className="flex items-center space-x-4 p-3 rounded-lg border border-gray-100">
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium text-gray-900">{transaction.id}</p>
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              paymentMethodColors[transaction.paymentMethod]
            }`}
          >
            {transaction.paymentMethod.toUpperCase()}
          </span>
        </div>
        <p className="text-xs text-gray-500">
          {transaction.customer} • {transaction.items} items
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-gray-900">
          {formatCurrency(transaction.amount)}
        </p>
        <p className="text-xs text-gray-500">
          {getRelativeTime(transaction.time)}
        </p>
      </div>
    </div>
  );
}

// Stock Alert Card Component
function StockAlertCard({ alert }) {
  const statusColors = {
    critical: "bg-red-50 border-red-200 text-red-800",
    low: "bg-yellow-50 border-yellow-200 text-yellow-800",
    warning: "bg-orange-50 border-orange-200 text-orange-800",
  };

  return (
    <div className={`p-4 rounded-lg border ${statusColors[alert.status]}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold">{alert.name}</h4>
        <AlertTriangle className="h-4 w-4" />
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span>Current Stock:</span>
          <span className="font-medium">{alert.currentStock}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span>Reorder Level:</span>
          <span className="font-medium">{alert.reorderLevel}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span>Days Left:</span>
          <span className="font-medium">{alert.daysLeft} days</span>
        </div>
      </div>
    </div>
  );
}
