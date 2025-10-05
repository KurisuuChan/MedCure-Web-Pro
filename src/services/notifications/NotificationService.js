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

    // Deduplication cache (prevents spam notifications)
    this.recentNotifications = new Map();
    this.DEDUP_WINDOW = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  }

  /**
   * Initialize the notification service
   * Call this when the app starts
   */
  async initialize() {
    if (this.isInitialized) {
      console.log("📬 NotificationService already initialized");
      return;
    }

    try {
      console.log("📬 Initializing NotificationService...");

      // Verify database connection
      const { error } = await supabase
        .from("user_notifications")
        .select("count")
        .limit(1);
      if (error) {
        throw new Error(`Database connection failed: ${error.message}`);
      }

      this.isInitialized = true;
      console.log("✅ NotificationService initialized successfully");

      return true;
    } catch (error) {
      console.error("❌ Failed to initialize NotificationService:", error);
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

      // Check for duplicate (prevent spam)
      if (this.isDuplicate(userId, category, metadata.productId)) {
        console.log("🔄 Duplicate notification prevented:", {
          userId,
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
        throw error;
      }

      console.log("✅ Notification created:", notification.id, "-", title);

      // Send email if critical (priority 1 or 2)
      if (priority <= NOTIFICATION_PRIORITY.HIGH) {
        // Fire and forget - don't block notification creation
        this.sendEmailNotification(notification).catch((err) => {
          console.error("⚠️ Email send failed (non-blocking):", err.message);
        });
      }

      // Update deduplication cache
      this.markAsRecent(userId, category, metadata.productId);

      // Supabase realtime will automatically notify UI subscribers
      return notification;
    } catch (error) {
      console.error("❌ Failed to create notification:", error);

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

  /**
   * Check if a similar notification was recently sent
   */
  isDuplicate(userId, category, productId) {
    if (!productId) return false; // Only deduplicate product-related notifications

    const key = `${userId}-${category}-${productId}`;
    const lastSent = this.recentNotifications.get(key);

    if (!lastSent) return false;

    const timeSince = Date.now() - lastSent;
    return timeSince < this.DEDUP_WINDOW;
  }

  /**
   * Mark notification as recently sent
   */
  markAsRecent(userId, category, productId) {
    if (!productId) return;

    const key = `${userId}-${category}-${productId}`;
    this.recentNotifications.set(key, Date.now());

    // Clean up old entries periodically
    if (this.recentNotifications.size > 1000) {
      this.cleanupDeduplicationCache();
    }
  }

  /**
   * Remove old entries from deduplication cache
   */
  cleanupDeduplicationCache() {
    const now = Date.now();
    const entriesToDelete = [];

    for (const [key, timestamp] of this.recentNotifications.entries()) {
      if (now - timestamp > this.DEDUP_WINDOW) {
        entriesToDelete.push(key);
      }
    }

    entriesToDelete.forEach((key) => this.recentNotifications.delete(key));
    console.log(
      `🧹 Cleaned ${entriesToDelete.length} old deduplication entries`
    );
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
        console.warn("⚠️ No email found for user:", notification.user_id);
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

        console.log("✅ Email sent for notification:", notification.id);
      } else {
        console.warn(
          "⚠️ Email send failed:",
          emailResult.error || emailResult.reason
        );
      }
    } catch (error) {
      console.error("❌ Failed to send email notification:", error);
      // Don't throw - email failure shouldn't break notification creation
    }
  }

  /**
   * Generate HTML email template
   * @private
   */
  generateEmailTemplate(notification, userName) {
    const priorityColor =
      notification.priority <= NOTIFICATION_PRIORITY.HIGH
        ? "#dc2626"
        : "#f59e0b";
    const appUrl = import.meta.env.VITE_APP_URL || "http://localhost:5173";

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${notification.title}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f3f4f6; }
          .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 32px 24px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
          .header p { margin: 8px 0 0; font-size: 14px; opacity: 0.9; }
          .content { padding: 32px 24px; }
          .greeting { font-size: 16px; margin-bottom: 24px; }
          .notification-box { background: #f9fafb; padding: 24px; border-radius: 8px; border-left: 4px solid ${priorityColor}; margin-bottom: 24px; }
          .notification-title { font-size: 20px; font-weight: 600; color: #111827; margin: 0 0 12px; }
          .notification-message { font-size: 15px; color: #4b5563; line-height: 1.6; margin: 0; }
          .button { display: inline-block; padding: 14px 28px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px; margin-top: 24px; font-weight: 500; transition: background 0.2s; }
          .button:hover { background: #1d4ed8; }
          .meta { margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 13px; }
          .footer { text-align: center; padding: 24px; background: #f9fafb; color: #6b7280; font-size: 12px; }
          .footer a { color: #2563eb; text-decoration: none; }
          .priority-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 500; margin-bottom: 12px; background: ${priorityColor}; color: white; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏥 MedCure Pharmacy</h1>
            <p>Notification System</p>
          </div>
          
          <div class="content">
            <p class="greeting">Hi ${userName},</p>
            
            <div class="notification-box">
              <span class="priority-badge">${
                notification.priority <= NOTIFICATION_PRIORITY.HIGH
                  ? "URGENT"
                  : "Important"
              }</span>
              <h2 class="notification-title">${notification.title}</h2>
              <p class="notification-message">${notification.message}</p>
              
              ${
                notification.metadata?.actionUrl
                  ? `
                <a href="${appUrl}${notification.metadata.actionUrl}" class="button">
                  View Details →
                </a>
              `
                  : ""
              }
            </div>
            
            <div class="meta">
              <strong>Category:</strong> ${notification.category}<br>
              <strong>Time:</strong> ${new Date(
                notification.created_at
              ).toLocaleString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
          
          <div class="footer">
            <p>This is an automated notification from MedCure Pharmacy Management System.</p>
            <p>© ${new Date().getFullYear()} MedCure Pharmacy. All rights reserved.</p>
            <p><a href="${appUrl}/settings/notifications">Manage notification preferences</a></p>
          </div>
        </div>
      </body>
      </html>
    `;
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
      console.error("❌ Failed to get notifications:", error);
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
      const { count, error } = await supabase
        .from("user_notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_read", false)
        .is("dismissed_at", null);

      if (error) {
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error("❌ Failed to get unread count:", error);
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
      const { error } = await supabase
        .from("user_notifications")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq("id", notificationId)
        .eq("user_id", userId);

      if (error) {
        throw error;
      }

      console.log("✅ Notification marked as read:", notificationId);
      return true;
    } catch (error) {
      console.error("❌ Failed to mark as read:", error);
      return false;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId) {
    try {
      const { error } = await supabase
        .from("user_notifications")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("is_read", false)
        .is("dismissed_at", null);

      if (error) {
        throw error;
      }

      console.log("✅ All notifications marked as read for user:", userId);
      return true;
    } catch (error) {
      console.error("❌ Failed to mark all as read:", error);
      return false;
    }
  }

  /**
   * Dismiss notification (soft delete)
   */
  async dismiss(notificationId, userId) {
    try {
      const { error } = await supabase
        .from("user_notifications")
        .update({
          dismissed_at: new Date().toISOString(),
        })
        .eq("id", notificationId)
        .eq("user_id", userId);

      if (error) {
        throw error;
      }

      console.log("✅ Notification dismissed:", notificationId);
      return true;
    } catch (error) {
      console.error("❌ Failed to dismiss notification:", error);
      return false;
    }
  }

  /**
   * Dismiss all notifications
   */
  async dismissAll(userId) {
    try {
      const { error } = await supabase
        .from("user_notifications")
        .update({
          dismissed_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .is("dismissed_at", null);

      if (error) {
        throw error;
      }

      console.log("✅ All notifications dismissed for user:", userId);
      return true;
    } catch (error) {
      console.error("❌ Failed to dismiss all:", error);
      return false;
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
      console.log("🔄 Closing existing subscription before creating new one");
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
          console.log(
            "📬 Real-time notification update:",
            payload.eventType,
            payload.new?.title
          );
          onNotificationUpdate(payload);
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("✅ Subscribed to notifications for user:", userId);
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
      console.log("🔌 Unsubscribed from notifications");
    }
  }

  // ============================================================================
  // AUTOMATED: Health Checks
  // ============================================================================

  /**
   * Run automated health checks
   * Call this periodically (e.g., every 15 minutes) or on app startup
   */
  async runHealthChecks() {
    try {
      console.log("🔍 Running notification health checks...");

      // Get all active users who should receive notifications
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id, email, role")
        .eq("is_active", true)
        .in("role", ["admin", "manager", "pharmacist"]);

      if (usersError) {
        throw usersError;
      }

      if (!users || users.length === 0) {
        console.log("ℹ️ No active users found for notifications");
        return;
      }

      console.log(`👥 Found ${users.length} users to check`);

      // Run checks
      const [lowStockCount, expiringCount] = await Promise.all([
        this.checkLowStock(users),
        this.checkExpiringProducts(users),
      ]);

      console.log(
        `✅ Health checks completed: ${lowStockCount} low stock, ${expiringCount} expiring products`
      );
    } catch (error) {
      console.error("❌ Health check failed:", error);

      // Try to notify admins about the failure
      try {
        const { data: admins } = await supabase
          .from("users")
          .select("id")
          .eq("role", "admin")
          .eq("is_active", true)
          .limit(1);

        if (admins && admins[0]) {
          await this.notifySystemError(
            "Health check failed: " + error.message,
            "HEALTH_CHECK_FAILURE",
            admins[0].id
          );
        }
      } catch (notifyError) {
        console.error(
          "❌ Failed to notify admin about health check failure:",
          notifyError
        );
      }
    }
  }

  /**
   * Check for low stock products
   * @private
   */
  async checkLowStock(users) {
    try {
      // Fetch all active products and filter in JavaScript
      const { data: allProducts, error } = await supabase
        .from("products")
        .select("id, brand_name, generic_name, stock_in_pieces, reorder_level")
        .gt("stock_in_pieces", 0)
        .eq("is_active", true);

      if (error) {
        throw error;
      }

      // Filter products where stock_in_pieces <= reorder_level
      const products = allProducts?.filter(
        (p) => p.stock_in_pieces <= (p.reorder_level || 0)
      ) || [];

      if (error) {
        throw error;
      }

      if (!products || products.length === 0) {
        return 0;
      }

      console.log(`📦 Found ${products.length} low stock products`);

      let notificationCount = 0;

      // Notify each relevant user
      for (const user of users) {
        for (const product of products) {
          const productName =
            product.brand_name || product.generic_name || "Unknown Product";
          const isCritical =
            product.stock_in_pieces <= Math.floor(product.reorder_level * 0.3);

          if (isCritical) {
            await this.notifyCriticalStock(
              product.id,
              productName,
              product.stock_in_pieces,
              user.id
            );
          } else {
            await this.notifyLowStock(
              product.id,
              productName,
              product.stock_in_pieces,
              product.reorder_level,
              user.id
            );
          }

          notificationCount++;
        }
      }

      return notificationCount;
    } catch (error) {
      console.error("❌ Low stock check failed:", error);
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

      console.log(`📅 Found ${products.length} expiring products`);

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
      console.error("❌ Expiry check failed:", error);
      return 0;
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

      console.log(`🧹 Cleaned up ${data} old notifications`);
      return data;
    } catch (error) {
      console.error("❌ Cleanup failed:", error);
      return 0;
    }
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const notificationService = new NotificationService();
export default notificationService;
