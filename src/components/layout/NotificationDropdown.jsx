import React, { useState, useEffect } from "react";
import {
  Bell,
  X,
  AlertTriangle,
  Package,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Plus,
  Edit,
  ShoppingCart,
  Info,
  XCircle,
} from "lucide-react";
import notificationService from "../../services/notifications/NotificationService";
import { useAuth } from "../../hooks/useAuth";

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
  const diff =
    now -
    (typeof timestamp === "number" ? timestamp : new Date(timestamp).getTime());
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "Now";
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  return `${days} day${days > 1 ? "s" : ""} ago`;
};

// Helper function to convert icon names to components
const getIconComponent = (iconName) => {
  const iconMap = {
    Package: Package,
    Calendar: Calendar,
    AlertTriangle: AlertTriangle,
    Clock: Clock,
    DollarSign: DollarSign,
    Plus: Plus,
    Edit: Edit,
    ShoppingCart: ShoppingCart,
    Info: Info,
    XCircle: XCircle,
  };
  return iconMap[iconName] || AlertTriangle;
};

// Export function to add transaction success notifications
export const addTransactionNotification = (type, details = {}) => {
  try {
    const transaction = {
      id: Date.now().toString(),
      type,
      timestamp: Date.now(),
      ...details,
    };

    // Get existing transactions
    const existingTransactions = JSON.parse(
      sessionStorage.getItem("recent_transactions") || "[]"
    );

    // Add new transaction to the beginning and limit to 10 most recent
    const updatedTransactions = [transaction, ...existingTransactions].slice(
      0,
      10
    );

    // Save to sessionStorage
    sessionStorage.setItem(
      "recent_transactions",
      JSON.stringify(updatedTransactions)
    );

    // Also show desktop notification if available
    if (window.SimpleNotificationService) {
      window.SimpleNotificationService.showTransactionSuccess(type, details);
    }

    console.log(
      "✅ [NotificationDropdown] Added transaction notification:",
      transaction
    );
    return transaction;
  } catch (error) {
    console.error(
      "❌ [NotificationDropdown] Error adding transaction notification:",
      error
    );
    return null;
  }
};

// Export function to clear all notification data (useful for logout)
export const clearAllNotificationData = () => {
  try {
    notificationSystem.clearAll();
    console.log(
      "✅ [NotificationDropdown] Cleared all notification data for logout"
    );
  } catch (error) {
    console.error("Error clearing notification data:", error);
  }
};

export function NotificationDropdown({
  isOpen,
  onClose,
  onNotificationClick,
  onNotificationCountChange,
}) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [realtimeSubscription, setRealtimeSubscription] = useState(null);

  // Setup real-time WebSocket subscription and notification event listeners
  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      try {
        const { supabase } = await import("../../config/supabase.js");

        if (supabase) {
          const subscription = supabase
            .channel("notification-updates")
            .on(
              "postgres_changes",
              {
                event: "*",
                schema: "public",
                table: "products",
              },
              (payload) => {
                console.log(
                  "🔄 [NotificationDropdown] Real-time product update:",
                  payload
                );
                // Run notification checks when products change
                notificationSystem.runHealthChecks();
                loadNotifications();
              }
            )
            .on(
              "postgres_changes",
              {
                event: "*",
                schema: "public",
                table: "sales",
              },
              (payload) => {
                console.log(
                  "🔄 [NotificationDropdown] Real-time sale update:",
                  payload
                );
                // Run checks after sales to update stock levels
                setTimeout(() => {
                  notificationSystem.runHealthChecks();
                  loadNotifications();
                }, 1000);
              }
            )
            .subscribe();

          setRealtimeSubscription(subscription);
          console.log(
            "🔔 [NotificationDropdown] Real-time subscription established"
          );
        }
      } catch (error) {
        console.error(
          "❌ [NotificationDropdown] Error setting up real-time subscription:",
          error
        );
      }
    };

    // Setup notification event listeners
    const handleNotificationAdded = () => loadNotifications();
    const handleNotificationRead = () => loadNotifications();
    const handleNotificationDismissed = () => loadNotifications();
    const handleAllNotificationsRead = () => loadNotifications();
    const handleAllNotificationsCleared = () => loadNotifications();

    window.addEventListener("notificationAdded", handleNotificationAdded);
    window.addEventListener("notificationRead", handleNotificationRead);
    window.addEventListener(
      "notificationDismissed",
      handleNotificationDismissed
    );
    window.addEventListener("allNotificationsRead", handleAllNotificationsRead);
    window.addEventListener(
      "allNotificationsCleared",
      handleAllNotificationsCleared
    );

    setupRealtimeSubscription();

    return () => {
      if (realtimeSubscription) {
        realtimeSubscription.unsubscribe();
        console.log("🔔 [NotificationDropdown] Real-time subscription closed");
      }

      // Cleanup event listeners
      window.removeEventListener("notificationAdded", handleNotificationAdded);
      window.removeEventListener("notificationRead", handleNotificationRead);
      window.removeEventListener(
        "notificationDismissed",
        handleNotificationDismissed
      );
      window.removeEventListener(
        "allNotificationsRead",
        handleAllNotificationsRead
      );
      window.removeEventListener(
        "allNotificationsCleared",
        handleAllNotificationsCleared
      );
    };
  }, []);

  // Initialize component on mount
  useEffect(() => {
    // Make notification functions globally available
    window.NotificationManager = notificationService;
    window.addTransactionNotification = async (type, details) => {
      const user = await notificationService.getCurrentUser();
      return notificationService.create({
        userId: user?.id,
        title: "Sale Completed",
        message: `Transaction completed - ${details.customerName || "Walk-in"}`,
        type: "success",
        priority: 2,
        category: "sales",
        metadata: details,
      });
    };

    // Run initial health check
    notificationService.checkHealth().then(() => {
      loadNotifications();
    });

    // ✅ REMOVED: Duplicate health check interval
    // Health checks are already handled by App.jsx every 15 minutes
    // No need to run them here as well
  }, []); // Only run once on mount

  // Handle dropdown open/close - load notifications when opened
  useEffect(() => {
    if (isOpen) {
      console.log(
        "🔔 [NotificationDropdown] Dropdown opened - loading notifications"
      );
      loadNotifications();

      // Update timestamps every 30 seconds while open
      const timestampInterval = setInterval(() => {
        setNotifications((prev) =>
          prev.map((notification) => ({
            ...notification,
            time: getRelativeTime(notification.timestamp),
          }))
        );
      }, 30000); // Update every 30 seconds

      return () => {
        console.log(
          "🔔 [NotificationDropdown] Dropdown closed - clearing intervals"
        );
        clearInterval(timestampInterval);
      };
    }
  }, [isOpen]);

  // Background polling for notifications even when dropdown is closed
  useEffect(() => {
    // ✅ REMOVED: Aggressive 15-second polling
    // Real-time subscriptions via Supabase should handle updates automatically
    // The NotificationBell component already subscribes to real-time updates
    // No need for constant polling here
  }, [isOpen]);

  // Sync notification count whenever notifications change
  useEffect(() => {
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    console.log(
      `🔢 [NotificationDropdown] Updating count: ${unreadCount} unread notifications`
    );
    if (onNotificationCountChange) {
      onNotificationCountChange(unreadCount);
    }
  }, [notifications, onNotificationCountChange]);

  // Mark all notifications as read when dropdown is opened
  useEffect(() => {
    if (isOpen && notifications.length > 0) {
      const unreadNotifications = notifications.filter((n) => !n.isRead);
      if (unreadNotifications.length > 0) {
        console.log(
          `📖 [NotificationDropdown] Marking ${unreadNotifications.length} notifications as read`
        );

        // Mark all as read using the notificationSystem
        unreadNotifications.forEach((notification) => {
          notificationSystem.markAsRead(notification.id);
        });

        // Reload notifications to reflect the changes
        loadNotifications();
      }
    }
  }, [isOpen, notifications.length]); // Only depend on isOpen and notifications.length to avoid infinite loops

  const loadNotifications = () => {
    setLoading(true);
    console.log("🔄 [NotificationDropdown] Loading notifications...");

    try {
      // Get notifications from the new manager
      const allNotifications = notificationSystem.getNotifications();

      // Convert to display format with icons
      const displayNotifications = allNotifications.map((notification) => ({
        ...notification,
        time: getRelativeTime(notification.timestamp),
        icon: getIconComponent(notification.icon),
      }));

      setNotifications(displayNotifications);
      console.log(
        `✅ [NotificationDropdown] Loaded ${displayNotifications.length} notifications`
      );
    } catch (error) {
      console.error("Error loading notifications:", error);
      setNotifications([
        {
          id: "error",
          type: "error",
          title: "System Alert",
          message: "Unable to load notifications",
          time: "Now",
          icon: AlertTriangle,
          color: "text-red-600 bg-red-50",
          isRead: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = (notification) => {
    console.log("Notification clicked, current isRead:", notification.isRead);

    // Don't process if already read
    if (notification.isRead) {
      if (onNotificationClick) {
        onNotificationClick(notification);
      }
      return;
    }

    // Mark notification as read using the manager
    notificationSystem.markAsRead(notification.id);

    // Reload notifications to reflect the change
    loadNotifications();

    console.log("Notification marked as read:", notification.id);

    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  const clearAll = () => {
    // Dismiss all current notifications using the manager
    notifications.forEach((notification) => {
      notificationSystem.dismiss(notification.id);
    });

    // Clear display immediately
    setNotifications([]);

    console.log("✅ [NotificationDropdown] Cleared all notifications");
  };

  const removeNotification = (notificationId) => {
    // Dismiss notification using the manager
    notificationSystem.dismiss(notificationId);

    // Update display immediately
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
        <div className="flex items-center space-x-3">
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
            <p className="text-sm text-gray-600 mt-2">
              Loading notifications...
            </p>
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
                  className={`p-4 hover:bg-gray-50 transition-colors group cursor-pointer ${
                    notification.isRead ? "opacity-90" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-3">
                    <div
                      className={`relative flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${notification.color}`}
                    >
                      <Icon className="h-4 w-4" />
                      {!notification.isRead && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p
                          className={`text-sm font-medium ${
                            notification.isRead
                              ? "text-gray-700"
                              : "text-gray-900"
                          }`}
                        >
                          {notification.title}
                        </p>
                      </div>
                      <p
                        className={`text-sm mt-1 ${
                          notification.isRead
                            ? "text-gray-500"
                            : "text-gray-600"
                        }`}
                      >
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
