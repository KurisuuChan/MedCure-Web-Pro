/**
 * ============================================================================
 * NotificationPanel - Dropdown Notification List Panel
 * ============================================================================
 *
 * A React component that displays:
 * - List of notifications with icons, titles, messages, timestamps
 * - Actions: Mark as read, dismiss individual, mark all as read, dismiss all
 * - Navigation to linked pages (inventory, sales, etc.)
 * - Pagination for large notification lists
 * - Real-time updates via NotificationContext (no manual refresh!)
 * - Empty state when no notifications
 * - Optimistic UI updates for instant feedback
 *
 * Usage:
 *   <NotificationPanel onClose={() => setOpen(false)} />
 *
 * @version 2.0.0
 * @date 2025-10-09
 */

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  Check,
  CheckCheck,
  Trash2,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Info,
  Package,
  Calendar,
  ShoppingCart,
  Settings,
  ChevronDown,
} from "lucide-react";
import {
  NOTIFICATION_TYPE,
  NOTIFICATION_CATEGORY,
} from "../../services/notifications/NotificationService.js";
import { useNotifications } from "../../contexts/NotificationContext";
import { logger } from "../../utils/logger.js";

const NotificationPanel = ({ onClose }) => {
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const closeButtonRef = useRef(null);
  
  // Use notification context
  const {
    notifications: contextNotifications,
    isLoading: contextIsLoading,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    dismissAll,
    loadNotifications,
  } = useNotifications();

  // Loading states for actions
  const [isMarkingAllAsRead, setIsMarkingAllAsRead] = useState(false);
  const [isDismissingAll, setIsDismissingAll] = useState(false);
  const [processingItems, setProcessingItems] = useState(new Set());

  // ✅ Auto-focus close button when panel opens (accessibility)
  useEffect(() => {
    if (closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, []);

  // ✅ Keyboard navigation - Escape to close, Tab trap
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      onClose();
      return;
    }

    // Focus trap: Keep focus inside panel
    if (e.key === "Tab" && panelRef.current) {
      const focusableElements = panelRef.current.querySelectorAll(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  };

  // Load notifications
  useEffect(() => {
    if (!userId) return;

    const loadNotifications = async () => {
      setIsLoading(true);
      const result = await notificationService.getUserNotifications(userId, {
        limit: ITEMS_PER_PAGE,
        offset: (page - 1) * ITEMS_PER_PAGE,
      });

      setNotifications(result.notifications);
      setHasMore(result.hasMore);
      setIsLoading(false);
    };

    loadNotifications();
  }, [userId, page]);

  // Subscribe to real-time updates with debouncing
  useEffect(() => {
    if (!userId) return;

    let debounceTimer = null;
    let isSubscribed = true;

    const debouncedReload = () => {
      // Clear previous timer
      if (debounceTimer) clearTimeout(debounceTimer);

      // Set new timer
      debounceTimer = setTimeout(async () => {
        if (!isSubscribed) return;

        // Reload current page
        const result = await notificationService.getUserNotifications(userId, {
          limit: ITEMS_PER_PAGE,
          offset: (page - 1) * ITEMS_PER_PAGE,
        });

        if (isSubscribed) {
          setNotifications(result.notifications);
          setHasMore(result.hasMore);
        }
      }, 500); // 500ms debounce
    };

    const unsubscribe = notificationService.subscribeToNotifications(
      userId,
      debouncedReload
    );

    return () => {
      isSubscribed = false;
      if (debounceTimer) clearTimeout(debounceTimer);
      unsubscribe();
    };
  }, [userId, page]);

  // ✅ Handle mark as read with OPTIMISTIC UI UPDATE
  const handleMarkAsRead = async (notificationId, e) => {
    e.stopPropagation();

    // Add to processing set
    setProcessingItems((prev) => new Set([...prev, notificationId]));

    // ✅ OPTIMISTIC UPDATE: Update UI immediately
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, is_read: true } : n
      )
    );

    try {
      const result = await notificationService.markAsRead(
        notificationId,
        userId
      );

      if (!result.success) {
        // ✅ ROLLBACK: Revert optimistic update on failure
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, is_read: false } : n
          )
        );
        logger.error("Failed to mark as read:", result.error);
        alert(`Failed to mark notification as read. Please try again.`);
      }
    } catch (error) {
      // ✅ ROLLBACK: Revert on error
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: false } : n
        )
      );
      logger.error("Error marking as read:", error);
      alert(`Failed to mark notification as read. Please try again.`);
    } finally {
      // Remove from processing set
      setProcessingItems((prev) => {
        const next = new Set(prev);
        next.delete(notificationId);
        return next;
      });
    }
  };

  // ✅ Handle mark all as read with OPTIMISTIC UI UPDATE
  const handleMarkAllAsRead = async () => {
    setIsMarkingAllAsRead(true);

    // Save original state for rollback
    const originalNotifications = [...notifications];

    // ✅ OPTIMISTIC UPDATE: Update UI immediately
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

    try {
      const result = await notificationService.markAllAsRead(userId);

      if (result.success) {
        // Show success feedback
        if (result.count > 0) {
          logger.success(`Marked ${result.count} notification(s) as read`);
        }
      } else {
        // ✅ ROLLBACK: Restore original state on failure
        setNotifications(originalNotifications);
        logger.error("Failed to mark all as read:", result.error);
        alert(`Failed to mark all notifications as read. Please try again.`);
      }
    } catch (error) {
      // ✅ ROLLBACK: Restore original state on error
      setNotifications(originalNotifications);
      logger.error("Unexpected error marking all as read:", error);
      alert(`Failed to mark all notifications as read. Please try again.`);
    } finally {
      setIsMarkingAllAsRead(false);
    }
  };

  // ✅ Handle dismiss with OPTIMISTIC UI UPDATE
  const handleDismiss = async (notificationId, e) => {
    e.stopPropagation();

    // Add to processing set
    setProcessingItems((prev) => new Set([...prev, notificationId]));

    // Save dismissed notification for rollback
    const dismissedNotification = notifications.find((n) => n.id === notificationId);
    const dismissedIndex = notifications.findIndex((n) => n.id === notificationId);

    // ✅ OPTIMISTIC UPDATE: Remove from UI immediately
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));

    try {
      const result = await notificationService.dismiss(notificationId, userId);

      if (result.success) {
        // Check if page is now empty
        const remainingCount = notifications.length - 1;
        if (remainingCount === 0 && page > 1) {
          // Go to previous page if current page is empty
          setPage((prev) => prev - 1);
        } else if (remainingCount === 0 && page === 1) {
          // Reload page 1 to check for more notifications
          const reloadResult = await notificationService.getUserNotifications(
            userId,
            {
              limit: ITEMS_PER_PAGE,
              offset: 0,
            }
          );
          setNotifications(reloadResult.notifications);
          setHasMore(reloadResult.hasMore);
        }
      } else {
        // ✅ ROLLBACK: Restore dismissed notification on failure
        setNotifications((prev) => {
          const newNotifications = [...prev];
          newNotifications.splice(dismissedIndex, 0, dismissedNotification);
          return newNotifications;
        });
        logger.error("Failed to dismiss:", result.error);
        alert(`Failed to dismiss notification. Please try again.`);
      }
    } catch (error) {
      // ✅ ROLLBACK: Restore dismissed notification on error
      setNotifications((prev) => {
        const newNotifications = [...prev];
        newNotifications.splice(dismissedIndex, 0, dismissedNotification);
        return newNotifications;
      });
      logger.error("Error dismissing notification:", error);
      alert(`Failed to dismiss notification. Please try again.`);
    } finally {
      // Remove from processing set
      setProcessingItems((prev) => {
        const next = new Set(prev);
        next.delete(notificationId);
        return next;
      });
    }
  };

  // ✅ Handle dismiss all with OPTIMISTIC UI UPDATE
  const handleDismissAll = async () => {
    // Confirmation dialog
    const count = notifications.length;
    const confirmMessage =
      count > 0
        ? `Are you sure you want to clear all ${count} notification(s)? This action cannot be undone.`
        : "Are you sure you want to clear all notifications?";

    if (!window.confirm(confirmMessage)) {
      return; // User canceled
    }

    setIsDismissingAll(true);

    // Save original state for rollback
    const originalNotifications = [...notifications];
    const originalPage = page;
    const originalHasMore = hasMore;

    // ✅ OPTIMISTIC UPDATE: Clear UI immediately
    setNotifications([]);
    setPage(1);
    setHasMore(false);

    try {
      const result = await notificationService.dismissAll(userId);

      if (result.success) {
        // Show success feedback
        if (result.count > 0) {
          logger.success(`Cleared ${result.count} notification(s)`);
        }
      } else {
        // ✅ ROLLBACK: Restore original state on failure
        setNotifications(originalNotifications);
        setPage(originalPage);
        setHasMore(originalHasMore);
        logger.error("Failed to dismiss all:", result.error);
        alert(`Failed to clear all notifications. Please try again.`);
      }
    } catch (error) {
      // ✅ ROLLBACK: Restore original state on error
      setNotifications(originalNotifications);
      setPage(originalPage);
      setHasMore(originalHasMore);
      logger.error("Unexpected error dismissing all:", error);
      alert(`Failed to clear all notifications. Please try again.`);
    } finally {
      setIsDismissingAll(false);
    }
  };

  // Handle notification click (navigate to linked page)
  const handleNotificationClick = async (notification) => {
    // Mark as read
    if (!notification.is_read) {
      await notificationService.markAsRead(notification.id, userId);
    }

    // Navigate if action URL exists
    if (notification.metadata?.actionUrl) {
      navigate(notification.metadata.actionUrl);
      onClose();
    }
  };

  // Get icon based on notification type
  const getNotificationIcon = (notification) => {
    // First check type (error, warning, success, info)
    switch (notification.type) {
      case NOTIFICATION_TYPE.ERROR:
        return <AlertCircle size={20} color="#ef4444" />;
      case NOTIFICATION_TYPE.WARNING:
        return <AlertTriangle size={20} color="#f59e0b" />;
      case NOTIFICATION_TYPE.SUCCESS:
        return <CheckCircle size={20} color="#10b981" />;
      case NOTIFICATION_TYPE.INFO:
      default:
        break;
    }

    // Then check category
    switch (notification.category) {
      case NOTIFICATION_CATEGORY.INVENTORY:
        return <Package size={20} color="#2563eb" />;
      case NOTIFICATION_CATEGORY.EXPIRY:
        return <Calendar size={20} color="#f59e0b" />;
      case NOTIFICATION_CATEGORY.SALES:
        return <ShoppingCart size={20} color="#10b981" />;
      case NOTIFICATION_CATEGORY.SYSTEM:
        return <Settings size={20} color="#6b7280" />;
      default:
        return <Info size={20} color="#2563eb" />;
    }
  };

  // Format timestamp (e.g., "5 minutes ago", "2 hours ago")
  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const notifDate = new Date(timestamp);
    const diffMs = now - notifDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60)
      return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;

    return notifDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year:
        notifDate.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  // Get priority badge color
  const getPriorityColor = (priority) => {
    if (priority <= 1) return "#ef4444"; // Critical
    if (priority === 2) return "#f59e0b"; // High
    if (priority === 3) return "#2563eb"; // Medium
    return "#6b7280"; // Low/Info
  };

  return (
    <div
      ref={panelRef}
      className="notification-panel"
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label="Notifications Panel"
      style={{
        position: "absolute",
        top: "calc(100% + 8px)",
        right: 0,
        width: "420px",
        maxHeight: "600px",
        backgroundColor: "white",
        borderRadius: "12px",
        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.15)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        zIndex: 1000,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#f9fafb",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: "18px",
            fontWeight: "600",
            color: "#111827",
          }}
        >
          Notifications
        </h3>
        <button
          ref={closeButtonRef}
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: "4px",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label="Close"
        >
          <X size={20} color="#6b7280" />
        </button>
      </div>

      {/* Action Buttons */}
      {notifications.length > 0 && (
        <div
          style={{
            padding: "12px 20px",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            gap: "8px",
          }}
        >
          <button
            onClick={handleMarkAllAsRead}
            disabled={isMarkingAllAsRead}
            style={{
              flex: 1,
              padding: "8px 12px",
              backgroundColor: isMarkingAllAsRead ? "#e5e7eb" : "#f3f4f6",
              border: "none",
              borderRadius: "6px",
              cursor: isMarkingAllAsRead ? "wait" : "pointer",
              fontSize: "13px",
              fontWeight: "500",
              color: isMarkingAllAsRead ? "#9ca3af" : "#374151",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              transition: "background-color 0.2s",
              opacity: isMarkingAllAsRead ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isMarkingAllAsRead) {
                e.currentTarget.style.backgroundColor = "#e5e7eb";
              }
            }}
            onMouseLeave={(e) => {
              if (!isMarkingAllAsRead) {
                e.currentTarget.style.backgroundColor = "#f3f4f6";
              }
            }}
          >
            <CheckCheck size={16} />
            {isMarkingAllAsRead ? "Marking..." : "Mark all read"}
          </button>
          <button
            onClick={handleDismissAll}
            disabled={isDismissingAll}
            style={{
              flex: 1,
              padding: "8px 12px",
              backgroundColor: isDismissingAll ? "#fee2e2" : "#fef2f2",
              border: "none",
              borderRadius: "6px",
              cursor: isDismissingAll ? "wait" : "pointer",
              fontSize: "13px",
              fontWeight: "500",
              color: isDismissingAll ? "#fca5a5" : "#dc2626",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              transition: "background-color 0.2s",
              opacity: isDismissingAll ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isDismissingAll) {
                e.currentTarget.style.backgroundColor = "#fee2e2";
              }
            }}
            onMouseLeave={(e) => {
              if (!isDismissingAll) {
                e.currentTarget.style.backgroundColor = "#fef2f2";
              }
            }}
          >
            <Trash2 size={16} />
            {isDismissingAll ? "Clearing..." : "Clear all"}
          </button>
        </div>
      )}

      {/* Notification List */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          maxHeight: "450px",
        }}
      >
        {isLoading ? (
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            <div
              style={{
                display: "inline-block",
                width: "32px",
                height: "32px",
                border: "3px solid #e5e7eb",
                borderTop: "3px solid #2563eb",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            />
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : notifications.length === 0 ? (
          <div
            style={{
              padding: "60px 20px",
              textAlign: "center",
              color: "#6b7280",
            }}
          >
            <Info size={48} color="#d1d5db" style={{ marginBottom: "16px" }} />
            <p style={{ margin: 0, fontSize: "15px", fontWeight: "500" }}>
              No notifications
            </p>
            <p style={{ margin: "8px 0 0", fontSize: "13px" }}>
              You're all caught up!
            </p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #f3f4f6",
                cursor: notification.metadata?.actionUrl
                  ? "pointer"
                  : "default",
                backgroundColor: notification.is_read ? "white" : "#f0f9ff",
                transition: "background-color 0.2s",
                position: "relative",
                display: "flex",
                gap: "12px",
              }}
              onMouseEnter={(e) => {
                if (notification.metadata?.actionUrl) {
                  e.currentTarget.style.backgroundColor = notification.is_read
                    ? "#f9fafb"
                    : "#e0f2fe";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = notification.is_read
                  ? "white"
                  : "#f0f9ff";
              }}
            >
              {/* Priority Indicator */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: "4px",
                  backgroundColor: getPriorityColor(notification.priority),
                }}
              />

              {/* Icon */}
              <div style={{ flexShrink: 0, marginTop: "2px" }}>
                {getNotificationIcon(notification)}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: notification.is_read ? "500" : "600",
                    color: "#111827",
                    marginBottom: "4px",
                  }}
                >
                  {notification.title}
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    color: "#6b7280",
                    lineHeight: "1.5",
                    marginBottom: "6px",
                  }}
                >
                  {notification.message}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#9ca3af",
                  }}
                >
                  {formatTimestamp(notification.created_at)}
                </div>
              </div>

              {/* Actions */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  flexShrink: 0,
                }}
              >
                {!notification.is_read && (
                  <button
                    onClick={(e) => handleMarkAsRead(notification.id, e)}
                    disabled={processingItems.has(notification.id)}
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: processingItems.has(notification.id)
                        ? "wait"
                        : "pointer",
                      padding: "4px",
                      borderRadius: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: processingItems.has(notification.id) ? 0.5 : 1,
                    }}
                    title="Mark as read"
                  >
                    <Check size={16} color="#10b981" />
                  </button>
                )}
                <button
                  onClick={(e) => handleDismiss(notification.id, e)}
                  disabled={processingItems.has(notification.id)}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: processingItems.has(notification.id)
                      ? "wait"
                      : "pointer",
                    padding: "4px",
                    borderRadius: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: processingItems.has(notification.id) ? 0.5 : 1,
                  }}
                  title="Dismiss"
                >
                  <Trash2 size={16} color="#ef4444" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {(page > 1 || hasMore) && (
        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "#f9fafb",
          }}
        >
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: "6px 12px",
              backgroundColor: page === 1 ? "#f3f4f6" : "#2563eb",
              color: page === 1 ? "#9ca3af" : "white",
              border: "none",
              borderRadius: "6px",
              cursor: page === 1 ? "not-allowed" : "pointer",
              fontSize: "13px",
              fontWeight: "500",
            }}
          >
            Previous
          </button>
          <span style={{ fontSize: "13px", color: "#6b7280" }}>
            Page {page}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasMore}
            style={{
              padding: "6px 12px",
              backgroundColor: !hasMore ? "#f3f4f6" : "#2563eb",
              color: !hasMore ? "#9ca3af" : "white",
              border: "none",
              borderRadius: "6px",
              cursor: !hasMore ? "not-allowed" : "pointer",
              fontSize: "13px",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            Next
            <ChevronDown size={14} style={{ transform: "rotate(-90deg)" }} />
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
