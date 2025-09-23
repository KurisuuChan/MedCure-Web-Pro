/**
 * Comprehensive Notification Manager
 * Handles all types of notifications with persistent storage and real-time updates
 */

export class NotificationManager {
  static NOTIFICATION_TYPES = {
    LOW_STOCK: 'low_stock',
    CRITICAL_STOCK: 'critical_stock',
    EXPIRY_WARNING: 'expiry_warning', 
    EXPIRY_CRITICAL: 'expiry_critical',
    TRANSACTION_SUCCESS: 'transaction_success',
    SALE_COMPLETED: 'sale_completed',
    INVENTORY_UPDATE: 'inventory_update',
    PRODUCT_ADDED: 'product_added',
    STOCK_ADJUSTMENT: 'stock_adjustment',
    REORDER_SUGGESTION: 'reorder_suggestion',
    SYSTEM_ALERT: 'system_alert',
    ERROR_ALERT: 'error_alert'
  };

  static STORAGE_KEYS = {
    NOTIFICATIONS: 'pharmacy_notifications',
    DISMISSED: 'pharmacy_dismissed_notifications', 
    READ_STATUS: 'pharmacy_notification_read_status',
    LAST_CHECK: 'pharmacy_last_notification_check'
  };

  // Get all active notifications from localStorage
  static getNotifications() {
    try {
      const notifications = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.NOTIFICATIONS) || '[]');
      const dismissed = new Set(JSON.parse(localStorage.getItem(this.STORAGE_KEYS.DISMISSED) || '[]'));
      const readStatus = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.READ_STATUS) || '{}');
      
      // Filter out dismissed notifications and add read status
      return notifications
        .filter(notification => !dismissed.has(notification.id))
        .map(notification => ({
          ...notification,
          isRead: readStatus[notification.id] || false
        }))
        .sort((a, b) => b.timestamp - a.timestamp); // Recent first
    } catch (error) {
      console.error('Error loading notifications:', error);
      return [];
    }
  }

  // Add a new notification
  static addNotification(type, data = {}) {
    try {
      const notification = {
        id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        title: this.getNotificationTitle(type, data),
        message: this.getNotificationMessage(type, data),
        timestamp: Date.now(),
        icon: this.getNotificationIcon(type),
        color: this.getNotificationColor(type),
        priority: this.getNotificationPriority(type),
        persistent: this.isNotificationPersistent(type),
        data: data
      };

      // Get existing notifications
      const existingNotifications = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.NOTIFICATIONS) || '[]');
      
      // Check for duplicates (prevent spam)
      const isDuplicate = existingNotifications.some(existing => 
        existing.type === type && 
        existing.data?.productId === data.productId &&
        Date.now() - existing.timestamp < 300000 // 5 minutes
      );
      
      if (isDuplicate) {
        console.log('Duplicate notification prevented:', type, data);
        return null;
      }

      // Add new notification
      const updatedNotifications = [notification, ...existingNotifications];
      
      // Keep only last 100 notifications to prevent storage bloat
      const limitedNotifications = updatedNotifications.slice(0, 100);
      
      // Save to localStorage
      localStorage.setItem(this.STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(limitedNotifications));
      
      // Show desktop notification if available
      this.showDesktopNotification(notification);
      
      // Trigger custom event for UI updates
      window.dispatchEvent(new CustomEvent('notificationAdded', { detail: notification }));
      
      console.log('✅ Added notification:', notification);
      return notification;
    } catch (error) {
      console.error('❌ Error adding notification:', error);
      return null;
    }
  }

  // Mark notification as read
  static markAsRead(notificationId) {
    try {
      const readStatus = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.READ_STATUS) || '{}');
      readStatus[notificationId] = true;
      localStorage.setItem(this.STORAGE_KEYS.READ_STATUS, JSON.stringify(readStatus));
      
      // Trigger UI update
      window.dispatchEvent(new CustomEvent('notificationRead', { detail: notificationId }));
      console.log('📖 Marked notification as read:', notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Mark all notifications as read
  static markAllAsRead() {
    try {
      const notifications = this.getNotifications();
      const readStatus = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.READ_STATUS) || '{}');
      
      notifications.forEach(notification => {
        readStatus[notification.id] = true;
      });
      
      localStorage.setItem(this.STORAGE_KEYS.READ_STATUS, JSON.stringify(readStatus));
      
      // Trigger UI update
      window.dispatchEvent(new CustomEvent('allNotificationsRead'));
      console.log('📖 Marked all notifications as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  // Dismiss (remove) notification
  static dismissNotification(notificationId) {
    try {
      const dismissed = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.DISMISSED) || '[]');
      dismissed.push(notificationId);
      localStorage.setItem(this.STORAGE_KEYS.DISMISSED, JSON.stringify(dismissed));
      
      // Trigger UI update
      window.dispatchEvent(new CustomEvent('notificationDismissed', { detail: notificationId }));
      console.log('🗑️ Dismissed notification:', notificationId);
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  }

  // Clear all notifications
  static clearAllNotifications() {
    try {
      const notifications = this.getNotifications();
      const dismissed = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.DISMISSED) || '[]');
      
      // Add all current notification IDs to dismissed list
      notifications.forEach(notification => {
        dismissed.push(notification.id);
      });
      
      localStorage.setItem(this.STORAGE_KEYS.DISMISSED, JSON.stringify(dismissed));
      
      // Trigger UI update
      window.dispatchEvent(new CustomEvent('allNotificationsCleared'));
      console.log('🗑️ Cleared all notifications');
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  }

  // Get unread count
  static getUnreadCount() {
    return this.getNotifications().filter(n => !n.isRead).length;
  }

  // Cleanup old notifications and dismissed IDs (call periodically)
  static cleanup() {
    try {
      const cutoffTime = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days
      
      // Clean old notifications
      const notifications = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.NOTIFICATIONS) || '[]');
      const activeNotifications = notifications.filter(n => n.timestamp > cutoffTime);
      localStorage.setItem(this.STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(activeNotifications));
      
      // Clean old dismissed IDs (keep only recent)
      const dismissed = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.DISMISSED) || '[]');
      const activeNotificationIds = new Set(activeNotifications.map(n => n.id));
      const relevantDismissed = dismissed.filter(id => activeNotificationIds.has(id));
      localStorage.setItem(this.STORAGE_KEYS.DISMISSED, JSON.stringify(relevantDismissed));
      
      console.log('🧹 Notification cleanup completed');
    } catch (error) {
      console.error('Error during notification cleanup:', error);
    }
  }

  // Check for low stock and create notifications
  static async checkLowStock() {
    try {
      const { supabase } = await import('../config/supabase.js');
      if (!supabase) return;

      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, stock_in_pieces, reorder_level')
        .gt('stock_in_pieces', 0);

      if (error) throw error;

      products?.forEach(product => {
        const stock = product.stock_in_pieces;
        const reorderLevel = product.reorder_level || 10;
        const criticalLevel = Math.max(Math.floor(reorderLevel * 0.5), 5);

        if (stock <= criticalLevel) {
          this.addNotification(this.NOTIFICATION_TYPES.CRITICAL_STOCK, {
            productId: product.id,
            productName: product.name,
            currentStock: stock,
            criticalLevel
          });
        } else if (stock <= reorderLevel) {
          this.addNotification(this.NOTIFICATION_TYPES.LOW_STOCK, {
            productId: product.id,
            productName: product.name,
            currentStock: stock,
            reorderLevel
          });
        }
      });
    } catch (error) {
      console.error('Error checking low stock:', error);
    }
  }

  // Check for expiring products
  static async checkExpiring() {
    try {
      const { supabase } = await import('../config/supabase.js');
      if (!supabase) return;

      const today = new Date();
      const criticalDate = new Date(today);
      criticalDate.setDate(today.getDate() + 7); // 7 days
      
      const warningDate = new Date(today);
      warningDate.setDate(today.getDate() + 30); // 30 days

      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, expiry_date')
        .not('expiry_date', 'is', null)
        .gte('expiry_date', today.toISOString().split('T')[0])
        .lte('expiry_date', warningDate.toISOString().split('T')[0]);

      if (error) throw error;

      products?.forEach(product => {
        const expiryDate = new Date(product.expiry_date);
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry <= 7) {
          this.addNotification(this.NOTIFICATION_TYPES.EXPIRY_CRITICAL, {
            productId: product.id,
            productName: product.name,
            expiryDate: product.expiry_date,
            daysUntilExpiry
          });
        } else if (daysUntilExpiry <= 30) {
          this.addNotification(this.NOTIFICATION_TYPES.EXPIRY_WARNING, {
            productId: product.id,
            productName: product.name,
            expiryDate: product.expiry_date,
            daysUntilExpiry
          });
        }
      });
    } catch (error) {
      console.error('Error checking expiring products:', error);
    }
  }

  // Run all checks
  static async runAllChecks() {
    await Promise.all([
      this.checkLowStock(),
      this.checkExpiring()
    ]);
    
    // Update last check time
    localStorage.setItem(this.STORAGE_KEYS.LAST_CHECK, Date.now().toString());
  }

  // Helper methods for notification properties
  static getNotificationTitle(type, data) {
    const titles = {
      [this.NOTIFICATION_TYPES.CRITICAL_STOCK]: '🚨 Critical Stock Alert',
      [this.NOTIFICATION_TYPES.LOW_STOCK]: '⚠️ Low Stock Warning',
      [this.NOTIFICATION_TYPES.EXPIRY_CRITICAL]: '⏰ Expires Soon',
      [this.NOTIFICATION_TYPES.EXPIRY_WARNING]: '📅 Expiry Warning',
      [this.NOTIFICATION_TYPES.TRANSACTION_SUCCESS]: '✅ Transaction Complete',
      [this.NOTIFICATION_TYPES.SALE_COMPLETED]: '💰 Sale Completed',
      [this.NOTIFICATION_TYPES.INVENTORY_UPDATE]: '📦 Inventory Updated',
      [this.NOTIFICATION_TYPES.PRODUCT_ADDED]: '➕ Product Added',
      [this.NOTIFICATION_TYPES.STOCK_ADJUSTMENT]: '🔄 Stock Adjusted',
      [this.NOTIFICATION_TYPES.REORDER_SUGGESTION]: '🛒 Reorder Suggested',
      [this.NOTIFICATION_TYPES.SYSTEM_ALERT]: 'ℹ️ System Alert',
      [this.NOTIFICATION_TYPES.ERROR_ALERT]: '❌ Error Alert'
    };
    return titles[type] || 'Notification';
  }

  static getNotificationMessage(type, data) {
    switch (type) {
      case this.NOTIFICATION_TYPES.CRITICAL_STOCK:
        return `${data.productName} is critically low (${data.currentStock} left)`;
      case this.NOTIFICATION_TYPES.LOW_STOCK:
        return `${data.productName} is running low (${data.currentStock} left)`;
      case this.NOTIFICATION_TYPES.EXPIRY_CRITICAL:
        return `${data.productName} expires in ${data.daysUntilExpiry} days`;
      case this.NOTIFICATION_TYPES.EXPIRY_WARNING:
        return `${data.productName} expires on ${new Date(data.expiryDate).toLocaleDateString()}`;
      case this.NOTIFICATION_TYPES.SALE_COMPLETED:
        return `Sale of ${data.itemCount || 1} items for ₱${data.amount?.toFixed(2) || '0.00'}`;
      case this.NOTIFICATION_TYPES.INVENTORY_UPDATE:
        return `${data.productName} inventory updated successfully`;
      case this.NOTIFICATION_TYPES.PRODUCT_ADDED:
        return `${data.productName} added to inventory`;
      case this.NOTIFICATION_TYPES.STOCK_ADJUSTMENT:
        return `${data.productName} stock quantity adjusted`;
      case this.NOTIFICATION_TYPES.REORDER_SUGGESTION:
        return `Consider reordering ${data.productName}`;
      default:
        return data.message || 'Notification';
    }
  }

  static getNotificationIcon(type) {
    const icons = {
      [this.NOTIFICATION_TYPES.CRITICAL_STOCK]: 'AlertTriangle',
      [this.NOTIFICATION_TYPES.LOW_STOCK]: 'Package',
      [this.NOTIFICATION_TYPES.EXPIRY_CRITICAL]: 'Clock',
      [this.NOTIFICATION_TYPES.EXPIRY_WARNING]: 'Calendar',
      [this.NOTIFICATION_TYPES.TRANSACTION_SUCCESS]: 'CheckCircle',
      [this.NOTIFICATION_TYPES.SALE_COMPLETED]: 'DollarSign',
      [this.NOTIFICATION_TYPES.INVENTORY_UPDATE]: 'Package',
      [this.NOTIFICATION_TYPES.PRODUCT_ADDED]: 'Plus',
      [this.NOTIFICATION_TYPES.STOCK_ADJUSTMENT]: 'Edit',
      [this.NOTIFICATION_TYPES.REORDER_SUGGESTION]: 'ShoppingCart',
      [this.NOTIFICATION_TYPES.SYSTEM_ALERT]: 'Info',
      [this.NOTIFICATION_TYPES.ERROR_ALERT]: 'XCircle'
    };
    return icons[type] || 'Bell';
  }

  static getNotificationColor(type) {
    const colors = {
      [this.NOTIFICATION_TYPES.CRITICAL_STOCK]: 'text-red-600 bg-red-50',
      [this.NOTIFICATION_TYPES.LOW_STOCK]: 'text-orange-600 bg-orange-50',
      [this.NOTIFICATION_TYPES.EXPIRY_CRITICAL]: 'text-red-600 bg-red-50',
      [this.NOTIFICATION_TYPES.EXPIRY_WARNING]: 'text-yellow-600 bg-yellow-50',
      [this.NOTIFICATION_TYPES.TRANSACTION_SUCCESS]: 'text-green-600 bg-green-50',
      [this.NOTIFICATION_TYPES.SALE_COMPLETED]: 'text-green-600 bg-green-50',
      [this.NOTIFICATION_TYPES.INVENTORY_UPDATE]: 'text-blue-600 bg-blue-50',
      [this.NOTIFICATION_TYPES.PRODUCT_ADDED]: 'text-green-600 bg-green-50',
      [this.NOTIFICATION_TYPES.STOCK_ADJUSTMENT]: 'text-blue-600 bg-blue-50',
      [this.NOTIFICATION_TYPES.REORDER_SUGGESTION]: 'text-purple-600 bg-purple-50',
      [this.NOTIFICATION_TYPES.SYSTEM_ALERT]: 'text-blue-600 bg-blue-50',
      [this.NOTIFICATION_TYPES.ERROR_ALERT]: 'text-red-600 bg-red-50'
    };
    return colors[type] || 'text-gray-600 bg-gray-50';
  }

  static getNotificationPriority(type) {
    const priorities = {
      [this.NOTIFICATION_TYPES.CRITICAL_STOCK]: 1,
      [this.NOTIFICATION_TYPES.EXPIRY_CRITICAL]: 1,
      [this.NOTIFICATION_TYPES.ERROR_ALERT]: 1,
      [this.NOTIFICATION_TYPES.LOW_STOCK]: 2,
      [this.NOTIFICATION_TYPES.EXPIRY_WARNING]: 2,
      [this.NOTIFICATION_TYPES.REORDER_SUGGESTION]: 2,
      [this.NOTIFICATION_TYPES.TRANSACTION_SUCCESS]: 3,
      [this.NOTIFICATION_TYPES.SALE_COMPLETED]: 3,
      [this.NOTIFICATION_TYPES.INVENTORY_UPDATE]: 3,
      [this.NOTIFICATION_TYPES.PRODUCT_ADDED]: 3,
      [this.NOTIFICATION_TYPES.STOCK_ADJUSTMENT]: 3,
      [this.NOTIFICATION_TYPES.SYSTEM_ALERT]: 3
    };
    return priorities[type] || 3;
  }

  static isNotificationPersistent(type) {
    const persistent = [
      this.NOTIFICATION_TYPES.CRITICAL_STOCK,
      this.NOTIFICATION_TYPES.LOW_STOCK,
      this.NOTIFICATION_TYPES.EXPIRY_CRITICAL,
      this.NOTIFICATION_TYPES.EXPIRY_WARNING
    ];
    return persistent.includes(type);
  }

  // Show desktop notification if permission granted
  static showDesktopNotification(notification) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/vite.svg',
        tag: notification.type,
        requireInteraction: notification.persistent
      });
    }
  }

  // Request notification permission
  static async requestPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      return await Notification.requestPermission();
    }
    return Notification.permission;
  }

  // Start background notification checks
  static startBackgroundChecks(intervalMinutes = 15) {
    // Clear any existing interval
    if (this.backgroundCheckInterval) {
      clearInterval(this.backgroundCheckInterval);
    }

    // Run checks immediately
    this.runAllChecks();

    // Set up periodic checks
    this.backgroundCheckInterval = setInterval(() => {
      console.log('🔄 [NotificationManager] Running background notification checks');
      this.runAllChecks();
    }, intervalMinutes * 60 * 1000);

    console.log(`✅ [NotificationManager] Background checks started (every ${intervalMinutes} minutes)`);
  }

  // Stop background notification checks
  static stopBackgroundChecks() {
    if (this.backgroundCheckInterval) {
      clearInterval(this.backgroundCheckInterval);
      this.backgroundCheckInterval = null;
      console.log('⏹️ [NotificationManager] Background checks stopped');
    }
  }

  // Test function to manually trigger a notification (for debugging)
  static testNotification() {
    this.addNotification(this.NOTIFICATION_TYPES.SYSTEM_ALERT, {
      message: 'Test notification - system is working correctly!',
      details: 'This is a test notification triggered manually'
    });
    console.log('🧪 Test notification triggered');
  }
}

// Initialize background checks interval holder
NotificationManager.backgroundCheckInterval = null;

// Make it available globally for testing in browser console
if (typeof window !== 'undefined') {
  window.testNotifications = () => {
    console.log('🧪 Testing notification system...');
    NotificationManager.testNotification();
    setTimeout(() => {
      NotificationManager.runAllChecks();
    }, 1000);
  };
}

export default NotificationManager;