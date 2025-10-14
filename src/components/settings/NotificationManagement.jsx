import { useState, useEffect } from "react";
import {
  Mail,
  CheckCircle,
  Loader,
  Save,
  Info,
  Clock,
  AlertCircle,
  Package,
  Calendar,
} from "lucide-react";
import { emailService } from "../../services/notifications/EmailService";
import { supabase } from "../../config/supabase";
import { useSettings } from "../../contexts/SettingsContext";

function NotificationManagement({ showSuccess, showError }) {
  const [checkingStock, setCheckingStock] = useState(false);
  const [stockAlert, setStockAlert] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { settings: globalSettings, updateSettings } = useSettings();

  // Notification timing settings
  const [notificationSettings, setNotificationSettings] = useState({
    lowStockCheckInterval: 60, // minutes (default: 1 hour)
    expiringCheckInterval: 360, // minutes (default: 6 hours)
    emailAlertsEnabled: false,
  });

  // Load settings from SettingsContext and localStorage
  useEffect(() => {
    // Try to load from localStorage first (for backwards compatibility)
    const savedSettings = localStorage.getItem("medcure-notification-settings");
    if (savedSettings) {
      try {
        setNotificationSettings(JSON.parse(savedSettings));
      } catch (err) {
        console.error("Failed to load settings from localStorage:", err);
      }
    }
    
    // Also load from global settings if available
    if (globalSettings.lowStockCheckInterval !== undefined) {
      setNotificationSettings(prev => ({
        ...prev,
        lowStockCheckInterval: globalSettings.lowStockCheckInterval || 60,
        expiringCheckInterval: globalSettings.expiringCheckInterval || 360,
        emailAlertsEnabled: globalSettings.emailAlertsEnabled || false,
      }));
    }
  }, [globalSettings]);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // Save to localStorage (for immediate use by NotificationService)
      localStorage.setItem(
        "medcure-notification-settings",
        JSON.stringify(notificationSettings)
      );
      
      // Save to database via SettingsContext (for persistence across browsers)
      await updateSettings({
        lowStockCheckInterval: notificationSettings.lowStockCheckInterval,
        expiringCheckInterval: notificationSettings.expiringCheckInterval,
        emailAlertsEnabled: notificationSettings.emailAlertsEnabled,
      });
      
      setSaved(true);
      showSuccess(
        "Notification settings saved successfully! The system will use these intervals for checking inventory."
      );
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save settings:", err);
      showError("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const checkInventoryAndSendAlert = async () => {
    setCheckingStock(true);
    setStockAlert(null);
    try {
      const { data: allProducts, error } = await supabase
        .from("products")
        .select("id, brand_name, generic_name, stock_in_pieces, reorder_level")
        .eq("is_active", true)
        .order("stock_in_pieces", { ascending: true });

      if (error) throw error;

      if (!allProducts || allProducts.length === 0) {
        showError("No products found in inventory");
        return;
      }

      const outOfStock = allProducts.filter((p) => p.stock_in_pieces === 0);
      const lowStock = allProducts.filter(
        (p) => p.stock_in_pieces > 0 && p.stock_in_pieces <= p.reorder_level
      );

      const problemItems = [...outOfStock, ...lowStock];

      if (problemItems.length === 0) {
        showSuccess("✅ All products are in good stock!");
        setStockAlert({
          type: "success",
          message: "All inventory levels are healthy",
        });
        return;
      }

      const currentDate = new Date();
      const formattedDate = currentDate.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const formattedTime = currentDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const recipientEmail = "iannsantiago19@gmail.com";

      await emailService.send({
        to: recipientEmail,
        subject: `🚨 MedCure Inventory Alert - ${outOfStock.length} Out of Stock, ${lowStock.length} Low Stock`,
        html: `<h1>Inventory Alert</h1><p>Date: ${formattedDate} ${formattedTime}</p><p>Out of Stock: ${outOfStock.length}</p><p>Low Stock: ${lowStock.length}</p>`,
        text: `Inventory Alert - Out of Stock: ${outOfStock.length}, Low Stock: ${lowStock.length}`,
      });

      setStockAlert({
        type: outOfStock.length > 0 ? "critical" : "warning",
        outOfStock: outOfStock.length,
        lowStock: lowStock.length,
        total: problemItems.length,
      });

      showSuccess(
        `📧 Alert sent to ${recipientEmail}! Found ${outOfStock.length} out of stock and ${lowStock.length} low stock items.`
      );
    } catch (err) {
      console.error("Failed to check inventory:", err);
      showError("Failed to check inventory and send alert");
    } finally {
      setCheckingStock(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">
              Automatic Inventory Monitoring
            </h4>
            <p className="text-sm text-blue-700">
              Your system continuously monitors inventory and sends
              notifications for critical issues. Configure how often the system
              checks for problems below.
            </p>
          </div>
        </div>
      </div>

      {/* Notification Timing Settings */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center space-x-2">
          <Clock className="h-5 w-5 text-purple-600" />
          <span>Notification Check Frequency</span>
        </h3>

        <div className="space-y-6">
          {/* Low Stock Check Interval */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-3 mb-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Package className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">
                  Low Stock Checks
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  How often the system checks for products below their reorder
                  level
                </p>
                <div className="max-w-xs">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Check Every
                  </label>
                  <select
                    value={notificationSettings.lowStockCheckInterval}
                    onChange={(e) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        lowStockCheckInterval: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour (Recommended)</option>
                    <option value="120">2 hours</option>
                    <option value="360">6 hours</option>
                    <option value="720">12 hours</option>
                    <option value="1440">24 hours</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-2">
                    ⏱️ Current: Every{" "}
                    {notificationSettings.lowStockCheckInterval >= 60
                      ? `${Math.floor(
                          notificationSettings.lowStockCheckInterval / 60
                        )} hour${
                          Math.floor(
                            notificationSettings.lowStockCheckInterval / 60
                          ) > 1
                            ? "s"
                            : ""
                        }`
                      : `${notificationSettings.lowStockCheckInterval} minutes`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Expiring Products Check Interval */}
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start space-x-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar className="h-5 w-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">
                  Expiring Product Checks
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  How often the system checks for products approaching their
                  expiration date
                </p>
                <div className="max-w-xs">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Check Every
                  </label>
                  <select
                    value={notificationSettings.expiringCheckInterval}
                    onChange={(e) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        expiringCheckInterval: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    <option value="60">1 hour</option>
                    <option value="120">2 hours</option>
                    <option value="360">6 hours (Recommended)</option>
                    <option value="720">12 hours</option>
                    <option value="1440">24 hours</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-2">
                    ⏱️ Current: Every{" "}
                    {notificationSettings.expiringCheckInterval >= 60
                      ? `${Math.floor(
                          notificationSettings.expiringCheckInterval / 60
                        )} hour${
                          Math.floor(
                            notificationSettings.expiringCheckInterval / 60
                          ) > 1
                            ? "s"
                            : ""
                        }`
                      : `${notificationSettings.expiringCheckInterval} minutes`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Out of Stock - Always Immediate */}
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  Out of Stock Alerts
                </h4>
                <p className="text-sm text-gray-600">
                  <strong>Always Immediate</strong> - Critical alerts when stock
                  reaches zero cannot be delayed
                </p>
                <div className="mt-2 inline-flex items-center px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                  🚨 Real-time monitoring (cannot be configured)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Optimization Tips */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2 flex items-center space-x-2">
            <Info className="h-4 w-4" />
            <span>Optimization Tips</span>
          </h4>
          <ul className="text-sm text-blue-700 space-y-1 ml-6 list-disc">
            <li>
              <strong>Frequent checks (15-30 min):</strong> Best for high-volume
              pharmacies with rapid stock changes
            </li>
            <li>
              <strong>Moderate checks (1-2 hours):</strong> Balanced approach
              for most pharmacies (recommended)
            </li>
            <li>
              <strong>Infrequent checks (6-24 hours):</strong> Suitable for
              slow-moving inventory or overnight monitoring
            </li>
          </ul>
        </div>
      </div>

      {/* Email Notifications */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center space-x-2">
          <Mail className="h-5 w-5 text-blue-600" />
          <span>Email Notifications</span>
        </h3>

        <div className="space-y-4">
          {/* Email Toggle */}
          <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div>
              <h4 className="font-semibold text-gray-900">
                Enable Email Alerts
              </h4>
              <p className="text-sm text-gray-600">
                Receive inventory alerts via email at:{" "}
                <strong>iannsantiago19@gmail.com</strong>
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.emailAlertsEnabled}
                onChange={(e) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    emailAlertsEnabled: e.target.checked,
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* Manual Check Button */}
          {notificationSettings.emailAlertsEnabled && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-2">
                Manual Inventory Check
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                Send an immediate inventory report email with current stock
                status for all products.
              </p>

              {stockAlert && (
                <div
                  className={`p-4 rounded-lg border mb-4 ${
                    stockAlert.type === "success"
                      ? "bg-green-50 border-green-200"
                      : "bg-yellow-50 border-yellow-200"
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <CheckCircle
                      className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                        stockAlert.type === "success"
                          ? "text-green-600"
                          : "text-yellow-600"
                      }`}
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {stockAlert.type === "success"
                          ? "✅ All Stock Levels Good"
                          : "📧 Inventory Alert Sent"}
                      </h4>
                      {stockAlert.type !== "success" && (
                        <p className="text-sm text-gray-600 mt-1">
                          Found {stockAlert.outOfStock} out of stock and{" "}
                          {stockAlert.lowStock} low stock items. Email sent to{" "}
                          <strong>iannsantiago19@gmail.com</strong>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={checkInventoryAndSendAlert}
                disabled={checkingStock}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {checkingStock ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    <span>Checking Inventory...</span>
                  </>
                ) : (
                  <>
                    <Mail className="h-5 w-5" />
                    <span>Send Inventory Report Now</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end space-x-4 pt-4 border-t">
        {saved && (
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Settings saved!</span>
          </div>
        )}
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 shadow-lg"
        >
          {saving ? (
            <>
              <Loader className="h-5 w-5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              <span>Save Settings</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default NotificationManagement;
