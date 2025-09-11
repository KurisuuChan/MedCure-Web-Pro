import React, { useState, useEffect, useCallback } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  TrendingUp,
  BarChart3,
  PieChart,
  DollarSign,
  Package,
  ShoppingCart,
  RefreshCw,
  Download,
  Activity,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Wifi,
  WifiOff,
  Clock,
  Target,
  Zap,
} from "lucide-react";
import { AnalyticsService } from "../services/domains/analytics/analyticsService";
import { useRealTimeAnalytics } from "../hooks/useRealTimeAnalytics";
import { formatCurrency, formatNumber } from "../utils/formatting";
import LoadingSpinner from "../components/ui/LoadingSpinner";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function EnhancedAnalyticsDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState("30days");
  const [refreshing, setRefreshing] = useState(false);

  // Real-time analytics integration
  const {
    data: realTimeData,
    lastUpdated,
    connectionStatus,
    refresh: refreshRealTime,
  } = useRealTimeAnalytics(30000); // Refresh every 30 seconds

  const loadAnalyticsData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load comprehensive analytics data
      const [
        salesAnalytics,
        salesTrends,
        topProducts,
        profitAnalytics,
        inventoryAnalytics,
        salesKPIs,
      ] = await Promise.all([
        AnalyticsService.getSalesAnalytics(selectedPeriod),
        AnalyticsService.getSalesTrends(selectedPeriod),
        AnalyticsService.getTopProducts(10, selectedPeriod),
        AnalyticsService.getProfitAnalytics(selectedPeriod),
        AnalyticsService.getInventoryAnalytics(),
        AnalyticsService.getSalesKPIs(),
      ]);

      setDashboardData({
        salesAnalytics,
        salesTrends,
        topProducts,
        profitAnalytics,
        inventoryAnalytics,
        salesKPIs,
        lastUpdated: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Error loading enhanced analytics:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Refresh both traditional analytics and real-time data
    await Promise.all([loadAnalyticsData(), refreshRealTime()]);
  };

  const exportDashboard = () => {
    // TODO: Implement export functionality
    alert("📊 Dashboard export feature coming soon!");
  };

  // Chart configurations
  const getRevenueChartConfig = () => {
    if (!dashboardData?.salesTrends) return null;

    return {
      labels: dashboardData.salesTrends.map((item) => item.period),
      datasets: [
        {
          label: "Revenue",
          data: dashboardData.salesTrends.map((item) => item.revenue),
          borderColor: "rgb(59, 130, 246)",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: "rgb(59, 130, 246)",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
        },
      ],
    };
  };

  const getTopProductsChartConfig = () => {
    if (!dashboardData?.topProducts) return null;

    return {
      labels: dashboardData.topProducts.map(
        (p) => p.name.substring(0, 15) + (p.name.length > 15 ? "..." : "")
      ),
      datasets: [
        {
          label: "Sales Volume",
          data: dashboardData.topProducts.map((p) => p.totalSold),
          backgroundColor: [
            "rgba(59, 130, 246, 0.8)",
            "rgba(16, 185, 129, 0.8)",
            "rgba(245, 158, 11, 0.8)",
            "rgba(239, 68, 68, 0.8)",
            "rgba(139, 92, 246, 0.8)",
            "rgba(236, 72, 153, 0.8)",
            "rgba(6, 182, 212, 0.8)",
            "rgba(34, 197, 94, 0.8)",
            "rgba(251, 146, 60, 0.8)",
            "rgba(168, 85, 247, 0.8)",
          ],
          borderColor: [
            "rgb(59, 130, 246)",
            "rgb(16, 185, 129)",
            "rgb(245, 158, 11)",
            "rgb(239, 68, 68)",
            "rgb(139, 92, 246)",
            "rgb(236, 72, 153)",
            "rgb(6, 182, 212)",
            "rgb(34, 197, 94)",
            "rgb(251, 146, 60)",
            "rgb(168, 85, 247)",
          ],
          borderWidth: 2,
        },
      ],
    };
  };

  const getCategoryDistributionConfig = () => {
    if (!dashboardData?.salesAnalytics?.categoryBreakdown) return null;

    const categories = Object.keys(
      dashboardData.salesAnalytics.categoryBreakdown
    );
    const values = Object.values(
      dashboardData.salesAnalytics.categoryBreakdown
    );

    return {
      labels: categories,
      datasets: [
        {
          data: values,
          backgroundColor: [
            "rgba(59, 130, 246, 0.8)",
            "rgba(16, 185, 129, 0.8)",
            "rgba(245, 158, 11, 0.8)",
            "rgba(239, 68, 68, 0.8)",
            "rgba(139, 92, 246, 0.8)",
            "rgba(236, 72, 153, 0.8)",
          ],
          borderColor: [
            "rgb(59, 130, 246)",
            "rgb(16, 185, 129)",
            "rgb(245, 158, 11)",
            "rgb(239, 68, 68)",
            "rgb(139, 92, 246)",
            "rgb(236, 72, 153)",
          ],
          borderWidth: 2,
          hoverOffset: 4,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: "500",
          },
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "#ffffff",
        bodyColor: "#ffffff",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function (context) {
            if (context.dataset.label === "Revenue") {
              return `Revenue: ${formatCurrency(context.parsed.y)}`;
            }
            return `${context.dataset.label}: ${formatNumber(
              context.parsed.y
            )}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
          drawBorder: false,
        },
        ticks: {
          font: {
            size: 11,
          },
          color: "#6B7280",
          callback: function (value) {
            return formatNumber(value);
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
          color: "#6B7280",
        },
      },
    },
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Failed to Load Analytics
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadAnalyticsData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Enhanced Analytics Dashboard
              </h1>
              <p className="text-sm text-gray-600">
                Advanced business intelligence and insights
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Period Selector */}
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
                <option value="1year">Last Year</option>
              </select>

              {/* Action Buttons */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                />
                <span>Refresh</span>
              </button>

              <button
                onClick={exportDashboard}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics Row */}
        {(dashboardData?.salesKPIs || realTimeData?.realTimeKPIs) && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Real-time Connection Status Indicator */}
            {connectionStatus && (
              <div className="col-span-full mb-4">
                {(() => {
                  let statusClass = "bg-yellow-50 border border-yellow-200";
                  if (connectionStatus === "connected") {
                    statusClass = "bg-green-50 border border-green-200";
                  } else if (connectionStatus === "error") {
                    statusClass = "bg-red-50 border border-red-200";
                  }

                  return (
                    <div
                      className={`flex items-center justify-between p-3 rounded-lg ${statusClass}`}
                    >
                      <div className="flex items-center">
                        {connectionStatus === "connected" ? (
                          <>
                            <Wifi className="h-4 w-4 text-green-600 mr-2" />
                            <span className="text-sm font-medium text-green-800">
                              Real-time data connected
                            </span>
                          </>
                        ) : connectionStatus === "error" ? (
                          <>
                            <WifiOff className="h-4 w-4 text-red-600 mr-2" />
                            <span className="text-sm font-medium text-red-800">
                              Connection error
                            </span>
                          </>
                        ) : (
                          <>
                            <Activity className="h-4 w-4 text-yellow-600 mr-2" />
                            <span className="text-sm font-medium text-yellow-800">
                              Connecting...
                            </span>
                          </>
                        )}
                      </div>
                      {lastUpdated && (
                        <div className="flex items-center text-xs text-gray-600">
                          <Clock className="h-3 w-3 mr-1" />
                          Last updated:{" "}
                          {new Date(lastUpdated).toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            <MetricCard
              title="Today's Revenue"
              value={formatCurrency(
                realTimeData?.realTimeKPIs?.revenue?.today ??
                  dashboardData?.salesKPIs?.todayRevenue ??
                  0
              )}
              icon={DollarSign}
              color="green"
              trend={realTimeData?.realTimeKPIs?.revenue?.dailyGrowth ?? 12.5}
              trendText="vs yesterday"
              isRealTime={!!realTimeData?.realTimeKPIs}
            />
            <MetricCard
              title="Monthly Revenue"
              value={formatCurrency(
                realTimeData?.realTimeKPIs?.revenue?.thisMonth ??
                  dashboardData?.salesKPIs?.monthRevenue ??
                  0
              )}
              icon={TrendingUp}
              color="blue"
              trend={realTimeData?.realTimeKPIs?.revenue?.monthlyGrowth ?? 8.2}
              trendText="vs last month"
              isRealTime={!!realTimeData?.realTimeKPIs}
            />
            <MetricCard
              title="Total Transactions"
              value={formatNumber(
                realTimeData?.realTimeKPIs?.transactions?.today ??
                  dashboardData?.salesKPIs?.todayTransactions ??
                  0
              )}
              icon={ShoppingCart}
              color="purple"
              trend={-2.1}
              trendText="vs yesterday"
              isRealTime={!!realTimeData?.realTimeKPIs}
            />
            <MetricCard
              title="Avg Order Value"
              value={formatCurrency(
                realTimeData?.realTimeKPIs?.transactions?.avgOrderValue ??
                  dashboardData?.salesKPIs?.avgOrderValue ??
                  0
              )}
              icon={BarChart3}
              color="orange"
              trend={5.8}
              trendText="improvement"
              isRealTime={!!realTimeData?.realTimeKPIs}
            />
          </div>
        )}

        {/* Report Summary Cards */}
        <div className="mb-8">
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                Report Overview
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center mb-2">
                    <DollarSign className="h-5 w-5 text-blue-600 mr-2" />
                    <h4 className="font-medium text-gray-900">Sales Report</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Daily, weekly, and monthly sales summaries with trend
                    analysis
                  </p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center mb-2">
                    <Package className="h-5 w-5 text-green-600 mr-2" />
                    <h4 className="font-medium text-gray-900">
                      Inventory Report
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Stock levels, low inventory alerts, and reorder
                    recommendations
                  </p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center mb-2">
                    <TrendingUp className="h-5 w-5 text-purple-600 mr-2" />
                    <h4 className="font-medium text-gray-900">
                      Product Performance
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Best and worst performing products with profit analysis
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Business Insights */}
        {realTimeData?.salesTrends?.insights &&
          realTimeData.salesTrends.insights.length > 0 && (
            <div className="mb-8">
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 flex items-center">
                    <Target className="h-5 w-5 mr-2 text-blue-600" />
                    Real-time Business Insights
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></div>
                      Live
                    </span>
                  </h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-1 lg:grid-cols-2">
                    {realTimeData.salesTrends.insights.map((insight, index) => {
                      const getInsightStyles = (type) => {
                        switch (type) {
                          case "positive":
                            return {
                              containerClass: "bg-green-50 border-green-200",
                              iconComponent: (
                                <TrendingUp className="h-5 w-5 text-green-600" />
                              ),
                              titleClass: "text-green-900",
                              textClass: "text-green-700",
                            };
                          case "warning":
                            return {
                              containerClass: "bg-yellow-50 border-yellow-200",
                              iconComponent: (
                                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                              ),
                              titleClass: "text-yellow-900",
                              textClass: "text-yellow-700",
                            };
                          default:
                            return {
                              containerClass: "bg-blue-50 border-blue-200",
                              iconComponent: (
                                <Activity className="h-5 w-5 text-blue-600" />
                              ),
                              titleClass: "text-blue-900",
                              textClass: "text-blue-700",
                            };
                        }
                      };

                      const styles = getInsightStyles(insight.type);

                      return (
                        <div
                          key={`insight-${insight.title}-${index}`}
                          className={`p-4 rounded-lg border ${styles.containerClass}`}
                        >
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              {styles.iconComponent}
                            </div>
                            <div className="ml-3">
                              <h4
                                className={`font-medium ${styles.titleClass}`}
                              >
                                {insight.title}
                              </h4>
                              <p className={`text-sm mt-1 ${styles.textClass}`}>
                                {insight.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* Real-time Inventory Alerts */}
        {realTimeData?.inventoryAlerts &&
          realTimeData.inventoryAlerts.length > 0 && (
            <div className="mb-8">
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
                    Live Inventory Alerts
                    <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      {realTimeData.inventoryAlerts.length} alerts
                    </span>
                  </h3>
                  <div className="space-y-3">
                    {realTimeData.inventoryAlerts
                      .slice(0, 5)
                      .map((alert, index) => (
                        <div
                          key={`alert-${alert.id || alert.name}-${index}`}
                          className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <Package className="h-5 w-5 text-orange-600" />
                            <div>
                              <p className="font-medium text-gray-900">
                                {alert.name}
                              </p>
                              <p className="text-sm text-gray-600">
                                Stock: {alert.currentStock} | Minimum:{" "}
                                {alert.minimumLevel}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              Low Stock
                            </span>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(alert.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Trends Chart */}
          <ChartWidget
            title="Revenue Trends"
            subtitle={`Sales performance over ${selectedPeriod}`}
            icon={TrendingUp}
          >
            {getRevenueChartConfig() ? (
              <div className="h-80">
                <Line data={getRevenueChartConfig()} options={chartOptions} />
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                No trend data available
              </div>
            )}
          </ChartWidget>

          {/* Top Products Chart */}
          <ChartWidget
            title="Top Performing Products"
            subtitle="Best sellers by volume"
            icon={Package}
          >
            {getTopProductsChartConfig() ? (
              <div className="h-80">
                <Bar
                  data={getTopProductsChartConfig()}
                  options={chartOptions}
                />
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                No product data available
              </div>
            )}
          </ChartWidget>
        </div>

        {/* Second Row Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Category Distribution */}
          <ChartWidget
            title="Sales by Category"
            subtitle="Revenue distribution"
            icon={PieChart}
          >
            {getCategoryDistributionConfig() ? (
              <div className="h-64">
                <Doughnut
                  data={getCategoryDistributionConfig()}
                  options={{
                    ...chartOptions,
                    scales: undefined, // Remove scales for pie chart
                    plugins: {
                      ...chartOptions.plugins,
                      legend: {
                        position: "bottom",
                        labels: {
                          usePointStyle: true,
                          padding: 15,
                          font: {
                            size: 11,
                          },
                        },
                      },
                    },
                  }}
                />
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No category data available
              </div>
            )}
          </ChartWidget>

          {/* Inventory Insights */}
          <div className="lg:col-span-2">
            <ChartWidget
              title="Inventory Intelligence"
              subtitle="Stock levels and performance"
              icon={Activity}
            >
              {dashboardData?.inventoryAnalytics ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatNumber(
                          dashboardData.inventoryAnalytics.totalProducts
                        )}
                      </div>
                      <div className="text-sm text-blue-700">
                        Total Products
                      </div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(
                          dashboardData.inventoryAnalytics.totalValue
                        )}
                      </div>
                      <div className="text-sm text-green-700">Total Value</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-amber-50 rounded-lg">
                      <div className="text-2xl font-bold text-amber-600">
                        {formatNumber(
                          dashboardData.inventoryAnalytics.lowStockItems
                        )}
                      </div>
                      <div className="text-sm text-amber-700">Low Stock</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {formatNumber(
                          dashboardData.inventoryAnalytics.expiringItems
                        )}
                      </div>
                      <div className="text-sm text-red-700">Expiring Soon</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Loading inventory data...
                </div>
              )}
            </ChartWidget>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable Components
// eslint-disable-next-line no-unused-vars
const MetricCard = ({
  title,
  value,
  icon: Icon,
  color,
  trend,
  trendText,
  isRealTime = false,
}) => {
  const colorClasses = {
    green: "bg-green-50 text-green-600 border-green-200",
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
    orange: "bg-orange-50 text-orange-600 border-orange-200",
  };

  const getTrendIcon = () => {
    return trend >= 0 ? (
      <ArrowUp className="h-4 w-4 text-green-500" />
    ) : (
      <ArrowDown className="h-4 w-4 text-red-500" />
    );
  };

  return (
    <div
      className={`bg-white rounded-lg shadow p-6 relative ${
        isRealTime ? "ring-2 ring-blue-500 ring-opacity-20" : ""
      }`}
    >
      {/* Real-time indicator */}
      {isRealTime && (
        <div className="absolute top-2 right-2 flex items-center">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-600 font-medium">LIVE</span>
          </div>
        </div>
      )}

      <div className="flex items-center">
        <div className={`rounded-md p-3 ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate flex items-center">
              {title}
              {isRealTime && <Zap className="h-3 w-3 text-blue-500 ml-1" />}
            </dt>
            <dd className="text-lg font-medium text-gray-900">{value}</dd>
          </dl>
        </div>
      </div>
      {trend !== undefined && (
        <div className="mt-4 flex items-center text-sm">
          {getTrendIcon()}
          <span
            className={`ml-1 ${trend >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {Math.abs(trend).toFixed(1)}% {trendText}
          </span>
        </div>
      )}
    </div>
  );
};

// eslint-disable-next-line no-unused-vars
const ChartWidget = ({ title, subtitle, icon: Icon, children }) => {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
              <Icon className="h-5 w-5 mr-2 text-gray-600" />
              {title}
            </h3>
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
};
