import { supabase, isProductionSupabase } from "../../../config/supabase";

export class UserManagementService {
  // User role constants - match database schema
  static ROLES = {
    SUPER_ADMIN: "super_admin",
    ADMIN: "admin", 
    MANAGER: "manager",
    PHARMACIST: "pharmacist",
    CASHIER: "cashier",
    STAFF: "staff",
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

  // Role-Permission mapping - updated for all roles
  static ROLE_PERMISSIONS = {
    [this.ROLES.SUPER_ADMIN]: Object.values(this.PERMISSIONS),
    [this.ROLES.ADMIN]: Object.values(this.PERMISSIONS).filter(p => p !== this.PERMISSIONS.MANAGE_SETTINGS),
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
    [this.ROLES.PHARMACIST]: [
      this.PERMISSIONS.VIEW_INVENTORY,
      this.PERMISSIONS.PROCESS_SALES,
      this.PERMISSIONS.MANAGE_STOCK,
      this.PERMISSIONS.VIEW_SALES_REPORTS,
    ],
    [this.ROLES.CASHIER]: [
      this.PERMISSIONS.VIEW_INVENTORY,
      this.PERMISSIONS.PROCESS_SALES,
    ],
    [this.ROLES.STAFF]: [
      this.PERMISSIONS.VIEW_INVENTORY,
    ],
  };

  // Get all users with their roles and permissions
  static async getAllUsers() {
    try {
      // Check if we're in development mode without real Supabase
      if (!isProductionSupabase) {
        return this.getMockUsers();
      }

      const { data, error } = await supabase
        .from("users")
        .select(`
          id,
          email,
          first_name,
          last_name,
          phone,
          role,
          is_active,
          last_login,
          created_at,
          updated_at
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data.map((user) => ({
        ...user,
        user_roles: { role: user.role }, // Match frontend expectations
        status: user.is_active ? "active" : "inactive", // Match frontend expectations
        permissions: this.getUserPermissions(user.role || this.ROLES.CASHIER),
      }));
    } catch (error) {
      console.error("Error fetching users:", error);
      // Fallback to mock data on error
      return this.getMockUsers();
    }
  }

  // Mock users for development
  static getMockUsers() {
    return [
      {
        id: "1",
        email: "admin@medcure.com",
        first_name: "Admin",
        last_name: "User",
        phone: "+1234567890",
        role: this.ROLES.ADMIN,
        is_active: true,
        status: "active",
        user_roles: { role: this.ROLES.ADMIN },
        last_login: new Date().toISOString(),
        created_at: new Date().toISOString(),
        permissions: this.getUserPermissions(this.ROLES.ADMIN),
      },
      {
        id: "2",
        email: "manager@medcure.com",
        first_name: "Manager",
        last_name: "User",
        phone: "+1234567891",
        role: this.ROLES.MANAGER,
        is_active: true,
        status: "active",
        user_roles: { role: this.ROLES.MANAGER },
        last_login: new Date().toISOString(),
        created_at: new Date().toISOString(),
        permissions: this.getUserPermissions(this.ROLES.MANAGER),
      },
      {
        id: "3",
        email: "cashier@medcure.com",
        first_name: "Cashier",
        last_name: "User",
        phone: "+1234567892",
        role: this.ROLES.CASHIER,
        is_active: true,
        status: "active",
        user_roles: { role: this.ROLES.CASHIER },
        last_login: new Date().toISOString(),
        created_at: new Date().toISOString(),
        permissions: this.getUserPermissions(this.ROLES.CASHIER),
      },
    ];
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
      // Check if we're in development mode without real Supabase
      if (!isProductionSupabase) {
        return this.getMockUserStatistics();
      }

      const { data: users, error } = await supabase
        .from("users")
        .select("role, is_active, created_at");

      if (error) throw error;

      const totalUsers = users.length;
      const activeUsers = users.filter((u) => u.is_active).length;
      const inactiveUsers = users.filter((u) => !u.is_active).length;

      const roleDistribution = {};
      Object.values(this.ROLES).forEach(role => {
        roleDistribution[role] = users.filter((u) => u.role === role).length;
      });

      const recentSignups = users.filter((u) => {
        const createdDate = new Date(u.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return createdDate > weekAgo;
      }).length;

      return {
        totalUsers,
        activeUsers,
        inactiveUsers,
        roles: Object.values(this.ROLES),
        roleDistribution,
        recentSignups,
      };
    } catch (error) {
      console.error("Error getting user statistics:", error);
      return this.getMockUserStatistics();
    }
  }

  // Mock user statistics for development
  static getMockUserStatistics() {
    return {
      totalUsers: 8,
      activeUsers: 7,
      inactiveUsers: 1,
      roles: Object.values(this.ROLES),
      roleDistribution: {
        [this.ROLES.SUPER_ADMIN]: 1,
        [this.ROLES.ADMIN]: 2,
        [this.ROLES.MANAGER]: 2,
        [this.ROLES.PHARMACIST]: 1,
        [this.ROLES.CASHIER]: 2,
        [this.ROLES.STAFF]: 0,
      },
      recentSignups: 2,
    };
  }

  // Get active sessions (mock implementation since we don't have sessions table)
  static async getActiveSessions() {
    try {
      const { data: users, error } = await supabase
        .from("users")
        .select("id, email, first_name, last_name, role, last_login")
        .eq("is_active", true)
        .not("last_login", "is", null)
        .order("last_login", { ascending: false });

      if (error) throw error;

      // Create mock session data for users who have logged in
      const sessions = users.map((user) => ({
        session_id: `session_${user.id}_${Date.now()}`,
        user_id: user.id,
        user_profiles: {
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
        },
        role: user.role,
        last_login: user.last_login,
        last_activity: new Date().toISOString(),
        ip_address: "127.0.0.1", // Mock IP
        user_agent: "MedCure-Pro Desktop App",
        is_active: true,
      }));

      return sessions;
    } catch (error) {
      console.error("Error getting active sessions:", error);
      return []; // Return empty array on error
    }
  }

  // Reset user password
  static async resetUserPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      return { success: true, message: "Password reset email sent successfully" };
    } catch (error) {
      console.error("Error resetting password:", error);
      throw error;
    }
  }

  // End user session (mock implementation)
  static async endUserSession(sessionId) {
    try {
      // Since we don't have actual sessions, this is a mock implementation
      // In a real implementation, you'd remove the session from a sessions table
      console.log(`Ending session: ${sessionId}`);
      return { success: true, message: "Session ended successfully" };
    } catch (error) {
      console.error("Error ending session:", error);
      throw error;
    }
  }
}
