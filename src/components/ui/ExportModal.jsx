import React, { useState } from "react";
import { X, Download, FileText, Database } from "lucide-react";
import { UnifiedCategoryService } from "../../services/domains/inventory/unifiedCategoryService";
import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';

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
            downloadPDF(categoryData, "category_insights", "Category Insights Report");
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

          if (exportOptions.columns.name) row["Generic Name"] = product.generic_name || 'Unknown Product';
          if (exportOptions.columns.brand) row["Brand Name"] = product.brand_name || '';
          if (exportOptions.columns.category)
            row["Category"] = product.category;
          if (exportOptions.columns.dosageStrength)
            row["Dosage Strength"] = product.dosage_strength || '';
          if (exportOptions.columns.dosageForm)
            row["Dosage Form"] = product.dosage_form || '';
          if (exportOptions.columns.drugClassification)
            row["Drug Classification"] = product.drug_classification || '';
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

          return row;
        });

        // Generate and download file
        if (exportOptions.format === "csv") {
          downloadCSV(dataToExport, "medicine_inventory_export");
        } else if (exportOptions.format === "json") {
          downloadJSON(dataToExport, "medicine_inventory_export");
        } else if (exportOptions.format === "pdf") {
          downloadPDF(dataToExport, "medicine_inventory_export", "Medicine Inventory Report");
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
    if (filename.includes('inventory') || filename.includes('medicine')) {
      processedData = data.map(item => ({
        ...item,
        batch_number: item.batch_number || 'N/A'
      }));
    }

    // Define proper column order for medicine/inventory exports
    let orderedHeaders = Object.keys(processedData[0]);

    const csvContent = [
      orderedHeaders.join(","),
      ...processedData.map((row) =>
        orderedHeaders.map((header) => {
          let value = row[header] || "";
          // Handle values that contain commas, quotes, or newlines
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            value = `"${value.replace(/"/g, '""')}"`;
          } else {
            value = `"${value}"`;
          }
          return value;
        }).join(",")
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

  const downloadPDF = (data, filename = "export", title = "Medicine Inventory Export") => {
    console.log("📄 Generating PDF with", data.length, "items");
    
    if (data.length === 0) {
      console.warn("⚠️ No data to export");
      alert("No data to export. Please check your filters.");
      return;
    }

    try {
      // Create new PDF document
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4"
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // ============================================
      // HEADER - Simple Modern Design
      // ============================================
      
      // Header Background
      doc.setFillColor(16, 185, 129); // Emerald
      doc.rect(0, 0, pageWidth, 28, 'F');
      
      // Logo Box
      doc.setFillColor(255, 255, 255);
      doc.rect(10, 5, 14, 14, 'F');
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(16, 185, 129);
      doc.text("MC", 17, 13.5, { align: "center" });

      // Company Info - Left side
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text("MEDCURE PHARMACY", 28, 11);
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(title || "Medicine Inventory Export", 28, 16);
      
      doc.setFontSize(7);
      doc.setTextColor(240, 253, 244); // Light emerald
      doc.text("Professional Pharmacy Management System", 28, 20);

      // Export Info - Right side
      const currentDate = new Date();
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text(`Export Date: ${currentDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}`, pageWidth - 14, 13, { align: 'right' });
      doc.text(`Time: ${currentDate.toLocaleTimeString('en-US')}`, pageWidth - 14, 18, { align: 'right' });
      doc.text(`Total Records: ${data.length}`, pageWidth - 14, 23, { align: 'right' });

      // ============================================
      // SUMMARY SECTION - Key Metrics
      // ============================================
      
      let yPos = 45;

      // Calculate summary statistics
      const summary = {
        totalProducts: data.length,
        totalValue: 0,
        lowStock: 0,
        outOfStock: 0
      };

      data.forEach(item => {
        const stock = parseInt(item['Stock (Pieces)'] || 0);
        const price = parseFloat(item['Price per Piece'] || 0);
        summary.totalValue += stock * price;
        
        if (stock === 0) summary.outOfStock++;
        else if (stock <= 10) summary.lowStock++;
      });

      // Summary boxes
      const boxWidth = (pageWidth - 28 - 15) / 4; // 4 boxes with spacing
      const boxHeight = 18;
      const boxY = yPos;
      
      const summaryData = [
        { label: 'Total Products', value: summary.totalProducts, color: [59, 130, 246] }, // Blue
        { label: 'Total Value', value: `₱${summary.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: [16, 185, 129] }, // Emerald
        { label: 'Low Stock', value: summary.lowStock, color: [251, 146, 60] }, // Orange
        { label: 'Out of Stock', value: summary.outOfStock, color: [239, 68, 68] } // Red
      ];

      summaryData.forEach((item, index) => {
        const xPos = 14 + (boxWidth + 5) * index;
        
        // Box background
        doc.setFillColor(item.color[0], item.color[1], item.color[2]);
        doc.roundedRect(xPos, boxY, boxWidth, boxHeight, 2, 2, 'F');
        
        // Label
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.setFont(undefined, 'normal');
        doc.text(item.label, xPos + boxWidth / 2, boxY + 6, { align: 'center' });
        
        // Value
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(String(item.value), xPos + boxWidth / 2, boxY + 14, { align: 'center' });
      });

      yPos += boxHeight + 10;

      // ============================================
      // DATA TABLE - Modern styling
      // ============================================
      
      // Prepare table columns and rows
      const columns = Object.keys(data[0]).map(key => ({
        header: key,
        dataKey: key
      }));

      // Add table using the imported autoTable function
      autoTable(doc, {
        startY: yPos,
        columns: columns,
        body: data,
        theme: 'striped',
        headStyles: {
          fillColor: [15, 23, 42], // Slate-900
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
          halign: 'center',
          valign: 'middle',
          cellPadding: 3
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [31, 41, 55], // Gray-800
          cellPadding: 2.5
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252] // Slate-50
        },
        columnStyles: {
          0: { fontStyle: 'bold', textColor: [16, 185, 129] }, // First column (Generic Name)
          'Stock (Pieces)': { halign: 'center' },
          'Price per Piece': { halign: 'right' },
          'Expiry Date': { halign: 'center' }
        },
        margin: { top: yPos, left: 14, right: 14, bottom: 25 },
        styles: {
          cellPadding: 2,
          overflow: 'linebreak',
          cellWidth: 'wrap',
          lineColor: [226, 232, 240], // Slate-200
          lineWidth: 0.1
        },
        // Highlight critical rows
        didParseCell: function(data) {
          if (data.column.dataKey === 'Stock (Pieces)' && data.cell.section === 'body') {
            const stock = parseInt(data.cell.raw);
            if (stock === 0) {
              data.cell.styles.textColor = [239, 68, 68]; // Red for out of stock
              data.cell.styles.fontStyle = 'bold';
            } else if (stock <= 10) {
              data.cell.styles.textColor = [251, 146, 60]; // Orange for low stock
              data.cell.styles.fontStyle = 'bold';
            }
          }
          
          // Highlight expired dates
          if (data.column.dataKey === 'Expiry Date' && data.cell.section === 'body') {
            const expiryDate = new Date(data.cell.raw);
            const today = new Date();
            if (expiryDate < today) {
              data.cell.styles.textColor = [239, 68, 68]; // Red
              data.cell.styles.fontStyle = 'bold';
            }
          }
        }
      });

      // ============================================
      // FOOTER - Professional with page numbers
      // ============================================
      
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        // Footer background
        doc.setFillColor(241, 245, 249); // Slate-100
        doc.rect(0, pageHeight - 20, pageWidth, 20, 'F');
        
        // Footer line
        doc.setDrawColor(203, 213, 225); // Slate-300
        doc.setLineWidth(0.5);
        doc.line(14, pageHeight - 20, pageWidth - 14, pageHeight - 20);
        
        // Left side - Company info
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105); // Slate-600
        doc.setFont(undefined, 'normal');
        doc.text('MedCure Pharmacy Management System', 14, pageHeight - 12);
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184); // Slate-400
        doc.text('Professional Inventory Management Solution', 14, pageHeight - 8);
        
        // Center - Document security note
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139); // Slate-500
        doc.text('CONFIDENTIAL - For Internal Use Only', pageWidth / 2, pageHeight - 10, { align: 'center' });
        
        // Right side - Page numbers
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105); // Slate-600
        doc.setFont(undefined, 'bold');
        doc.text(
          `Page ${i} of ${pageCount}`,
          pageWidth - 14,
          pageHeight - 10,
          { align: 'right' }
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
                <FileText className={`w-5 h-5 transition-transform duration-200 ${
                  exportOptions.exportType === "products" ? "scale-110" : "group-hover:scale-110"
                }`} />
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
                <Database className={`w-5 h-5 transition-transform duration-200 ${
                  exportOptions.exportType === "categories" ? "scale-110" : "group-hover:scale-110"
                }`} />
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
                <div className="text-xs text-gray-500 mt-1">Excel Compatible</div>
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
                <div className="text-xs text-gray-500 mt-1">Structured Data</div>
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
                    <label key={key} className="flex items-center space-x-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={exportOptions.columns[key]}
                        onChange={(e) => updateColumns(key, e.target.checked)}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <span className="text-sm text-gray-700 group-hover:text-emerald-600 transition-colors duration-200">{label}</span>
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
                    This will export intelligent category insights including total
                    products, total value, low stock counts, auto-creation status,
                    and last update times for all categories in your inventory.
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
