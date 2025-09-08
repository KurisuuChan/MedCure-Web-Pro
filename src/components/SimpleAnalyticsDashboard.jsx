import React from "react";

const SimpleAnalyticsDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
          <p className="text-2xl font-bold text-gray-900">₱0.00</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Transactions</h3>
          <p className="text-2xl font-bold text-gray-900">0</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Products</h3>
          <p className="text-2xl font-bold text-gray-900">0</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Low Stock</h3>
          <p className="text-2xl font-bold text-gray-900">0</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Analytics Dashboard</h3>
        <p className="text-gray-600">
          Advanced analytics features are being loaded...
        </p>
      </div>
    </div>
  );
};

export default SimpleAnalyticsDashboard;
