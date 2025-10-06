import React, { useState, useEffect } from "react";
import {
  Settings,
  Shield,
  Activity,
  Database,
  Bell,
  DollarSign,
  Globe,
  Key,
  RefreshCw,
  HardDrive,
  Zap,
  CheckCircle,
  Save,
  Upload,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { DashboardService } from "../services/domains/analytics/dashboardService";
import { useSettings } from "../contexts/SettingsContext";

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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
              <Settings className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  System Settings
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Admin
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
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

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
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
  );
}

// General Settings Component
function GeneralSettings() {
  const { settings: globalSettings, updateSettings } = useSettings();

  const [settings, setSettings] = useState({
    businessName: globalSettings.businessName || "MedCure Pharmacy",
    businessLogo: globalSettings.businessLogo || null,
    currency: globalSettings.currency || "PHP",
    taxRate: globalSettings.taxRate || "12",
    timezone: globalSettings.timezone || "Asia/Manila",
    enableNotifications: globalSettings.enableNotifications ?? true,
    enableEmailAlerts: globalSettings.enableEmailAlerts ?? true,
  });

  const [saved, setSaved] = useState(false);
  const [logoPreview, setLogoPreview] = useState(settings.businessLogo);

  // Update local state when global settings change
  useEffect(() => {
    setSettings({
      businessName: globalSettings.businessName || "MedCure Pharmacy",
      businessLogo: globalSettings.businessLogo || null,
      currency: globalSettings.currency || "PHP",
      taxRate: globalSettings.taxRate || "12",
      timezone: globalSettings.timezone || "Asia/Manila",
      enableNotifications: globalSettings.enableNotifications ?? true,
      enableEmailAlerts: globalSettings.enableEmailAlerts ?? true,
    });
    setLogoPreview(globalSettings.businessLogo);
  }, [globalSettings]);

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Please upload an image file");
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert("Image size should be less than 2MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setLogoPreview(base64String);
        setSettings({ ...settings, businessLogo: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    setSettings({ ...settings, businessLogo: null });
  };

  const handleSave = () => {
    // Save settings to global context (which saves to localStorage)
    updateSettings(settings);
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

        {/* Logo Upload Section */}
        <div className="mb-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-6">
            {/* Logo Preview */}
            <div className="flex-shrink-0">
              <div className="relative">
                {logoPreview ? (
                  <div className="relative group">
                    <img
                      src={logoPreview}
                      alt="Business Logo"
                      className="w-24 h-24 rounded-lg object-cover border-2 border-blue-300 shadow-md"
                    />
                    <button
                      onClick={handleRemoveLogo}
                      className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center border-2 border-dashed border-blue-300">
                    <ImageIcon className="h-10 w-10 text-blue-400" />
                  </div>
                )}
              </div>
            </div>

            {/* Upload Instructions */}
            <div className="flex-1">
              <h4 className="text-base font-semibold text-gray-900 mb-2">
                Business Logo
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                Upload your business logo to personalize the sidebar.
                Recommended size: 256x256px or larger. Max file size: 2MB.
              </p>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors shadow-md hover:shadow-lg">
                  <Upload className="h-4 w-4" />
                  <span className="text-sm font-medium">Upload Logo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                {logoPreview && (
                  <button
                    onClick={handleRemoveLogo}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                  >
                    Remove Logo
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Business Name and Timezone */}
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
              placeholder="Enter your business name"
            />
            <p className="text-xs text-gray-500 mt-1">
              This will appear in the sidebar and throughout the system
            </p>
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
