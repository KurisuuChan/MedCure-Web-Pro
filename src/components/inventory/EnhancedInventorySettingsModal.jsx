import React, { useState, useEffect } from "react";
import {
  X,
  Settings,
  AlertTriangle,
  Package,
  Clock,
  TrendingUp,
  Bell,
  Zap,
  Target,
  BarChart3,
  ShoppingCart,
  Truck,
  Calendar,
  DollarSign,
  Save,
  RotateCcw,
  Lightbulb,
  Info,
  Users,
  Database,
  Mail,
  Smartphone,
  FileText,
  Eye,
  Shield,
  Cpu,
  Activity,
} from "lucide-react";

/**
 * Enhanced Inventory Settings Modal
 * Professional configuration system for inventory management
 */
const EnhancedInventorySettingsModal = ({ isOpen, onClose, onSave }) => {
  const [settings, setSettings] = useState({
    // General Settings
    general: {
      defaultView: "overview", // overview, analytics
      refreshInterval: 15, // seconds
      itemsPerPage: 25,
      enableAnimations: true,
      compactMode: false,
      darkMode: false,
    },

    // Alerts & Notifications
    alerts: {
      enableRealTimeUpdates: true,
      enablePushNotifications: true,
      enableEmailAlerts: false,
      criticalStock: 5,
      lowStock: 15,
      expiryWarningDays: 30,
      enableSoundAlerts: true,
    },

    // Inventory Control
    inventory: {
      defaultReorderLevel: 20,
      defaultLeadTimeDays: 7,
      stockCountMethod: "fifo", // fifo, lifo
      enableExpirationTracking: true,
      autoCalculateReorderPoints: true,
      priceMarkupPercentage: 25,
      enableAutoReorder: false,
      requireApprovalForHighValue: true,
      highValueThreshold: 1000,
    },

    // Reports & Export
    reports: {
      defaultExportFormat: "pdf", // pdf, excel, csv
      includeImages: true,
      dataRetentionMonths: 24,
      enableScheduledReports: false,
      enableAdvancedAnalytics: true,
    },
  });

  const [activeTab, setActiveTab] = useState("general");
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem("enhancedInventorySettings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings((prevSettings) => ({
          ...prevSettings,
          ...parsed,
        }));
      } catch (error) {
        console.error("Error loading saved settings:", error);
      }
    }
  }, []);

  // Track changes
  useEffect(() => {
    const savedSettings = localStorage.getItem("enhancedInventorySettings");
    const currentSettingsStr = JSON.stringify(settings);
    const savedSettingsStr = savedSettings || "{}";
    setHasChanges(currentSettingsStr !== savedSettingsStr);
  }, [settings]);

  const updateSetting = (category, key, value) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
  };

  const updateNestedSetting = (category, subCategory, key, value) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [subCategory]: {
          ...prev[category][subCategory],
          [key]: value,
        },
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      localStorage.setItem(
        "enhancedInventorySettings",
        JSON.stringify(settings)
      );
      if (onSave) {
        await onSave(settings);
      }
      setHasChanges(false);

      // Show success notification
      if (window.notificationService) {
        const user = await window.notificationService.getCurrentUser();
        await window.notificationService.create({
          userId: user?.id,
          title: "Settings Saved",
          message: "Enhanced settings saved successfully!",
          type: "success",
          priority: 2,
          category: "system",
        });
      }

      onClose();
    } catch (error) {
      console.error("Error saving settings:", error);
      if (window.notificationService) {
        const user = await window.notificationService.getCurrentUser();
        await window.notificationService.create({
          userId: user?.id,
          title: "Settings Error",
          message: "Failed to save settings",
          type: "error",
          priority: 2,
          category: "system",
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    localStorage.removeItem("enhancedInventorySettings");
    // Reset to simplified defaults
    setSettings({
      general: {
        defaultView: "overview",
        refreshInterval: 15,
        itemsPerPage: 25,
        enableAnimations: true,
        compactMode: false,
        darkMode: false,
      },
      alerts: {
        enableRealTimeUpdates: true,
        enablePushNotifications: true,
        enableEmailAlerts: false,
        criticalStock: 5,
        lowStock: 15,
        expiryWarningDays: 30,
        enableSoundAlerts: true,
      },
      inventory: {
        defaultReorderLevel: 20,
        defaultLeadTimeDays: 7,
        stockCountMethod: "fifo",
        enableExpirationTracking: true,
        autoCalculateReorderPoints: true,
        priceMarkupPercentage: 25,
        enableAutoReorder: false,
        requireApprovalForHighValue: true,
        highValueThreshold: 1000,
      },
      reports: {
        defaultExportFormat: "pdf",
        includeImages: true,
        dataRetentionMonths: 24,
        enableScheduledReports: false,
        enableAdvancedAnalytics: true,
      },
    });
    setHasChanges(false);
  };

  if (!isOpen) return null;

  const tabs = [
    {
      id: "general",
      label: "General Settings",
      icon: Settings,
      color: "text-blue-600",
    },
    {
      id: "alerts",
      label: "Alerts & Notifications",
      icon: Bell,
      color: "text-red-600",
    },
    {
      id: "inventory",
      label: "Inventory Control",
      icon: Package,
      color: "text-purple-600",
    },
    {
      id: "reports",
      label: "Reports & Export",
      icon: FileText,
      color: "text-green-600",
    },
  ];

  const renderGeneralTab = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
        <div className="flex items-start">
          <Settings className="h-5 w-5 text-blue-500 mt-0.5 mr-2" />
          <div>
            <h4 className="text-sm font-medium text-blue-800">
              General Dashboard Settings
            </h4>
            <p className="text-sm text-blue-700 mt-1">
              Configure basic dashboard preferences and display options.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default View
          </label>
          <select
            value={settings.general.defaultView}
            onChange={(e) =>
              updateSetting("general", "defaultView", e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="overview">Overview Dashboard</option>
            <option value="analytics">Analytics View</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Refresh Interval (seconds)
          </label>
          <select
            value={settings.general.refreshInterval}
            onChange={(e) =>
              updateSetting(
                "general",
                "refreshInterval",
                parseInt(e.target.value)
              )
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={5}>5 seconds</option>
            <option value={15}>15 seconds</option>
            <option value={30}>30 seconds</option>
            <option value={60}>1 minute</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Items Per Page
          </label>
          <select
            value={settings.general.itemsPerPage}
            onChange={(e) =>
              updateSetting("general", "itemsPerPage", parseInt(e.target.value))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={10}>10 items</option>
            <option value={25}>25 items</option>
            <option value={50}>50 items</option>
          </select>
        </div>
      </div>

      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          Display Options
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: "enableAnimations", label: "Enable animations" },
            { key: "compactMode", label: "Compact mode" },
            { key: "darkMode", label: "Dark theme" },
          ].map((option) => (
            <div key={option.key} className="flex items-center">
              <input
                type="checkbox"
                id={option.key}
                checked={settings.general[option.key]}
                onChange={(e) =>
                  updateSetting("general", option.key, e.target.checked)
                }
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor={option.key}
                className="ml-2 text-sm text-gray-700"
              >
                {option.label}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAlertsTab = () => (
    <div className="space-y-6">
      <div className="bg-red-50 p-4 rounded-md border border-red-200">
        <div className="flex items-start">
          <Bell className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
          <div>
            <h4 className="text-sm font-medium text-red-800">
              Alert & Notification Settings
            </h4>
            <p className="text-sm text-red-700 mt-1">
              Configure when and how you receive notifications about stock
              levels and important events.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-semibold text-gray-900">
              Real-time Updates
            </h4>
            <p className="text-sm text-gray-500">
              Enable instant notifications for inventory changes
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings.alerts.enableRealTimeUpdates}
            onChange={(e) =>
              updateSetting("alerts", "enableRealTimeUpdates", e.target.checked)
            }
            className="h-5 w-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: "enablePushNotifications", label: "Browser notifications" },
            { key: "enableEmailAlerts", label: "Email alerts" },
            { key: "enableSoundAlerts", label: "Sound alerts" },
          ].map((option) => (
            <div key={option.key} className="flex items-center">
              <input
                type="checkbox"
                id={option.key}
                checked={settings.alerts[option.key]}
                onChange={(e) =>
                  updateSetting("alerts", option.key, e.target.checked)
                }
                className="h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <label
                htmlFor={option.key}
                className="ml-2 text-sm text-gray-700"
              >
                {option.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
          Alert Thresholds
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Critical Stock Level
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={settings.alerts.criticalStock}
              onChange={(e) =>
                updateSetting(
                  "alerts",
                  "criticalStock",
                  parseInt(e.target.value)
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Alert when stock falls below this level
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Low Stock Level
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={settings.alerts.lowStock}
              onChange={(e) =>
                updateSetting("alerts", "lowStock", parseInt(e.target.value))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Warning when stock is getting low
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expiry Warning (Days)
            </label>
            <input
              type="number"
              min="1"
              max="90"
              value={settings.alerts.expiryWarningDays}
              onChange={(e) =>
                updateSetting(
                  "alerts",
                  "expiryWarningDays",
                  parseInt(e.target.value)
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Days before expiry to show warning
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderInventoryTab = () => (
    <div className="space-y-6">
      <div className="bg-purple-50 p-4 rounded-md border border-purple-200">
        <div className="flex items-start">
          <Package className="h-5 w-5 text-purple-500 mt-0.5 mr-2" />
          <div>
            <h4 className="text-sm font-medium text-purple-800">
              Inventory Control Settings
            </h4>
            <p className="text-sm text-purple-700 mt-1">
              Configure stock management rules and reorder policies.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default Reorder Level
          </label>
          <input
            type="number"
            min="1"
            value={settings.inventory.defaultReorderLevel}
            onChange={(e) =>
              updateSetting(
                "inventory",
                "defaultReorderLevel",
                parseInt(e.target.value)
              )
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Default reorder level for new products
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default Lead Time (Days)
          </label>
          <input
            type="number"
            min="1"
            max="90"
            value={settings.inventory.defaultLeadTimeDays}
            onChange={(e) =>
              updateSetting(
                "inventory",
                "defaultLeadTimeDays",
                parseInt(e.target.value)
              )
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Expected delivery time from suppliers
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stock Counting Method
          </label>
          <select
            value={settings.inventory.stockCountMethod}
            onChange={(e) =>
              updateSetting("inventory", "stockCountMethod", e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="fifo">FIFO (First In, First Out)</option>
            <option value="lifo">LIFO (Last In, First Out)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price Markup (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={settings.inventory.priceMarkupPercentage}
            onChange={(e) =>
              updateSetting(
                "inventory",
                "priceMarkupPercentage",
                parseInt(e.target.value)
              )
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Default markup for new products
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            High Value Threshold (₱)
          </label>
          <input
            type="number"
            min="100"
            max="10000"
            value={settings.inventory.highValueThreshold}
            onChange={(e) =>
              updateSetting(
                "inventory",
                "highValueThreshold",
                parseInt(e.target.value)
              )
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Require approval above this amount
          </p>
        </div>
      </div>

      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Features</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              key: "enableExpirationTracking",
              label: "Track expiration dates",
            },
            {
              key: "autoCalculateReorderPoints",
              label: "Auto-calculate reorder points",
            },
            { key: "enableAutoReorder", label: "Enable automatic reordering" },
            {
              key: "requireApprovalForHighValue",
              label: "Require approval for high-value items",
            },
          ].map((option) => (
            <div key={option.key} className="flex items-center">
              <input
                type="checkbox"
                id={option.key}
                checked={settings.inventory[option.key]}
                onChange={(e) =>
                  updateSetting("inventory", option.key, e.target.checked)
                }
                className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <label
                htmlFor={option.key}
                className="ml-2 text-sm text-gray-700"
              >
                {option.label}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderReportsTab = () => (
    <div className="space-y-6">
      <div className="bg-green-50 p-4 rounded-md border border-green-200">
        <div className="flex items-start">
          <FileText className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
          <div>
            <h4 className="text-sm font-medium text-green-800">
              Reports & Export Settings
            </h4>
            <p className="text-sm text-green-700 mt-1">
              Configure how reports are generated and exported from the system.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default Export Format
          </label>
          <select
            value={settings.reports.defaultExportFormat}
            onChange={(e) =>
              updateSetting("reports", "defaultExportFormat", e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="pdf">PDF Report</option>
            <option value="excel">Excel Spreadsheet</option>
            <option value="csv">CSV Data</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data Retention (Months)
          </label>
          <select
            value={settings.reports.dataRetentionMonths}
            onChange={(e) =>
              updateSetting(
                "reports",
                "dataRetentionMonths",
                parseInt(e.target.value)
              )
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value={6}>6 months</option>
            <option value={12}>12 months</option>
            <option value={24}>24 months</option>
            <option value={36}>36 months</option>
          </select>
        </div>
      </div>

      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          Report Features
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              key: "includeImages",
              label: "Include charts and images in reports",
            },
            {
              key: "enableScheduledReports",
              label: "Enable scheduled report generation",
            },
            {
              key: "enableAdvancedAnalytics",
              label: "Include advanced analytics",
            },
          ].map((option) => (
            <div key={option.key} className="flex items-center">
              <input
                type="checkbox"
                id={option.key}
                checked={settings.reports[option.key]}
                onChange={(e) =>
                  updateSetting("reports", option.key, e.target.checked)
                }
                className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <label
                htmlFor={option.key}
                className="ml-2 text-sm text-gray-700"
              >
                {option.label}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return renderGeneralTab();
      case "alerts":
        return renderAlertsTab();
      case "inventory":
        return renderInventoryTab();
      case "reports":
        return renderReportsTab();
      default:
        return renderGeneralTab();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 via-purple-50 to-cyan-50">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-xl shadow-lg">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Inventory Settings
              </h2>
              <p className="text-gray-600">
                Configure your inventory dashboard and alerts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex h-[calc(85vh-12rem)]">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 overflow-y-auto">
            <nav className="p-4 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                      activeTab === tab.id
                        ? "bg-white text-gray-900 shadow-md border border-gray-200"
                        : "text-gray-700 hover:bg-white hover:shadow-sm"
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 ${
                        activeTab === tab.id ? tab.color : "text-gray-400"
                      }`}
                    />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">{renderTabContent()}</div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2">
            {hasChanges && (
              <div className="flex items-center space-x-2 text-amber-600">
                <Lightbulb className="h-4 w-4" />
                <span className="text-sm font-medium">
                  You have unsaved changes
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleReset}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset to Defaults</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {saving ? (
                <Clock className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{saving ? "Saving..." : "Save Settings"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedInventorySettingsModal;
