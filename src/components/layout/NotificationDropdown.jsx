import React, { useState, useEffect } from "react";
import { Bell, X, AlertTriangle, Package, Calendar, CheckCircle } from "lucide-react";
import { SimpleNotificationService } from "../../services/domains/notifications/simpleNotificationService";

/**
 * NotificationDropdown Component
 * 
 * SESSION-BASED NOTIFICATION SYSTEM:
 * - Uses sessionStorage for notification state (cleared on logout/browser close)
 * - Automatically cleans up old dismissed notifications (7+ days) to prevent buildup
 * - Notifications don't persist between different user sessions
 * - Stable notification IDs based on product ID and date to prevent duplicate notifications
 * - Proper notification count tracking for parent components
 */

// Helper function to calculate relative time
const getRelativeTime = (timestamp) => {
  const now = Date.now();
  const diff = now - (typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime());
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return 'Now';
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return `${days} day${days > 1 ? 's' : ''} ago`;
};

// Helper function to generate stable notification IDs that persist across sessions
const generateNotificationId = (type, productId, date = null) => {
  const today = date || new Date().toDateString();
  return `${type}-${productId}-${today}`;
};

// Helper function to clean up old dismissed notifications (older than 7 days)
const cleanupOldDismissedNotifications = () => {
  try {
    const dismissed = JSON.parse(sessionStorage.getItem('dismissed_notifications') || '[]');
    const timestamps = JSON.parse(sessionStorage.getItem('notification_timestamps') || '{}');
    const read = JSON.parse(sessionStorage.getItem('read_notifications') || '[]');
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    // Filter out old dismissed notifications
    const activeDismissed = dismissed.filter(id => {
      const timestamp = timestamps[id];
      return timestamp && timestamp > sevenDaysAgo;
    });
    
    // Filter out old read notifications  
    const activeRead = read.filter(id => {
      const timestamp = timestamps[id];
      return timestamp && timestamp > sevenDaysAgo;
    });
    
    // Update sessionStorage with cleaned data
    sessionStorage.setItem('dismissed_notifications', JSON.stringify(activeDismissed));
    sessionStorage.setItem('read_notifications', JSON.stringify(activeRead));
    
    // Clean up old timestamps too
    const activeTimestamps = {};
    Object.entries(timestamps).forEach(([id, timestamp]) => {
      if (timestamp > sevenDaysAgo) {
        activeTimestamps[id] = timestamp;
      }
    });
    sessionStorage.setItem('notification_timestamps', JSON.stringify(activeTimestamps));
    
    console.log(`✅ [NotificationDropdown] Cleaned up old notifications. Kept ${activeDismissed.length} dismissed, ${activeRead.length} read`);
  } catch (error) {
    console.error('❌ [NotificationDropdown] Error cleaning up old notifications:', error);
  }
};

// Export function to clear all notification data (useful for logout)
// This function is automatically called during logout to ensure notifications
// don't persist between different user sessions
export const clearAllNotificationData = () => {
  try {
    sessionStorage.removeItem('dismissed_notifications');
    sessionStorage.removeItem('read_notifications');
    sessionStorage.removeItem('notification_timestamps');
    sessionStorage.removeItem('notifications_last_clear');
    console.log('✅ [NotificationDropdown] Cleared all notification data for logout');
  } catch (error) {
    console.error('❌ [NotificationDropdown] Error clearing notification data:', error);
  }
};

// Debug function to inspect notification state (useful for troubleshooting)
export const debugNotificationState = () => {
  try {
    const dismissed = JSON.parse(sessionStorage.getItem('dismissed_notifications') || '[]');
    const read = JSON.parse(sessionStorage.getItem('read_notifications') || '[]');
    const timestamps = JSON.parse(sessionStorage.getItem('notification_timestamps') || '{}');
    const lastClear = sessionStorage.getItem('notifications_last_clear');
    
    console.group('🔍 [NotificationDropdown] Debug State');
    console.log('Dismissed notifications:', dismissed);
    console.log('Read notifications:', read);
    console.log('Timestamps:', timestamps);
    console.log('Last clear time:', lastClear ? new Date(parseInt(lastClear)).toLocaleString() : 'Never');
    console.groupEnd();
    
    return { dismissed, read, timestamps, lastClear };
  } catch (error) {
    console.error('❌ [NotificationDropdown] Error debugging notification state:', error);
    return null;
  }
};

export function NotificationDropdown({ isOpen, onClose, onNotificationClick, onNotificationCountChange }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dismissedNotifications, setDismissedNotifications] = useState(new Set());
  const [readNotifications, setReadNotifications] = useState(new Set());
  const [notificationTimestamps, setNotificationTimestamps] = useState(new Map());
  const [lastClearTime, setLastClearTime] = useState(0); // Track when notifications were last cleared

  // Initialize component state on mount (only once)
  useEffect(() => {
    // Clean up old dismissed notifications on component mount
    cleanupOldDismissedNotifications();
    
    // Load dismissed notifications from sessionStorage (only persists during session)
    const dismissed = JSON.parse(sessionStorage.getItem('dismissed_notifications') || '[]');
    setDismissedNotifications(new Set(dismissed));
    
    // Load read notifications from sessionStorage (only persists during session)
    const read = JSON.parse(sessionStorage.getItem('read_notifications') || '[]');
    setReadNotifications(new Set(read));
    
    // Load notification timestamps from sessionStorage (only persists during session)
    const timestamps = JSON.parse(sessionStorage.getItem('notification_timestamps') || '{}');
    setNotificationTimestamps(new Map(Object.entries(timestamps)));
    
    // Load last clear time to prevent immediate reappearance
    const lastClear = parseInt(sessionStorage.getItem('notifications_last_clear') || '0');
    setLastClearTime(lastClear);
    
    // Load initial notifications
    loadNotifications();
  }, []); // Only run once on mount

  // Handle dropdown open/close and intervals
  useEffect(() => {
    if (isOpen) {
      console.log('🔔 [NotificationDropdown] Dropdown opened - refreshing notifications');
      // Refresh notifications when dropdown opens
      loadNotifications();
      
      // Real-time updates: refresh notifications every 30 seconds while open
      const refreshInterval = setInterval(() => {
        console.log('🔄 [NotificationDropdown] Auto-refreshing notifications');
        loadNotifications();
      }, 30000); // Refresh every 30 seconds
      
      // Update timestamps every minute while open
      const timestampInterval = setInterval(() => {
        setNotifications(prev => 
          prev.map(notification => ({
            ...notification,
            time: getRelativeTime(notification.timestamp)
          }))
        );
      }, 60000); // Update every minute
      
      return () => {
        console.log('🔔 [NotificationDropdown] Dropdown closed - clearing intervals');
        clearInterval(refreshInterval);
        clearInterval(timestampInterval);
      };
    }
  }, [isOpen]);

  // Sync notification count whenever notifications change
  useEffect(() => {
    const unreadCount = notifications.filter(n => !n.isRead).length;
    console.log(`🔢 [NotificationDropdown] Updating count: ${unreadCount} unread notifications`);
    if (onNotificationCountChange) {
      onNotificationCountChange(unreadCount);
    }
  }, [notifications, onNotificationCountChange]);

  const loadNotifications = async () => {
    setLoading(true);
    console.log('🔄 [NotificationDropdown] Loading notifications...');
    
    try {
      // Get fresh state from sessionStorage to ensure we have latest data
      const currentDismissed = new Set(JSON.parse(sessionStorage.getItem('dismissed_notifications') || '[]'));
      const currentLastClear = parseInt(sessionStorage.getItem('notifications_last_clear') || '0');
      
      // Check if notifications were recently cleared (within last 5 minutes)
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      if (currentLastClear > fiveMinutesAgo) {
        console.log('⏳ [NotificationDropdown] Skipping reload - notifications recently cleared');
        setNotifications([]);
        setLoading(false);
        return;
      }
      
      // Get recent notifications
      const recentNotifications = getRecentNotifications();
      
      // Get individual low stock and expiring products
      const lowStockProducts = await getLowStockProducts();
      const expiringProducts = await getExpiringProducts();
      
      const today = new Date().toDateString();
      const timestamp = Date.now();
      
      // Create individual notifications for each low stock product, but ONLY if not dismissed
      const lowStockNotifications = (lowStockProducts || [])
        .map((product, index) => {
          const notificationId = generateNotificationId('low-stock', product.id || index);
          
          // Skip if this notification was already dismissed (use fresh data)
          if (currentDismissed.has(notificationId)) {
            console.log(`⏭️ [NotificationDropdown] Skipping dismissed notification: ${notificationId}`);
            return null;
          }
          
          // Use existing timestamp if available, otherwise create new one
          let timestamp;
          if (notificationTimestamps.has(notificationId)) {
            timestamp = notificationTimestamps.get(notificationId);
          } else {
            timestamp = Date.now() - (index * 1000); // Stagger by 1 second each
            // Store new timestamp for session
            const newTimestamps = new Map(notificationTimestamps);
            newTimestamps.set(notificationId, timestamp);
            setNotificationTimestamps(newTimestamps);
            sessionStorage.setItem('notification_timestamps', JSON.stringify(Object.fromEntries(newTimestamps)));
          }
          
          return {
            id: notificationId,
            type: 'warning',
            title: 'Low Stock Alert',
            message: `${product.name || 'Unknown Product'} is running low (${product.stock_in_pieces || 0} left)`,
            time: getRelativeTime(timestamp),
            timestamp: timestamp,
            icon: Package,
            color: 'text-red-600 bg-red-50',
            persistent: true,
            productId: product.id
          };
        })
        .filter(notification => notification !== null); // Remove null entries (dismissed notifications)
      
      // Create individual notifications for each expiring product, but ONLY if not dismissed
      const expiringNotifications = (expiringProducts || [])
        .map((product, index) => {
          const expiryDate = product.expiry_date ? new Date(product.expiry_date).toLocaleDateString() : 'unknown date';
          const notificationId = generateNotificationId('expiring', product.id || index);
          
          // Skip if this notification was already dismissed (use fresh data)
          if (currentDismissed.has(notificationId)) {
            console.log(`⏭️ [NotificationDropdown] Skipping dismissed notification: ${notificationId}`);
            return null;
          }
          
          // Use existing timestamp if available, otherwise create new one
          let timestamp;
          if (notificationTimestamps.has(notificationId)) {
            timestamp = notificationTimestamps.get(notificationId);
          } else {
            timestamp = Date.now() + (index * 1000); // Stagger by 1 second each, newer than low stock
            // Store new timestamp for session
            const newTimestamps = new Map(notificationTimestamps);
            newTimestamps.set(notificationId, timestamp);
            setNotificationTimestamps(newTimestamps);
            sessionStorage.setItem('notification_timestamps', JSON.stringify(Object.fromEntries(newTimestamps)));
          }
          
          return {
            id: notificationId,
            type: 'warning',
            title: 'Expiry Warning',
            message: `${product.name || 'Unknown Product'} expires soon (${expiryDate})`,
            time: getRelativeTime(timestamp),
            timestamp: timestamp,
            icon: Calendar,
            color: 'text-yellow-600 bg-yellow-50',
            persistent: true,
            productId: product.id
          };
        })
        .filter(notification => notification !== null); // Remove null entries (dismissed notifications)

      const allNotifications = [
        ...lowStockNotifications,
        ...expiringNotifications,
        ...recentNotifications
      ];

      // Get fresh read notifications from sessionStorage to ensure we have latest state
      const currentReadNotifications = new Set(JSON.parse(sessionStorage.getItem('read_notifications') || '[]'));
      
      // Filter out dismissed notifications, add read status, and sort by newest first
      const activeNotifications = allNotifications
        .filter(notification => !currentDismissed.has(notification.id))
        .map(notification => ({
          ...notification,
          isRead: currentReadNotifications.has(notification.id),
          timestamp: notification.timestamp || Date.now() // Ensure all have timestamps in milliseconds
        }))
        .sort((a, b) => b.timestamp - a.timestamp); // Newest first (simple numeric comparison)

      // Update state with fresh data from sessionStorage
      setDismissedNotifications(currentDismissed);
      setReadNotifications(currentReadNotifications);
      setLastClearTime(currentLastClear);
      
      setNotifications(activeNotifications);
      console.log(`✅ [NotificationDropdown] Loaded ${activeNotifications.length} notifications`);
    
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([{
        id: 'error',
        type: 'error',
        title: 'System Alert',
        message: 'Unable to load notifications',
        time: 'Now',
        icon: AlertTriangle,
        color: 'text-red-600 bg-red-50'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const getLowStockProducts = async () => {
    try {
      // Import supabase client  
      const { supabase } = await import('../../config/supabase.js');
      
      if (!supabase) {
        console.warn('Supabase client not available');
        return [];
      }
      
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, stock_in_pieces, reorder_level')
        .lte('stock_in_pieces', 100); // Get products with stock <= 100 to check against reorder levels
      
      if (error) {
        console.error('Database error fetching low stock products:', error);
        // Return empty array instead of throwing
        return [];
      }
      
      // Additional filtering if needed
      const lowStockProducts = products?.filter(product => 
        product.stock_in_pieces <= Math.max(product.reorder_level || 5, 10)
      ) || [];
      
      return lowStockProducts;
    } catch (error) {
      console.error('Error getting low stock products:', error);
      // Return empty array to prevent app crash
      return [];
    }
  };

  const getExpiringProducts = async () => {
    try {
      // Import supabase client
      const { supabase } = await import('../../config/supabase.js');
      
      if (!supabase) {
        console.warn('Supabase client not available');
        return [];
      }
      
      // Calculate date 30 days from now (products expiring within 30 days)
      const today = new Date().toISOString().split('T')[0];
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      const expiryThreshold = thirtyDaysFromNow.toISOString().split('T')[0];
      
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, expiry_date')
        .not('expiry_date', 'is', null)
        .gte('expiry_date', today)
        .lte('expiry_date', expiryThreshold);
      
      if (error) {
        console.error('Database error fetching expiring products:', error);
        // Return empty array instead of throwing
        return [];
      }
      
      return products || [];
    } catch (error) {
      console.error('Error getting expiring products:', error);
      // Return empty array to prevent app crash
      return [];
    }
  };

  const getRecentNotifications = () => {
    // Generate sample recent notifications (in real app, this would come from your app state or API)
    const notifications = [];
    
    // You can add logic here to get recent activity from your app state
    // For example, if you have a recent sales context or prop:
    // if (recentSales?.length > 0) {
    //   notifications.push({
    //     id: 'recent-sale',
    //     type: 'success',
    //     title: 'Recent Sale',
    //     message: `Sale completed: ₱${recentSales[0]?.total_amount || '0.00'}`,
    //     time: '5 min ago',
    //     icon: CheckCircle,
    //     color: 'text-green-600 bg-green-50'
    //   });
    // }

    return notifications.slice(0, 5); // Limit to 5 recent notifications
  };

  const handleNotificationClick = (notification) => {
    console.log('Notification clicked, current isRead:', notification.isRead);
    
    // Don't process if already read
    if (notification.isRead) {
      if (onNotificationClick) {
        onNotificationClick(notification);
      }
      return;
    }
    
    // Mark notification as read
    const newRead = new Set([...readNotifications, notification.id]);
    setReadNotifications(newRead);
    sessionStorage.setItem('read_notifications', JSON.stringify([...newRead]));
    
    // Update the notification in state immediately
    const updatedNotifications = notifications.map(n => 
      n.id === notification.id ? { ...n, isRead: true } : n
    );
    
    setNotifications(updatedNotifications);
    
    console.log('Notification marked as read:', notification.id);
    
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  const clearAll = () => {
    // Add all current notification IDs to dismissed list
    const allIds = notifications.map(n => n.id);
    const newDismissed = new Set([...dismissedNotifications, ...allIds]);
    setDismissedNotifications(newDismissed);
    
    // Track when notifications were cleared
    const clearTime = Date.now();
    setLastClearTime(clearTime);
    
    // Save to sessionStorage (cleared on logout/close browser)
    sessionStorage.setItem('dismissed_notifications', JSON.stringify([...newDismissed]));
    sessionStorage.setItem('notifications_last_clear', clearTime.toString());
    
    // Clear current notifications display
    setNotifications([]);
    
    console.log('✅ [NotificationDropdown] Cleared all notifications at', new Date(clearTime).toLocaleTimeString());
  };

  const removeNotification = (notificationId) => {
    // Add to dismissed notifications
    const newDismissed = new Set([...dismissedNotifications, notificationId]);
    setDismissedNotifications(newDismissed);
    
    // Save to sessionStorage
    sessionStorage.setItem('dismissed_notifications', JSON.stringify([...newDismissed]));
    
    // Clean up timestamp for dismissed notification to prevent buildup
    const newTimestamps = new Map(notificationTimestamps);
    newTimestamps.delete(notificationId);
    setNotificationTimestamps(newTimestamps);
    sessionStorage.setItem('notification_timestamps', JSON.stringify(Object.fromEntries(newTimestamps)));
    
    // Remove from current display
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              SimpleNotificationService.runDailyChecks();
              // Force refresh bypassing clear time check
              setLastClearTime(0);
              loadNotifications();
            }}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Refresh
          </button>
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="text-xs text-red-600 hover:text-red-800 font-medium"
            >
              Clear All
            </button>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No new notifications</p>
            <p className="text-sm text-gray-500 mt-1">
              You're all caught up! 🎉
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notifications.map((notification) => {
              const Icon = notification.icon;
              return (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors group cursor-pointer ${notification.isRead ? 'opacity-90' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`relative flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${notification.color}`}>
                      <Icon className="h-4 w-4" />
                      {!notification.isRead && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium ${notification.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                          {notification.title}
                        </p>
                      </div>
                      <p className={`text-sm mt-1 ${notification.isRead ? 'text-gray-500' : 'text-gray-600'}`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {notification.time}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(notification.id);
                      }}
                      className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-opacity p-1 rounded"
                      title="Remove notification"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>


    </div>
  );
}

export default NotificationDropdown;