import React, { useState, useEffect } from "react";
import { Bell, Check, X, AlertTriangle, Info } from "lucide-react";
import notificationService from "../../services/notifications/NotificationService";
import { useAuth } from "../../hooks/useAuth";

export default function NotificationSettings() {
  const { user } = useAuth();
  const [permissionStatus, setPermissionStatus] = useState("default");
  const [isSupported, setIsSupported] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    setIsSupported("Notification" in window);
    setPermissionStatus(
      "Notification" in window ? Notification.permission : "unsupported"
    );
  }, []);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);

      if (permission === "granted") {
        // Show a test browser notification
        new Notification("Notifications enabled successfully!", {
          body: "You will now receive important pharmacy alerts",
          icon: "/notification-icon.png",
        });

        // Create database notification
        if (user?.id) {
          await notificationService.create({
            userId: user.id,
            title: "Notifications Enabled",
            message: "You will now receive important pharmacy alerts",
            type: "success",
            priority: 2,
            category: "system",
          });
        }
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleTestNotification = async () => {
    if (permissionStatus === "granted") {
      new Notification("This is a test notification from MedCure Pro", {
        body: "Your notification system is working correctly",
        icon: "/notification-icon.png",
      });

      if (user?.id) {
        await notificationService.create({
          userId: user.id,
          title: "Test Notification",
          message: "Your notification system is working correctly",
          type: "info",
          priority: 2,
          category: "system",
        });
      }
    }
  };

  const handleRunChecks = async () => {
    if (permissionStatus === "granted") {
      await notificationService.checkHealth();
      console.log("✅ Health check completed");
    }
  };

  const getStatusColor = () => {
    switch (permissionStatus) {
      case "granted":
        return "text-green-600 bg-green-50";
      case "denied":
        return "text-red-600 bg-red-50";
      case "unsupported":
        return "text-gray-600 bg-gray-50";
      default:
        return "text-yellow-600 bg-yellow-50";
    }
  };

  const getStatusIcon = () => {
    switch (permissionStatus) {
      case "granted":
        return <Check className="h-5 w-5" />;
      case "denied":
        return <X className="h-5 w-5" />;
      case "unsupported":
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getStatusText = () => {
    switch (permissionStatus) {
      case "granted":
        return "Notifications Enabled";
      case "denied":
        return "Notifications Blocked";
      case "unsupported":
        return "Not Supported";
      default:
        return "Permission Needed";
    }
  };

  if (!isSupported) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="h-6 w-6 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">
            Desktop Notifications
          </h3>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-600">
            <AlertTriangle className="h-5 w-5" />
            <span>Desktop notifications are not supported in this browser</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="h-6 w-6 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Desktop Notifications
        </h3>
      </div>

      {/* Status Display */}
      <div
        className={`flex items-center gap-3 p-4 rounded-lg mb-6 ${getStatusColor()}`}
      >
        {getStatusIcon()}
        <div>
          <div className="font-semibold">{getStatusText()}</div>
          <div className="text-sm opacity-75">
            {permissionStatus === "granted" &&
              "You will receive desktop notifications for important alerts"}
            {permissionStatus === "denied" &&
              "Enable notifications in your browser settings to receive alerts"}
            {permissionStatus === "default" &&
              "Grant permission to receive important pharmacy alerts"}
            {permissionStatus === "unsupported" &&
              "Your browser does not support desktop notifications"}
          </div>
        </div>
      </div>

      {/* Notification Types */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-900 mb-3">
          You will receive notifications for:
        </h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gray-600">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span>Low stock alerts (10 pieces or less)</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span>Product expiry warnings (30 days or less)</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Sale completion confirmations</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>System alerts and errors</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {permissionStatus === "default" && (
          <button
            onClick={handleRequestPermission}
            disabled={isRequesting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isRequesting ? "Requesting..." : "Enable Notifications"}
          </button>
        )}

        {permissionStatus === "granted" && (
          <>
            <button
              onClick={handleTestNotification}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Test Notification
            </button>
            <button
              onClick={handleRunChecks}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Run Stock Checks
            </button>
          </>
        )}

        {permissionStatus === "denied" && (
          <div className="text-sm text-gray-600">
            To enable notifications: Go to your browser settings → Privacy &
            Security → Notifications → Allow for this site
          </div>
        )}
      </div>
    </div>
  );
}
