import React, { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Package,
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
  DollarSign,
  Users,
  Brain,
  Star,
  ChevronRight,
  CheckCircle,
  XCircle,
  ArrowUp,
  ArrowDown,
  Lightbulb,
  FileText,
  Bot,
  Cog,
  ExternalLink,
} from "lucide-react";

// Mock services and utilities since they are not provided
const ProductService = {
  async getProducts() {
    // In a real app, this would fetch from an API.
    // Returning a mock list of products for demonstration.
    return [
      {
        id: 1,
        name: "Paracetamol 500mg",
        category: "Pain Relief",
        stock_in_pieces: 150,
        reorder_level: 50,
        price_per_piece: 5,
        cost_price: 3,
        expiry_date: "2025-12-31",
        supplier: "Pharma Inc.",
        updated_at: "2023-10-01",
      },
      {
        id: 2,
        name: "Amoxicillin 250mg",
        category: "Antibiotics",
        stock_in_pieces: 20,
        reorder_level: 30,
        price_per_piece: 12,
        cost_price: 8,
        expiry_date: "2024-05-15",
        supplier: "MediCorp",
        updated_at: "2023-09-15",
      },
      {
        id: 3,
        name: "Vitamin C 1000mg",
        category: "Vitamins",
        stock_in_pieces: 300,
        reorder_level: 100,
        price_per_piece: 8,
        cost_price: 5,
        expiry_date: "2026-08-01",
        supplier: "HealthPlus",
        updated_at: "2023-10-05",
      },
      {
        id: 4,
        name: "Loratadine 10mg",
        category: "Respiratory",
        stock_in_pieces: 5,
        reorder_level: 20,
        price_per_piece: 7,
        cost_price: 4,
        expiry_date: "2025-06-30",
        supplier: "Pharma Inc.",
        updated_at: "2023-08-20",
      },
      {
        id: 5,
        name: "Omeprazole 20mg",
        category: "Digestive Health",
        stock_in_pieces: 80,
        reorder_level: 40,
        price_per_piece: 15,
        cost_price: 10,
        expiry_date: "2024-01-20",
        supplier: "MediCorp",
        updated_at: "2023-09-28",
      },
      {
        id: 6,
        name: "Aspirin 81mg",
        category: "Cardiovascular",
        stock_in_pieces: 0,
        reorder_level: 60,
        price_per_piece: 4,
        cost_price: 2,
        expiry_date: "2026-02-10",
        supplier: "HealthPlus",
        updated_at: "2023-07-11",
      },
    ];
  },
  async getProductById(id) {
    const products = await this.getProducts();
    return products.find((p) => p.id === id);
  },
};

const formatCurrency = (amount) =>
  `₱${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
const formatNumber = (num) => num.toLocaleString("en-US");
const formatDate = (date) => new Date(date).toLocaleDateString("en-US");

const EnhancedInventoryDashboard = () => {
  const [orderSuggestions, setOrderSuggestions] = useState([]);
  const [criticalAlerts, setCriticalAlerts] = useState([]);
  const [profitabilityInsights, setProfitabilityInsights] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState("30"); // days
  const [isAutoReordering, setIsAutoReordering] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [exportingReport, setExportingReport] = useState(false);

  // Professional Order Intelligence Service
  const OrderIntelligenceService = {
    // Calculate intelligent order suggestions based on sales velocity and stock levels
    async generateOrderSuggestions() {
      try {
        const products = await ProductService.getProducts();
        const suggestions = [];

        for (const product of products) {
          const stockLevel = product.stock_in_pieces || 0;
          const reorderLevel = product.reorder_level || 10;
          const avgDailySales = await this.calculateDailySalesVelocity(
            product.id
          );
          const daysUntilStockout = stockLevel / (avgDailySales || 0.1);

          // Calculate suggested order quantity
          const leadTimeDays = 7; // Assume 7-day lead time
          const safetyStockDays = 14; // 14-day safety stock
          const suggestedQuantity = Math.ceil(
            avgDailySales * (leadTimeDays + safetyStockDays) - stockLevel
          );

          // Determine urgency level
          let urgency = "low";
          let urgencyColor = "green";
          if (stockLevel <= reorderLevel) {
            urgency = "critical";
            urgencyColor = "red";
          } else if (daysUntilStockout <= 14) {
            urgency = "high";
            urgencyColor = "orange";
          } else if (daysUntilStockout <= 30) {
            urgency = "medium";
            urgencyColor = "yellow";
          }

          // Calculate potential revenue impact
          const potentialLostSales = Math.max(
            0,
            avgDailySales * Math.max(0, 7 - daysUntilStockout)
          );
          const revenueAtRisk = potentialLostSales * product.price_per_piece;

          if (suggestedQuantity > 0 || urgency !== "low") {
            suggestions.push({
              id: product.id,
              name: product.name,
              category: product.category,
              currentStock: stockLevel,
              reorderLevel: reorderLevel,
              suggestedQuantity: Math.max(suggestedQuantity, reorderLevel),
              urgency,
              urgencyColor,
              daysUntilStockout: Math.round(daysUntilStockout),
              avgDailySales: avgDailySales.toFixed(1),
              revenueAtRisk,
              costToOrder:
                suggestedQuantity *
                (product.cost_price || product.price_per_piece * 0.7),
              supplier: product.supplier || "Unknown",
              lastOrderDate: product.updated_at,
            });
          }
        }

        // Sort by urgency and revenue impact
        return suggestions.sort((a, b) => {
          const urgencyOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
            return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
          }
          return b.revenueAtRisk - a.revenueAtRisk;
        });
      } catch (error) {
        console.error("Error generating order suggestions:", error);
        return [];
      }
    },

    // Calculate daily sales velocity (simplified - in real system would use sales history)
    async calculateDailySalesVelocity(productId) {
      try {
        const product = await ProductService.getProductById(productId);
        if (!product) return 0;

        const categoryMultipliers = {
          "Pain Relief": 2.5,
          Antibiotics: 2.0,
          Vitamins: 1.5,
          Respiratory: 3.0,
          "Digestive Health": 1.8,
          Cardiovascular: 1.2,
          "Skin Care": 1.0,
          "General Medicine": 1.3,
        };

        const baseVelocity = categoryMultipliers[product.category] || 1.0;
        const stockInfluence = Math.min(product.stock_in_pieces / 100, 2);
        const priceInfluence = Math.max(0.5, 100 / product.price_per_piece);

        return (
          baseVelocity *
          stockInfluence *
          priceInfluence *
          (Math.random() * 0.5 + 0.75)
        );
      } catch (error) {
        return 0.5;
      }
    },

    // Analyze profitability and suggest focus areas
    async analyzeProfitability() {
      try {
        const products = await ProductService.getProducts();
        const insights = [];
        const categoryProfits = {};
        let totalProfit = 0;

        products.forEach((product) => {
          const costPrice = product.cost_price || product.price_per_piece * 0.7;
          const margin = product.price_per_piece - costPrice;
          const stockValue = product.stock_in_pieces * margin;

          if (!categoryProfits[product.category]) {
            categoryProfits[product.category] = {
              margin: 0,
              stockValue: 0,
              productCount: 0,
            };
          }

          categoryProfits[product.category].margin += margin;
          categoryProfits[product.category].stockValue += stockValue;
          categoryProfits[product.category].productCount += 1;
          totalProfit += stockValue;
        });

        Object.keys(categoryProfits).forEach((category) => {
          const data = categoryProfits[category];
          data.averageMargin = data.margin / data.productCount;
          data.profitShare = (data.stockValue / totalProfit) * 100;

          let recommendation = "";
          if (data.averageMargin > 50) {
            recommendation = "High-margin: consider expanding inventory.";
          } else if (data.averageMargin < 20) {
            recommendation = "Low-margin: review pricing strategy.";
          } else {
            recommendation = "Balanced margins: maintain current strategy.";
          }

          insights.push({
            category,
            averageMargin: data.averageMargin,
            profitShare: data.profitShare,
            productCount: data.productCount,
            totalStockValue: data.stockValue,
            recommendation,
            priority:
              data.averageMargin > 40
                ? "high"
                : data.averageMargin > 25
                ? "medium"
                : "low",
          });
        });

        return insights.sort((a, b) => b.profitShare - a.profitShare);
      } catch (error) {
        console.error("Error analyzing profitability:", error);
        return [];
      }
    },

    // Generate critical business alerts
    async generateCriticalAlerts() {
      try {
        const products = await ProductService.getProducts();
        const alerts = [];

        products.forEach((product) => {
          const stockLevel = product.stock_in_pieces || 0;
          const reorderLevel = product.reorder_level || 10;

          if (stockLevel === 0) {
            alerts.push({
              type: "stock-out",
              severity: "critical",
              product: product.name,
              message: `${product.name} is out of stock`,
              action: "Order immediately",
              impact: "Lost sales",
              icon: XCircle,
              color: "red",
            });
          } else if (stockLevel <= reorderLevel) {
            alerts.push({
              type: "low-stock",
              severity: "high",
              product: product.name,
              message: `${product.name} below reorder level (${stockLevel}/${reorderLevel})`,
              action: "Place order soon",
              impact: "Potential stock-out",
              icon: AlertTriangle,
              color: "orange",
            });
          }

          if (product.expiry_date) {
            const daysUntilExpiry = Math.ceil(
              (new Date(product.expiry_date) - new Date()) /
                (1000 * 60 * 60 * 24)
            );
            if (
              daysUntilExpiry <= 30 &&
              daysUntilExpiry > 0 &&
              stockLevel > 0
            ) {
              alerts.push({
                type: "expiry",
                severity: daysUntilExpiry <= 7 ? "critical" : "medium",
                product: product.name,
                message: `${product.name} expires in ${daysUntilExpiry} days`,
                action: "Discount or promote",
                impact: `Potential loss: ${formatCurrency(
                  stockLevel * product.price_per_piece
                )}`,
                icon: Clock,
                color: daysUntilExpiry <= 7 ? "red" : "yellow",
              });
            }
          }

          const estimatedValue = stockLevel * product.price_per_piece;
          if (estimatedValue > 5000 && stockLevel > 50) {
            alerts.push({
              type: "slow-mover",
              severity: "medium",
              product: product.name,
              message: `High-value slow mover: ${formatCurrency(
                estimatedValue
              )}`,
              action: "Review demand",
              impact: "Capital tied up",
              icon: TrendingDown,
              color: "blue",
            });
          }
        });

        return alerts.sort((a, b) => {
          const severityOrder = { critical: 3, high: 2, medium: 1, low: 0 };
          return severityOrder[b.severity] - severityOrder[a.severity];
        });
      } catch (error) {
        console.error("Error generating alerts:", error);
        return [];
      }
    },
  };

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      console.log("🧠 Loading Professional Order Intelligence Dashboard...");

      const products = await ProductService.getProducts();

      // Calculate Overview Stats
      const totalProducts = products.length;
      const totalValue = products.reduce(
        (sum, p) => sum + p.stock_in_pieces * p.price_per_piece,
        0
      );
      const lowStockItems = products.filter(
        (p) => p.stock_in_pieces > 0 && p.stock_in_pieces <= p.reorder_level
      ).length;
      const outOfStockItems = products.filter(
        (p) => p.stock_in_pieces === 0
      ).length;
      const expiringItems = products.filter((p) => {
        if (!p.expiry_date) return false;
        const days =
          (new Date(p.expiry_date) - new Date()) / (1000 * 60 * 60 * 24);
        return days > 0 && days <= 30;
      }).length;

      const [suggestions, alerts, profitability] = await Promise.all([
        OrderIntelligenceService.generateOrderSuggestions(),
        OrderIntelligenceService.generateCriticalAlerts(),
        OrderIntelligenceService.analyzeProfitability(),
      ]);

      setOverview({
        totalProducts,
        totalValue,
        lowStockItems,
        outOfStockItems,
        expiringItems,
        reorderNeeded: suggestions.length,
      });
      setOrderSuggestions(suggestions.slice(0, 10)); // Top 10 suggestions
      setCriticalAlerts(alerts.slice(0, 8)); // Top 8 alerts
      setProfitabilityInsights(profitability.slice(0, 6)); // Top 6 categories
      setLastUpdated(new Date());

      console.log("✅ Professional Order Dashboard loaded successfully");
    } catch (error) {
      console.error("❌ Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Quick Actions Functions
  const handleExportReport = async () => {
    setExportingReport(true);
    try {
      console.log("📊 Generating Professional Inventory Report...");

      // Simulate report generation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // In a real implementation, this would generate and download a report
      const reportData = {
        timestamp: new Date().toISOString(),
        overview,
        orderSuggestions,
        criticalAlerts,
        profitabilityInsights,
      };

      console.log("✅ Report generated:", reportData);

      // Create a blob and download (simplified)
      const dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(reportData, null, 2));
      const downloadAnchorNode = document.createElement("a");
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute(
        "download",
        `inventory-intelligence-report-${
          new Date().toISOString().split("T")[0]
        }.json`
      );
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    } catch (error) {
      console.error("❌ Error generating report:", error);
    } finally {
      setExportingReport(false);
    }
  };

  const handleAutoReorder = async () => {
    setIsAutoReordering(true);
    try {
      console.log("🤖 Initiating Smart Auto-Reorder Process...");

      // Filter critical and high priority suggestions
      const urgentOrders = orderSuggestions.filter(
        (s) => s.urgency === "critical" || s.urgency === "high"
      );

      if (urgentOrders.length === 0) {
        alert("✅ No urgent orders needed at this time!");
        return;
      }

      // Simulate auto-ordering process
      await new Promise((resolve) => setTimeout(resolve, 3000));

      console.log(`📦 Auto-generated ${urgentOrders.length} priority orders`);

      // In a real implementation, this would create purchase orders
      alert(
        `🚀 Successfully generated ${
          urgentOrders.length
        } priority purchase orders!\n\nTotal estimated cost: ${formatCurrency(
          urgentOrders.reduce((sum, order) => sum + order.costToOrder, 0)
        )}`
      );

      // Refresh dashboard data
      await loadDashboardData();
    } catch (error) {
      console.error("❌ Error in auto-reorder:", error);
      alert("❌ Error occurred during auto-reorder process");
    } finally {
      setIsAutoReordering(false);
    }
  };

  const handleOpenSettings = () => {
    setShowSettings(true);
    console.log("⚙️ Opening Inventory Intelligence Settings");

    // In a real implementation, this would open a settings modal
    alert(
      "⚙️ Settings Panel\n\nConfigure:\n• Reorder thresholds\n• Alert preferences\n• Auto-reorder rules\n• Report templates\n• Supplier integration"
    );
  };

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
      },
      {
        title: "Total Value",
        value: formatCurrency(overview.totalValue),
        icon: DollarSign,
        color: "green",
      },
      {
        title: "Reorder Needed",
        value: overview.reorderNeeded,
        icon: ShoppingCart,
        color: "purple",
        urgent: overview.reorderNeeded > 0,
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
        icon: XCircle,
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
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {cards.map((card, index) => {
          const IconComponent = card.icon;
          const cardClasses = `bg-white p-6 rounded-xl shadow-sm border-l-4 transition-shadow hover:shadow-lg ${
            card.urgent
              ? `border-red-500 bg-red-50/50`
              : `border-${card.color}-500`
          }`;
          const textClasses = `text-2xl font-bold ${
            card.urgent ? "text-red-600" : `text-${card.color}-600`
          }`;
          const iconBgClasses = `p-3 rounded-full ${
            card.urgent
              ? `bg-red-100 text-red-600`
              : `bg-${card.color}-100 text-${card.color}-600`
          }`;

          return (
            <div key={index} className={cardClasses}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {card.title}
                  </p>
                  <p className={textClasses}>{card.value}</p>
                </div>
                <div className={iconBgClasses}>
                  <IconComponent className="h-6 w-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderOrderSuggestions = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center">
          <Target className="h-6 w-6 mr-3 text-blue-600" />
          Priority Restock Recommendations
        </h3>
        <span className="text-sm font-medium bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
          {orderSuggestions.length} recommendations
        </span>
      </div>
      {orderSuggestions.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <Target className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">
            All inventory levels optimal
          </p>
          <p className="text-sm text-gray-400">
            No immediate restocking required
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orderSuggestions.map((s) => (
            <div
              key={s.id}
              className={`flex items-center justify-between p-4 rounded-lg border-l-4 border-${s.urgencyColor}-500 bg-gradient-to-r from-${s.urgencyColor}-50 to-white hover:shadow-md transition-all duration-200`}
            >
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-800 text-lg">
                    {s.name}
                  </h4>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-${s.urgencyColor}-100 text-${s.urgencyColor}-800 border border-${s.urgencyColor}-200`}
                  >
                    {s.urgency} Priority
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <Package className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">
                      Current:{" "}
                      <span className="font-medium text-gray-800">
                        {s.currentStock} pcs
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ShoppingCart className="h-4 w-4 text-blue-500" />
                    <span className="text-gray-600">
                      Suggest:{" "}
                      <span className="font-medium text-blue-700">
                        {s.suggestedQuantity} pcs
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-orange-500" />
                    <span className="text-gray-600">
                      ~
                      <span className="font-medium text-orange-700">
                        {s.daysUntilStockout} days
                      </span>{" "}
                      remaining
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500 flex items-center space-x-4">
                  <span>📈 Sales: {s.avgDailySales} units/day</span>
                  <span>🏢 Supplier: {s.supplier}</span>
                  {s.revenueAtRisk > 0 && (
                    <span className="text-red-600 font-medium">
                      ⚠️ Revenue at risk: {formatCurrency(s.revenueAtRisk)}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right ml-6 min-w-[120px]">
                <p className="text-lg font-bold text-gray-800">
                  {formatCurrency(s.costToOrder)}
                </p>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Estimated Cost
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCriticalAlerts = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center">
          <AlertTriangle className="h-6 w-6 mr-3 text-red-600" />
          Business Risk Alerts
        </h3>
        <span className="text-sm font-medium bg-red-100 text-red-800 px-3 py-1 rounded-full">
          {criticalAlerts.length} active alerts
        </span>
      </div>
      {criticalAlerts.length === 0 ? (
        <div className="text-center py-8 bg-green-50 rounded-lg border border-green-200">
          <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-3" />
          <p className="text-green-700 font-medium">All systems operational</p>
          <p className="text-sm text-green-600">No critical alerts detected</p>
        </div>
      ) : (
        <div className="space-y-3">
          {criticalAlerts.map((alert, index) => {
            const Icon = alert.icon;
            return (
              <div
                key={index}
                className={`flex items-start p-3 rounded-lg bg-${alert.color}-50 border border-${alert.color}-200`}
              >
                <Icon
                  className={`h-5 w-5 mr-3 mt-1 flex-shrink-0 text-${alert.color}-600`}
                />
                <div>
                  <h4 className="font-medium text-gray-800">{alert.message}</h4>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Action:</span>{" "}
                    {alert.action}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {alert.type.replace("-", " ")} Alert • Impact:{" "}
                    {alert.impact}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderProfitabilityInsights = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center">
          <Lightbulb className="h-6 w-6 mr-3 text-green-600" />
          Strategic Business Intelligence
        </h3>
        <span className="text-sm font-medium bg-green-100 text-green-800 px-3 py-1 rounded-full">
          Category Analysis
        </span>
      </div>
      {profitabilityInsights.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <BarChart3 className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">Analyzing data...</p>
          <p className="text-sm text-gray-400">
            Insufficient data for insights
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {profitabilityInsights.map((insight) => (
            <div key={insight.category} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-gray-800">
                    {insight.category}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {insight.productCount} products
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(insight.totalStockValue)}
                  </p>
                  <p className="text-xs text-gray-500">
                    ({insight.profitShare.toFixed(1)}% of total profit)
                  </p>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-700 bg-white p-2 rounded">
                💡 {insight.recommendation}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <RefreshCw className="h-10 w-10 text-blue-600 animate-spin mx-auto" />
          <p className="mt-4 text-lg font-semibold text-gray-700">
            Analyzing Inventory Data...
          </p>
          <p className="text-sm text-gray-500">
            Please wait while we generate smart insights.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-xl shadow-lg">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Inventory Intelligence Center
                </h1>
                <p className="text-gray-600 text-lg">
                  AI-powered insights for optimized pharmacy operations
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3 mt-4 sm:mt-0">
              {lastUpdated && (
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
              <button
                onClick={loadDashboardData}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </button>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Zap className="h-5 w-5 mr-2 text-yellow-500" />
                Quick Actions
              </h3>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleExportReport}
                  disabled={exportingReport}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
                >
                  {exportingReport ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  <span className="font-medium">
                    {exportingReport ? "Generating..." : "Export Report"}
                  </span>
                </button>

                <button
                  onClick={handleAutoReorder}
                  disabled={isAutoReordering || orderSuggestions.length === 0}
                  className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
                >
                  {isAutoReordering ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                  <span className="font-medium">
                    {isAutoReordering ? "Processing..." : "Smart Auto-Reorder"}
                  </span>
                </button>

                <button
                  onClick={handleOpenSettings}
                  className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <Cog className="h-4 w-4" />
                  <span className="font-medium">Settings</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        {renderOverviewCards()}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderOrderSuggestions()}
          {renderCriticalAlerts()}
        </div>

        <div className="grid grid-cols-1 gap-6">
          {renderProfitabilityInsights()}
        </div>

        {/* Action Summary & KPIs */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-500 p-2 rounded-lg">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Action Plan & Performance
                </h3>
                <p className="text-gray-600">
                  Strategic recommendations based on current analysis
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">System Health Score</p>
              <p className="text-2xl font-bold text-green-600">
                {criticalAlerts.length === 0
                  ? "98%"
                  : criticalAlerts.length <= 2
                  ? "85%"
                  : "72%"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-200">
              <div className="flex items-center space-x-2 mb-3">
                <Clock className="h-5 w-5 text-red-500" />
                <h4 className="font-semibold text-gray-900">
                  Immediate Actions
                </h4>
              </div>
              <ul className="text-sm text-gray-700 space-y-2">
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  <span>
                    Process{" "}
                    {
                      orderSuggestions.filter((s) => s.urgency === "critical")
                        .length
                    }{" "}
                    critical orders
                  </span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  <span>
                    Review{" "}
                    {
                      criticalAlerts.filter((a) => a.severity === "critical")
                        .length
                    }{" "}
                    critical alerts
                  </span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  <span>Export detailed report for management</span>
                </li>
              </ul>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-200">
              <div className="flex items-center space-x-2 mb-3">
                <Calendar className="h-5 w-5 text-orange-500" />
                <h4 className="font-semibold text-gray-900">This Week</h4>
              </div>
              <ul className="text-sm text-gray-700 space-y-2">
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  <span>
                    Place{" "}
                    {
                      orderSuggestions.filter((s) => s.urgency === "high")
                        .length
                    }{" "}
                    high-priority orders
                  </span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span>Monitor expiring products for discounting</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Review supplier performance metrics</span>
                </li>
              </ul>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-200">
              <div className="flex items-center space-x-2 mb-3">
                <BarChart3 className="h-5 w-5 text-green-500" />
                <h4 className="font-semibold text-gray-900">Strategic Focus</h4>
              </div>
              <ul className="text-sm text-gray-700 space-y-2">
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Optimize high-margin categories</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  <span>Implement predictive reordering</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                  <span>Enhance supplier relationships</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-6 pt-6 border-t border-blue-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-white p-3 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(
                    orderSuggestions.reduce((sum, s) => sum + s.costToOrder, 0)
                  )}
                </p>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Total Order Value
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(
                    orderSuggestions.reduce(
                      (sum, s) => sum + s.revenueAtRisk,
                      0
                    )
                  )}
                </p>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Revenue Protected
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">
                  {profitabilityInsights.length > 0
                    ? (
                        profitabilityInsights.reduce(
                          (sum, p) => sum + p.averageMargin,
                          0
                        ) / profitabilityInsights.length
                      ).toFixed(1) + "%"
                    : "0%"}
                </p>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Avg Margin
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">
                  {
                    orderSuggestions.filter(
                      (s) => s.urgency === "critical" || s.urgency === "high"
                    ).length
                  }
                </p>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Priority Items
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedInventoryDashboard;
