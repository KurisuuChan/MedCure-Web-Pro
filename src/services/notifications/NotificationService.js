/**
 * ============================================================================
 * NotificationService - Unified, Database-First Notification System
 * ============================================================================
 *
 * A production-ready notification service that:
 * - Stores all notifications in Supabase database (single source of truth)
 * - Provides real-time updates via Supabase subscriptions
 * - Sends email alerts for critical notifications (priority 1-2)
 * - Prevents duplicate notifications with smart deduplication
 * - Includes automated health checks for low stock and expiring products
 *
 * Architecture:
 * - Database-first: All notifications persist in user_notifications table
 * - Real-time sync: Supabase channels automatically update UI
 * - Email integration: Critical alerts sent via EmailService
 * - Type-safe: Clear notification types and priorities
 *
 * @version 1.0.0
 * @date 2025-10-05
 */

import { supabase } from "../../config/supabase.js";
import emailService from "./EmailService.js";
import { logger } from "../../utils/logger.js";

/**
 * Notification priority levels
 * Lower numbers = higher priority = more urgent
 */
export const NOTIFICATION_PRIORITY = {
  CRITICAL: 1, // Urgent issues, sends email immediately
  HIGH: 2, // Important alerts, sends email
  MEDIUM: 3, // Standard notifications, in-app only
  LOW: 4, // Informational, in-app only
  INFO: 5, // General information, in-app only
};

/**
 * Notification categories for filtering and organization
 */
export const NOTIFICATION_CATEGORY = {
  INVENTORY: "inventory", // Stock levels, product management
  EXPIRY: "expiry", // Product expiration warnings
  SALES: "sales", // Sales transactions, revenue
  SYSTEM: "system", // System errors, maintenance
  GENERAL: "general", // Miscellaneous notifications
};

/**
 * Notification types (affects icon and styling in UI)
 */
export const NOTIFICATION_TYPE = {
  ERROR: "error", // Red color, alert icon
  WARNING: "warning", // Yellow color, warning icon
  SUCCESS: "success", // Green color, checkmark icon
  INFO: "info", // Blue color, info icon
};

/**
 * Main NotificationService class
 */
class NotificationService {
  constructor() {
    this.emailService = emailService; // Use the singleton instance
    this.realtimeSubscription = null;
    this.isInitialized = false;
    this.lastHealthCheckRun = null; // ✅ Local debounce timestamp
    this.healthCheckDebounceMs = 15 * 60 * 1000; // 15 minutes in milliseconds (default)
    this.lastLowStockCheck = null; // Track last low stock check
    this.lastExpiringCheck = null; // Track last expiring check
  }

  /**
   * Get user notification settings from localStorage
   * @private
   */
  getUserNotificationSettings() {
    try {
      const settings = localStorage.getItem("medcure-notification-settings");
      if (settings) {
        return JSON.parse(settings);
      }
    } catch (err) {
      logger.warn("[NotificationService] Failed to load user settings:", err);
    }

    // Default settings
    return {
      lowStockCheckInterval: 60, // 1 hour default
      expiringCheckInterval: 360, // 6 hours default
      emailAlertsEnabled: false,
    };
  }

  /**
   * Initialize the notification service
   * Call this when the app starts
   */
  async initialize() {
    if (this.isInitialized) {
      logger.info("[NotificationService] Already initialized");
      return;
    }

    try {
      logger.info("[NotificationService] Initializing...");

      // Verify database connection
      const { error } = await supabase
        .from("user_notifications")
        .select("count")
        .limit(1);
      if (error) {
        throw new Error(`Database connection failed: ${error.message}`);
      }

      this.isInitialized = true;
      logger.success("[NotificationService] Initialized successfully");

      return true;
    } catch (error) {
      logger.error("[NotificationService] Failed to initialize:", error);
      throw error;
    }
  }

  // ============================================================================
  // CORE: Create Notification
  // ============================================================================

  /**
   * Create a new notification
   *
   * @param {Object} params - Notification parameters
   * @param {string} params.userId - User ID to send notification to
   * @param {string} params.title - Notification title (max 200 chars)
   * @param {string} params.message - Notification message (max 1000 chars)
   * @param {string} [params.type='info'] - Notification type (error, warning, success, info)
   * @param {number} [params.priority=3] - Priority level (1-5)
   * @param {string} [params.category='general'] - Category (inventory, expiry, sales, system, general)
   * @param {Object} [params.metadata={}] - Additional data (productId, actionUrl, etc.)
   * @returns {Promise<Object|null>} Created notification or null if failed
   */
  async create({
    userId,
    title,
    message,
    type = NOTIFICATION_TYPE.INFO,
    priority = NOTIFICATION_PRIORITY.MEDIUM,
    category = NOTIFICATION_CATEGORY.GENERAL,
    metadata = {},
  }) {
    try {
      // Validation
      if (!userId || !title || !message) {
        throw new Error("Missing required fields: userId, title, message");
      }

      if (title.length > 200) {
        throw new Error("Title must be 200 characters or less");
      }

      if (message.length > 1000) {
        throw new Error("Message must be 1000 characters or less");
      }

      // ✅ NEW: Database-backed atomic deduplication
      // Check if we should send this notification
      const notificationKey = metadata.productId
        ? `${category}:${metadata.productId}`
        : `${category}:${title}`;

      const { data: shouldSend, error: dedupError } = await supabase.rpc(
        "should_send_notification",
        {
          p_user_id: userId,
          p_notification_key: notificationKey,
          p_cooldown_hours: 24,
        }
      );

      if (dedupError) {
        logger.warn(
          "[NotificationService] Deduplication check failed:",
          dedupError
        );
        // Continue anyway - don't block notification
      } else if (!shouldSend) {
        logger.debug("[NotificationService] Duplicate prevented:", {
          userId,
          notificationKey,
          category,
          productId: metadata.productId,
        });
        return null;
      }

      // Insert to database

      const { data: notification, error } = await supabase
        .from("user_notifications")
        .insert({
          user_id: userId,
          title: this.sanitizeText(title),
          message: this.sanitizeText(message),
          type,
          priority,
          category,
          metadata,
          is_read: false,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        logger.error("[NotificationService] Database insert error:", error);
        throw error;
      }

      // Send email if critical (priority 1 or 2)
      if (priority <= NOTIFICATION_PRIORITY.HIGH) {
        // Send email notification for critical alerts (fire and forget)
        this.sendEmailNotification(notification).catch(() => {
          // Silent fail - don't block notification creation
        });
      }

      // Supabase realtime will automatically notify UI subscribers
      return notification;
    } catch (error) {
      logger.error(
        "[NotificationService] Failed to create notification:",
        error
      );

      // Log to error tracking service if available
      if (window.Sentry) {
        window.Sentry.captureException(error, {
          tags: { component: "NotificationService", operation: "create" },
          extra: { userId, title, message, type, priority, category },
        });
      }

      return null;
    }
  }

  /**
   * Sanitize text to prevent XSS
   */
  sanitizeText(text) {
    return text
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;");
  }

  // ============================================================================
  // HELPERS: Specific Notification Types
  // ============================================================================

  /**
   * Notify about low stock
   */
  async notifyLowStock(
    productId,
    productName,
    currentStock,
    reorderLevel,
    userId
  ) {
    return await this.create({
      userId,
      title: "⚠️ Low Stock Alert",
      message: `${productName} is running low: ${currentStock} pieces remaining (reorder at ${reorderLevel})`,
      type: NOTIFICATION_TYPE.WARNING,
      priority: NOTIFICATION_PRIORITY.HIGH,
      category: NOTIFICATION_CATEGORY.INVENTORY,
      metadata: {
        productId,
        productName,
        currentStock,
        reorderLevel,
        actionUrl: `/inventory?product=${productId}`,
        notification_key: `low-stock:${productId}`, // ✅ For deduplication
      },
    });
  }

  /**
   * Notify about critical stock (almost out)
   */
  async notifyCriticalStock(productId, productName, currentStock, userId) {
    return await this.create({
      userId,
      title: "🚨 Critical Stock Alert",
      message: `${productName} is critically low: Only ${currentStock} pieces left!`,
      type: NOTIFICATION_TYPE.ERROR,
      priority: NOTIFICATION_PRIORITY.CRITICAL,
      category: NOTIFICATION_CATEGORY.INVENTORY,
      metadata: {
        productId,
        productName,
        currentStock,
        actionUrl: `/inventory?product=${productId}`,
        notification_key: `critical-stock:${productId}`, // ✅ For deduplication
      },
    });
  }

  /**
   * Notify about expiring product
   */
  async notifyExpiringSoon(
    productId,
    productName,
    expiryDate,
    daysRemaining,
    userId
  ) {
    const isCritical = daysRemaining <= 7;

    return await this.create({
      userId,
      title: isCritical
        ? "🚨 Urgent: Product Expiring Soon"
        : "📅 Product Expiry Warning",
      message: `${productName} expires in ${daysRemaining} day${
        daysRemaining === 1 ? "" : "s"
      } (${expiryDate})`,
      type: isCritical ? NOTIFICATION_TYPE.ERROR : NOTIFICATION_TYPE.WARNING,
      priority: isCritical
        ? NOTIFICATION_PRIORITY.CRITICAL
        : NOTIFICATION_PRIORITY.HIGH,
      category: NOTIFICATION_CATEGORY.EXPIRY,
      metadata: {
        productId,
        productName,
        expiryDate,
        daysRemaining,
        actionUrl: `/inventory?product=${productId}`,
        notification_key: `expiry:${productId}:${expiryDate}`, // ✅ For deduplication
      },
    });
  }

  /**
   * Notify about completed sale
   */
  async notifySaleCompleted(saleId, totalAmount, itemCount, userId) {
    return await this.create({
      userId,
      title: "✅ Sale Completed",
      message: `Successfully processed sale of ${itemCount} item${
        itemCount === 1 ? "" : "s"
      } for ₱${totalAmount.toFixed(2)}`,
      type: NOTIFICATION_TYPE.SUCCESS,
      priority: NOTIFICATION_PRIORITY.LOW,
      category: NOTIFICATION_CATEGORY.SALES,
      metadata: {
        saleId,
        totalAmount,
        itemCount,
        actionUrl: `/sales/${saleId}`,
      },
    });
  }

  /**
   * Notify about system error
   */
  async notifySystemError(errorMessage, errorCode, userId) {
    return await this.create({
      userId,
      title: "❌ System Error",
      message: `An error occurred: ${errorMessage}`,
      type: NOTIFICATION_TYPE.ERROR,
      priority: NOTIFICATION_PRIORITY.CRITICAL,
      category: NOTIFICATION_CATEGORY.SYSTEM,
      metadata: {
        errorMessage,
        errorCode,
      },
    });
  }

  /**
   * Notify about product added
   */
  async notifyProductAdded(productId, productName, userId) {
    return await this.create({
      userId,
      title: "➕ Product Added",
      message: `${productName} has been added to inventory`,
      type: NOTIFICATION_TYPE.SUCCESS,
      priority: NOTIFICATION_PRIORITY.INFO,
      category: NOTIFICATION_CATEGORY.INVENTORY,
      metadata: {
        productId,
        productName,
        actionUrl: `/inventory?product=${productId}`,
      },
    });
  }

  /**
   * Notify about out of stock product
   */
  async notifyOutOfStock(productId, productName, userId) {
    return await this.create({
      userId,
      title: "❌ Out of Stock Alert",
      message: `${productName} is completely out of stock! Immediate reorder required.`,
      type: NOTIFICATION_TYPE.ERROR,
      priority: NOTIFICATION_PRIORITY.CRITICAL,
      category: NOTIFICATION_CATEGORY.INVENTORY,
      metadata: {
        productId,
        productName,
        currentStock: 0,
        actionUrl: `/inventory?product=${productId}`,
        notification_key: `out-of-stock:${productId}`,
      },
    });
  }

  /**
   * Notify about stock added via batch management
   */
  async notifyStockAdded(
    productId,
    productName,
    quantityAdded,
    batchNumber,
    newStockLevel,
    userId
  ) {
    return await this.create({
      userId,
      title: "📦 Stock Added",
      message: `${quantityAdded} units of ${productName} added (Batch: ${batchNumber}). New stock: ${newStockLevel} pieces.`,
      type: NOTIFICATION_TYPE.SUCCESS,
      priority: NOTIFICATION_PRIORITY.INFO,
      category: NOTIFICATION_CATEGORY.INVENTORY,
      metadata: {
        productId,
        productName,
        quantityAdded,
        batchNumber,
        newStockLevel,
        actionUrl: `/batch-management?product=${productId}`,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Notify about batch created/received
   */
  async notifyBatchReceived(
    batchNumber,
    productName,
    quantity,
    expiryDate,
    userId
  ) {
    return await this.create({
      userId,
      title: "✅ Batch Received",
      message: `Batch ${batchNumber} of ${productName} (${quantity} units) received. Expires: ${expiryDate}`,
      type: NOTIFICATION_TYPE.SUCCESS,
      priority: NOTIFICATION_PRIORITY.LOW,
      category: NOTIFICATION_CATEGORY.INVENTORY,
      metadata: {
        batchNumber,
        productName,
        quantity,
        expiryDate,
        actionUrl: `/batch-management?batch=${batchNumber}`,
      },
    });
  }

  // ============================================================================
  // ENHANCED NOTIFICATION METHODS WITH SMART COOLDOWN
  // ============================================================================

  /**
   * Enhanced low stock notification with custom cooldown
   */
  async notifyLowStockWithCooldown(
    productId,
    productName,
    currentStock,
    reorderLevel,
    userId,
    cooldownHours = 24,
    notificationKey = null
  ) {
    // Check if we should send this notification (respects cooldown)
    const shouldSend = await this.shouldSendNotification(
      userId,
      notificationKey || `low-stock:${productId}`,
      cooldownHours
    );

    if (!shouldSend) {
      logger.debug(
        `⏰ Skipping low stock notification for ${productName} - cooldown active`
      );
      return { skipped: true, reason: "cooldown" };
    }

    return await this.create({
      userId,
      title: "⚠️ Low Stock Alert",
      message: `${productName} is running low: ${currentStock} pieces remaining (reorder at ${reorderLevel})`,
      type: NOTIFICATION_TYPE.WARNING,
      priority: NOTIFICATION_PRIORITY.HIGH,
      category: NOTIFICATION_CATEGORY.INVENTORY,
      metadata: {
        productId,
        productName,
        currentStock,
        reorderLevel,
        actionUrl: `/inventory?product=${productId}`,
        notification_key: notificationKey || `low-stock:${productId}`,
        cooldown_hours: cooldownHours,
        severity: "low",
      },
    });
  }

  /**
   * Enhanced critical stock notification with custom cooldown
   */
  async notifyCriticalStockWithCooldown(
    productId,
    productName,
    currentStock,
    userId,
    cooldownHours = 6,
    notificationKey = null
  ) {
    // Check if we should send this notification (respects cooldown)
    const shouldSend = await this.shouldSendNotification(
      userId,
      notificationKey || `critical-stock:${productId}`,
      cooldownHours
    );

    if (!shouldSend) {
      logger.debug(
        `⏰ Skipping critical stock notification for ${productName} - cooldown active`
      );
      return { skipped: true, reason: "cooldown" };
    }

    return await this.create({
      userId,
      title: "🚨 Critical Stock Alert",
      message: `${productName} is critically low: Only ${currentStock} pieces left!`,
      type: NOTIFICATION_TYPE.ERROR,
      priority: NOTIFICATION_PRIORITY.CRITICAL,
      category: NOTIFICATION_CATEGORY.INVENTORY,
      metadata: {
        productId,
        productName,
        currentStock,
        actionUrl: `/inventory?product=${productId}`,
        notification_key: notificationKey || `critical-stock:${productId}`,
        cooldown_hours: cooldownHours,
        severity: "critical",
      },
    });
  }

  /**
   * Enhanced out of stock notification with custom cooldown
   */
  async notifyOutOfStockWithCooldown(
    productId,
    productName,
    userId,
    cooldownHours = 12,
    notificationKey = null
  ) {
    // Check if we should send this notification (respects cooldown)
    const shouldSend = await this.shouldSendNotification(
      userId,
      notificationKey || `out-of-stock:${productId}`,
      cooldownHours
    );

    if (!shouldSend) {
      logger.debug(
        `⏰ Skipping out of stock notification for ${productName} - cooldown active`
      );
      return { skipped: true, reason: "cooldown" };
    }

    return await this.create({
      userId,
      title: "❌ Out of Stock Alert",
      message: `${productName} is completely out of stock! Urgent restocking required.`,
      type: NOTIFICATION_TYPE.ERROR,
      priority: NOTIFICATION_PRIORITY.CRITICAL,
      category: NOTIFICATION_CATEGORY.INVENTORY,
      metadata: {
        productId,
        productName,
        currentStock: 0,
        actionUrl: `/inventory?product=${productId}`,
        notification_key: notificationKey || `out-of-stock:${productId}`,
        cooldown_hours: cooldownHours,
        severity: "out_of_stock",
      },
    });
  }

  /**
   * Helper method to check if notification should be sent (respects cooldown)
   */
  async shouldSendNotification(userId, notificationKey, cooldownHours = 24) {
    try {
      const { data: shouldSend, error } = await supabase.rpc(
        "should_send_notification",
        {
          p_user_id: userId,
          p_notification_key: notificationKey,
          p_cooldown_hours: cooldownHours,
        }
      );

      if (error) {
        logger.error("❌ Error checking notification cooldown:", error);
        return true; // Default to sending if check fails
      }

      return shouldSend;
    } catch (error) {
      logger.error("❌ Exception in notification cooldown check:", error);
      return true; // Default to sending if check fails
    }
  }

  /**
   * Notify about stock adjustment
   */
  async notifyStockAdjustment(
    productId,
    productName,
    oldStock,
    newStock,
    reason,
    userId
  ) {
    const difference = newStock - oldStock;
    const action = difference > 0 ? "increased" : "decreased";
    const icon = difference > 0 ? "📈" : "📉";

    return await this.create({
      userId,
      title: `${icon} Stock Adjusted`,
      message: `${productName} stock ${action} from ${oldStock} to ${newStock} pieces. Reason: ${reason}`,
      type:
        difference > 0 ? NOTIFICATION_TYPE.SUCCESS : NOTIFICATION_TYPE.WARNING,
      priority: NOTIFICATION_PRIORITY.LOW,
      category: NOTIFICATION_CATEGORY.INVENTORY,
      metadata: {
        productId,
        productName,
        oldStock,
        newStock,
        difference,
        reason,
        actionUrl: `/inventory?product=${productId}`,
      },
    });
  }

  // ============================================================================
  // EMAIL: Send Critical Notifications
  // ============================================================================

  /**
   * Send email notification for critical alerts
   * @private
   */
  async sendEmailNotification(notification) {
    try {
      // Get user email
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("email, first_name, last_name")
        .eq("id", notification.user_id)
        .single();

      if (userError || !user?.email) {
        logger.warn("⚠️ No email found for user:", notification.user_id);
        return;
      }

      const userName = user.first_name || "User";

      // Send email
      const emailResult = await this.emailService.send({
        to: user.email,
        subject: `[MedCure] ${notification.title}`,
        html: this.generateEmailTemplate(notification, userName),
      });

      if (emailResult.success) {
        // Mark as sent in database
        await supabase
          .from("user_notifications")
          .update({
            email_sent: true,
            email_sent_at: new Date().toISOString(),
          })
          .eq("id", notification.id);

        logger.debug("✅ Email sent for notification:", notification.id);
      } else {
        // Email failure is expected in browser environment (CORS) - silently skip
        // No logging needed - server-side implementation required
      }
    } catch {
      // Email notification skipped - silently fail (requires server-side)
      // Don't throw - email failure shouldn't break notification creation
    }
  }

  /**
   * Generate clean email template (FormSubmit compatible)
   * @private
   */
  generateEmailTemplate(notification, userName) {
    const isInventoryAlert =
      notification.category === NOTIFICATION_CATEGORY.INVENTORY;
    const isOutOfStock = notification.metadata?.currentStock === 0;
    const isLowStock =
      notification.metadata?.currentStock > 0 &&
      notification.metadata?.reorderLevel;
    const isCriticalStock =
      notification.priority === NOTIFICATION_PRIORITY.CRITICAL &&
      isInventoryAlert;

    // Dynamic icon and type based on alert type
    let alertIcon, alertType;
    if (isOutOfStock) {
      alertIcon = "🚨";
      alertType = "OUT OF STOCK";
    } else if (isCriticalStock) {
      alertIcon = "⚠️";
      alertType = "CRITICAL LOW";
    } else if (isLowStock) {
      alertIcon = "📦";
      alertType = "LOW STOCK";
    } else {
      alertIcon = "🔔";
      alertType =
        notification.priority <= NOTIFICATION_PRIORITY.HIGH
          ? "URGENT"
          : "Important";
    }

    // Create clean, formatted text email for FormSubmit
    const productInfo = notification.metadata || {};
    const timestamp = new Date(
      notification.created_at || new Date()
    ).toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Generate clean text content based on alert type
    let alertDetails = "";

    if (isInventoryAlert) {
      const productName = productInfo.productName || "Unknown Product";
      const currentStock = productInfo.currentStock || 0;
      const reorderLevel = productInfo.reorderLevel || 0;

      if (isOutOfStock) {
        alertDetails = `
🚨 URGENT: OUT OF STOCK ALERT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Product: ${productName}
Current Stock: ${currentStock} pieces
Status: COMPLETELY OUT OF STOCK

⚠️ IMMEDIATE ACTION REQUIRED:
• Contact suppliers immediately for emergency restocking
• Check for alternative products to recommend to customers  
• Update customers about stock availability
• Prioritize this product in next delivery
`;
      } else if (isCriticalStock) {
        alertDetails = `
🔥 CRITICAL: LOW STOCK ALERT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Product: ${productName}
Current Stock: ${currentStock} pieces
Reorder Level: ${reorderLevel} pieces
Status: CRITICALLY LOW (≤ 30% of reorder level)

⚡ URGENT ACTIONS NEEDED:
• Place immediate reorder - stock is dangerously low
• Consider expedited shipping options
• Monitor sales closely over next 24-48 hours
• Notify management of critical stock situation
`;
      } else if (isLowStock) {
        alertDetails = `
⚠️ WARNING: LOW STOCK ALERT  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Product: ${productName}
Current Stock: ${currentStock} pieces
Reorder Level: ${reorderLevel} pieces
Status: BELOW OPTIMAL LEVEL

📋 RECOMMENDED ACTIONS:
• Schedule reorder within next 24-48 hours
• Review recent sales patterns for this product
• Check if bulk pricing is available
• Ensure supplier contact information is current
`;
      }
    } else {
      alertDetails = `
📋 NOTIFICATION DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━

${notification.message}
`;
    }

    return `🏥 MEDCURE PHARMACY - INVENTORY ALERT
${alertIcon} ${alertType}

Hi ${userName},

${alertDetails}

📊 NOTIFICATION SUMMARY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Category: ${notification.category.toUpperCase()}
Priority: ${
      notification.priority === 1
        ? "CRITICAL"
        : notification.priority === 2
        ? "HIGH"
        : "NORMAL"
    }  
Time: ${timestamp}
System: MedCure Pharmacy Management

🔗 QUICK ACTIONS:
• View Dashboard: http://localhost:5173/dashboard
• Check Inventory: http://localhost:5173/inventory
${
  productInfo.actionUrl
    ? `• Product Details: http://localhost:5173${productInfo.actionUrl}`
    : ""
}

This is an automated notification from your MedCure Pharmacy Management System.
For support, visit: http://localhost:5173/help

─────────────────────────────────────────
© ${new Date().getFullYear()} MedCure Pharmacy | Inventory Management System
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  }

  // ============================================================================
  // READ: Get User Notifications
  // ============================================================================

  /**
   * Get notifications for a user
   *
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @param {number} [options.limit=50] - Max notifications to return
   * @param {number} [options.offset=0] - Offset for pagination
   * @param {boolean} [options.unreadOnly=false] - Only return unread notifications
   * @param {string} [options.category] - Filter by category
   * @returns {Promise<Object>} Object with notifications array, total count, and hasMore flag
   */
  async getUserNotifications(
    userId,
    { limit = 50, offset = 0, unreadOnly = false, category } = {}
  ) {
    try {
      let query = supabase
        .from("user_notifications")
        .select("*", { count: "exact" })
        .eq("user_id", userId)
        .is("dismissed_at", null)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (unreadOnly) {
        query = query.eq("is_read", false);
      }

      if (category) {
        query = query.eq("category", category);
      }

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      return {
        notifications: data || [],
        totalCount: count || 0,
        hasMore: count > offset + limit,
      };
    } catch (error) {
      logger.error("❌ Failed to get notifications:", error);
      return {
        notifications: [],
        totalCount: 0,
        hasMore: false,
      };
    }
  }

  /**
   * Get unread notification count
   *
   * @param {string} userId - User ID
   * @returns {Promise<number>} Unread count
   */
  async getUnreadCount(userId) {
    try {
      logger.debug(
        "📊 [NotificationService] Getting unread count for user:",
        userId
      );

      const { count, error } = await supabase
        .from("user_notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_read", false)
        .is("dismissed_at", null);

      if (error) {
        logger.error(
          "❌ [NotificationService] Error getting unread count:",
          error
        );
        throw error;
      }

      logger.debug("✅ [NotificationService] Unread count result:", count);
      return count || 0;
    } catch (error) {
      logger.error("❌ Failed to get unread count:", error);
      return 0;
    }
  }

  // ============================================================================
  // UPDATE: Mark as Read/Dismissed
  // ============================================================================

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, userId) {
    try {
      const { data, error } = await supabase
        .from("user_notifications")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq("id", notificationId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      logger.debug("✅ Notification marked as read:", notificationId);
      return { success: true, data };
    } catch (error) {
      logger.error("❌ Failed to mark as read:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId) {
    try {
      const { data, error } = await supabase
        .from("user_notifications")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("is_read", false)
        .is("dismissed_at", null)
        .select();

      if (error) {
        throw error;
      }

      const count = data?.length || 0;
      logger.debug(
        `✅ Marked ${count} notifications as read for user:`,
        userId
      );
      return { success: true, count, data };
    } catch (error) {
      logger.error("❌ Failed to mark all as read:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Dismiss notification (soft delete)
   */
  async dismiss(notificationId, userId) {
    try {
      const { data, error } = await supabase
        .from("user_notifications")
        .update({
          dismissed_at: new Date().toISOString(),
        })
        .eq("id", notificationId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      logger.debug("✅ Notification dismissed:", notificationId);
      return { success: true, data };
    } catch (error) {
      logger.error("❌ Failed to dismiss notification:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Dismiss all notifications
   */
  async dismissAll(userId) {
    try {
      const { data, error } = await supabase
        .from("user_notifications")
        .update({
          dismissed_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .is("dismissed_at", null)
        .select();

      if (error) {
        throw error;
      }

      const count = data?.length || 0;
      logger.debug(`✅ Dismissed ${count} notifications for user:`, userId);
      return { success: true, count, data };
    } catch (error) {
      logger.error("❌ Failed to dismiss all:", error);
      return { success: false, error: error.message };
    }
  }

  // ============================================================================
  // REALTIME: Subscribe to Updates
  // ============================================================================

  /**
   * Subscribe to real-time notification updates
   *
   * @param {string} userId - User ID to subscribe for
   * @param {Function} onNotificationUpdate - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribeToNotifications(userId, onNotificationUpdate) {
    if (this.realtimeSubscription) {
      logger.debug("🔄 Closing existing subscription before creating new one");
      this.unsubscribe();
    }

    this.realtimeSubscription = supabase
      .channel(`user-notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          logger.debug(
            "📬 Real-time notification update:",
            payload.eventType,
            payload.new?.title
          );
          onNotificationUpdate(payload);
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          logger.debug("✅ Subscribed to notifications for user:", userId);
        }
      });

    // Return unsubscribe function
    return () => this.unsubscribe();
  }

  /**
   * Unsubscribe from real-time updates
   */
  unsubscribe() {
    if (this.realtimeSubscription) {
      this.realtimeSubscription.unsubscribe();
      this.realtimeSubscription = null;
      logger.debug("🔌 Unsubscribed from notifications");
    }
  }

  // ============================================================================
  // AUTOMATED: Health Checks
  // ============================================================================

  /**
   * Run automated health checks (WITH DUPLICATE PREVENTION)
   * Only runs if 15+ minutes have passed since last run
   */
  async runHealthChecks() {
    const now = Date.now();
    logger.info("🏥 [Health Check] Starting health checks...");

    // Local debounce check
    if (
      this.lastHealthCheckRun &&
      now - this.lastHealthCheckRun < this.healthCheckDebounceMs
    ) {
      const timeSinceLastRun = Math.floor(
        (now - this.lastHealthCheckRun) / (1000 * 60)
      );
      logger.debug(
        `⏰ Health check skipped - last run was ${timeSinceLastRun} minutes ago (minimum: 15 minutes)`
      );
      return { skipped: true, reason: "Too soon since last run" };
    }

    try {
      // Check if we should run (database-backed scheduling)
      const shouldRun = await this.shouldRunHealthCheck();
      if (!shouldRun) {
        logger.debug(
          "⏰ Health check skipped - database scheduling says not to run"
        );
        return { skipped: true, reason: "Database scheduling" };
      }

      // Get primary user for notifications
      const primaryUser = await this.getPrimaryNotificationUser();
      if (!primaryUser) {
        logger.warn("⚠️ No primary user found for notifications");
        return { skipped: true, reason: "No primary user found" };
      }

      logger.info(
        `👤 Primary user for notifications: ${primaryUser.email} (${primaryUser.role})`
      );

      // Run all health checks
      logger.info("🔍 Executing all health checks...");
      const totalNotifications = await this.executeHealthChecks([primaryUser]);

      // Record successful completion
      await this.recordHealthCheckRun(totalNotifications, null);
      this.lastHealthCheckRun = now;

      const result = {
        success: true,
        totalNotifications,
        primaryUser: primaryUser.email,
        timestamp: new Date().toISOString(),
      };

      logger.success(
        `✅ Health check completed successfully! Created ${totalNotifications} notifications`
      );
      return result;
    } catch (error) {
      logger.error("❌ Health check failed:", error);
      await this.recordHealthCheckRun(0, error.message);
      await this.notifyHealthCheckFailure(error);

      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Check if health checks should run
   * @private
   */
  async shouldRunHealthCheck() {
    try {
      const { data: shouldRun, error } = await supabase.rpc(
        "should_run_health_check",
        {
          p_check_type: "all",
          p_interval_minutes: 15,
        }
      );

      if (error && error.code === "42883") {
        // Function doesn't exist - run anyway for backward compatibility
        return true;
      }

      return !error && shouldRun;
    } catch {
      return true; // Default to running if check fails
    }
  }

  /**
   * Get primary user for notifications
   * @private
   */
  async getPrimaryNotificationUser() {
    try {
      const { data: users, error } = await supabase
        .from("users")
        .select("id, email, role")
        .eq("is_active", true)
        .in("role", ["admin", "manager", "pharmacist"])
        .order("role", { ascending: true })
        .limit(1);

      if (error || !users?.length) {
        return null;
      }

      return users[0];
    } catch {
      return null;
    }
  }

  /**
   * Execute all health checks
   * @private
   */
  async executeHealthChecks(users) {
    logger.info("🔍 Starting comprehensive health check...");

    const userSettings = this.getUserNotificationSettings();
    const now = Date.now();

    // Check if enough time has passed for low stock check
    const lowStockIntervalMs = userSettings.lowStockCheckInterval * 60 * 1000;
    const shouldCheckLowStock =
      !this.lastLowStockCheck ||
      now - this.lastLowStockCheck >= lowStockIntervalMs;

    // Check if enough time has passed for expiring check
    const expiringIntervalMs = userSettings.expiringCheckInterval * 60 * 1000;
    const shouldCheckExpiring =
      !this.lastExpiringCheck ||
      now - this.lastExpiringCheck >= expiringIntervalMs;

    // Calculate time since last checks (for logging)
    const minutesSinceLowStock = this.lastLowStockCheck
      ? Math.floor((now - this.lastLowStockCheck) / (60 * 1000))
      : "Never";
    const minutesSinceExpiring = this.lastExpiringCheck
      ? Math.floor((now - this.lastExpiringCheck) / (60 * 1000))
      : "Never";

    logger.info(
      `⏱️ User Settings: Low Stock=${userSettings.lowStockCheckInterval}min, Expiring=${userSettings.expiringCheckInterval}min`
    );
    logger.info(
      `📊 Last Checks: Low Stock=${minutesSinceLowStock}min ago, Expiring=${minutesSinceExpiring}min ago`
    );
    logger.info(
      `🎯 Running Checks: Low Stock=${
        shouldCheckLowStock ? "✅ YES" : "⏭️ SKIP"
      }, ` +
        `Expiring=${
          shouldCheckExpiring ? "✅ YES" : "⏭️ SKIP"
        }, Out-of-Stock=✅ ALWAYS`
    );

    // Run checks based on intervals
    const [lowStockCount, expiringCount, outOfStockCount] = await Promise.all([
      shouldCheckLowStock ? this.checkLowStock(users) : Promise.resolve(0),
      shouldCheckExpiring
        ? this.checkExpiringProducts(users)
        : Promise.resolve(0),
      this.checkOutOfStock(users), // Always check (critical safety feature)
    ]);

    // Update last check timestamps
    if (shouldCheckLowStock) {
      this.lastLowStockCheck = now;
      logger.debug(`✅ Updated lastLowStockCheck timestamp`);
    }
    if (shouldCheckExpiring) {
      this.lastExpiringCheck = now;
      logger.debug(`✅ Updated lastExpiringCheck timestamp`);
    }

    const totalNotifications = lowStockCount + expiringCount + outOfStockCount;

    logger.success(
      `✅ Health check completed: ${totalNotifications} total notifications ` +
        `(${lowStockCount} low stock, ${expiringCount} expiring, ${outOfStockCount} out-of-stock)`
    );

    return totalNotifications;
  }

  /**
   * Record health check completion
   * @private
   */
  async recordHealthCheckRun(notificationCount, errorMessage) {
    try {
      await supabase.rpc("record_health_check_run", {
        p_check_type: "all",
        p_notifications_created: notificationCount,
        p_error_message: errorMessage,
      });
    } catch {
      // Ignore if function doesn't exist
    }
  }

  /**
   * Notify admins about health check failure
   * @private
   */
  async notifyHealthCheckFailure(error) {
    try {
      const { data: admins } = await supabase
        .from("users")
        .select("id")
        .eq("role", "admin")
        .eq("is_active", true)
        .limit(1);

      if (admins?.[0]) {
        await this.notifySystemError(
          "Health check failed: " + error.message,
          "HEALTH_CHECK_FAILURE",
          admins[0].id
        );
      }
    } catch {
      // Silent fail
    }
  }

  /**
   * Check for low stock products (ENHANCED VERSION)
   * @private
   */
  async checkLowStock(users) {
    try {
      logger.debug("🔍 [Health Check] Starting ENHANCED low stock check...");

      // OPTIMIZATION 1: Fetch ALL active products (not just those with reorder levels)
      const { data: allProducts, error } = await supabase
        .from("products")
        .select(
          "id, brand_name, generic_name, stock_in_pieces, reorder_level, category_id"
        )
        .gt("stock_in_pieces", 0) // Only products with stock > 0
        .eq("is_active", true);

      if (error) {
        logger.error("❌ Database error fetching products:", error);
        throw error;
      }

      logger.debug(
        `📦 Found ${allProducts?.length || 0} active products with stock`
      );

      // OPTIMIZATION 2: Enhanced filtering with intelligent defaults
      const lowStockProducts =
        allProducts?.filter((product) => {
          const stock = product.stock_in_pieces || 0;
          let reorderLevel = product.reorder_level || 0;

          // SMART DEFAULT: If no reorder level set, use intelligent default based on stock
          if (!reorderLevel || reorderLevel === 0) {
            // Default to 20% of current stock or minimum of 5 pieces
            reorderLevel = Math.max(Math.floor(stock * 0.2), 5);
            logger.debug(
              `📊 Using smart default reorder level for ${
                product.brand_name || product.generic_name
              }: ${reorderLevel} (stock: ${stock})`
            );
          }

          const isLowStock = stock > 0 && stock <= reorderLevel;

          if (isLowStock) {
            logger.debug(
              `⚠️ Low stock detected: ${
                product.brand_name || product.generic_name
              } (Stock: ${stock}, Reorder: ${reorderLevel})`
            );
          }

          return isLowStock;
        }) || [];

      logger.debug(`🚨 Found ${lowStockProducts.length} low stock products`);

      if (lowStockProducts.length === 0) {
        logger.debug("✅ No low stock products found");
        return 0;
      }

      // OPTIMIZATION 3: Batch notification creation for better performance
      const notificationPromises = [];

      for (const user of users) {
        logger.debug(`📧 Preparing notifications for user: ${user.email}`);

        for (const product of lowStockProducts) {
          const productName =
            product.brand_name || product.generic_name || "Unknown Product";
          const stock = product.stock_in_pieces;
          let reorderLevel = product.reorder_level;

          // Apply same smart default logic as in filtering
          if (!reorderLevel || reorderLevel === 0) {
            reorderLevel = Math.max(Math.floor(stock * 0.2), 5);
          }

          // Determine if this is critical (30% or less of reorder level)
          const criticalThreshold = Math.floor(reorderLevel * 0.3);
          const isCritical = stock <= criticalThreshold;

          logger.debug(
            `📦 Processing: ${productName} (Stock: ${stock}, Reorder: ${reorderLevel}, Critical: ${isCritical})`
          );

          // SMART DEDUPLICATION: Different cooldown periods based on severity
          const cooldownHours = isCritical ? 6 : 24; // Critical alerts every 6 hours, regular every 24 hours
          const notificationKey = `${isCritical ? "critical" : "low"}_stock_${
            product.id
          }`;

          if (isCritical) {
            notificationPromises.push(
              this.notifyCriticalStockWithCooldown(
                product.id,
                productName,
                stock,
                user.id,
                cooldownHours,
                notificationKey
              )
            );
          } else {
            notificationPromises.push(
              this.notifyLowStockWithCooldown(
                product.id,
                productName,
                stock,
                reorderLevel,
                user.id,
                cooldownHours,
                notificationKey
              )
            );
          }
        }
      }

      // Execute all notifications in parallel for better performance
      const results = await Promise.allSettled(notificationPromises);

      let notificationCount = 0;
      let failureCount = 0;

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          notificationCount++;
        } else {
          failureCount++;
          logger.error(`❌ Notification ${index} failed:`, result.reason);
        }
      });

      logger.debug(
        `✅ Low stock check completed. Created ${notificationCount} notifications, ${failureCount} failures`
      );

      logger.debug(
        `✅ Low stock check completed. Created ${notificationCount} notifications`
      );
      return notificationCount;
    } catch (error) {
      logger.error("❌ Low stock check failed:", error);
      return 0;
    }
  }

  /**
   * Check for expiring products
   * @private
   */
  async checkExpiringProducts(users) {
    try {
      const today = new Date();
      const thirtyDaysFromNow = new Date(today);
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      const { data: products, error } = await supabase
        .from("products")
        .select("id, brand_name, generic_name, expiry_date")
        .not("expiry_date", "is", null)
        .gte("expiry_date", today.toISOString().split("T")[0])
        .lte("expiry_date", thirtyDaysFromNow.toISOString().split("T")[0])
        .eq("is_active", true);

      if (error) {
        throw error;
      }

      if (!products || products.length === 0) {
        return 0;
      }

      let notificationCount = 0;

      for (const user of users) {
        for (const product of products) {
          const productName =
            product.brand_name || product.generic_name || "Unknown Product";
          const expiryDate = new Date(product.expiry_date);
          const daysRemaining = Math.ceil(
            (expiryDate - today) / (1000 * 60 * 60 * 24)
          );

          await this.notifyExpiringSoon(
            product.id,
            productName,
            product.expiry_date,
            daysRemaining,
            user.id
          );

          notificationCount++;
        }
      }

      return notificationCount;
    } catch (error) {
      logger.error("❌ Expiry check failed:", error);
      return 0;
    }
  }

  /**
   * Check for out of stock products
   * CRITICAL: Out of stock alerts are ALWAYS IMMEDIATE - no cooldown
   * Uses database deduplication to prevent spam
   * @private
   */
  async checkOutOfStock(users) {
    try {
      logger.debug("🔍 [Health Check] Starting out of stock check...");

      const { data: products, error } = await supabase
        .from("products")
        .select("id, brand_name, generic_name, stock_in_pieces")
        .eq("stock_in_pieces", 0)
        .eq("is_active", true);

      if (error) {
        logger.error(
          "❌ Database error fetching out of stock products:",
          error
        );
        throw error;
      }

      logger.debug(`📦 Found ${products?.length || 0} out of stock products`);

      if (!products || products.length === 0) {
        logger.debug("✅ No out of stock products found");
        return 0;
      }

      // CRITICAL: Use direct notification method (NO COOLDOWN)
      // Database RPC function handles deduplication
      const notificationPromises = [];

      for (const user of users) {
        logger.debug(
          `📧 Preparing out of stock notifications for user: ${user.email}`
        );

        for (const product of products) {
          const productName =
            product.brand_name || product.generic_name || "Unknown Product";

          logger.debug(
            `🚨 Creating IMMEDIATE out of stock alert for: ${productName}`
          );

          // Use direct method - database handles deduplication
          notificationPromises.push(
            this.notifyOutOfStock(product.id, productName, user.id)
          );
        }
      }

      // Execute all notifications in parallel
      const results = await Promise.allSettled(notificationPromises);

      let notificationCount = 0;
      let dedupedCount = 0;
      let failureCount = 0;

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          if (result.value === null) {
            // Database deduplication prevented this notification
            dedupedCount++;
          } else {
            notificationCount++;
          }
        } else {
          failureCount++;
          logger.error(
            `❌ Out of stock notification ${index} failed:`,
            result.reason
          );
        }
      });

      logger.info(
        `✅ Out of stock check completed. Created ${notificationCount} new notifications, ` +
          `${dedupedCount} blocked by database deduplication, ${failureCount} failures`
      );

      return notificationCount;
    } catch (error) {
      logger.error("❌ Out of stock check failed:", error);
      return 0;
    }
  }

  /**
   * Debug method to check products and stock levels
   * Use this to diagnose why health checks aren't detecting issues
   */
  async debugProductStockLevels() {
    try {
      logger.info("🔍 [DEBUG] Analyzing all products for stock issues...");

      // Get all active products
      const { data: allProducts, error } = await supabase
        .from("products")
        .select(
          "id, brand_name, generic_name, stock_in_pieces, reorder_level, is_active"
        )
        .eq("is_active", true)
        .order("stock_in_pieces", { ascending: true });

      if (error) {
        logger.error("❌ Failed to fetch products:", error);
        return { error: error.message };
      }

      const stats = {
        total: allProducts?.length || 0,
        outOfStock: 0,
        lowStock: 0,
        criticalStock: 0,
        normal: 0,
        noReorderLevel: 0,
      };

      const issues = {
        outOfStock: [],
        lowStock: [],
        criticalStock: [],
        noReorderLevel: [],
      };

      console.table(allProducts?.slice(0, 10) || []); // Show first 10 products

      allProducts?.forEach((product) => {
        const stock = product.stock_in_pieces || 0;
        const reorderLevel = product.reorder_level || 0;
        const productName =
          product.brand_name || product.generic_name || "Unknown";

        if (stock === 0) {
          stats.outOfStock++;
          issues.outOfStock.push({ name: productName, stock, reorderLevel });
        } else if (!reorderLevel || reorderLevel === 0) {
          stats.noReorderLevel++;
          issues.noReorderLevel.push({
            name: productName,
            stock,
            reorderLevel,
          });
        } else if (stock <= reorderLevel) {
          const criticalThreshold = Math.floor(reorderLevel * 0.3);
          if (stock <= criticalThreshold) {
            stats.criticalStock++;
            issues.criticalStock.push({
              name: productName,
              stock,
              reorderLevel,
            });
          } else {
            stats.lowStock++;
            issues.lowStock.push({ name: productName, stock, reorderLevel });
          }
        } else {
          stats.normal++;
        }
      });

      logger.info("📊 Product Stock Analysis:", stats);

      if (issues.outOfStock.length > 0) {
        logger.warn("❌ Out of Stock Products:", issues.outOfStock.slice(0, 5));
      }

      if (issues.criticalStock.length > 0) {
        logger.warn(
          "🚨 Critical Stock Products:",
          issues.criticalStock.slice(0, 5)
        );
      }

      if (issues.lowStock.length > 0) {
        logger.warn("⚠️ Low Stock Products:", issues.lowStock.slice(0, 5));
      }

      if (issues.noReorderLevel.length > 0) {
        logger.warn(
          "❓ Products without reorder level:",
          issues.noReorderLevel.slice(0, 5)
        );
      }

      return {
        success: true,
        stats,
        issues,
        sampleProducts: allProducts?.slice(0, 5) || [],
      };
    } catch (error) {
      logger.error("❌ Debug analysis failed:", error);
      return { error: error.message };
    }
  }

  /**
   * Cleanup: Remove old dismissed notifications
   * Call this periodically (e.g., daily)
   */
  async cleanup(daysOld = 30) {
    try {
      const { data, error } = await supabase.rpc("cleanup_old_notifications", {
        days_old: daysOld,
      });

      if (error) {
        throw error;
      }

      logger.debug(`🧹 Cleaned up ${data} old notifications`);
      return data;
    } catch (error) {
      logger.error("❌ Cleanup failed:", error);
      return 0;
    }
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const notificationService = new NotificationService();
export default notificationService;
