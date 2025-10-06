import React, { useState, useEffect, useCallback } from "react";
import {
  Activity,
  Clock,
  User,
  Search,
  RefreshCw,
  Download,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
} from "lucide-react";
import { UserManagementService } from "../../../services/domains/auth/userManagementService";

// Constants moved outside component to avoid re-creation
const ACTIVITY_TYPES = [
  "USER_CREATED",
  "USER_UPDATED",
  "USER_DEACTIVATED",
  "SESSION_STARTED",
  "SESSION_ENDED",
  "PASSWORD_RESET_REQUESTED",
  "PERMISSION_CHANGED",
  "BULK_USER_UPDATE",
  "LOGIN_ATTEMPT",
  "LOGOUT",
];

const ActivityLogDashboard = () => {
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [selectedUserId, setSelectedUserId] = useState("all");
  const [users, setUsers] = useState([]);

  const loadActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load real activity logs from backend
      const filters = {
        userId: selectedUserId,
        actionType: filterType,
      };

      // Apply date range filter
      if (dateRange !== "all") {
        const now = new Date();
        if (dateRange === "today") {
          filters.startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
        } else if (dateRange === "week") {
          filters.startDate = new Date(
            now.getTime() - 7 * 24 * 60 * 60 * 1000
          ).toISOString();
        } else if (dateRange === "month") {
          filters.startDate = new Date(
            now.getTime() - 30 * 24 * 60 * 60 * 1000
          ).toISOString();
        }
      }

      const activityData = await UserManagementService.getAllActivityLogs(
        100,
        filters
      );
      setActivities(activityData || []);

      console.log("✅ Loaded activity logs:", activityData?.length || 0);
    } catch (error) {
      setError("Failed to load activity logs");
      console.error("Error loading activities:", error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [selectedUserId, filterType, dateRange]);

  const loadUsers = useCallback(async () => {
    try {
      const userData = await UserManagementService.getAllUsers();
      setUsers(userData);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  }, []);

  const filterActivities = useCallback(() => {
    let filtered = activities;

    if (searchTerm) {
      filtered = filtered.filter(
        (activity) =>
          activity.description
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          activity.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          activity.activity_type
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== "all") {
      filtered = filtered.filter(
        (activity) => activity.activity_type === filterType
      );
    }

    if (selectedUserId !== "all") {
      filtered = filtered.filter(
        (activity) => activity.user_id === selectedUserId
      );
    }

    if (dateRange !== "all") {
      const now = new Date();
      let startDate;

      switch (dateRange) {
        case "today":
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case "week":
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case "month":
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          startDate = null;
      }

      if (startDate) {
        filtered = filtered.filter(
          (activity) => new Date(activity.created_at) >= startDate
        );
      }
    }

    setFilteredActivities(filtered);
  }, [activities, searchTerm, filterType, dateRange, selectedUserId]);

  // Effect to load initial data
  useEffect(() => {
    loadActivities();
    loadUsers();
  }, [loadActivities, loadUsers]);

  // Effect to filter activities when dependencies change
  useEffect(() => {
    filterActivities();
  }, [filterActivities]);

  const getActivityIcon = (type) => {
    const icons = {
      USER_CREATED: <User className="h-4 w-4 text-green-600" />,
      USER_UPDATED: <User className="h-4 w-4 text-blue-600" />,
      USER_DEACTIVATED: <XCircle className="h-4 w-4 text-red-600" />,
      SESSION_STARTED: <CheckCircle className="h-4 w-4 text-green-600" />,
      SESSION_ENDED: <XCircle className="h-4 w-4 text-gray-600" />,
      PASSWORD_RESET_REQUESTED: (
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
      ),
      PERMISSION_CHANGED: <Eye className="h-4 w-4 text-purple-600" />,
      BULK_USER_UPDATE: <User className="h-4 w-4 text-blue-600" />,
      LOGIN_ATTEMPT: <CheckCircle className="h-4 w-4 text-green-600" />,
      LOGOUT: <XCircle className="h-4 w-4 text-gray-600" />,
    };
    return icons[type] || <Info className="h-4 w-4 text-gray-600" />;
  };

  const getActivityColor = (type) => {
    const colors = {
      USER_CREATED: "bg-green-100 border-green-200",
      USER_UPDATED: "bg-blue-100 border-blue-200",
      USER_DEACTIVATED: "bg-red-100 border-red-200",
      SESSION_STARTED: "bg-green-100 border-green-200",
      SESSION_ENDED: "bg-gray-100 border-gray-200",
      PASSWORD_RESET_REQUESTED: "bg-yellow-100 border-yellow-200",
      PERMISSION_CHANGED: "bg-purple-100 border-purple-200",
      BULK_USER_UPDATE: "bg-blue-100 border-blue-200",
      LOGIN_ATTEMPT: "bg-green-100 border-green-200",
      LOGOUT: "bg-gray-100 border-gray-200",
    };
    return colors[type] || "bg-gray-100 border-gray-200";
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-lg font-medium text-gray-600">
          Loading activity logs...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Activity Logs</h2>
          <p className="text-gray-600">
            Monitor user activities and system events
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={loadActivities}
            className="p-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
          <button className="p-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2" />
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Activity Types</option>
            {ACTIVITY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.replace("_", " ")}
              </option>
            ))}
          </select>

          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Users</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.first_name} {user.last_name}
              </option>
            ))}
          </select>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Recent Activities
          </h3>
          <span className="text-sm text-gray-500">
            {filteredActivities.length} activities
          </span>
        </div>

        <div className="space-y-4">
          {filteredActivities.map((activity) => (
            <div
              key={activity.id}
              className={`p-4 rounded-lg border ${getActivityColor(
                activity.activity_type
              )}`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 p-2 bg-white rounded-lg">
                  {getActivityIcon(activity.activity_type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {activity.activity_type.replace("_", " ")}
                      </p>
                      <p className="text-sm text-gray-600">
                        {activity.description}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span>{activity.user_name}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(activity.created_at)}</span>
                        </span>
                        <span>IP: {activity.ip_address}</span>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      {activity.metadata?.success !== undefined && (
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            activity.metadata.success
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {activity.metadata.success ? "Success" : "Failed"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredActivities.length === 0 && (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">
                No activities found
              </p>
              <p className="text-gray-400">
                Try adjusting your filters or search terms
              </p>
            </div>
          )}
        </div>

        {/* Load More Button */}
        {filteredActivities.length > 0 && (
          <div className="text-center mt-6">
            <button className="px-6 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
              Load More Activities
            </button>
          </div>
        )}
      </div>

      {/* Activity Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Activities
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {activities.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Successful Actions
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {activities.filter((a) => a.metadata?.success !== false).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Failed Actions
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {activities.filter((a) => a.metadata?.success === false).length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogDashboard;
