import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import {
  X,
  Printer,
  Download,
  Mail,
  Receipt as ReceiptIcon,
  Calendar,
  User,
  UserCheck,
  CreditCard,
  Hash,
  AlertCircle,
  CheckCircle,
  Copy,
  Eye,
  EyeOff,
} from "lucide-react";
import { formatCurrency, formatDate } from "../../utils/formatting";
import ReceiptService from "../../services/domains/sales/receiptService";

function SimpleReceipt({ transaction, isOpen, onClose }) {
  const [receiptData, setReceiptData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [printOptions, setPrintOptions] = useState({
    format: "standard",
    copies: 1,
    includeLogo: true,
  });

  // Process transaction data when component opens
  const processTransactionData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🧾 [SimpleReceipt] Processing transaction:", transaction);
      console.log("🔍 [DEBUG] Customer ID in SimpleReceipt:", transaction.customer_id);
      console.log("🔍 [DEBUG] Discount data in SimpleReceipt transaction:", {
        discount_type: transaction.discount_type,
        discount_percentage: transaction.discount_percentage,
        discount_amount: transaction.discount_amount,
        pwd_senior_id: transaction.pwd_senior_id,
        pwd_senior_holder_name: transaction.pwd_senior_holder_name,
      });

      console.log("🔍 [DEBUG] Full transaction object keys:", Object.keys(transaction));
      console.log("🔍 [DEBUG] Transaction object:", transaction);

      // Validate transaction data
      if (!transaction) {
        throw new Error("No transaction data provided");
      }

      // Generate receipt data using ReceiptService
      const processedReceiptData = ReceiptService.generateReceiptData(
        transaction,
        {
          includeLogo: printOptions.includeLogo,
          format: printOptions.format,
        }
      );

      // Validate receipt data
      const validation =
        ReceiptService.validateReceiptData(processedReceiptData);
      if (!validation.valid) {
        throw new Error(
          `Invalid receipt data: ${validation.errors.join(", ")}`
        );
      }

      setReceiptData(processedReceiptData);
      console.log(
        "✅ [SimpleReceipt] Receipt data generated:",
        processedReceiptData
      );
      console.log("🔍 [DEBUG] Receipt PWD/Senior data:", {
        pwdSenior: processedReceiptData.pwdSenior,
        discount: processedReceiptData.financial?.discount,
      });
    } catch (err) {
      console.error("❌ [SimpleReceipt] Error processing transaction:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [transaction, printOptions.includeLogo, printOptions.format]);

  useEffect(() => {
    if (isOpen && transaction) {
      processTransactionData();
    }
  }, [isOpen, transaction, processTransactionData]);

  const handlePrint = async () => {
    if (!receiptData) return;

    try {
      setLoading(true);
      const result = ReceiptService.printReceipt(receiptData, printOptions);

      if (result.success) {
        console.log("🖨️ [SimpleReceipt] Print successful");
        // Store receipt for reprint capability
        await ReceiptService.storeReceipt(receiptData);
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error("❌ [SimpleReceipt] Print failed:", err);
      setError(`Print failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!receiptData) return;

    try {
      const htmlContent = ReceiptService.generateHTMLReceipt(
        receiptData,
        "email"
      );
      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `Receipt-${receiptData.header.receiptNumber}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log("📥 [SimpleReceipt] Receipt downloaded");
    } catch (err) {
      console.error("❌ [SimpleReceipt] Download failed:", err);
      setError(`Download failed: ${err.message}`);
    }
  };

  const handleEmailReceipt = () => {
    if (!receiptData) return;

    try {
      const emailData = ReceiptService.generateEmailReceipt(
        receiptData,
        receiptData.customer.email || "customer@example.com"
      );

      // In a real implementation, this would trigger email sending
      console.log("📧 [SimpleReceipt] Email data generated:", emailData);
      alert(
        "📧 Email receipt feature will be implemented with email service integration"
      );
    } catch (err) {
      console.error("❌ [SimpleReceipt] Email generation failed:", err);
      setError(`Email generation failed: ${err.message}`);
    }
  };

  const copyReceiptNumber = async () => {
    if (!receiptData?.header?.receiptNumber) return;

    try {
      await navigator.clipboard.writeText(receiptData.header.receiptNumber);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("❌ [SimpleReceipt] Copy failed:", err);
    }
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999]"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4 animate-in fade-in-0 zoom-in-95 duration-300">
          <div className="flex items-center justify-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-700">Generating receipt...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999]"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 animate-in fade-in-0 zoom-in-95 duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900">
                Receipt Error
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="flex space-x-3">
            <button
              onClick={processTransactionData}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!receiptData) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[95vh] overflow-hidden border border-gray-200 animate-in fade-in-0 zoom-in-95 duration-300">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <ReceiptIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Receipt Generated</h3>
                <p className="text-blue-100 text-sm">
                  {receiptData.header.name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Receipt Status */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-300" />
              <span className="text-sm font-medium">
                Transaction {receiptData.status.transactionStatus.toUpperCase()}
              </span>
              {receiptData.status.isEdited && (
                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-200 rounded text-xs font-medium">
                  MODIFIED
                </span>
              )}
            </div>

            {/* Receipt Number with Copy */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-blue-100">
                #{receiptData.header.receiptNumber}
              </span>
              <button
                onClick={copyReceiptNumber}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                title="Copy receipt number"
              >
                {copySuccess ? (
                  <CheckCircle className="h-4 w-4 text-green-300" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-b border-gray-200 p-4 bg-gray-50">
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={handlePrint}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Printer className="h-4 w-4" />
              <span>Print</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </button>

            <button
              onClick={handleEmailReceipt}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Mail className="h-4 w-4" />
              <span>Email</span>
            </button>

            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {showDetails ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              <span>{showDetails ? "Hide" : "Details"}</span>
            </button>
          </div>
        </div>

        {/* Receipt Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Company Header */}
          <div className="text-center mb-6 pb-4 border-b border-dashed border-gray-300">
            <div className="text-2xl mb-2">🏥</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {receiptData.header.name}
            </h2>
            <div className="text-sm text-gray-600 space-y-1">
              <p>{receiptData.header.address}</p>
              <p>{receiptData.header.city}</p>
              <p>
                Tel: {receiptData.header.phone} | {receiptData.header.email}
              </p>
              <p className="text-xs">
                License: {receiptData.header.license} | TIN:{" "}
                {receiptData.header.tin}
              </p>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">
                  {formatDate(receiptData.header.timestamp)}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Hash className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Transaction:</span>
                <span className="font-medium">
                  {receiptData.header.transactionId?.slice(-8) || "N/A"}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Cashier:</span>
                <span className="font-medium">
                  {typeof receiptData.header.cashier === 'string' 
                    ? receiptData.header.cashier 
                    : typeof receiptData.header.cashier === 'object' && receiptData.header.cashier
                      ? `${receiptData.header.cashier.first_name || ''} ${receiptData.header.cashier.last_name || ''}`.trim() || 'Unknown'
                      : 'Unknown'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <CreditCard className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Payment:</span>
                <span className="font-medium capitalize">
                  {receiptData.financial.paymentMethod}
                </span>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          {(receiptData.customer.name ||
            receiptData.customer.phone ||
            receiptData.customer.type ||
            receiptData.customer.email) && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <User className="h-4 w-4 mr-2" />
                Customer Information
              </h4>
              <div className="text-sm space-y-2">
                {/* Customer ID */}
                {receiptData.customer.id && (
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600">Customer ID:</span>
                    <span className="font-medium font-mono text-blue-600">
                      #{typeof receiptData.customer.id === 'string' ? receiptData.customer.id.slice(-8) : 'N/A'}
                    </span>
                  </div>
                )}
                
                {/* Customer Type Badge */}
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">Type:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    receiptData.customer.type === 'New Customer' 
                      ? 'bg-green-100 text-green-800' 
                      : receiptData.customer.type === 'Returning Customer'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {typeof receiptData.customer.type === 'string' ? receiptData.customer.type : 'Walk-in Customer'}
                  </span>
                </div>
                
                {receiptData.customer.name && typeof receiptData.customer.name === 'string' && (
                  <p>
                    <span className="text-gray-600">Name:</span>{" "}
                    <span className="font-medium">
                      {receiptData.customer.name}
                    </span>
                  </p>
                )}
                {receiptData.customer.phone && typeof receiptData.customer.phone === 'string' && (
                  <p>
                    <span className="text-gray-600">Phone:</span>{" "}
                    <span className="font-medium">
                      {receiptData.customer.phone}
                    </span>
                  </p>
                )}
                {receiptData.customer.email && typeof receiptData.customer.email === 'string' && (
                  <p>
                    <span className="text-gray-600">Email:</span>{" "}
                    <span className="font-medium">
                      {receiptData.customer.email}
                    </span>
                  </p>
                )}
                {receiptData.customer.address && typeof receiptData.customer.address === 'string' && (
                  <p>
                    <span className="text-gray-600">Address:</span>{" "}
                    <span className="font-medium">
                      {receiptData.customer.address}
                    </span>
                  </p>
                )}
              </div>

              {/* PWD/Senior Discount Information - Simple text format */}
              {((receiptData.pwdSenior && (receiptData.pwdSenior.isValid || receiptData.financial.discount.amount > 0)) || 
               (receiptData.financial.discount.amount > 0 && (receiptData.financial.discount.type === 'pwd' || receiptData.financial.discount.type === 'senior'))) && (
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <p className="text-sm">
                    <span className="text-gray-600">
                      {receiptData.financial.discount.type === 'pwd' ? 'PWD ID:' : 
                       receiptData.financial.discount.type === 'senior' ? 'Senior ID:' : 'Discount ID:'}
                    </span>{" "}
                    <span className="font-medium font-mono">
                      {receiptData.pwdSenior?.idNumber || 'Not Available'}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-600">
                      {receiptData.financial.discount.type === 'pwd' ? 'PWD Holder:' : 
                       receiptData.financial.discount.type === 'senior' ? 'Senior Holder:' : 'Holder:'}
                    </span>{" "}
                    <span className="font-medium">
                      {receiptData.pwdSenior?.holderName || 'Not Available'}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-600">Discount:</span>{" "}
                    <span className="font-medium text-green-600">
                      {receiptData.financial.discount.percentage}%
                    </span>
                  </p>
                </div>
              )}

              {/* Temporarily disabled DEBUG section */}
              {/* DEBUG: Show PWD/Senior data even if isValid is false */}
              {false && receiptData.pwdSenior && !receiptData.pwdSenior.isValid && (
                <div className="mt-4 pt-3 border-t border-red-200 bg-red-50 p-2">
                  <p className="text-xs text-red-600">DEBUG: PWD/Senior data exists but isValid=false</p>
                  <p className="text-xs">Type: {receiptData.pwdSenior.type}</p>
                  <p className="text-xs">ID: {receiptData.pwdSenior.idNumber}</p>
                  <p className="text-xs">Holder: {receiptData.pwdSenior.holderName}</p>
                  <p className="text-xs">IsValid: {receiptData.pwdSenior.isValid ? 'true' : 'false'}</p>
                </div>
              )}
            </div>
          )}

          {/* Items Table */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Items Purchased</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left py-2 font-medium text-gray-700">
                      Item
                    </th>
                    <th className="text-center py-2 font-medium text-gray-700 w-16">
                      Qty
                    </th>
                    <th className="text-right py-2 font-medium text-gray-700 w-20">
                      Price
                    </th>
                    <th className="text-right py-2 font-medium text-gray-700 w-24">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {receiptData.items.map((item, index) => (
                    <tr
                      key={`item-${index}-${item.id || 'unknown'}`}
                      className="border-b border-gray-100"
                    >
                      <td className="py-2">
                        <div>
                          <p className="font-medium text-gray-900">
                            {typeof item.name === 'string' ? item.name : 
                             typeof item.brand_name === 'string' ? item.brand_name :
                             typeof item.generic_name === 'string' ? item.generic_name : 'Unknown Product'}
                          </p>
                          {item.dosage_strength && typeof item.dosage_strength === 'string' && (
                            <p className="text-sm text-blue-600 font-medium">
                              {item.dosage_strength}
                            </p>
                          )}
                          {showDetails && (
                            <p className="text-xs text-gray-500">
                              {typeof item.category === 'string' ? item.category : 'General'} • {typeof item.unitType === 'string' ? item.unitType : 'piece'}
                              {item.brand_name && item.generic_name && 
                               typeof item.brand_name === 'string' && typeof item.generic_name === 'string' && (
                                <>
                                  <br />
                                  <span className="text-gray-400">
                                    Brand: {item.brand_name} | Generic: {item.generic_name}
                                  </span>
                                </>
                              )}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="text-center py-2 text-gray-700">
                        {item.quantity || 0}
                      </td>
                      <td className="text-right py-2 text-gray-700">
                        {formatCurrency(item.unitPrice || 0)}
                      </td>
                      <td className="text-right py-2 font-medium text-gray-900">
                        {formatCurrency(item.totalPrice || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Simplified Financial Summary: AMOUNT, DISCOUNT, VAT, TOTAL */}
          <div className="border-t border-dashed border-gray-300 pt-4 space-y-3">
            {/* Amount */}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 font-medium">AMOUNT:</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(receiptData.financial.vatDetails.itemsSubtotal)}
              </span>
            </div>

            {/* Discount */}
            {receiptData.financial.discount.amount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-red-600 font-medium">
                  DISCOUNT ({receiptData.financial.discount.percentage}%):
                </span>
                <span className="font-medium text-red-600">
                  -{formatCurrency(receiptData.financial.discount.amount)}
                </span>
              </div>
            )}

            {/* VAT */}
            <div className="flex justify-between text-sm">
              <span className="text-blue-600 font-medium">
                VAT ({receiptData.financial.vatDetails.vatRate}%):
              </span>
              <span className="font-medium text-blue-600">
                {formatCurrency(receiptData.financial.vatDetails.vatAmount)}
              </span>
            </div>

            {/* Total Amount */}
            <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-3">
              <span>TOTAL AMOUNT:</span>
              <span>{formatCurrency(receiptData.financial.total)}</span>
            </div>

            {/* Payment Information */}
            <div className="bg-gray-50 rounded-lg p-3 space-y-2 mt-4">
              <h6 className="font-medium text-gray-800 text-sm">Payment Information</h6>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Payment Method:</span>
                <span className="font-medium text-gray-900 uppercase">
                  {receiptData.financial.paymentMethod}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Amount Paid:</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(receiptData.financial.amountPaid)}
                </span>
              </div>
              {receiptData.financial.change > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Change:</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(receiptData.financial.change)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Transaction Modifications Notice */}
          {receiptData.status.isEdited && (
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">
                    Transaction Modified
                  </p>
                  <p className="text-yellow-700 mt-1">
                    <strong>Reason:</strong> {receiptData.status.editReason}
                  </p>
                  <p className="text-yellow-700">
                    <strong>Modified by:</strong> {
                      typeof receiptData.status.editedBy === 'string' 
                        ? receiptData.status.editedBy 
                        : typeof receiptData.status.editedBy === 'object' && receiptData.status.editedBy
                          ? `${receiptData.status.editedBy.first_name || ''} ${receiptData.status.editedBy.last_name || ''}`.trim() || 'Unknown'
                          : 'Unknown'
                    }{" "}
                    on {formatDate(receiptData.status.editedAt)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-center mt-6 pt-4 border-t border-dashed border-gray-300">
            <p className="font-medium text-gray-900 mb-2">
              Thank you for your business!
            </p>
            <p className="text-sm text-gray-600 mb-2">
              Your health is our priority
            </p>
            <p className="text-xs text-gray-500">
              This receipt serves as your official proof of purchase
            </p>
            {showDetails && (
              <div className="mt-3 text-xs text-gray-400 space-y-1">
                <p>Receipt generated on {formatDate(new Date())}</p>
                <p>Receipt ID: {receiptData.header.receiptNumber}</p>
              </div>
            )}
          </div>
        </div>

        {/* Print Options (if details shown) */}
        {showDetails && (
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <h5 className="font-medium text-gray-900 mb-3">Print Options</h5>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <label
                  htmlFor="format-select"
                  className="block text-gray-700 mb-1"
                >
                  Format
                </label>
                <select
                  id="format-select"
                  value={printOptions.format}
                  onChange={(e) =>
                    setPrintOptions((prev) => ({
                      ...prev,
                      format: e.target.value,
                    }))
                  }
                  className="w-full border border-gray-300 rounded px-2 py-1"
                >
                  <option value="standard">Standard</option>
                  <option value="thermal">Thermal</option>
                  <option value="email">Email</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="copies-input"
                  className="block text-gray-700 mb-1"
                >
                  Copies
                </label>
                <input
                  id="copies-input"
                  type="number"
                  min="1"
                  max="5"
                  value={printOptions.copies}
                  onChange={(e) =>
                    setPrintOptions((prev) => ({
                      ...prev,
                      copies: parseInt(e.target.value) || 1,
                    }))
                  }
                  className="w-full border border-gray-300 rounded px-2 py-1"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={printOptions.includeLogo}
                    onChange={(e) =>
                      setPrintOptions((prev) => ({
                        ...prev,
                        includeLogo: e.target.checked,
                      }))
                    }
                    className="rounded border-gray-300"
                  />
                  <span className="text-gray-700">Include Logo</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// PropTypes validation
SimpleReceipt.propTypes = {
  transaction: PropTypes.shape({
    id: PropTypes.string,
    created_at: PropTypes.string,
    total_amount: PropTypes.number,
    items: PropTypes.array,
    payment_method: PropTypes.string,
    amount_paid: PropTypes.number,
    change_amount: PropTypes.number,
    discount_amount: PropTypes.number,
    cashier_name: PropTypes.string,
    customer_name: PropTypes.string,
    customer_phone: PropTypes.string,
  }),
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

SimpleReceipt.defaultProps = {
  transaction: null,
};

export default SimpleReceipt;
