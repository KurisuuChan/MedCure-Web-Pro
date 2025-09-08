import React, { useState, useEffect } from "react";
import { NotificationService } from "../../services/notificationService";

/**
 * Intelligent Notification Center
 * Professional ML-driven notification management with smart filtering and actions
 */
const IntelligentNotificationCenter = ({ userId, isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await NotificationService.getActiveNotifications(userId);
      setNotifications(data);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboard = async () => {
    try {
      const dashboardData =
        await NotificationService.getIntelligentNotificationDashboard();
      setDashboard(dashboardData);
    } catch (error) {
      console.error("Error loading dashboard:", error);
    }
  };

  useEffect(() => {
    if (isOpen && userId) {
      loadNotifications();
      loadDashboard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, userId]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await NotificationService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await NotificationService.markAllAsRead(userId);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const handleNotificationAction = (action, notification) => {
    NotificationService.handleNotificationAction(action, notification);
    handleMarkAsRead(notification.id);
  };

  const generateIntelligentAlerts = async () => {
    try {
      setLoading(true);
      const results =
        await NotificationService.generateIntelligentNotifications();
      console.log("Generated intelligent alerts:", results);
      await loadNotifications(); // Refresh notifications
    } catch (error) {
      console.error("Error generating intelligent alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotifications = notifications.filter((notification) => {
    // Filter by tab
    if (activeTab === "ml" && notification.data?.generated_by !== "ml_engine") {
      return false;
    }
    if (activeTab === "action" && !notification.data?.requires_action) {
      return false;
    }

    // Filter by priority
    if (filterPriority !== "all" && notification.priority !== filterPriority) {
      return false;
    }

    return true;
  });

  const getNotificationTypeColor = (type) => {
    const mlTypes = [
      "demand_spike_predicted",
      "demand_drop_predicted",
      "price_optimization_alert",
      "seasonal_trend_alert",
      "inventory_optimization",
      "profit_opportunity",
      "stock_out_risk",
      "overstock_warning",
      "ml_model_alert",
    ];

    if (mlTypes.includes(type)) {
      return "border-l-4 border-l-blue-500 bg-blue-50";
    }
    return "border-l-4 border-l-gray-300 bg-gray-50";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div className="bg-white w-full max-w-2xl h-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                🤖 Intelligent Notifications
              </h2>
              <p className="text-blue-100 mt-1">
                ML-driven alerts and insights
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Quick Stats */}
          {dashboard && (
            <div className="grid grid-cols-4 gap-4 mt-4">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {dashboard.summary.total_active_alerts}
                </div>
                <div className="text-xs text-blue-100">Total Alerts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {dashboard.summary.high_priority_alerts}
                </div>
                <div className="text-xs text-blue-100">High Priority</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {dashboard.summary.ml_generated_alerts}
                </div>
                <div className="text-xs text-blue-100">ML Generated</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {dashboard.summary.action_required_alerts}
                </div>
                <div className="text-xs text-blue-100">Action Required</div>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1 rounded text-sm ${
                  activeTab === "all"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setActiveTab("ml")}
                className={`px-3 py-1 rounded text-sm ${
                  activeTab === "ml"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                🤖 ML Insights (
                {
                  notifications.filter(
                    (n) => n.data?.generated_by === "ml_engine"
                  ).length
                }
                )
              </button>
              <button
                onClick={() => setActiveTab("action")}
                className={`px-3 py-1 rounded text-sm ${
                  activeTab === "action"
                    ? "bg-red-500 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                Action Required (
                {notifications.filter((n) => n.data?.requires_action).length})
              </button>
            </div>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-1 border rounded text-sm"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={generateIntelligentAlerts}
              disabled={loading}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 text-sm"
            >
              {loading ? "🔄 Generating..." : "🤖 Generate ML Alerts"}
            </button>
            <button
              onClick={handleMarkAllAsRead}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 text-sm"
            >
              Mark All Read
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Loading notifications...</div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-2">🔔</div>
                <div>No notifications found</div>
                <div className="text-sm mt-1">
                  Try generating ML alerts or check different filters
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg ${getNotificationTypeColor(
                    notification.type
                  )} ${notification.read ? "opacity-60" : ""}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-xl">{notification.icon}</span>
                        <span className="font-semibold text-gray-800">
                          {notification.title}
                        </span>
                        {notification.data?.generated_by === "ml_engine" && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            🤖 ML Generated
                          </span>
                        )}
                        {notification.data?.requires_action && (
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                            Action Required
                          </span>
                        )}
                        <span
                          className={`px-2 py-1 rounded text-xs ${notification.priorityColor}`}
                        >
                          {notification.priority.toUpperCase()}
                        </span>
                      </div>

                      <p className="text-gray-700 mb-2">
                        {notification.message}
                      </p>

                      {/* ML-specific data display */}
                      {notification.data?.confidence && (
                        <div className="text-xs text-gray-600 mb-2">
                          <span className="font-medium">Confidence:</span>{" "}
                          {Math.round(notification.data.confidence * 100)}%
                          {notification.data?.algorithm_used && (
                            <span className="ml-3">
                              <span className="font-medium">Algorithm:</span>{" "}
                              {notification.data.algorithm_used}
                            </span>
                          )}
                        </div>
                      )}

                      {notification.data?.recommendation && (
                        <div className="text-xs bg-yellow-50 border border-yellow-200 rounded p-2 mb-2">
                          <span className="font-medium text-yellow-800">
                            💡 Recommendation:
                          </span>
                          <div className="text-yellow-700">
                            {notification.data.recommendation}
                          </div>
                        </div>
                      )}

                      <div className="text-xs text-gray-500">
                        {notification.timeAgo}
                        {notification.data?.urgency_score && (
                          <span className="ml-3">
                            Urgency Score: {notification.data.urgency_score}/100
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2 ml-4">
                      {NotificationService.getNotificationActions(
                        notification
                      ).map((action, index) => (
                        <button
                          key={index}
                          onClick={() =>
                            handleNotificationAction(
                              action.action,
                              notification
                            )
                          }
                          className={`px-3 py-1 rounded text-xs ${
                            action.action === "dismiss"
                              ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                              : "bg-blue-500 text-white hover:bg-blue-600"
                          }`}
                        >
                          {action.title}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Performance Metrics Footer */}
        {dashboard && (
          <div className="border-t bg-gray-50 p-4">
            <div className="text-sm text-gray-600">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="font-medium">ML Adoption</div>
                  <div className="text-lg font-bold text-blue-600">
                    {Math.round(dashboard.performance_metrics.ml_adoption_rate)}
                    %
                  </div>
                </div>
                <div>
                  <div className="font-medium">Response Rate</div>
                  <div className="text-lg font-bold text-green-600">
                    {Math.round(
                      dashboard.performance_metrics.user_response_rate
                    )}
                    %
                  </div>
                </div>
                <div>
                  <div className="font-medium">Effectiveness</div>
                  <div className="text-lg font-bold text-purple-600">
                    {Math.round(
                      dashboard.performance_metrics.notification_effectiveness
                    )}
                    %
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntelligentNotificationCenter;
