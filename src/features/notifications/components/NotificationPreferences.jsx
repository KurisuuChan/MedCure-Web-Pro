import React, { useState, useEffect, useCallback } from "react";
import { Settings, Save, Bell, Mail, Monitor, Package, AlertTriangle, BarChart3, Shield } from "lucide-react";
import { NotificationService } from "../../../services/notificationService";
import { useAuth } from "../../../hooks/useAuth";

const NotificationPreferences = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState({
    email_notifications: true,
    browser_notifications: true,
    low_stock_alerts: true,
    expiry_warnings: true,
    sales_reports: true,
    system_alerts: true,
    notification_frequency: "immediate"
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadPreferences = useCallback(async () => {
    setLoading(true);
    try {
      const userPreferences = await NotificationService.getNotificationPreferences(user.id);
      setPreferences(userPreferences);
    } catch (error) {
      console.error("Error loading preferences:", error);
      setMessage("Error loading preferences");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isOpen && user?.id) {
      loadPreferences();
    }
  }, [isOpen, user?.id, loadPreferences]);

  const handleSave = async () => {
    if (!user?.id) return;

    setSaving(true);
    try {
      await NotificationService.updateNotificationPreferences(user.id, preferences);
      setMessage("Preferences saved successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error saving preferences:", error);
      setMessage("Error saving preferences");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleFrequencyChange = (frequency) => {
    setPreferences(prev => ({
      ...prev,
      notification_frequency: frequency
    }));
  };

  const requestBrowserPermission = async () => {
    const granted = await NotificationService.requestNotificationPermission();
    if (granted) {
      setPreferences(prev => ({ ...prev, browser_notifications: true }));
      setMessage("Browser notifications enabled!");
    } else {
      setMessage("Browser notifications denied. Please enable in browser settings.");
    }
    setTimeout(() => setMessage(""), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading preferences...</p>
            </div>
          ) : (
            <>
              {/* Delivery Methods */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Delivery Methods</h3>
                <div className="space-y-3">
                  {/* Email Notifications */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">Email Notifications</span>
                    </div>
                    <button
                      onClick={() => handleToggle('email_notifications')}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        preferences.email_notifications ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          preferences.email_notifications ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Browser Notifications */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Monitor className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">Browser Push Notifications</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {Notification.permission === "default" && (
                        <button
                          onClick={requestBrowserPermission}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Enable
                        </button>
                      )}
                      <button
                        onClick={() => handleToggle('browser_notifications')}
                        disabled={Notification.permission === "denied"}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          preferences.browser_notifications && Notification.permission !== "denied" ? 'bg-blue-600' : 'bg-gray-200'
                        } ${Notification.permission === "denied" ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            preferences.browser_notifications && Notification.permission !== "denied" ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notification Types */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Notification Types</h3>
                <div className="space-y-3">
                  {/* Low Stock Alerts */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Package className="w-4 h-4 text-orange-500" />
                      <span className="text-sm text-gray-700">Low Stock Alerts</span>
                    </div>
                    <button
                      onClick={() => handleToggle('low_stock_alerts')}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        preferences.low_stock_alerts ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          preferences.low_stock_alerts ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Expiry Warnings */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-gray-700">Expiry Warnings</span>
                    </div>
                    <button
                      onClick={() => handleToggle('expiry_warnings')}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        preferences.expiry_warnings ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          preferences.expiry_warnings ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Sales Reports */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <BarChart3 className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-gray-700">Sales Reports</span>
                    </div>
                    <button
                      onClick={() => handleToggle('sales_reports')}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        preferences.sales_reports ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          preferences.sales_reports ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* System Alerts */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Shield className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">System Alerts</span>
                    </div>
                    <button
                      onClick={() => handleToggle('system_alerts')}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        preferences.system_alerts ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          preferences.system_alerts ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Frequency */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Notification Frequency</h3>
                <div className="space-y-2">
                  {[
                    { value: "immediate", label: "Immediate" },
                    { value: "hourly", label: "Hourly Digest" },
                    { value: "daily", label: "Daily Summary" }
                  ].map((option) => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="radio"
                        name="frequency"
                        value={option.value}
                        checked={preferences.notification_frequency === option.value}
                        onChange={() => handleFrequencyChange(option.value)}
                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Message */}
              {message && (
                <div className={`p-3 rounded-md text-sm ${
                  message.includes("Error") 
                    ? "bg-red-100 text-red-700" 
                    : "bg-green-100 text-green-700"
                }`}>
                  {message}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Preferences</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPreferences;
