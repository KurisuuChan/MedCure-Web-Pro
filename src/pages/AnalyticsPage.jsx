import React, { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Activity,
  PieChart,
  FileText,
  Calendar,
} from "lucide-react";
import AdvancedDashboard from "../features/analytics/components/AdvancedDashboard";
import BusinessIntelligenceDashboard from "../features/analytics/components/BusinessIntelligenceDashboard";
import AdvancedReportingDashboard from "../features/reports/components/AdvancedReportingDashboard";

const AnalyticsPage = () => {
  const [activeTab, setActiveTab] = useState("business-intelligence");

  const tabs = [
    {
      id: "business-intelligence",
      name: "Business Intelligence",
      icon: BarChart3,
      description: "Comprehensive business analytics and insights",
    },
    {
      id: "advanced-reports",
      name: "Advanced Reports",
      icon: FileText,
      description: "Professional reports with PDF export",
    },
    {
      id: "advanced-dashboard",
      name: "Advanced Dashboard",
      icon: Activity,
      description: "Original advanced analytics dashboard",
    },
    {
      id: "sales-analytics",
      name: "Sales Analytics",
      icon: TrendingUp,
      description: "Detailed sales performance analysis",
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "business-intelligence":
        return <BusinessIntelligenceDashboard />;
      case "advanced-reports":
        return <AdvancedReportingDashboard />;
      case "advanced-dashboard":
        return <AdvancedDashboard />;
      case "sales-analytics":
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <TrendingUp className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Sales Analytics
              </h3>
              <p className="text-gray-600">
                Detailed sales analytics coming in Phase 5
              </p>
            </div>
          </div>
        );
      case "financial-reports":
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <PieChart className="h-16 w-16 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Financial Reports
              </h3>
              <p className="text-gray-600">
                Comprehensive financial reporting coming in Phase 5
              </p>
            </div>
          </div>
        );
      default:
        return <BusinessIntelligenceDashboard />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="bg-blue-100 p-3 rounded-xl">
            <BarChart3 className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <span>Analytics Dashboard</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Enhanced
              </span>
            </h1>
            <p className="text-gray-600 mt-1">
              Comprehensive business intelligence and analytics for data-driven
              decisions
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-blue-100 text-blue-700 border border-blue-200"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                  title={tab.description}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                  {tab.id === "business-intelligence" && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                      New
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
};

export default AnalyticsPage;
