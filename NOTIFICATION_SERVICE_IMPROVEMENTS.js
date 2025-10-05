// ============================================================================
// NOTIFICATION SERVICE IMPROVEMENTS
// ============================================================================
// Add these methods to your NotificationService.js file
// ============================================================================

// First, install date-fns for better timestamp handling
// npm install date-fns

import { formatDistanceToNow, format, parseISO } from 'date-fns';

// ============================================================================
// 1. ADD OUT OF STOCK CHECK (Add to NotificationService class)
// ============================================================================

/**
 * Check for out of stock products (CRITICAL)
 * @private
 */
async checkOutOfStock(users) {
  try {
    const { data: products, error } = await supabase
      .from("products")
      .select("id, brand_name, generic_name, stock_in_pieces, category")
      .eq("stock_in_pieces", 0) // Exactly zero stock
      .eq("is_active", true);

    if (error) throw error;
    if (!products || products.length === 0) return 0;

    console.log(`🚨 Found ${products.length} OUT OF STOCK products`);

    let notificationCount = 0;

    for (const user of users) {
      for (const product of products) {
        const productName = product.brand_name || product.generic_name || "Unknown";
        
        // Check if already notified recently (prevent spam)
        if (this.isDuplicate(user.id, 'out_of_stock', product.id)) {
          continue;
        }

        await this.create({
          userId: user.id,
          title: "🚨 OUT OF STOCK - URGENT",
          message: `${productName} is completely out of stock! Reorder immediately to avoid sales loss.`,
          type: NOTIFICATION_TYPE.ERROR,
          priority: NOTIFICATION_PRIORITY.CRITICAL, // Will send email!
          category: NOTIFICATION_CATEGORY.INVENTORY,
          metadata: {
            productId: product.id,
            productName: productName,
            category: product.category,
            currentStock: 0,
            urgency: 'critical',
            actionUrl: `/inventory?product=${product.id}&action=reorder`,
          },
        });

        this.markAsRecent(user.id, 'out_of_stock', product.id);
        notificationCount++;
      }
    }

    return notificationCount;
  } catch (error) {
    console.error("❌ Out of stock check failed:", error);
    return 0;
  }
}

// ============================================================================
// 2. UPDATE runHealthChecks TO INCLUDE OUT OF STOCK
// ============================================================================

// REPLACE your existing runHealthChecks method with this:
async runHealthChecks() {
  try {
    console.log("🔍 Running notification health checks...");

    // Get active users who should receive notifications
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, email, role")
      .eq("is_active", true)
      .in("role", ["admin", "manager", "pharmacist"]);

    if (usersError) throw usersError;
    if (!users || users.length === 0) {
      console.log("ℹ️ No active users found for notifications");
      return;
    }

    console.log(`👥 Found ${users.length} users to check`);

    // Run all checks in parallel
    const [outOfStockCount, lowStockCount, expiringCount] = await Promise.all([
      this.checkOutOfStock(users),      // ✅ NEW!
      this.checkLowStock(users),
      this.checkExpiringProducts(users),
    ]);

    console.log(
      `✅ Health checks completed: ${outOfStockCount} out of stock, ${lowStockCount} low stock, ${expiringCount} expiring products`
    );
  } catch (error) {
    console.error("❌ Health check failed:", error);
    // ... existing error handling ...
  }
}

// ============================================================================
// 3. IMPROVED markAsRead WITH TIMESTAMP
// ============================================================================

// REPLACE your existing markAsRead method:
async markAsRead(notificationId, userId) {
  try {
    const now = new Date().toISOString();
    
    const { error } = await supabase
      .from("user_notifications")
      .update({ 
        is_read: true,
        read_at: now,      // ✅ Track when read
        updated_at: now     // ✅ Track update time
      })
      .eq("id", notificationId)
      .eq("user_id", userId)
      .is("deleted_at", null); // Don't update deleted notifications

    if (error) {
      console.error("❌ Failed to mark as read:", error);
      await this.logError(notificationId, userId, 'database', error.message);
      return false;
    }

    console.log(`✅ Marked notification ${notificationId} as read`);
    return true;
  } catch (error) {
    console.error("❌ Mark as read error:", error);
    return false;
  }
}

// ============================================================================
// 4. IMPROVED markAllAsRead WITH BETTER PERFORMANCE
// ============================================================================

// REPLACE your existing markAllAsRead method:
async markAllAsRead(userId) {
  try {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from("user_notifications")
      .update({ 
        is_read: true,
        read_at: supabase.sql`COALESCE(read_at, NOW())`, // Only set if not already set
        updated_at: now
      })
      .eq("user_id", userId)
      .eq("is_read", false)
      .is("deleted_at", null)
      .select('id');

    if (error) {
      console.error("❌ Failed to mark all as read:", error);
      await this.logError(null, userId, 'database', error.message);
      return false;
    }

    const count = data?.length || 0;
    console.log(`✅ Marked ${count} notifications as read for user ${userId}`);
    return true;
  } catch (error) {
    console.error("❌ Mark all as read error:", error);
    return false;
  }
}

// ============================================================================
// 5. ADD USER PREFERENCES CHECK
// ============================================================================

/**
 * Check if user wants to receive this notification
 * @private
 */
async shouldNotifyUser(userId, category, priority) {
  try {
    const { data: prefs, error } = await supabase
      .from("user_notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error || !prefs) {
      // Default: allow all notifications if no preferences set
      return true;
    }

    // Check quiet hours (except for critical notifications)
    if (prefs.quiet_hours_enabled && priority > NOTIFICATION_PRIORITY.CRITICAL) {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 8);
      const start = prefs.quiet_hours_start;
      const end = prefs.quiet_hours_end;

      // Check if current time is within quiet hours
      if (start < end) {
        if (currentTime >= start && currentTime <= end) {
          console.log(`⏸️ Quiet hours active for user ${userId}`);
          return false;
        }
      } else {
        // Quiet hours cross midnight
        if (currentTime >= start || currentTime <= end) {
          console.log(`⏸️ Quiet hours active for user ${userId}`);
          return false;
        }
      }
    }

    // Check category preferences
    switch (category) {
      case NOTIFICATION_CATEGORY.INVENTORY:
        return prefs.notify_low_stock || prefs.notify_out_of_stock;
      case NOTIFICATION_CATEGORY.EXPIRY:
        return prefs.notify_expiring || prefs.notify_expired;
      case NOTIFICATION_CATEGORY.SALES:
        return prefs.notify_sales;
      case NOTIFICATION_CATEGORY.SYSTEM:
        return prefs.notify_system;
      default:
        return true;
    }
  } catch (error) {
    console.error("❌ Failed to check user preferences:", error);
    return true; // Default: allow notification on error
  }
}

// ============================================================================
// 6. UPDATE create() METHOD TO CHECK PREFERENCES
// ============================================================================

// UPDATE your existing create() method - add this check at the beginning:
async create(notification) {
  try {
    // Validate required fields
    if (!notification.userId || !notification.title || !notification.message) {
      console.error("❌ Invalid notification:", notification);
      return null;
    }

    // ✅ NEW: Check user preferences BEFORE creating
    const shouldNotify = await this.shouldNotifyUser(
      notification.userId,
      notification.category,
      notification.priority
    );

    if (!shouldNotify) {
      console.log(`⏸️ Notification blocked by user preferences for user ${notification.userId}`);
      return null;
    }

    // ... rest of your existing create() code ...
  } catch (error) {
    console.error("❌ Notification creation failed:", error);
    await this.logError(null, notification.userId, 'database', error.message);
    throw error;
  }
}

// ============================================================================
// 7. ADD BULK CREATE FOR PERFORMANCE
// ============================================================================

/**
 * Create multiple notifications at once (bulk insert)
 * Much faster than creating one-by-one
 */
async createBulk(notifications) {
  try {
    // Validate all notifications
    const validNotifications = notifications.filter(
      n => n.userId && n.title && n.message
    );

    if (validNotifications.length === 0) {
      console.warn("⚠️ No valid notifications to create");
      return [];
    }

    console.log(`📦 Creating ${validNotifications.length} notifications in bulk`);

    // Check preferences for each user (in parallel)
    const notificationsToCreate = await Promise.all(
      validNotifications.map(async (notification) => {
        const shouldNotify = await this.shouldNotifyUser(
          notification.userId,
          notification.category,
          notification.priority
        );
        return shouldNotify ? notification : null;
      })
    );

    // Filter out blocked notifications
    const allowedNotifications = notificationsToCreate.filter(n => n !== null);

    if (allowedNotifications.length === 0) {
      console.log("⏸️ All notifications blocked by user preferences");
      return [];
    }

    // Prepare bulk data
    const bulkData = allowedNotifications.map(notification => ({
      user_id: notification.userId,
      title: this.sanitizeText(notification.title),
      message: this.sanitizeText(notification.message),
      type: notification.type || NOTIFICATION_TYPE.INFO,
      priority: notification.priority || NOTIFICATION_PRIORITY.MEDIUM,
      category: notification.category || NOTIFICATION_CATEGORY.GENERAL,
      metadata: notification.metadata || {},
      is_read: false,
      created_at: new Date().toISOString(),
    }));

    // Bulk insert
    const { data, error } = await supabase
      .from("user_notifications")
      .insert(bulkData)
      .select();

    if (error) {
      console.error("❌ Bulk notification creation failed:", error);
      return [];
    }

    console.log(`✅ Created ${data.length} notifications in bulk`);
    return data;
  } catch (error) {
    console.error("❌ Bulk create error:", error);
    return [];
  }
}

// ============================================================================
// 8. ADD NOTIFICATION STATISTICS
// ============================================================================

/**
 * Get notification statistics for a user
 */
async getStats(userId, dateFrom = null, dateTo = null) {
  try {
    let query = supabase
      .from("user_notifications")
      .select("type, category, priority, is_read, created_at, read_at")
      .eq("user_id", userId)
      .is("deleted_at", null);

    if (dateFrom) {
      query = query.gte("created_at", dateFrom);
    }
    if (dateTo) {
      query = query.lte("created_at", dateTo);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Calculate statistics
    const readNotifications = data.filter(n => n.is_read && n.read_at);
    const avgReadTime = readNotifications.length > 0
      ? readNotifications.reduce((sum, n) => {
          const readTime = new Date(n.read_at) - new Date(n.created_at);
          return sum + readTime;
        }, 0) / readNotifications.length / 1000 // Convert to seconds
      : 0;

    const stats = {
      total: data.length,
      unread: data.filter(n => !n.is_read).length,
      read: data.filter(n => n.is_read).length,
      byType: {
        error: data.filter(n => n.type === NOTIFICATION_TYPE.ERROR).length,
        warning: data.filter(n => n.type === NOTIFICATION_TYPE.WARNING).length,
        success: data.filter(n => n.type === NOTIFICATION_TYPE.SUCCESS).length,
        info: data.filter(n => n.type === NOTIFICATION_TYPE.INFO).length,
      },
      byCategory: {
        inventory: data.filter(n => n.category === NOTIFICATION_CATEGORY.INVENTORY).length,
        expiry: data.filter(n => n.category === NOTIFICATION_CATEGORY.EXPIRY).length,
        sales: data.filter(n => n.category === NOTIFICATION_CATEGORY.SALES).length,
        system: data.filter(n => n.category === NOTIFICATION_CATEGORY.SYSTEM).length,
      },
      byPriority: {
        critical: data.filter(n => n.priority === NOTIFICATION_PRIORITY.CRITICAL).length,
        high: data.filter(n => n.priority === NOTIFICATION_PRIORITY.HIGH).length,
        medium: data.filter(n => n.priority === NOTIFICATION_PRIORITY.MEDIUM).length,
        low: data.filter(n => n.priority === NOTIFICATION_PRIORITY.LOW).length,
      },
      averageReadTimeSeconds: Math.round(avgReadTime),
      oldestNotification: data.length > 0 ? data[data.length - 1].created_at : null,
      newestNotification: data.length > 0 ? data[0].created_at : null,
    };

    return stats;
  } catch (error) {
    console.error("❌ Failed to get stats:", error);
    return null;
  }
}

// ============================================================================
// 9. ADD CLEANUP METHOD
// ============================================================================

/**
 * Cleanup old notifications (soft delete read notifications older than 30 days)
 * Call this from a scheduled task (daily/weekly)
 */
async cleanupOldNotifications() {
  try {
    console.log("🧹 Starting notification cleanup...");

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from("user_notifications")
      .update({ deleted_at: new Date().toISOString() })
      .eq("is_read", true)
      .lt("created_at", thirtyDaysAgo.toISOString())
      .is("deleted_at", null)
      .select('id');

    if (error) throw error;

    const count = data?.length || 0;
    console.log(`✅ Soft deleted ${count} old notifications`);
    return count;
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
    return 0;
  }
}

// ============================================================================
// 10. ADD ERROR LOGGING
// ============================================================================

/**
 * Log notification error to database
 * @private
 */
async logError(notificationId, userId, errorType, errorMessage) {
  try {
    await supabase.from("notification_errors").insert({
      notification_id: notificationId,
      user_id: userId,
      error_type: errorType,
      error_message: errorMessage,
      error_stack: new Error().stack,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Failed to log error:", error);
  }
}

// ============================================================================
// 11. ADD SEARCH/FILTER METHOD
// ============================================================================

/**
 * Search and filter notifications
 */
async search(userId, options = {}) {
  try {
    let query = supabase
      .from("user_notifications")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null);

    // Search by text
    if (options.searchQuery) {
      query = query.or(
        `title.ilike.%${options.searchQuery}%,message.ilike.%${options.searchQuery}%`
      );
    }

    // Filter by category
    if (options.category && options.category !== 'all') {
      query = query.eq("category", options.category);
    }

    // Filter by type
    if (options.type && options.type !== 'all') {
      query = query.eq("type", options.type);
    }

    // Filter by priority
    if (options.priority) {
      query = query.eq("priority", options.priority);
    }

    // Filter by read status
    if (options.isRead !== undefined) {
      query = query.eq("is_read", options.isRead);
    }

    // Date range
    if (options.dateFrom) {
      query = query.gte("created_at", options.dateFrom);
    }
    if (options.dateTo) {
      query = query.lte("created_at", options.dateTo);
    }

    // Sort
    const sortBy = options.sortBy || 'created_at';
    const sortOrder = options.sortOrder || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Pagination
    const limit = options.limit || 20;
    const offset = options.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      notifications: data || [],
      total: count || 0,
      hasMore: (count || 0) > offset + limit,
    };
  } catch (error) {
    console.error("❌ Search failed:", error);
    return { notifications: [], total: 0, hasMore: false };
  }
}

// ============================================================================
// 12. EXPORT UPDATED SERVICE
// ============================================================================

// Make sure to export your updated NotificationService instance
export default new NotificationService();
export const notificationService = new NotificationService();
