import {
  Activity,
  Zap,
  HardDrive,
  Database,
  RefreshCw,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

function SystemHealth({ systemHealth, loading }) {
  const handleRefresh = () => {
    window.location.reload();
  };

  const storagePercentage = (
    (systemHealth.storageUsed / systemHealth.storageTotal) *
    100
  ).toFixed(1);

  return (
    <div className="space-y-6">
      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <Zap className="h-8 w-8 text-green-600" />
            <span className="text-xs font-medium text-green-700 bg-green-200 px-2 py-1 rounded-full">
              Operational
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {systemHealth.uptime}
          </h3>
          <p className="text-sm text-gray-600">System Uptime</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <HardDrive className="h-8 w-8 text-blue-600" />
            <span className="text-xs font-medium text-blue-700 bg-blue-200 px-2 py-1 rounded-full">
              {storagePercentage}%
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {systemHealth.storageUsed} GB
          </h3>
          <p className="text-sm text-gray-600">
            of {systemHealth.storageTotal} GB used
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <Database className="h-8 w-8 text-purple-600" />
            <span className="text-xs font-medium text-purple-700 bg-purple-200 px-2 py-1 rounded-full">
              Active
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {new Date(systemHealth.lastBackup).toLocaleDateString()}
          </h3>
          <p className="text-sm text-gray-600">Last Backup</p>
        </div>
      </div>

      {/* System Health Details */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
            <Activity className="h-5 w-5 text-gray-500" />
            <span>System Status</span>
          </h3>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Database Connection</span>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">
                Connected
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">API Services</span>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">
                Running
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">System Performance</span>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">
                Optimal
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Storage Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
          <HardDrive className="h-5 w-5 text-gray-500" />
          <span>Storage Details</span>
        </h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Database</span>
              <span className="text-sm font-medium text-gray-900">
                {systemHealth.storageUsed} GB
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all"
                style={{ width: `${storagePercentage}%` }}
              ></div>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Total capacity: {systemHealth.storageTotal} GB
          </p>
        </div>
      </div>
    </div>
  );
}

export default SystemHealth;
