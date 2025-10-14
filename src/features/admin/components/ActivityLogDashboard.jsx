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
  Filter,
  Calendar,
  Shield,
  TrendingUp,
  FileJson,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  ExternalLink,
  Zap,
  Globe,
} from "lucide-react";
import { UserManagementService } from "../../../services/domains/auth/userManagementService";

// Constants
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

const SEVERITY_LEVELS = {
  USER_DEACTIVATED: "high",
  PASSWORD_RESET_REQUESTED: "high",
  PERMISSION_CHANGED: "high",
  LOGIN_ATTEMPT: "medium",
  USER_CREATED: "medium",
  USER_UPDATED: "low",
  SESSION_STARTED: "low",
  SESSION_ENDED: "low",
  LOGOUT: "low",
};

const ActivityLogDashboard = () => {
  // Core state
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);

  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [selectedUserId, setSelectedUserId] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [ipFilter, setIpFilter] = useState("");
  const [customDateRange, setCustomDateRange] = useState({
    start: "",
    end: "",
  });

  // UI state
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const [groupSimilar, setGroupSimilar] = useState(true); // Smart grouping enabled by default

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Auto-refresh state
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [newActivitiesCount, setNewActivitiesCount] = useState(0);
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date());

  // Load activities from backend
  const loadActivities = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        setError(null);

        const filters = {
          userId: selectedUserId !== "all" ? selectedUserId : undefined,
          actionType: filterType !== "all" ? filterType : undefined,
        };

        // Apply date range
        if (dateRange !== "all") {
          const now = new Date();
          if (dateRange === "today") {
            filters.startDate = new Date(
              now.setHours(0, 0, 0, 0)
            ).toISOString();
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

        // Custom date range
        if (customDateRange.start) filters.startDate = customDateRange.start;
        if (customDateRange.end) filters.endDate = customDateRange.end;

        const activityData = await UserManagementService.getAllActivityLogs(
          500,
          filters
        );

        // Check for new activities
        if (activities.length > 0 && activityData.length > activities.length) {
          setNewActivitiesCount(activityData.length - activities.length);
        }

        setActivities(activityData || []);
        setLastRefreshTime(new Date());
      } catch (error) {
        setError("Failed to load activity logs");
        console.error("Error loading activities:", error);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [selectedUserId, filterType, dateRange, customDateRange, activities.length]
  );

  // Load users
  const loadUsers = useCallback(async () => {
    try {
      const userData = await UserManagementService.getAllUsers();
      setUsers(userData || []);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  }, []);

  // Filter activities with all criteria
  const filterActivities = useCallback(() => {
    let filtered = [...activities];

    // Text search
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (activity) =>
          activity.description?.toLowerCase().includes(search) ||
          activity.user_name?.toLowerCase().includes(search) ||
          activity.activity_type?.toLowerCase().includes(search) ||
          activity.user_email?.toLowerCase().includes(search)
      );
    }

    // Activity type filter
    if (filterType !== "all") {
      filtered = filtered.filter(
        (activity) => activity.activity_type === filterType
      );
    }

    // User filter
    if (selectedUserId !== "all") {
      filtered = filtered.filter(
        (activity) => activity.user_id === selectedUserId
      );
    }

    // Status filter (success/failed)
    if (statusFilter !== "all") {
      filtered = filtered.filter((activity) => {
        if (statusFilter === "success")
          return activity.metadata?.success !== false;
        if (statusFilter === "failed")
          return activity.metadata?.success === false;
        return true;
      });
    }

    // Severity filter
    if (severityFilter !== "all") {
      filtered = filtered.filter((activity) => {
        const severity = SEVERITY_LEVELS[activity.activity_type] || "low";
        return severity === severityFilter;
      });
    }

    // IP filter
    if (ipFilter) {
      filtered = filtered.filter((activity) =>
        activity.ip_address?.toLowerCase().includes(ipFilter.toLowerCase())
      );
    }

    setFilteredActivities(filtered);
  }, [
    activities,
    searchTerm,
    filterType,
    selectedUserId,
    statusFilter,
    severityFilter,
    ipFilter,
  ]);

  // Smart grouping function to reduce repetitive activities
  const groupSimilarActivities = useCallback(
    (activities) => {
      if (!groupSimilar || activities.length === 0) return activities;

      const timeWindow = 10 * 60 * 1000; // 10 minutes
      const minGroupSize = 3;
      const grouped = [];
      let currentGroup = null;

      const sortedActivities = [...activities].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      sortedActivities.forEach((activity, index) => {
        if (index === 0) {
          currentGroup = {
            ...activity,
            count: 1,
            items: [activity],
            firstTime: activity.created_at,
            lastTime: activity.created_at,
            isGrouped: false,
          };
          return;
        }

        const prevActivity = sortedActivities[index - 1];
        const isSameType =
          activity.activity_type === prevActivity.activity_type;
        const isSameUser = activity.user_id === prevActivity.user_id;
        const timeDiff = Math.abs(
          new Date(activity.created_at) - new Date(prevActivity.created_at)
        );
        const withinWindow = timeDiff < timeWindow;

        if (isSameType && isSameUser && withinWindow && currentGroup) {
          currentGroup.count++;
          currentGroup.items.push(activity);
          currentGroup.lastTime = activity.created_at;
          currentGroup.isGrouped = currentGroup.count >= minGroupSize;
        } else {
          // Push previous group
          if (currentGroup.count >= minGroupSize) {
            grouped.push({ ...currentGroup, isGrouped: true });
          } else {
            // Don't group, push individual items
            grouped.push(...currentGroup.items);
          }

          // Start new group
          currentGroup = {
            ...activity,
            count: 1,
            items: [activity],
            firstTime: activity.created_at,
            lastTime: activity.created_at,
            isGrouped: false,
          };
        }
      });

      // Handle last group
      if (currentGroup) {
        if (currentGroup.count >= minGroupSize) {
          grouped.push({ ...currentGroup, isGrouped: true });
        } else {
          grouped.push(...currentGroup.items);
        }
      }

      return grouped;
    },
    [groupSimilar]
  );

  // Apply smart grouping before pagination
  const processedActivities = groupSimilarActivities(filteredActivities);

  // Pagination calculations
  const totalPages = Math.ceil(processedActivities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedActivities = processedActivities.slice(startIndex, endIndex);

  // Security analysis
  const securityAlerts = filteredActivities.filter(
    (a) =>
      a.metadata?.success === false ||
      SEVERITY_LEVELS[a.activity_type] === "high"
  );

  const suspiciousIPs = [
    ...new Set(
      filteredActivities
        .filter((a) => a.metadata?.success === false)
        .map((a) => a.ip_address)
    ),
  ];

  // Export functions
  const exportToCSV = useCallback(() => {
    const headers = [
      "Timestamp",
      "User",
      "Activity Type",
      "Description",
      "IP Address",
      "Status",
      "Severity",
    ];
    const rows = filteredActivities.map((activity) => [
      new Date(activity.created_at).toLocaleString(),
      activity.user_name,
      activity.activity_type,
      activity.description,
      activity.ip_address,
      activity.metadata?.success !== false ? "Success" : "Failed",
      SEVERITY_LEVELS[activity.activity_type] || "low",
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `activity-logs-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [filteredActivities]);

  const exportToJSON = useCallback(() => {
    const data = {
      exportDate: new Date().toISOString(),
      totalActivities: filteredActivities.length,
      filters: {
        searchTerm,
        filterType,
        dateRange,
        selectedUserId,
        statusFilter,
        severityFilter,
      },
      activities: filteredActivities,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `activity-logs-${
      new Date().toISOString().split("T")[0]
    }.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [
    filteredActivities,
    searchTerm,
    filterType,
    dateRange,
    selectedUserId,
    statusFilter,
    severityFilter,
  ]);

  // Helper functions
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
      USER_CREATED: "bg-green-50 border-green-200",
      USER_UPDATED: "bg-blue-50 border-blue-200",
      USER_DEACTIVATED: "bg-red-50 border-red-200",
      SESSION_STARTED: "bg-green-50 border-green-200",
      SESSION_ENDED: "bg-gray-50 border-gray-200",
      PASSWORD_RESET_REQUESTED: "bg-yellow-50 border-yellow-200",
      PERMISSION_CHANGED: "bg-purple-50 border-purple-200",
      BULK_USER_UPDATE: "bg-blue-50 border-blue-200",
      LOGIN_ATTEMPT: "bg-green-50 border-green-200",
      LOGOUT: "bg-gray-50 border-gray-200",
    };
    return colors[type] || "bg-gray-50 border-gray-200";
  };

  const getSeverityBadge = (type) => {
    const severity = SEVERITY_LEVELS[type] || "low";
    const colors = {
      high: "bg-red-100 text-red-800 border-red-300",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
      low: "bg-gray-100 text-gray-800 border-gray-300",
    };
    return (
      <span
        className={`px-2 py-0.5 text-xs font-medium rounded-full border ${colors[severity]}`}
      >
        {severity.toUpperCase()}
      </span>
    );
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

  const groupActivitiesByDate = (activities) => {
    const grouped = {};
    activities.forEach((activity) => {
      const date = new Date(activity.created_at).toLocaleDateString();
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(activity);
    });
    return grouped;
  };

  // Effects
  useEffect(() => {
    loadActivities();
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    filterActivities();
  }, [filterActivities]);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
  }, [
    searchTerm,
    filterType,
    selectedUserId,
    statusFilter,
    severityFilter,
    ipFilter,
  ]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadActivities(true); // Silent refresh
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadActivities]);

  // Loading state
  if (loading && activities.length === 0) {
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
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="h-7 w-7 text-blue-600" />
            Activity Logs
            {newActivitiesCount > 0 && (
              <span className="px-2 py-1 text-xs bg-blue-600 text-white rounded-full animate-pulse">
                +{newActivitiesCount} new
              </span>
            )}
          </h2>
          <p className="text-gray-600 mt-1">
            Monitor user activities and system events • Last updated:{" "}
            {formatDate(lastRefreshTime.toISOString())}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Auto-refresh toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`p-2 border rounded-lg transition-all ${
              autoRefresh
                ? "bg-blue-600 text-white border-blue-600"
                : "text-gray-600 hover:text-gray-900 border-gray-300 hover:bg-gray-50"
            }`}
            title={autoRefresh ? "Auto-refresh enabled" : "Enable auto-refresh"}
          >
            <Zap className={`h-5 w-5 ${autoRefresh ? "animate-pulse" : ""}`} />
          </button>

          {/* Refresh interval selector */}
          {autoRefresh && (
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value={15}>15s</option>
              <option value={30}>30s</option>
              <option value={60}>60s</option>
            </select>
          )}

          {/* Manual refresh */}
          <button
            onClick={() => loadActivities()}
            className="p-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
            title="Refresh now"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
          </button>

          {/* Export dropdown */}
          <div className="relative group">
            <button className="p-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all">
              <Download className="h-5 w-5" />
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={exportToCSV}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
              >
                <FileText className="h-4 w-4 text-green-600" />
                Export as CSV
              </button>
              <button
                onClick={exportToJSON}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
              >
                <FileJson className="h-4 w-4 text-blue-600" />
                Export as JSON
              </button>
            </div>
          </div>

          {/* View mode toggle */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-2 text-sm ${
                viewMode === "list"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode("timeline")}
              className={`px-3 py-2 text-sm ${
                viewMode === "timeline"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              Timeline
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2" />
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Security Alerts Section */}
      {securityAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-red-900">Security Alerts</h3>
            <span className="px-2 py-0.5 bg-red-600 text-white text-xs rounded-full">
              {securityAlerts.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-red-700 font-medium">Failed Login Attempts</p>
              <p className="text-2xl font-bold text-red-900">
                {
                  securityAlerts.filter((a) => a.metadata?.success === false)
                    .length
                }
              </p>
            </div>
            <div>
              <p className="text-red-700 font-medium">High Severity Events</p>
              <p className="text-2xl font-bold text-red-900">
                {
                  securityAlerts.filter(
                    (a) => SEVERITY_LEVELS[a.activity_type] === "high"
                  ).length
                }
              </p>
            </div>
            <div>
              <p className="text-red-700 font-medium">Suspicious IPs</p>
              <p className="text-2xl font-bold text-red-900">
                {suspiciousIPs.length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Basic Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative lg:col-span-2">
            <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search activities, users, emails..."
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
                {type.replace(/_/g, " ")}
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

        {/* Advanced Filters Toggle */}
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            <Filter className="h-4 w-4" />
            {showAdvancedFilters ? "Hide" : "Show"} Advanced Filters
          </button>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="groupSimilarToggle"
              checked={groupSimilar}
              onChange={(e) => setGroupSimilar(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label
              htmlFor="groupSimilarToggle"
              className="text-sm text-gray-700 cursor-pointer"
            >
              Group similar activities (reduces clutter)
            </label>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label
                htmlFor="statusFilter"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Status
              </label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="success">Success Only</option>
                <option value="failed">Failed Only</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="severityFilter"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Severity
              </label>
              <select
                id="severityFilter"
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Levels</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="ipFilter"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                IP Address
              </label>
              <div className="relative">
                <Globe className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  id="ipFilter"
                  type="text"
                  placeholder="Filter by IP..."
                  value={ipFilter}
                  onChange={(e) => setIpFilter(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="customDateStart"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Custom Date Range
              </label>
              <div className="flex gap-2">
                <input
                  id="customDateStart"
                  type="date"
                  value={customDateRange.start}
                  onChange={(e) =>
                    setCustomDateRange({
                      ...customDateRange,
                      start: e.target.value,
                    })
                  }
                  className="flex-1 px-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  id="customDateEnd"
                  type="date"
                  value={customDateRange.end}
                  onChange={(e) =>
                    setCustomDateRange({
                      ...customDateRange,
                      end: e.target.value,
                    })
                  }
                  className="flex-1 px-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Activity Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                {filteredActivities.length}
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
              <p className="text-sm font-medium text-gray-600">Successful</p>
              <p className="text-2xl font-bold text-gray-900">
                {
                  filteredActivities.filter(
                    (a) => a.metadata?.success !== false
                  ).length
                }
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
              <p className="text-sm font-medium text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-gray-900">
                {
                  filteredActivities.filter(
                    (a) => a.metadata?.success === false
                  ).length
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(filteredActivities.map((a) => a.user_id)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {viewMode === "list" ? "Activity Feed" : "Activity Timeline"}
          </h3>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              Showing {startIndex + 1}-
              {Math.min(endIndex, filteredActivities.length)} of{" "}
              {filteredActivities.length}
            </span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>
        </div>

        {/* List View */}
        {viewMode === "list" && (
          <div className="space-y-3">
            {paginatedActivities.map((activity, idx) => (
              <div
                key={activity.id || `activity-${idx}`}
                role="button"
                tabIndex={0}
                className={`p-4 rounded-lg border transition-all hover:shadow-md cursor-pointer ${getActivityColor(
                  activity.activity_type
                )} ${activity.isGrouped ? "border-l-4 border-l-blue-500" : ""}`}
                onClick={() => {
                  setSelectedActivity(activity);
                  setShowDetailsModal(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedActivity(activity);
                    setShowDetailsModal(true);
                  }
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex-shrink-0 p-2 bg-white rounded-lg shadow-sm">
                      {getActivityIcon(activity.activity_type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900">
                          {activity.activity_type.replace(/_/g, " ")}
                          {activity.isGrouped && activity.count > 1 && (
                            <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full font-bold">
                              ×{activity.count}
                            </span>
                          )}
                        </p>
                        {getSeverityBadge(activity.activity_type)}
                        {activity.metadata?.success !== undefined && (
                          <span
                            className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                              activity.metadata.success
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {activity.metadata.success ? "Success" : "Failed"}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mb-2">
                        {activity.isGrouped && activity.count > 1
                          ? `${activity.description} (${activity.count} times)`
                          : activity.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span className="font-medium">
                            {activity.user_name}
                          </span>
                          <span className="text-gray-400">
                            ({activity.user_email})
                          </span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {activity.isGrouped && activity.count > 1 ? (
                            <span>
                              {formatDate(activity.firstTime)} -{" "}
                              {formatDate(activity.lastTime)}
                            </span>
                          ) : (
                            <span>{formatDate(activity.created_at)}</span>
                          )}
                        </span>
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          <span>{activity.ip_address}</span>
                        </span>
                      </div>
                      {activity.isGrouped && activity.count > 1 && (
                        <div className="mt-2 text-xs text-blue-600 font-medium">
                          📋 Click to view all {activity.count} activities in
                          this group
                        </div>
                      )}
                    </div>
                  </div>

                  <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Timeline View */}
        {viewMode === "timeline" && (
          <div className="space-y-6">
            {Object.entries(groupActivitiesByDate(paginatedActivities)).map(
              ([date, dateActivities]) => (
                <div key={date}>
                  <div className="flex items-center gap-3 mb-4">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold text-gray-900">{date}</h4>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">
                      {dateActivities.length} activities
                    </span>
                  </div>
                  <div className="ml-8 space-y-3 border-l-2 border-gray-200 pl-6">
                    {dateActivities.map((activity) => (
                      <div
                        key={activity.id}
                        role="button"
                        tabIndex={0}
                        className="relative cursor-pointer group"
                        onClick={() => {
                          setSelectedActivity(activity);
                          setShowDetailsModal(true);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedActivity(activity);
                            setShowDetailsModal(true);
                          }
                        }}
                      >
                        <div className="absolute -left-9 top-2 w-4 h-4 bg-blue-600 rounded-full border-4 border-white group-hover:scale-125 transition-transform" />
                        <div
                          className={`p-3 rounded-lg border ${getActivityColor(
                            activity.activity_type
                          )} group-hover:shadow-md transition-all`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {getActivityIcon(activity.activity_type)}
                            <span className="font-medium text-sm">
                              {activity.activity_type.replace(/_/g, " ")}
                            </span>
                            {getSeverityBadge(activity.activity_type)}
                            <span className="text-xs text-gray-500 ml-auto">
                              {new Date(
                                activity.created_at
                              ).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-xs text-gray-700">
                            {activity.description}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {activity.user_name} • {activity.ip_address}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* Empty State */}
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

        {/* Pagination Controls */}
        {filteredActivities.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {/* Page numbers */}
              <div className="flex gap-1">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 rounded-lg border transition-colors ${
                        currentPage === pageNum
                          ? "bg-blue-600 text-white border-blue-600"
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Activity Details Modal */}
      {showDetailsModal && selectedActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                Activity Details
              </h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Activity Type & Status */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-gray-100 rounded-lg">
                    {getActivityIcon(selectedActivity.activity_type)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">
                      {selectedActivity.activity_type.replace(/_/g, " ")}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {selectedActivity.description}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  {getSeverityBadge(selectedActivity.activity_type)}
                  {selectedActivity.metadata?.success !== undefined && (
                    <span
                      className={`px-3 py-1 text-sm font-semibold rounded-full ${
                        selectedActivity.metadata.success
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {selectedActivity.metadata.success
                        ? "✓ Success"
                        : "✗ Failed"}
                    </span>
                  )}
                </div>
              </div>

              {/* User Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  User Information
                </h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Name</p>
                    <p className="font-medium text-gray-900">
                      {selectedActivity.user_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">
                      {selectedActivity.user_email}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Role</p>
                    <p className="font-medium text-gray-900">
                      {selectedActivity.user_role}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">User ID</p>
                    <p className="font-medium text-gray-900 font-mono text-xs">
                      {selectedActivity.user_id}
                    </p>
                  </div>
                </div>
              </div>

              {/* Technical Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Technical Details
                </h5>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-600">IP Address</p>
                    <p className="font-medium text-gray-900 font-mono">
                      {selectedActivity.ip_address}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">User Agent</p>
                    <p className="font-medium text-gray-900 text-xs break-all">
                      {selectedActivity.user_agent}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Timestamp</p>
                    <p className="font-medium text-gray-900">
                      {new Date(selectedActivity.created_at).toLocaleString()}
                      <span className="text-gray-500 ml-2">
                        ({formatDate(selectedActivity.created_at)})
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Activity ID</p>
                    <p className="font-medium text-gray-900 font-mono text-xs">
                      {selectedActivity.id}
                    </p>
                  </div>
                </div>
              </div>

              {/* Metadata */}
              {selectedActivity.metadata &&
                Object.keys(selectedActivity.metadata).length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Additional Metadata
                    </h5>
                    <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded-lg overflow-x-auto">
                      {JSON.stringify(selectedActivity.metadata, null, 2)}
                    </pre>
                  </div>
                )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 flex justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityLogDashboard;
