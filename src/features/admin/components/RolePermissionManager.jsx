import React, { useState, useEffect } from "react";
import {
  Shield,
  Users,
  Key,
  Lock,
  Unlock,
  Check,
  X,
  AlertTriangle,
  Info,
} from "lucide-react";
import { UserManagementService } from "../../../services/domains/auth/userManagementService";

const RolePermissionManager = () => {
  const [selectedRole, setSelectedRole] = useState(
    UserManagementService.ROLES.ADMIN
  );
  const [rolePermissions, setRolePermissions] = useState({});
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadRolePermissions();
  }, []);

  const loadRolePermissions = () => {
    const permissions = UserManagementService.ROLE_PERMISSIONS;
    console.log("🔍 [RolePermissionManager] Loading permissions:");
    console.log(
      "  Admin permissions count:",
      permissions[UserManagementService.ROLES.ADMIN]?.length
    );
    console.log(
      "  Pharmacist permissions count:",
      permissions[UserManagementService.ROLES.PHARMACIST]?.length
    );
    console.log(
      "  Employee permissions count:",
      permissions[UserManagementService.ROLES.EMPLOYEE]?.length
    );
    console.log(
      "  Total permissions defined:",
      Object.keys(UserManagementService.PERMISSIONS).length
    );
    setRolePermissions(permissions);
  };

  // Permission categories that map to the actual permissions defined in
  // src/services/domains/auth/userManagementService.js
  const permissionCategories = {
    "User Management": [
      "create_users",
      "edit_users",
      "delete_users",
      "view_users",
      "manage_roles",
    ],
    "Inventory Management": [
      "create_products",
      "edit_products",
      "delete_products",
      "view_inventory",
      "manage_stock",
      "manage_batches",
    ],
    "Sales & POS": [
      "process_sales",
      "handle_returns",
      "void_transactions",
      "view_sales_reports",
      "manage_discounts",
    ],
    "Transaction History": [
      "view_transaction_history",
      "export_transactions",
      "refund_transactions",
    ],
    "Analytics & Reports": [
      "view_analytics",
      "generate_reports",
      "export_reports",
      "view_financial_reports",
    ],
    "Customer Management": [
      "view_customers",
      "manage_customers",
      "view_customer_history",
    ],
    "System Settings": [
      "view_system_settings",
      "manage_system_settings",
      "manage_pricing",
    ],
    "Backup & Security": [
      "create_backup",
      "restore_backup",
      "view_activity_logs",
      "view_audit_trails",
    ],
  };

  const roleDescriptions = {
    [UserManagementService.ROLES.ADMIN]:
      "Full system access including user management, settings, backups, and all administrative functions.",
    [UserManagementService.ROLES.PHARMACIST]:
      "Comprehensive access: inventory, sales, analytics, reports, and customer management. No user or system administration.",
    [UserManagementService.ROLES.EMPLOYEE]:
      "Basic operational access: process sales, view inventory, and lookup customer information. Read-only for most features.",
  };

  const hasPermission = (role, permission) => {
    return rolePermissions[role]?.includes(permission) || false;
  };

  const getPermissionDescription = (permission) => {
    const descriptions = {
      // User Management
      create_users: "Create new user accounts and staff profiles",
      edit_users: "Modify existing user information and roles",
      delete_users: "Deactivate or permanently remove user accounts",
      view_users: "View user profiles and staff information",
      manage_roles: "Assign and modify user roles and permissions",

      // Inventory Management
      create_products: "Add new products to inventory catalog",
      edit_products: "Modify product information and details",
      delete_products: "Remove products from inventory",
      view_inventory: "View product inventory and stock levels",
      manage_stock: "Update stock quantities and manage inventory",
      manage_batches: "Manage product batch information (FEFO/expiry)",

      // Sales & POS
      process_sales: "Process customer transactions and sales",
      handle_returns: "Process returns and refunds for customers",
      void_transactions: "Cancel or void completed transactions",
      view_sales_reports: "Access sales analytics and reports",
      manage_discounts: "Apply discounts and promotional pricing",

      // Transaction History
      view_transaction_history: "View complete transaction history and records",
      export_transactions: "Export transaction data to CSV/Excel",
      refund_transactions: "Process refunds and return stock to inventory",

      // Analytics & Reports
      view_analytics: "Access analytics dashboard and insights",
      generate_reports: "Generate business intelligence reports",
      export_reports: "Export reports to PDF, CSV, or Excel",
      view_financial_reports: "Access financial analytics and profit margins",

      // Customer Management
      view_customers: "Access customer profiles and information",
      manage_customers: "Create and update customer profiles",
      view_customer_history: "View customer purchase history and transactions",

      // System Settings
      view_system_settings: "View system configuration and preferences",
      manage_system_settings: "Modify system settings and configuration",
      manage_pricing: "Set and modify product pricing strategies",

      // Backup & Security
      create_backup: "Create database backups manually or scheduled",
      restore_backup: "Restore database from backup files",
      view_activity_logs: "Access system activity logs and audit trails",
      view_audit_trails: "View detailed audit trails and compliance reports",
    };
    return (
      descriptions[permission] || permission.replace("_", " ").toUpperCase()
    );
  };

  const getRoleIcon = (role) => {
    const icons = {
      [UserManagementService.ROLES.ADMIN]: (
        <Shield className="h-5 w-5 text-red-600" />
      ),
      [UserManagementService.ROLES.PHARMACIST]: (
        <Lock className="h-5 w-5 text-green-600" />
      ),
      [UserManagementService.ROLES.EMPLOYEE]: (
        <Users className="h-5 w-5 text-gray-600" />
      ),
    };
    return icons[role] || <Users className="h-5 w-5 text-gray-600" />;
  };

  const getRoleColor = (role) => {
    const colors = {
      [UserManagementService.ROLES.ADMIN]:
        "bg-red-100 text-red-800 border-red-200",
      [UserManagementService.ROLES.PHARMACIST]:
        "bg-green-100 text-green-800 border-green-200",
      [UserManagementService.ROLES.EMPLOYEE]:
        "bg-gray-100 text-gray-800 border-gray-200",
    };
    return colors[role] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Role & Permission Management
          </h2>
          <p className="text-gray-600">
            Configure user roles and their associated permissions
          </p>
        </div>
      </div>

      {/* Success/Error Messages */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2" />
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center">
          <Check className="h-5 w-5 mr-2" />
          {success}
          <button
            onClick={() => setSuccess(null)}
            className="ml-auto text-green-500 hover:text-green-700"
          >
            ×
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Role Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Select Role
            </h3>
            <div className="space-y-3">
              {Object.values(UserManagementService.ROLES).map((role) => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedRole === role
                      ? getRoleColor(role)
                      : "bg-white border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {getRoleIcon(role)}
                    <div className="flex-1">
                      <p className="font-medium">
                        {role.replace("_", " ").toUpperCase()}
                      </p>
                      <p className="text-sm opacity-75 mt-1">
                        {roleDescriptions[role]}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Permission Details */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  {getRoleIcon(selectedRole)}
                  <span>
                    Permissions for{" "}
                    {selectedRole.replace("_", " ").toUpperCase()}
                  </span>
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {roleDescriptions[selectedRole]}
                </p>
              </div>
              <div className="text-sm text-gray-500">
                {rolePermissions[selectedRole]?.length || 0} permissions
              </div>
            </div>

            {/* Permission Categories */}
            <div className="space-y-6">
              {Object.entries(permissionCategories).map(
                ([category, permissions]) => (
                  <div
                    key={category}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                      <Info className="h-4 w-4 text-blue-500" />
                      <span>{category}</span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {permissions.map((permission) => {
                        const hasAccess = hasPermission(
                          selectedRole,
                          permission
                        );
                        return (
                          <div
                            key={permission}
                            className={`p-3 rounded-lg border ${
                              hasAccess
                                ? "bg-green-50 border-green-200"
                                : "bg-gray-50 border-gray-200"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                {hasAccess ? (
                                  <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                  <X className="h-4 w-4 text-gray-400" />
                                )}
                                <span
                                  className={`text-sm font-medium ${
                                    hasAccess
                                      ? "text-green-900"
                                      : "text-gray-600"
                                  }`}
                                >
                                  {permission.replace("_", " ").toUpperCase()}
                                </span>
                              </div>
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${
                                  hasAccess
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {hasAccess ? "Granted" : "Denied"}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 ml-6">
                              {getPermissionDescription(permission)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Role Hierarchy Info */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2 flex items-center space-x-2">
                <Info className="h-4 w-4" />
                <span>Role Hierarchy & Access Levels</span>
              </h4>
              <div className="space-y-2 text-sm text-blue-800">
                <p>
                  <strong className="text-red-700">🔴 Admin:</strong> Complete
                  system control including user management, system settings,
                  backups, and all operational features. Can create/edit/delete
                  users and modify system configuration.
                </p>
                <p>
                  <strong className="text-green-700">🟢 Pharmacist:</strong>{" "}
                  Full operational access to inventory management, sales
                  operations, analytics/reports, transaction history, and
                  customer management. Cannot manage users or system settings.
                </p>
                <p>
                  <strong className="text-gray-700">⚪ Employee:</strong> Basic
                  access for daily operations including processing sales,
                  viewing inventory, and looking up customer information.
                  Read-only access to transaction history and reports.
                </p>
              </div>
            </div>

            {/* Security Notice */}
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-2 flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4" />
                <span>Security Notice</span>
              </h4>
              <p className="text-sm text-yellow-800">
                Role permissions are defined at the system level and cannot be
                modified through this interface. Changes to role permissions
                require system administrator access and code deployment. Always
                follow the principle of least privilege when assigning roles to
                users.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Permission Matrix */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Permission Matrix
        </h3>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">
                  Permission
                </th>
                {Object.values(UserManagementService.ROLES).map((role) => (
                  <th
                    key={role}
                    className="text-center py-3 px-2 font-medium text-gray-900"
                  >
                    <div className="flex flex-col items-center space-y-1">
                      {getRoleIcon(role)}
                      <span className="text-xs">
                        {role.replace("_", " ").toUpperCase()}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Object.entries(permissionCategories).map(
                ([category, permissions]) => (
                  <React.Fragment key={category}>
                    <tr className="bg-gray-50">
                      <td
                        colSpan={
                          Object.values(UserManagementService.ROLES).length + 1
                        }
                        className="py-2 px-4 font-medium text-gray-800"
                      >
                        {category}
                      </td>
                    </tr>
                    {permissions.map((permission) => (
                      <tr key={permission} className="hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-900">
                          <div>
                            <p className="font-medium">
                              {permission.replace("_", " ").toUpperCase()}
                            </p>
                            <p className="text-xs text-gray-500">
                              {getPermissionDescription(permission)}
                            </p>
                          </div>
                        </td>
                        {Object.values(UserManagementService.ROLES).map(
                          (role) => (
                            <td key={role} className="py-3 px-2 text-center">
                              {hasPermission(role, permission) ? (
                                <Check className="h-5 w-5 text-green-600 mx-auto" />
                              ) : (
                                <X className="h-5 w-5 text-gray-300 mx-auto" />
                              )}
                            </td>
                          )
                        )}
                      </tr>
                    ))}
                  </React.Fragment>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RolePermissionManager;
