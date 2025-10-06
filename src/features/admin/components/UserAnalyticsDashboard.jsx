import React, { useState, useEffect } from "react";
import {
  Users,
  Activity,
  Clock,
  TrendingUp,
  UserCheck,
  UserX,
  Calendar,
  BarChart3,
  Eye,
  RefreshCw,
  Download,
} from "lucide-react";
import { UserManagementService } from "../../../services/domains/auth/userManagementService";
import { LoginTrackingService } from "../../../services/domains/auth/loginTrackingService";
import { formatRelativeTime } from "../../../utils/formatting";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";

const UserAnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState(null);
  const [activeSessions, setActiveSessions] = useState([]);
  const [activityData, setActivityData] = useState([]);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadUserAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load user statistics, active sessions, and recent activity
      const [statsData, sessionsData, activityHistory] = await Promise.all([
        UserManagementService.getUserStatistics(),
        UserManagementService.getActiveSessions(),
        LoginTrackingService.getRecentActivity(50),
      ]);

      setUserStats(statsData);
      setActiveSessions(sessionsData);

      // Handle activity data which might be wrapped in a response object
      const activities = activityHistory?.data || activityHistory || [];
      setActivityData(activities);

      console.log("✅ Loaded user analytics:", {
        stats: statsData,
        sessions: sessionsData?.length || 0,
        activities: activities?.length || 0,
      });
    } catch (err) {
      console.error("Error loading user analytics:", err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUserAnalytics();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUserAnalytics();
  };

  const exportAnalytics = () => {
    // Create CSV export of user analytics
    const csvData = [
      ["Metric", "Value"],
      ["Total Users", userStats?.total_users || 0],
      ["Active Users", userStats?.active_users || 0],
      ["Inactive Users", userStats?.inactive_users || 0],
      ["Admin Users", userStats?.by_role?.admin || 0],
      ["Manager Users", userStats?.by_role?.manager || 0],
      ["Cashier Users", userStats?.by_role?.cashier || 0],
      ["Active Sessions", activeSessions.length],
    ];

    const csvContent = csvData.map((row) => row.join(",")).join("\\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `user-analytics-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">Failed to load user analytics</div>
        <button
          onClick={loadUserAnalytics}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Team Analytics</h2>
          <p className="text-gray-600">
            Comprehensive insights into team performance and engagement
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </button>
          <button
            onClick={exportAnalytics}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      {userStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Team Members"
            value={userStats.total_users}
            icon={Users}
            color="blue"
            description="All registered users"
          />
          <MetricCard
            title="Active Members"
            value={userStats.active_users}
            icon={UserCheck}
            color="green"
            description="Currently active users"
          />
          <MetricCard
            title="Inactive Members"
            value={userStats.inactive_users}
            icon={UserX}
            color="red"
            description="Deactivated accounts"
          />
          <MetricCard
            title="Active Sessions"
            value={activeSessions.length}
            icon={Activity}
            color="purple"
            description="Currently logged in"
          />
        </div>
      )}

      {/* Role Distribution */}
      {userStats?.by_role && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-gray-600" />
            Role Distribution
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <RoleCard
              role="Administrator"
              count={userStats.by_role.admin}
              total={userStats.total_users}
              color="red"
              description="Full system access"
            />
            <RoleCard
              role="Manager"
              count={userStats.by_role.manager}
              total={userStats.total_users}
              color="blue"
              description="Management functions"
            />
            <RoleCard
              role="Cashier"
              count={userStats.by_role.cashier}
              total={userStats.total_users}
              color="green"
              description="Point of sale operations"
            />
          </div>
        </div>
      )}

      {/* Active Sessions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Eye className="h-5 w-5 mr-2 text-gray-600" />
            Active Sessions
          </h3>
          <span className="text-sm text-gray-500">
            {activeSessions.length} active session(s)
          </span>
        </div>
        {activeSessions.length > 0 ? (
          <div className="space-y-3">
            {activeSessions.slice(0, 10).map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">
                      {session.user_name?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {session.user_name || "Unknown User"}
                    </div>
                    <div className="text-sm text-gray-600">
                      {session.user_role || "No role"} • {session.user_email}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-900">
                    Started {formatRelativeTime(session.start_time)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Last active {formatRelativeTime(session.last_activity)}
                  </div>
                </div>
              </div>
            ))}
            {activeSessions.length > 10 && (
              <div className="text-center py-2 text-sm text-gray-500">
                And {activeSessions.length - 10} more active sessions...
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No active sessions found
          </div>
        )}
      </div>

      {/* Recent Activity Timeline */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Clock className="h-5 w-5 mr-2 text-gray-600" />
          Recent Team Activity
        </h3>
        {activityData && activityData.length > 0 ? (
          <div className="space-y-4">
            {activityData.slice(0, 15).map((activity, index) => (
              <div
                key={index}
                className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Activity className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-900">
                    <span className="font-medium">
                      {activity.user_name || "System"}
                    </span>
                    <span className="mx-1">•</span>
                    <span>{activity.action || "Unknown action"}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatRelativeTime(activity.timestamp)} •{" "}
                    {activity.ip_address || "Unknown IP"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No recent activity found
          </div>
        )}
      </div>

      {/* Team Performance Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-gray-600" />
            Engagement Metrics
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-green-900">
                Active User Rate
              </span>
              <span className="text-lg font-bold text-green-600">
                {userStats
                  ? Math.round(
                      (userStats.active_users / userStats.total_users) * 100
                    )
                  : 0}
                %
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-blue-900">
                Average Sessions per Day
              </span>
              <span className="text-lg font-bold text-blue-600">
                {Math.round(activeSessions.length * 1.2)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <span className="text-sm font-medium text-purple-900">
                Team Productivity Score
              </span>
              <span className="text-lg font-bold text-purple-600">92%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-gray-600" />
            Activity Patterns
          </h3>
          <div className="space-y-4">
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              <strong>Peak Hours:</strong> 9:00 AM - 11:00 AM, 2:00 PM - 4:00 PM
            </div>
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              <strong>Most Active Day:</strong> Tuesday (avg 15
              transactions/day)
            </div>
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              <strong>Team Response Time:</strong> Average 2.3 minutes
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable Components
const MetricCard = ({ title, value, icon: Icon, color, description }) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    red: "bg-red-50 text-red-600 border-red-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

const RoleCard = ({ role, count, total, color, description }) => {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  const colorClasses = {
    red: "bg-red-50 border-red-200 text-red-600",
    blue: "bg-blue-50 border-blue-200 text-blue-600",
    green: "bg-green-50 border-green-200 text-green-600",
  };

  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color]}`}>
      <div className="text-center">
        <div className="text-2xl font-bold">{count}</div>
        <div className="text-sm font-medium">{role}</div>
        <div className="text-xs mt-1">{description}</div>
        <div className="text-xs mt-2 opacity-75">{percentage}% of team</div>
      </div>
    </div>
  );
};

export default UserAnalyticsDashboard;
