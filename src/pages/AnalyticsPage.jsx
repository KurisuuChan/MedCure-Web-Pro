import React, { useState, useMemo } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  Calendar,
  Users,
  ShoppingCart,
  AlertTriangle,
  RefreshCw,
  Download,
  Filter,
} from "lucide-react";
import { formatCurrency, formatNumber } from "../utils/formatting";
import { useInventory } from "../features/inventory/hooks/useInventory";

export default function AnalyticsPage() {
  const { allProducts, analytics, isLoading } = useInventory();
  const [dateRange, setDateRange] = useState("30"); // days

  // Calculate analytics
  const analyticsData = useMemo(() => {
    if (!allProducts.length) return null;

    const categories = [...new Set(allProducts.map((p) => p.category))];
    const categoryStats = categories.map((category) => {
      const categoryProducts = allProducts.filter(
        (p) => p.category === category
      );
      const totalValue = categoryProducts.reduce(
        (sum, p) => sum + p.stock_in_pieces * p.price_per_piece,
        0
      );
      const totalStock = categoryProducts.reduce(
        (sum, p) => sum + p.stock_in_pieces,
        0
      );

      return {
        category,
        products: categoryProducts.length,
        totalValue,
        totalStock,
        avgPrice:
          categoryProducts.reduce((sum, p) => sum + p.price_per_piece, 0) /
          categoryProducts.length,
      };
    });

    // Stock level distribution
    const stockLevels = {
      outOfStock: allProducts.filter((p) => p.stock_in_pieces === 0).length,
      lowStock: allProducts.filter(
        (p) => p.stock_in_pieces > 0 && p.stock_in_pieces <= p.reorder_level
      ).length,
      normalStock: allProducts.filter(
        (p) => p.stock_in_pieces > p.reorder_level
      ).length,
    };

    // Expiry analysis
    const now = new Date();
    const expired = allProducts.filter(
      (p) => new Date(p.expiry_date) < now
    ).length;
    const expiring30 = allProducts.filter((p) => {
      const expiryDate = new Date(p.expiry_date);
      const daysUntilExpiry = Math.ceil(
        (expiryDate - now) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
    }).length;
    const expiring90 = allProducts.filter((p) => {
      const expiryDate = new Date(p.expiry_date);
      const daysUntilExpiry = Math.ceil(
        (expiryDate - now) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiry > 30 && daysUntilExpiry <= 90;
    }).length;

    // Top products by value
    const topProducts = [...allProducts]
      .sort(
        (a, b) =>
          b.stock_in_pieces * b.price_per_piece -
          a.stock_in_pieces * a.price_per_piece
      )
      .slice(0, 10);

    return {
      categoryStats,
      stockLevels,
      expiryAnalysis: { expired, expiring30, expiring90 },
      topProducts,
    };
  }, [allProducts]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Comprehensive insights into your pharmacy operations and inventory
            performance.
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 lg:mt-0">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download className="h-4 w-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(analytics.totalValue)}
          change="+12.5%"
          trend="up"
          icon={DollarSign}
          color="green"
        />
        <MetricCard
          title="Total Products"
          value={formatNumber(analytics.totalProducts)}
          change="+5.2%"
          trend="up"
          icon={Package}
          color="blue"
        />
        <MetricCard
          title="Low Stock Items"
          value={formatNumber(analytics.lowStockProducts)}
          change="-2.1%"
          trend="down"
          icon={AlertTriangle}
          color={analytics.lowStockProducts > 0 ? "yellow" : "green"}
        />
        <MetricCard
          title="Avg. Product Value"
          value={formatCurrency(analytics.totalValue / analytics.totalProducts)}
          change="+3.8%"
          trend="up"
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Category Distribution
            </h3>
            <RefreshCw className="h-5 w-5 text-gray-400" />
          </div>
          {analyticsData && (
            <div className="space-y-4">
              {analyticsData.categoryStats.map((stat, index) => (
                <div
                  key={stat.category}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-4 h-4 rounded ${
                        index % 6 === 0
                          ? "bg-blue-500"
                          : index % 6 === 1
                          ? "bg-green-500"
                          : index % 6 === 2
                          ? "bg-yellow-500"
                          : index % 6 === 3
                          ? "bg-red-500"
                          : index % 6 === 4
                          ? "bg-purple-500"
                          : "bg-pink-500"
                      }`}
                    ></div>
                    <span className="text-sm font-medium text-gray-900">
                      {stat.category}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {stat.products} products
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatCurrency(stat.totalValue)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stock Level Analysis */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Stock Level Analysis
            </h3>
            <RefreshCw className="h-5 w-5 text-gray-400" />
          </div>
          {analyticsData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-900">
                    Normal Stock
                  </span>
                </div>
                <span className="text-lg font-bold text-green-600">
                  {analyticsData.stockLevels.normalStock}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-900">
                    Low Stock
                  </span>
                </div>
                <span className="text-lg font-bold text-yellow-600">
                  {analyticsData.stockLevels.lowStock}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-900">
                    Out of Stock
                  </span>
                </div>
                <span className="text-lg font-bold text-red-600">
                  {analyticsData.stockLevels.outOfStock}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Expiry Analysis & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expiry Analysis */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Expiry Analysis
            </h3>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          {analyticsData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    Expired Products
                  </div>
                  <div className="text-xs text-gray-500">Already expired</div>
                </div>
                <span className="text-xl font-bold text-red-600">
                  {analyticsData.expiryAnalysis.expired}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    Expiring in 30 Days
                  </div>
                  <div className="text-xs text-gray-500">
                    Immediate attention needed
                  </div>
                </div>
                <span className="text-xl font-bold text-orange-600">
                  {analyticsData.expiryAnalysis.expiring30}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    Expiring in 90 Days
                  </div>
                  <div className="text-xs text-gray-500">
                    Plan for clearance
                  </div>
                </div>
                <span className="text-xl font-bold text-yellow-600">
                  {analyticsData.expiryAnalysis.expiring90}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Top Products by Value */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Top Products by Value
            </h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          {analyticsData && (
            <div className="space-y-3">
              {analyticsData.topProducts.slice(0, 5).map((product, index) => (
                <div key={product.id} className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {product.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {product.category} • {product.stock_in_pieces} units
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatCurrency(
                        product.stock_in_pieces * product.price_per_piece
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatCurrency(product.price_per_piece)}/unit
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Recent Activity
          </h3>
          <RefreshCw className="h-5 w-5 text-gray-400" />
        </div>
        <div className="space-y-4">
          <ActivityItem
            title="Product sold"
            description="Paracetamol 500mg - 2 units"
            time="2 minutes ago"
            icon={ShoppingCart}
            color="green"
          />
          <ActivityItem
            title="Stock updated"
            description="Amoxicillin 250mg - Added 100 units"
            time="15 minutes ago"
            icon={Package}
            color="blue"
          />
          <ActivityItem
            title="Low stock alert"
            description="Aspirin 325mg below reorder level"
            time="1 hour ago"
            icon={AlertTriangle}
            color="yellow"
          />
          <ActivityItem
            title="New user registered"
            description="Dr. Sarah Johnson added as manager"
            time="2 hours ago"
            icon={Users}
            color="purple"
          />
        </div>
      </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({
  title,
  value,
  change,
  trend,
  icon: IconComponent,
  color,
}) {
  const colorClasses = {
    green: "bg-green-50 text-green-600",
    blue: "bg-blue-50 text-blue-600",
    yellow: "bg-yellow-50 text-yellow-600",
    red: "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600",
  };

  const trendIcon = trend === "up" ? TrendingUp : TrendingDown;
  const trendColor = trend === "up" ? "text-green-600" : "text-red-600";
  const TrendIcon = trendIcon;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          <div className="flex items-center mt-2">
            <TrendIcon className={`h-4 w-4 ${trendColor} mr-1`} />
            <span className={`text-sm font-medium ${trendColor}`}>
              {change}
            </span>
            <span className="text-sm text-gray-500 ml-1">vs last period</span>
          </div>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <IconComponent className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

// Activity Item Component
function ActivityItem({
  title,
  description,
  time,
  icon: IconComponent,
  color,
}) {
  const colorClasses = {
    green: "bg-green-100 text-green-600",
    blue: "bg-blue-100 text-blue-600",
    yellow: "bg-yellow-100 text-yellow-600",
    red: "bg-red-100 text-red-600",
    purple: "bg-purple-100 text-purple-600",
  };

  return (
    <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
      <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
        <IconComponent className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900">{title}</div>
        <div className="text-sm text-gray-600">{description}</div>
      </div>
      <div className="text-xs text-gray-400">{time}</div>
    </div>
  );
}
