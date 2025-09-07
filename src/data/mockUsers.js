// Static user data for development
export const mockUsers = [
  {
    id: "user1",
    email: "admin@medcure.com",
    full_name: "Dr. Maria Santos",
    role: "admin",
    phone: "09171234567",
    address: "123 Main St, Angeles City",
    status: "active",
    last_login: "2024-09-07T08:00:00Z",
    created_at: "2024-01-01T00:00:00Z",
    permissions: [
      "view_dashboard",
      "manage_inventory",
      "process_sales",
      "view_reports",
      "manage_users",
      "system_settings",
    ],
  },
  {
    id: "user2",
    email: "manager@medcure.com",
    full_name: "Juan Dela Cruz",
    role: "manager",
    phone: "09281234567",
    address: "456 Secondary St, Angeles City",
    status: "active",
    last_login: "2024-09-07T07:30:00Z",
    created_at: "2024-01-15T00:00:00Z",
    permissions: [
      "view_dashboard",
      "manage_inventory",
      "process_sales",
      "view_reports",
    ],
  },
  {
    id: "user3",
    email: "cashier1@medcure.com",
    full_name: "Ana Reyes",
    role: "cashier",
    phone: "09391234567",
    address: "789 Third St, Angeles City",
    status: "active",
    last_login: "2024-09-06T18:00:00Z",
    created_at: "2024-02-01T00:00:00Z",
    permissions: ["view_dashboard", "process_sales"],
  },
  {
    id: "user4",
    email: "cashier2@medcure.com",
    full_name: "Roberto Garcia",
    role: "cashier",
    phone: "09451234567",
    address: "321 Fourth St, Angeles City",
    status: "active",
    last_login: "2024-09-05T17:45:00Z",
    created_at: "2024-02-15T00:00:00Z",
    permissions: ["view_dashboard", "process_sales"],
  },
  {
    id: "user5",
    email: "intern@medcure.com",
    full_name: "Elena Marcos",
    role: "cashier",
    phone: "09561234567",
    address: "654 Fifth St, Angeles City",
    status: "inactive",
    last_login: "2024-08-30T16:00:00Z",
    created_at: "2024-06-01T00:00:00Z",
    permissions: ["view_dashboard", "process_sales"],
  },
];

// Role definitions
export const roles = {
  admin: {
    name: "Administrator",
    description: "Full system access including user management and settings",
    permissions: [
      "view_dashboard",
      "manage_inventory",
      "process_sales",
      "view_reports",
      "manage_users",
      "system_settings",
      "void_transactions",
    ],
  },
  manager: {
    name: "Manager",
    description:
      "Can manage inventory and view reports but cannot manage users",
    permissions: [
      "view_dashboard",
      "manage_inventory",
      "process_sales",
      "view_reports",
      "void_transactions",
    ],
  },
  cashier: {
    name: "Cashier",
    description: "Can process sales and view basic dashboard",
    permissions: ["view_dashboard", "process_sales"],
  },
};

// Permission definitions
export const permissions = {
  view_dashboard: "View Dashboard",
  manage_inventory: "Manage Inventory",
  process_sales: "Process Sales",
  view_reports: "View Reports",
  manage_users: "Manage Users",
  system_settings: "System Settings",
  void_transactions: "Void Transactions",
};

// Helper functions
export function getUsersByRole(role) {
  return mockUsers.filter((user) => user.role === role);
}

export function getActiveUsers() {
  return mockUsers.filter((user) => user.status === "active");
}

export function getUserPermissions(userId) {
  const user = mockUsers.find((u) => u.id === userId);
  return user ? user.permissions : [];
}

export function hasPermission(userId, permission) {
  const userPermissions = getUserPermissions(userId);
  return userPermissions.includes(permission);
}

export function getRolePermissions(role) {
  return roles[role]?.permissions || [];
}

// User activity data
export const mockUserActivity = [
  {
    id: 1,
    user_id: "user1",
    user_name: "Dr. Maria Santos",
    action: "User Login",
    details: "Logged in from IP 192.168.1.100",
    timestamp: "2024-09-07T08:00:00Z",
  },
  {
    id: 2,
    user_id: "user2",
    user_name: "Juan Dela Cruz",
    action: "Inventory Update",
    details: "Updated stock for Biogesic 500mg Tablet",
    timestamp: "2024-09-07T07:45:00Z",
  },
  {
    id: 3,
    user_id: "user3",
    user_name: "Ana Reyes",
    action: "Sale Transaction",
    details: "Processed transaction TXN-20240907-002",
    timestamp: "2024-09-07T09:15:00Z",
  },
  {
    id: 4,
    user_id: "user1",
    user_name: "Dr. Maria Santos",
    action: "User Created",
    details: "Created new cashier account for Elena Marcos",
    timestamp: "2024-09-06T14:30:00Z",
  },
  {
    id: 5,
    user_id: "user2",
    user_name: "Juan Dela Cruz",
    action: "Report Generated",
    details: "Generated monthly sales report",
    timestamp: "2024-09-06T16:20:00Z",
  },
];
