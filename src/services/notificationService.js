import { supabase } from "../config/supabase";

/**
 * Smart Notification Service
 * Handles real-time notifications, alerts, and notification management
 */
export class NotificationService {
  // ==================== NOTIFICATION TYPES ====================
  static NOTIFICATION_TYPES = {
    LOW_STOCK: "low_stock",
    EXPIRY_WARNING: "expiry_warning", 
    SALES_TARGET: "sales_target",
    SYSTEM_ALERT: "system_alert",
    REORDER_SUGGESTION: "reorder_suggestion",
    DAILY_REPORT: "daily_report",
    WEEKLY_REPORT: "weekly_report",
    CRITICAL_ERROR: "critical_error"
  };

  static PRIORITY_LEVELS = {
    LOW: "low",
    MEDIUM: "medium", 
    HIGH: "high",
    CRITICAL: "critical"
  };

  // ==================== REAL-TIME ALERTS ====================

  /**
   * Get active notifications for the current user
   */
  static async getActiveNotifications(userId) {
    try {
      const { data: notifications, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .eq("read", false)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      return notifications.map(notification => ({
        ...notification,
        timeAgo: this.getTimeAgo(notification.created_at),
        priorityColor: this.getPriorityColor(notification.priority),
        icon: this.getNotificationIcon(notification.type)
      }));
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return [];
    }
  }

  /**
   * Create a new notification
   */
  static async createNotification(userId, notification) {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .insert({
          user_id: userId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          priority: notification.priority || this.PRIORITY_LEVELS.MEDIUM,
          data: notification.data || {},
          read: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Broadcast real-time notification
      this.broadcastNotification(data);

      return data;
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId) {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true, read_at: new Date().toISOString() })
        .eq("id", notificationId);

      if (error) throw error;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for user
   */
  static async markAllAsRead(userId) {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true, read_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("read", false);

      if (error) throw error;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  }

  /**
   * Delete notification
   */
  static async deleteNotification(notificationId) {
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting notification:", error);
      throw error;
    }
  }

  // ==================== AUTOMATED ALERT GENERATION ====================

  /**
   * Generate low stock alerts
   */
  static async generateLowStockAlerts() {
    try {
      const { data: lowStockProducts, error } = await supabase
        .from("products")
        .select("*")
        .lte("stock_in_pieces", 10)
        .gt("stock_in_pieces", 0);

      if (error) throw error;

      const adminUsers = await this.getAdminUsers();

      for (const product of lowStockProducts) {
        for (const admin of adminUsers) {
          await this.createNotification(admin.id, {
            type: this.NOTIFICATION_TYPES.LOW_STOCK,
            title: "Low Stock Alert",
            message: `${product.name} is running low (${product.stock_in_pieces} pieces remaining)`,
            priority: product.stock_in_pieces <= 5 ? this.PRIORITY_LEVELS.HIGH : this.PRIORITY_LEVELS.MEDIUM,
            data: { product_id: product.id, current_stock: product.stock_in_pieces }
          });
        }
      }

      return lowStockProducts;
    } catch (error) {
      console.error("Error generating low stock alerts:", error);
      return [];
    }
  }

  /**
   * Generate expiry warnings
   */
  static async generateExpiryWarnings() {
    try {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const { data: expiringProducts, error } = await supabase
        .from("products")
        .select("*")
        .not("expiry_date", "is", null)
        .lte("expiry_date", thirtyDaysFromNow.toISOString())
        .order("expiry_date", { ascending: true });

      if (error) throw error;

      const adminUsers = await this.getAdminUsers();

      for (const product of expiringProducts) {
        const daysToExpiry = Math.ceil(
          (new Date(product.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)
        );

        const priority = daysToExpiry <= 7 
          ? this.PRIORITY_LEVELS.CRITICAL 
          : daysToExpiry <= 14 
          ? this.PRIORITY_LEVELS.HIGH 
          : this.PRIORITY_LEVELS.MEDIUM;

        for (const admin of adminUsers) {
          await this.createNotification(admin.id, {
            type: this.NOTIFICATION_TYPES.EXPIRY_WARNING,
            title: "Product Expiry Warning",
            message: `${product.name} expires in ${daysToExpiry} days (${product.expiry_date})`,
            priority,
            data: { 
              product_id: product.id, 
              expiry_date: product.expiry_date,
              days_to_expiry: daysToExpiry 
            }
          });
        }
      }

      return expiringProducts;
    } catch (error) {
      console.error("Error generating expiry warnings:", error);
      return [];
    }
  }

  /**
   * Generate daily sales report notifications
   */
  static async generateDailySalesReport() {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      const { data: todaySales, error } = await supabase
        .from("sales")
        .select("total_amount")
        .gte("created_at", startOfDay.toISOString())
        .lte("created_at", endOfDay.toISOString());

      if (error) throw error;

      const totalRevenue = todaySales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
      const totalTransactions = todaySales.length;

      const adminUsers = await this.getAdminUsers();

      const reportMessage = `Today's Performance: ${totalTransactions} transactions, ₹${totalRevenue.toFixed(2)} revenue`;

      for (const admin of adminUsers) {
        await this.createNotification(admin.id, {
          type: this.NOTIFICATION_TYPES.DAILY_REPORT,
          title: "Daily Sales Report",
          message: reportMessage,
          priority: this.PRIORITY_LEVELS.LOW,
          data: { 
            total_revenue: totalRevenue,
            total_transactions: totalTransactions,
            date: today.toISOString().split('T')[0]
          }
        });
      }

      return { totalRevenue, totalTransactions };
    } catch (error) {
      console.error("Error generating daily sales report:", error);
      return null;
    }
  }

  // ==================== NOTIFICATION PREFERENCES ====================

  /**
   * Get user notification preferences
   */
  static async getNotificationPreferences(userId) {
    try {
      const { data: preferences, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      // Return default preferences if none exist
      return preferences || {
        email_notifications: true,
        browser_notifications: true,
        low_stock_alerts: true,
        expiry_warnings: true,
        sales_reports: true,
        system_alerts: true,
        notification_frequency: "immediate" // immediate, hourly, daily
      };
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
      return this.getDefaultPreferences();
    }
  }

  /**
   * Update user notification preferences
   */
  static async updateNotificationPreferences(userId, preferences) {
    try {
      const { data, error } = await supabase
        .from("notification_preferences")
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      throw error;
    }
  }

  // ==================== REAL-TIME SUBSCRIPTIONS ====================

  /**
   * Subscribe to real-time notifications
   */
  static subscribeToNotifications(userId, callback) {
    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const notification = {
            ...payload.new,
            timeAgo: this.getTimeAgo(payload.new.created_at),
            priorityColor: this.getPriorityColor(payload.new.priority),
            icon: this.getNotificationIcon(payload.new.type)
          };
          callback(notification);
        }
      )
      .subscribe();

    return subscription;
  }

  /**
   * Broadcast notification to all connected clients
   */
  static broadcastNotification(notification) {
    // Browser notification if permission granted
    if (Notification.permission === "granted") {
      new Notification(notification.title, {
        body: notification.message,
        icon: "/vite.svg",
        tag: notification.id
      });
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get admin users for notifications
   */
  static async getAdminUsers() {
    try {
      const { data: users, error } = await supabase
        .from("users")
        .select("id, email, first_name, last_name")
        .eq("role", "admin");

      if (error) throw error;
      return users || [];
    } catch (error) {
      console.error("Error fetching admin users:", error);
      return [];
    }
  }

  /**
   * Get time ago string for notification
   */
  static getTimeAgo(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  }

  /**
   * Get priority color for notification
   */
  static getPriorityColor(priority) {
    const colors = {
      [this.PRIORITY_LEVELS.LOW]: "text-blue-600 bg-blue-100",
      [this.PRIORITY_LEVELS.MEDIUM]: "text-yellow-600 bg-yellow-100", 
      [this.PRIORITY_LEVELS.HIGH]: "text-orange-600 bg-orange-100",
      [this.PRIORITY_LEVELS.CRITICAL]: "text-red-600 bg-red-100"
    };
    return colors[priority] || colors[this.PRIORITY_LEVELS.MEDIUM];
  }

  /**
   * Get notification icon based on type
   */
  static getNotificationIcon(type) {
    const icons = {
      [this.NOTIFICATION_TYPES.LOW_STOCK]: "📦",
      [this.NOTIFICATION_TYPES.EXPIRY_WARNING]: "⚠️",
      [this.NOTIFICATION_TYPES.SALES_TARGET]: "🎯",
      [this.NOTIFICATION_TYPES.SYSTEM_ALERT]: "🔔",
      [this.NOTIFICATION_TYPES.REORDER_SUGGESTION]: "🔄",
      [this.NOTIFICATION_TYPES.DAILY_REPORT]: "📊",
      [this.NOTIFICATION_TYPES.WEEKLY_REPORT]: "📈",
      [this.NOTIFICATION_TYPES.CRITICAL_ERROR]: "🚨"
    };
    return icons[type] || "🔔";
  }

  /**
   * Get default notification preferences
   */
  static getDefaultPreferences() {
    return {
      email_notifications: true,
      browser_notifications: true,
      low_stock_alerts: true,
      expiry_warnings: true,
      sales_reports: true,
      system_alerts: true,
      notification_frequency: "immediate"
    };
  }

  /**
   * Request browser notification permission
   */
  static async requestNotificationPermission() {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }
    return false;
  }
}
