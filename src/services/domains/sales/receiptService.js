/**
 * Enhanced Receipt Management Service
 * Handles receipt generation, printing, email, and storage
 */

import { formatCurrency } from "../../../utils/formatting";
import { formatDate, formatTime } from "../../../utils/dateTime";

class ReceiptService {
  constructor() {
    this.companyInfo = {
      name: "MedCure Pro Pharmacy",
      address: "123 Healthcare Avenue",
      city: "Medical District, Metro Manila",
      phone: "+63 2 123 4567",
      email: "info@medcurepro.com",
      website: "www.medcurepro.com",
      license: "FDA LTO-001234",
      tin: "123-456-789-000",
    };
  }

  /**
   * Generate structured receipt data
   */
  generateReceiptData(transaction, options = {}) {
    console.log("🧾 [ReceiptService] Generating receipt data:", transaction);
    console.log("🔍 [DEBUG] Customer ID in transaction for receipt:", transaction.customer_id);
    console.log("🔍 [DEBUG] Discount data in transaction:", {
      discount_type: transaction.discount_type,
      discount_percentage: transaction.discount_percentage,
      discount_amount: transaction.discount_amount,
      pwd_senior_id: transaction.pwd_senior_id,
      pwd_senior_holder_name: transaction.pwd_senior_holder_name,
    });

    console.log("🔍 [DEBUG] PWD/Senior isValid calculation:", {
      pwd_senior_id: transaction.pwd_senior_id,
      discount_amount: transaction.discount_amount,
      discount_amount_greater_than_zero: transaction.discount_amount > 0,
      has_pwd_senior_id: !!transaction.pwd_senior_id,
      final_isValid: !!(transaction.pwd_senior_id && transaction.discount_amount > 0),
    });

    console.log("🔍 [ReceiptService] PWD/Senior holder name details:", {
      pwd_senior_holder_name: transaction.pwd_senior_holder_name,
      discount_holder_name: transaction.discount_holder_name,
      final_holder_name: transaction.pwd_senior_holder_name || transaction.discount_holder_name || 'Not Specified',
    });

    const receiptData = {
      // Header Information
      header: {
        ...this.companyInfo,
        receiptNumber: this.generateReceiptNumber(transaction),
        transactionId: transaction.id,
        timestamp: new Date(transaction.created_at || new Date()),
        cashier: this.extractCashierName(transaction),
      },

      // Customer Information
      customer: {
        id: transaction.customer_id || null,
        name: transaction.customer_name || null,
        phone: transaction.customer_phone || null,
        email: transaction.customer_email || null,
        address: transaction.customer_address || null,
        type: this.formatCustomerType(transaction.customer_type, transaction.customer_id),
      },

      // PWD/Senior Citizen Information (separate from regular customer)
      pwdSenior: {
        type: transaction.discount_type && (transaction.discount_type === 'pwd' || transaction.discount_type === 'senior') 
          ? transaction.discount_type : null,
        idNumber: transaction.pwd_senior_id || null,
        // PWD/Senior holder name (can be different from registered customer)
        holderName: transaction.pwd_senior_holder_name || transaction.discount_holder_name || 'Not Specified',
        isValid: !!(transaction.pwd_senior_id && transaction.discount_amount > 0),
      },

      // Transaction Items
      items: this.formatReceiptItems(transaction),

      // Enhanced Financial Summary with Proper VAT and Discount Breakdown
      financial: {
        // Base amounts
        itemsSubtotal: this.calculateSubtotal(transaction),
        
        // Discount breakdown
        discount: {
          type: transaction.discount_type || "none",
          percentage: transaction.discount_percentage || 0,
          amount: this.calculateCorrectDiscountAmount(transaction),
          description: this.getDiscountDescription(transaction.discount_type),
          isLegalDiscount: transaction.discount_type === 'pwd' || transaction.discount_type === 'senior',
        },
        
        // VAT calculations (after discount)
        vatDetails: this.calculateEnhancedVATDetails(transaction),
        
        // Final amounts
        subtotalAfterDiscount: (transaction.subtotal_before_discount || this.calculateSubtotal(transaction)) - (transaction.discount_amount || 0),
        total: this.calculateCorrectTotal(transaction),
        paymentMethod: transaction.payment_method || "cash",
        amountPaid: transaction.amount_paid || transaction.payment?.amount || transaction.total_amount,
        change: transaction.change_amount || transaction.payment?.change || 0,
      },

      // Status & Audit
      status: {
        transactionStatus: transaction.status || "completed",
        isEdited: transaction.is_edited || false,
        editReason: transaction.edit_reason || null,
        editedAt: transaction.edited_at || null,
        editedBy: transaction.edited_by || null,
      },

      // Print Options
      options: {
        includeLogo: options.includeLogo ?? true,
        includeBarcode: options.includeBarcode ?? true,
        includeQR: options.includeQR ?? false,
        format: options.format || "standard", // standard, thermal, email
        copies: options.copies || 1,
      },
    };

    console.log("🧾 [ReceiptService] Generated receipt data:", receiptData);
    return receiptData;
  }

  /**
   * Extract cashier name from transaction data
   */
  extractCashierName(transaction) {
    // Handle different cashier data formats
    if (transaction.cashier_name) {
      return transaction.cashier_name;
    }
    
    // Handle when cashier is a user object (from join)
    if (transaction.cashier && typeof transaction.cashier === 'object') {
      const cashier = transaction.cashier;
      if (cashier.first_name && cashier.last_name) {
        return `${cashier.first_name} ${cashier.last_name}`;
      }
      if (cashier.first_name) {
        return cashier.first_name;
      }
      if (cashier.email) {
        return cashier.email;
      }
    }
    
    // Handle when cashier is just a string
    if (typeof transaction.cashier === 'string') {
      return transaction.cashier;
    }
    
    // Handle edited_by user object (for edited transactions)
    if (transaction.edited_by && typeof transaction.edited_by === 'object') {
      const editor = transaction.edited_by;
      if (editor.first_name && editor.last_name) {
        return `${editor.first_name} ${editor.last_name} (Editor)`;
      }
    }
    
    // Fallback
    return "System";
  }

  /**
   * Generate receipt number
   */
  generateReceiptNumber(transaction) {
    const date = new Date(transaction.created_at || new Date());
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
    const timeStr = date.toTimeString().slice(0, 8).replace(/:/g, "");
    const txId = transaction.id?.slice(-6) || "000000";
    return `RC${dateStr}-${timeStr}-${txId}`;
  }

  /**
   * Format transaction items for receipt
   */
  formatReceiptItems(transaction) {
    const items = transaction.items || transaction.sale_items || [];

    return items.map((item) => {
      // Use new medicine structure: brand_name, generic_name, dosage_strength
      const productData = item.products || item;
      const brandName = productData.brand_name || productData.brandName || '';
      const genericName = productData.generic_name || productData.genericName || '';
      const dosageStrength = productData.dosage_strength || productData.dosageStrength || '';
      
      // Fallback to old structure for backward compatibility
      const fallbackName = productData.name || item.name || "Unknown Item";
      
      // Create display name: "Brand Name (Generic Name) - Dosage"
      let displayName = '';
      if (brandName && genericName) {
        displayName = `${brandName} (${genericName})`;
        if (dosageStrength) {
          displayName += ` - ${dosageStrength}`;
        }
      } else if (genericName) {
        displayName = genericName;
        if (dosageStrength) {
          displayName += ` - ${dosageStrength}`;
        }
      } else if (brandName) {
        displayName = brandName;
        if (dosageStrength) {
          displayName += ` - ${dosageStrength}`;
        }
      } else {
        displayName = fallbackName;
      }

      return {
        id: item.product_id || item.id,
        name: displayName, // Use the formatted display name
        brand_name: brandName,
        generic_name: genericName,
        dosage_strength: dosageStrength,
        quantity: item.quantity || 1,
        unitPrice: item.unit_price || item.pricePerUnit || 0,
        totalPrice: item.total_price || item.totalPrice || (item.unit_price * item.quantity) || 0,
        unitType: item.unit_type || "piece",
        category: productData.category || item.category || "General",
      };
    });
  }

  /**
   * Calculate subtotal from items
   */
  calculateSubtotal(transaction) {
    const items = this.formatReceiptItems(transaction);
    return items.reduce((sum, item) => sum + item.totalPrice, 0);
  }

  /**
   * Calculate the correct final total (subtotal - discount)
   * For PWD/Senior discounts, the total should be subtotal minus discount
   */
  calculateCorrectTotal(transaction) {
    const subtotal = transaction.subtotal_before_discount || this.calculateSubtotal(transaction);
    const discountAmount = this.calculateCorrectDiscountAmount(transaction);
    
    // Apply discount - pharmacy products are VAT EXEMPT
    const subtotalAfterDiscount = subtotal - discountAmount;
    const vatAmount = 0; // VAT EXEMPT for pharmacy products
    
    return subtotalAfterDiscount; // No VAT added
  }

  /**
   * Calculate the correct discount amount based on percentage and subtotal
   */
  calculateCorrectDiscountAmount(transaction) {
    const subtotal = transaction.subtotal_before_discount || this.calculateSubtotal(transaction);
    const discountPercentage = transaction.discount_percentage || 0;
    
    // If we have a transaction discount amount, verify it's correct
    const calculatedDiscount = subtotal * (discountPercentage / 100);
    const transactionDiscount = transaction.discount_amount || 0;
    
    console.log("🔍 [ReceiptService] Discount calculation check:", {
      subtotal: subtotal,
      discountPercentage: discountPercentage,
      calculatedDiscount: calculatedDiscount,
      transactionDiscount: transactionDiscount,
      usingCalculated: calculatedDiscount !== transactionDiscount
    });
    
    // Use calculated discount if transaction discount seems wrong or missing
    return calculatedDiscount;
  }

  /**
   * Generate HTML receipt for printing
   */
  generateHTMLReceipt(receiptData, format = "standard") {
    const { header, customer, pwdSenior, items, financial, status, options } = receiptData;

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Receipt - ${header.receiptNumber}</title>
        <style>
            ${this.getReceiptStyles(format)}
        </style>
    </head>
    <body>
        <div class="receipt ${format}">
            <!-- Header -->
            <div class="header">
                ${options.includeLogo ? '<div class="logo">🏥</div>' : ""}
                <h1>${header.name}</h1>
                <div class="company-info">
                    <p>${header.address}</p>
                    <p>${header.city}</p>
                    <p>Tel: ${header.phone} | Email: ${header.email}</p>
                    <p>FDA License: ${header.license} | TIN: ${header.tin}</p>
                </div>
            </div>

            <!-- Receipt Info -->
            <div class="receipt-info">
                <div class="receipt-number">Receipt #: ${
                  header.receiptNumber
                }</div>
                <div class="transaction-id">Transaction: ${
                  header.transactionId?.slice(-8) || "N/A"
                }</div>
                <div class="datetime">${formatDate(
                  header.timestamp
                )} ${formatTime(header.timestamp)}</div>
                <div class="cashier">Cashier: ${header.cashier}</div>
                ${
                  status.isEdited
                    ? `<div class="edited-notice">⚠ MODIFIED TRANSACTION</div>`
                    : ""
                }
            </div>

            <!-- Customer Information Section -->
            ${
              customer.name || customer.phone || customer.email
                ? `
            <div class="customer-info">
                <h3>Customer Information</h3>
                ${customer.id ? `<p><strong>Customer ID:</strong> ${customer.id.slice(-8)}</p>` : ""}
                ${customer.name ? `<p><strong>Name:</strong> ${customer.name}</p>` : ""}
                ${customer.phone ? `<p><strong>Phone:</strong> ${customer.phone}</p>` : ""}
                ${customer.email ? `<p><strong>Email:</strong> ${customer.email}</p>` : ""}
                ${customer.address ? `<p><strong>Address:</strong> ${customer.address}</p>` : ""}
                <p><strong>Type:</strong> ${customer.type || 'Walk-in Customer'}</p>
            </div>
            `
                : ""
            }

            <!-- Items -->
            <div class="items">
                <h3>Items Purchased</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Qty</th>
                            <th>Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items
                          .map(
                            (item) => `
                        <tr>
                            <td class="item-name">${item.name}</td>
                            <td class="quantity">${item.quantity}</td>
                            <td class="unit-price">${formatCurrency(
                              item.unitPrice
                            )}</td>
                            <td class="total-price">${formatCurrency(
                              item.totalPrice
                            )}</td>
                        </tr>
                        `
                          )
                          .join("")}
                    </tbody>
                </table>
            </div>

            <!-- Simplified Financial Summary: AMOUNT, DISCOUNT, VAT, TOTAL -->
            <div class="financial-summary">
                <!-- Amount (Gross) -->
                <div class="summary-line">
                    <span>AMOUNT:</span>
                    <span>${formatCurrency(financial.vatDetails.itemsSubtotal)}</span>
                </div>

                <!-- Discount (if applicable) -->
                ${
                  financial.discount.amount > 0
                    ? `
                <div class="summary-line discount">
                    <span>DISCOUNT (${financial.discount.percentage}%):</span>
                    <span>-${formatCurrency(financial.discount.amount)}</span>
                </div>
                `
                    : ""
                }

                <!-- VAT EXEMPT -->
                <div class="summary-line vat-exempt">
                    <span>VAT Status:</span>
                    <span>EXEMPT (Pharmacy Products)</span>
                </div>

                <!-- Total Amount -->
                <div class="summary-line total">
                    <span><strong>TOTAL AMOUNT:</strong></span>
                    <span><strong>${formatCurrency(financial.total)}</strong></span>
                </div>

                <!-- Payment Information -->
                <div class="payment-section">
                    <div class="summary-line">
                        <span>Payment Method:</span>
                        <span>${financial.paymentMethod.toUpperCase()}</span>
                    </div>
                    <div class="summary-line">
                        <span>Amount Paid:</span>
                        <span>${formatCurrency(financial.amountPaid)}</span>
                    </div>
                    <div class="summary-line change">
                        <span>Change:</span>
                        <span>${formatCurrency(financial.change)}</span>
                    </div>
                </div>
            </div>

            <!-- PWD/Senior Citizen Information (separate holder information) -->
            ${
              pwdSenior.type && pwdSenior.isValid
                ? `
            <div class="pwd-senior-info-section">
                <h3>${pwdSenior.type === 'pwd' ? 'PWD Discount Information' : 'Senior Citizen Discount Information'}</h3>
                <div class="pwd-senior-details">
                    <p><strong>ID Number:</strong> ${pwdSenior.idNumber}</p>
                    <p><strong>ID Holder Name:</strong> ${pwdSenior.holderName}</p>
                    <p><strong>Discount Applied:</strong> ${formatCurrency(financial.discount.amount)}</p>
                </div>
                <div class="legal-notice">
                    <p><strong>Legal Basis:</strong> ${pwdSenior.type === 'pwd' ? 'Republic Act No. 10754 (PWD Act)' : 'Republic Act No. 9994 (Senior Citizens Act)'}</p>
                    <p><em>20% discount applied as per Philippine law</em></p>
                </div>
            </div>
            `
                : ""
            }
            </div>

            <!-- Footer -->
            <div class="footer">
                <p class="thank-you">Thank you for your business!</p>
                <p class="tagline">Your health is our priority</p>
                ${
                  options.includeBarcode
                    ? `<div class="barcode">${header.receiptNumber}</div>`
                    : ""
                }
                <p class="notice">This receipt serves as your official proof of purchase</p>
                ${
                  status.isEdited
                    ? `
                <div class="edit-notice">
                    <p><strong>Transaction Modified:</strong></p>
                    <p>Reason: ${status.editReason}</p>
                    <p>Modified by: ${status.editedBy} on ${formatDate(
                        status.editedAt
                      )}</p>
                </div>
                `
                    : ""
                }
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * CSS styles for different receipt formats
   */
  getReceiptStyles(format) {
    const baseStyles = `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; }
        .receipt { max-width: 400px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
        .logo { font-size: 24px; margin-bottom: 5px; }
        .header h1 { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
        .company-info { font-size: 10px; line-height: 1.2; }
        .receipt-info { margin-bottom: 15px; font-size: 11px; }
        .receipt-number { font-weight: bold; }
        .edited-notice { background: #fffacd; padding: 3px; text-align: center; font-weight: bold; color: #ff6600; }
        
        /* Customer Information Styles */
        .customer-info { margin-bottom: 15px; font-size: 11px; border: 1px solid #ccc; padding: 8px; background: #f9f9f9; }
        .customer-info h3 { font-size: 12px; margin-bottom: 5px; border-bottom: 1px solid #ddd; padding-bottom: 3px; }
        
        /* PWD/Senior Information Styles (after financial summary) */
        .pwd-senior-info-section { margin-top: 15px; font-size: 11px; border: 2px solid #0066cc; padding: 10px; background: #e6f3ff; }
        .pwd-senior-info-section h3 { font-size: 12px; margin-bottom: 8px; color: #0066cc; font-weight: bold; text-align: center; }
        .pwd-senior-details { margin-bottom: 8px; }
        .pwd-senior-details p { margin-bottom: 3px; line-height: 1.3; }
        .legal-notice { margin-top: 8px; padding: 6px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 3px; }
        .legal-notice p { font-size: 9px; color: #856404; line-height: 1.2; margin-bottom: 2px; }
        
        /* Financial Summary Enhancements */
        .vat-breakdown { background: #f8f8f8; padding: 5px; margin: 5px 0; border-radius: 3px; border: 1px solid #ddd; }
        .summary-line.subtotal-after-discount { border-top: 1px dashed #666; padding-top: 3px; margin-top: 5px; font-weight: bold; }
        
        /* Breakdown Summary Table */
        .breakdown-summary { margin-top: 15px; padding: 10px; background: #f0f8ff; border: 2px solid #4169e1; border-radius: 5px; }
        .breakdown-summary h4 { font-size: 12px; margin-bottom: 8px; color: #4169e1; text-align: center; text-decoration: underline; }
        .breakdown-table { width: 100%; font-size: 10px; }
        .breakdown-table td { padding: 2px 5px; border-bottom: 1px dotted #ccc; }
        .breakdown-table .total-row { border-top: 2px solid #000; font-weight: bold; }
        .breakdown-table .total-row td { padding-top: 5px; }
        
        /* Items Table */
        .items h3 { font-size: 12px; margin-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; font-size: 10px; }
        th, td { padding: 3px; text-align: left; }
        th { border-bottom: 1px solid #000; font-weight: bold; }
        .item-name { max-width: 150px; word-wrap: break-word; }
        .quantity, .unit-price, .total-price { text-align: right; }
        
        /* Enhanced Financial Summary */
        .financial-summary { margin-top: 15px; border-top: 1px solid #000; padding-top: 10px; }
        .summary-line { display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 11px; }
        .summary-line.total { font-size: 13px; border-top: 1px solid #000; padding-top: 5px; margin-top: 5px; font-weight: bold; }
        .summary-line.subtotal-after-discount { border-top: 1px dashed #666; padding-top: 3px; margin-top: 5px; }
        
        /* Discount Section */
        .discount-section { background: #f0f8ff; padding: 5px; margin: 5px 0; border-radius: 3px; }
        .summary-line.discount { color: #009900; font-weight: bold; }
        .summary-line.discount-note { font-style: italic; color: #666; font-size: 9px; }
        
        /* VAT Section */
        .vat-section { background: #f8f8f8; padding: 5px; margin: 5px 0; border-radius: 3px; border: 1px solid #ddd; }
        .summary-line.vat-exempt { color: #cc6600; font-weight: bold; }
        .summary-line.vat-taxable { color: #0066cc; }
        .summary-line.vat-amount { color: #0066cc; font-weight: bold; }
        .summary-line.vat-net { color: #666; }
        
        /* Payment Section */
        .payment-section { background: #f9f9f9; padding: 5px; margin: 5px 0; border-radius: 3px; }
        .summary-line.change { color: #009900; font-weight: bold; }
        
        /* VAT Analysis */
        .vat-analysis { background: #fff9e6; padding: 8px; margin: 10px 0; border: 1px solid #ffcc00; border-radius: 3px; }
        .vat-analysis h4 { font-size: 11px; margin-bottom: 5px; color: #cc6600; text-decoration: underline; }
        .vat-analysis p { font-size: 9px; margin-bottom: 2px; line-height: 1.3; }
        
        /* Footer */
        .footer { margin-top: 20px; text-align: center; border-top: 1px solid #000; padding-top: 10px; }
        .thank-you { font-weight: bold; margin-bottom: 5px; }
        .tagline { font-style: italic; margin-bottom: 10px; }
        .barcode { font-family: 'Courier New', monospace; letter-spacing: 1px; margin: 10px 0; }
        .notice { font-size: 9px; margin-top: 10px; }
        .edit-notice { background: #fff0f0; border: 1px solid #ff0000; padding: 8px; margin-top: 10px; font-size: 9px; }
    `;

    const thermalStyles = `
        .receipt.thermal { max-width: 280px; }
        .receipt.thermal { font-size: 11px; }
        .receipt.thermal .header h1 { font-size: 14px; }
        .receipt.thermal table { font-size: 9px; }
    `;

    const emailStyles = `
        .receipt.email { max-width: 600px; padding: 30px; border: 1px solid #ddd; }
        .receipt.email { font-family: Arial, sans-serif; }
        .receipt.email .header { padding-bottom: 20px; }
        .receipt.email .header h1 { font-size: 24px; color: #2563eb; }
    `;

    let styles = baseStyles;
    if (format === "thermal") styles += thermalStyles;
    if (format === "email") styles += emailStyles;

    return styles;
  }

  /**
   * Print receipt
   */
  printReceipt(receiptData, options = {}) {
    console.log("🖨️ [ReceiptService] Printing receipt:", receiptData);

    try {
      const htmlContent = this.generateHTMLReceipt(
        receiptData,
        options.format || "standard"
      );

      // Create new window for printing
      const printWindow = window.open("", "_blank", "width=400,height=600");
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Print after content loads
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();

        // Close print window after printing (optional)
        setTimeout(() => {
          printWindow.close();
        }, 100);
      };

      return { success: true, message: "Receipt sent to printer" };
    } catch (error) {
      console.error("❌ [ReceiptService] Print failed:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate email receipt
   */
  generateEmailReceipt(receiptData, customerEmail) {
    console.log(
      "📧 [ReceiptService] Generating email receipt for:",
      customerEmail
    );

    const htmlContent = this.generateHTMLReceipt(receiptData, "email");

    const emailData = {
      to: customerEmail,
      subject: `Receipt #${receiptData.header.receiptNumber} - ${receiptData.header.name}`,
      html: htmlContent,
      attachments: [], // Could add PDF attachment here
    };

    // In a real implementation, this would send via email service
    console.log("📧 [ReceiptService] Email receipt data:", emailData);

    return emailData;
  }

  /**
   * Store receipt data for reprinting
   */
  async storeReceipt(receiptData) {
    try {
      const receiptRecord = {
        receipt_number: receiptData.header.receiptNumber,
        transaction_id: receiptData.header.transactionId,
        receipt_data: JSON.stringify(receiptData),
        created_at: new Date().toISOString(),
      };

      // In a real implementation, store in database
      console.log("💾 [ReceiptService] Storing receipt:", receiptRecord);

      return { success: true, receiptId: receiptRecord.receipt_number };
    } catch (error) {
      console.error("❌ [ReceiptService] Storage failed:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get receipt reprint data
   */
  async getReceiptForReprint(transactionId) {
    try {
      // In a real implementation, fetch from database
      console.log(
        "🔄 [ReceiptService] Fetching receipt for reprint:",
        transactionId
      );

      // Mock implementation - would fetch stored receipt data
      return { success: true, receiptData: null };
    } catch (error) {
      console.error("❌ [ReceiptService] Reprint fetch failed:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate receipt data
   */
  validateReceiptData(receiptData) {
    const required = ["header", "items", "financial"];
    const missing = required.filter((field) => !receiptData[field]);

    if (missing.length > 0) {
      return {
        valid: false,
        errors: [`Missing required fields: ${missing.join(", ")}`],
      };
    }

    if (!receiptData.items?.length) {
      return {
        valid: false,
        errors: ["Receipt must contain at least one item"],
      };
    }

    if (!receiptData.financial?.total || receiptData.financial.total <= 0) {
      return { valid: false, errors: ["Invalid total amount"] };
    }

    return { valid: true, errors: [] };
  }

  /**
   * Format customer type for display
   * @param {string} customerType - Raw customer type
   * @param {string} customerId - Customer ID (optional)
   * @returns {string} Formatted customer type
   */
  formatCustomerType(customerType, customerId = null) {
    // If customer has an ID, they are registered; otherwise, they're walk-in
    return customerId ? 'Registered Customer' : 'Walk-in Customer';
  }

  /**
   * Get discount description based on type
   */
  getDiscountDescription(discountType) {
    switch (discountType) {
      case 'pwd':
        return 'PWD Discount (RA 10754)';
      case 'senior':
        return 'Senior Citizen Discount (RA 9994)';
      case 'custom':
        return 'Custom Discount';
      case 'none':
      default:
        return 'No Discount Applied';
    }
  }

  /**
   * Calculate enhanced VAT details with proper PWD/Senior handling
   * @param {Object} transaction - Transaction data
   * @returns {Object} Enhanced VAT breakdown
   */
  calculateEnhancedVATDetails(transaction) {
    const VAT_RATE = 0.12; // 12% VAT in Philippines (not applicable to pharmacy products)
    const itemsSubtotal = this.calculateSubtotal(transaction);
    const discountAmount = this.calculateCorrectDiscountAmount(transaction);
    const discountType = transaction.discount_type || 'none';
    
    // Apply discount first
    const subtotalAfterDiscount = itemsSubtotal - discountAmount;
    
    // Pharmacy products are VAT EXEMPT
    const isLegalDiscount = discountType === 'pwd' || discountType === 'senior';
    
    // All pharmacy products are VAT exempt
    const vatExemptAmount = subtotalAfterDiscount;
    const taxableAmount = 0;
    const vatAmount = 0;
    
    return {
      // Basic VAT info
      vatRate: VAT_RATE * 100, // Convert to percentage (for reference only)
      isVatInclusive: false, // VAT is not applicable
      
      // Amount breakdown
      itemsSubtotal: itemsSubtotal,
      discountAmount: discountAmount,
      subtotalAfterDiscount: subtotalAfterDiscount,
      taxableAmount: taxableAmount,
      vatExemptAmount: vatExemptAmount,
      vatAmount: vatAmount,
      netAmount: subtotalAfterDiscount, // Net amount (no VAT)
      totalWithVat: subtotalAfterDiscount, // Final total (same as net - no VAT)
      
      // Legal compliance
      isLegalDiscount: isLegalDiscount,
      vatExemptReason: "Pharmacy Products - VAT Exempt",
    };
  }

  /**
   * Calculate comprehensive VAT details (legacy method for backward compatibility)
   * @param {Object} transaction - Transaction data
   * @returns {Object} VAT breakdown
   */
  calculateVATDetails(transaction) {
    return this.calculateEnhancedVATDetails(transaction);
  }
}

// Export singleton instance
export default new ReceiptService();
