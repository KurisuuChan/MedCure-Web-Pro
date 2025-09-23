/**
 * Simple Desktop Notification Service with Real-time Updates
 * Focused on essential pharmacy alerts with browser permissions
 */
import { supabase, isProductionSupabase } from "../../../config/supabase.js";

export class SimpleNotificationService {
  static NOTIFICATION_TYPES = {
    LOW_STOCK: "low_stock",
    EXPIRY_WARNING: "expiry_warning",
    SYSTEM_ALERT: "system_alert",
    SALE_COMPLETE: "sale_complete",
  };

  // Track what we've already notified to avoid spam
  static notifiedProducts = new Set();
  static lastCheckTime = null;
  static realtimeSubscription = null;

  // Check if browser supports notifications
  static isSupported() {
    return "Notification" in window;
  }

  // Get current permission status
  static getPermissionStatus() {
    if (!this.isSupported()) {
      return "unsupported";
    }
    return Notification.permission;
  }

  // Request notification permission
  static async requestPermission() {
    if (!this.isSupported()) {
      throw new Error("Notifications not supported in this browser");
    }

    if (Notification.permission === "granted") {
      return "granted";
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  // Show a desktop notification
  static showNotification(title, options = {}) {
    if (!this.isSupported() || Notification.permission !== "granted") {
      console.warn("Cannot show notification: permission not granted");
      return null;
    }

    const defaultOptions = {
      icon: "/vite.svg",
      badge: "/vite.svg",
      requireInteraction: false,
      silent: false,
      ...options,
    };

    return new Notification(title, defaultOptions);
  }

  // Show low stock alert
  static showLowStockAlert(productName, currentStock) {
    const notificationKey = `low_stock_${productName}`;

    // Don't spam notifications for the same product
    if (this.notifiedProducts.has(notificationKey)) {
      return null;
    }

    this.notifiedProducts.add(notificationKey);

    // Clear the notification flag after 1 hour
    setTimeout(() => {
      this.notifiedProducts.delete(notificationKey);
    }, 60 * 60 * 1000);

    return this.showNotification("⚠️ Low Stock Alert", {
      body: `${productName} is running low (${currentStock} pieces remaining)`,
      icon: "/vite.svg",
      tag: "low-stock",
      requireInteraction: true,
      data: {
        type: this.NOTIFICATION_TYPES.LOW_STOCK,
        productName,
        currentStock,
      },
    });
  }

  // Show expiry warning
  static showExpiryWarning(productName, expiryDate) {
    const daysUntilExpiry = Math.ceil(
      (new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
    );
    const notificationKey = `expiry_${productName}_${expiryDate}`;

    // Don't spam notifications for the same product expiry
    if (this.notifiedProducts.has(notificationKey)) {
      return null;
    }

    this.notifiedProducts.add(notificationKey);

    return this.showNotification("📅 Expiry Warning", {
      body: `${productName} expires in ${daysUntilExpiry} days (${expiryDate})`,
      icon: "/vite.svg",
      tag: "expiry-warning",
      requireInteraction: true,
      data: {
        type: this.NOTIFICATION_TYPES.EXPIRY_WARNING,
        productName,
        expiryDate,
      },
    });
  }

  // Show sale completion notification
  static showSaleComplete(totalAmount, itemCount) {
    return this.showNotification("✅ Sale Completed", {
      body: `Sale of ${itemCount} items for ₱${totalAmount.toFixed(
        2
      )} completed successfully`,
      icon: "/vite.svg",
      tag: "sale-complete",
      requireInteraction: false,
      data: {
        type: this.NOTIFICATION_TYPES.SALE_COMPLETE,
        totalAmount,
        itemCount,
      },
    });
  }

  // Show transaction success notification (more general than sales)
  static showTransactionSuccess(type, details = {}) {
    const messages = {
      sale: `Sale completed successfully! Total: ₱${details.amount?.toFixed(2) || '0.00'}`,
      inventory_update: `Inventory updated successfully! ${details.productName || 'Product'} stock updated.`,
      product_added: `Product added successfully! ${details.productName || 'New product'} is now in inventory.`,
      stock_adjustment: `Stock adjustment completed! ${details.productName || 'Product'} quantity updated.`,
      reorder: `Reorder placed successfully! ${details.productName || 'Products'} ordered from supplier.`,
      general: details.message || 'Transaction completed successfully!'
    };

    const title = type === 'sale' ? '💰 Sale Success' : 
                  type === 'inventory_update' ? '📦 Inventory Updated' :
                  type === 'product_added' ? '➕ Product Added' :
                  type === 'stock_adjustment' ? '🔄 Stock Adjusted' :
                  type === 'reorder' ? '🛒 Reorder Placed' :
                  '✅ Success';

    return this.showNotification(title, {
      body: messages[type] || messages.general,
      icon: "/vite.svg",
      tag: `transaction-${type}`,
      requireInteraction: false,
      data: {
        type: this.NOTIFICATION_TYPES.SALE_COMPLETE, // Reuse same type for now
        transactionType: type,
        ...details
      },
    });
  }

  // Add transaction notification to session storage (for dropdown display)
  static addTransactionNotification(type, details = {}) {
    try {
      // Import the helper function
      if (typeof window !== 'undefined' && window.addTransactionNotification) {
        return window.addTransactionNotification(type, details);
      }
      
      // Fallback - add directly to session storage
      const transaction = {
        id: Date.now().toString(),
        type,
        timestamp: Date.now(),
        ...details
      };
      
      const existingTransactions = JSON.parse(sessionStorage.getItem('recent_transactions') || '[]');
      const updatedTransactions = [transaction, ...existingTransactions].slice(0, 10);
      sessionStorage.setItem('recent_transactions', JSON.stringify(updatedTransactions));
      
      console.log('✅ [SimpleNotificationService] Added transaction notification:', transaction);
      return transaction;
    } catch (error) {
      console.error('❌ [SimpleNotificationService] Error adding transaction notification:', error);
      return null;
    }
  }

  // Show system alert
  static showSystemAlert(message, isError = false) {
    return this.showNotification(
      isError ? "❌ System Error" : "ℹ️ System Alert",
      {
        body: message,
        icon: "/vite.svg",
        tag: "system-alert",
        requireInteraction: isError,
        data: { type: this.NOTIFICATION_TYPES.SYSTEM_ALERT, isError },
      }
    );
  }

  // Check for low stock products and show alerts
  static async checkAndNotifyLowStock() {
    try {
      const { data: lowStockProducts, error } = await supabase
        .from("products")
        .select("name, stock_in_pieces")
        .lte("stock_in_pieces", 10)
        .gt("stock_in_pieces", 0);

      if (error) throw error;

      lowStockProducts.forEach((product) => {
        this.showLowStockAlert(product.name, product.stock_in_pieces);
      });

      return lowStockProducts.length;
    } catch (error) {
      console.error("Error checking low stock:", error);
      this.showSystemAlert("Failed to check stock levels", true);
      return 0;
    }
  }

  // Check for expiring products and show warnings
  static async checkAndNotifyExpiring() {
    try {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const { data: expiringProducts, error } = await supabase
        .from("products")
        .select("name, expiry_date")
        .not("expiry_date", "is", null)
        .lte("expiry_date", thirtyDaysFromNow.toISOString().split("T")[0])
        .gt("stock_in_pieces", 0);

      if (error) throw error;

      expiringProducts.forEach((product) => {
        this.showExpiryWarning(product.name, product.expiry_date);
      });

      return expiringProducts.length;
    } catch (error) {
      console.error("Error checking expiring products:", error);
      this.showSystemAlert("Failed to check product expiry dates", true);
      return 0;
    }
  }

  // Start real-time monitoring for stock changes
  static async startRealtimeMonitoring() {
    if (this.getPermissionStatus() !== "granted") {
      console.log("Notifications not enabled, skipping real-time monitoring");
      return;
    }

    // For development mode, provide alternative monitoring
    if (!isProductionSupabase) {
      console.log("🔕 Real-time monitoring disabled in development mode");
      console.log("💡 Tip: Use 'Check Low Stock' button in debugger to manually trigger notifications");
      return;
    }

    try {
      // Stop existing subscription if any
      this.stopRealtimeMonitoring();

      console.log("🔄 Starting real-time notification monitoring...");

      // Subscribe to stock movements table to catch real-time changes
      this.realtimeSubscription = supabase
        .channel("stock-notifications")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "stock_movements",
          },
          async (payload) => {
            console.log("📦 Stock movement detected:", payload.new);

            // Check if this movement resulted in low stock
            if (
              payload.new.movement_type === "sale" ||
              payload.new.movement_type === "adjustment"
            ) {
              await this.checkSpecificProductStock(payload.new.product_id);
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "products",
            filter: "stock_in_pieces=lte.10",
          },
          async (payload) => {
            console.log("⚠️ Low stock product updated:", payload.new);

            if (
              payload.new.stock_in_pieces <= 10 &&
              payload.new.stock_in_pieces > 0
            ) {
              this.showLowStockAlert(
                payload.new.name,
                payload.new.stock_in_pieces
              );
            }
          }
        )
        .subscribe((status) => {
          console.log("Real-time subscription status:", status);
        });
    } catch (error) {
      console.error("Error starting real-time monitoring:", error);
      this.showSystemAlert("Failed to start real-time monitoring", true);
    }
  }

  // Stop real-time monitoring
  static stopRealtimeMonitoring() {
    if (this.realtimeSubscription) {
      console.log("🔇 Stopping real-time notification monitoring...");
      this.realtimeSubscription.unsubscribe();
      this.realtimeSubscription = null;
    }
  }

  // Check specific product stock level
  static async checkSpecificProductStock(productId) {
    try {
      const { data: product, error } = await supabase
        .from("products")
        .select("name, stock_in_pieces")
        .eq("id", productId)
        .single();

      if (error) throw error;

      if (product.stock_in_pieces <= 10 && product.stock_in_pieces > 0) {
        this.showLowStockAlert(product.name, product.stock_in_pieces);
      }
    } catch (error) {
      console.error("Error checking specific product stock:", error);
    }
  }

  // Run daily checks (call this when app starts or user logs in)
  static async runDailyChecks() {
    if (this.getPermissionStatus() !== "granted") {
      console.log("Notifications not enabled, skipping daily checks");
      return;
    }

    console.log("🔍 Running daily notification checks...");

    const lowStockCount = await this.checkAndNotifyLowStock();
    const expiringCount = await this.checkAndNotifyExpiring();

    // Show summary if there are issues
    if (lowStockCount > 0 || expiringCount > 0) {
      this.showSystemAlert(
        `Daily Check: ${lowStockCount} low stock items, ${expiringCount} expiring products`
      );
    } else {
      console.log("✅ Daily checks completed - no critical issues found");
    }

    // Start real-time monitoring after daily checks
    await this.startRealtimeMonitoring();
  }

  // Force check for notifications (useful for development/testing)
  static async forceCheckNotifications() {
    console.log("🔍 Force checking for notifications...");
    
    if (this.getPermissionStatus() !== "granted") {
      console.warn("Notifications not enabled, please grant permissions first");
      return { error: "Permissions not granted" };
    }

    try {
      // Clear spam protection temporarily for testing
      const originalNotified = new Set(this.notifiedProducts);
      this.notifiedProducts.clear();

      const lowStockCount = await this.checkAndNotifyLowStock();
      const expiringCount = await this.checkAndNotifyExpiring();

      // Show summary
      if (lowStockCount > 0 || expiringCount > 0) {
        this.showSystemAlert(
          `Manual Check: Found ${lowStockCount} low stock items, ${expiringCount} expiring products`
        );
      } else {
        this.showSystemAlert("Manual Check: No critical issues found");
      }

      // Restore original spam protection after 5 seconds
      setTimeout(() => {
        originalNotified.forEach(key => this.notifiedProducts.add(key));
      }, 5000);

      return { lowStockCount, expiringCount };
    } catch (error) {
      console.error("Error in force check:", error);
      this.showSystemAlert("Failed to check notifications", true);
      return { error: error.message };
    }
  }

  // Initialize the notification system
  static async initialize() {
    if (this.getPermissionStatus() === "granted") {
      await this.runDailyChecks();
    }
  }

  // Clean up when app closes
  static cleanup() {
    this.stopRealtimeMonitoring();
    this.notifiedProducts.clear();
  }
}
