// ============================================================================
// NOTIFICATION PANEL IMPROVEMENTS
// ============================================================================
// Add these improvements to your NotificationPanel.jsx file
// ============================================================================

// First, install date-fns for better timestamp handling
// npm install date-fns

import { formatDistanceToNow, format, parseISO } from "date-fns";
import { useState } from "react";

// ============================================================================
// 1. IMPROVED TIMESTAMP FORMATTING (CRITICAL FIX)
// ============================================================================

/**
 * Format timestamp with consistent timezone handling
 * Uses date-fns for proper parsing and formatting
 */
const formatTimestamp = (timestamp) => {
  try {
    // Parse ISO 8601 timestamp from database (always UTC)
    const date = parseISO(timestamp);

    // Calculate relative time (e.g., "5 minutes ago")
    const relativeTime = formatDistanceToNow(date, { addSuffix: true });

    // Also get full date for tooltip
    const fullDate = format(date, "PPpp"); // "Apr 29, 2024 at 3:30 PM"

    return {
      relative: relativeTime,
      full: fullDate,
    };
  } catch (error) {
    console.error("❌ Failed to format timestamp:", error);
    return {
      relative: "Unknown time",
      full: "Invalid date",
    };
  }
};

// ============================================================================
// 2. ADD SEARCH AND FILTER CONTROLS
// ============================================================================

const NotificationFilters = ({ filters, onFilterChange }) => {
  return (
    <div className="notification-filters" style={styles.filters}>
      {/* Search Input */}
      <input
        type="text"
        placeholder="🔍 Search notifications..."
        value={filters.searchQuery || ""}
        onChange={(e) =>
          onFilterChange({ ...filters, searchQuery: e.target.value })
        }
        style={styles.searchInput}
      />

      {/* Category Filter */}
      <select
        value={filters.category || "all"}
        onChange={(e) =>
          onFilterChange({ ...filters, category: e.target.value })
        }
        style={styles.filterSelect}
      >
        <option value="all">All Categories</option>
        <option value="inventory">📦 Inventory</option>
        <option value="expiry">⏰ Expiry</option>
        <option value="sales">💰 Sales</option>
        <option value="system">⚙️ System</option>
      </select>

      {/* Type Filter */}
      <select
        value={filters.type || "all"}
        onChange={(e) => onFilterChange({ ...filters, type: e.target.value })}
        style={styles.filterSelect}
      >
        <option value="all">All Types</option>
        <option value="error">❌ Error</option>
        <option value="warning">⚠️ Warning</option>
        <option value="success">✅ Success</option>
        <option value="info">ℹ️ Info</option>
      </select>

      {/* Read Status Filter */}
      <select
        value={
          filters.isRead === undefined
            ? "all"
            : filters.isRead
            ? "read"
            : "unread"
        }
        onChange={(e) => {
          const value = e.target.value;
          const isRead = value === "all" ? undefined : value === "read";
          onFilterChange({ ...filters, isRead });
        }}
        style={styles.filterSelect}
      >
        <option value="all">All Status</option>
        <option value="unread">📬 Unread</option>
        <option value="read">📭 Read</option>
      </select>

      {/* Clear Filters Button */}
      <button
        onClick={() =>
          onFilterChange({
            searchQuery: "",
            category: "all",
            type: "all",
            isRead: undefined,
          })
        }
        style={styles.clearButton}
      >
        Clear Filters
      </button>
    </div>
  );
};

// ============================================================================
// 3. IMPROVED NOTIFICATION ITEM WITH BETTER TIMESTAMP DISPLAY
// ============================================================================

const NotificationItem = ({ notification, onMarkAsRead, onDismiss }) => {
  const timestamp = formatTimestamp(notification.created_at);
  const readTimestamp = notification.read_at
    ? formatTimestamp(notification.read_at)
    : null;

  return (
    <div
      className={`notification-item ${
        notification.is_read ? "read" : "unread"
      }`}
      style={{
        ...styles.notificationItem,
        backgroundColor: notification.is_read ? "#f8f9fa" : "#ffffff",
        borderLeft: `4px solid ${getPriorityColor(notification.priority)}`,
      }}
    >
      {/* Header */}
      <div style={styles.notificationHeader}>
        <span style={styles.notificationIcon}>
          {getTypeIcon(notification.type)}
        </span>
        <span style={styles.notificationTitle}>{notification.title}</span>
        {!notification.is_read && <span style={styles.unreadBadge}>•</span>}
      </div>

      {/* Message */}
      <p style={styles.notificationMessage}>{notification.message}</p>

      {/* Footer with improved timestamp */}
      <div style={styles.notificationFooter}>
        <span
          style={styles.notificationTime}
          title={timestamp.full} // Show full date on hover
        >
          {timestamp.relative}
          {readTimestamp && ` • Read ${readTimestamp.relative}`}
        </span>

        <div style={styles.notificationActions}>
          {!notification.is_read && (
            <button
              onClick={() => onMarkAsRead(notification.id)}
              style={styles.actionButton}
            >
              Mark as Read
            </button>
          )}
          <button
            onClick={() => onDismiss(notification.id)}
            style={styles.dismissButton}
          >
            Dismiss
          </button>
        </div>
      </div>

      {/* Category Badge */}
      <span
        style={{
          ...styles.categoryBadge,
          backgroundColor: getCategoryColor(notification.category),
        }}
      >
        {notification.category}
      </span>
    </div>
  );
};

// ============================================================================
// 4. MAIN NOTIFICATION PANEL WITH SEARCH AND FILTERS
// ============================================================================

const NotificationPanel = ({ isOpen, onClose, userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [filters, setFilters] = useState({
    searchQuery: "",
    category: "all",
    type: "all",
    isRead: undefined,
  });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load notifications with filters
  const loadNotifications = async () => {
    setLoading(true);
    try {
      const result = await notificationService.search(userId, {
        searchQuery: filters.searchQuery,
        category: filters.category !== "all" ? filters.category : undefined,
        type: filters.type !== "all" ? filters.type : undefined,
        isRead: filters.isRead,
        limit: 20,
        offset: 0,
      });
      setNotifications(result.notifications);
    } catch (error) {
      console.error("❌ Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load stats
  const loadStats = async () => {
    const stats = await notificationService.getStats(userId);
    setStats(stats);
  };

  // Load on filter change
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
      loadStats();
    }
  }, [isOpen, filters]);

  // Mark as read
  const handleMarkAsRead = async (notificationId) => {
    await notificationService.markAsRead(notificationId, userId);
    loadNotifications(); // Refresh
    loadStats();
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    await notificationService.markAllAsRead(userId);
    loadNotifications(); // Refresh
    loadStats();
  };

  // Dismiss notification
  const handleDismiss = async (notificationId) => {
    await notificationService.dismiss(notificationId, userId);
    loadNotifications(); // Refresh
    loadStats();
  };

  if (!isOpen) return null;

  return (
    <div style={styles.panel}>
      {/* Header */}
      <div style={styles.panelHeader}>
        <h3>Notifications</h3>
        <button onClick={onClose} style={styles.closeButton}>
          ✕
        </button>
      </div>

      {/* Statistics */}
      {stats && (
        <div style={styles.statsBar}>
          <span>Total: {stats.total}</span>
          <span>Unread: {stats.unread}</span>
          <span>Read: {stats.read}</span>
          {stats.unread > 0 && (
            <button onClick={handleMarkAllAsRead} style={styles.markAllButton}>
              Mark All as Read
            </button>
          )}
        </div>
      )}

      {/* Filters */}
      <NotificationFilters filters={filters} onFilterChange={setFilters} />

      {/* Notifications List */}
      <div style={styles.notificationsList}>
        {loading && <p>Loading...</p>}
        {!loading && notifications.length === 0 && (
          <p style={styles.emptyState}>No notifications found</p>
        )}
        {!loading &&
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={handleMarkAsRead}
              onDismiss={handleDismiss}
            />
          ))}
      </div>
    </div>
  );
};

// ============================================================================
// 5. HELPER FUNCTIONS
// ============================================================================

const getTypeIcon = (type) => {
  switch (type) {
    case "error":
      return "❌";
    case "warning":
      return "⚠️";
    case "success":
      return "✅";
    case "info":
      return "ℹ️";
    default:
      return "📢";
  }
};

const getPriorityColor = (priority) => {
  switch (priority) {
    case 1:
      return "#dc3545"; // Critical - Red
    case 2:
      return "#fd7e14"; // High - Orange
    case 3:
      return "#ffc107"; // Medium - Yellow
    case 4:
      return "#0dcaf0"; // Low - Cyan
    case 5:
      return "#6c757d"; // Info - Gray
    default:
      return "#6c757d";
  }
};

const getCategoryColor = (category) => {
  switch (category) {
    case "inventory":
      return "#0d6efd";
    case "expiry":
      return "#dc3545";
    case "sales":
      return "#198754";
    case "system":
      return "#6c757d";
    default:
      return "#6c757d";
  }
};

// ============================================================================
// 6. STYLES
// ============================================================================

const styles = {
  panel: {
    position: "fixed",
    top: 0,
    right: 0,
    width: "400px",
    height: "100vh",
    backgroundColor: "#fff",
    boxShadow: "-2px 0 10px rgba(0,0,0,0.1)",
    zIndex: 1000,
    display: "flex",
    flexDirection: "column",
  },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px",
    borderBottom: "1px solid #dee2e6",
  },
  closeButton: {
    border: "none",
    background: "transparent",
    fontSize: "24px",
    cursor: "pointer",
    padding: "0 8px",
  },
  statsBar: {
    display: "flex",
    gap: "12px",
    padding: "12px 16px",
    backgroundColor: "#f8f9fa",
    borderBottom: "1px solid #dee2e6",
    fontSize: "14px",
  },
  markAllButton: {
    marginLeft: "auto",
    padding: "4px 12px",
    backgroundColor: "#0d6efd",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
  },
  filters: {
    padding: "12px 16px",
    backgroundColor: "#f8f9fa",
    borderBottom: "1px solid #dee2e6",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  searchInput: {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid #ced4da",
    borderRadius: "4px",
    fontSize: "14px",
  },
  filterSelect: {
    padding: "6px 10px",
    border: "1px solid #ced4da",
    borderRadius: "4px",
    fontSize: "14px",
    backgroundColor: "white",
  },
  clearButton: {
    padding: "6px 12px",
    backgroundColor: "#6c757d",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
  },
  notificationsList: {
    flex: 1,
    overflowY: "auto",
    padding: "8px",
  },
  notificationItem: {
    padding: "12px",
    marginBottom: "8px",
    borderRadius: "6px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    position: "relative",
  },
  notificationHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "8px",
  },
  notificationIcon: {
    fontSize: "20px",
  },
  notificationTitle: {
    fontWeight: "bold",
    fontSize: "14px",
    flex: 1,
  },
  unreadBadge: {
    color: "#0d6efd",
    fontSize: "24px",
    lineHeight: "10px",
  },
  notificationMessage: {
    fontSize: "13px",
    color: "#495057",
    margin: "0 0 8px 0",
  },
  notificationFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "12px",
    color: "#6c757d",
  },
  notificationTime: {
    cursor: "help", // Show ? cursor on hover for tooltip
  },
  notificationActions: {
    display: "flex",
    gap: "8px",
  },
  actionButton: {
    padding: "4px 8px",
    backgroundColor: "#0d6efd",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "11px",
  },
  dismissButton: {
    padding: "4px 8px",
    backgroundColor: "#6c757d",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "11px",
  },
  categoryBadge: {
    position: "absolute",
    top: "8px",
    right: "8px",
    padding: "2px 8px",
    borderRadius: "12px",
    fontSize: "10px",
    color: "white",
    textTransform: "uppercase",
    fontWeight: "bold",
  },
  emptyState: {
    textAlign: "center",
    padding: "40px 20px",
    color: "#6c757d",
  },
};

export default NotificationPanel;
