// Mock Analytics Data for Development
export const mockAnalyticsData = {
  kpis: {
    todayRevenue: 15750.5,
    todayTransactions: 42,
    avgOrderValue: 375.25,
    monthRevenue: 285450.75,
  },

  salesAnalytics: {
    totalRevenue: 285450.75,
    totalTransactions: 892,
    categoryBreakdown: {
      "Pain Relief": { revenue: 85340.25, transactions: 234 },
      Antibiotics: { revenue: 72180.5, transactions: 156 },
      Vitamins: { revenue: 48920.75, transactions: 298 },
      "First Aid": { revenue: 35670.25, transactions: 124 },
      "Cold & Flu": { revenue: 43339.0, transactions: 180 },
    },
  },

  inventoryAnalytics: {
    totalProducts: 1247,
    totalValue: 892340.5,
    lowStockCount: 23,
    outOfStockCount: 5,
  },

  profitAnalytics: {
    totalRevenue: 285450.75,
    totalCost: 198315.5,
    totalProfit: 87135.25,
    overallMargin: 30.5,
  },

  trends: [
    { date: "2025-09-01", revenue: 9850.25 },
    { date: "2025-09-02", revenue: 11240.5 },
    { date: "2025-09-03", revenue: 8750.75 },
    { date: "2025-09-04", revenue: 12890.25 },
    { date: "2025-09-05", revenue: 15340.5 },
    { date: "2025-09-06", revenue: 13920.75 },
    { date: "2025-09-07", revenue: 14680.25 },
    { date: "2025-09-08", revenue: 15750.5 },
  ],

  topProducts: [
    {
      id: 1,
      name: "Paracetamol 500mg",
      category: "Pain Relief",
      totalRevenue: 12450.5,
      totalQuantity: 248,
    },
    {
      id: 2,
      name: "Amoxicillin 250mg",
      category: "Antibiotics",
      totalRevenue: 9820.75,
      totalQuantity: 156,
    },
    {
      id: 3,
      name: "Vitamin C 1000mg",
      category: "Vitamins",
      totalRevenue: 7650.25,
      totalQuantity: 312,
    },
    {
      id: 4,
      name: "Betadine Solution",
      category: "First Aid",
      totalRevenue: 5890.5,
      totalQuantity: 89,
    },
    {
      id: 5,
      name: "Robitussin Syrup",
      category: "Cold & Flu",
      totalRevenue: 4320.75,
      totalQuantity: 78,
    },
  ],

  alerts: {
    lowStock: [
      {
        name: "Paracetamol 500mg",
        quantity: 12,
        alertLevel: "warning",
        recommendedAction: "Reorder soon",
      },
      {
        name: "Bandages",
        quantity: 3,
        alertLevel: "critical",
        recommendedAction: "Urgent reorder needed",
      },
      {
        name: "Alcohol 70%",
        quantity: 8,
        alertLevel: "warning",
        recommendedAction: "Plan reorder",
      },
    ],
    expiring: [
      {
        name: "Aspirin 100mg",
        daysToExpiry: 5,
        alertLevel: "critical",
        recommendedAction: "Urgent sale needed",
      },
      {
        name: "Cough Syrup",
        daysToExpiry: 12,
        alertLevel: "warning",
        recommendedAction: "Plan promotion",
      },
      {
        name: "Eye Drops",
        daysToExpiry: 18,
        alertLevel: "info",
        recommendedAction: "Monitor closely",
      },
    ],
  },
};
