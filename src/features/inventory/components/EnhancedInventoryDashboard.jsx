import React, { useState, useEffect, useCallback } from "react";
import {
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  RefreshCw,
  Download,
  Filter,
  Search,
  Calendar,
  BarChart3,
  Target,
  Clock,
  ShoppingCart,
  Truck,
  Zap,
  Eye,
  Settings,
} from "lucide-react";
import { EnhancedInventoryService } from "../../../services/enhancedInventoryService";
import { formatCurrency } from "../../../utils/formatting";

const EnhancedInventoryDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [reorderSuggestions, setReorderSuggestions] = useState([]);
  const [expiringProducts, setExpiringProducts] = useState([]);
  const [categoryPerformance, setCategoryPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      console.log("🔄 Loading enhanced inventory dashboard data...");

      const [overviewData, reorderData, expiringData, categoryData] =
        await Promise.all([
          EnhancedInventoryService.getInventoryOverview(),
          EnhancedInventoryService.getReorderSuggestions(),
          EnhancedInventoryService.getExpiringProducts(30),
          EnhancedInventoryService.getCategoryPerformance(),
        ]);

      setOverview(overviewData);
      setReorderSuggestions(reorderData);
      setExpiringProducts(expiringData);
      setCategoryPerformance(categoryData);
      setLastUpdated(new Date());

      console.log("✅ Enhanced inventory dashboard data loaded successfully");
    } catch (error) {
      console.error("❌ Error loading enhanced inventory dashboard:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const renderOverviewCards = () => {
    if (!overview) return null;

    const cards = [
      {
        title: "Total Products",
        value: overview.totalProducts,
        icon: Package,
        color: "blue",
        trend: null,
      },
      {
        title: "Total Value",
        value: formatCurrency(overview.totalValue),
        icon: BarChart3,
        color: "green",
        trend: null,
      },
      {
        title: "Low Stock Items",
        value: overview.lowStockItems,
        icon: AlertTriangle,
        color: "orange",
        urgent: overview.lowStockItems > 0,
      },
      {
        title: "Out of Stock",
        value: overview.outOfStockItems,
        icon: TrendingDown,
        color: "red",
        urgent: overview.outOfStockItems > 0,
      },
      {
        title: "Expiring Soon",
        value: overview.expiringItems,
        icon: Clock,
        color: "yellow",
        urgent: overview.expiringItems > 0,
      },
      {
        title: "Reorder Needed",
        value: reorderSuggestions.length,
        icon: ShoppingCart,
        color: "purple",
        urgent: reorderSuggestions.length > 0,
      },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {cards.map((card, index) => {
          const IconComponent = card.icon;
          return (
            <div
              key={index}
              className={`bg-white p-6 rounded-xl shadow-sm border-l-4 ${
                card.urgent
                  ? "border-red-500 bg-red-50"
                  : `border-${card.color}-500`
              } hover:shadow-md transition-shadow`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {card.title}
                  </p>
                  <p
                    className={`text-2xl font-bold ${
                      card.urgent ? "text-red-600" : `text-${card.color}-600`
                    }`}
                  >
                    {card.value}
                  </p>
                </div>
                <div
                  className={`p-3 rounded-lg ${
                    card.urgent
                      ? "bg-red-100"
                      : `bg-${card.color}-100 text-${card.color}-600`
                  }`}
                >
                  <IconComponent className="h-6 w-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderReorderSuggestions = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Target className="h-5 w-5 mr-2 text-blue-600" />
          Reorder Suggestions
        </h3>
        <span className="text-sm text-gray-500">
          {reorderSuggestions.length} items
        </span>
      </div>

      {reorderSuggestions.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No reorder suggestions at this time
        </p>
      ) : (
        <div className="space-y-4">
          {reorderSuggestions.slice(0, 10).map((suggestion, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{suggestion.name}</h4>
                <p className="text-sm text-gray-600">
                  Current: {suggestion.currentStock} pieces • Suggested:{" "}
                  {suggestion.suggestedOrder} pieces
                </p>
                <p className="text-xs text-gray-500">
                  Sales velocity: {suggestion.salesVelocity} units/day
                </p>
              </div>
              <div className="text-right">
                <div
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    suggestion.priority === "high"
                      ? "bg-red-100 text-red-800"
                      : suggestion.priority === "medium"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {suggestion.priority} priority
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Est. cost: {formatCurrency(suggestion.estimatedCost)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderExpiringProducts = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Clock className="h-5 w-5 mr-2 text-orange-600" />
          Expiring Products (30 days)
        </h3>
        <span className="text-sm text-gray-500">
          {expiringProducts.length} items
        </span>
      </div>

      {expiringProducts.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No products expiring in the next 30 days
        </p>
      ) : (
        <div className="space-y-4">
          {expiringProducts.slice(0, 10).map((product, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200"
            >
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{product.name}</h4>
                <p className="text-sm text-gray-600">
                  Batch: {product.batch_number || "N/A"} • Stock:{" "}
                  {product.stock_in_pieces} pieces
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-orange-600">
                  Expires: {new Date(product.expiry_date).toLocaleDateString()}
                </p>
                <p className="text-xs text-orange-500">
                  {product.daysToExpiry} days remaining
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCategoryPerformance = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
          Category Performance
        </h3>
      </div>

      {categoryPerformance.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No category data available
        </p>
      ) : (
        <div className="space-y-4">
          {categoryPerformance.map((category, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">
                  {category.category}
                </h4>
                <p className="text-sm text-gray-600">
                  {category.productCount} products • {category.totalSales} sales
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-purple-600">
                  {formatCurrency(category.revenue)}
                </p>
                <div className="flex items-center">
                  {category.growth > 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span
                    className={`text-sm ${
                      category.growth > 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {category.growth > 0 ? "+" : ""}
                    {category.growth}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mr-3" />
            <span className="text-lg text-gray-600">
              Loading Enhanced Inventory Dashboard...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 p-3 rounded-xl">
              <Package className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Enhanced Inventory
              </h1>
              <p className="text-gray-600">
                Advanced inventory management with smart insights and automation
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {lastUpdated && (
              <span className="text-sm text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={loadDashboardData}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      {renderOverviewCards()}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reorder Suggestions */}
        {renderReorderSuggestions()}

        {/* Expiring Products */}
        {renderExpiringProducts()}
      </div>

      {/* Category Performance */}
      <div className="grid grid-cols-1 gap-6">
        {renderCategoryPerformance()}
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          <div className="flex space-x-3">
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </button>
            <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center">
              <Zap className="h-4 w-4 mr-2" />
              Auto-Reorder
            </button>
            <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedInventoryDashboard;
