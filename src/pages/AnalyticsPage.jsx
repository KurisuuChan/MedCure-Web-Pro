import React, { useState } from "react";
import { BarChart3, Package, DollarSign } from "lucide-react";

const AnalyticsPage = () => {
  const [activeTab, setActiveTab] = useState("sales");

  const tabs = [
    {
      id: "sales",
      name: "Sales Analytics",
      icon: BarChart3,
      description: "Sales performance and trends",
    },
    {
      id: "inventory",
      name: "Inventory Reports",
      icon: Package,
      description: "Stock levels and movements",
    },
    {
      id: "financial",
      name: "Financial Overview",
      icon: DollarSign,
      description: "Revenue and profit analysis",
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "sales":
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <BarChart3 className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Sales Analytics
              </h3>
              <p className="text-gray-600 mb-6">
                Track sales performance, trends, and revenue insights
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900">Daily Sales</h4>
                  <p className="text-2xl font-bold text-blue-600">₱12,450</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900">
                    Monthly Revenue
                  </h4>
                  <p className="text-2xl font-bold text-green-600">₱345,600</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-900">Growth Rate</h4>
                  <p className="text-2xl font-bold text-purple-600">+15.3%</p>
                </div>
              </div>
            </div>
          </div>
        );
      case "inventory":
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <Package className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Inventory Reports
              </h3>
              <p className="text-gray-600 mb-6">
                Monitor stock levels, movements, and inventory health
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900">
                    Total Products
                  </h4>
                  <p className="text-2xl font-bold text-green-600">2,847</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-yellow-900">Low Stock</h4>
                  <p className="text-2xl font-bold text-yellow-600">23</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-red-900">Out of Stock</h4>
                  <p className="text-2xl font-bold text-red-600">5</p>
                </div>
              </div>
            </div>
          </div>
        );
      case "financial":
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <DollarSign className="h-16 w-16 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Financial Overview
              </h3>
              <p className="text-gray-600 mb-6">
                Analyze revenue, profit margins, and financial performance
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-900">
                    Total Revenue
                  </h4>
                  <p className="text-2xl font-bold text-purple-600">
                    ₱1,245,600
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900">Profit Margin</h4>
                  <p className="text-2xl font-bold text-blue-600">18.5%</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900">Net Profit</h4>
                  <p className="text-2xl font-bold text-green-600">₱230,436</p>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
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
              <span>Business Intelligence</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Enterprise
              </span>
            </h1>
            <p className="text-gray-600 mt-1">
              Advanced analytics and insights for data-driven business decisions
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
