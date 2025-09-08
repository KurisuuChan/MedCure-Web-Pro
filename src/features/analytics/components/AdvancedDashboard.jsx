import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  RefreshCw,
  Target,
  Timer,
  Activity,
} from "lucide-react";
import { AnalyticsService } from "../../../services/analyticsService";
import { formatCurrency } from "../../../utils/formatting";
import { isProductionSupabase } from "../../../config/supabase";
import { mockAnalyticsData } from "../../../data/mockAnalytics";

const AdvancedDashboard = () => {
  const [analytics, setAnalytics] = useState({
    kpis: null,
    salesAnalytics: null,
    inventoryAnalytics: null,
    profitAnalytics: null,
    trends: null,
    topProducts: null,
    alerts: {
      lowStock: [],
      expiring: [],
    },
  });

  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30days");
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadDashboardData = React.useCallback(async () => {
    try {
      setLoading(true);

      // Use mock data in development mode when Supabase is not configured
      if (!isProductionSupabase) {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setAnalytics(mockAnalyticsData);
        setLastUpdated(new Date());
        return;
      }

      const [
        kpis,
        salesAnalytics,
        inventoryAnalytics,
        profitAnalytics,
        trends,
        topProducts,
        lowStockAlerts,
        expiryAlerts,
      ] = await Promise.all([
        AnalyticsService.getSalesKPIs(),
        AnalyticsService.getSalesAnalytics(period),
        AnalyticsService.getInventoryAnalytics(),
        AnalyticsService.getProfitAnalytics(period),
        AnalyticsService.getSalesTrends(period),
        AnalyticsService.getTopProducts(5, period),
        AnalyticsService.getLowStockAlerts(),
        AnalyticsService.getExpiryAlerts(),
      ]);

      setAnalytics({
        kpis,
        salesAnalytics,
        inventoryAnalytics,
        profitAnalytics,
        trends,
        topProducts,
        alerts: {
          lowStock: lowStockAlerts,
          expiring: expiryAlerts,
        },
      });

      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      // Fallback to mock data on error
      setAnalytics(mockAnalyticsData);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadDashboardData();
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(loadDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadDashboardData]);

  const KPICard = ({
    title,
    value,
    change,
    icon: Icon,
    color,
    format = "currency",
  }) => {
    const isPositive = change > 0;
    const formattedValue =
      format === "currency"
        ? formatCurrency(value)
        : format === "number"
        ? value.toLocaleString()
        : value;

    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-lg ${color}`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">{title}</h3>
              <p className="text-2xl font-bold text-gray-900">
                {formattedValue}
              </p>
            </div>
          </div>
          {change !== undefined && (
            <div
              className={`flex items-center space-x-1 ${
                isPositive ? "text-green-600" : "text-red-600"
              }`}
            >
              {isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">{Math.abs(change)}%</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const AlertCard = ({ title, alerts, type }) => {
    const getAlertColor = (alertLevel) => {
      switch (alertLevel) {
        case "critical":
          return "bg-red-100 text-red-800 border-red-200";
        case "warning":
          return "bg-yellow-100 text-yellow-800 border-yellow-200";
        default:
          return "bg-blue-100 text-blue-800 border-blue-200";
      }
    };

    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-sm font-medium">
            {alerts.length}
          </span>
        </div>

        <div className="space-y-3 max-h-64 overflow-y-auto">
          {alerts.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No {type} alerts</p>
          ) : (
            alerts.slice(0, 5).map((alert, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${getAlertColor(
                  alert.alertLevel
                )}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">{alert.name}</p>
                    <p className="text-xs opacity-80">
                      {alert.recommendedAction}
                    </p>
                  </div>
                  <div className="text-right text-xs">
                    {type === "stock" && <span>Qty: {alert.quantity}</span>}
                    {type === "expiry" && (
                      <span>{alert.daysToExpiry} days</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const CategoryChart = ({ data, title }) => {
    const categories = Object.entries(data || {});
    const maxRevenue = Math.max(
      ...categories.map(([, data]) => data.revenue || 0)
    );

    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="space-y-3">
          {categories.map(([category, data]) => {
            const percentage =
              maxRevenue > 0 ? (data.revenue / maxRevenue) * 100 : 0;
            return (
              <div key={category} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">
                    {category}
                  </span>
                  <span className="text-sm text-gray-600">
                    {formatCurrency(data.revenue)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const TrendChart = ({ data, title }) => {
    const maxRevenue = Math.max(...(data || []).map((d) => d.revenue));

    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="h-48 flex items-end space-x-2">
          {(data || []).map((point, index) => {
            const height =
              maxRevenue > 0 ? (point.revenue / maxRevenue) * 100 : 0;
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-blue-600 rounded-t transition-all duration-500 hover:bg-blue-700"
                  style={{ height: `${height}%`, minHeight: "4px" }}
                  title={`${point.date}: ${formatCurrency(point.revenue)}`}
                ></div>
                <span className="text-xs text-gray-500 mt-1 transform rotate-45 origin-left">
                  {new Date(point.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const TopProductsList = ({ products, title }) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {(products || []).map((product, index) => (
          <div
            key={product.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <span className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-xs rounded-full font-bold">
                {index + 1}
              </span>
              <div>
                <p className="font-medium text-gray-900">{product.name}</p>
                <p className="text-sm text-gray-600">{product.category}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900">
                {formatCurrency(product.totalRevenue)}
              </p>
              <p className="text-sm text-gray-600">
                {product.totalQuantity} sold
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading && !analytics.kpis) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-b-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Loading Analytics
            </h3>
            <p className="text-gray-600">
              Fetching your business intelligence data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
            <Activity className="h-8 w-8 text-blue-600" />
            <span>Business Intelligence</span>
            {!isProductionSupabase && (
              <span className="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-normal">
                Demo Mode
              </span>
            )}
          </h1>
          <p className="text-gray-600 mt-1">
            Real-time analytics and insights for your pharmacy
            {!isProductionSupabase && " (showing sample data)"}
          </p>
        </div>

        <div className="flex items-center space-x-4 mt-4 lg:mt-0">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="thisYear">This Year</option>
          </select>

          <button
            onClick={loadDashboardData}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Last Updated */}
      {lastUpdated && (
        <div className="text-sm text-gray-500 flex items-center space-x-1">
          <Timer className="h-4 w-4" />
          <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Today's Revenue"
          value={analytics.kpis?.todayRevenue || 0}
          icon={DollarSign}
          color="bg-green-600"
        />
        <KPICard
          title="Today's Transactions"
          value={analytics.kpis?.todayTransactions || 0}
          icon={ShoppingCart}
          color="bg-blue-600"
          format="number"
        />
        <KPICard
          title="Average Order Value"
          value={analytics.kpis?.avgOrderValue || 0}
          icon={Target}
          color="bg-purple-600"
        />
        <KPICard
          title="Month Revenue"
          value={analytics.kpis?.monthRevenue || 0}
          icon={TrendingUp}
          color="bg-indigo-600"
        />
      </div>

      {/* Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AlertCard
          title="Low Stock Alerts"
          alerts={analytics.alerts.lowStock}
          type="stock"
        />
        <AlertCard
          title="Expiry Warnings"
          alerts={analytics.alerts.expiring}
          type="expiry"
        />
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrendChart data={analytics.trends} title="Sales Trend" />
        <CategoryChart
          data={analytics.salesAnalytics?.categoryBreakdown}
          title="Sales by Category"
        />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TopProductsList
          products={analytics.topProducts}
          title="Top Performing Products"
        />

        {/* Profit Analytics */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Profit Overview
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Revenue</span>
              <span className="font-semibold">
                {formatCurrency(analytics.profitAnalytics?.totalRevenue || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Cost</span>
              <span className="font-semibold text-red-600">
                {formatCurrency(analytics.profitAnalytics?.totalCost || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="text-gray-900 font-medium">Net Profit</span>
              <span className="font-bold text-green-600">
                {formatCurrency(analytics.profitAnalytics?.totalProfit || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Profit Margin</span>
              <span className="font-semibold">
                {(analytics.profitAnalytics?.overallMargin || 0).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Inventory Overview */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Inventory Overview
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Products</span>
              <span className="font-semibold">
                {analytics.inventoryAnalytics?.totalProducts || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Inventory Value</span>
              <span className="font-semibold">
                {formatCurrency(analytics.inventoryAnalytics?.totalValue || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Low Stock Items</span>
              <span className="font-semibold text-yellow-600">
                {analytics.inventoryAnalytics?.lowStockCount || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Out of Stock</span>
              <span className="font-semibold text-red-600">
                {analytics.inventoryAnalytics?.outOfStockCount || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedDashboard;
