/**
 * Professional Notification System
 * Unified, performant, and accessible notification management
 */

class NotificationSystem {
  constructor() {
    this.notifications = new Map();
    this.subscribers = new Set();
    this.config = {
      maxNotifications: 50,
      duplicateWindow: 5 * 60 * 1000, // 5 minutes
      cleanupInterval: 24 * 60 * 60 * 1000, // 24 hours
      backgroundCheckInterval: 15 * 60 * 1000, // 15 minutes
    };
    this.timers = {
      backgroundCheck: null,
      cleanup: null,
    };
    this.isInitialized = false;
  }

  // Notification Types with proper hierarchy
  static TYPES = {
    CRITICAL_STOCK: { id: 'critical_stock', priority: 1, persistent: true },
    EXPIRY_URGENT: { id: 'expiry_urgent', priority: 1, persistent: true },
    ERROR: { id: 'error', priority: 1, persistent: false },
    LOW_STOCK: { id: 'low_stock', priority: 2, persistent: true },
    EXPIRY_WARNING: { id: 'expiry_warning', priority: 2, persistent: true },
    REORDER_NEEDED: { id: 'reorder_needed', priority: 2, persistent: true },
    SALE_COMPLETED: { id: 'sale_completed', priority: 3, persistent: false },
    INVENTORY_UPDATED: { id: 'inventory_updated', priority: 3, persistent: false },
    PRODUCT_ADDED: { id: 'product_added', priority: 3, persistent: false },
    SYSTEM_INFO: { id: 'system_info', priority: 4, persistent: false },
  };

  // Storage keys
  static STORAGE = {
    NOTIFICATIONS: 'notifications_v2',
    DISMISSED: 'notifications_dismissed_v2',
    READ: 'notifications_read_v2',
    SETTINGS: 'notification_settings_v2',
  };

  /**
   * Initialize the notification system
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      await this.loadFromStorage();
      this.setupCleanupTimer();
      this.startBackgroundChecks();
      this.requestNotificationPermission();
      this.isInitialized = true;
      console.log('✅ NotificationSystem initialized');
    } catch (error) {
      console.error('❌ Failed to initialize NotificationSystem:', error);
      throw error;
    }
  }

  /**
   * Add a new notification with proper deduplication
   */
  addNotification(type, data = {}) {
    try {
      const typeConfig = NotificationSystem.TYPES[type];
      if (!typeConfig) {
        throw new Error(`Invalid notification type: ${type}`);
      }

      const notification = {
        id: this.generateId(type, data),
        type: typeConfig.id,
        title: this.generateTitle(type, data),
        message: this.generateMessage(type, data),
        timestamp: Date.now(),
        priority: typeConfig.priority,
        persistent: typeConfig.persistent,
        isRead: false,
        isDismissed: false,
        data: { ...data },
        metadata: {
          icon: this.getIcon(type),
          color: this.getColor(type),
          action: this.getAction(type, data),
        }
      };

      // Check for duplicates
      if (this.isDuplicate(notification)) {
        console.log('🔄 Duplicate notification prevented:', notification.id);
        return null;
      }

      // Add to memory
      this.notifications.set(notification.id, notification);

      // Persist to storage
      this.saveToStorage();

      // Notify subscribers
      this.notifySubscribers('added', notification);

      // Show desktop notification
      this.showDesktopNotification(notification);

      console.log('✅ Notification added:', notification.id);
      return notification;

    } catch (error) {
      console.error('❌ Error adding notification:', error);
      this.handleError('ADD_NOTIFICATION_FAILED', error);
      return null;
    }
  }

  /**
   * Get notifications with filtering and sorting
   */
  getNotifications(filters = {}) {
    try {
      let notifications = Array.from(this.notifications.values())
        .filter(n => !n.isDismissed)
        .filter(n => this.applyFilters(n, filters))
        .sort(this.sortNotifications);

      return notifications;
    } catch (error) {
      console.error('❌ Error getting notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId) {
    try {
      const notification = this.notifications.get(notificationId);
      if (!notification) return false;

      notification.isRead = true;
      this.saveToStorage();
      this.notifySubscribers('read', notification);
      return true;
    } catch (error) {
      console.error('❌ Error marking as read:', error);
      return false;
    }
  }

  /**
   * Dismiss notification
   */
  dismiss(notificationId) {
    try {
      const notification = this.notifications.get(notificationId);
      if (!notification) return false;

      notification.isDismissed = true;
      this.saveToStorage();
      this.notifySubscribers('dismissed', notification);
      return true;
    } catch (error) {
      console.error('❌ Error dismissing notification:', error);
      return false;
    }
  }

  /**
   * Subscribe to notification events
   */
  subscribe(callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }
    
    this.subscribers.add(callback);
    
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Get unread count
   */
  getUnreadCount() {
    return this.getNotifications().filter(n => !n.isRead).length;
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.stopBackgroundChecks();
    this.clearCleanupTimer();
    this.subscribers.clear();
    this.notifications.clear();
    this.isInitialized = false;
    console.log('🧹 NotificationSystem destroyed');
  }

  // Private methods

  generateId(type, data) {
    const base = `${type}_${data.productId || 'general'}_${Date.now()}`;
    return `${base}_${Math.random().toString(36).substr(2, 6)}`;
  }

  isDuplicate(newNotification) {
    const cutoff = Date.now() - this.config.duplicateWindow;
    return Array.from(this.notifications.values()).some(existing => 
      existing.type === newNotification.type &&
      existing.data?.productId === newNotification.data?.productId &&
      existing.timestamp > cutoff &&
      !existing.isDismissed
    );
  }

  applyFilters(notification, filters) {
    if (filters.type && notification.type !== filters.type) return false;
    if (filters.unreadOnly && notification.isRead) return false;
    if (filters.priority && notification.priority > filters.priority) return false;
    return true;
  }

  sortNotifications(a, b) {
    // Priority first (lower number = higher priority)
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    // Then by timestamp (newer first)
    return b.timestamp - a.timestamp;
  }

  notifySubscribers(event, notification) {
    this.subscribers.forEach(callback => {
      try {
        callback({ event, notification, system: this });
      } catch (error) {
        console.error('❌ Subscriber callback error:', error);
      }
    });
  }

  async loadFromStorage() {
    try {
      const stored = localStorage.getItem(NotificationSystem.STORAGE.NOTIFICATIONS);
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.forEach(notification => {
          this.notifications.set(notification.id, notification);
        });
      }
    } catch (error) {
      console.error('❌ Error loading from storage:', error);
    }
  }

  saveToStorage() {
    try {
      const notifications = Array.from(this.notifications.values())
        .filter(n => !n.isDismissed || n.persistent)
        .slice(0, this.config.maxNotifications);
      
      localStorage.setItem(
        NotificationSystem.STORAGE.NOTIFICATIONS, 
        JSON.stringify(notifications)
      );
    } catch (error) {
      console.error('❌ Error saving to storage:', error);
    }
  }

  setupCleanupTimer() {
    this.timers.cleanup = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  clearCleanupTimer() {
    if (this.timers.cleanup) {
      clearInterval(this.timers.cleanup);
      this.timers.cleanup = null;
    }
  }

  startBackgroundChecks() {
    if (this.timers.backgroundCheck) return;

    this.timers.backgroundCheck = setInterval(async () => {
      await this.runHealthChecks();
    }, this.config.backgroundCheckInterval);

    // Run initial check
    this.runHealthChecks();
  }

  stopBackgroundChecks() {
    if (this.timers.backgroundCheck) {
      clearInterval(this.timers.backgroundCheck);
      this.timers.backgroundCheck = null;
    }
  }

  async runHealthChecks() {
    try {
      await Promise.all([
        this.checkLowStock(),
        this.checkExpiringProducts(),
      ]);
    } catch (error) {
      console.error('❌ Health check failed:', error);
    }
  }

  async checkLowStock() {
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
          this.addNotification('CRITICAL_STOCK', {
            productId: product.id,
            productName: product.name,
            currentStock: stock,
            criticalLevel
          });
        } else if (stock <= reorderLevel) {
          this.addNotification('LOW_STOCK', {
            productId: product.id,
            productName: product.name,
            currentStock: stock,
            reorderLevel
          });
        }
      });
    } catch (error) {
      console.error('❌ Low stock check failed:', error);
    }
  }

  async checkExpiringProducts() {
    try {
      const { supabase } = await import('../config/supabase.js');
      if (!supabase) return;

      const today = new Date();
      const urgentDate = new Date(today);
      urgentDate.setDate(today.getDate() + 7);
      
      const warningDate = new Date(today);
      warningDate.setDate(today.getDate() + 30);

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
          this.addNotification('EXPIRY_URGENT', {
            productId: product.id,
            productName: product.name,
            expiryDate: product.expiry_date,
            daysUntilExpiry
          });
        } else if (daysUntilExpiry <= 30) {
          this.addNotification('EXPIRY_WARNING', {
            productId: product.id,
            productName: product.name,
            expiryDate: product.expiry_date,
            daysUntilExpiry
          });
        }
      });
    } catch (error) {
      console.error('❌ Expiry check failed:', error);
    }
  }

  cleanup() {
    try {
      const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days
      let cleaned = 0;

      for (const [id, notification] of this.notifications.entries()) {
        if (notification.isDismissed && notification.timestamp < cutoff) {
          this.notifications.delete(id);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        this.saveToStorage();
        console.log(`🧹 Cleaned ${cleaned} old notifications`);
      }
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  }

  async clearAll() {
    try {
      console.log('🧹 Clearing all notifications...');
      
      // Clear from database first
      if (this.supabase && this.currentUser) {
        const { error } = await this.supabase
          .from('notifications')
          .delete()
          .eq('user_id', this.currentUser.id);
        
        if (error) {
          console.warn('⚠️ Database clear failed, continuing with local clear:', error);
        } else {
          console.log('✅ Database notifications cleared');
        }
      }

      // Clear local notifications
      this.notifications.clear();
      
      // Clear local storage
      localStorage.removeItem('notifications');
      sessionStorage.removeItem('notifications');
      
      // Notify subscribers
      this.notifySubscribers();
      
      console.log('✅ All notifications cleared successfully');
      return true;
    } catch (error) {
      console.error('❌ Clear all failed:', error);
      this.handleError('CLEAR_ALL_FAILED', error);
      return false;
    }
  }

  async markAllAsRead() {
    try {
      console.log('📖 Marking all notifications as read...');
      
      const unreadIds = [];
      for (const [id, notification] of this.notifications.entries()) {
        if (!notification.isRead) {
          notification.isRead = true;
          notification.readAt = Date.now();
          unreadIds.push(id);
        }
      }

      if (unreadIds.length === 0) {
        console.log('ℹ️ No unread notifications to update');
        return true;
      }

      // Update database
      if (this.supabase && this.currentUser && unreadIds.length > 0) {
        const { error } = await this.supabase
          .from('notifications')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq('user_id', this.currentUser.id)
          .in('id', unreadIds);
        
        if (error) {
          console.warn('⚠️ Database update failed, continuing with local update:', error);
        }
      }

      // Save locally and notify
      this.saveToStorage();
      this.notifySubscribers();
      
      console.log(`✅ Marked ${unreadIds.length} notifications as read`);
      return true;
    } catch (error) {
      console.error('❌ Mark all as read failed:', error);
      this.handleError('MARK_ALL_READ_FAILED', error);
      return false;
    }
  }

  async requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }

  showDesktopNotification(notification) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const options = {
        body: notification.message,
        icon: '/vite.svg',
        tag: notification.type,
        requireInteraction: notification.persistent,
        timestamp: notification.timestamp,
      };

      const desktopNotification = new Notification(notification.title, options);
      
      // Auto-close non-persistent notifications
      if (!notification.persistent) {
        setTimeout(() => desktopNotification.close(), 5000);
      }
    }
  }

  generateTitle(type, data) {
    const titles = {
      CRITICAL_STOCK: '🚨 Critical Stock Alert',
      EXPIRY_URGENT: '⏰ Urgent: Expires Soon',
      ERROR: '❌ Error Alert',
      LOW_STOCK: '⚠️ Low Stock Warning',
      EXPIRY_WARNING: '📅 Expiry Warning',
      REORDER_NEEDED: '🛒 Reorder Needed',
      SALE_COMPLETED: '💰 Sale Completed',
      INVENTORY_UPDATED: '📦 Inventory Updated',
      PRODUCT_ADDED: '➕ Product Added',
      SYSTEM_INFO: 'ℹ️ System Information',
    };
    return titles[type] || 'Notification';
  }

  generateMessage(type, data) {
    switch (type) {
      case 'CRITICAL_STOCK':
        return `${data.productName} is critically low (${data.currentStock} left)`;
      case 'LOW_STOCK':
        return `${data.productName} is running low (${data.currentStock} left)`;
      case 'EXPIRY_URGENT':
        return `${data.productName} expires in ${data.daysUntilExpiry} days`;
      case 'EXPIRY_WARNING':
        return `${data.productName} expires on ${new Date(data.expiryDate).toLocaleDateString()}`;
      case 'SALE_COMPLETED':
        return `Sale of ${data.itemCount || 1} items for ₱${data.amount?.toFixed(2) || '0.00'}`;
      case 'INVENTORY_UPDATED':
        return data.details || `${data.productName} inventory updated`;
      case 'PRODUCT_ADDED':
        return `${data.productName} added to inventory`;
      default:
        return data.message || 'Notification';
    }
  }

  getIcon(type) {
    const icons = {
      CRITICAL_STOCK: 'AlertTriangle',
      EXPIRY_URGENT: 'Clock',
      ERROR: 'XCircle',
      LOW_STOCK: 'Package',
      EXPIRY_WARNING: 'Calendar',
      REORDER_NEEDED: 'ShoppingCart',
      SALE_COMPLETED: 'DollarSign',
      INVENTORY_UPDATED: 'Package',
      PRODUCT_ADDED: 'Plus',
      SYSTEM_INFO: 'Info',
    };
    return icons[type] || 'Bell';
  }

  getColor(type) {
    const colors = {
      CRITICAL_STOCK: 'text-red-600 bg-red-50 border-red-200',
      EXPIRY_URGENT: 'text-red-600 bg-red-50 border-red-200',
      ERROR: 'text-red-600 bg-red-50 border-red-200',
      LOW_STOCK: 'text-orange-600 bg-orange-50 border-orange-200',
      EXPIRY_WARNING: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      REORDER_NEEDED: 'text-purple-600 bg-purple-50 border-purple-200',
      SALE_COMPLETED: 'text-green-600 bg-green-50 border-green-200',
      INVENTORY_UPDATED: 'text-blue-600 bg-blue-50 border-blue-200',
      PRODUCT_ADDED: 'text-green-600 bg-green-50 border-green-200',
      SYSTEM_INFO: 'text-blue-600 bg-blue-50 border-blue-200',
    };
    return colors[type] || 'text-gray-600 bg-gray-50 border-gray-200';
  }

  getAction(type, data) {
    switch (type) {
      case 'CRITICAL_STOCK':
      case 'LOW_STOCK':
        return {
          label: 'View Product',
          url: `/inventory?search=${encodeURIComponent(data.productName)}`,
        };
      case 'EXPIRY_URGENT':
      case 'EXPIRY_WARNING':
        return {
          label: 'Check Inventory',
          url: `/inventory?filter=expiring`,
        };
      default:
        return null;
    }
  }

  handleError(code, error) {
    console.error(`[NotificationSystem] ${code}:`, error);
    
    // Could integrate with error reporting service
    if (window.errorReporting) {
      window.errorReporting.report({
        code,
        error: error.message,
        component: 'NotificationSystem',
        timestamp: Date.now(),
      });
    }
  }

  // Test method for debugging
  addTestNotification() {
    const testTypes = ['SYSTEM_INFO', 'LOW_STOCK', 'SALE_COMPLETED'];
    const randomType = testTypes[Math.floor(Math.random() * testTypes.length)];
    
    return this.addNotification(randomType, {
      productName: 'Test Product',
      currentStock: 3,
      total: 45.99,
      message: 'This is a test notification to verify the system works correctly.'
    });
  }
}

// Create singleton instance
const notificationSystem = new NotificationSystem();

export default notificationSystem;
export { NotificationSystem };