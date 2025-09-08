import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Package,
  Target,
  Download,
  RefreshCw,
  Clock,
  Award,
  Percent,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  ArcElement,
  Filler,
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import { BusinessIntelligenceService } from "../../../services/businessIntelligenceService";
import { formatCurrency } from "../../../utils/formatting";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  ArcElement,
  Filler
);

const BusinessIntelligenceDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("30days");
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await BusinessIntelligenceService.getDashboardOverview(
        timeframe
      );
      setDashboardData(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error loading BI dashboard:", error);
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (loading || !dashboardData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">
            Loading Business Intelligence Dashboard...
          </p>
        </div>
      </div>
    );
  }

  const { sales, customers, inventory, profit, trends } = dashboardData;

  // Chart configurations
  const salesTrendData = {
    labels: Object.keys(sales.dailySales || {}).slice(-14), // Last 14 days
    datasets: [
      {
        label: "Revenue",
        data: Object.values(sales.dailySales || {})
          .slice(-14)
          .map((day) => day.revenue),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
        fill: true,
      },
      {
        label: "Profit",
        data: Object.values(sales.dailySales || {})
          .slice(-14)
          .map((day) => day.profit),
        borderColor: "rgb(34, 197, 94)",
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const categoryPerformanceData = {
    labels: sales.salesByCategory?.map((cat) => cat.name) || [],
    datasets: [
      {
        label: "Revenue",
        data: sales.salesByCategory?.map((cat) => cat.revenue) || [],
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)",
          "rgba(34, 197, 94, 0.8)",
          "rgba(245, 158, 11, 0.8)",
          "rgba(239, 68, 68, 0.8)",
          "rgba(139, 92, 246, 0.8)",
          "rgba(20, 184, 166, 0.8)",
        ],
        borderColor: [
          "rgb(59, 130, 246)",
          "rgb(34, 197, 94)",
          "rgb(245, 158, 11)",
          "rgb(239, 68, 68)",
          "rgb(139, 92, 246)",
          "rgb(20, 184, 166)",
        ],
        borderWidth: 2,
      },
    ],
  };

  const profitMarginData = {
    labels: Object.keys(profit.profitByCategory || {}).slice(0, 6),
    datasets: [
      {
        data: Object.values(profit.profitByCategory || {})
          .slice(0, 6)
          .map((cat) => cat.margin),
        backgroundColor: [
          "#3B82F6",
          "#22C55E",
          "#F59E0B",
          "#EF4444",
          "#8B5CF6",
          "#14B8A6",
        ],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const renderOverviewCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Revenue</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {formatCurrency(sales.totalRevenue)}
            </p>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">
                +{trends.revenueGrowth?.toFixed(1) || 0}%
              </span>
            </div>
          </div>
          <div className="bg-blue-100 p-3 rounded-lg">
            <DollarSign className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Gross Profit</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {formatCurrency(profit.grossProfit)}
            </p>
            <div className="flex items-center mt-2">
              <Percent className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">
                {profit.profitMargin?.toFixed(1) || 0}% margin
              </span>
            </div>
          </div>
          <div className="bg-green-100 p-3 rounded-lg">
            <TrendingUp className="h-6 w-6 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Orders</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {sales.totalSales || 0}
            </p>
            <div className="flex items-center mt-2">
              <Target className="h-4 w-4 text-blue-500 mr-1" />
              <span className="text-sm text-gray-600">
                {formatCurrency(sales.averageOrderValue)} avg
              </span>
            </div>
          </div>
          <div className="bg-orange-100 p-3 rounded-lg">
            <BarChart3 className="h-6 w-6 text-orange-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">
              Active Customers
            </p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {customers.totalCustomers || 0}
            </p>
            <div className="flex items-center mt-2">
              <Users className="h-4 w-4 text-purple-500 mr-1" />
              <span className="text-sm text-purple-600">
                {customers.repeatCustomers || 0} returning
              </span>
            </div>
          </div>
          <div className="bg-purple-100 p-3 rounded-lg">
            <Users className="h-6 w-6 text-purple-600" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderCharts = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      {/* Sales Trend Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Sales & Profit Trends
          </h3>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>Last 14 days</span>
          </div>
        </div>
        <Line data={salesTrendData} options={chartOptions} />
      </div>

      {/* Category Performance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Revenue by Category
          </h3>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Package className="h-4 w-4" />
            <span>Top categories</span>
          </div>
        </div>
        <Bar data={categoryPerformanceData} options={chartOptions} />
      </div>

      {/* Profit Margins */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Profit Margins by Category
          </h3>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Percent className="h-4 w-4" />
            <span>Margin %</span>
          </div>
        </div>
        <Doughnut
          data={profitMarginData}
          options={{
            responsive: true,
            plugins: { legend: { position: "bottom" } },
          }}
        />
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Top Performing Products
          </h3>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Award className="h-4 w-4" />
            <span>By revenue</span>
          </div>
        </div>
        <div className="space-y-4">
          {sales.topProducts?.slice(0, 5).map((product, index) => (
            <div
              key={`${product.name}-${index}`}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-blue-600">
                    {index + 1}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-500">
                    {product.quantity} units sold
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">
                  {formatCurrency(product.revenue)}
                </p>
                <p className="text-sm text-green-600">
                  +{formatCurrency(product.profit)} profit
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderInsightCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Inventory Insights */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Inventory Health
          </h3>
          <Package className="h-5 w-5 text-blue-600" />
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Products</span>
            <span className="font-semibold">{inventory.totalProducts}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Inventory Value</span>
            <span className="font-semibold">
              {formatCurrency(inventory.totalValue)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Low Stock Items</span>
            <span className="font-semibold text-orange-600">
              {inventory.lowStockItems}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Fast Moving</span>
            <span className="font-semibold text-green-600">
              {inventory.fastMovingItems?.length || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Customer Insights */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Customer Insights
          </h3>
          <Users className="h-5 w-5 text-purple-600" />
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Customers</span>
            <span className="font-semibold">{customers.totalCustomers}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">New Customers</span>
            <span className="font-semibold text-blue-600">
              {customers.newCustomers}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Repeat Customers</span>
            <span className="font-semibold text-green-600">
              {customers.repeatCustomers}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Avg. Transaction</span>
            <span className="font-semibold">
              {formatCurrency(customers.averageTransactionValue)}
            </span>
          </div>
        </div>
      </div>

      {/* Forecast */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Revenue Forecast
          </h3>
          <TrendingUp className="h-5 w-5 text-green-600" />
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Current Month</span>
            <span className="font-semibold">
              {formatCurrency(sales.totalRevenue)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Projected Next Month</span>
            <span className="font-semibold text-blue-600">
              {formatCurrency(trends.forecast?.nextMonth || 0)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Growth Rate</span>
            <span
              className={`font-semibold ${
                trends.revenueGrowth >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {trends.revenueGrowth >= 0 ? "+" : ""}
              {trends.revenueGrowth?.toFixed(1) || 0}%
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Confidence</span>
            <span className="font-semibold text-gray-600">
              {trends.forecast?.confidence?.toFixed(0) || 0}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Business Intelligence
          </h2>
          <p className="text-gray-600 mt-1">
            Comprehensive analytics and insights for your pharmacy
          </p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Timeframe Selector */}
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last Year</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={loadDashboardData}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>

          {/* Export Button */}
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Last Updated */}
      {lastUpdated && (
        <div className="text-sm text-gray-500">
          Last updated: {lastUpdated.toLocaleString()}
        </div>
      )}

      {/* Overview Cards */}
      {renderOverviewCards()}

      {/* Charts Section */}
      {renderCharts()}

      {/* Insights Cards */}
      {renderInsightCards()}
    </div>
  );
};

export default BusinessIntelligenceDashboard;
