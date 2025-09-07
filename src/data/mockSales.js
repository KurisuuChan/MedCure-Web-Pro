// Static sales data for development
export const mockSales = [
  {
    id: 1,
    transaction_number: "TXN-20240907-001",
    total_amount: 125.5,
    payment_method: "cash",
    amount_paid: 130.0,
    change_amount: 4.5,
    customer_name: "Maria Santos",
    customer_phone: "09171234567",
    cashier_id: "user1",
    cashier_name: "Juan Dela Cruz",
    status: "completed",
    created_at: "2024-09-07T08:30:00Z",
    items: [
      {
        id: 1,
        product_id: 1,
        product_name: "Biogesic 500mg Tablet",
        quantity: 20,
        unit: "piece",
        price_per_unit: 2.5,
        total_price: 50.0,
      },
      {
        id: 2,
        product_id: 4,
        product_name: "Ibuprofen 400mg Tablet",
        quantity: 1,
        unit: "sheet",
        price_per_unit: 57.5,
        total_price: 57.5,
      },
      {
        id: 3,
        product_id: 6,
        product_name: "Metformin 500mg Tablet",
        quantity: 6,
        unit: "piece",
        price_per_unit: 3.0,
        total_price: 18.0,
      },
    ],
  },
  {
    id: 2,
    transaction_number: "TXN-20240907-002",
    total_amount: 85.0,
    payment_method: "gcash",
    amount_paid: 85.0,
    change_amount: 0.0,
    customer_name: "Roberto Garcia",
    customer_phone: "09281234567",
    cashier_id: "user2",
    cashier_name: "Ana Reyes",
    status: "completed",
    created_at: "2024-09-07T09:15:00Z",
    items: [
      {
        id: 4,
        product_id: 2,
        product_name: "Amoxicillin 500mg Capsule",
        quantity: 5,
        unit: "piece",
        price_per_unit: 15.0,
        total_price: 75.0,
      },
      {
        id: 5,
        product_id: 8,
        product_name: "Loperamide 2mg Capsule",
        quantity: 2,
        unit: "piece",
        price_per_unit: 5.0,
        total_price: 10.0,
      },
    ],
  },
  {
    id: 3,
    transaction_number: "TXN-20240906-015",
    total_amount: 245.0,
    payment_method: "cash",
    amount_paid: 250.0,
    change_amount: 5.0,
    customer_name: "Elena Marcos",
    customer_phone: null,
    cashier_id: "user1",
    cashier_name: "Juan Dela Cruz",
    status: "completed",
    created_at: "2024-09-06T16:45:00Z",
    items: [
      {
        id: 6,
        product_id: 5,
        product_name: "Omeprazole 20mg Capsule",
        quantity: 2,
        unit: "sheet",
        price_per_unit: 168.0,
        total_price: 336.0,
      },
      {
        id: 7,
        product_id: 3,
        product_name: "Cetirizine 10mg Tablet",
        quantity: 10,
        unit: "piece",
        price_per_unit: 8.5,
        total_price: 85.0,
      },
    ],
  },
  {
    id: 4,
    transaction_number: "TXN-20240906-014",
    total_amount: 32.5,
    payment_method: "card",
    amount_paid: 32.5,
    change_amount: 0.0,
    customer_name: "Carlos Luna",
    customer_phone: "09391234567",
    cashier_id: "user2",
    cashier_name: "Ana Reyes",
    status: "completed",
    created_at: "2024-09-06T14:20:00Z",
    items: [
      {
        id: 8,
        product_id: 6,
        product_name: "Metformin 500mg Tablet",
        quantity: 10,
        unit: "piece",
        price_per_unit: 3.25,
        total_price: 32.5,
      },
    ],
  },
  {
    id: 5,
    transaction_number: "TXN-20240905-028",
    total_amount: 150.0,
    payment_method: "cash",
    amount_paid: 150.0,
    change_amount: 0.0,
    customer_name: "Senior Citizen",
    customer_phone: null,
    cashier_id: "user1",
    cashier_name: "Juan Dela Cruz",
    status: "completed",
    created_at: "2024-09-05T11:30:00Z",
    items: [
      {
        id: 9,
        product_id: 7,
        product_name: "Amlodipine 5mg Tablet",
        quantity: 20,
        unit: "piece",
        price_per_unit: 7.5,
        total_price: 150.0,
      },
    ],
  },
];

// Sales analytics data
export const mockSalesAnalytics = {
  today: {
    total_sales: 845.5,
    total_transactions: 12,
    total_items_sold: 156,
    average_transaction: 70.46,
  },
  yesterday: {
    total_sales: 967.25,
    total_transactions: 15,
    total_items_sold: 203,
    average_transaction: 64.48,
  },
  this_week: {
    total_sales: 5230.75,
    total_transactions: 78,
    total_items_sold: 892,
    average_transaction: 67.06,
  },
  this_month: {
    total_sales: 23450.8,
    total_transactions: 342,
    total_items_sold: 4156,
    average_transaction: 68.57,
  },
  payment_methods: {
    cash: { count: 45, amount: 3120.5, percentage: 65.2 },
    gcash: { count: 20, amount: 1234.75, percentage: 25.8 },
    card: { count: 8, amount: 567.25, percentage: 9.0 },
  },
  top_selling_products: [
    {
      product_id: 1,
      product_name: "Biogesic 500mg Tablet",
      quantity_sold: 456,
      revenue: 1140.0,
    },
    {
      product_id: 4,
      product_name: "Ibuprofen 400mg Tablet",
      quantity_sold: 234,
      revenue: 1345.5,
    },
    {
      product_id: 6,
      product_name: "Metformin 500mg Tablet",
      quantity_sold: 189,
      revenue: 614.25,
    },
    {
      product_id: 2,
      product_name: "Amoxicillin 500mg Capsule",
      quantity_sold: 87,
      revenue: 1305.0,
    },
    {
      product_id: 3,
      product_name: "Cetirizine 10mg Tablet",
      quantity_sold: 78,
      revenue: 663.0,
    },
  ],
  hourly_sales: [
    { hour: 8, sales: 125.5, transactions: 2 },
    { hour: 9, sales: 234.75, transactions: 4 },
    { hour: 10, sales: 456.25, transactions: 7 },
    { hour: 11, sales: 345.8, transactions: 5 },
    { hour: 12, sales: 567.9, transactions: 8 },
    { hour: 13, sales: 432.15, transactions: 6 },
    { hour: 14, sales: 678.45, transactions: 9 },
    { hour: 15, sales: 543.2, transactions: 7 },
    { hour: 16, sales: 789.65, transactions: 11 },
    { hour: 17, sales: 654.3, transactions: 8 },
  ],
};

// Helper functions
export function calculateTotalSales(sales) {
  return sales.reduce((total, sale) => total + sale.total_amount, 0);
}

export function getSalesByDateRange(sales, startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  return sales.filter((sale) => {
    const saleDate = new Date(sale.created_at);
    return saleDate >= start && saleDate <= end;
  });
}

export function getSalesByPaymentMethod(sales) {
  const methods = {};

  sales.forEach((sale) => {
    if (!methods[sale.payment_method]) {
      methods[sale.payment_method] = {
        count: 0,
        total: 0,
      };
    }

    methods[sale.payment_method].count++;
    methods[sale.payment_method].total += sale.total_amount;
  });

  return methods;
}
