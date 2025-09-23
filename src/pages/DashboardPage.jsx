import React, { useState, useEffect, useCallback } from "react";
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  AlertTriangle,
  Activity,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  BarChart3,
  Stethoscope,
  Heart,
  Bell,
  ChevronRight,
  Eye,
  ArrowUpRight,
  Database,
  Headphones,
  Pill,
  UserCheck,
} from "lucide-react";
import { DashboardService } from "../services/domains/analytics/dashboardService";
import { formatCurrency, formatNumber } from "../utils/formatting";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import SalesChart from "../components/charts/SalesChart";
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

// Memoized components to prevent unnecessary re-renders
const MemoizedCleanMetricCard = React.memo(CleanMetricCard);
const MemoizedCleanActionCard = React.memo(CleanActionCard);

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // OPTIMIZATION: Use useCallback to memoize the data loading function
  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log("🔍 [Dashboard] Loading dashboard data...");

      const response = await DashboardService.getDashboardData();
      console.log("📊 [Dashboard] Service response:", {
        success: response.success,
        hasData: !!response.data,
      });

      if (response.success) {
        setDashboardData(response.data);
        console.log("✅ [Dashboard] Data loaded successfully.");
      } else {
        const errorMessage = response.error || "Failed to load dashboard data";
        console.error("❌ [Dashboard] Service returned error:", errorMessage);
        setError(errorMessage);
      }
    } catch (err) {
      console.error("❌ [Dashboard] Error loading dashboard data:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array means this function is created only once

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // BEST PRACTICE: Centralize state rendering logic
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center p-8 bg-white shadow-lg rounded-xl">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Dashboard Error
          </h3>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={loadDashboardData}
            className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2 animate-spin-slow" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No dashboard data available.</p>
        </div>
      </div>
    );
  }

  // Derived state for date/time to avoid recalculating on every render
  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <header className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-6">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-700">
                    System Online
                  </span>
                </div>
                <div className="w-px h-4 bg-gray-200"></div>
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-600">
                    Real-time Monitoring
                  </span>
                </div>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-2 text-gray-900">
                Dashboard
              </h1>
              <p className="text-gray-600 text-lg mb-6">
                Welcome back! Here's your pharmacy overview for today.
              </p>
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-700 font-medium">
                    {currentTime}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{currentDate}</span>
                </div>
              </div>
            </div>
            <div className="mt-6 lg:mt-0 flex items-center space-x-3">
              <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2 border border-gray-200">
                <Bell className="h-4 w-4" />
                <span>3 Alerts</span>
              </button>
              <button
                onClick={loadDashboardData}
                disabled={isLoading}
                className="bg-gray-900 text-white hover:bg-gray-800 px-6 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2 font-medium disabled:bg-gray-400"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
                <span>{isLoading ? "Refreshing..." : "Refresh"}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Metrics Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MemoizedCleanMetricCard
            title="Revenue Today"
            value={formatCurrency(dashboardData.totalSales || 0)}
            icon={DollarSign}
            trend={8.2}
            trendText="vs yesterday"
            color="green"
          />
          <MemoizedCleanMetricCard
            title="Total Products"
            value={formatNumber(dashboardData.totalProducts || 0)}
            icon={Package}
            trend={2.1}
            trendText="this month"
            color="blue"
          />
          <MemoizedCleanMetricCard
            title="Low Stock Alert"
            value={formatNumber(dashboardData.lowStockCount || 0)}
            icon={AlertTriangle}
            trend={-5.3}
            trendText="improvement"
            color="amber"
            isAlert={true}
          />
          <MemoizedCleanMetricCard
            title="Active Users"
            value={formatNumber(dashboardData.activeUsers || 0)}
            icon={Users}
            trend={12.5}
            trendText="growth rate"
            color="purple"
          />
        </section>

        {/* Main Content Grid */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Quick Actions */}
          <aside className="lg:col-span-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Quick Actions
                  </h3>
                  <p className="text-gray-500 text-sm">Essential tasks</p>
                </div>
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Stethoscope className="h-5 w-5 text-gray-600" />
                </div>
              </div>
              <div className="space-y-3">
                <MemoizedCleanActionCard
                  icon={ShoppingCart}
                  title="Process Sale"
                  description="Quick POS transaction"
                  href="/pos"
                  color="blue"
                  badge="Popular"
                />
                <MemoizedCleanActionCard
                  icon={Pill}
                  title="Add Medication"
                  description="Add new products"
                  href="/inventory"
                  color="green"
                />
                <MemoizedCleanActionCard
                  icon={Package}
                  title="Batch Management"
                  description="Track product batches"
                  href="/batch-management"
                  color="purple"
                />
                <MemoizedCleanActionCard
                  icon={UserCheck}
                  title="User Management"
                  description="System administration"
                  href="/management"
                  color="gray"
                />
                <MemoizedCleanActionCard
                  icon={Users}
                  title="Customer Information"
                  description="View customer database"
                  href="/customers"
                  color="orange"
                />
              </div>
            </div>
          </aside>

          {/* Sales Chart Overview */}
          <section className="lg:col-span-8">
            <SalesChart />
          </section>
        </main>

        {/* Compact Performance & Recent Activity Row */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Performance Stats */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                  <Activity className="h-4 w-4 mr-2 text-gray-500" />
                  Today's Performance
                </h3>
                <span className="text-xs text-green-600 font-medium">+15.3%</span>
              </div>
              <div className="grid grid-cols-3 gap-4 flex-1 items-center">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-900">24</div>
                  <div className="text-xs text-gray-600">Sales Today</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-900">98%</div>
                  <div className="text-xs text-gray-600">Satisfaction</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-900">5.2min</div>
                  <div className="text-xs text-gray-600">Avg. Time</div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity - Mini */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 h-full flex flex-col">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                <ShoppingCart className="h-4 w-4 mr-2 text-gray-500" />
                Recent Sales
              </h3>
              <div className="space-y-2 flex-1">
                {dashboardData.recentSales?.length > 0 ? (
                  dashboardData.recentSales
                    .slice(0, 3)
                    .map((sale, index) => (
                      <div key={sale.id || index} className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-gray-600 truncate max-w-20">
                            {sale.customer_name || 'Walk-in'}
                          </span>
                        </div>
                        <div className="font-medium text-gray-900">
                          {formatCurrency(sale.total_amount || 0)}
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-2 flex-1 flex items-center justify-center">
                    <p className="text-xs text-gray-400">No recent sales</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Analytics Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Trend Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Sales Trend</h3>
                <p className="text-sm text-gray-600">Daily sales over the last 7 days</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="h-64">
              <Line
                data={{
                  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                  datasets: [
                    {
                      label: 'Sales (₱)',
                      data: [12000, 15000, 13500, 18000, 16500, 22000, 19000],
                      borderColor: 'rgb(59, 130, 246)',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      fill: true,
                      tension: 0.4,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function(value) {
                          return '₱' + value.toLocaleString();
                        },
                      },
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* Inventory Value Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Inventory Analysis</h3>
                <p className="text-sm text-gray-600">Stock value by category</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="h-64">
              <Doughnut
                data={{
                  labels: ['Medicines', 'Vitamins', 'Medical Supplies', 'Personal Care', 'Others'],
                  datasets: [
                    {
                      data: [45, 25, 15, 10, 5],
                      backgroundColor: [
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(139, 92, 246, 0.8)',
                        'rgba(107, 114, 128, 0.8)',
                      ],
                      borderWidth: 2,
                      borderColor: '#ffffff',
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        padding: 20,
                        usePointStyle: true,
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
        </section>

        {/* Top Products and Expiry Alerts */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Selling Products */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Top Products</h3>
                <p className="text-sm text-gray-600">Best selling items this month</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="space-y-4">
              {[
                { name: 'Paracetamol 500mg', sales: 145, value: 7250 },
                { name: 'Amoxicillin 250mg', sales: 128, value: 12800 },
                { name: 'Vitamin C 500mg', sales: 98, value: 4900 },
                { name: 'Ibuprofen 400mg', sales: 87, value: 6090 },
                { name: 'Multivitamins', sales: 76, value: 3800 },
              ].map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-6 h-6 bg-purple-100 text-purple-600 rounded-full text-xs font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.sales} units sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(product.value)}</p>
                    <div className="w-16 h-1 bg-gray-200 rounded-full mt-1">
                      <div 
                        className="h-1 bg-purple-500 rounded-full" 
                        style={{ width: `${(product.sales / 145) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Expiry Alerts */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Expiry Alerts</h3>
                <p className="text-sm text-gray-600">Products expiring soon</p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
            </div>
            <div className="space-y-4">
              {[
                { name: 'Cough Syrup 120ml', expiry: '2024-12-15', days: 3, status: 'critical' },
                { name: 'Antibiotic Cream', expiry: '2024-12-20', days: 8, status: 'warning' },
                { name: 'Pain Relief Gel', expiry: '2024-12-28', days: 16, status: 'notice' },
                { name: 'Eye Drops 10ml', expiry: '2025-01-05', days: 24, status: 'notice' },
              ].map((product, index) => {
                const statusColors = {
                  critical: 'bg-red-100 text-red-800 border-red-200',
                  warning: 'bg-orange-100 text-orange-800 border-orange-200',
                  notice: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                };
                
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`p-1.5 rounded-full ${
                        product.status === 'critical' ? 'bg-red-100' :
                        product.status === 'warning' ? 'bg-orange-100' : 'bg-yellow-100'
                      }`}>
                        <AlertTriangle className={`h-3 w-3 ${
                          product.status === 'critical' ? 'text-red-600' :
                          product.status === 'warning' ? 'text-orange-600' : 'text-yellow-600'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                        <p className="text-xs text-gray-500">Expires: {product.expiry}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColors[product.status]}`}>
                        {product.days} days
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <a 
                href="/batch-management"
                className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center space-x-1"
              >
                <span>View all batches</span>
                <ChevronRight className="h-3 w-3" />
              </a>
            </div>
          </div>
        </section>

        {/* Enhanced Stock Alerts */}
        {dashboardData.lowStockCount > 0 && (
          <section className="bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 rounded-2xl border border-amber-200 overflow-hidden shadow-lg">
            <div className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
                    <AlertTriangle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-amber-900">
                      Inventory Alerts
                    </h3>
                    <p className="text-amber-700">
                      Critical stock levels detected
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="px-4 py-2 bg-amber-200 text-amber-800 font-bold rounded-full text-sm">
                    {dashboardData.lowStockCount} items
                  </span>
                  <a
                    href="/inventory"
                    className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-2 rounded-xl hover:from-amber-700 hover:to-orange-700 transition-all duration-200 flex items-center space-x-2 font-semibold shadow-lg"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Review Inventory</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* System Status Footer */}
        <footer className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-600">
                  All systems operational
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Database className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-500">
                  Database: Connected
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Headphones className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-500">
                  Support: Available 24/7
                </span>
              </div>
            </div>
            <div className="text-xs text-gray-400">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

// Sub-components for better organization and reusability

const PerformanceStat = ({ icon: Icon, value, label, color }) => {
  const colorClasses = {
    blue: "bg-blue-600",
    green: "bg-green-600",
    purple: "bg-purple-600",
  };
  return (
    <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-100">
      <div
        className={`w-10 h-10 ${colorClasses[color]} rounded-lg flex items-center justify-center mx-auto mb-3`}
      >
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
};

const RecentSaleItem = ({ sale }) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-100">
    <div className="flex items-center space-x-3">
      <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center">
        <ShoppingCart className="h-4 w-4 text-white" />
      </div>
      <div>
        <p className="font-medium text-gray-900 text-sm">
          Sale #{sale.id?.toString().slice(-6)}
        </p>
        <p className="text-xs text-gray-500">
          {sale.customer_name || "Walk-in Customer"}
        </p>
      </div>
    </div>
    <div className="text-right">
      <p className="font-semibold text-gray-900 text-sm">
        {formatCurrency(sale.total_amount || 0)}
      </p>
      <p className="text-xs text-gray-500">
        {new Date(sale.created_at).toLocaleDateString()}
      </p>
    </div>
  </div>
);

function CleanMetricCard({
  title,
  value,
  icon: IconComponent,
  trend,
  trendText,
  color,
  isAlert = false,
}) {
  const colorClasses = {
    green: "bg-green-600",
    blue: "bg-blue-600",
    amber: "bg-amber-600",
    purple: "bg-purple-600",
  };
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow ${
        isAlert ? "border-amber-200 bg-amber-50/20" : "border-gray-200"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <IconComponent className="h-5 w-5 text-white" />
        </div>
        {trend && (
          <div
            className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
              trend > 0
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {trend > 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <div className="space-y-1">
        <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {trendText && <p className="text-gray-500 text-xs">{trendText}</p>}
      </div>
    </div>
  );
}

function CleanActionCard({
  icon: IconComponent,
  title,
  description,
  href,
  color,
  badge,
}) {
  const colorClasses = {
    blue: "bg-blue-600",
    green: "bg-green-600",
    purple: "bg-purple-600",
    gray: "bg-gray-600",
    orange: "bg-orange-600",
  };
  return (
    <a
      href={href}
      className="relative block group bg-white hover:bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-all duration-200" // FIX: Added `relative`
    >
      <div className="flex items-center space-x-3">
        {badge && (
          <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-medium px-2 py-0.5 rounded-full z-10">
            {badge}
          </div>
        )}
        <div
          className={`p-2 rounded-lg ${colorClasses[color]} group-hover:scale-105 transition-transform duration-200`}
        >
          <IconComponent className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 text-sm">{title}</h4>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all duration-200" />
      </div>
    </a>
  );
}
