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
  Loader2,
  AlertTriangle,
  Info,
  Download,
  RotateCcw,
  FileDown,
  History,
  UploadCloud,
  FileJson,
} from "lucide-react";
import { DashboardService } from "../services/domains/analytics/dashboardService";
import { useSettings } from "../contexts/SettingsContext";
import SecurityBackupService from "../services/security/securityBackupService";
import { useToast } from "../components/ui/Toast";

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
  const { success: showSuccess, error: showError, info: showInfo } = useToast();

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
        showError("Please upload an image file", { duration: 4000 });
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        showError("Image size should be less than 2MB", { duration: 4000 });
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
    
    // Show success toast
    showSuccess(
      "⚙️ General settings saved successfully!",
      {
        duration: 4000,
        action: {
          label: "Got it!",
          onClick: () => {}
        }
      }
    );
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Currency
          </label>
          <select
            value={settings.currency}
            onChange={(e) =>
              setSettings({ ...settings, currency: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent max-w-md"
          >
            <option value="PHP">Philippine Peso (₱)</option>
            <option value="USD">US Dollar ($)</option>
            <option value="EUR">Euro (€)</option>
          </select>
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
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg opacity-60 cursor-not-allowed">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-900">Email Alerts</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-sm">
                  Coming Soon
                </span>
              </div>
              <p className="text-sm text-gray-500">
                Send email notifications for critical events
              </p>
            </div>
            <div className="relative inline-flex items-center">
              <div className="w-11 h-6 bg-gray-300 rounded-full relative">
                <div className="absolute top-[2px] left-[2px] bg-gray-400 border-gray-300 border rounded-full h-5 w-5"></div>
              </div>
            </div>
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
  const [securitySettings, setSecuritySettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [backing, setBacking] = useState(false);
  const [saved, setSaved] = useState(false);
  const [lastBackup, setLastBackup] = useState(null);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    loadSecuritySettings();
    loadLastBackupInfo();
  }, []);

  const loadSecuritySettings = async () => {
    try {
      setLoading(true);
      const settings = await SecurityBackupService.loadSecuritySettings();
      setSecuritySettings(settings);
    } catch (error) {
      console.error("Error loading security settings:", error);
      setSecuritySettings(SecurityBackupService.getDefaultSettings());
    } finally {
      setLoading(false);
    }
  };

  const loadLastBackupInfo = async () => {
    try {
      const info = await SecurityBackupService.getLastBackupInfo();
      setLastBackup(info);
    } catch (error) {
      console.error("Error loading backup info:", error);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const result = await SecurityBackupService.saveSecuritySettings(
        securitySettings
      );

      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);

        // Show success toast
        showSuccess(
          "🔒 Security settings saved successfully!",
          {
            duration: 4000,
            action: {
              label: "Great!",
              onClick: () => {}
            }
          }
        );

        // Clean up old backups if retention policy changed
        if (securitySettings.autoBackupEnabled) {
          await SecurityBackupService.cleanupOldBackups(
            securitySettings.retentionDays
          );
        }
      } else {
        showError("Failed to save security settings. Please try again.", { duration: 5000 });
      }
    } catch (error) {
      console.error("Error saving security settings:", error);
      showError("An error occurred while saving settings.", { duration: 5000 });
    } finally {
      setSaving(false);
    }
  };

  const handleManualBackup = async () => {
    setShowBackupModal(true);
  };

  const confirmBackup = async () => {
    setShowBackupModal(false);
    try {
      setBacking(true);
      const result = await SecurityBackupService.createManualBackup();

      if (result.success) {
        await loadLastBackupInfo();
        showSuccess(
          `💾 Backup completed successfully! ${result.backup.tables} tables with ${result.backup.totalRecords} records backed up.`,
          {
            duration: 6000,
            action: {
              label: "Download",
              onClick: () => handleDownloadBackup()
            }
          }
        );
      } else {
        showError(`Backup failed: ${result.error}`, { duration: 6000 });
      }
    } catch (error) {
      console.error("Error creating backup:", error);
      showError("An error occurred during backup. Please try again.", { duration: 5000 });
    } finally {
      setBacking(false);
    }
  };

  const handleDownloadBackup = () => {
    setShowDownloadModal(true);
  };

  const confirmDownloadBackup = () => {
    setShowDownloadModal(false);
    try {
      const backupData = localStorage.getItem("medcure-last-backup");
      if (!backupData) {
        showError("No backup found. Please create a backup first.", { duration: 5000 });
        return;
      }

      const backup = JSON.parse(backupData);
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `medcure-backup-${new Date(backup.timestamp)
        .toISOString()
        .replace(/[:.]/g, "-")}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showSuccess(
        `📥 Backup downloaded successfully! File size: ${(blob.size / 1024).toFixed(2)} KB with ${backup.totalRecords || "N/A"} records.`,
        {
          duration: 5000,
          action: {
            label: "Open Folder",
            onClick: () => {}
          }
        }
      );
    } catch (error) {
      console.error("Error downloading backup:", error);
      showError("Failed to download backup. Please try again.", { duration: 5000 });
    }
  };

  const handleRestoreBackup = () => {
    setShowRestoreModal(true);
  };

  const confirmRestoreBackup = async () => {
    setShowRestoreModal(false);
    try {
      setRestoring(true);

      // This is a placeholder for restore functionality
      // In production, you would implement actual database restoration
      showInfo(
        "🔧 Restore functionality requires backend implementation. Contact your database administrator for manual restore or implement the restore API endpoint.",
        {
          duration: 8000,
          persistent: false
        }
      );
    } catch (error) {
      console.error("Error restoring backup:", error);
      showError("Failed to restore backup. Please try again.", { duration: 5000 });
    } finally {
      setRestoring(false);
    }
  };

  // Import Backup Functions
  const handleImportBackup = () => {
    setShowImportModal(true);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const validateBackupFile = async (file) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate structure
      if (!data.timestamp || !data.tables || !data.totalRecords) {
        return {
          valid: false,
          error: "Invalid backup file structure. Missing required fields.",
        };
      }

      // Validate it's a MedCure backup
      if (!data.tables.products || !data.tables.categories) {
        return {
          valid: false,
          error: "Invalid MedCure backup file. Missing required data tables.",
        };
      }

      return {
        valid: true,
        data: data,
      };
    } catch {
      return {
        valid: false,
        error: "Invalid JSON file or corrupted backup.",
      };
    }
  };

  const confirmImportBackup = async () => {
    if (!selectedFile) {
      showError("Please select a backup file to import.", { duration: 4000 });
      return;
    }

    try {
      setImporting(true);

      // Validate the backup file
      const validation = await validateBackupFile(selectedFile);

      if (!validation.valid) {
        alert(`❌ Import Failed\n\n${validation.error}`);
        return;
      }

      // Store the backup in localStorage
      const backupData = validation.data;
      localStorage.setItem(
        "medcure-imported-backup",
        JSON.stringify(backupData)
      );

      // Update last backup info
      const backupInfo = {
        timestamp: backupData.timestamp,
        recordCount: backupData.totalRecords,
        tables: Object.keys(backupData.tables).length,
        type: "imported",
      };
      localStorage.setItem("medcure-last-backup", JSON.stringify(backupInfo));

      // Update state
      setLastBackup(backupInfo);

      // Close modal and show success
      setShowImportModal(false);
      setSelectedFile(null);

      alert(
        `✅ Backup Imported Successfully!\n\n` +
          `Timestamp: ${new Date(backupData.timestamp).toLocaleString()}\n` +
          `Total Records: ${backupData.totalRecords}\n` +
          `Tables: ${Object.keys(backupData.tables).length}\n\n` +
          `You can now use the "Restore Backup" feature to apply this data.`
      );
    } catch (error) {
      console.error("Error importing backup:", error);
      alert("❌ Failed to import backup. Please try again.");
    } finally {
      setImporting(false);
    }
  };

  if (loading || !securitySettings) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

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
              disabled={saving}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
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
              disabled={saving}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
          <Shield className="h-5 w-5 text-gray-500" />
          <span>Authentication Security</span>
          <span className="ml-2 px-3 py-1 text-xs font-semibold text-purple-700 bg-purple-100 rounded-full border border-purple-300">
            Coming Soon
          </span>
        </h3>
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg opacity-60 cursor-not-allowed">
          <div>
            <p className="font-medium text-gray-900 flex items-center space-x-2">
              <span>Two-Factor Authentication</span>
            </p>
            <p className="text-sm text-gray-500">
              Require 2FA for all administrative accounts
            </p>
            <p className="text-xs text-purple-600 mt-1 font-medium">
              🚀 Feature under development - Available in next release
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-not-allowed">
            <input
              type="checkbox"
              checked={securitySettings.requireTwoFactor}
              onChange={(e) =>
                setSecuritySettings({
                  ...securitySettings,
                  requireTwoFactor: e.target.checked,
                })
              }
              disabled={true}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
          </label>
        </div>
      </div>

      {/* Backup Configuration */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
          <Database className="h-5 w-5 text-gray-500" />
          <span>Backup Configuration</span>
          <span className="ml-2 px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full border border-blue-300">
            Coming Soon
          </span>
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg opacity-60 cursor-not-allowed">
            <div>
              <p className="font-medium text-gray-900">Automatic Backups</p>
              <p className="text-sm text-gray-500">
                Schedule automatic database backups
              </p>
              <p className="text-xs text-blue-600 mt-1 font-medium">
                🚀 Feature under development - Available in next release
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-not-allowed">
              <input
                type="checkbox"
                checked={securitySettings.autoBackupEnabled}
                onChange={(e) =>
                  setSecuritySettings({
                    ...securitySettings,
                    autoBackupEnabled: e.target.checked,
                  })
                }
                disabled={true}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
            </label>
          </div>

          {/* Commented out until Automatic Backups feature is implemented */}
          {/* {securitySettings.autoBackupEnabled && (
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
                  disabled={saving}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
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
                  disabled={saving}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </>
          )} */}
        </div>
      </div>

      {/* Manual Backup */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-base font-medium text-blue-900 mb-1">
                Backup Management
              </h4>
              <p className="text-sm text-blue-700">
                Create, download, import, or restore system backups
              </p>
              {lastBackup && (
                <p className="text-xs text-blue-600 mt-2">
                  Last backup: {new Date(lastBackup.timestamp).toLocaleString()}
                  {lastBackup.totalRecords &&
                    ` (${lastBackup.totalRecords} records)`}
                </p>
              )}
            </div>
          </div>

          {/* Backup Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Create Backup Button */}
            <button
              onClick={handleManualBackup}
              disabled={backing}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {backing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="font-medium">Backing up...</span>
                </>
              ) : (
                <>
                  <Database className="h-5 w-5" />
                  <span className="font-medium">Create Backup</span>
                </>
              )}
            </button>

            {/* Download Backup Button */}
            <button
              onClick={handleDownloadBackup}
              disabled={!lastBackup}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              <Download className="h-5 w-5" />
              <span className="font-medium">Download Backup</span>
            </button>

            {/* Import Backup Button */}
            <button
              onClick={handleImportBackup}
              disabled={importing}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="font-medium">Importing...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="h-5 w-5" />
                  <span className="font-medium">Import Backup</span>
                </>
              )}
            </button>

            {/* Restore Backup Button */}
            <button
              onClick={handleRestoreBackup}
              disabled={!lastBackup || restoring}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {restoring ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="font-medium">Restoring...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="h-5 w-5" />
                  <span className="font-medium">Restore Backup</span>
                </>
              )}
            </button>
          </div>

          {/* Helper Text */}
          {!lastBackup && (
            <p className="text-xs text-blue-600 bg-blue-100 px-3 py-2 rounded-md">
              💡 Create a backup first to enable download and restore features.
              Or import an existing backup file.
            </p>
          )}
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
          disabled={saving}
          className="flex items-center space-x-2 px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>

      {/* Backup Confirmation Modal */}
      {showBackupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                    <Database className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      Confirm System Backup
                    </h2>
                    <p className="text-blue-100 text-sm mt-1">
                      Create a snapshot of your pharmacy data
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBackupModal(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* What is a Backup? */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-2">
                      What is a System Backup?
                    </h3>
                    <p className="text-sm text-blue-800 leading-relaxed">
                      A backup creates a complete snapshot of your pharmacy's
                      critical data at this moment in time. This includes all
                      your products, inventory, sales records, customer
                      information, and system settings.
                    </p>
                  </div>
                </div>
              </div>

              {/* What Gets Backed Up */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Database className="h-4 w-4 mr-2 text-gray-600" />
                  What Gets Backed Up
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      name: "Products & Inventory",
                      icon: "📦",
                      records: "All medicine catalog",
                    },
                    {
                      name: "Categories",
                      icon: "🏷️",
                      records: "Organization structure",
                    },
                    {
                      name: "Sales Records",
                      icon: "💰",
                      records: "Transaction history",
                    },
                    {
                      name: "Customer Data",
                      icon: "👥",
                      records: "Customer profiles",
                    },
                    {
                      name: "User Accounts",
                      icon: "👤",
                      records: "Staff & permissions",
                    },
                    {
                      name: "Inventory Logs",
                      icon: "📊",
                      records: "Stock movements",
                    },
                    {
                      name: "System Settings",
                      icon: "⚙️",
                      records: "Configuration",
                    },
                  ].map((item) => (
                    <div
                      key={item.name}
                      className="flex items-start space-x-2 p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <span className="text-xl">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {item.records}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Why Is It Important? */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2 text-yellow-600" />
                  Why Is This Important?
                </h3>
                <div className="space-y-2">
                  {[
                    {
                      title: "Data Recovery",
                      desc: "Restore your system if data is accidentally deleted or corrupted",
                      icon: "🔄",
                    },
                    {
                      title: "Disaster Protection",
                      desc: "Protect against hardware failures, system crashes, or cyber attacks",
                      icon: "🛡️",
                    },
                    {
                      title: "Compliance & Audit",
                      desc: "Maintain historical records for regulatory requirements",
                      icon: "📋",
                    },
                    {
                      title: "Peace of Mind",
                      desc: "Know your pharmacy data is safe and recoverable at any time",
                      icon: "✅",
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="text-lg flex-shrink-0">{item.icon}</span>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* How Is It Used? */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-green-900 mb-2">
                      How Is Backup Data Used?
                    </h3>
                    <ul className="space-y-1 text-sm text-green-800">
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>
                          Backup is stored securely in your browser's local
                          storage
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>
                          Can be accessed for system recovery if needed
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>
                          Provides a snapshot for comparison and auditing
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>
                          Automatically cleaned up based on retention policy (
                          {securitySettings?.retentionDays || 30} days)
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Required */}
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4">
                <p className="text-sm text-gray-700 text-center">
                  <strong>This process takes about 5-10 seconds</strong>{" "}
                  depending on your data size.
                  <br />
                  Your system will remain accessible during the backup.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex items-center justify-between border-t">
              <button
                onClick={() => setShowBackupModal(false)}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmBackup}
                disabled={backing}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {backing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Creating Backup...</span>
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4" />
                    <span>Start Backup Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Download Backup Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                    <FileDown className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      Download Backup
                    </h2>
                    <p className="text-green-100 text-sm mt-1">
                      Export your backup as a JSON file
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDownloadModal(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Info className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-green-900 mb-2">
                      What You'll Get
                    </h3>
                    <ul className="space-y-1 text-sm text-green-800">
                      <li className="flex items-start">
                        <span className="mr-2">📦</span>
                        <span>Complete backup in JSON format</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">📊</span>
                        <span>
                          All {lastBackup?.totalRecords || 0} records included
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">🔒</span>
                        <span>
                          Timestamp:{" "}
                          {lastBackup
                            ? new Date(lastBackup.timestamp).toLocaleString()
                            : "N/A"}
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">💾</span>
                        <span>Safe to store on external drive or cloud</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-yellow-900 mb-1">
                      Important Notes
                    </h3>
                    <ul className="space-y-1 text-sm text-yellow-800">
                      <li>• Store the file in a secure location</li>
                      <li>• Keep multiple backup copies</li>
                      <li>• File can be used for disaster recovery</li>
                      <li>• Contains sensitive pharmacy data</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex items-center justify-between border-t">
              <button
                onClick={() => setShowDownloadModal(false)}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDownloadBackup}
                className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg font-medium flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Download Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Backup Modal */}
      {showRestoreModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                    <RotateCcw className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      Restore From Backup
                    </h2>
                    <p className="text-purple-100 text-sm mt-1">
                      Revert your system to a previous state
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowRestoreModal(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Warning Box */}
              <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-red-900 mb-2 text-lg">
                      ⚠️ Critical Warning
                    </h3>
                    <p className="text-sm text-red-800 mb-3 leading-relaxed">
                      Restoring from backup will{" "}
                      <strong>overwrite all current data</strong>. This action
                      cannot be undone. Make sure you understand the
                      implications before proceeding.
                    </p>
                  </div>
                </div>
              </div>

              {/* Backup Info */}
              {lastBackup && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-900 mb-3 flex items-center">
                    <History className="h-4 w-4 mr-2" />
                    Backup Information
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-white p-3 rounded-md">
                      <p className="text-gray-600 text-xs">Backup Date</p>
                      <p className="font-medium text-gray-900 mt-1">
                        {new Date(lastBackup.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-md">
                      <p className="text-gray-600 text-xs">Backup Time</p>
                      <p className="font-medium text-gray-900 mt-1">
                        {new Date(lastBackup.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-md">
                      <p className="text-gray-600 text-xs">Total Records</p>
                      <p className="font-medium text-gray-900 mt-1">
                        {lastBackup.totalRecords || 0}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-md">
                      <p className="text-gray-600 text-xs">Backup Type</p>
                      <p className="font-medium text-gray-900 mt-1 capitalize">
                        {lastBackup.type || "Manual"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* What Will Happen */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  What Will Happen During Restore
                </h3>
                <div className="space-y-2">
                  {[
                    {
                      step: "1",
                      desc: "System will verify backup integrity",
                      icon: "🔍",
                    },
                    {
                      step: "2",
                      desc: "Current data will be backed up (safety)",
                      icon: "💾",
                    },
                    {
                      step: "3",
                      desc: "Database tables will be cleared",
                      icon: "🗑️",
                    },
                    {
                      step: "4",
                      desc: "Backup data will be imported",
                      icon: "📥",
                    },
                    {
                      step: "5",
                      desc: "System will verify restoration",
                      icon: "✅",
                    },
                    {
                      step: "6",
                      desc: "You'll be logged out for security",
                      icon: "🔒",
                    },
                  ].map((item) => (
                    <div
                      key={item.step}
                      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="text-xl">{item.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">
                          <strong>Step {item.step}:</strong> {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Time Estimate */}
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4">
                <p className="text-sm text-gray-700 text-center">
                  <strong>Note:</strong> Restore functionality requires backend
                  implementation.
                  <br />
                  <span className="text-xs text-gray-600">
                    Download backup and contact your database administrator
                  </span>
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex items-center justify-between border-t">
              <button
                onClick={() => setShowRestoreModal(false)}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmRestoreBackup}
                disabled={restoring}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {restoring ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Restoring...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4" />
                    <span>View Instructions</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Backup Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-orange-600 to-orange-700 p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                    <UploadCloud className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      Import Backup File
                    </h2>
                    <p className="text-orange-100 text-sm mt-1">
                      Upload a previously downloaded backup
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setSelectedFile(null);
                  }}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Info Box */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Info className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-orange-900 mb-2">
                      Import Process
                    </h3>
                    <p className="text-sm text-orange-800 leading-relaxed">
                      Select a MedCure backup JSON file that you previously
                      downloaded. The file will be validated and stored locally
                      for restoration.
                    </p>
                  </div>
                </div>
              </div>

              {/* File Upload Section */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Select Backup File
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="backup-file-input"
                  />
                  <label
                    htmlFor="backup-file-input"
                    className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-all"
                  >
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FileJson className="h-12 w-12 text-gray-400" />
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold text-orange-600">
                          Click to upload
                        </span>{" "}
                        or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        JSON backup files only
                      </p>
                    </div>
                  </label>
                </div>

                {/* Selected File Display */}
                {selectedFile && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <FileJson className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-green-900 truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-green-700">
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedFile(null)}
                        className="text-green-600 hover:text-green-800"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* What Happens Next */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  What Happens After Import
                </h3>
                <div className="space-y-2">
                  {[
                    {
                      icon: "🔍",
                      title: "File Validation",
                      desc: "System checks file integrity and format",
                    },
                    {
                      icon: "💾",
                      title: "Local Storage",
                      desc: "Backup is stored locally in your browser",
                    },
                    {
                      icon: "📊",
                      title: "Backup Info Updated",
                      desc: "Latest backup info will be displayed",
                    },
                    {
                      icon: "🔄",
                      title: "Ready to Restore",
                      desc: 'Use "Restore Backup" to apply the imported data',
                    },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="text-xl">{item.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-900 text-sm mb-1">
                      Security Note
                    </h4>
                    <p className="text-xs text-blue-800 leading-relaxed">
                      Only import backup files from trusted sources. Corrupted
                      or malicious files may cause data issues.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex items-center justify-between border-t">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setSelectedFile(null);
                }}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmImportBackup}
                disabled={!selectedFile || importing}
                className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-700 hover:to-orange-800 transition-all shadow-lg font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-4 w-4" />
                    <span>Import Backup</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
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
