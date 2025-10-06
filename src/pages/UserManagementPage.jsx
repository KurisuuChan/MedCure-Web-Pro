import React, { useState } from "react";
import {
  Users,
  Shield,
  Activity,
  UserCheck,
  Lock,
  BarChart3,
} from "lucide-react";
import UserManagementDashboard from "../features/admin/components/UserManagementDashboard";
import RolePermissionManager from "../features/admin/components/RolePermissionManager";
import ActivityLogDashboard from "../features/admin/components/ActivityLogDashboard";
import UserAnalyticsDashboard from "../features/admin/components/UserAnalyticsDashboard";

const UserManagementPage = () => {
  const [activeTab, setActiveTab] = useState("users");

  const tabs = [
    {
      id: "users",
      name: "Team Members",
      icon: Users,
      description: "Manage team member accounts and profiles",
    },
    {
      id: "roles",
      name: "Roles & Permissions",
      icon: Shield,
      description: "Configure roles and system permissions",
    },
    {
      id: "activity",
      name: "Activity Logs",
      icon: Activity,
      description: "Track user activities and system events",
    },
    {
      id: "analytics",
      name: "Team Analytics",
      icon: BarChart3,
      description: "Team performance and engagement metrics",
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "users":
        return <UserManagementDashboard />;
      case "roles":
        return <RolePermissionManager />;
      case "activity":
        return <ActivityLogDashboard />;
      case "analytics":
        return <UserAnalyticsDashboard />;
      default:
        return <UserManagementDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <UserCheck className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Team Management
              </h1>
              <p className="text-gray-600">
                Comprehensive team member, role, and access control management
              </p>
            </div>
          </div>

          {/* Admin Access Info Panel */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-blue-900 mb-1">
                  User Management Dashboard
                </h3>
                <p className="text-sm text-blue-700">
                  Manage team members, roles, and permissions. Admin access
                  required for full functionality.
                </p>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Icon
                      className={`mr-2 h-5 w-5 transition-colors ${
                        activeTab === tab.id
                          ? "text-blue-500"
                          : "text-gray-400 group-hover:text-gray-500"
                      }`}
                    />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Description */}
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              {tabs.find((tab) => tab.id === activeTab)?.description}
            </p>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">{renderTabContent()}</div>

        {/* Security Notice */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <Lock className="h-6 w-6 text-yellow-600" />
            <div>
              <h3 className="text-lg font-medium text-yellow-900">
                Security Best Practices
              </h3>
              <div className="mt-2 text-sm text-yellow-800 space-y-1">
                <p>
                  • Always follow the principle of least privilege when
                  assigning roles
                </p>
                <p>
                  • Regularly review user permissions and deactivate unused
                  accounts
                </p>
                <p>• Monitor activity logs for suspicious behavior</p>
                <p>• Ensure strong password policies are enforced</p>
                <p>
                  • Use two-factor authentication for administrative accounts
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagementPage;
