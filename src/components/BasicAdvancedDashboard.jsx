import React from "react";

const BasicAdvancedDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">
          Advanced Analytics Dashboard
        </h2>
        <p className="text-gray-600">Loading business intelligence data...</p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900">Revenue</h3>
            <p className="text-2xl font-bold text-blue-600">₱0.00</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-medium text-green-900">Transactions</h3>
            <p className="text-2xl font-bold text-green-600">0</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-medium text-purple-900">Products</h3>
            <p className="text-2xl font-bold text-purple-600">0</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="font-medium text-orange-900">Alerts</h3>
            <p className="text-2xl font-bold text-orange-600">0</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicAdvancedDashboard;
