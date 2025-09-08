import React, { useState, useEffect } from "react";
import {
  Users,
  Clock,
  Activity,
  Shield,
  Calendar,
  Eye,
  UserCheck,
  Globe,
  RefreshCw,
} from "lucide-react";
import { LoginTrackingService } from "../../services/loginTrackingService";
import { formatDate } from "../../utils/dateTime";

export default function LoginMonitor() {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loginStats, setLoginStats] = useState({});
  const [activeSessions, setActiveSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("week");

  useEffect(() => {
    loadLoginData();

    // Refresh data every 30 seconds
    const interval = setInterval(loadLoginData, 30000);
    return () => clearInterval(interval);
  }, [timeframe]);

  const loadLoginData = async () => {
    try {
      setIsLoading(true);

      const [onlineResult, statsResult, sessionsResult] = await Promise.all([
        LoginTrackingService.getOnlineUsers(),
        LoginTrackingService.getLoginStats(timeframe),
        LoginTrackingService.getActiveSessions(),
      ]);

      if (onlineResult.success) setOnlineUsers(onlineResult.data);
      if (statsResult.success) setLoginStats(statsResult.data);
      if (sessionsResult.success) setActiveSessions(sessionsResult.data);
    } catch (error) {
      console.error("Failed to load login data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 p-3 rounded-xl">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Login Monitor
              </h1>
              <p className="text-gray-600">
                Track user activity and system access
              </p>
            </div>
          </div>
          <button
            onClick={loadLoginData}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Currently Online"
          value={onlineUsers.length}
          icon={UserCheck}
          color="green"
          subtitle="Active users"
        />
        <StatCard
          title={`Total Logins (${timeframe})`}
          value={loginStats.totalLogins || 0}
          icon={Activity}
          color="blue"
          subtitle="Login attempts"
        />
        <StatCard
          title="Unique Users"
          value={loginStats.uniqueUsers || 0}
          icon={Users}
          color="purple"
          subtitle={`This ${timeframe}`}
        />
        <StatCard
          title="Avg. Daily Logins"
          value={loginStats.avgLoginsPerDay || 0}
          icon={Calendar}
          color="orange"
          subtitle="Per day"
        />
      </div>

      {/* Timeframe Selector */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Statistics Timeframe
        </h3>
        <div className="flex space-x-2">
          {["day", "week", "month"].map((period) => (
            <button
              key={period}
              onClick={() => setTimeframe(period)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                timeframe === period
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Currently Online Users */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Globe className="h-5 w-5 mr-2 text-green-600" />
            Currently Online ({onlineUsers.length})
          </h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {onlineUsers.length > 0 ? (
              onlineUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user.first_name?.[0]}
                        {user.last_name?.[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-sm text-gray-500">{user.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1 text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-medium">Online</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {LoginTrackingService.formatLastLogin(user.last_login)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No users currently online</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-blue-600" />
            Recent Sessions (24h)
          </h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {activeSessions.length > 0 ? (
              activeSessions.slice(0, 10).map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        LoginTrackingService.isUserOnline(session.last_login)
                          ? "bg-green-600"
                          : "bg-gray-400"
                      }`}
                    >
                      <span className="text-white text-sm font-medium">
                        {session.first_name?.[0]}
                        {session.last_name?.[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {session.first_name} {session.last_name}
                      </p>
                      <p className="text-sm text-gray-500">{session.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {LoginTrackingService.formatLastLogin(session.last_login)}
                    </p>
                    <p className="text-xs text-gray-500">{session.role}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No recent sessions found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Statistics Card Component
function StatCard({ title, value, icon: Icon, color, subtitle }) {
  const colorClasses = {
    green: "bg-green-50 text-green-600 border-green-200",
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
    orange: "bg-orange-50 text-orange-600 border-orange-200",
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        </div>
        <div className={`p-3 rounded-xl border ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
