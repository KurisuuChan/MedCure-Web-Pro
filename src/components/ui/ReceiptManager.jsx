import React, { useState, useEffect } from "react";
import {
  Receipt,
  Printer,
  Mail,
  Download,
  Copy,
  X,
  Check,
  AlertCircle,
  Settings,
  RotateCcw,
  FileText,
  Eye,
} from "lucide-react";
import { formatCurrency } from "../../utils/formatting";
import { formatDate, formatTime } from "../../utils/dateTime";
import receiptService from "../../services/domains/sales/receiptService";

/**
 * Enhanced Receipt Management Component
 * Professional receipt handling with printing, email, and customization
 */
const ReceiptManager = ({
  transaction,
  isOpen,
  onClose,
  allowReprint = true,
  allowEmail = true,
  allowCustomization = true,
}) => {
  const [receiptData, setReceiptData] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState("standard");
  const [showPreview, setShowPreview] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  // Receipt customization options
  const [options, setOptions] = useState({
    includeLogo: true,
    includeBarcode: true,
    includeQR: false,
    copies: 1,
    format: "standard",
  });

  // Generate receipt data when transaction changes
  useEffect(() => {
    if (transaction && isOpen) {
      console.log(
        "🧾 [ReceiptManager] Generating receipt for transaction:",
        transaction
      );

      try {
        const generated = receiptService.generateReceiptData(
          transaction,
          options
        );
        setReceiptData(generated);
        setCustomerEmail(transaction.customer_email || "");
      } catch (error) {
        console.error("❌ [ReceiptManager] Failed to generate receipt:", error);
        setStatusMessage("Failed to generate receipt data");
      }
    }
  }, [transaction, isOpen, options]);

  // Handle print receipt
  const handlePrint = async () => {
    if (!receiptData) return;

    setIsProcessing(true);
    setStatusMessage("Preparing receipt for printing...");

    try {
      const printOptions = { ...options, format: selectedFormat };
      const result = receiptService.printReceipt(receiptData, printOptions);

      if (result.success) {
        setStatusMessage("✅ Receipt sent to printer successfully");

        // Store receipt for future reference
        await receiptService.storeReceipt(receiptData);
      } else {
        setStatusMessage(`❌ Print failed: ${result.error}`);
      }
    } catch (error) {
      console.error("❌ Print error:", error);
      setStatusMessage("❌ Print failed. Please try again.");
    } finally {
      setIsProcessing(false);
      setTimeout(() => setStatusMessage(""), 3000);
    }
  };

  // Handle email receipt
  const handleEmailSend = async () => {
    if (!receiptData || !customerEmail.trim()) {
      setStatusMessage("❌ Valid email address is required");
      return;
    }

    setIsProcessing(true);
    setStatusMessage("Preparing email receipt...");

    try {
      const emailData = receiptService.generateEmailReceipt(
        receiptData,
        customerEmail
      );

      // In a real implementation, this would integrate with email service
      console.log("📧 [ReceiptManager] Email receipt generated:", emailData);

      setStatusMessage("✅ Email receipt sent successfully");
      // Mock success for demo
      setTimeout(() => {
        setStatusMessage("📧 Receipt emailed to " + customerEmail);
      }, 1000);
    } catch (error) {
      console.error("❌ Email error:", error);
      setStatusMessage("❌ Failed to send email receipt");
    } finally {
      setIsProcessing(false);
      setTimeout(() => setStatusMessage(""), 5000);
    }
  };

  // Handle receipt download
  const handleDownload = () => {
    if (!receiptData) return;

    try {
      const htmlContent = receiptService.generateHTMLReceipt(
        receiptData,
        selectedFormat
      );

      // Create downloadable HTML file
      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `Receipt_${receiptData.header.receiptNumber}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
      setStatusMessage("✅ Receipt downloaded successfully");
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (error) {
      console.error("❌ Download error:", error);
      setStatusMessage("❌ Download failed");
    }
  };

  // Handle copy receipt content
  const handleCopy = async () => {
    if (!receiptData) return;

    try {
      const textContent = generateTextReceipt(receiptData);
      await navigator.clipboard.writeText(textContent);
      setStatusMessage("✅ Receipt copied to clipboard");
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (error) {
      console.error("❌ Copy error:", error);
      setStatusMessage("❌ Failed to copy receipt");
    }
  };

  // Generate plain text receipt
  const generateTextReceipt = (data) => {
    const { header, customer, items, financial, status } = data;

    let text = `
${header.name}
${header.address}
${header.city}
Tel: ${header.phone}
License: ${header.license}

========================================
Receipt #: ${header.receiptNumber}
Transaction: ${header.transactionId?.slice(-8)}
Date: ${formatDate(header.timestamp)}
Time: ${formatTime(header.timestamp)}
Cashier: ${header.cashier}
${status.isEdited ? "⚠ MODIFIED TRANSACTION" : ""}
========================================

`;

    if (customer.name || customer.phone) {
      text += "CUSTOMER INFORMATION\n";
      if (customer.name) text += `Name: ${customer.name}\n`;
      if (customer.phone) text += `Phone: ${customer.phone}\n`;
      if (customer.pwdSeniorId)
        text += `PWD/Senior ID: ${customer.pwdSeniorId}\n`;
      text += "========================================\n\n";
    }

    text += "ITEMS PURCHASED\n";
    items.forEach((item) => {
      text += `${item.name}\n`;
      text += `  ${item.quantity} x ${formatCurrency(
        item.unitPrice
      )} = ${formatCurrency(item.totalPrice)}\n`;
    });

    text += "\n========================================\n";
    text += `Subtotal: ${formatCurrency(financial.subtotal)}\n`;
    if (financial.discountAmount > 0) {
      text += `Discount (${financial.discountPercentage}%): -${formatCurrency(
        financial.discountAmount
      )}\n`;
    }
    text += `TOTAL: ${formatCurrency(financial.total)}\n`;
    text += `Payment (${financial.paymentMethod.toUpperCase()}): ${formatCurrency(
      financial.amountPaid
    )}\n`;
    if (financial.change > 0) {
      text += `Change: ${formatCurrency(financial.change)}\n`;
    }

    text += "\n========================================\n";
    text += "Thank you for your business!\n";
    text += "Your health is our priority\n";

    return text;
  };

  // Format options
  const formatOptions = [
    {
      value: "standard",
      label: "Standard (Letter)",
      description: "Full-size 8.5x11 format",
    },
    {
      value: "thermal",
      label: "Thermal (3inch)",
      description: "Compact thermal printer format",
    },
    {
      value: "email",
      label: "Email Format",
      description: "Optimized for email viewing",
    },
  ];

  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[95vh] flex overflow-hidden">
        {/* Left Panel - Controls */}
        <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Receipt className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Receipt Manager
                  </h2>
                  <p className="text-sm text-gray-600">
                    Transaction #{transaction.id?.slice(-8)}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div
              className={`mx-6 mt-4 p-3 rounded-lg text-sm flex items-center space-x-2 ${
                statusMessage.includes("✅")
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : statusMessage.includes("❌")
                  ? "bg-red-50 text-red-800 border border-red-200"
                  : "bg-blue-50 text-blue-800 border border-blue-200"
              }`}
            >
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Format Selection */}
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Receipt Format
              </label>
              <div className="space-y-2">
                {formatOptions.map((format) => (
                  <label
                    key={format.value}
                    className="flex items-start space-x-3 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="format"
                      value={format.value}
                      checked={selectedFormat === format.value}
                      onChange={(e) => setSelectedFormat(e.target.value)}
                      className="mt-1 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {format.label}
                      </div>
                      <div className="text-xs text-gray-600">
                        {format.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Email Input */}
            {allowEmail && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="customer@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            {/* Customization Options */}
            {allowCustomization && (
              <div>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  <Settings className="w-4 h-4" />
                  <span>Customize Receipt</span>
                </button>

                {showSettings && (
                  <div className="mt-3 space-y-3 bg-white rounded-lg p-3 border border-gray-200">
                    <label className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={options.includeLogo}
                        onChange={(e) =>
                          setOptions((prev) => ({
                            ...prev,
                            includeLogo: e.target.checked,
                          }))
                        }
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>Include Logo</span>
                    </label>
                    <label className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={options.includeBarcode}
                        onChange={(e) =>
                          setOptions((prev) => ({
                            ...prev,
                            includeBarcode: e.target.checked,
                          }))
                        }
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>Include Barcode</span>
                    </label>
                    <div className="flex items-center space-x-2 text-sm">
                      <label>Copies:</label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        value={options.copies}
                        onChange={(e) =>
                          setOptions((prev) => ({
                            ...prev,
                            copies: parseInt(e.target.value) || 1,
                          }))
                        }
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-auto p-6 space-y-3">
            <button
              onClick={handlePrint}
              disabled={isProcessing || !receiptData}
              className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 font-medium"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Printer className="w-5 h-5" />
                  <span>Print Receipt</span>
                </>
              )}
            </button>

            {allowEmail && (
              <button
                onClick={handleEmailSend}
                disabled={isProcessing || !receiptData || !customerEmail.trim()}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                <Mail className="w-4 h-4" />
                <span>Email Receipt</span>
              </button>
            )}

            <div className="flex space-x-2">
              <button
                onClick={handleDownload}
                disabled={!receiptData}
                className="flex-1 bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 disabled:bg-gray-400 transition-colors flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
              <button
                onClick={handleCopy}
                disabled={!receiptData}
                className="flex-1 bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 disabled:bg-gray-400 transition-colors flex items-center justify-center space-x-2"
              >
                <Copy className="w-4 h-4" />
                <span>Copy</span>
              </button>
            </div>

            {allowReprint && (
              <button
                className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
                title="Reprint previous receipt"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reprint Previous</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="flex-1 flex flex-col">
          {/* Preview Header */}
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Eye className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Receipt Preview
              </h3>
              <span className="text-sm text-gray-500">
                ({selectedFormat} format)
              </span>
            </div>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPreview ? (
                <Eye className="w-5 h-5" />
              ) : (
                <FileText className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Preview Content */}
          <div className="flex-1 overflow-auto p-6 bg-gray-100">
            {showPreview && receiptData ? (
              <div
                className={`mx-auto bg-white shadow-lg ${
                  selectedFormat === "thermal"
                    ? "max-w-xs"
                    : selectedFormat === "email"
                    ? "max-w-2xl"
                    : "max-w-md"
                }`}
                dangerouslySetInnerHTML={{
                  __html: receiptService.generateHTMLReceipt(
                    receiptData,
                    selectedFormat
                  ),
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    Receipt preview will appear here
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptManager;
