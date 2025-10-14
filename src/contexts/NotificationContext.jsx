/**
 * ============================================================================
 * NotificationContext - Centralized Notification State Management
 * ============================================================================
 *
 * A React Context that provides:
 * - Global notification state management
 * - Real-time synchronization across all components
 * - Automatic badge count updates
 * - Prevents stale data and manual refresh requirements
 * - Optimistic UI updates with rollback on failure
 *
 * Usage:
 *   // In App.jsx
 *   <NotificationProvider>
 *     <YourApp />
 *   </NotificationProvider>
 *
 *   // In any component
 *   const { unreadCount, notifications, refreshNotifications } = useNotifications();
 *
 * @version 1.0.0
 * @date 2025-10-09
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { notificationService } from "../services/notifications/NotificationService";
import { logger } from "../utils/logger";

const NotificationContext = createContext(undefined);

export const NotificationProvider = ({ children, userId }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const subscriptionRef = useRef(null);
  const isMountedRef = useRef(true);

  /**
   * Load unread count from database
   */
  const loadUnreadCount = useCallback(async () => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }

    try {
      const count = await notificationService.getUnreadCount(userId);
      if (isMountedRef.current) {
        setUnreadCount(count);
        setLastUpdate(Date.now());
      }
    } catch (error) {
      logger.error("[NotificationContext] Failed to load unread count:", error);
    }
  }, [userId]);

  /**
   * Load notifications list
   */
  const loadNotifications = useCallback(
    async (options = {}) => {
      if (!userId) {
        setNotifications([]);
        setIsLoading(false);
        return { notifications: [], totalCount: 0, hasMore: false };
      }

      try {
        setIsLoading(true);
        const result = await notificationService.getUserNotifications(
          userId,
          options
        );
        if (isMountedRef.current) {
          setNotifications(result.notifications);
          setIsLoading(false);
          setLastUpdate(Date.now());
        }
        return result;
      } catch (error) {
        logger.error(
          "[NotificationContext] Failed to load notifications:",
          error
        );
        if (isMountedRef.current) {
          setIsLoading(false);
        }
        return { notifications: [], totalCount: 0, hasMore: false };
      }
    },
    [userId]
  );

  /**
   * Refresh both count and notifications
   */
  const refreshAll = useCallback(async () => {
    await Promise.all([loadUnreadCount(), loadNotifications()]);
  }, [loadUnreadCount, loadNotifications]);

  /**
   * Mark notification as read with optimistic update
   */
  const markAsRead = useCallback(
    async (notificationId) => {
      if (!userId) return { success: false, error: "No user ID" };

      // Optimistic update
      const oldUnreadCount = unreadCount;
      const oldNotifications = [...notifications];

      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );

      try {
        const result = await notificationService.markAsRead(
          notificationId,
          userId
        );
        if (result.success) {
          setLastUpdate(Date.now());
          return result;
        } else {
          // Rollback on failure
          setUnreadCount(oldUnreadCount);
          setNotifications(oldNotifications);
          return result;
        }
      } catch (error) {
        // Rollback on error
        setUnreadCount(oldUnreadCount);
        setNotifications(oldNotifications);
        logger.error("[NotificationContext] Failed to mark as read:", error);
        return { success: false, error: error.message };
      }
    },
    [userId, unreadCount, notifications]
  );

  /**
   * Mark all as read with optimistic update
   */
  const markAllAsRead = useCallback(async () => {
    if (!userId) return { success: false, error: "No user ID" };

    // Save original state
    const oldUnreadCount = unreadCount;
    const oldNotifications = [...notifications];

    // Optimistic update
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

    try {
      const result = await notificationService.markAllAsRead(userId);
      if (result.success) {
        setLastUpdate(Date.now());
        return result;
      } else {
        // Rollback on failure
        setUnreadCount(oldUnreadCount);
        setNotifications(oldNotifications);
        return result;
      }
    } catch (error) {
      // Rollback on error
      setUnreadCount(oldUnreadCount);
      setNotifications(oldNotifications);
      logger.error("[NotificationContext] Failed to mark all as read:", error);
      return { success: false, error: error.message };
    }
  }, [userId, unreadCount, notifications]);

  /**
   * Dismiss notification with optimistic update
   */
  const dismissNotification = useCallback(
    async (notificationId) => {
      if (!userId) return { success: false, error: "No user ID" };

      // Find notification
      const notification = notifications.find((n) => n.id === notificationId);
      if (!notification)
        return { success: false, error: "Notification not found" };

      // Save state for rollback
      const oldNotifications = [...notifications];
      const oldUnreadCount = unreadCount;

      // Optimistic update
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      if (!notification.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      try {
        const result = await notificationService.dismiss(
          notificationId,
          userId
        );
        if (result.success) {
          setLastUpdate(Date.now());
          return result;
        } else {
          // Rollback on failure
          setNotifications(oldNotifications);
          setUnreadCount(oldUnreadCount);
          return result;
        }
      } catch (error) {
        // Rollback on error
        setNotifications(oldNotifications);
        setUnreadCount(oldUnreadCount);
        logger.error("[NotificationContext] Failed to dismiss:", error);
        return { success: false, error: error.message };
      }
    },
    [userId, notifications, unreadCount]
  );

  /**
   * Dismiss all notifications with optimistic update
   */
  const dismissAll = useCallback(async () => {
    if (!userId) return { success: false, error: "No user ID" };

    // Save state for rollback
    const oldNotifications = [...notifications];
    const oldUnreadCount = unreadCount;

    // Optimistic update
    setNotifications([]);
    setUnreadCount(0);

    try {
      const result = await notificationService.dismissAll(userId);
      if (result.success) {
        setLastUpdate(Date.now());
        return result;
      } else {
        // Rollback on failure
        setNotifications(oldNotifications);
        setUnreadCount(oldUnreadCount);
        return result;
      }
    } catch (error) {
      // Rollback on error
      setNotifications(oldNotifications);
      setUnreadCount(oldUnreadCount);
      logger.error("[NotificationContext] Failed to dismiss all:", error);
      return { success: false, error: error.message };
    }
  }, [userId, notifications, unreadCount]);

  /**
   * Initial load and real-time subscription
   */
  useEffect(() => {
    isMountedRef.current = true;

    if (!userId) {
      setUnreadCount(0);
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    // Initial load
    loadUnreadCount();
    loadNotifications();

    // Subscribe to real-time updates
    const unsubscribe = notificationService.subscribeToNotifications(
      userId,
      async (payload) => {
        logger.debug(
          "[NotificationContext] Real-time update received:",
          payload.eventType
        );

        // Debounce multiple rapid updates
        setTimeout(async () => {
          if (isMountedRef.current) {
            await loadUnreadCount();
            // Only reload notifications if they're currently loaded
            if (notifications.length > 0) {
              await loadNotifications();
            }
          }
        }, 100);
      }
    );

    subscriptionRef.current = unsubscribe;

    return () => {
      isMountedRef.current = false;
      if (subscriptionRef.current) {
        subscriptionRef.current();
        subscriptionRef.current = null;
      }
    };
  }, [userId, loadUnreadCount, loadNotifications]);

  const value = {
    // State
    unreadCount,
    notifications,
    isLoading,
    lastUpdate,

    // Actions
    refreshAll,
    loadUnreadCount,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    dismissAll,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

/**
 * Hook to use notification context
 */
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};

export default NotificationContext;
