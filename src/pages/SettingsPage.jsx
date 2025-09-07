import React, { useState } from "react";
import {
  Settings,
  User,
  Shield,
  Bell,
  Palette,
  Database,
  Download,
  Upload,
  Save,
  RefreshCw,
  Users,
  Lock,
  Mail,
  Globe,
  Monitor,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export default function SettingsPage() {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [profileSettings, setProfileSettings] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    department: "",
    bio: "",
  });

  const [systemSettings, setSystemSettings] = useState({
    theme: "light",
    language: "en",
    timezone: "UTC",
    currency: "USD",
    autoBackup: true,
    notifications: true,
    emailAlerts: true,
    lowStockThreshold: 10,
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: 30,
    passwordComplexity: "medium",
    loginAttempts: 3,
  });

  const handleSave = async (section) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log(`Saving ${section} settings...`);
      // Here you would make actual API calls to save settings
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "system", label: "System", icon: Settings },
    { id: "security", label: "Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "data", label: "Data Management", icon: Database },
    ...(role === "admin"
      ? [{ id: "users", label: "User Management", icon: Users }]
      : []),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage your account settings and preferences.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 border-r border-gray-200">
            <nav className="p-4 space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6">
            {/* Profile Settings */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Profile Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={profileSettings.name}
                        onChange={(e) =>
                          setProfileSettings({
                            ...profileSettings,
                            name: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={profileSettings.email}
                        onChange={(e) =>
                          setProfileSettings({
                            ...profileSettings,
                            email: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={profileSettings.phone}
                        onChange={(e) =>
                          setProfileSettings({
                            ...profileSettings,
                            phone: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Department
                      </label>
                      <select
                        value={profileSettings.department}
                        onChange={(e) =>
                          setProfileSettings({
                            ...profileSettings,
                            department: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Department</option>
                        <option value="pharmacy">Pharmacy</option>
                        <option value="management">Management</option>
                        <option value="sales">Sales</option>
                        <option value="inventory">Inventory</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bio
                      </label>
                      <textarea
                        value={profileSettings.bio}
                        onChange={(e) =>
                          setProfileSettings({
                            ...profileSettings,
                            bio: e.target.value,
                          })
                        }
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                  </div>
                  <div className="flex justify-end mt-6">
                    <button
                      onClick={() => handleSave("profile")}
                      disabled={isLoading}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      <span>Save Changes</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* System Settings */}
            {activeTab === "system" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    System Preferences
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Theme
                      </label>
                      <select
                        value={systemSettings.theme}
                        onChange={(e) =>
                          setSystemSettings({
                            ...systemSettings,
                            theme: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="auto">Auto</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Language
                      </label>
                      <select
                        value={systemSettings.language}
                        onChange={(e) =>
                          setSystemSettings({
                            ...systemSettings,
                            language: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Timezone
                      </label>
                      <select
                        value={systemSettings.timezone}
                        onChange={(e) =>
                          setSystemSettings({
                            ...systemSettings,
                            timezone: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="UTC">UTC</option>
                        <option value="EST">Eastern Time</option>
                        <option value="PST">Pacific Time</option>
                        <option value="CST">Central Time</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Currency
                      </label>
                      <select
                        value={systemSettings.currency}
                        onChange={(e) =>
                          setSystemSettings({
                            ...systemSettings,
                            currency: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Low Stock Threshold
                      </label>
                      <input
                        type="number"
                        value={systemSettings.lowStockThreshold}
                        onChange={(e) =>
                          setSystemSettings({
                            ...systemSettings,
                            lowStockThreshold: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 mt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          Auto Backup
                        </div>
                        <div className="text-sm text-gray-500">
                          Automatically backup data daily
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={systemSettings.autoBackup}
                          onChange={(e) =>
                            setSystemSettings({
                              ...systemSettings,
                              autoBackup: e.target.checked,
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end mt-6">
                    <button
                      onClick={() => handleSave("system")}
                      disabled={isLoading}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      <span>Save Changes</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === "security" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Security Settings
                  </h3>

                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            Two-Factor Authentication
                          </div>
                          <div className="text-sm text-gray-500">
                            Add an extra layer of security to your account
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={securitySettings.twoFactorAuth}
                            onChange={(e) =>
                              setSecuritySettings({
                                ...securitySettings,
                                twoFactorAuth: e.target.checked,
                              })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                              sessionTimeout: parseInt(e.target.value),
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Password Complexity
                        </label>
                        <select
                          value={securitySettings.passwordComplexity}
                          onChange={(e) =>
                            setSecuritySettings({
                              ...securitySettings,
                              passwordComplexity: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Max Login Attempts
                        </label>
                        <input
                          type="number"
                          value={securitySettings.loginAttempts}
                          onChange={(e) =>
                            setSecuritySettings({
                              ...securitySettings,
                              loginAttempts: parseInt(e.target.value),
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <Lock className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium text-yellow-900">
                            Change Password
                          </h4>
                          <p className="text-sm text-yellow-700 mt-1">
                            It's recommended to change your password regularly
                            to maintain security.
                          </p>
                          <button className="mt-2 text-sm text-yellow-800 hover:text-yellow-900 font-medium underline">
                            Change Password
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end mt-6">
                    <button
                      onClick={() => handleSave("security")}
                      disabled={isLoading}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      <span>Save Changes</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Notification Preferences
                  </h3>

                  <div className="space-y-4">
                    {[
                      {
                        key: "lowStock",
                        label: "Low Stock Alerts",
                        description:
                          "Get notified when products are running low",
                      },
                      {
                        key: "expiry",
                        label: "Expiry Warnings",
                        description: "Alerts for products nearing expiration",
                      },
                      {
                        key: "sales",
                        label: "Sales Reports",
                        description: "Daily and weekly sales summaries",
                      },
                      {
                        key: "system",
                        label: "System Updates",
                        description: "Important system notifications",
                      },
                      {
                        key: "security",
                        label: "Security Alerts",
                        description: "Login attempts and security events",
                      },
                    ].map((notification) => (
                      <div
                        key={notification.key}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-1">
                            {notification.key === "lowStock" && (
                              <Package className="h-5 w-5 text-gray-400" />
                            )}
                            {notification.key === "expiry" && (
                              <RefreshCw className="h-5 w-5 text-gray-400" />
                            )}
                            {notification.key === "sales" && (
                              <Download className="h-5 w-5 text-gray-400" />
                            )}
                            {notification.key === "system" && (
                              <Monitor className="h-5 w-5 text-gray-400" />
                            )}
                            {notification.key === "security" && (
                              <Shield className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {notification.label}
                            </div>
                            <div className="text-sm text-gray-500">
                              {notification.description}
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50">
                            <Bell className="h-3 w-3 inline mr-1" />
                            Push
                          </button>
                          <button className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50">
                            <Mail className="h-3 w-3 inline mr-1" />
                            Email
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end mt-6">
                    <button
                      onClick={() => handleSave("notifications")}
                      disabled={isLoading}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      <span>Save Changes</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Data Management */}
            {activeTab === "data" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Data Management
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <Download className="h-8 w-8 text-blue-600" />
                        <div>
                          <h4 className="text-lg font-semibold text-blue-900">
                            Export Data
                          </h4>
                          <p className="text-sm text-blue-700">
                            Download your data for backup or migration
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                          <Download className="h-4 w-4" />
                          <span>Export Inventory</span>
                        </button>
                        <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50">
                          <Download className="h-4 w-4" />
                          <span>Export Sales Data</span>
                        </button>
                      </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <Upload className="h-8 w-8 text-green-600" />
                        <div>
                          <h4 className="text-lg font-semibold text-green-900">
                            Import Data
                          </h4>
                          <p className="text-sm text-green-700">
                            Import data from CSV or other formats
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                          <Upload className="h-4 w-4" />
                          <span>Import Products</span>
                        </button>
                        <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-white text-green-600 border border-green-600 rounded-lg hover:bg-green-50">
                          <Download className="h-4 w-4" />
                          <span>Download Template</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Database className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-yellow-900">
                          Database Status
                        </h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          Last backup: Today at 3:00 AM • Next backup: Tomorrow
                          at 3:00 AM
                        </p>
                        <div className="flex space-x-2 mt-2">
                          <button className="text-sm text-yellow-800 hover:text-yellow-900 font-medium underline">
                            Backup Now
                          </button>
                          <button className="text-sm text-yellow-800 hover:text-yellow-900 font-medium underline">
                            View Logs
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* User Management (Admin only) */}
            {activeTab === "users" && role === "admin" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    User Management
                  </h3>

                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">
                          System Users
                        </h4>
                        <button className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                          <User className="h-4 w-4" />
                          <span>Add User</span>
                        </button>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              User
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Role
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Last Login
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {[
                            {
                              name: "Dr. Sarah Johnson",
                              email: "sarah@medcure.com",
                              role: "Admin",
                              status: "Active",
                              lastLogin: "2 hours ago",
                            },
                            {
                              name: "Mike Chen",
                              email: "mike@medcure.com",
                              role: "Manager",
                              status: "Active",
                              lastLogin: "1 day ago",
                            },
                            {
                              name: "Lisa Rodriguez",
                              email: "lisa@medcure.com",
                              role: "Cashier",
                              status: "Inactive",
                              lastLogin: "1 week ago",
                            },
                          ].map((userData, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10">
                                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                      <User className="h-5 w-5 text-gray-500" />
                                    </div>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {userData.name}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {userData.email}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                                  {userData.role}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    userData.status === "Active"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {userData.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {userData.lastLogin}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                <button className="text-blue-600 hover:text-blue-900">
                                  Edit
                                </button>
                                <button className="text-red-600 hover:text-red-900">
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
