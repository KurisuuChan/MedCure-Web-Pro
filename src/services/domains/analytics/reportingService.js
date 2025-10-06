import jsPDF from "jspdf";
import "jspdf-autotable";
import html2canvas from "html2canvas";
import { format } from "date-fns";
import { supabase } from "../../../config/supabase";
import { formatCurrency } from "../../../utils/formatting";

export class ReportingService {
  // Generate Financial Report
  static async generateFinancialReport(startDate, endDate, options = {}) {
    try {
      const { data: sales, error } = await supabase
        .from("sales")
        .select(
          `
          *,
          sale_items (
            quantity,
            unit_price,
            total_amount,
            products (
              generic_name,
              brand_name,
              category,
              cost_price,
              price_per_piece
            )
          )
        `
        )
        .eq("status", "completed") // ✅ CRITICAL: Only completed transactions
        .gte("created_at", startDate)
        .lte("created_at", endDate)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const report = {
        period: `${format(new Date(startDate), "MMM dd, yyyy")} - ${format(
          new Date(endDate),
          "MMM dd, yyyy"
        )}`,
        summary: {
          totalSales: 0,
          totalRevenue: 0,
          totalCost: 0,
          grossProfit: 0,
          profitMargin: 0,
          averageOrderValue: 0,
          transactionCount: sales?.length || 0,
        },
        dailyBreakdown: {},
        categoryBreakdown: {},
        topProducts: {},
        paymentMethods: {},
        trends: {},
      };

      if (sales && sales.length > 0) {
        sales.forEach((sale) => {
          const saleDate = format(new Date(sale.created_at), "yyyy-MM-dd");
          const revenue = sale.total_amount || 0;

          // Initialize daily breakdown
          if (!report.dailyBreakdown[saleDate]) {
            report.dailyBreakdown[saleDate] = {
              sales: 0,
              revenue: 0,
              cost: 0,
              profit: 0,
              transactions: 0,
            };
          }

          report.summary.totalRevenue += revenue;
          report.dailyBreakdown[saleDate].revenue += revenue;
          report.dailyBreakdown[saleDate].transactions += 1;

          // Process sale items
          if (sale.sale_items) {
            sale.sale_items.forEach((item) => {
              const cost = (item.products?.cost_price || 0) * item.quantity;
              const profit = item.total_amount - cost;

              report.summary.totalCost += cost;
              report.summary.grossProfit += profit;
              report.dailyBreakdown[saleDate].cost += cost;
              report.dailyBreakdown[saleDate].profit += profit;

              // Category breakdown
              const category = item.products?.category || "Other";
              if (!report.categoryBreakdown[category]) {
                report.categoryBreakdown[category] = {
                  revenue: 0,
                  cost: 0,
                  profit: 0,
                  quantity: 0,
                };
              }
              report.categoryBreakdown[category].revenue += item.total_amount;
              report.categoryBreakdown[category].cost += cost;
              report.categoryBreakdown[category].profit += profit;
              report.categoryBreakdown[category].quantity += item.quantity;

              // Top products
              const productName = item.products?.generic_name || "Unknown";
              if (!report.topProducts[productName]) {
                report.topProducts[productName] = {
                  revenue: 0,
                  quantity: 0,
                  profit: 0,
                };
              }
              report.topProducts[productName].revenue += item.total_amount;
              report.topProducts[productName].quantity += item.quantity;
              report.topProducts[productName].profit += profit;
            });
          }

          // Payment methods
          const paymentMethod = sale.payment_method || "Cash";
          if (!report.paymentMethods[paymentMethod]) {
            report.paymentMethods[paymentMethod] = {
              count: 0,
              amount: 0,
            };
          }
          report.paymentMethods[paymentMethod].count += 1;
          report.paymentMethods[paymentMethod].amount += revenue;
        });

        // Calculate derived metrics
        report.summary.profitMargin =
          report.summary.totalRevenue > 0
            ? (report.summary.grossProfit / report.summary.totalRevenue) * 100
            : 0;
        report.summary.averageOrderValue =
          report.summary.totalRevenue / report.summary.transactionCount;

        // Convert objects to sorted arrays
        report.categoryBreakdown = Object.entries(report.categoryBreakdown)
          .map(([name, data]) => ({ name, ...data }))
          .sort((a, b) => b.revenue - a.revenue);

        report.topProducts = Object.entries(report.topProducts)
          .map(([name, data]) => ({ name, ...data }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 10);
      }

      return report;
    } catch (error) {
      console.error("Error generating financial report:", error);
      throw error;
    }
  }

  // Generate Inventory Report
  static async generateInventoryReport(options = {}) {
    try {
      const { data: products, error } = await supabase
        .from("products")
        .select(
          `
          *,
          sale_items (
            quantity,
            created_at
          )
        `
        )
        .eq("is_archived", false);

      if (error) throw error;

      const report = {
        generatedAt: new Date().toISOString(),
        summary: {
          totalProducts: products?.length || 0,
          totalValue: 0,
          lowStockItems: 0,
          expiredItems: 0,
          expiringItems: 0,
          outOfStockItems: 0,
        },
        categories: {},
        lowStockProducts: [],
        expiringProducts: [],
        fastMovingProducts: [],
        slowMovingProducts: [],
        stockValuation: [],
      };

      if (products && products.length > 0) {
        const today = new Date();
        const thirtyDaysFromNow = new Date(
          today.getTime() + 30 * 24 * 60 * 60 * 1000
        );

        products.forEach((product) => {
          const stockValue =
            (product.stock_in_pieces || 0) * (product.price_per_piece || 0);
          const expiryDate = product.expiry_date
            ? new Date(product.expiry_date)
            : null;

          report.summary.totalValue += stockValue;

          // Stock status checks
          if ((product.stock_in_pieces || 0) === 0) {
            report.summary.outOfStockItems += 1;
          } else if (
            (product.stock_in_pieces || 0) <= (product.reorder_level || 10)
          ) {
            report.summary.lowStockItems += 1;
            report.lowStockProducts.push({
              name: product.generic_name,
              category: product.category,
              currentStock: product.stock_in_pieces,
              reorderLevel: product.reorder_level,
              stockValue: stockValue,
            });
          }

          // Expiry checks
          if (expiryDate) {
            if (expiryDate < today) {
              report.summary.expiredItems += 1;
            } else if (expiryDate <= thirtyDaysFromNow) {
              report.summary.expiringItems += 1;
              report.expiringProducts.push({
                name: product.generic_name,
                category: product.category,
                expiryDate: product.expiry_date,
                stock: product.stock_in_pieces,
                value: stockValue,
              });
            }
          }

          // Category breakdown
          const category = product.category || "Other";
          if (!report.categories[category]) {
            report.categories[category] = {
              count: 0,
              totalValue: 0,
              lowStock: 0,
              expiring: 0,
            };
          }
          report.categories[category].count += 1;
          report.categories[category].totalValue += stockValue;
          if ((product.stock_in_pieces || 0) <= (product.reorder_level || 10)) {
            report.categories[category].lowStock += 1;
          }
          if (expiryDate && expiryDate <= thirtyDaysFromNow) {
            report.categories[category].expiring += 1;
          }

          // Sales velocity calculation
          const salesData = product.sale_items || [];
          const recentSales = salesData.filter((item) => {
            const itemDate = new Date(item.created_at);
            const thirtyDaysAgo = new Date(
              today.getTime() - 30 * 24 * 60 * 60 * 1000
            );
            return itemDate >= thirtyDaysAgo;
          });

          const totalSold = recentSales.reduce(
            (sum, item) => sum + item.quantity,
            0
          );
          const velocity = totalSold / 30; // items per day

          const productPerformance = {
            name: product.generic_name,
            category: product.category,
            stock: product.stock_in_pieces,
            velocity,
            totalSold,
            value: stockValue,
          };

          if (velocity > 1) {
            report.fastMovingProducts.push(productPerformance);
          } else if (velocity < 0.1) {
            report.slowMovingProducts.push(productPerformance);
          }

          // Stock valuation
          report.stockValuation.push({
            name: product.generic_name,
            category: product.category,
            stock: product.stock_in_pieces,
            unitPrice: product.price_per_piece,
            totalValue: stockValue,
            costPrice: product.cost_price,
            margin:
              product.price_per_piece > 0
                ? ((product.price_per_piece - product.cost_price) /
                    product.price_per_piece) *
                  100
                : 0,
          });
        });

        // Sort arrays
        report.lowStockProducts.sort((a, b) => a.currentStock - b.currentStock);
        report.expiringProducts.sort(
          (a, b) => new Date(a.expiryDate) - new Date(b.expiryDate)
        );
        report.fastMovingProducts
          .sort((a, b) => b.velocity - a.velocity)
          .slice(0, 20);
        report.slowMovingProducts
          .sort((a, b) => a.velocity - b.velocity)
          .slice(0, 20);
        report.stockValuation.sort((a, b) => b.totalValue - a.totalValue);

        // Convert categories to array
        report.categories = Object.entries(report.categories)
          .map(([name, data]) => ({ name, ...data }))
          .sort((a, b) => b.totalValue - a.totalValue);
      }

      return report;
    } catch (error) {
      console.error("Error generating inventory report:", error);
      throw error;
    }
  }

  // Generate Sales Performance Report
  static async generateSalesPerformanceReport(
    startDate,
    endDate,
    options = {}
  ) {
    try {
      const { data: sales, error } = await supabase
        .from("sales")
        .select(
          `
          *,
          sale_items (
            quantity,
            unit_price,
            total_amount,
            products (
              name,
              category,
              brand
            )
          )
        `
        )
        .eq("status", "completed") // ✅ CRITICAL: Only completed transactions
        .gte("created_at", startDate)
        .lte("created_at", endDate)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const report = {
        period: `${format(new Date(startDate), "MMM dd, yyyy")} - ${format(
          new Date(endDate),
          "MMM dd, yyyy"
        )}`,
        summary: {
          totalSales: sales?.length || 0,
          totalRevenue: 0,
          totalItems: 0,
          averageOrderValue: 0,
          peakSalesDay: null,
          peakSalesHour: null,
        },
        dailyPerformance: {},
        hourlyPerformance: Array(24)
          .fill(0)
          .map((_, hour) => ({ hour, sales: 0, revenue: 0 })),
        categoryPerformance: {},
        brandPerformance: {},
        topSellingProducts: {},
        trends: {
          dailyGrowth: [],
          weeklyPattern: Array(7)
            .fill(0)
            .map((_, day) => ({ day, sales: 0, revenue: 0 })),
        },
      };

      if (sales && sales.length > 0) {
        sales.forEach((sale) => {
          const saleDate = format(new Date(sale.created_at), "yyyy-MM-dd");
          const saleHour = new Date(sale.created_at).getHours();
          const dayOfWeek = new Date(sale.created_at).getDay();
          const revenue = sale.total_amount || 0;

          report.summary.totalRevenue += revenue;

          // Daily performance
          if (!report.dailyPerformance[saleDate]) {
            report.dailyPerformance[saleDate] = {
              sales: 0,
              revenue: 0,
              items: 0,
            };
          }
          report.dailyPerformance[saleDate].sales += 1;
          report.dailyPerformance[saleDate].revenue += revenue;

          // Hourly performance
          report.hourlyPerformance[saleHour].sales += 1;
          report.hourlyPerformance[saleHour].revenue += revenue;

          // Weekly pattern
          report.trends.weeklyPattern[dayOfWeek].sales += 1;
          report.trends.weeklyPattern[dayOfWeek].revenue += revenue;

          // Process sale items
          if (sale.sale_items) {
            sale.sale_items.forEach((item) => {
              report.summary.totalItems += item.quantity;
              report.dailyPerformance[saleDate].items += item.quantity;

              // Category performance
              const category = item.products?.category || "Other";
              if (!report.categoryPerformance[category]) {
                report.categoryPerformance[category] = {
                  sales: 0,
                  revenue: 0,
                  items: 0,
                };
              }
              report.categoryPerformance[category].sales += 1;
              report.categoryPerformance[category].revenue += item.total_amount;
              report.categoryPerformance[category].items += item.quantity;

              // Brand performance
              const brand = item.products?.brand_name || "Generic";
              if (!report.brandPerformance[brand]) {
                report.brandPerformance[brand] = {
                  sales: 0,
                  revenue: 0,
                  items: 0,
                };
              }
              report.brandPerformance[brand].sales += 1;
              report.brandPerformance[brand].revenue += item.total_amount;
              report.brandPerformance[brand].items += item.quantity;

              // Top selling products
              const productName = item.products?.generic_name || "Unknown";
              if (!report.topSellingProducts[productName]) {
                report.topSellingProducts[productName] = {
                  quantity: 0,
                  revenue: 0,
                  sales: 0,
                };
              }
              report.topSellingProducts[productName].quantity += item.quantity;
              report.topSellingProducts[productName].revenue +=
                item.total_amount;
              report.topSellingProducts[productName].sales += 1;
            });
          }
        });

        // Calculate derived metrics
        report.summary.averageOrderValue =
          report.summary.totalRevenue / report.summary.totalSales;

        // Find peak performance
        const dailyEntries = Object.entries(report.dailyPerformance);
        const peakDay = dailyEntries.reduce(
          (max, [date, data]) =>
            data.revenue > max.revenue ? { date, ...data } : max,
          { date: null, revenue: 0 }
        );
        report.summary.peakSalesDay = peakDay.date;

        const peakHour = report.hourlyPerformance.reduce(
          (max, data, hour) =>
            data.revenue > max.revenue ? { hour, ...data } : max,
          { hour: null, revenue: 0 }
        );
        report.summary.peakSalesHour = peakHour.hour;

        // Convert objects to sorted arrays
        report.categoryPerformance = Object.entries(report.categoryPerformance)
          .map(([name, data]) => ({ name, ...data }))
          .sort((a, b) => b.revenue - a.revenue);

        report.brandPerformance = Object.entries(report.brandPerformance)
          .map(([name, data]) => ({ name, ...data }))
          .sort((a, b) => b.revenue - a.revenue);

        report.topSellingProducts = Object.entries(report.topSellingProducts)
          .map(([name, data]) => ({ name, ...data }))
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 20);

        // Calculate daily growth
        const sortedDays = dailyEntries.sort(
          (a, b) => new Date(a[0]) - new Date(b[0])
        );
        report.trends.dailyGrowth = sortedDays.map(([date, data], index) => {
          const growth =
            index > 0
              ? ((data.revenue - sortedDays[index - 1][1].revenue) /
                  sortedDays[index - 1][1].revenue) *
                100
              : 0;
          return { date, revenue: data.revenue, growth };
        });
      }

      return report;
    } catch (error) {
      console.error("Error generating sales performance report:", error);
      throw error;
    }
  }

  // Export Financial Report to PDF
  static async exportFinancialReportToPDF(reportData, options = {}) {
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.width;
      const pageHeight = pdf.internal.pageSize.height;
      const margins = { left: 20, right: 20, top: 25, bottom: 25 };

      // Modern Color Palette
      const colors = {
        primary: [34, 139, 230], // Professional blue
        secondary: [71, 85, 105], // Slate gray
        accent: [16, 185, 129], // Success green
        danger: [239, 68, 68], // Error red
        lightGray: [241, 245, 249],
        darkGray: [51, 65, 85],
        headerBg: [248, 250, 252],
      };

      // Helper function to add modern header with branding
      const addModernHeader = (pageNum = 1) => {
        // Header background
        pdf.setFillColor(...colors.primary);
        pdf.rect(0, 0, pageWidth, 45, "F");

        // Company name/logo area
        pdf.setFontSize(24);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(255, 255, 255);
        pdf.text("MedCure Pharmacy", margins.left, 20);

        // Report title
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "normal");
        pdf.text("Financial Performance Report", margins.left, 30);

        // Page number
        pdf.setFontSize(9);
        pdf.text(`Page ${pageNum}`, pageWidth - margins.right - 15, 38);

        // Reset text color
        pdf.setTextColor(0, 0, 0);
      };

      // Helper function to add modern footer
      const addModernFooter = () => {
        pdf.setFontSize(8);
        pdf.setTextColor(100, 116, 139);
        pdf.setFont("helvetica", "normal");

        const footerText = `Generated on ${format(
          new Date(),
          "MMMM dd, yyyy 'at' HH:mm"
        )} | MedCure Pro v1.0`;
        const footerWidth = pdf.getTextWidth(footerText);
        pdf.text(footerText, (pageWidth - footerWidth) / 2, pageHeight - 15);

        // Confidential notice
        pdf.setFontSize(7);
        const confText = "CONFIDENTIAL - For Internal Use Only";
        const confWidth = pdf.getTextWidth(confText);
        pdf.text(confText, (pageWidth - confWidth) / 2, pageHeight - 10);
      };

      // Page 1: Header and Report Period
      addModernHeader(1);
      let currentY = 55;

      // Report period card
      pdf.setFillColor(...colors.headerBg);
      pdf.roundedRect(
        margins.left,
        currentY,
        pageWidth - margins.left - margins.right,
        20,
        3,
        3,
        "F"
      );

      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...colors.secondary);
      pdf.text("Report Period:", margins.left + 8, currentY + 8);

      pdf.setFont("helvetica", "normal");
      pdf.text(reportData.period, margins.left + 8, currentY + 15);

      currentY += 30;

      // Executive Summary Section
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...colors.primary);
      pdf.text("Executive Summary", margins.left, currentY);

      // Underline
      pdf.setDrawColor(...colors.primary);
      pdf.setLineWidth(0.5);
      pdf.line(margins.left, currentY + 2, margins.left + 50, currentY + 2);

      currentY += 12;

      // Modern summary cards layout
      const summaryData = [
        [
          "Total Revenue",
          formatCurrency(reportData.summary.totalRevenue),
          colors.primary,
        ],
        [
          "Total Cost",
          formatCurrency(reportData.summary.totalCost),
          colors.secondary,
        ],
        [
          "Gross Profit",
          formatCurrency(reportData.summary.grossProfit),
          colors.accent,
        ],
        [
          "Profit Margin",
          `${reportData.summary.profitMargin.toFixed(2)}%`,
          reportData.summary.profitMargin > 0 ? colors.accent : colors.danger,
        ],
        [
          "Avg Order Value",
          formatCurrency(reportData.summary.averageOrderValue),
          colors.secondary,
        ],
        [
          "Transactions",
          reportData.summary.transactionCount.toString(),
          colors.primary,
        ],
      ];

      // Create 2-column layout for summary cards
      const cardWidth = (pageWidth - margins.left - margins.right - 10) / 2;
      const cardHeight = 22;
      let cardX = margins.left;
      let cardY = currentY;

      summaryData.forEach((item, index) => {
        if (index > 0 && index % 2 === 0) {
          cardX = margins.left;
          cardY += cardHeight + 5;
        }

        // Card background
        pdf.setFillColor(255, 255, 255);
        pdf.setDrawColor(...colors.lightGray);
        pdf.setLineWidth(0.3);
        pdf.roundedRect(cardX, cardY, cardWidth, cardHeight, 2, 2, "FD");

        // Card content
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(...colors.secondary);
        pdf.text(item[0], cardX + 5, cardY + 8);

        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(...item[2]);
        pdf.text(item[1], cardX + 5, cardY + 17);

        cardX += cardWidth + 10;
      });

      currentY = cardY + cardHeight + 20;

      // Category Breakdown Section
      if (currentY > 200) {
        pdf.addPage();
        addModernHeader(2);
        currentY = 55;
      }

      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...colors.primary);
      pdf.text("Revenue by Category", margins.left, currentY);
      pdf.setDrawColor(...colors.primary);
      pdf.setLineWidth(0.5);
      pdf.line(margins.left, currentY + 2, margins.left + 55, currentY + 2);
      currentY += 10;

      const categoryData = reportData.categoryBreakdown
        .slice(0, 10)
        .map((category) => {
          const margin =
            category.revenue > 0
              ? ((category.profit / category.revenue) * 100).toFixed(2)
              : "0.00";
          return [
            category.name,
            formatCurrency(category.revenue),
            formatCurrency(category.cost),
            formatCurrency(category.profit),
            `${margin}%`,
          ];
        });

      pdf.autoTable({
        head: [["Category", "Revenue", "Cost", "Profit", "Margin %"]],
        body: categoryData,
        startY: currentY,
        theme: "plain",
        styles: {
          fontSize: 9,
          cellPadding: 6,
          lineColor: [226, 232, 240],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: colors.primary,
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 10,
          halign: "left",
        },
        columnStyles: {
          0: { cellWidth: 60, fontStyle: "normal" },
          1: { cellWidth: 30, halign: "right" },
          2: { cellWidth: 30, halign: "right" },
          3: { cellWidth: 30, halign: "right" },
          4: { cellWidth: 20, halign: "center", fontStyle: "bold" },
        },
        alternateRowStyles: {
          fillColor: colors.headerBg,
        },
        margin: { left: margins.left, right: margins.right },
      });

      currentY = pdf.lastAutoTable.finalY + 20;

      // Top Products Section
      if (currentY > 200) {
        pdf.addPage();
        addModernHeader(3);
        currentY = 55;
      }

      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...colors.primary);
      pdf.text("Top Performing Products", margins.left, currentY);
      pdf.setDrawColor(...colors.primary);
      pdf.setLineWidth(0.5);
      pdf.line(margins.left, currentY + 2, margins.left + 60, currentY + 2);
      currentY += 10;

      const productData = reportData.topProducts
        .slice(0, 10)
        .map((product) => [
          product.name,
          product.quantity.toString(),
          formatCurrency(product.revenue),
          formatCurrency(product.profit),
        ]);

      pdf.autoTable({
        head: [["Product", "Qty Sold", "Revenue", "Profit"]],
        body: productData,
        startY: currentY,
        theme: "plain",
        styles: {
          fontSize: 9,
          cellPadding: 6,
          lineColor: [226, 232, 240],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: colors.primary,
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 10,
          halign: "left",
        },
        columnStyles: {
          0: { cellWidth: 80, fontStyle: "normal" },
          1: { cellWidth: 25, halign: "center" },
          2: { cellWidth: 35, halign: "right" },
          3: { cellWidth: 30, halign: "right", fontStyle: "bold" },
        },
        alternateRowStyles: {
          fillColor: colors.headerBg,
        },
        margin: { left: margins.left, right: margins.right },
      });

      // Add footer to all pages
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        addModernFooter();
      }

      return pdf;
    } catch (error) {
      console.error("Error exporting financial report to PDF:", error);
      throw error;
    }
  }

  // Export Inventory Report to PDF
  static async exportInventoryReportToPDF(reportData, options = {}) {
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.width;
      const pageHeight = pdf.internal.pageSize.height;
      const margins = { left: 20, right: 20, top: 25, bottom: 25 };

      // Modern Color Palette
      const colors = {
        primary: [34, 139, 230],
        secondary: [71, 85, 105],
        accent: [16, 185, 129],
        warning: [245, 158, 11],
        danger: [239, 68, 68],
        lightGray: [241, 245, 249],
        darkGray: [51, 65, 85],
        headerBg: [248, 250, 252],
      };

      // Helper function to add modern header
      const addModernHeader = (pageNum = 1) => {
        pdf.setFillColor(...colors.primary);
        pdf.rect(0, 0, pageWidth, 45, "F");

        pdf.setFontSize(24);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(255, 255, 255);
        pdf.text("MedCure Pharmacy", margins.left, 20);

        pdf.setFontSize(12);
        pdf.setFont("helvetica", "normal");
        pdf.text("Inventory Status Report", margins.left, 30);

        pdf.setFontSize(9);
        pdf.text(`Page ${pageNum}`, pageWidth - margins.right - 15, 38);

        pdf.setTextColor(0, 0, 0);
      };

      // Helper function to add modern footer
      const addModernFooter = () => {
        pdf.setFontSize(8);
        pdf.setTextColor(100, 116, 139);
        pdf.setFont("helvetica", "normal");

        const footerText = `Generated on ${format(
          new Date(reportData.generatedAt),
          "MMMM dd, yyyy 'at' HH:mm"
        )} | MedCure Pro v1.0`;
        const footerWidth = pdf.getTextWidth(footerText);
        pdf.text(footerText, (pageWidth - footerWidth) / 2, pageHeight - 15);

        pdf.setFontSize(7);
        const confText = "CONFIDENTIAL - For Internal Use Only";
        const confWidth = pdf.getTextWidth(confText);
        pdf.text(confText, (pageWidth - confWidth) / 2, pageHeight - 10);
      };

      // Page 1: Header
      addModernHeader(1);
      let currentY = 55;

      // Report timestamp card
      pdf.setFillColor(...colors.headerBg);
      pdf.roundedRect(
        margins.left,
        currentY,
        pageWidth - margins.left - margins.right,
        20,
        3,
        3,
        "F"
      );

      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...colors.secondary);
      pdf.text("Report Generated:", margins.left + 8, currentY + 8);

      pdf.setFont("helvetica", "normal");
      pdf.text(
        format(new Date(reportData.generatedAt), "MMM dd, yyyy HH:mm"),
        margins.left + 8,
        currentY + 15
      );

      currentY += 30;

      // Inventory Overview Section
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...colors.primary);
      pdf.text("Inventory Overview", margins.left, currentY);
      pdf.setDrawColor(...colors.primary);
      pdf.setLineWidth(0.5);
      pdf.line(margins.left, currentY + 2, margins.left + 50, currentY + 2);
      currentY += 12;

      // Modern summary cards
      const summaryData = [
        [
          "Total Products",
          reportData.summary.totalProducts.toString(),
          colors.primary,
        ],
        [
          "Total Value",
          formatCurrency(reportData.summary.totalValue),
          colors.accent,
        ],
        [
          "Low Stock Items",
          reportData.summary.lowStockItems.toString(),
          colors.warning,
        ],
        [
          "Expiring Soon",
          reportData.summary.expiringItems.toString(),
          colors.warning,
        ],
        [
          "Expired Items",
          reportData.summary.expiredItems.toString(),
          colors.danger,
        ],
        [
          "Out of Stock",
          reportData.summary.outOfStockItems.toString(),
          colors.danger,
        ],
      ];

      const cardWidth = (pageWidth - margins.left - margins.right - 10) / 2;
      const cardHeight = 22;
      let cardX = margins.left;
      let cardY = currentY;

      summaryData.forEach((item, index) => {
        if (index > 0 && index % 2 === 0) {
          cardX = margins.left;
          cardY += cardHeight + 5;
        }

        pdf.setFillColor(255, 255, 255);
        pdf.setDrawColor(...colors.lightGray);
        pdf.setLineWidth(0.3);
        pdf.roundedRect(cardX, cardY, cardWidth, cardHeight, 2, 2, "FD");

        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(...colors.secondary);
        pdf.text(item[0], cardX + 5, cardY + 8);

        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(...item[2]);
        pdf.text(item[1], cardX + 5, cardY + 17);

        cardX += cardWidth + 10;
      });

      currentY = cardY + cardHeight + 20;

      // Low Stock Alert Section
      if (reportData.lowStockProducts.length > 0) {
        if (currentY > 200) {
          pdf.addPage();
          addModernHeader(2);
          currentY = 55;
        }

        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(...colors.warning);
        pdf.text("⚠ Low Stock Alert", margins.left, currentY);
        pdf.setDrawColor(...colors.warning);
        pdf.setLineWidth(0.5);
        pdf.line(margins.left, currentY + 2, margins.left + 42, currentY + 2);
        currentY += 10;

        const lowStockData = reportData.lowStockProducts
          .slice(0, 15)
          .map((product) => [
            product.name,
            product.category,
            product.currentStock.toString(),
            product.reorderLevel.toString(),
            formatCurrency(product.stockValue),
          ]);

        pdf.autoTable({
          head: [["Product", "Category", "Current", "Reorder", "Value"]],
          body: lowStockData,
          startY: currentY,
          theme: "plain",
          styles: {
            fontSize: 9,
            cellPadding: 6,
            lineColor: [226, 232, 240],
            lineWidth: 0.1,
          },
          headStyles: {
            fillColor: colors.warning,
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 10,
            halign: "left",
          },
          columnStyles: {
            0: { cellWidth: 65, fontStyle: "normal" },
            1: { cellWidth: 35 },
            2: { cellWidth: 22, halign: "center", fontStyle: "bold" },
            3: { cellWidth: 22, halign: "center" },
            4: { cellWidth: 26, halign: "right" },
          },
          alternateRowStyles: {
            fillColor: colors.headerBg,
          },
          margin: { left: margins.left, right: margins.right },
        });

        currentY = pdf.lastAutoTable.finalY + 20;
      }

      // Category Breakdown Section
      if (currentY > 200) {
        pdf.addPage();
        addModernHeader(pdf.internal.getNumberOfPages());
        currentY = 55;
      }

      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...colors.primary);
      pdf.text("Category Analysis", margins.left, currentY);
      pdf.setDrawColor(...colors.primary);
      pdf.setLineWidth(0.5);
      pdf.line(margins.left, currentY + 2, margins.left + 45, currentY + 2);
      currentY += 10;

      const categoryData = reportData.categories
        .slice(0, 10)
        .map((category) => [
          category.name,
          category.count.toString(),
          formatCurrency(category.totalValue),
          category.lowStock.toString(),
          category.expiring.toString(),
        ]);

      pdf.autoTable({
        head: [
          ["Category", "Products", "Total Value", "Low Stock", "Expiring"],
        ],
        body: categoryData,
        startY: currentY,
        theme: "plain",
        styles: {
          fontSize: 9,
          cellPadding: 6,
          lineColor: [226, 232, 240],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: colors.primary,
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 10,
          halign: "left",
        },
        columnStyles: {
          0: { cellWidth: 60, fontStyle: "normal" },
          1: { cellWidth: 25, halign: "center" },
          2: { cellWidth: 40, halign: "right", fontStyle: "bold" },
          3: { cellWidth: 25, halign: "center" },
          4: { cellWidth: 25, halign: "center" },
        },
        alternateRowStyles: {
          fillColor: colors.headerBg,
        },
        margin: { left: margins.left, right: margins.right },
      });

      // Add footer to all pages
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        addModernFooter();
      }

      return pdf;
    } catch (error) {
      console.error("Error exporting inventory report to PDF:", error);
      throw error;
    }
  }

  // Export chart or component to PDF using html2canvas
  static async exportComponentToPDF(
    elementId,
    filename = "report.pdf",
    options = {}
  ) {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error(`Element with ID '${elementId}' not found`);
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        ...options,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF();
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      return pdf;
    } catch (error) {
      console.error("Error exporting component to PDF:", error);
      throw error;
    }
  }
}
