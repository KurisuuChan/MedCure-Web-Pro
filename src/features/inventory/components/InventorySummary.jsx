import React from "react";
import { Package, TrendingDown, Calendar, TrendingUp } from "lucide-react";
import SummaryCard from "./SummaryCard";
import { formatNumber, formatCurrency } from "../../../utils/formatting";

/**
 * Inventory Summary Section Component
 * Displays key inventory metrics in summary cards
 */
function InventorySummary({ analytics }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <SummaryCard
        title="Total Products"
        value={formatNumber(analytics.totalProducts)}
        icon={Package}
        color="blue"
      />
      <SummaryCard
        title="Low Stock Items"
        value={formatNumber(analytics.lowStockProducts)}
        icon={TrendingDown}
        color="yellow"
        alert={analytics.lowStockProducts > 0}
      />
      <SummaryCard
        title="Expiring Soon"
        value={formatNumber(analytics.expiringProducts)}
        icon={Calendar}
        color="red"
        alert={analytics.expiringProducts > 0}
      />
      <SummaryCard
        title="Total Value"
        value={formatCurrency(analytics.totalValue)}
        icon={TrendingUp}
        color="green"
      />
    </div>
  );
}

export default InventorySummary;
