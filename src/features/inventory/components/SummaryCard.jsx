import React from "react";

/**
 * Summary Card Component
 * Displays a summary metric with icon and optional alert animation
 *
 * @param {string} title - The title/label for the metric
 * @param {string|number} value - The formatted value to display
 * @param {React.Component} icon - Lucide icon component
 * @param {string} color - Color theme (blue, yellow, red, green)
 * @param {boolean} alert - Whether to show alert animation
 */
// eslint-disable-next-line no-unused-vars
function SummaryCard({ title, value, icon: IconComponent, color, alert }) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    yellow: "bg-yellow-50 text-yellow-600",
    red: "bg-red-50 text-red-600",
    green: "bg-green-50 text-green-600",
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div
          className={`p-3 rounded-lg ${colorClasses[color]} ${
            alert ? "animate-pulse" : ""
          }`}
        >
          <IconComponent className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

export default SummaryCard;
