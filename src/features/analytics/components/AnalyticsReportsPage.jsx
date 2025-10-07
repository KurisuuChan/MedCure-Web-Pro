import { useState } from "react";
import { format } from "date-fns";
import {
  BarChart3,
  TrendingUp,
  Package,
  AlertTriangle,
  FileText,
  Download,
  Calendar,
  Activity,
  Sparkles,
} from "lucide-react";
import { ReportsService } from "../../../services/domains/analytics/auditReportsService";

// Utility to create helpful no-data messages
const createNoDataMessage = (dateRange, reportType = "sales") => {
  const { startDate, endDate } = dateRange;
  return (
    `📊 No ${reportType === "sales" ? "Sales" : "Financial"} Data Found\n\n` +
    `Date Range: ${startDate} to ${endDate}\n\n` +
    `Possible Solutions:\n` +
    `✓ Try "Last 7 days" or "Last 30 days" quick select button\n` +
    `✓ Check Transaction History to see when your sales occurred\n` +
    `✓ Adjust date range to include dates with actual sales\n` +
    `✓ Ensure sales are marked as "completed" in the system\n\n` +
    `💡 Tip: The system only includes completed transactions in reports`
  );
};

const AnalyticsReportsPage = () => {
  const [reports, setReports] = useState({
    inventory: null,
    sales: null,
    stockAlerts: null,
    performance: null,
  });

  const [loading, setLoading] = useState({
    inventory: false,
    sales: false,
    stockAlerts: false,
    performance: false,
  });

  // Date range states for reports
  const [salesDateRange, setSalesDateRange] = useState({
    startDate: format(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      "yyyy-MM-dd"
    ),
    endDate: format(new Date(), "yyyy-MM-dd"),
  });

  // Debug: Log current date range whenever it changes
  console.log("📅 [AnalyticsReportsPage] Current date range:", salesDateRange);

  // stock alert thresholds removed from UI — alerts are computed from server data

  // Generate Inventory Report
  const generateInventoryReport = async () => {
    setLoading((prev) => ({ ...prev, inventory: true }));
    try {
      const result = await ReportsService.generateInventoryReport();
      if (result.success && result.data) {
        setReports((prev) => ({
          ...prev,
          inventory: {
            totalProducts: result.data.summary.totalProducts,
            totalValue: result.data.summary.totalStockValue,
            totalCostValue: result.data.summary.totalCostValue || 0,
            lowStockCount: result.data.stockLevels.lowStock,
            outOfStock: result.data.stockLevels.outOfStock,
            normalStock: result.data.stockLevels.normalStock || 0,
            expiringItems: result.data.expiryAnalysis?.expiring30 || 0,
            expiredItems: result.data.expiryAnalysis?.expired || 0,
            topValueProducts: result.data.topValueProducts || [],
            categoryAnalysis: result.data.categoryAnalysis || [],
            fullData: result.data,
          },
        }));
        console.log("✅ Inventory report generated successfully!");
      } else {
        console.error(
          "❌",
          result.error || "Failed to generate inventory report"
        );
        alert(result.error || "Failed to generate inventory report");
      }
    } catch (error) {
      console.error("Error generating inventory report:", error);
      alert("An error occurred while generating the report");
    } finally {
      setLoading((prev) => ({ ...prev, inventory: false }));
    }
  };

  // Generate Sales Report
  const generateSalesReport = async () => {
    setLoading((prev) => ({ ...prev, sales: true }));
    try {
      console.log(
        "🔍 [AnalyticsReportsPage] Generating sales report for date range:",
        salesDateRange
      );
      const result = await ReportsService.generateSalesReport({
        startDate: new Date(salesDateRange.startDate).toISOString(),
        endDate: new Date(salesDateRange.endDate).toISOString(),
      });

      console.log("📊 [AnalyticsReportsPage] Sales report result:", result);
      if (result.success && result.data) {
        // Log the full report data for debugging
        console.log("📈 [AnalyticsReportsPage] Sales report data:", {
          totalTransactions: result.data.summary.totalTransactions,
          totalSales: result.data.summary.totalSales,
          totalCost: result.data.summary.totalCost,
          grossProfit: result.data.summary.grossProfit,
          profitMargin: result.data.summary.profitMargin,
        });

        // Check if there's actually any data
        if (result.data.summary.totalTransactions === 0) {
          console.warn(
            "⚠️ [AnalyticsReportsPage] No sales data found for selected date range"
          );
          alert(createNoDataMessage(salesDateRange, "sales"));
        }

        setReports((prev) => ({
          ...prev,
          sales: {
            totalRevenue: result.data.summary.totalSales,
            totalSales: result.data.summary.totalSales,
            totalCost: result.data.summary.totalCost,
            grossProfit: result.data.summary.grossProfit,
            profitMargin: result.data.summary.profitMargin,
            transactionCount: result.data.summary.totalTransactions,
            averageTransaction: result.data.summary.averageTransaction,
            averageCost: result.data.summary.averageCost,
            averageProfit: result.data.summary.averageProfit,
            topProducts: result.data.topProducts || [],
            categoryBreakdown: result.data.categoryBreakdown || [],
            dailyTrends: result.data.dailyTrends || [],
            fullData: result.data,
          },
        }));
        console.log("✅ Sales report generated successfully!");
      } else {
        console.error("❌", result.error || "Failed to generate sales report");
        alert(result.error || "Failed to generate sales report");
      }
    } catch (error) {
      console.error("Error generating sales report:", error);
      alert("An error occurred while generating the report");
    } finally {
      setLoading((prev) => ({ ...prev, sales: false }));
    }
  };

  // Generate Stock Alerts Report
  const generateStockAlertsReport = async () => {
    setLoading((prev) => ({ ...prev, stockAlerts: true }));
    try {
      const result = await ReportsService.generateInventoryReport();

      if (result.success && result.data) {
        const lowStockItems = result.data.lowStockAlerts || [];
        const outOfStockItems = result.data.stockLevels.outOfStock;
        const expiringItems = result.data.expiryAnalysis?.expiring30 || 0;

        setReports((prev) => ({
          ...prev,
          stockAlerts: {
            lowStockItems,
            outOfStockItems,
            expiringItems,
            fullData: result.data,
          },
        }));
        console.log("✅ Stock alerts report generated successfully!");
      } else {
        console.error(
          "❌",
          result.error || "Failed to generate stock alerts report"
        );
        alert(result.error || "Failed to generate stock alerts report");
      }
    } catch (error) {
      console.error("Error generating stock alerts report:", error);
      alert("An error occurred while generating the report");
    } finally {
      setLoading((prev) => ({ ...prev, stockAlerts: false }));
    }
  };

  // Generate Performance Report
  const generatePerformanceReport = async () => {
    setLoading((prev) => ({ ...prev, performance: true }));
    try {
      console.log(
        "🔍 [AnalyticsReportsPage] Generating performance report for date range:",
        salesDateRange
      );
      const result = await ReportsService.generateFinancialReport({
        startDate: new Date(salesDateRange.startDate).toISOString(),
        endDate: new Date(salesDateRange.endDate).toISOString(),
      });

      console.log(
        "📊 [AnalyticsReportsPage] Performance report result:",
        result
      );
      if (result.success && result.data) {
        // Log the full report data for debugging
        console.log("💰 [AnalyticsReportsPage] Performance report data:", {
          transactionCount: result.data.transactions.count,
          totalRevenue: result.data.revenue.total,
          totalCost: result.data.costs.total,
          grossProfit: result.data.profit.gross,
          profitMargin: result.data.profit.margin,
        });

        // Check if there's actually any data
        if (result.data.transactions.count === 0) {
          console.warn(
            "⚠️ [AnalyticsReportsPage] No financial data found for selected date range"
          );
          alert(createNoDataMessage(salesDateRange, "financial"));
        }

        setReports((prev) => ({
          ...prev,
          performance: {
            // Revenue metrics
            totalRevenue: result.data.revenue.total,
            dailyRevenue: result.data.revenue.daily,
            averageRevenue: result.data.revenue.average,

            // Cost metrics
            totalCost: result.data.costs.total,
            dailyCost: result.data.costs.daily,
            costPercentage: result.data.costs.percentage,

            // Profit metrics
            grossProfit: result.data.profit.gross,
            netProfit: result.data.profit.net,
            profitMargin: result.data.profit.margin,
            dailyProfit: result.data.profit.daily,
            roi: result.data.profit.roi,

            // Inventory metrics
            inventoryValue: result.data.inventory.currentValue,
            inventoryTurnover: result.data.inventory.turnover,
            daysInventory: result.data.inventory.daysInventory,

            // Transaction metrics
            transactionCount: result.data.transactions.count,
            averageTransaction: result.data.transactions.averageValue,
            dailyTransactions: result.data.transactions.dailyAverage,

            fullData: result.data,
          },
        }));
        console.log("✅ Performance report generated successfully!");
      } else {
        console.error(
          "❌",
          result.error || "Failed to generate performance report"
        );
        alert(result.error || "Failed to generate performance report");
      }
    } catch (error) {
      console.error("Error generating performance report:", error);
      alert("An error occurred while generating the report");
    } finally {
      setLoading((prev) => ({ ...prev, performance: false }));
    }
  };

  // Export to TXT
  const exportToTXT = (reportData, reportName) => {
    try {
      const txtContent = JSON.stringify(reportData, null, 2);
      const blob = new Blob([txtContent], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${reportName}_${format(new Date(), "yyyy-MM-dd")}.txt`;
      link.click();
      URL.revokeObjectURL(url);
      console.log(`✅ ${reportName} exported to TXT successfully!`);
    } catch (error) {
      console.error("Error exporting to TXT:", error);
      alert("Failed to export report to TXT");
    }
  };

  // Export to CSV
  const exportToCSV = async (reportData, reportName) => {
    try {
      let csvContent = "";

      // Determine report type and format CSV accordingly
      if (reportName.includes("inventory")) {
        csvContent = "Metric,Value\n";
        csvContent += `Total Products,${reportData.totalProducts || 0}\n`;
        csvContent += `Total Value,₱${(reportData.totalValue || 0).toFixed(
          2
        )}\n`;
        csvContent += `Low Stock Items,${reportData.lowStockCount || 0}\n`;
        csvContent += `Out of Stock,${reportData.outOfStock || 0}\n`;
      } else if (reportName.includes("sales")) {
        csvContent = "Metric,Value\n";
        csvContent += `Total Sales,₱${(reportData.totalSales || 0).toFixed(
          2
        )}\n`;
        csvContent += `Total Transactions,${
          reportData.transactionCount || 0
        }\n`;
        csvContent += `Average Transaction,₱${(
          reportData.averageTransaction || 0
        ).toFixed(2)}\n`;
      } else if (reportName.includes("stock_alerts")) {
        csvContent = "Alert Type,Count\n";
        const lowStockCount = Array.isArray(reportData.lowStockItems)
          ? reportData.lowStockItems.length
          : Number(reportData.lowStockItems) || 0;
        const outOfStockCount = Array.isArray(reportData.outOfStockItems)
          ? reportData.outOfStockItems.length
          : Number(reportData.outOfStockItems) || 0;
        const expiringCount = Array.isArray(reportData.expiringItems)
          ? reportData.expiringItems.length
          : Number(reportData.expiringItems) || 0;

        csvContent += `Low Stock Items,${lowStockCount}\n`;
        csvContent += `Out of Stock,${outOfStockCount}\n`;
        csvContent += `Expiring Soon,${expiringCount}\n`;
      } else if (reportName.includes("performance")) {
        csvContent = "Metric,Value\n";
        csvContent += `Profit Margin,${(reportData.profitMargin || 0).toFixed(
          2
        )}%\n`;
        csvContent += `Inventory Turnover,${(
          reportData.inventoryTurnover || 0
        ).toFixed(2)}\n`;
        csvContent += `ROI,${(reportData.roi || 0).toFixed(2)}%\n`;
      }

      // Add BOM for UTF-8 encoding to ensure proper display of special characters (₱)
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${reportName}_${format(new Date(), "yyyy-MM-dd")}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      console.log(`✅ ${reportName} exported to CSV successfully!`);
    } catch (error) {
      console.error("Error exporting to CSV:", error);
      alert("Failed to export report to CSV");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-2 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Analytics & Reports
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Generate comprehensive business insights and export data for
                  analysis.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-md">
              <Activity className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700 font-medium">
                Real-time data
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Report Configuration */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Report Configuration
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="config-start-date"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Start Date
            </label>
            <input
              id="config-start-date"
              type="date"
              value={salesDateRange.startDate}
              onChange={(e) =>
                setSalesDateRange((prev) => ({
                  ...prev,
                  startDate: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="config-end-date"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              End Date
            </label>
            <input
              id="config-end-date"
              type="date"
              value={salesDateRange.endDate}
              onChange={(e) =>
                setSalesDateRange((prev) => ({
                  ...prev,
                  endDate: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          {/* Low Stock Threshold input removed — thresholds are determined server-side */}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <span className="text-sm text-gray-600">Quick select:</span>
          <button
            onClick={() =>
              setSalesDateRange({
                startDate: format(
                  new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                  "yyyy-MM-dd"
                ),
                endDate: format(new Date(), "yyyy-MM-dd"),
              })
            }
            className="px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
          >
            Last 7 days
          </button>
          <button
            onClick={() =>
              setSalesDateRange({
                startDate: format(
                  new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                  "yyyy-MM-dd"
                ),
                endDate: format(new Date(), "yyyy-MM-dd"),
              })
            }
            className="px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
          >
            Last 30 days
          </button>
          <button
            onClick={() =>
              setSalesDateRange({
                startDate: format(
                  new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                  "yyyy-MM-dd"
                ),
                endDate: format(new Date(), "yyyy-MM-dd"),
              })
            }
            className="px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Inventory Analysis Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-2 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  Inventory Analysis
                </h3>
                <p className="text-xs text-gray-500">
                  Stock levels, valuations & alerts
                </p>
              </div>
            </div>
          </div>
          <div className="p-4">
            <button
              onClick={generateInventoryReport}
              disabled={loading.inventory}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-md transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <BarChart3 className="h-4 w-4" />
              {loading.inventory ? "Generating..." : "Generate Report"}
            </button>

            {reports.inventory && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Total Products:</span>
                    <span className="font-semibold text-gray-900">
                      {reports.inventory.totalProducts || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Total Stock Value:</span>
                    <span className="font-semibold text-green-600">
                      ₱
                      {(reports.inventory.totalValue || 0).toLocaleString(
                        "en-PH",
                        { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                      )}
                    </span>
                  </div>
                  {reports.inventory.totalCostValue !== undefined && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Total Cost Value:</span>
                      <span className="font-semibold text-orange-600">
                        ₱
                        {(reports.inventory.totalCostValue || 0).toLocaleString(
                          "en-PH",
                          { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                        )}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Low Stock Items:</span>
                    <span className="font-semibold text-orange-600">
                      {reports.inventory.lowStockCount || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Out of Stock:</span>
                    <span className="font-semibold text-red-600">
                      {reports.inventory.outOfStock || 0}
                    </span>
                  </div>
                  {reports.inventory.normalStock !== undefined && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Normal Stock:</span>
                      <span className="font-semibold text-emerald-600">
                        {reports.inventory.normalStock || 0}
                      </span>
                    </div>
                  )}
                  {reports.inventory.expiringItems !== undefined && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">
                        Expiring Soon (30d):
                      </span>
                      <span className="font-semibold text-amber-600">
                        {reports.inventory.expiringItems || 0}
                      </span>
                    </div>
                  )}
                  {reports.inventory.expiredItems !== undefined && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Expired Items:</span>
                      <span className="font-semibold text-red-700">
                        {reports.inventory.expiredItems || 0}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      exportToTXT(reports.inventory, "inventory_report")
                    }
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-3 rounded-md transition-colors flex items-center justify-center gap-1.5 text-xs"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    TXT
                  </button>
                  <button
                    onClick={() =>
                      exportToCSV(reports.inventory, "inventory_report")
                    }
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-3 rounded-md transition-colors flex items-center justify-center gap-1.5 text-xs"
                  >
                    <Download className="h-3.5 w-3.5" />
                    CSV
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sales Analytics Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="bg-green-50 p-2 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  Sales Analytics
                </h3>
                <p className="text-xs text-gray-500">
                  Revenue trends & performance
                </p>
              </div>
            </div>
          </div>
          <div className="p-4">
            <button
              onClick={generateSalesReport}
              disabled={loading.sales}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-4 rounded-md transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <TrendingUp className="h-4 w-4" />
              {loading.sales ? "Generating..." : "Generate Report"}
            </button>

            {reports.sales && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
                {reports.sales.transactionCount === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-gray-600 mb-2">
                      📊 No sales data found for selected date range
                    </p>
                    <p className="text-xs text-gray-500">
                      Try selecting a different date range or make some sales
                      first.
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Current range: {salesDateRange.startDate} to{" "}
                      {salesDateRange.endDate}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Total Revenue:</span>
                        <span className="font-semibold text-green-600">
                          ₱
                          {(reports.sales.totalRevenue || 0).toLocaleString(
                            "en-PH",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">
                          Total Cost (COGS):
                        </span>
                        <span className="font-semibold text-orange-600">
                          ₱
                          {(reports.sales.totalCost || 0).toLocaleString(
                            "en-PH",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Gross Profit:</span>
                        <span className="font-semibold text-emerald-600">
                          ₱
                          {(reports.sales.grossProfit || 0).toLocaleString(
                            "en-PH",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Profit Margin:</span>
                        <span className="font-semibold text-purple-600">
                          {(reports.sales.profitMargin || 0).toFixed(2)}%
                        </span>
                      </div>
                      <div className="border-t border-gray-300 my-2"></div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">
                          Total Transactions:
                        </span>
                        <span className="font-semibold text-gray-900">
                          {reports.sales.transactionCount || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Avg Transaction:</span>
                        <span className="font-semibold text-blue-600">
                          ₱
                          {(
                            reports.sales.averageTransaction || 0
                          ).toLocaleString("en-PH", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">
                          Avg Cost/Transaction:
                        </span>
                        <span className="font-semibold text-amber-600">
                          ₱
                          {(reports.sales.averageCost || 0).toLocaleString(
                            "en-PH",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">
                          Avg Profit/Transaction:
                        </span>
                        <span className="font-semibold text-teal-600">
                          ₱
                          {(reports.sales.averageProfit || 0).toLocaleString(
                            "en-PH",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          exportToTXT(reports.sales, "sales_report")
                        }
                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-3 rounded-md transition-colors flex items-center justify-center gap-1.5 text-xs"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        TXT
                      </button>
                      <button
                        onClick={() =>
                          exportToCSV(reports.sales, "sales_report")
                        }
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-3 rounded-md transition-colors flex items-center justify-center gap-1.5 text-xs"
                      >
                        <Download className="h-3.5 w-3.5" />
                        CSV
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stock Alerts Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="bg-orange-50 p-2 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  Stock Alerts
                </h3>
                <p className="text-xs text-gray-500">
                  Low inventory & reorder alerts
                </p>
              </div>
            </div>
          </div>
          <div className="p-4">
            <button
              onClick={generateStockAlertsReport}
              disabled={loading.stockAlerts}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2.5 px-4 rounded-md transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <AlertTriangle className="h-4 w-4" />
              {loading.stockAlerts ? "Generating..." : "Check Stock"}
            </button>

            {reports.stockAlerts && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Low Stock Items:</span>
                    <span className="font-semibold text-orange-600">
                      {Array.isArray(reports.stockAlerts.lowStockItems)
                        ? reports.stockAlerts.lowStockItems.length
                        : Number(reports.stockAlerts.lowStockItems) || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Out of Stock:</span>
                    <span className="font-semibold text-red-600">
                      {Array.isArray(reports.stockAlerts.outOfStockItems)
                        ? reports.stockAlerts.outOfStockItems.length
                        : Number(reports.stockAlerts.outOfStockItems) || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Expiring Soon:</span>
                    <span className="font-semibold text-yellow-600">
                      {Array.isArray(reports.stockAlerts.expiringItems)
                        ? reports.stockAlerts.expiringItems.length
                        : Number(reports.stockAlerts.expiringItems) || 0}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      exportToTXT(reports.stockAlerts, "stock_alerts_report")
                    }
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-3 rounded-md transition-colors flex items-center justify-center gap-1.5 text-xs"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    TXT
                  </button>
                  <button
                    onClick={() =>
                      exportToCSV(reports.stockAlerts, "stock_alerts_report")
                    }
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-3 rounded-md transition-colors flex items-center justify-center gap-1.5 text-xs"
                  >
                    <Download className="h-3.5 w-3.5" />
                    CSV
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Performance Insights Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="bg-purple-50 p-2 rounded-lg">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  Performance Insights
                </h3>
                <p className="text-xs text-gray-500">
                  Profitability & turnover analysis
                </p>
              </div>
            </div>
          </div>
          <div className="p-4">
            <button
              onClick={generatePerformanceReport}
              disabled={loading.performance}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 px-4 rounded-md transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <BarChart3 className="h-4 w-4" />
              {loading.performance ? "Generating..." : "Analyze Performance"}
            </button>

            {reports.performance && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
                {reports.performance.transactionCount === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-gray-600 mb-2">
                      📊 No financial data found for selected date range
                    </p>
                    <p className="text-xs text-gray-500">
                      Try selecting a different date range or make some sales
                      first.
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Current range: {salesDateRange.startDate} to{" "}
                      {salesDateRange.endDate}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 mb-4">
                      {/* Revenue Section */}
                      <div className="font-semibold text-xs text-gray-700 uppercase mb-1">
                        Revenue Metrics
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Total Revenue:</span>
                        <span className="font-semibold text-green-600">
                          ₱
                          {(
                            reports.performance.totalRevenue || 0
                          ).toLocaleString("en-PH", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Daily Revenue:</span>
                        <span className="font-semibold text-green-500">
                          ₱
                          {(
                            reports.performance.dailyRevenue || 0
                          ).toLocaleString("en-PH", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>

                      {/* Profit Section */}
                      <div className="border-t border-gray-300 my-2"></div>
                      <div className="font-semibold text-xs text-gray-700 uppercase mb-1">
                        Profitability
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Gross Profit:</span>
                        <span className="font-semibold text-emerald-600">
                          ₱
                          {(
                            reports.performance.grossProfit || 0
                          ).toLocaleString("en-PH", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Profit Margin:</span>
                        <span className="font-semibold text-emerald-500">
                          {(reports.performance.profitMargin || 0).toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">ROI:</span>
                        <span className="font-semibold text-purple-600">
                          {(reports.performance.roi || 0).toFixed(2)}%
                        </span>
                      </div>

                      {/* Inventory Section */}
                      <div className="border-t border-gray-300 my-2"></div>
                      <div className="font-semibold text-xs text-gray-700 uppercase mb-1">
                        Inventory Efficiency
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Inventory Value:</span>
                        <span className="font-semibold text-blue-600">
                          ₱
                          {(
                            reports.performance.inventoryValue || 0
                          ).toLocaleString("en-PH", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Turnover Ratio:</span>
                        <span className="font-semibold text-blue-500">
                          {(reports.performance.inventoryTurnover || 0).toFixed(
                            2
                          )}
                          x
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Days Inventory:</span>
                        <span className="font-semibold text-indigo-600">
                          {(reports.performance.daysInventory || 0).toFixed(0)}{" "}
                          days
                        </span>
                      </div>

                      {/* Cost Section */}
                      <div className="border-t border-gray-300 my-2"></div>
                      <div className="font-semibold text-xs text-gray-700 uppercase mb-1">
                        Cost Analysis
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Total COGS:</span>
                        <span className="font-semibold text-orange-600">
                          ₱
                          {(reports.performance.totalCost || 0).toLocaleString(
                            "en-PH",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Cost Percentage:</span>
                        <span className="font-semibold text-orange-500">
                          {(reports.performance.costPercentage || 0).toFixed(2)}
                          %
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          exportToTXT(reports.performance, "performance_report")
                        }
                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-3 rounded-md transition-colors flex items-center justify-center gap-1.5 text-xs"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        TXT
                      </button>
                      <button
                        onClick={() =>
                          exportToCSV(reports.performance, "performance_report")
                        }
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-3 rounded-md transition-colors flex items-center justify-center gap-1.5 text-xs"
                      >
                        <Download className="h-3.5 w-3.5" />
                        CSV
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Report Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Report Overview
          </h2>
        </div>
        <div className="space-y-3 mb-4">
          <div className="flex items-start gap-2 text-sm">
            <span className="text-blue-600 font-medium">•</span>
            <div>
              <span className="font-medium text-gray-900">
                Inventory Analysis:
              </span>
              <span className="text-gray-600 ml-1">
                Current stock levels, valuations & category insights
              </span>
            </div>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <span className="text-blue-600 font-medium">•</span>
            <div>
              <span className="font-medium text-gray-900">
                Sales Analytics:
              </span>
              <span className="text-gray-600 ml-1">
                Revenue trends, transaction patterns & top performers
              </span>
            </div>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <span className="text-blue-600 font-medium">•</span>
            <div>
              <span className="font-medium text-gray-900">Stock Alerts:</span>
              <span className="text-gray-600 ml-1">
                Low inventory warnings with reorder recommendations
              </span>
            </div>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <span className="text-blue-600 font-medium">•</span>
            <div>
              <span className="font-medium text-gray-900">
                Performance Insights:
              </span>
              <span className="text-gray-600 ml-1">
                Product profitability & turnover analysis
              </span>
            </div>
          </div>
        </div>
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Sparkles className="h-4 w-4 text-blue-500" />
            <span className="font-medium">Export formats:</span>
            <span>CSV for analysis • TXT for detailed reports</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
            <Activity className="h-4 w-4 text-green-500" />
            <span>Live data</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsReportsPage;
