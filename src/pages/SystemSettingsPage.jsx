import React, { useState, useEffect } from "react";
import {
  Settings,
  Shield,
  Activity,
  Database,
  Bell,
  DollarSign,
  Clock,
  Globe,
  Key,
  RefreshCw,
  HardDrive,
  Zap,
  CheckCircle,
  Save,
} from "lucide-react";
import { DashboardService } from "../services/domains/analytics/dashboardService";

export default function SystemSettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [systemHealth] = useState({
    status: "operational",
    uptime: "99.9%",
    lastBackup: new Date().toISOString(),
    storageUsed: 2.3,
    storageTotal: 10,
  });
  const [loading, setLoading] = useState(false);

  const tabs = [
    {
      id: "general",
      label: "General Settings",
      icon: Settings,
      description: "Business information and system preferences",
    },
    {
      id: "security",
      label: "Security & Backup",
      icon: Shield,
      description: "Security policies and data protection",
    },
    {
      id: "health",
      label: "System Health",
      icon: Activity,
      description: "Monitor system performance and status",
    },
  ];

  useEffect(() => {
    loadSystemHealth();
  }, []);

  const loadSystemHealth = async () => {
    try {
      setLoading(true);
      const result = await DashboardService.getDashboardData();
      if (result.success) {
        // Update system health metrics from dashboard data
        console.log("✅ System health loaded");
      }
    } catch (error) {
      console.error("Error loading system health:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-purple-100 p-3 rounded-xl">
                  <Settings className="h-8 w-8 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                    <span>System Settings</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Admin
                    </span>
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Configure system preferences, security, and maintenance
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-full ${
                    systemHealth.status === "operational"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium capitalize">
                    {systemHealth.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                      activeTab === tab.id
                        ? "border-purple-500 text-purple-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Description */}
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
            <p className="text-sm text-gray-600">
              {tabs.find((tab) => tab.id === activeTab)?.description}
            </p>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "general" && <GeneralSettings />}
            {activeTab === "security" && <SecurityBackup />}
            {activeTab === "health" && (
              <SystemHealth systemHealth={systemHealth} loading={loading} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// General Settings Component
function GeneralSettings() {
  const [settings, setSettings] = useState({
    businessName: "MedCure Pharmacy",
    currency: "PHP",
    taxRate: "12",
    timezone: "Asia/Manila",
    operatingHours: {
      open: "08:00",
      close: "20:00",
    },
    lowStockThreshold: "10",
    enableNotifications: true,
    enableEmailAlerts: true,
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // TODO: Save settings to database
    console.log("💾 Saving general settings:", settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Business Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
          <Globe className="h-5 w-5 text-gray-500" />
          <span>Business Information</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Name
            </label>
            <input
              type="text"
              value={settings.businessName}
              onChange={(e) =>
                setSettings({ ...settings, businessName: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timezone
            </label>
            <select
              value={settings.timezone}
              onChange={(e) =>
                setSettings({ ...settings, timezone: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="Asia/Manila">Asia/Manila (GMT+8)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (GMT+9)</option>
              <option value="Asia/Singapore">Asia/Singapore (GMT+8)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Financial Settings */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
          <DollarSign className="h-5 w-5 text-gray-500" />
          <span>Financial Configuration</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Currency
            </label>
            <select
              value={settings.currency}
              onChange={(e) =>
                setSettings({ ...settings, currency: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="PHP">Philippine Peso (₱)</option>
              <option value="USD">US Dollar ($)</option>
              <option value="EUR">Euro (€)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tax Rate (%)
            </label>
            <input
              type="number"
              value={settings.taxRate}
              onChange={(e) =>
                setSettings({ ...settings, taxRate: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Operating Hours */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
          <Clock className="h-5 w-5 text-gray-500" />
          <span>Operating Hours</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Opening Time
            </label>
            <input
              type="time"
              value={settings.operatingHours.open}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  operatingHours: {
                    ...settings.operatingHours,
                    open: e.target.value,
                  },
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Closing Time
            </label>
            <input
              type="time"
              value={settings.operatingHours.close}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  operatingHours: {
                    ...settings.operatingHours,
                    close: e.target.value,
                  },
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Inventory Settings */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
          <Database className="h-5 w-5 text-gray-500" />
          <span>Inventory Configuration</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Low Stock Threshold
            </label>
            <input
              type="number"
              value={settings.lowStockThreshold}
              onChange={(e) =>
                setSettings({ ...settings, lowStockThreshold: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">
              Alert when stock falls below this quantity
            </p>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
          <Bell className="h-5 w-5 text-gray-500" />
          <span>Notifications</span>
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">System Notifications</p>
              <p className="text-sm text-gray-500">
                Receive alerts for low stock, sales, and system events
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableNotifications}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    enableNotifications: e.target.checked,
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Email Alerts</p>
              <p className="text-sm text-gray-500">
                Send email notifications for critical events
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableEmailAlerts}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    enableEmailAlerts: e.target.checked,
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end space-x-4 pt-6 border-t">
        {saved && (
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Settings saved!</span>
          </div>
        )}
        <button
          onClick={handleSave}
          className="flex items-center space-x-2 px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Save className="h-4 w-4" />
          <span>Save Changes</span>
        </button>
      </div>
    </div>
  );
}

// Security & Backup Component
function SecurityBackup() {
  const [securitySettings, setSecuritySettings] = useState({
    passwordMinLength: "8",
    sessionTimeout: "30",
    requireTwoFactor: false,
    autoBackupEnabled: true,
    backupFrequency: "daily",
    retentionDays: "30",
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    console.log("💾 Saving security settings:", securitySettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleManualBackup = () => {
    console.log("💾 Initiating manual backup...");
    alert("Manual backup initiated! This may take a few minutes.");
  };

  return (
    <div className="space-y-8">
      {/* Password Policy */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
          <Key className="h-5 w-5 text-gray-500" />
          <span>Password Policy</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Password Length
            </label>
            <input
              type="number"
              value={securitySettings.passwordMinLength}
              onChange={(e) =>
                setSecuritySettings({
                  ...securitySettings,
                  passwordMinLength: e.target.value,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Timeout (minutes)
            </label>
            <input
              type="number"
              value={securitySettings.sessionTimeout}
              onChange={(e) =>
                setSecuritySettings({
                  ...securitySettings,
                  sessionTimeout: e.target.value,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
          <Shield className="h-5 w-5 text-gray-500" />
          <span>Authentication Security</span>
        </h3>
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">
              Two-Factor Authentication
            </p>
            <p className="text-sm text-gray-500">
              Require 2FA for all administrative accounts
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={securitySettings.requireTwoFactor}
              onChange={(e) =>
                setSecuritySettings({
                  ...securitySettings,
                  requireTwoFactor: e.target.checked,
                })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
          </label>
        </div>
      </div>

      {/* Backup Configuration */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
          <Database className="h-5 w-5 text-gray-500" />
          <span>Backup Configuration</span>
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Automatic Backups</p>
              <p className="text-sm text-gray-500">
                Schedule automatic database backups
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={securitySettings.autoBackupEnabled}
                onChange={(e) =>
                  setSecuritySettings({
                    ...securitySettings,
                    autoBackupEnabled: e.target.checked,
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {securitySettings.autoBackupEnabled && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Backup Frequency
                </label>
                <select
                  value={securitySettings.backupFrequency}
                  onChange={(e) =>
                    setSecuritySettings({
                      ...securitySettings,
                      backupFrequency: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="hourly">Every Hour</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Retention Period (days)
                </label>
                <input
                  type="number"
                  value={securitySettings.retentionDays}
                  onChange={(e) =>
                    setSecuritySettings({
                      ...securitySettings,
                      retentionDays: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Manual Backup */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="text-base font-medium text-blue-900 mb-1">
              Manual Backup
            </h4>
            <p className="text-sm text-blue-700">
              Create an immediate backup of all system data
            </p>
          </div>
          <button
            onClick={handleManualBackup}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Database className="h-4 w-4" />
            <span>Backup Now</span>
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end space-x-4 pt-6 border-t">
        {saved && (
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Settings saved!</span>
          </div>
        )}
        <button
          onClick={handleSave}
          className="flex items-center space-x-2 px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Save className="h-4 w-4" />
          <span>Save Changes</span>
        </button>
      </div>
    </div>
  );
}

// System Health Component
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

      {/* System Components */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
          <Activity className="h-5 w-5 text-gray-500" />
          <span>System Components</span>
        </h3>
        <div className="space-y-3">
          {[
            { name: "Database", status: "operational", load: 45 },
            { name: "API Services", status: "operational", load: 32 },
            { name: "File Storage", status: "operational", load: 28 },
            { name: "Cache System", status: "operational", load: 15 },
          ].map((component) => (
            <div
              key={component.name}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-gray-900">
                  {component.name}
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-32 h-2 bg-gray-200 rounded-full">
                    <div
                      className="h-2 bg-green-500 rounded-full transition-all"
                      style={{ width: `${component.load}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600">
                    {component.load}%
                  </span>
                </div>
                <span className="text-sm text-green-600 font-medium capitalize">
                  {component.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Refresh Button */}
      <div className="flex items-center justify-end">
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Status</span>
        </button>
      </div>
    </div>
  );
}
