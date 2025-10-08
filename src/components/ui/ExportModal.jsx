import React, { useState } from "react";
import { X, Download, FileText, Database } from "lucide-react";
import { UnifiedCategoryService } from "../../services/domains/inventory/unifiedCategoryService";

const ExportModal = ({ isOpen, onClose, products, categories }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    exportType: "products", // "products" or "categories"
    format: "csv",
    filters: {
      category: "all",
      stockStatus: "all",
      expiryStatus: "all",
    },
    columns: {
      name: true, // generic_name
      brand: true, // brand_name
      category: true,
      dosageStrength: true, // Enable by default for medicine
      dosageForm: true, // Enable by default for medicine
      drugClassification: false,
      stock: true,
      price: true,
      costPrice: false,
      marginPercentage: false,
      expiry: true,
      supplier: false,
      batchNumber: false,
      unitConversion: false,
    },
  });

  const handleExport = async () => {
    console.log("🔄 Starting export...");
    console.log("📦 Export Options:", exportOptions);
    console.log("📊 Total Products:", products?.length || 0);
    setIsExporting(true);

    try {
      if (exportOptions.exportType === "categories") {
        // Export intelligent category insights
        const result = await UnifiedCategoryService.getCategoryInsights();
        if (result.success) {
          const categoryData = result.data.top_value_categories.map(
            (category) => ({
              "Category Name": category.name,
              "Total Products": category.stats?.total_products || 0,
              "Total Value": category.stats?.total_value || 0,
              "Low Stock Count": category.stats?.low_stock_count || 0,
              "Auto Created": category.metadata?.auto_created ? "Yes" : "No",
              "Last Updated": category.last_calculated || "Not calculated",
            })
          );

          if (exportOptions.format === "csv") {
            downloadCSV(categoryData, "category_insights");
          } else if (exportOptions.format === "json") {
            downloadJSON(categoryData, "category_insights");
          } else if (exportOptions.format === "pdf") {
            downloadPDF(
              categoryData,
              "category_insights",
              "Category Insights Report"
            );
          }
        }
      } else {
        // Export products - Filter products based on selected filters
        let filteredProducts = products || [];

        if (exportOptions.filters.category !== "all") {
          filteredProducts = filteredProducts.filter(
            (product) => product.category === exportOptions.filters.category
          );
        }

        if (exportOptions.filters.stockStatus !== "all") {
          filteredProducts = filteredProducts.filter((product) => {
            const stockLevel = product.stock_in_pieces || 0;
            const reorderLevel = product.reorder_level || 0;

            switch (exportOptions.filters.stockStatus) {
              case "low":
                return stockLevel <= reorderLevel && stockLevel > 0;
              case "out":
                return stockLevel === 0;
              case "normal":
                return stockLevel > reorderLevel;
              default:
                return true;
            }
          });
        }

        if (exportOptions.filters.expiryStatus !== "all") {
          filteredProducts = filteredProducts.filter((product) => {
            const expiryDate = new Date(product.expiry_date);
            const today = new Date();
            const daysUntilExpiry = Math.ceil(
              (expiryDate - today) / (1000 * 60 * 60 * 24)
            );

            switch (exportOptions.filters.expiryStatus) {
              case "expired":
                return daysUntilExpiry < 0;
              case "expiring":
                return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
              case "fresh":
                return daysUntilExpiry > 30;
              default:
                return true;
            }
          });
        }

        console.log("📊 Filtered Products:", filteredProducts.length);

        // Prepare data for export
        const dataToExport = filteredProducts.map((product) => {
          const row = {};

          if (exportOptions.columns.name)
            row["Generic Name"] = product.generic_name || "Unknown Product";
          if (exportOptions.columns.brand)
            row["Brand Name"] = product.brand_name || "";
          if (exportOptions.columns.category)
            row["Category"] = product.category;
          if (exportOptions.columns.dosageStrength)
            row["Dosage Strength"] = product.dosage_strength || "";
          if (exportOptions.columns.dosageForm)
            row["Dosage Form"] = product.dosage_form || "";
          if (exportOptions.columns.drugClassification)
            row["Drug Classification"] = product.drug_classification || "";
          if (exportOptions.columns.stock)
            row["Stock (Pieces)"] = product.stock_in_pieces;
          if (exportOptions.columns.price)
            row["Price per Piece"] = product.price_per_piece;
          if (exportOptions.columns.costPrice)
            row["Cost Price"] = product.cost_price || "";
          if (exportOptions.columns.marginPercentage)
            row["Margin Percentage"] = product.margin_percentage || "";
          if (exportOptions.columns.expiry)
            row["Expiry Date"] = product.expiry_date?.split("T")[0];
          if (exportOptions.columns.supplier)
            row["Supplier"] = product.supplier;
          if (exportOptions.columns.batchNumber)
            row["Batch Number"] = product.batch_number;
          if (exportOptions.columns.unitConversion) {
            row["Pieces per Sheet"] = product.pieces_per_sheet || 1;
            row["Sheets per Box"] = product.sheets_per_box || 1;
          }

          // Always include reorder_level for accurate stock calculations (hidden in display)
          row["_reorder_level"] = product.reorder_level || 10;

          return row;
        });

        // Generate and download file
        if (exportOptions.format === "csv") {
          downloadCSV(dataToExport, "medicine_inventory_export");
        } else if (exportOptions.format === "json") {
          downloadJSON(dataToExport, "medicine_inventory_export");
        } else if (exportOptions.format === "pdf") {
          downloadPDF(
            dataToExport,
            "medicine_inventory_export",
            "Medicine Inventory Report"
          );
        }
      }

      // Show success message
      console.log("✅ Export completed successfully!");
      alert("Export completed successfully! Check your downloads folder.");

      // Close modal after successful export
      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 1000);
    } catch (error) {
      console.error("❌ Export error:", error);
      alert(`Export failed: ${error.message}`);
      setIsExporting(false);
    }
  };

  const downloadCSV = (data, filename = "export") => {
    console.log("📄 Generating CSV with", data.length, "rows");
    if (data.length === 0) {
      console.warn("⚠️ No data to export");
      alert("No data to export. Please check your filters.");
      return;
    }

    // Ensure batch_number is included in exports for inventory data
    let processedData = data;
    if (filename.includes("inventory") || filename.includes("medicine")) {
      processedData = data.map((item) => ({
        ...item,
        batch_number: item.batch_number || "N/A",
      }));
    }

    // Define proper column order for medicine/inventory exports
    let orderedHeaders = Object.keys(processedData[0]);

    const csvContent = [
      orderedHeaders.join(","),
      ...processedData.map((row) =>
        orderedHeaders
          .map((header) => {
            let value = row[header] || "";
            // Handle values that contain commas, quotes, or newlines
            if (
              typeof value === "string" &&
              (value.includes(",") ||
                value.includes('"') ||
                value.includes("\n"))
            ) {
              value = `"${value.replace(/"/g, '""')}"`;
            } else {
              value = `"${value}"`;
            }
            return value;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${filename}_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadJSON = (data, filename = "export") => {
    console.log("📄 Generating JSON with", data.length, "items");
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${filename}_${new Date().toISOString().split("T")[0]}.json`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPDF = async (
    data,
    filename = "export",
    title = "Medicine Inventory Report"
  ) => {
    console.log("📄 Generating PDF with", data.length, "items");

    if (data.length === 0) {
      console.warn("⚠️ No data to export");
      alert("No data to export. Please check your filters.");
      return;
    }

    try {
      // Lazy load jspdf and autotable
      const jsPDFModule = await import("jspdf");
      const autoTableModule = await import("jspdf-autotable");
      const jsPDF = jsPDFModule.default;
      const autoTable = autoTableModule.default;

      // Create new PDF document
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margins = { left: 15, right: 15, top: 30, bottom: 20 };

      // Professional Color Palette - Subtle and Clean
      const colors = {
        primary: [37, 99, 235], // Professional blue
        secondary: [71, 85, 105], // Slate gray
        lightBg: [248, 250, 252], // Light background
        border: [226, 232, 240], // Subtle border
        text: [30, 41, 59], // Dark text
        textLight: [100, 116, 139], // Light text
      };

      // ============================================
      // HEADER - Clean Professional Design
      // ============================================

      const addHeader = (pageNum) => {
        // Simple header background - subtle
        doc.setFillColor(...colors.primary);
        doc.rect(0, 0, pageWidth, 25, "F");

        // Company Name
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        doc.text("MedCure Pharmacy", margins.left, 12);

        // Report Title
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(title, margins.left, 18);

        // Current Date & Page Number - Right side
        const currentDate = new Date();
        const dateStr = `${currentDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })} • ${currentDate.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })}`;

        doc.setFontSize(9);
        doc.text(dateStr, pageWidth - margins.right, 12, { align: "right" });
        doc.text(`Page ${pageNum}`, pageWidth - margins.right, 18, {
          align: "right",
        });

        // Reset colors
        doc.setTextColor(...colors.text);
      };

      // ============================================
      // SUMMARY SECTION - Clean Metrics
      // ============================================

      let yPos = 35;

      // Calculate summary statistics with proper data handling
      const summary = {
        totalProducts: data.length,
        totalValue: 0,
        lowStock: 0,
        outOfStock: 0,
      };

      console.log("📊 Calculating summary from data:", data.length, "items");

      data.forEach((item, index) => {
        // Handle different possible field names for stock
        const stock = parseInt(
          item["Stock (Pieces)"] ||
            item["Stock Level"] ||
            item["stock"] ||
            item["stock_in_pieces"] ||
            0
        );

        // Handle different possible field names for price
        const price = parseFloat(
          item["Price per Piece"] ||
            item["price"] ||
            item["price_per_piece"] ||
            0
        );

        // Get reorder level from hidden field or default to 10
        const reorderLevel = parseInt(
          item["_reorder_level"] ||
            item["Reorder Level"] ||
            item["reorder_level"] ||
            10
        );

        // Calculate total value
        if (!isNaN(stock) && !isNaN(price)) {
          summary.totalValue += stock * price;
        }

        // Count stock levels accurately using reorder_level
        if (stock === 0) {
          summary.outOfStock++;
        } else if (stock > 0 && stock <= reorderLevel) {
          summary.lowStock++;
        }

        // Debug first item to verify data structure
        if (index === 0) {
          console.log("📦 First item structure:", {
            stock,
            price,
            reorderLevel,
            stockField: item["Stock (Pieces)"],
            priceField: item["Price per Piece"],
            reorderField: item["Reorder Level"],
            allKeys: Object.keys(item),
          });
        }
      });

      console.log("📊 Summary calculated:", summary);

      // Format total value properly - FIXED: Use PHP instead of peso symbol
      const formattedValue =
        summary.totalValue >= 1000000
          ? `PHP ${(summary.totalValue / 1000000).toFixed(2)}M`
          : summary.totalValue >= 1000
          ? `PHP ${(summary.totalValue / 1000).toFixed(1)}K`
          : `PHP ${summary.totalValue.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`;

      // Summary info bar - clean design
      doc.setFillColor(...colors.lightBg);
      doc.rect(
        margins.left,
        yPos,
        pageWidth - margins.left - margins.right,
        14,
        "F"
      );

      // Left side - Total Records
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...colors.text);
      doc.text(`Total Records: ${data.length}`, margins.left + 5, yPos + 6);

      // Export Date below
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...colors.textLight);
      const exportDate = new Date();
      const formattedDate = `${exportDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })}`;
      doc.text(`Export Date: ${formattedDate}`, margins.left + 5, yPos + 11);

      // Right side - Time
      const hours = exportDate.getHours();
      const minutes = exportDate.getMinutes();
      const seconds = exportDate.getSeconds();
      const ampm = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12;
      const formattedTime = `${displayHours}:${String(minutes).padStart(
        2,
        "0"
      )}:${String(seconds).padStart(2, "0")} ${ampm}`;

      doc.setFont("helvetica", "normal");
      doc.text(
        `Time: ${formattedTime}`,
        pageWidth - margins.right - 5,
        yPos + 6,
        {
          align: "right",
        }
      );

      yPos += 20;

      // Key Metrics - Clean 4-column layout with subtle styling
      const boxWidth = (pageWidth - margins.left - margins.right - 9) / 4;
      const boxHeight = 16;

      const summaryData = [
        { label: "Total Products", value: String(summary.totalProducts) },
        { label: "Total Value", value: formattedValue },
        { label: "Low Stock", value: String(summary.lowStock) },
        { label: "Out of Stock", value: String(summary.outOfStock) },
      ];

      summaryData.forEach((item, index) => {
        const xPos = margins.left + (boxWidth + 3) * index;

        // Subtle box with border
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(...colors.border);
        doc.setLineWidth(0.3);
        doc.rect(xPos, yPos, boxWidth, boxHeight, "FD");

        // Label
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...colors.textLight);
        doc.text(item.label, xPos + boxWidth / 2, yPos + 6, {
          align: "center",
        });

        // Value
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...colors.text);
        doc.text(item.value, xPos + boxWidth / 2, yPos + 12, {
          align: "center",
        });
      });

      yPos += boxHeight + 8;

      // ============================================
      // DATA TABLE - Responsive Auto-Adjusting Design
      // ============================================

      // Prepare table columns and rows - filter out hidden columns
      const allColumns = Object.keys(data[0]);
      const visibleColumns = allColumns.filter((key) => !key.startsWith("_"));
      const columns = visibleColumns.map((key) => ({
        header: key,
        dataKey: key,
      }));

      // Calculate dynamic sizing based on column count
      const columnCount = columns.length;
      const availableTableWidth = pageWidth - margins.left - margins.right;

      console.log("📊 PDF Table Configuration:");
      console.log("   - Total Columns:", columnCount);
      console.log("   - Available Width:", availableTableWidth, "mm");
      console.log(
        "   - Column Names:",
        columns.map((c) => c.dataKey).join(", ")
      );

      // Enhanced column width calculation - adaptive for any number of columns
      const getOptimalColumnWidth = (
        columnName,
        totalColumns,
        availableWidth
      ) => {
        // Define column weight system with adaptive min/max based on column count
        const getColumnConfig = (colName) => {
          const baseConfigs = {
            "Generic Name": { weight: 4.5, minBase: 35, maxBase: 60 },
            "Brand Name": { weight: 3.5, minBase: 30, maxBase: 50 },
            Category: { weight: 3.8, minBase: 32, maxBase: 55 },
            "Dosage Strength": { weight: 2.2, minBase: 18, maxBase: 28 },
            "Dosage Form": { weight: 2.0, minBase: 16, maxBase: 25 },
            "Drug Classification": { weight: 3.0, minBase: 25, maxBase: 45 },
            "Stock (Pieces)": { weight: 2.0, minBase: 16, maxBase: 24 },
            "Price per Piece": { weight: 2.2, minBase: 18, maxBase: 28 },
            "Cost Price": { weight: 2.2, minBase: 18, maxBase: 28 },
            "Margin Percentage": { weight: 2.0, minBase: 16, maxBase: 24 },
            "Expiry Date": { weight: 2.5, minBase: 22, maxBase: 30 },
            Supplier: { weight: 3.0, minBase: 25, maxBase: 45 },
            "Batch Number": { weight: 2.3, minBase: 20, maxBase: 30 },
            "Pieces per Sheet": { weight: 2.0, minBase: 16, maxBase: 24 },
            "Sheets per Box": { weight: 2.0, minBase: 16, maxBase: 24 },
          };

          const base = baseConfigs[colName] || {
            weight: 2.5,
            minBase: 18,
            maxBase: 35,
          };

          // Adjust min/max based on total columns - more columns = smaller minimums
          let minAdjustment = 1.0;
          let maxAdjustment = 1.0;

          if (totalColumns <= 5) {
            minAdjustment = 1.0;
            maxAdjustment = 1.0;
          } else if (totalColumns <= 7) {
            minAdjustment = 0.95;
            maxAdjustment = 0.9;
          } else if (totalColumns <= 9) {
            minAdjustment = 0.85;
            maxAdjustment = 0.8;
          } else if (totalColumns <= 12) {
            minAdjustment = 0.75;
            maxAdjustment = 0.7;
          } else {
            // 13+ columns - aggressive compression
            minAdjustment = 0.65;
            maxAdjustment = 0.6;
          }

          return {
            weight: base.weight,
            min: Math.round(base.minBase * minAdjustment),
            max: Math.round(base.maxBase * maxAdjustment),
          };
        };

        const colConfig = getColumnConfig(columnName);

        // Calculate total weight
        const totalWeight = columns.reduce((sum, col) => {
          const config = getColumnConfig(col.dataKey);
          return sum + config.weight;
        }, 0);

        // Calculate proportional width
        const proportionalWidth =
          (colConfig.weight / totalWeight) * availableWidth;

        // Ensure width is within adaptive min/max bounds
        return Math.max(
          colConfig.min,
          Math.min(colConfig.max, proportionalWidth)
        );
      };

      // Build dynamic column styles with optimal spacing
      const dynamicColumnStyles = {};
      columns.forEach((col, index) => {
        const colWidth = getOptimalColumnWidth(
          col.dataKey,
          columnCount,
          availableTableWidth
        );

        dynamicColumnStyles[col.dataKey] = {
          cellWidth: colWidth,
          halign:
            col.dataKey.includes("Price") ||
            col.dataKey.includes("Cost") ||
            col.dataKey.includes("Value")
              ? "right"
              : col.dataKey.includes("Stock") ||
                col.dataKey.includes("Dosage") ||
                col.dataKey.includes("Margin") ||
                col.dataKey.includes("per Sheet") ||
                col.dataKey.includes("per Box")
              ? "center"
              : "left",
          fontStyle:
            col.dataKey === "Generic Name" || col.dataKey === "Stock (Pieces)"
              ? "bold"
              : "normal",
        };

        // First column always gets priority styling
        if (index === 0) {
          dynamicColumnStyles[0] = {
            ...dynamicColumnStyles[col.dataKey],
            fontStyle: "bold",
          };
        }
      });

      // Optimized font sizes and spacing - aggressive scaling for many columns
      let headerFontSize, bodyFontSize, cellPadding;

      if (columnCount <= 5) {
        // Few columns - spacious layout
        headerFontSize = 9;
        bodyFontSize = 8;
        cellPadding = { top: 3.5, right: 4, bottom: 3.5, left: 4 };
      } else if (columnCount <= 7) {
        // Standard layout
        headerFontSize = 8;
        bodyFontSize = 7;
        cellPadding = { top: 3, right: 3, bottom: 3, left: 3 };
      } else if (columnCount <= 9) {
        // Moderate compression
        headerFontSize = 7;
        bodyFontSize = 6.5;
        cellPadding = { top: 2.5, right: 2.5, bottom: 2.5, left: 2.5 };
      } else if (columnCount <= 12) {
        // Significant compression
        headerFontSize = 6.5;
        bodyFontSize = 6;
        cellPadding = { top: 2, right: 2, bottom: 2, left: 2 };
      } else {
        // Maximum compression for 13+ columns
        headerFontSize = 6;
        bodyFontSize = 5.5;
        cellPadding = { top: 1.8, right: 1.8, bottom: 1.8, left: 1.8 };
      }

      console.log(
        "   - Font Sizes: Header",
        headerFontSize,
        "pt, Body",
        bodyFontSize,
        "pt"
      );
      console.log("   - Cell Padding:", cellPadding.top, "mm");

      // Add table with responsive, space-filling design
      autoTable(doc, {
        startY: yPos,
        columns: columns,
        body: data,
        theme: "plain",
        tableWidth: availableTableWidth,
        headStyles: {
          fillColor: colors.primary,
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: headerFontSize,
          halign: "left",
          valign: "middle",
          cellPadding: cellPadding,
          lineWidth: 0.15,
          lineColor: [255, 255, 255],
        },
        bodyStyles: {
          fontSize: bodyFontSize,
          textColor: colors.text,
          cellPadding: cellPadding,
          lineWidth: 0.1,
          lineColor: colors.border,
          minCellHeight:
            columnCount <= 6
              ? 9
              : columnCount <= 9
              ? 8
              : columnCount <= 12
              ? 7
              : 6,
        },
        alternateRowStyles: {
          fillColor: colors.lightBg,
        },
        columnStyles: dynamicColumnStyles,
        margin: margins,
        styles: {
          overflow: "linebreak",
          cellWidth: "wrap",
          lineColor: colors.border,
          lineWidth: 0.1,
          fontSize: bodyFontSize,
          halign: "left",
        },
        // Add alternating row effect with better contrast
        willDrawCell: function (data) {
          // Add subtle hover effect for rows
          if (data.row.section === "body" && data.row.index % 2 === 0) {
            data.cell.styles.fillColor = [255, 255, 255];
          }
        },
        // Subtle highlighting for critical values
        didParseCell: function (data) {
          // Stock highlighting - subtle
          if (
            data.column.dataKey === "Stock (Pieces)" &&
            data.cell.section === "body"
          ) {
            const stock = parseInt(data.cell.raw || 0);
            if (stock === 0) {
              data.cell.styles.textColor = [220, 38, 38]; // Red-600
              data.cell.styles.fontStyle = "bold";
            } else if (stock <= 10) {
              data.cell.styles.textColor = [234, 88, 12]; // Orange-600
              data.cell.styles.fontStyle = "bold";
            }
          }

          // Expiry date highlighting
          if (
            data.column.dataKey === "Expiry Date" &&
            data.cell.section === "body"
          ) {
            try {
              const expiryDate = new Date(data.cell.raw);
              const today = new Date();
              const daysUntilExpiry = Math.ceil(
                (expiryDate - today) / (1000 * 60 * 60 * 24)
              );

              if (daysUntilExpiry < 0) {
                // Expired - bold red
                data.cell.styles.textColor = [220, 38, 38];
                data.cell.styles.fontStyle = "bold";
              } else if (daysUntilExpiry <= 30) {
                // Expiring soon - orange
                data.cell.styles.textColor = [234, 88, 12];
              }
            } catch {
              // Skip if date parsing fails
            }
          }

          // Price highlighting for high-value items
          if (
            data.column.dataKey === "Price per Piece" &&
            data.cell.section === "body"
          ) {
            const price = parseFloat(data.cell.raw || 0);
            if (price >= 100) {
              data.cell.styles.fontStyle = "bold";
            }
          }
        },
        didDrawPage: function () {
          // Add header to each page
          addHeader(doc.internal.getCurrentPageInfo().pageNumber);
        },
      });

      // ============================================
      // FOOTER - Professional and Minimal
      // ============================================

      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);

        // Simple footer line
        doc.setDrawColor(...colors.border);
        doc.setLineWidth(0.3);
        doc.line(
          margins.left,
          pageHeight - 15,
          pageWidth - margins.right,
          pageHeight - 15
        );

        // Footer text - left side
        doc.setFontSize(7);
        doc.setTextColor(...colors.textLight);
        doc.setFont("helvetica", "normal");
        doc.text(
          "MedCure Pharmacy Management System",
          margins.left,
          pageHeight - 10
        );

        // Footer text - center
        doc.text(
          "CONFIDENTIAL - For Internal Use Only",
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );

        // Footer text - right side (page number)
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...colors.text);
        doc.text(
          `Page ${i} of ${pageCount}`,
          pageWidth - margins.right,
          pageHeight - 10,
          { align: "right" }
        );
      }

      // ============================================
      // SAVE PDF
      // ============================================

      doc.save(`${filename}_${new Date().toISOString().split("T")[0]}.pdf`);
      console.log("✅ PDF generated successfully!");
    } catch (error) {
      console.error("❌ PDF generation error:", error);
      alert(`Failed to generate PDF: ${error.message}`);
      throw error;
    }
  };

  const updateFilters = (key, value) => {
    setExportOptions((prev) => ({
      ...prev,
      filters: {
        ...prev.filters,
        [key]: value,
      },
    }));
  };

  const updateColumns = (key, value) => {
    setExportOptions((prev) => ({
      ...prev,
      columns: {
        ...prev.columns,
        [key]: value,
      },
    }));
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header - Modern with Gradient */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <Download className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Export Medicine Inventory
              </h3>
              <p className="text-sm text-gray-600">
                Download inventory data in your preferred format
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="group p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
          >
            <X className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" />
          </button>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Export Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              📦 Export Type
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() =>
                  setExportOptions((prev) => ({
                    ...prev,
                    exportType: "products",
                  }))
                }
                className={`group p-4 border-2 rounded-xl flex items-center justify-center space-x-3 transition-all duration-200 ${
                  exportOptions.exportType === "products"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md"
                    : "border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-gray-700"
                }`}
              >
                <FileText
                  className={`w-5 h-5 transition-transform duration-200 ${
                    exportOptions.exportType === "products"
                      ? "scale-110"
                      : "group-hover:scale-110"
                  }`}
                />
                <span className="font-medium">Product Inventory</span>
              </button>
              <button
                onClick={() =>
                  setExportOptions((prev) => ({
                    ...prev,
                    exportType: "categories",
                  }))
                }
                className={`group p-4 border-2 rounded-xl flex items-center justify-center space-x-3 transition-all duration-200 ${
                  exportOptions.exportType === "categories"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md"
                    : "border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-gray-700"
                }`}
              >
                <Database
                  className={`w-5 h-5 transition-transform duration-200 ${
                    exportOptions.exportType === "categories"
                      ? "scale-110"
                      : "group-hover:scale-110"
                  }`}
                />
                <span className="font-medium">Category Insights</span>
              </button>
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              📄 Export Format
            </label>
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() =>
                  setExportOptions((prev) => ({ ...prev, format: "csv" }))
                }
                className={`group p-4 border-2 rounded-xl text-center font-medium transition-all duration-200 ${
                  exportOptions.format === "csv"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md"
                    : "border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-gray-700"
                }`}
              >
                <div className="text-lg">CSV</div>
                <div className="text-xs text-gray-500 mt-1">
                  Excel Compatible
                </div>
              </button>
              <button
                onClick={() =>
                  setExportOptions((prev) => ({ ...prev, format: "json" }))
                }
                className={`group p-4 border-2 rounded-xl text-center font-medium transition-all duration-200 ${
                  exportOptions.format === "json"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md"
                    : "border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-gray-700"
                }`}
              >
                <div className="text-lg">JSON</div>
                <div className="text-xs text-gray-500 mt-1">
                  Structured Data
                </div>
              </button>
              <button
                onClick={() =>
                  setExportOptions((prev) => ({ ...prev, format: "pdf" }))
                }
                className={`group p-4 border-2 rounded-xl text-center font-medium transition-all duration-200 ${
                  exportOptions.format === "pdf"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md"
                    : "border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-gray-700"
                }`}
              >
                <div className="text-lg">PDF</div>
                <div className="text-xs text-gray-500 mt-1">Print Ready</div>
              </button>
            </div>
          </div>

          {/* Product-specific options */}
          {exportOptions.exportType === "products" && (
            <>
              {/* Filters */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  🔍 Filters
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2">
                      Category
                    </label>
                    <select
                      value={exportOptions.filters.category}
                      onChange={(e) =>
                        updateFilters("category", e.target.value)
                      }
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white transition-all duration-200"
                    >
                      <option value="all">All Categories</option>
                      {categories &&
                        categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2">
                      Stock Status
                    </label>
                    <select
                      value={exportOptions.filters.stockStatus}
                      onChange={(e) =>
                        updateFilters("stockStatus", e.target.value)
                      }
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white transition-all duration-200"
                    >
                      <option value="all">All Stock Levels</option>
                      <option value="low">Low Stock</option>
                      <option value="out">Out of Stock</option>
                      <option value="normal">Normal Stock</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2">
                      Expiry Status
                    </label>
                    <select
                      value={exportOptions.filters.expiryStatus}
                      onChange={(e) =>
                        updateFilters("expiryStatus", e.target.value)
                      }
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white transition-all duration-200"
                    >
                      <option value="all">All Products</option>
                      <option value="expired">Expired</option>
                      <option value="expiring">Expiring Soon (30 days)</option>
                      <option value="fresh">Fresh</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Column Selection */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  ✓ Columns to Export
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries({
                    name: "Generic Name",
                    brand: "Brand Name",
                    category: "Category",
                    dosageStrength: "Dosage Strength",
                    dosageForm: "Dosage Form",
                    drugClassification: "Drug Classification",
                    stock: "Stock Level",
                    price: "Price per Piece",
                    costPrice: "Cost Price",
                    marginPercentage: "Margin %",
                    expiry: "Expiry Date",
                    supplier: "Supplier",
                    batchNumber: "Batch Number",
                    unitConversion: "Unit Conversion",
                  }).map(([key, label]) => (
                    <label
                      key={key}
                      className="flex items-center space-x-2 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={exportOptions.columns[key]}
                        onChange={(e) => updateColumns(key, e.target.checked)}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <span className="text-sm text-gray-700 group-hover:text-emerald-600 transition-colors duration-200">
                        {label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Category-specific info */}
          {exportOptions.exportType === "categories" && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-5 rounded-xl border border-emerald-200">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Database className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-emerald-900 mb-2">
                    📊 Category Insights Export
                  </h4>
                  <p className="text-sm text-emerald-700 leading-relaxed">
                    This will export intelligent category insights including
                    total products, total value, low stock counts, auto-creation
                    status, and last update times for all categories in your
                    inventory.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer - Sticky */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-600 border border-transparent rounded-xl hover:from-emerald-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-md hover:shadow-lg transition-all duration-200"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Export Data</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
