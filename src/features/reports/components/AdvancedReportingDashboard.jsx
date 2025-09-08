import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Package,
  DollarSign,
  BarChart3,
  RefreshCw,
  Clock,
  Target,
  AlertTriangle,
} from "lucide-react";
import { ReportingService } from "../../../services/reportingService";
import { formatCurrency } from "../../../utils/formatting";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

const AdvancedReportingDashboard = () => {
  const [activeReport, setActiveReport] = useState("financial");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 30), "yyyy-MM-dd"),
    end: format(new Date(), "yyyy-MM-dd"),
  });

  const reportTypes = [
    {
      id: "financial",
      name: "Financial Report",
      icon: DollarSign,
      description: "Revenue, profit, and financial performance analysis",
      color: "blue",
    },
    {
      id: "inventory",
      name: "Inventory Report",
      icon: Package,
      description: "Stock levels, valuation, and inventory analysis",
      color: "green",
    },
    {
      id: "sales",
      name: "Sales Performance",
      icon: TrendingUp,
      description: "Sales trends, top products, and performance metrics",
      color: "purple",
    },
  ];

  const generateReport = useCallback(async () => {
    try {
      setLoading(true);
      let data;

      const startDate = startOfDay(new Date(dateRange.start)).toISOString();
      const endDate = endOfDay(new Date(dateRange.end)).toISOString();

      const reportOptions = {
        groupBy: "daily",
        includeCharts: true,
        detailedBreakdown: true,
      };

      switch (activeReport) {
        case "financial":
          data = await ReportingService.generateFinancialReport(
            startDate,
            endDate,
            reportOptions
          );
          break;
        case "inventory":
          data = await ReportingService.generateInventoryReport(reportOptions);
          break;
        case "sales":
          data = await ReportingService.generateSalesPerformanceReport(
            startDate,
            endDate,
            reportOptions
          );
          break;
        default:
          throw new Error("Invalid report type");
      }

      setReportData(data);
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setLoading(false);
    }
  }, [activeReport, dateRange]);

  const exportToPDF = async () => {
    if (!reportData) return;

    try {
      let pdf;

      switch (activeReport) {
        case "financial":
          pdf = await ReportingService.exportFinancialReportToPDF(reportData);
          break;
        case "inventory":
          pdf = await ReportingService.exportInventoryReportToPDF(reportData);
          break;
        case "sales":
          // For sales report, we'll export the component as PDF
          pdf = await ReportingService.exportComponentToPDF(
            "sales-report-content"
          );
          break;
        default:
          return;
      }

      const filename = `${activeReport}-report-${format(
        new Date(),
        "yyyy-MM-dd"
      )}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error("Error exporting to PDF:", error);
    }
  };

  const setQuickDateRange = (days) => {
    const end = format(new Date(), "yyyy-MM-dd");
    const start = format(subDays(new Date(), days), "yyyy-MM-dd");
    setDateRange({ start, end });
  };

  useEffect(() => {
    generateReport();
  }, [generateReport]);

  const renderFinancialReport = () => {
    if (!reportData) return null;

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Revenue
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {formatCurrency(reportData.summary.totalRevenue)}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Gross Profit
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {formatCurrency(reportData.summary.grossProfit)}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Profit Margin
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {reportData.summary.profitMargin.toFixed(2)}%
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Avg Order Value
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {formatCurrency(reportData.summary.averageOrderValue)}
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Category Performance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Revenue by Category
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Profit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Margin
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.categoryBreakdown
                  .slice(0, 10)
                  .map((category, index) => {
                    const margin =
                      category.revenue > 0
                        ? (category.profit / category.revenue) * 100
                        : 0;

                    const getMarginColorClass = (margin) => {
                      if (margin >= 20) return "bg-green-100 text-green-800";
                      if (margin >= 10) return "bg-yellow-100 text-yellow-800";
                      return "bg-red-100 text-red-800";
                    };

                    return (
                      <tr
                        key={`category-${
                          category.name || category.id || index
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {category.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(category.revenue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(category.cost)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(category.profit)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getMarginColorClass(
                              margin
                            )}`}
                          >
                            {margin.toFixed(2)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Top Performing Products
          </h3>
          <div className="space-y-4">
            {reportData.topProducts.slice(0, 8).map((product, index) => (
              <div
                key={`product-${product.name || product.id || index}`}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
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
  };

  const renderInventoryReport = () => {
    if (!reportData) return null;

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Products
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {reportData.summary.totalProducts}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {formatCurrency(reportData.summary.totalValue)}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Low Stock Items
                </p>
                <p className="text-2xl font-bold text-orange-600 mt-2">
                  {reportData.summary.lowStockItems}
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Expiring Soon
                </p>
                <p className="text-2xl font-bold text-red-600 mt-2">
                  {reportData.summary.expiringItems}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Low Stock Alert */}
        {reportData.lowStockProducts.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
              Low Stock Alert
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reorder Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock Value
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.lowStockProducts
                    .slice(0, 10)
                    .map((product, index) => (
                      <tr
                        key={`low-stock-${product.name || product.id || index}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {product.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                            {product.currentStock}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.reorderLevel}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(product.stockValue)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Category Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Inventory by Category
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportData.categories.slice(0, 9).map((category, index) => (
              <div
                key={`inventory-category-${
                  category.name || category.id || index
                }`}
                className="bg-gray-50 rounded-lg p-4"
              >
                <h4 className="font-medium text-gray-900 mb-2">
                  {category.name}
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Products:</span>
                    <span className="font-medium">{category.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Value:</span>
                    <span className="font-medium">
                      {formatCurrency(category.totalValue)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Low Stock:</span>
                    <span
                      className={`font-medium ${
                        category.lowStock > 0
                          ? "text-orange-600"
                          : "text-green-600"
                      }`}
                    >
                      {category.lowStock}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Expiring:</span>
                    <span
                      className={`font-medium ${
                        category.expiring > 0
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {category.expiring}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderSalesReport = () => {
    if (!reportData) return null;

    return (
      <div id="sales-report-content" className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {reportData.summary.totalSales}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Revenue
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {formatCurrency(reportData.summary.totalRevenue)}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Avg Order Value
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {formatCurrency(reportData.summary.averageOrderValue)}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {reportData.summary.totalItems}
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Package className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Top Selling Products
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity Sold
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sales Count
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.topSellingProducts
                  .slice(0, 10)
                  .map((product, index) => (
                    <tr
                      key={`top-product-${product.name || product.id || index}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-blue-600">
                            {index + 1}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {product.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(product.revenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.sales}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category Performance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Sales by Category
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportData.categoryPerformance
              .slice(0, 9)
              .map((category, index) => (
                <div
                  key={`sales-category-${
                    category.name || category.id || index
                  }`}
                  className="bg-gray-50 rounded-lg p-4"
                >
                  <h4 className="font-medium text-gray-900 mb-2">
                    {category.name}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sales:</span>
                      <span className="font-medium">{category.sales}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Revenue:</span>
                      <span className="font-medium">
                        {formatCurrency(category.revenue)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Items:</span>
                      <span className="font-medium">{category.items}</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  };

  const renderReportContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Generating report...</p>
          </div>
        </div>
      );
    }

    if (!reportData) {
      return (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            Click "Generate Report" to create a new report
          </p>
        </div>
      );
    }

    switch (activeReport) {
      case "financial":
        return renderFinancialReport();
      case "inventory":
        return renderInventoryReport();
      case "sales":
        return renderSalesReport();
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center space-x-4 mb-6 lg:mb-0">
            <div className="bg-blue-100 p-3 rounded-xl">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                <span>Advanced Reporting</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Professional
                </span>
              </h1>
              <p className="text-gray-600 mt-1">
                Generate comprehensive reports with PDF export capabilities
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={generateReport}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              <span>{loading ? "Generating..." : "Generate Report"}</span>
            </button>

            {reportData && (
              <button
                onClick={exportToPDF}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Export PDF</span>
              </button>
            )}
          </div>
        </div>

        {/* Report Type Selection */}
        <div className="border-t border-gray-200 mt-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {reportTypes.map((report) => {
              const Icon = report.icon;
              return (
                <button
                  key={report.id}
                  onClick={() => setActiveReport(report.id)}
                  className={`text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                    activeReport === report.id
                      ? `border-${report.color}-500 bg-${report.color}-50`
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <Icon className={`h-6 w-6 text-${report.color}-600`} />
                    <h3 className="font-semibold text-gray-900">
                      {report.name}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600">{report.description}</p>
                </button>
              );
            })}
          </div>

          {/* Date Range Selection */}
          {(activeReport === "financial" || activeReport === "sales") && (
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  Date Range:
                </span>
              </div>

              <input
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, start: e.target.value }))
                }
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />

              <span className="text-gray-500">to</span>

              <input
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, end: e.target.value }))
                }
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setQuickDateRange(7)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Last 7 days
                </button>
                <button
                  onClick={() => setQuickDateRange(30)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Last 30 days
                </button>
                <button
                  onClick={() => setQuickDateRange(90)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Last 90 days
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Report Content */}
      {renderReportContent()}
    </div>
  );
};

export default AdvancedReportingDashboard;
