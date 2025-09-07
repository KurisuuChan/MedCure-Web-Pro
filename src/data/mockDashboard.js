// Static dashboard analytics data for development
export const mockDashboardData = {
  // Key metrics for today
  todayMetrics: {
    totalSales: 2450.75,
    totalTransactions: 24,
    totalItems: 187,
    averageTransaction: 102.11,
    grossProfit: 892.45,
    netProfit: 734.2,
  },

  // Comparison with yesterday
  yesterdayMetrics: {
    totalSales: 2156.3,
    totalTransactions: 19,
    totalItems: 142,
    averageTransaction: 113.49,
  },

  // Weekly performance
  weeklyData: [
    { day: "Mon", sales: 1890.5, transactions: 18 },
    { day: "Tue", sales: 2156.3, transactions: 19 },
    { day: "Wed", sales: 2450.75, transactions: 24 },
    { day: "Thu", sales: 1756.2, transactions: 16 },
    { day: "Fri", sales: 2890.45, transactions: 28 },
    { day: "Sat", sales: 3245.8, transactions: 32 },
    { day: "Sun", sales: 1678.9, transactions: 15 },
  ],

  // Monthly trends
  monthlyTrends: [
    { month: "Jan", sales: 45780.5, profit: 18567.2 },
    { month: "Feb", sales: 52390.75, profit: 21245.8 },
    { month: "Mar", sales: 48920.3, profit: 19876.45 },
    { month: "Apr", sales: 55670.8, profit: 22567.9 },
    { month: "May", sales: 61230.45, profit: 24890.15 },
    { month: "Jun", sales: 58940.2, profit: 23456.75 },
    { month: "Jul", sales: 64580.9, profit: 25789.3 },
    { month: "Aug", sales: 69875.6, profit: 27890.45 },
    { month: "Sep", sales: 23450.8, profit: 9567.25 }, // Partial month
  ],

  // Top selling products
  topProducts: [
    {
      id: 1,
      name: "Biogesic 500mg Tablet",
      quantitySold: 456,
      revenue: 1140.0,
      profit: 456.0,
      growth: 12.5,
    },
    {
      id: 4,
      name: "Ibuprofen 400mg Tablet",
      quantitySold: 234,
      revenue: 1345.5,
      profit: 567.8,
      growth: 8.7,
    },
    {
      id: 6,
      name: "Metformin 500mg Tablet",
      quantitySold: 189,
      revenue: 614.25,
      profit: 245.7,
      growth: -3.2,
    },
    {
      id: 2,
      name: "Amoxicillin 500mg Capsule",
      quantitySold: 87,
      revenue: 1305.0,
      profit: 521.5,
      growth: 15.4,
    },
    {
      id: 3,
      name: "Cetirizine 10mg Tablet",
      quantitySold: 78,
      revenue: 663.0,
      profit: 265.2,
      growth: 6.9,
    },
  ],

  // Low stock alerts
  lowStockAlerts: [
    {
      id: 7,
      name: "Amlodipine 5mg Tablet",
      currentStock: 15,
      reorderLevel: 60,
      status: "critical",
      daysLeft: 2,
    },
    {
      id: 3,
      name: "Cetirizine 10mg Tablet",
      currentStock: 45,
      reorderLevel: 100,
      status: "low",
      daysLeft: 7,
    },
    {
      id: 5,
      name: "Omeprazole 20mg Capsule",
      currentStock: 168,
      reorderLevel: 250,
      status: "warning",
      daysLeft: 12,
    },
  ],

  // Expiring products
  expiringProducts: [
    {
      id: 5,
      name: "Omeprazole 20mg Capsule",
      expiryDate: "2024-12-05",
      daysUntilExpiry: 89,
      currentStock: 168,
      value: 2016.0,
    },
    {
      id: 3,
      name: "Cetirizine 10mg Tablet",
      expiryDate: "2025-03-20",
      daysUntilExpiry: 194,
      currentStock: 45,
      value: 382.5,
    },
  ],

  // Payment method distribution
  paymentMethods: [
    { method: "Cash", amount: 18421.3, percentage: 75.8, transactions: 179 },
    { method: "GCash", amount: 5890.25, percentage: 24.2, transactions: 78 },
  ],

  // Hourly sales pattern
  hourlySales: [
    { hour: "8 AM", sales: 145.5, transactions: 3 },
    { hour: "9 AM", sales: 267.75, transactions: 5 },
    { hour: "10 AM", sales: 423.8, transactions: 8 },
    { hour: "11 AM", sales: 356.9, transactions: 6 },
    { hour: "12 PM", sales: 512.45, transactions: 9 },
    { hour: "1 PM", sales: 398.6, transactions: 7 },
    { hour: "2 PM", sales: 634.2, transactions: 11 },
    { hour: "3 PM", sales: 478.35, transactions: 8 },
    { hour: "4 PM", sales: 756.4, transactions: 13 },
    { hour: "5 PM", sales: 567.8, transactions: 9 },
    { hour: "6 PM", sales: 234.9, transactions: 4 },
  ],

  // Recent transactions
  recentTransactions: [
    {
      id: "TXN-20240907-024",
      customer: "Maria Garcia",
      amount: 125.5,
      items: 3,
      paymentMethod: "cash",
      time: "2024-09-07T11:45:00Z",
      cashier: "Ana Reyes",
    },
    {
      id: "TXN-20240907-023",
      customer: "Roberto Santos",
      amount: 89.25,
      items: 2,
      paymentMethod: "gcash",
      time: "2024-09-07T11:30:00Z",
      cashier: "Juan Dela Cruz",
    },
    {
      id: "TXN-20240907-022",
      customer: "Elena Cruz",
      amount: 234.75,
      items: 5,
      paymentMethod: "gcash",
      time: "2024-09-07T11:15:00Z",
      cashier: "Ana Reyes",
    },
    {
      id: "TXN-20240907-021",
      customer: "Carlos Luna",
      amount: 67.5,
      items: 2,
      paymentMethod: "cash",
      time: "2024-09-07T11:00:00Z",
      cashier: "Juan Dela Cruz",
    },
  ],

  // System alerts
  systemAlerts: [
    {
      id: 1,
      type: "warning",
      title: "Low Stock Alert",
      message: "3 products are running low on stock",
      timestamp: "2024-09-07T10:30:00Z",
      isRead: false,
    },
    {
      id: 2,
      type: "info",
      title: "Backup Completed",
      message: "Daily database backup completed successfully",
      timestamp: "2024-09-07T06:00:00Z",
      isRead: true,
    },
    {
      id: 3,
      type: "error",
      title: "Expired Products",
      message: "2 products have expired and need to be removed",
      timestamp: "2024-09-06T18:00:00Z",
      isRead: false,
    },
  ],
};

// Helper functions for dashboard calculations
export function calculateGrowthPercentage(current, previous) {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

export function formatGrowth(current, previous) {
  const growth = calculateGrowthPercentage(current, previous);
  return {
    value: Math.abs(growth).toFixed(1),
    isPositive: growth >= 0,
    direction: growth >= 0 ? "up" : "down",
  };
}

export function getTopPerformingProducts(count = 5) {
  return mockDashboardData.topProducts.slice(0, count);
}

export function getCriticalAlerts() {
  return {
    lowStock: mockDashboardData.lowStockAlerts.filter(
      (item) => item.status === "critical"
    ),
    expiring: mockDashboardData.expiringProducts.filter(
      (item) => item.daysUntilExpiry <= 30
    ),
    system: mockDashboardData.systemAlerts.filter((alert) => !alert.isRead),
  };
}
