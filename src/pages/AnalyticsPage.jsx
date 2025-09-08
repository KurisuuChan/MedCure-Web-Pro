import React, { useState, useMemo, useEffect } from "react";
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
  Tag,
} from "lucide-react";
import { formatCurrency, formatNumber } from "../utils/formatting";
import { useInventory } from "../features/inventory/hooks/useInventory";
import { IntelligentCategoryService } from "../services/intelligentCategoryService";

export default function AnalyticsPage() {
  const { allProducts, analytics, isLoading } = useInventory();
  const [dateRange, setDateRange] = useState("30"); // days
  const [categoryInsights, setCategoryInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  // Load intelligent category insights
  useEffect(() => {
    const loadCategoryInsights = async () => {
      setLoadingInsights(true);
      try {
        const result = await IntelligentCategoryService.getCategoryInsights();
        if (result.success) {
          setCategoryInsights(result.data);
        }
      } catch (error) {
        console.error("Failed to load category insights:", error);
      } finally {
        setLoadingInsights(false);
      }
    };

    loadCategoryInsights();
  }, [allProducts]);

  // Debug logging
  console.log("🔍 [AnalyticsPage] Debug Info:", {
    allProductsCount: allProducts?.length || 0,
    analyticsData: analytics,
    categoryInsights,
    isLoading,
    firstProduct: allProducts?.[0],
  });

  // Calculate analytics
  const analyticsData = useMemo(() => {
    console.log("📊 [AnalyticsPage] Debug Info:", {
      allProductsCount: allProducts?.length || 0,
      analyticsFromHook: analytics,
      isLoading,
    });

    if (!allProducts || !allProducts.length) {
      console.log("⚠️ [AnalyticsPage] No products available for analytics");
      return {
        categoryStats: [],
        stockLevels: { outOfStock: 0, lowStock: 0, normalStock: 0 },
        expiryAnalysis: { expired: 0, expiring30: 0, expiring90: 0 },
        topProducts: [],
      };
    }

    // Filter out archived products for analytics
    const activeProducts = allProducts.filter((p) => !p.is_archived);
    console.log("📊 Active products for analytics:", activeProducts.length);

    const categories = [
      ...new Set(activeProducts.map((p) => p.category || "Uncategorized")),
    ];
    const categoryStats = categories.map((category) => {
      const categoryProducts = activeProducts.filter(
        (p) => (p.category || "Uncategorized") === category
      );
      const totalValue = categoryProducts.reduce(
        (sum, p) => sum + (p.stock_in_pieces || 0) * (p.price_per_piece || 0),
        0
      );
      const totalStock = categoryProducts.reduce(
        (sum, p) => sum + (p.stock_in_pieces || 0),
        0
      );

      return {
        category,
        products: categoryProducts.length,
        totalValue,
        totalStock,
        avgPrice:
          categoryProducts.length > 0
            ? categoryProducts.reduce(
                (sum, p) => sum + (p.price_per_piece || 0),
                0
              ) / categoryProducts.length
            : 0,
      };
    });

    // Stock level distribution
    const stockLevels = {
      outOfStock: activeProducts.filter((p) => (p.stock_in_pieces || 0) === 0)
        .length,
      lowStock: activeProducts.filter(
        (p) =>
          (p.stock_in_pieces || 0) > 0 &&
          (p.stock_in_pieces || 0) <= (p.reorder_level || 10)
      ).length,
      normalStock: activeProducts.filter(
        (p) => (p.stock_in_pieces || 0) > (p.reorder_level || 10)
      ).length,
    };

    // Expiry analysis
    const now = new Date();
    const expired = activeProducts.filter((p) => {
      if (!p.expiry_date) return false;
      return new Date(p.expiry_date) < now;
    }).length;

    const expiring30 = activeProducts.filter((p) => {
      if (!p.expiry_date) return false;
      const expiryDate = new Date(p.expiry_date);
      const daysUntilExpiry = Math.ceil(
        (expiryDate - now) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
    }).length;

    const expiring90 = activeProducts.filter((p) => {
      if (!p.expiry_date) return false;
      const expiryDate = new Date(p.expiry_date);
      const daysUntilExpiry = Math.ceil(
        (expiryDate - now) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiry > 30 && daysUntilExpiry <= 90;
    }).length;

    // Top products by value
    const topProducts = [...activeProducts]
      .sort(
        (a, b) =>
          (b.stock_in_pieces || 0) * (b.price_per_piece || 0) -
          (a.stock_in_pieces || 0) * (a.price_per_piece || 0)
      )
      .slice(0, 10);

    const result = {
      categoryStats,
      stockLevels,
      expiryAnalysis: { expired, expiring30, expiring90 },
      topProducts,
    };

    console.log("📊 [AnalyticsPage] Analytics calculated:", result);
    return result;
  }, [allProducts]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analyticsData || !allProducts?.length) {
    return (
      <div className="space-y-6">
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
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <Package className="mx-auto h-12 w-12 text-yellow-400 mb-4" />
          <h3 className="text-lg font-medium text-yellow-800 mb-2">
            No Data Available
          </h3>
          <p className="text-yellow-700">
            No products found in the inventory. Add some products to see
            analytics data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-purple-100 p-3 rounded-xl">
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                <span>Analytics Dashboard</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Real-time
                </span>
              </h1>
              <p className="text-gray-600 mt-1">
                Comprehensive insights into your pharmacy operations and
                inventory performance
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3 mt-4 lg:mt-0">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-700 font-medium transition-all duration-200"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
            <button className="group flex items-center space-x-2 px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 hover:border-gray-300 transition-all duration-200">
              <Filter className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
              <span className="font-medium">Filters</span>
            </button>
            <button className="group flex items-center space-x-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 shadow-sm hover:shadow-md">
              <Download className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
              <span className="font-medium">Export Report</span>
            </button>
          </div>
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
          value={
            analytics.totalProducts > 0
              ? formatCurrency(analytics.totalValue / analytics.totalProducts)
              : formatCurrency(0)
          }
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

      {/* Intelligent Category Insights */}
      {categoryInsights && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Tag className="h-5 w-5 text-blue-600" />
              <span>Intelligent Category Insights</span>
            </h3>
            <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
              Enhanced Analytics
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {categoryInsights.total_categories}
              </div>
              <div className="text-xs text-gray-600">Total Categories</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(categoryInsights.total_value)}
              </div>
              <div className="text-xs text-gray-600">Total Value</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {categoryInsights.auto_created_categories?.length || 0}
              </div>
              <div className="text-xs text-gray-600">Auto-Created</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {categoryInsights.categories_needing_attention?.length || 0}
              </div>
              <div className="text-xs text-gray-600">Need Attention</div>
            </div>
          </div>

          {categoryInsights.top_value_categories?.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">
                Top Value Categories
              </h4>
              <div className="space-y-2">
                {categoryInsights.top_value_categories
                  .slice(0, 5)
                  .map((category, index) => (
                    <div
                      key={category.name}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            index === 0
                              ? "bg-yellow-500"
                              : index === 1
                              ? "bg-gray-400"
                              : index === 2
                              ? "bg-orange-500"
                              : "bg-blue-500"
                          }`}
                        ></div>
                        <span className="text-sm font-medium">
                          {category.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-900">
                          {formatCurrency(category.stats?.total_value || 0)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {category.stats?.total_products || 0} products
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

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
