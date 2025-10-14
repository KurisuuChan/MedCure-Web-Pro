import { useState, useEffect } from "react";
import { Settings, Activity, Bell, CheckCircle } from "lucide-react";
import { useToast } from "../components/ui/Toast";
import { useAuth } from "../hooks/useAuth";
import GeneralSettings from "../components/settings/GeneralSettings";
import SystemHealth from "../components/settings/SystemHealth";
import NotificationManagement from "../components/settings/NotificationManagement";

function SystemSettingsPage() {
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
  const { user } = useAuth();

  const tabs = [
    {
      id: "general",
      label: "General Settings",
      icon: Settings,
      description: "Business information and system preferences",
    },
    {
      id: "health",
      label: "System Health",
      icon: Activity,
      description: "Monitor system performance and status",
    },
    {
      id: "notifications",
      label: "Notifications & Alerts",
      icon: Bell,
      description:
        "Manage notification timing, email alerts, and inventory monitoring",
    },
  ];

  useEffect(() => {
    loadSystemHealth();
  }, []);

  const loadSystemHealth = async () => {
    setLoading(true);
    try {
      // Simulate loading system health data
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error("Failed to load system health:", error);
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
          {activeTab === "health" && (
            <SystemHealth systemHealth={systemHealth} loading={loading} />
          )}
          {activeTab === "notifications" && (
            <NotificationManagement
              user={user}
              showSuccess={showSuccess}
              showError={showError}
              showInfo={showInfo}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default SystemSettingsPage;
