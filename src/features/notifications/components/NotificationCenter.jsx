import React, { useState, useEffect, useCallback } from "react";
import {
  Bell,
  X,
  Check,
  CheckCheck,
  Trash2,
  Settings,
  Package,
  AlertTriangle,
  Target,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import { NotificationService } from "../../../services/notificationService";
import { useAuth } from "../../../hooks/useAuth";

const NotificationCenter = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const userNotifications =
        await NotificationService.getActiveNotifications(user.id);
      setNotifications(userNotifications);
      setUnreadCount(userNotifications.filter((n) => !n.read).length);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const handleNewNotification = useCallback((newNotification) => {
    setNotifications((prev) => [newNotification, ...prev]);
    setUnreadCount((prev) => prev + 1);

    // Show browser notification if enabled
    if (Notification.permission === "granted") {
      new Notification(newNotification.title, {
        body: newNotification.message,
        icon: "/vite.svg",
      });
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadNotifications();

      // Subscribe to real-time notifications
      const subscription = NotificationService.subscribeToNotifications(
        user.id,
        handleNewNotification
      );

      return () => {
        subscription?.unsubscribe();
      };
    }
  }, [user?.id, loadNotifications, handleNewNotification]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await NotificationService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;

    try {
      await NotificationService.markAllAsRead(user.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await NotificationService.deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      setUnreadCount((prev) => {
        const notification = notifications.find((n) => n.id === notificationId);
        return notification && !notification.read ? prev - 1 : prev;
      });
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const getNotificationIcon = (type) => {
    const iconMap = {
      low_stock: <Package className="w-4 h-4 text-orange-500" />,
      expiry_warning: <AlertTriangle className="w-4 h-4 text-red-500" />,
      sales_target: <Target className="w-4 h-4 text-green-500" />,
      daily_report: <BarChart3 className="w-4 h-4 text-blue-500" />,
      weekly_report: <BarChart3 className="w-4 h-4 text-purple-500" />,
      reorder_suggestion: <RefreshCw className="w-4 h-4 text-indigo-500" />,
    };
    return iconMap[type] || <Bell className="w-4 h-4 text-gray-500" />;
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Notifications
            </h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 ${
                    !notification.read ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p
                            className={`text-sm font-medium ${
                              !notification.read
                                ? "text-gray-900"
                                : "text-gray-700"
                            }`}
                          >
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {notification.timeAgo}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-1 ml-2">
                          {!notification.read && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="p-1 text-gray-400 hover:text-blue-600"
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() =>
                              handleDeleteNotification(notification.id)
                            }
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="Delete notification"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Priority Badge */}
                      {notification.priority === "critical" && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-2">
                          Critical
                        </span>
                      )}
                      {notification.priority === "high" && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 mt-2">
                          High Priority
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <button className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium">
                View All Notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
