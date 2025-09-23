/**
 * Migration utility for transitioning from old notification system to new one
 */
import notificationSystem from './NotificationSystem';

export class NotificationMigration {
  /**
   * Migrate from legacy NotificationManager to new NotificationSystem
   */
  static async migrateFromLegacy() {
    try {
      console.log('🔄 Starting notification system migration...');
      
      // Check if legacy data exists
      const legacyData = this.getLegacyData();
      if (!legacyData || legacyData.length === 0) {
        console.log('✅ No legacy data to migrate');
        return { migrated: 0, errors: 0 };
      }

      let migrated = 0;
      let errors = 0;

      // Initialize new system
      await notificationSystem.initialize();

      // Migrate each legacy notification
      for (const legacyNotification of legacyData) {
        try {
          const newType = this.mapLegacyType(legacyNotification.type);
          if (newType) {
            notificationSystem.addNotification(newType, {
              ...legacyNotification.data,
              _legacy: true,
              _originalId: legacyNotification.id,
              _originalTimestamp: legacyNotification.timestamp
            });
            migrated++;
          }
        } catch (error) {
          console.error('❌ Failed to migrate notification:', legacyNotification.id, error);
          errors++;
        }
      }

      // Clean up legacy data after successful migration
      if (errors === 0) {
        this.cleanupLegacyData();
      }

      console.log(`✅ Migration complete: ${migrated} migrated, ${errors} errors`);
      return { migrated, errors };

    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  /**
   * Get legacy notification data
   */
  static getLegacyData() {
    try {
      const legacyKeys = [
        'pharmacy_notifications',
        'notifications_v1', 
        'medcure_notifications'
      ];
      
      for (const key of legacyKeys) {
        const data = localStorage.getItem(key);
        if (data) {
          return JSON.parse(data);
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error reading legacy data:', error);
      return null;
    }
  }

  /**
   * Map legacy notification types to new types
   */
  static mapLegacyType(legacyType) {
    const typeMap = {
      'low_stock': 'LOW_STOCK',
      'critical_stock': 'CRITICAL_STOCK',
      'expiry_warning': 'EXPIRY_WARNING',
      'expiry_critical': 'EXPIRY_URGENT',
      'transaction_success': 'SALE_COMPLETED',
      'sale_completed': 'SALE_COMPLETED',
      'inventory_update': 'INVENTORY_UPDATED',
      'product_added': 'PRODUCT_ADDED',
      'stock_adjustment': 'INVENTORY_UPDATED',
      'reorder_suggestion': 'REORDER_NEEDED',
      'system_alert': 'SYSTEM_INFO',
      'error_alert': 'ERROR'
    };

    return typeMap[legacyType] || null;
  }

  /**
   * Clean up legacy data after migration
   */
  static cleanupLegacyData() {
    try {
      const legacyKeys = [
        'pharmacy_notifications',
        'pharmacy_dismissed_notifications',
        'pharmacy_notification_read_status',
        'pharmacy_last_notification_check',
        'notifications_v1',
        'dismissed_notifications',
        'read_notifications',
        'notification_timestamps',
        'notifications_last_clear',
        'recent_transactions'
      ];

      legacyKeys.forEach(key => {
        localStorage.removeItem(key);
      });

      console.log('🧹 Legacy data cleaned up');
    } catch (error) {
      console.error('Error cleaning legacy data:', error);
    }
  }

  /**
   * Create compatibility wrapper for legacy code
   */
  static createLegacyWrapper() {
    // Create a wrapper that mimics the old NotificationManager API
    const legacyWrapper = {
      // Old API methods that delegate to new system
      addNotification: (type, data) => {
        const newType = this.mapLegacyType(type);
        if (newType) {
          return notificationSystem.addNotification(newType, data);
        }
        return null;
      },

      getNotifications: () => {
        return notificationSystem.getNotifications();
      },

      markAsRead: (id) => {
        return notificationSystem.markAsRead(id);
      },

      dismissNotification: (id) => {
        return notificationSystem.dismiss(id);
      },

      clearAllNotifications: () => {
        return notificationSystem.clearAll();
      },

      clearAll: () => {
        return notificationSystem.clearAll();
      },

      markAllAsRead: () => {
        return notificationSystem.markAllAsRead();
      },

      getUnreadCount: () => {
        return notificationSystem.getUnreadCount();
      },

      runAllChecks: async () => {
        await notificationSystem.runHealthChecks();
      },

      startBackgroundChecks: (intervalMinutes) => {
        // Background checks are now handled automatically
        console.log('Background checks are automatic in the new system');
      },

      stopBackgroundChecks: () => {
        // Background checks are now handled automatically
        console.log('Background checks are automatic in the new system');
      },

      // Test methods for debugging
      addTestNotification: () => {
        return notificationSystem.addTestNotification();
      },

      testNotification: () => {
        return notificationSystem.addTestNotification();
      },

      // Legacy notification types for backward compatibility
      NOTIFICATION_TYPES: {
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
      }
    };

    // Create SimpleNotificationService wrapper for legacy compatibility
    const simpleNotificationWrapper = {
      showSaleComplete: (total, itemCount) => {
        return notificationSystem.addNotification('SALE_COMPLETED', {
          total,
          itemCount,
          message: `Sale completed: ${itemCount} items for $${total}`
        });
      },

      checkAndNotifyLowStock: async () => {
        try {
          await notificationSystem.checkLowStock();
          return true;
        } catch (error) {
          console.error('❌ Low stock check failed:', error);
          return false;
        }
      },

      checkAndNotifyExpiring: async () => {
        try {
          await notificationSystem.checkExpiringProducts();
          return true;
        } catch (error) {
          console.error('❌ Expiry check failed:', error);
          return false;
        }
      },

      showSystemAlert: (message, isError = false) => {
        const type = isError ? 'ERROR' : 'SYSTEM_INFO';
        return notificationSystem.addNotification(type, { message });
      },

      // Manual trigger for testing
      runAllChecks: async () => {
        try {
          await notificationSystem.runHealthChecks();
          return true;
        } catch (error) {
          console.error('❌ Health checks failed:', error);
          return false;
        }
      }
    };

    // Make both wrappers available globally for legacy code
    if (typeof window !== 'undefined') {
      window.NotificationManager = legacyWrapper;
      window.SimpleNotificationService = simpleNotificationWrapper;
      window.addTransactionNotification = (type, details) => {
        return legacyWrapper.addNotification('sale_completed', details);
      };
    }

    return legacyWrapper;
  }

  /**
   * Validate migration success
   */
  static validateMigration() {
    try {
      const newNotifications = notificationSystem.getNotifications();
      const legacyData = this.getLegacyData();
      
      console.log('Migration validation:', {
        newSystemCount: newNotifications.length,
        legacyCount: legacyData?.length || 0,
        systemInitialized: notificationSystem.isInitialized
      });

      return {
        success: true,
        newSystemCount: newNotifications.length,
        legacyCount: legacyData?.length || 0
      };
    } catch (error) {
      console.error('Migration validation failed:', error);
      return { success: false, error: error.message };
    }
  }
}

export default NotificationMigration;