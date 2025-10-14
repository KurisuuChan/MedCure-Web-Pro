import { supabase, isProductionSupabase } from "../../../config/supabase";

export class UserManagementService {
  // User role constants - Simplified RBAC for pharmacy system
  static ROLES = {
    ADMIN: "admin", // Super admin with full access
    PHARMACIST: "pharmacist", // Pharmacist with inventory and sales access
    EMPLOYEE: "employee", // Employee with basic access
  };

  // Permission constants - Complete list of all system features
  static PERMISSIONS = {
    // User Management (only Admin)
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
    MANAGE_BATCHES: "manage_batches",

    // Sales & POS
    PROCESS_SALES: "process_sales",
    HANDLE_RETURNS: "handle_returns",
    VOID_TRANSACTIONS: "void_transactions",
    VIEW_SALES_REPORTS: "view_sales_reports",
    MANAGE_DISCOUNTS: "manage_discounts",

    // Transaction History
    VIEW_TRANSACTION_HISTORY: "view_transaction_history",
    EXPORT_TRANSACTIONS: "export_transactions",
    REFUND_TRANSACTIONS: "refund_transactions",

    // Analytics & Reports
    VIEW_ANALYTICS: "view_analytics",
    GENERATE_REPORTS: "generate_reports",
    EXPORT_REPORTS: "export_reports",
    VIEW_FINANCIAL_REPORTS: "view_financial_reports",

    // Customer Management
    VIEW_CUSTOMERS: "view_customers",
    MANAGE_CUSTOMERS: "manage_customers",
    VIEW_CUSTOMER_HISTORY: "view_customer_history",

    // System Settings & Configuration
    VIEW_SYSTEM_SETTINGS: "view_system_settings",
    MANAGE_SYSTEM_SETTINGS: "manage_system_settings",
    MANAGE_PRICING: "manage_pricing",

    // Backup & Security
    CREATE_BACKUP: "create_backup",
    RESTORE_BACKUP: "restore_backup",
    VIEW_ACTIVITY_LOGS: "view_activity_logs",
    VIEW_AUDIT_TRAILS: "view_audit_trails",
  };

  // Role-Permission mapping - Accurate 3-tier system with complete feature coverage
  static ROLE_PERMISSIONS = {
    // ADMIN: Full system access - ALL permissions (super admin)
    [this.ROLES.ADMIN]: Object.values(this.PERMISSIONS),

    // PHARMACIST: Inventory, sales, analytics, customer management (no user management or system settings)
    [this.ROLES.PHARMACIST]: [
      // Can view users but cannot manage them
      this.PERMISSIONS.VIEW_USERS,

      // Full inventory management
      this.PERMISSIONS.CREATE_PRODUCTS,
      this.PERMISSIONS.EDIT_PRODUCTS,
      this.PERMISSIONS.DELETE_PRODUCTS,
      this.PERMISSIONS.VIEW_INVENTORY,
      this.PERMISSIONS.MANAGE_STOCK,
      this.PERMISSIONS.MANAGE_BATCHES,

      // Full sales operations
      this.PERMISSIONS.PROCESS_SALES,
      this.PERMISSIONS.HANDLE_RETURNS,
      this.PERMISSIONS.VOID_TRANSACTIONS,
      this.PERMISSIONS.VIEW_SALES_REPORTS,
      this.PERMISSIONS.MANAGE_DISCOUNTS,

      // Transaction History
      this.PERMISSIONS.VIEW_TRANSACTION_HISTORY,
      this.PERMISSIONS.EXPORT_TRANSACTIONS,
      this.PERMISSIONS.REFUND_TRANSACTIONS,

      // Analytics & Reports
      this.PERMISSIONS.VIEW_ANALYTICS,
      this.PERMISSIONS.GENERATE_REPORTS,
      this.PERMISSIONS.EXPORT_REPORTS,
      this.PERMISSIONS.VIEW_FINANCIAL_REPORTS,

      // Customer management
      this.PERMISSIONS.VIEW_CUSTOMERS,
      this.PERMISSIONS.MANAGE_CUSTOMERS,
      this.PERMISSIONS.VIEW_CUSTOMER_HISTORY,

      // System Settings (view only, no manage)
      this.PERMISSIONS.VIEW_SYSTEM_SETTINGS,
      this.PERMISSIONS.MANAGE_PRICING,

      // Activity logs (read only)
      this.PERMISSIONS.VIEW_ACTIVITY_LOGS,
      this.PERMISSIONS.VIEW_AUDIT_TRAILS,
    ],

    // EMPLOYEE: Basic sales, inventory view, customer lookup (no management capabilities)
    [this.ROLES.EMPLOYEE]: [
      // Inventory (view only)
      this.PERMISSIONS.VIEW_INVENTORY,

      // Sales operations (basic)
      this.PERMISSIONS.PROCESS_SALES,
      this.PERMISSIONS.VIEW_SALES_REPORTS,

      // Transaction History (view only)
      this.PERMISSIONS.VIEW_TRANSACTION_HISTORY,

      // Customer (view only)
      this.PERMISSIONS.VIEW_CUSTOMERS,
      this.PERMISSIONS.VIEW_CUSTOMER_HISTORY,
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
        .select(
          `
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
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data.map((user) => ({
        ...user,
        user_roles: { role: user.role }, // Match frontend expectations
        status: user.is_active ? "active" : "inactive", // Match frontend expectations
        permissions: this.getUserPermissions(user.role || this.ROLES.EMPLOYEE),
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
        email: "pharmacist@medcure.com",
        first_name: "John",
        last_name: "Pharmacist",
        phone: "+1234567891",
        role: this.ROLES.PHARMACIST,
        is_active: true,
        status: "active",
        user_roles: { role: this.ROLES.PHARMACIST },
        last_login: new Date().toISOString(),
        created_at: new Date().toISOString(),
        permissions: this.getUserPermissions(this.ROLES.PHARMACIST),
      },
      {
        id: "3",
        email: "employee@medcure.com",
        first_name: "Jane",
        last_name: "Employee",
        phone: "+1234567892",
        role: this.ROLES.EMPLOYEE,
        is_active: true,
        status: "active",
        user_roles: { role: this.ROLES.EMPLOYEE },
        last_login: new Date().toISOString(),
        created_at: new Date().toISOString(),
        permissions: this.getUserPermissions(this.ROLES.EMPLOYEE),
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
        permissions: this.getUserPermissions(data.role || this.ROLES.EMPLOYEE),
      };
    } catch (error) {
      console.error("Error fetching user:", error);
      throw error;
    }
  }

  // Create new user
  static async createUser(userData) {
    try {
      console.log("🔧 [UserManagement] Creating user with data:", {
        ...userData,
        password: "***",
      });

      const {
        email,
        password,
        firstName,
        lastName,
        phone,
        role = this.ROLES.EMPLOYEE,
      } = userData;

      // Validate role
      if (!this.isValidRole(role)) {
        throw new Error(
          `Invalid role: ${role}. Valid roles are: ${Object.values(
            this.ROLES
          ).join(", ")}`
        );
      }

      console.log("📧 [UserManagement] Creating auth user for:", email);

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

      if (authError) {
        console.error("❌ [UserManagement] Auth signup error:", authError);
        throw authError;
      }

      if (!authData?.user) {
        throw new Error("Failed to create auth user - no user data returned");
      }

      console.log("✅ [UserManagement] Auth user created:", authData.user.id);
      console.log("💾 [UserManagement] Creating user record in database...");

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

      if (userError) {
        console.error("❌ [UserManagement] Database insert error:", userError);
        throw userError;
      }

      console.log(
        "✅ [UserManagement] User created successfully:",
        newUserData.id
      );

      return {
        ...newUserData,
        permissions: this.getUserPermissions(role),
      };
    } catch (error) {
      console.error("❌ [UserManagement] Error creating user:", error);
      console.error("Error details:", {
        message: error.message,
        hint: error.hint,
        details: error.details,
        code: error.code,
      });
      throw error;
    }
  }

  // Update user information
  static async updateUser(userId, updateData) {
    try {
      console.log("🔧 [UserManagement] Updating user:", userId, updateData);

      const { firstName, lastName, phone, role, status } = updateData;

      // Validate role if it's being updated
      if (role && !this.isValidRole(role)) {
        throw new Error(
          `Invalid role: ${role}. Valid roles are: ${Object.values(
            this.ROLES
          ).join(", ")}`
        );
      }

      // Prepare update object
      const updateObject = {
        first_name: firstName,
        last_name: lastName,
        phone,
        updated_at: new Date().toISOString(),
      };

      // Only update role if provided
      if (role) {
        updateObject.role = role;
      }

      // Update is_active based on status
      if (status) {
        updateObject.is_active = status === "active";
      }

      console.log("💾 [UserManagement] Updating database with:", updateObject);

      // Update user directly in users table
      const { data: userData, error: userError } = await supabase
        .from("users")
        .update(updateObject)
        .eq("id", userId)
        .select()
        .single();

      if (userError) {
        console.error("❌ [UserManagement] Update error:", userError);
        throw userError;
      }

      console.log(
        "✅ [UserManagement] User updated successfully:",
        userData.id
      );

      return {
        ...userData,
        permissions: this.getUserPermissions(
          userData.role || this.ROLES.EMPLOYEE
        ),
      };
    } catch (error) {
      console.error("❌ [UserManagement] Error updating user:", error);
      console.error("Error details:", {
        message: error.message,
        hint: error.hint,
        details: error.details,
        code: error.code,
      });
      throw error;
    }
  }

  // Delete user (soft delete - deactivate instead of permanent deletion)
  static async deleteUser(userId) {
    try {
      console.log("🗑️ [UserManagement] Starting user deletion:", userId);

      // ✅ FIXED: Use soft delete instead of hard delete to avoid foreign key constraint violations
      // This preserves referential integrity with sales, audit_log, and other related tables

      console.log("🔄 [UserManagement] Deactivating user (soft delete)...");
      const { data, error } = await supabase
        .from("users")
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single();

      if (error) {
        console.error("❌ [UserManagement] Failed to deactivate user:", error);

        // Provide helpful error messages
        if (error.code === "PGRST116") {
          throw new Error("User not found");
        } else if (error.message.includes("foreign key")) {
          throw new Error(
            "Cannot delete user: User has associated records in the system"
          );
        } else {
          throw new Error(`Failed to delete user: ${error.message}`);
        }
      }

      console.log(
        `✅ [UserManagement] User ${userId} successfully deactivated (soft deleted)`
      );
      console.log(
        `📧 Deactivated user: ${data.email} (${data.first_name} ${data.last_name})`
      );

      return data;
    } catch (error) {
      console.error("❌ [UserManagement] Error deleting user:", error);
      console.error("Error details:", {
        message: error.message,
        hint: error.hint,
        details: error.details,
        code: error.code,
      });
      throw error;
    }
  }

  // Activate user (reactivate deactivated user)
  static async activateUser(userId) {
    try {
      console.log("✅ [UserManagement] Reactivating user:", userId);

      // First, check if user exists and is currently deactivated
      const { data: userData, error: fetchError } = await supabase
        .from("users")
        .select("id, email, first_name, last_name, is_active, role")
        .eq("id", userId)
        .single();

      if (fetchError) {
        console.error("❌ [UserManagement] User not found:", fetchError);
        throw new Error("User not found");
      }

      if (userData.is_active) {
        console.warn("⚠️ [UserManagement] User is already active");
        throw new Error("User is already active");
      }

      console.log(`🔄 Reactivating user: ${userData.email}`);

      // Reactivate the user
      const { data, error } = await supabase
        .from("users")
        .update({
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single();

      if (error) {
        console.error("❌ [UserManagement] Failed to reactivate user:", error);
        throw new Error(`Failed to reactivate user: ${error.message}`);
      }

      console.log(
        `✅ [UserManagement] User ${userId} successfully reactivated`
      );
      console.log(
        `📧 Reactivated user: ${data.email} (${data.first_name} ${data.last_name})`
      );

      return data;
    } catch (error) {
      console.error("❌ [UserManagement] Error reactivating user:", error);
      console.error("Error details:", {
        message: error.message,
        hint: error.hint,
        details: error.details,
        code: error.code,
      });
      throw error;
    }
  }

  // Hard delete user (permanent deletion - only for deactivated users)
  // Cascade is always true to clean up logs and movements (sales are always protected)
  static async hardDeleteUser(userId, options = { cascade: true }) {
    try {
      console.log("🗑️ [UserManagement] Starting HARD deletion:", userId);
      console.log("⚙️ [UserManagement] Delete options:", options);

      // First, check if user exists and is deactivated
      const { data: userData, error: fetchError } = await supabase
        .from("users")
        .select("id, email, first_name, last_name, is_active")
        .eq("id", userId)
        .single();

      if (fetchError) {
        console.error("❌ [UserManagement] User not found:", fetchError);
        throw new Error("User not found");
      }

      // Safety check: Only allow hard delete of deactivated users
      if (userData.is_active) {
        console.error("❌ [UserManagement] Cannot hard delete active user");
        throw new Error(
          "Cannot permanently delete an active user. Please deactivate the user first."
        );
      }

      console.log(
        "⚠️ [UserManagement] PERMANENTLY deleting user (hard delete)..."
      );
      console.log(
        "📧 User to delete:",
        `${userData.email} (${userData.first_name} ${userData.last_name})`
      );

      // If cascade is enabled, delete related records first
      if (options.cascade) {
        console.log(
          "🔄 [UserManagement] CASCADE delete enabled - removing related records..."
        );

        try {
          // Delete stock movements
          const { error: stockError } = await supabase
            .from("stock_movements")
            .delete()
            .eq("user_id", userId);

          if (stockError) {
            console.warn("⚠️ Could not delete stock movements:", stockError);
          } else {
            console.log("✅ Deleted stock movements");
          }

          // Delete audit logs
          const { error: auditError } = await supabase
            .from("audit_log")
            .delete()
            .eq("user_id", userId);

          if (auditError) {
            console.warn("⚠️ Could not delete audit logs:", auditError);
          } else {
            console.log("✅ Deleted audit logs");
          }

          // Delete user activity logs
          const { error: logsError } = await supabase
            .from("user_activity_logs")
            .delete()
            .eq("user_id", userId);

          if (logsError) {
            console.warn("⚠️ Could not delete activity logs:", logsError);
          } else {
            console.log("✅ Deleted user activity logs");
          }

          // Note: Sales records should NOT be deleted as they are business-critical
          // Instead, you might want to reassign them to a "deleted user" account
          console.log("ℹ️ Sales records will remain (business data integrity)");
        } catch (cascadeError) {
          console.error("❌ Error during cascade delete:", cascadeError);
          throw new Error(
            `Failed to delete related records: ${cascadeError.message}`
          );
        }
      }

      // Perform hard delete
      const { error: deleteError } = await supabase
        .from("users")
        .delete()
        .eq("id", userId);

      if (deleteError) {
        console.error(
          "❌ [UserManagement] Failed to hard delete user:",
          deleteError
        );
        console.error("❌ Error code:", deleteError.code);
        console.error("❌ Error details:", deleteError.details);
        console.error("❌ Error hint:", deleteError.hint);

        // Provide helpful error messages with specific table information
        if (
          deleteError.code === "23503" ||
          deleteError.code === "409" ||
          deleteError.message.toLowerCase().includes("foreign key") ||
          deleteError.message.toLowerCase().includes("conflict")
        ) {
          // Foreign key constraint violation

          // Try to identify which tables have references
          let errorDetails = "";
          if (deleteError.details) {
            errorDetails = ` Details: ${deleteError.details}`;
          } else if (deleteError.hint) {
            errorDetails = ` Hint: ${deleteError.hint}`;
          }

          throw new Error(
            `Cannot permanently delete user: This user has associated records in the database.\n\n` +
              `The user has sales records that must be preserved for business compliance.\n\n` +
              `Blocked by:\n` +
              `• Sales/Transactions (sales table) - PROTECTED\n\n` +
              `Recommendation:\n` +
              `• Keep user deactivated instead of deleting\n` +
              `• Sales data must remain for financial/audit purposes\n` +
              `• Use the Reactivate button if user needs to be restored${errorDetails}`
          );
        } else {
          throw new Error(
            `Failed to permanently delete user: ${deleteError.message}`
          );
        }
      }

      console.log(
        `✅ [UserManagement] User ${userId} PERMANENTLY deleted (hard delete)`
      );
      console.log(
        `📧 Deleted user: ${userData.email} (${userData.first_name} ${userData.last_name})`
      );

      return userData;
    } catch (error) {
      console.error("❌ [UserManagement] Error hard deleting user:", error);
      console.error("Error details:", {
        message: error.message,
        hint: error.hint,
        details: error.details,
        code: error.code,
      });
      throw error;
    }
  }

  // Check what records are associated with a user (for safe deletion planning)
  static async getUserAssociatedRecords(userId) {
    try {
      console.log(
        "🔍 [UserManagement] Checking associated records for user:",
        userId
      );

      const associations = {
        sales: 0,
        stockMovements: 0,
        activityLogs: 0,
        auditLogs: 0,
        canDelete: true,
        blockingTables: [],
      };

      // Check sales records
      const { count: salesCount, error: salesError } = await supabase
        .from("sales")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      if (!salesError && salesCount) {
        associations.sales = salesCount;
        if (salesCount > 0) {
          associations.canDelete = false;
          associations.blockingTables.push(`sales (${salesCount} records)`);
        }
      }

      // Check stock movements
      const { count: stockCount, error: stockError } = await supabase
        .from("stock_movements")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      if (!stockError && stockCount) {
        associations.stockMovements = stockCount;
        // Stock movements can be deleted with cascade, so don't block
      }

      // Check activity logs
      const { count: logsCount, error: logsError } = await supabase
        .from("user_activity_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      if (!logsError && logsCount) {
        associations.activityLogs = logsCount;
      }

      // Check audit logs
      const { count: auditCount, error: auditError } = await supabase
        .from("audit_log")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      if (!auditError && auditCount) {
        associations.auditLogs = auditCount;
      }

      console.log("📊 Associated records:", associations);
      return associations;
    } catch (error) {
      console.error("❌ Error checking associated records:", error);
      return {
        sales: 0,
        stockMovements: 0,
        activityLogs: 0,
        auditLogs: 0,
        canDelete: false,
        blockingTables: ["Error checking - assume not safe to delete"],
        error: error.message,
      };
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
      // New role system
      [this.ROLES.ADMIN]: 3,
      [this.ROLES.PHARMACIST]: 2,
      [this.ROLES.EMPLOYEE]: 1,
      // Legacy roles (for backward compatibility)
      super_admin: 3,
      manager: 2,
      cashier: 1,
      staff: 1,
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
        permissions: this.getUserPermissions(user.role || this.ROLES.EMPLOYEE),
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
      Object.values(this.ROLES).forEach((role) => {
        roleDistribution[role] = users.filter((u) => u.role === role).length;
      });

      // Also count legacy roles for backward compatibility
      const legacyRoles = ["super_admin", "manager", "cashier", "staff"];
      legacyRoles.forEach((role) => {
        const count = users.filter((u) => u.role === role).length;
        if (count > 0) {
          roleDistribution[role] = count;
        }
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
        [this.ROLES.ADMIN]: 2,
        [this.ROLES.PHARMACIST]: 3,
        [this.ROLES.EMPLOYEE]: 3,
      },
      recentSignups: 2,
    };
  }

  // Get active sessions (users active in last 24 hours)
  static async getActiveSessions() {
    try {
      // Check if we're in development mode without real Supabase
      if (!isProductionSupabase) {
        return this.getMockActiveSessions();
      }

      const cutoffTime = new Date(
        Date.now() - 24 * 60 * 60 * 1000
      ).toISOString(); // 24 hours ago

      const { data, error } = await supabase
        .from("users")
        .select(
          `
          id,
          first_name,
          last_name,
          email,
          role,
          last_login,
          is_active
        `
        )
        .gte("last_login", cutoffTime)
        .eq("is_active", true)
        .order("last_login", { ascending: false });

      if (error) throw error;

      return data.map((user) => ({
        ...user,
        session_start: user.last_login,
        last_activity: user.last_login,
        ip_address: "N/A",
        device: "Web Browser",
      }));
    } catch (error) {
      console.error("Error getting active sessions:", error);
      return this.getMockActiveSessions();
    }
  }

  // Mock active sessions for development
  static getMockActiveSessions() {
    const now = new Date();
    return [
      {
        id: "1",
        first_name: "Admin",
        last_name: "User",
        email: "admin@medcure.com",
        role: "admin",
        last_login: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
        session_start: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
        last_activity: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
        ip_address: "192.168.1.100",
        device: "Web Browser",
        is_active: true,
      },
    ];
  }

  // Get all activity logs from user_activity_logs table
  static async getAllActivityLogs(limit = 100, filters = {}) {
    try {
      // Check if we're in development mode without real Supabase
      if (!isProductionSupabase) {
        return this.getMockActivityLogs(limit);
      }

      let query = supabase
        .from("user_activity_logs")
        .select(
          `
          *,
          users!user_activity_logs_user_id_fkey (
            first_name,
            last_name,
            email,
            role
          )
        `
        )
        .order("created_at", { ascending: false })
        .limit(limit);

      // Apply filters
      if (filters.userId && filters.userId !== "all") {
        query = query.eq("user_id", filters.userId);
      }
      if (filters.actionType && filters.actionType !== "all") {
        query = query.eq("action_type", filters.actionType);
      }
      if (filters.startDate) {
        query = query.gte("created_at", filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte("created_at", filters.endDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching activity logs:", error);
        // If table doesn't exist or error, return mock data
        return this.getMockActivityLogs(limit);
      }

      // Format the data
      return data.map((log) => ({
        id: log.id,
        user_id: log.user_id,
        activity_type: log.action_type,
        description: this.formatActivityDescription(
          log.action_type,
          log.metadata
        ),
        ip_address: log.metadata?.ip_address || "unknown",
        user_agent: log.metadata?.user_agent || "unknown",
        created_at: log.created_at,
        metadata: log.metadata,
        user_name: log.users
          ? `${log.users.first_name} ${log.users.last_name}`
          : "Unknown User",
        user_email: log.users?.email || "unknown",
        user_role: log.users?.role || "unknown",
      }));
    } catch (error) {
      console.error("Error getting activity logs:", error);
      return this.getMockActivityLogs(limit);
    }
  }

  // Format activity description
  static formatActivityDescription(actionType) {
    const descriptions = {
      login: "User logged into the system",
      logout: "User logged out of the system",
      USER_CREATED: "New user account created",
      USER_UPDATED: "User profile updated",
      USER_DELETED: "User account deleted",
      USER_DEACTIVATED: "User account deactivated",
      PASSWORD_RESET_REQUESTED: "Password reset requested",
      PERMISSION_CHANGED: "User permissions modified",
      ROLE_CHANGED: "User role changed",
      SESSION_STARTED: "User session started",
      SESSION_ENDED: "User session ended",
    };

    return descriptions[actionType] || `System activity: ${actionType}`;
  }

  // Generate mock activity logs
  static getMockActivityLogs(limit = 100) {
    const activities = [];
    const now = new Date();

    // Better weighted distribution to avoid spam
    const activityPool = [
      ...Array(15).fill("login"),
      ...Array(18).fill("SESSION_STARTED"),
      ...Array(15).fill("USER_UPDATED"),
      ...Array(12).fill("logout"),
      ...Array(10).fill("SESSION_ENDED"),
      ...Array(8).fill("PERMISSION_CHANGED"),
      ...Array(7).fill("USER_CREATED"),
      ...Array(5).fill("PASSWORD_RESET_REQUESTED"),
      ...Array(5).fill("BULK_USER_UPDATE"),
      ...Array(3).fill("USER_DEACTIVATED"),
      ...Array(2).fill("LOGIN_ATTEMPT"),
    ];

    const mockUsers = [
      {
        id: "1",
        name: "Admin User",
        email: "admin@medcure.com",
        role: "admin",
      },
      {
        id: "2",
        name: "John Pharmacist",
        email: "john@medcure.com",
        role: "pharmacist",
      },
      {
        id: "3",
        name: "Jane Employee",
        email: "jane@medcure.com",
        role: "employee",
      },
      {
        id: "4",
        name: "Maria Garcia",
        email: "maria@medcure.com",
        role: "cashier",
      },
      {
        id: "5",
        name: "Robert Chen",
        email: "robert@medcure.com",
        role: "pharmacist",
      },
    ];

    // Shuffle activity pool for randomness
    const shuffled = [...activityPool].sort(() => Math.random() - 0.5);

    let lastActivity = null;
    let consecutiveCount = 0;

    for (let i = 0; i < limit; i++) {
      let activityType = shuffled[i % shuffled.length];

      // Prevent more than 2 consecutive identical activities (anti-spam)
      if (activityType === lastActivity) {
        consecutiveCount++;
        if (consecutiveCount >= 2) {
          // Force a different activity type
          const alternativeIndex = (i + 7) % shuffled.length;
          activityType = shuffled[alternativeIndex];
          consecutiveCount = 0;
        }
      } else {
        consecutiveCount = 0;
      }

      lastActivity = activityType;

      const user = mockUsers[Math.floor(Math.random() * mockUsers.length)];

      // More realistic time distribution
      const hourOffset = Math.floor(Math.random() * 168); // Last 7 days
      const minuteOffset = Math.floor(Math.random() * 60);
      const date = new Date(
        now.getTime() - (hourOffset * 60 * 60 * 1000 + minuteOffset * 60 * 1000)
      );

      activities.push({
        id: `activity_${i + 1}`,
        user_id: user.id,
        activity_type: activityType,
        description: this.formatActivityDescription(activityType),
        ip_address: `192.168.${Math.floor(Math.random() * 3)}.${Math.floor(
          Math.random() * 255
        )}`,
        user_agent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        created_at: date.toISOString(),
        metadata: {
          success:
            activityType === "LOGIN_ATTEMPT"
              ? Math.random() > 0.3
              : Math.random() > 0.05,
          details: "System generated activity",
        },
        user_name: user.name,
        user_email: user.email,
        user_role: user.role,
      });
    }

    return activities.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
  }

  // Note: Real-time session tracking requires a dedicated sessions table and
  // proper session management infrastructure. The previous mock implementation
  // was removed as it showed all users who ever logged in, not actual active sessions.

  // Reset user password
  static async resetUserPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      return {
        success: true,
        message: "Password reset email sent successfully",
      };
    } catch (error) {
      console.error("Error resetting password:", error);
      throw error;
    }
  }

  // Note: Real session management removed. To implement proper session tracking,
  // create a sessions table with login/logout tracking and real-time updates.
}
