import { supabase } from "../config/supabase";

export class UserManagementService {
  // User role constants
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
    APPROVE_ORDERS: "approve_orders",

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
    EXPORT_FINANCIAL_DATA: "export_financial_data",

    // System Administration
    MANAGE_SETTINGS: "manage_settings",
    VIEW_AUDIT_LOGS: "view_audit_logs",
    MANAGE_NOTIFICATIONS: "manage_notifications",
    BACKUP_RESTORE: "backup_restore",

    // Customer Management
    CREATE_CUSTOMERS: "create_customers",
    EDIT_CUSTOMERS: "edit_customers",
    VIEW_CUSTOMER_DATA: "view_customer_data",
    MANAGE_LOYALTY: "manage_loyalty",

    // Supplier Management
    CREATE_SUPPLIERS: "create_suppliers",
    EDIT_SUPPLIERS: "edit_suppliers",
    MANAGE_PURCHASE_ORDERS: "manage_purchase_orders",
    VIEW_SUPPLIER_REPORTS: "view_supplier_reports",
  };

  // Role-Permission mapping
  static ROLE_PERMISSIONS = {
    [this.ROLES.SUPER_ADMIN]: Object.values(this.PERMISSIONS),
    [this.ROLES.ADMIN]: [
      this.PERMISSIONS.CREATE_USERS,
      this.PERMISSIONS.EDIT_USERS,
      this.PERMISSIONS.VIEW_USERS,
      this.PERMISSIONS.MANAGE_ROLES,
      this.PERMISSIONS.CREATE_PRODUCTS,
      this.PERMISSIONS.EDIT_PRODUCTS,
      this.PERMISSIONS.VIEW_INVENTORY,
      this.PERMISSIONS.MANAGE_STOCK,
      this.PERMISSIONS.APPROVE_ORDERS,
      this.PERMISSIONS.PROCESS_SALES,
      this.PERMISSIONS.HANDLE_RETURNS,
      this.PERMISSIONS.VOID_TRANSACTIONS,
      this.PERMISSIONS.VIEW_SALES_REPORTS,
      this.PERMISSIONS.MANAGE_DISCOUNTS,
      this.PERMISSIONS.VIEW_FINANCIAL_REPORTS,
      this.PERMISSIONS.MANAGE_PRICING,
      this.PERMISSIONS.VIEW_PROFIT_MARGINS,
      this.PERMISSIONS.EXPORT_FINANCIAL_DATA,
      this.PERMISSIONS.MANAGE_SETTINGS,
      this.PERMISSIONS.VIEW_AUDIT_LOGS,
      this.PERMISSIONS.MANAGE_NOTIFICATIONS,
      this.PERMISSIONS.CREATE_CUSTOMERS,
      this.PERMISSIONS.EDIT_CUSTOMERS,
      this.PERMISSIONS.VIEW_CUSTOMER_DATA,
      this.PERMISSIONS.MANAGE_LOYALTY,
      this.PERMISSIONS.CREATE_SUPPLIERS,
      this.PERMISSIONS.EDIT_SUPPLIERS,
      this.PERMISSIONS.MANAGE_PURCHASE_ORDERS,
      this.PERMISSIONS.VIEW_SUPPLIER_REPORTS,
    ],
    [this.ROLES.MANAGER]: [
      this.PERMISSIONS.VIEW_USERS,
      this.PERMISSIONS.CREATE_PRODUCTS,
      this.PERMISSIONS.EDIT_PRODUCTS,
      this.PERMISSIONS.VIEW_INVENTORY,
      this.PERMISSIONS.MANAGE_STOCK,
      this.PERMISSIONS.APPROVE_ORDERS,
      this.PERMISSIONS.PROCESS_SALES,
      this.PERMISSIONS.HANDLE_RETURNS,
      this.PERMISSIONS.VIEW_SALES_REPORTS,
      this.PERMISSIONS.MANAGE_DISCOUNTS,
      this.PERMISSIONS.VIEW_FINANCIAL_REPORTS,
      this.PERMISSIONS.MANAGE_PRICING,
      this.PERMISSIONS.VIEW_PROFIT_MARGINS,
      this.PERMISSIONS.MANAGE_NOTIFICATIONS,
      this.PERMISSIONS.CREATE_CUSTOMERS,
      this.PERMISSIONS.EDIT_CUSTOMERS,
      this.PERMISSIONS.VIEW_CUSTOMER_DATA,
      this.PERMISSIONS.MANAGE_LOYALTY,
      this.PERMISSIONS.EDIT_SUPPLIERS,
      this.PERMISSIONS.MANAGE_PURCHASE_ORDERS,
      this.PERMISSIONS.VIEW_SUPPLIER_REPORTS,
    ],
    [this.ROLES.PHARMACIST]: [
      this.PERMISSIONS.VIEW_INVENTORY,
      this.PERMISSIONS.MANAGE_STOCK,
      this.PERMISSIONS.PROCESS_SALES,
      this.PERMISSIONS.HANDLE_RETURNS,
      this.PERMISSIONS.VIEW_SALES_REPORTS,
      this.PERMISSIONS.VIEW_CUSTOMER_DATA,
      this.PERMISSIONS.CREATE_CUSTOMERS,
      this.PERMISSIONS.EDIT_CUSTOMERS,
      this.PERMISSIONS.VIEW_SUPPLIER_REPORTS,
    ],
    [this.ROLES.CASHIER]: [
      this.PERMISSIONS.VIEW_INVENTORY,
      this.PERMISSIONS.PROCESS_SALES,
      this.PERMISSIONS.HANDLE_RETURNS,
      this.PERMISSIONS.VIEW_CUSTOMER_DATA,
      this.PERMISSIONS.CREATE_CUSTOMERS,
    ],
    [this.ROLES.STAFF]: [
      this.PERMISSIONS.VIEW_INVENTORY,
      this.PERMISSIONS.PROCESS_SALES,
      this.PERMISSIONS.VIEW_CUSTOMER_DATA,
    ],
  };

  // Get all users with their roles and permissions
  static async getAllUsers() {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select(
          `
          *,
          user_roles (
            role,
            assigned_at,
            assigned_by
          ),
          user_sessions!inner (
            last_login,
            last_activity,
            is_active
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data.map((user) => ({
        ...user,
        permissions: this.getUserPermissions(
          user.user_roles?.role || this.ROLES.STAFF
        ),
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
        .from("user_profiles")
        .select(
          `
          *,
          user_roles (
            role,
            assigned_at,
            assigned_by
          ),
          user_sessions (
            session_id,
            last_login,
            last_activity,
            is_active
          ),
          user_activity_logs (
            activity_type,
            description,
            created_at
          )
        `
        )
        .eq("id", userId)
        .single();

      if (error) throw error;

      return {
        ...data,
        permissions: this.getUserPermissions(
          data.user_roles?.role || this.ROLES.STAFF
        ),
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
        role = this.ROLES.STAFF,
        department,
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

      // Create user profile
      const { data: profileData, error: profileError } = await supabase
        .from("user_profiles")
        .insert({
          id: authData.user.id,
          email,
          first_name: firstName,
          last_name: lastName,
          phone,
          department,
          status: "active",
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // Assign role
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: authData.user.id,
        role,
        assigned_by: (await supabase.auth.getUser()).data.user.id,
        assigned_at: new Date().toISOString(),
      });

      if (roleError) throw roleError;

      // Log activity
      await this.logUserActivity(
        (
          await supabase.auth.getUser()
        ).data.user.id,
        "USER_CREATED",
        `Created new user: ${firstName} ${lastName} (${email})`
      );

      return {
        ...profileData,
        role,
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
      const { firstName, lastName, phone, department, status, role } =
        updateData;

      // Update profile
      const { data: profileData, error: profileError } = await supabase
        .from("user_profiles")
        .update({
          first_name: firstName,
          last_name: lastName,
          phone,
          department,
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single();

      if (profileError) throw profileError;

      // Update role if provided
      if (role) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .update({
            role,
            assigned_by: (await supabase.auth.getUser()).data.user.id,
            assigned_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        if (roleError) throw roleError;
      }

      // Log activity
      await this.logUserActivity(
        (
          await supabase.auth.getUser()
        ).data.user.id,
        "USER_UPDATED",
        `Updated user: ${firstName} ${lastName}`
      );

      return {
        ...profileData,
        role: role || profileData.role,
        permissions: this.getUserPermissions(role || profileData.role),
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
        .from("user_profiles")
        .update({
          status: "inactive",
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single();

      if (error) throw error;

      // End all active sessions
      await supabase
        .from("user_sessions")
        .update({
          is_active: false,
          ended_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      // Log activity
      await this.logUserActivity(
        (
          await supabase.auth.getUser()
        ).data.user.id,
        "USER_DEACTIVATED",
        `Deactivated user: ${data.first_name} ${data.last_name}`
      );

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

  // Get user activity logs
  static async getUserActivityLogs(userId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from("user_activity_logs")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      throw error;
    }
  }

  // Log user activity
  static async logUserActivity(
    userId,
    activityType,
    description,
    metadata = {}
  ) {
    try {
      const { error } = await supabase.from("user_activity_logs").insert({
        user_id: userId,
        activity_type: activityType,
        description,
        metadata,
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;
    } catch (error) {
      console.error("Error logging activity:", error);
    }
  }

  // Get active user sessions
  static async getActiveSessions() {
    try {
      const { data, error } = await supabase
        .from("user_sessions")
        .select(
          `
          *,
          user_profiles (
            first_name,
            last_name,
            email
          )
        `
        )
        .eq("is_active", true)
        .order("last_activity", { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching active sessions:", error);
      throw error;
    }
  }

  // End user session
  static async endUserSession(sessionId) {
    try {
      const { data, error } = await supabase
        .from("user_sessions")
        .update({
          is_active: false,
          ended_at: new Date().toISOString(),
        })
        .eq("session_id", sessionId)
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await this.logUserActivity(
        data.user_id,
        "SESSION_ENDED",
        "Session ended by administrator"
      );

      return data;
    } catch (error) {
      console.error("Error ending session:", error);
      throw error;
    }
  }

  // Update user session activity
  static async updateSessionActivity(userId) {
    try {
      const { error } = await supabase
        .from("user_sessions")
        .update({
          last_activity: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("is_active", true);

      if (error) throw error;
    } catch (error) {
      console.error("Error updating session activity:", error);
    }
  }

  // Get user statistics
  static async getUserStatistics() {
    try {
      const { data: totalUsers, error: totalError } = await supabase
        .from("user_profiles")
        .select("id", { count: "exact" })
        .eq("status", "active");

      const { data: activeUsers, error: activeError } = await supabase
        .from("user_sessions")
        .select("user_id", { count: "exact" })
        .eq("is_active", true);

      const { data: roleBreakdown, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .order("role");

      if (totalError || activeError || roleError) {
        throw totalError || activeError || roleError;
      }

      // Count roles
      const roleCounts = {};
      roleBreakdown.forEach(({ role }) => {
        roleCounts[role] = (roleCounts[role] || 0) + 1;
      });

      return {
        totalUsers: totalUsers?.length || 0,
        activeUsers: activeUsers?.length || 0,
        roleBreakdown: roleCounts,
        roles: Object.values(this.ROLES),
      };
    } catch (error) {
      console.error("Error fetching user statistics:", error);
      throw error;
    }
  }

  // Helper method to get client IP (simplified)
  static async getClientIP() {
    // In a real application, you'd want to implement proper IP detection
    return "unknown";
  }

  // Password reset functionality
  static async resetUserPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      // Log activity
      const { data: user } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("email", email)
        .single();

      if (user) {
        await this.logUserActivity(
          user.id,
          "PASSWORD_RESET_REQUESTED",
          "Password reset requested"
        );
      }

      return { success: true };
    } catch (error) {
      console.error("Error resetting password:", error);
      throw error;
    }
  }

  // Bulk operations
  static async bulkUpdateUsers(userIds, updateData) {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .in("id", userIds)
        .select();

      if (error) throw error;

      // Log activity
      await this.logUserActivity(
        (
          await supabase.auth.getUser()
        ).data.user.id,
        "BULK_USER_UPDATE",
        `Bulk updated ${userIds.length} users`
      );

      return data;
    } catch (error) {
      console.error("Error bulk updating users:", error);
      throw error;
    }
  }
}

export default UserManagementService;
