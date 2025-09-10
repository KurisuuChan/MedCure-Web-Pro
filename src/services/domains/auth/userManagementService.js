import { supabase } from "../../../config/supabase";

export class UserManagementService {
  // User role constants
  static ROLES = {
    ADMIN: "admin",
    MANAGER: "manager",
    CASHIER: "cashier",
  };

  // Permission constants
  static PERMISSIONS = {
    // User Management
    CREATE_USERS: "create_users",
    EDIT_USERS: "edit_users",
    DELETE_USERS: "delete_users",
    VIEW_USERS: "view_users",
    MANAGE_ROLES: "manage_roles",

    // Inventory Management
    CREATE_PRODUCTS: "create_products",
    EDIT_PRODUCTS: "edit_products",
    DELETE_PRODUCTS: "delete_products",
    VIEW_INVENTORY: "view_inventory",
    MANAGE_STOCK: "manage_stock",

    // Sales & POS
    PROCESS_SALES: "process_sales",
    HANDLE_RETURNS: "handle_returns",
    VOID_TRANSACTIONS: "void_transactions",
    VIEW_SALES_REPORTS: "view_sales_reports",
    MANAGE_DISCOUNTS: "manage_discounts",

    // Financial
    VIEW_FINANCIAL_REPORTS: "view_financial_reports",
    MANAGE_PRICING: "manage_pricing",
    VIEW_PROFIT_MARGINS: "view_profit_margins",

    // System Administration
    MANAGE_SETTINGS: "manage_settings",
    VIEW_AUDIT_LOGS: "view_audit_logs",
  };

  // Role-Permission mapping
  static ROLE_PERMISSIONS = {
    [this.ROLES.ADMIN]: Object.values(this.PERMISSIONS),
    [this.ROLES.MANAGER]: [
      this.PERMISSIONS.VIEW_USERS,
      this.PERMISSIONS.CREATE_PRODUCTS,
      this.PERMISSIONS.EDIT_PRODUCTS,
      this.PERMISSIONS.VIEW_INVENTORY,
      this.PERMISSIONS.MANAGE_STOCK,
      this.PERMISSIONS.PROCESS_SALES,
      this.PERMISSIONS.HANDLE_RETURNS,
      this.PERMISSIONS.VIEW_SALES_REPORTS,
      this.PERMISSIONS.MANAGE_DISCOUNTS,
      this.PERMISSIONS.VIEW_FINANCIAL_REPORTS,
      this.PERMISSIONS.MANAGE_PRICING,
      this.PERMISSIONS.VIEW_PROFIT_MARGINS,
      this.PERMISSIONS.VIEW_AUDIT_LOGS,
    ],
    [this.ROLES.CASHIER]: [
      this.PERMISSIONS.VIEW_INVENTORY,
      this.PERMISSIONS.PROCESS_SALES,
    ],
  };

  // Get all users with their roles and permissions
  static async getAllUsers() {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data.map((user) => ({
        ...user,
        permissions: this.getUserPermissions(user.role || this.ROLES.CASHIER),
      }));
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  }

  // Get user by ID with full details
  static async getUserById(userId) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;

      return {
        ...data,
        permissions: this.getUserPermissions(data.role || this.ROLES.CASHIER),
      };
    } catch (error) {
      console.error("Error fetching user:", error);
      throw error;
    }
  }

  // Create new user
  static async createUser(userData) {
    try {
      const {
        email,
        password,
        firstName,
        lastName,
        phone,
        role = this.ROLES.CASHIER,
      } = userData;

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone,
          },
        },
      });

      if (authError) throw authError;

      // Create user record directly in users table
      const { data: newUserData, error: userError } = await supabase
        .from("users")
        .insert({
          id: authData.user.id,
          email,
          first_name: firstName,
          last_name: lastName,
          phone,
          role,
          is_active: true,
        })
        .select()
        .single();

      if (userError) throw userError;

      return {
        ...newUserData,
        permissions: this.getUserPermissions(role),
      };
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  // Update user information
  static async updateUser(userId, updateData) {
    try {
      const { firstName, lastName, phone, role } = updateData;

      // Update user directly in users table
      const { data: userData, error: userError } = await supabase
        .from("users")
        .update({
          first_name: firstName,
          last_name: lastName,
          phone,
          role,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single();

      if (userError) throw userError;

      return {
        ...userData,
        permissions: this.getUserPermissions(
          userData.role || this.ROLES.CASHIER
        ),
      };
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }

  // Delete/Deactivate user
  static async deleteUser(userId) {
    try {
      // Soft delete - mark as inactive
      const { data, error } = await supabase
        .from("users")
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }

  // Get user permissions based on role
  static getUserPermissions(role) {
    return this.ROLE_PERMISSIONS[role] || [];
  }

  // Check if user has specific permission
  static userHasPermission(userRole, permission) {
    const permissions = this.getUserPermissions(userRole);
    return permissions.includes(permission);
  }

  // Validate role
  static isValidRole(role) {
    return Object.values(this.ROLES).includes(role);
  }

  // Get role hierarchy level (for permission comparisons)
  static getRoleLevel(role) {
    const levels = {
      [this.ROLES.ADMIN]: 3,
      [this.ROLES.MANAGER]: 2,
      [this.ROLES.CASHIER]: 1,
    };
    return levels[role] || 0;
  }

  // Check if user can manage another user (based on role hierarchy)
  static canManageUser(managerRole, targetRole) {
    return this.getRoleLevel(managerRole) > this.getRoleLevel(targetRole);
  }

  // Search users
  static async searchUsers(query, filters = {}) {
    try {
      let dbQuery = supabase.from("users").select("*");

      // Apply search query
      if (query) {
        dbQuery = dbQuery.or(
          `first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`
        );
      }

      // Apply filters
      if (filters.role) {
        dbQuery = dbQuery.eq("role", filters.role);
      }

      if (filters.is_active !== undefined) {
        dbQuery = dbQuery.eq("is_active", filters.is_active);
      }

      const { data, error } = await dbQuery.order("created_at", {
        ascending: false,
      });

      if (error) throw error;

      return data.map((user) => ({
        ...user,
        permissions: this.getUserPermissions(user.role || this.ROLES.CASHIER),
      }));
    } catch (error) {
      console.error("Error searching users:", error);
      throw error;
    }
  }

  // Get users by role
  static async getUsersByRole(role) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("role", role)
        .eq("is_active", true);

      if (error) throw error;

      return data.map((user) => ({
        ...user,
        permissions: this.getUserPermissions(role),
      }));
    } catch (error) {
      console.error("Error fetching users by role:", error);
      throw error;
    }
  }

  // Get user statistics
  static async getUserStatistics() {
    try {
      const { data: users, error } = await supabase
        .from("users")
        .select("role, is_active, created_at");

      if (error) throw error;

      const stats = {
        total_users: users.length,
        active_users: users.filter((u) => u.is_active).length,
        inactive_users: users.filter((u) => !u.is_active).length,
        by_role: {
          admin: users.filter((u) => u.role === this.ROLES.ADMIN).length,
          manager: users.filter((u) => u.role === this.ROLES.MANAGER).length,
          cashier: users.filter((u) => u.role === this.ROLES.CASHIER).length,
        },
        recent_signups: users.filter((u) => {
          const createdDate = new Date(u.created_at);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return createdDate > weekAgo;
        }).length,
      };

      return stats;
    } catch (error) {
      console.error("Error getting user statistics:", error);
      throw error;
    }
  }

  // Get active sessions (mock data since we don't have a sessions table)
  static async getActiveSessions() {
    try {
      // Since we don't have a sessions table, return mock data based on active users
      const { data: users, error } = await supabase
        .from("users")
        .select("id, email, first_name, last_name, role, last_login")
        .eq("is_active", true);

      if (error) throw error;

      // Create mock session data for active users
      const sessions = users.map((user) => ({
        id: `session_${user.id}`,
        user_id: user.id,
        user_email: user.email,
        user_name: `${user.first_name} ${user.last_name}`,
        role: user.role,
        login_time: user.last_login || new Date().toISOString(),
        ip_address: "127.0.0.1", // Mock IP
        user_agent: "MedCure-Pro Desktop App", // Mock user agent
        is_active: true,
        last_activity: new Date().toISOString(),
      }));

      return sessions;
    } catch (error) {
      console.error("Error getting active sessions:", error);
      throw error;
    }
  }
}
