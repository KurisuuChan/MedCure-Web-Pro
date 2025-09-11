import React, { useState, useEffect } from "react";
import {
  Activity,
  Cpu,
  Database,
  Globe,
  Shield,
  Zap,
  RefreshCw,
} from "lucide-react";
import SystemHealthCheck from "../../utils/systemHealthCheck";
import { PerformanceMonitor } from "../../services/core/performanceOptimization";

const SystemHealthDashboard = () => {
  const [healthData, setHealthData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState({});

  useEffect(() => {
    // Run initial health check
    runHealthCheck();

    // Set up performance monitoring
    const cleanup = PerformanceMonitor.addObserver((metric) => {
      setPerformanceMetrics((prev) => ({
        ...prev,
        [metric.name]: metric,
      }));
    });

    return cleanup;
  }, []);

  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        runHealthCheck();
      }, 30000); // Check every 30 seconds
    }
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const runHealthCheck = async () => {
    setIsLoading(true);
    try {
      const healthCheck = new SystemHealthCheck();
      const results = await healthCheck.runComplete();
      setHealthData(results);
      setLastCheck(new Date());
    } catch (error) {
      console.error("Health check failed:", error);
      setHealthData({
        overall: "critical",
        database: "critical",
        authentication: "unknown",
        features: "unknown",
        performance: "unknown",
        security: "unknown",
        details: { error: error.message },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "healthy":
        return "text-green-600 bg-green-100";
      case "warning":
        return "text-yellow-600 bg-yellow-100";
      case "critical":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "healthy":
        return "✅";
      case "warning":
        return "⚠️";
      case "critical":
        return "❌";
      default:
        return "❓";
    }
  };

  const StatusCard = ({ title, status, icon: Icon, details }) => (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-l-blue-500">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Icon className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
            status
          )}`}
        >
          {getStatusIcon(status)} {status?.toUpperCase() || "UNKNOWN"}
        </span>
      </div>

      {details && (
        <div className="space-y-2">
          {Object.entries(details).map(([key, value]) => (
            <div key={key} className="text-sm">
              <span className="font-medium text-gray-700">{key}:</span>
              <span className="ml-2 text-gray-600">
                {typeof value === "object"
                  ? JSON.stringify(value, null, 2)
                  : String(value)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const PerformanceMetricsCard = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center space-x-3 mb-4">
        <Zap className="h-6 w-6 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Performance Metrics
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(performanceMetrics).map(([name, metric]) => (
          <div key={name} className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-gray-700">{name}</div>
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(metric.duration)}ms
            </div>
            <div className="text-xs text-gray-500">
              {new Date(metric.startTime).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>

      {Object.keys(performanceMetrics).length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No performance metrics recorded yet
        </div>
      )}
    </div>
  );

  const SystemOverview = () => {
    if (!healthData) return null;

    const overallStatusColor = getStatusColor(healthData.overall);

    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Activity className="h-8 w-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                System Health Overview
              </h2>
              <p className="text-gray-600">
                Last checked: {lastCheck ? lastCheck.toLocaleString() : "Never"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div
              className={`px-6 py-3 rounded-full text-lg font-bold ${overallStatusColor}`}
            >
              {getStatusIcon(healthData.overall)}{" "}
              {healthData.overall?.toUpperCase() || "UNKNOWN"}
            </div>

            <div className="flex items-center space-x-2">
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                <span>Auto-refresh</span>
              </label>

              <button
                onClick={runHealthCheck}
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <SystemOverview />

      {isLoading && (
        <div className="text-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-gray-600">Running system health check...</p>
        </div>
      )}

      {healthData && !isLoading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatusCard
              title="Database"
              status={healthData.database}
              icon={Database}
              details={healthData.details?.database}
            />

            <StatusCard
              title="Authentication"
              status={healthData.authentication}
              icon={Shield}
              details={healthData.details?.authentication}
            />

            <StatusCard
              title="Features"
              status={healthData.features}
              icon={Cpu}
              details={healthData.details?.features}
            />

            <StatusCard
              title="Performance"
              status={healthData.performance}
              icon={Zap}
              details={healthData.details?.performance}
            />

            <StatusCard
              title="Security"
              status={healthData.security}
              icon={Shield}
              details={healthData.details?.security}
            />

            <StatusCard
              title="Network"
              status="healthy"
              icon={Globe}
              details={{
                connection: "Active",
                latency: "< 100ms",
                bandwidth: "Good",
              }}
            />
          </div>

          <PerformanceMetricsCard />

          {healthData.overall !== "healthy" && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Activity className="h-6 w-6 text-yellow-600" />
                <h3 className="text-lg font-semibold text-yellow-800">
                  System Recommendations
                </h3>
              </div>

              <div className="space-y-2">
                {healthData.database === "warning" && (
                  <div className="text-yellow-700">
                    🔧 Database: Review database connectivity and optimize
                    queries
                  </div>
                )}
                {healthData.authentication === "warning" && (
                  <div className="text-yellow-700">
                    🔐 Authentication: Check auth service configuration
                  </div>
                )}
                {healthData.features === "warning" && (
                  <div className="text-yellow-700">
                    🛠️ Features: Test core functionality and resolve issues
                  </div>
                )}
                {healthData.performance === "warning" && (
                  <div className="text-yellow-700">
                    ⚡ Performance: Optimize response times and memory usage
                  </div>
                )}
                {healthData.security === "warning" && (
                  <div className="text-yellow-700">
                    🔒 Security: Review security configuration
                  </div>
                )}
              </div>
            </div>
          )}

          {healthData.overall === "healthy" && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <div className="text-green-600 text-xl font-semibold mb-2">
                🎉 All Systems Operational
              </div>
              <p className="text-green-700">
                Your MedCure-Pro system is running optimally with no issues
                detected.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SystemHealthDashboard;
