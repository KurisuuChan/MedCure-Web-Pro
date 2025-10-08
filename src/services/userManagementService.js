import { supabase } from "../config/supabase";

export class UserManagementService {
  // User role constants
  static ROLES = {
    ADMIN: "admin",
    PHARMACIST: "pharmacist",
    EMPLOYEE: "employee",
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
    [this.ROLES.EMPLOYEE]: [
      this.PERMISSIONS.VIEW_INVENTORY,
      this.PERMISSIONS.PROCESS_SALES,
      this.PERMISSIONS.VIEW_CUSTOMERS,
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
        permissions: this.getUserPermissions(user.role || this.ROLES.EMPLOYEE),
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
        permissions: this.getUserPermissions(data.role || this.ROLES.EMPLOYEE),
      };
    } catch (error) {
      console.error("Error fetching user:", error);
      throw error;
    }
  }

  // Create new user
  static async createUser(userData) {
    console.log("🔧 [UserManagement] Creating user with data:", {
      ...userData,
      password: "***",
    });

    try {
      const {
        email,
        password,
        firstName,
        lastName,
        phone,
        role = this.ROLES.EMPLOYEE,
      } = userData;

      // Validate password requirements
      if (!password || password.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }

      // Check if user already exists in the database
      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("id, email, is_active")
        .eq("email", email)
        .maybeSingle();

      if (checkError) {
        console.error(
          "❌ [UserManagement] Error checking existing user:",
          checkError
        );
        throw new Error(`Database error: ${checkError.message}`);
      }

      if (existingUser) {
        throw new Error(`User with email ${email} already exists`);
      }

      console.log("📧 [UserManagement] Creating auth user for:", email);

      // Create auth user with email confirmation disabled for admin-created users
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone,
          },
          emailRedirectTo: undefined, // No email confirmation needed for admin-created users
        },
      });

      if (authError) {
        console.error("❌ [UserManagement] Auth signup error:", authError);

        // Handle specific error cases
        if (authError.message?.includes("already registered")) {
          throw new Error(
            `User with email ${email} already exists in authentication system`
          );
        } else if (authError.message?.includes("password")) {
          throw new Error(`Password error: ${authError.message}`);
        } else if (authError.status === 422) {
          throw new Error(
            `Invalid user data: ${
              authError.message ||
              "Please check email format and password requirements (min 6 characters)"
            }`
          );
        }

        throw new Error(`Authentication error: ${authError.message}`);
      }

      if (!authData?.user?.id) {
        throw new Error(
          "Failed to create authentication user - no user ID returned"
        );
      }

      console.log("✅ [UserManagement] Auth user created:", authData.user.id);

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

        // If database insert fails, we should try to clean up the auth user
        // Note: This requires admin privileges
        console.warn(
          "⚠️ [UserManagement] Database insert failed after auth creation. User may exist in auth but not in database."
        );

        throw new Error(`Failed to create user record: ${userError.message}`);
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
          userData.role || this.ROLES.EMPLOYEE
        ),
      };
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }

  // Delete/Deactivate user
  static async deleteUser(userId) {
    console.log("🗑️ User deletion process started:", userId);

    try {
      // Step 1: Validate input
      if (!userId) {
        throw new Error("User ID is required");
      }

      // Step 2: Check authentication
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error("Authentication required for user deletion");
      }

      console.log(`👤 Authenticated as: ${user.email}`);

      // Step 3: Get current user's permissions
      const { data: currentUser, error: currentUserError } = await supabase
        .from("users")
        .select("id, email, role, is_active, first_name, last_name")
        .eq("email", user.email)
        .single();

      if (currentUserError) {
        console.error("❌ Current user lookup failed:", currentUserError);
        throw new Error(
          `Current user not found in database: ${currentUserError.message}`
        );
      }

      if (!currentUser.is_active) {
        throw new Error("Current user account is inactive");
      }

      // Step 4: Check permissions
      // Assumption: only 'admin' role can perform user deletions in the current RBAC
      const adminRoles = ["admin"];
      if (!adminRoles.includes(currentUser.role)) {
        throw new Error(
          `Insufficient permissions. Required: admin, Current: ${currentUser.role}`
        );
      }

      console.log(`✅ Permission check passed: ${currentUser.role}`);

      // Step 5: Get target user
      const { data: targetUser, error: targetError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (targetError) {
        console.error("❌ Target user lookup failed:", targetError);

        if (targetError.code === "PGRST116") {
          throw new Error("User not found");
        } else {
          throw new Error(`Database error: ${targetError.message}`);
        }
      }

      console.log(
        `🎯 Target user found: ${targetUser.email} (${targetUser.role})`
      );

      // Step 6: Business logic validations
      if (targetUser.id === currentUser.id) {
        throw new Error("Cannot delete your own account");
      }

      if (!targetUser.is_active) {
        throw new Error("User is already inactive");
      }

      // Step 7: Role hierarchy check
      // Assumption: Deleting users with role 'admin' is not allowed via this UI/API
      if (targetUser.role === "admin") {
        throw new Error('Deleting users with role "admin" is not permitted');
      }

      // Step 8: Perform the deletion
      console.log("🔄 Performing user deletion...");

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
        console.error("❌ Database deletion failed:", error);

        // Provide specific error messages based on error codes
        if (
          error.code === "RLS_VIOLATION" ||
          error.message.includes("permission")
        ) {
          throw new Error(
            "Permission denied. Check Row Level Security policies."
          );
        } else if (error.code === "FOREIGN_KEY_VIOLATION") {
          throw new Error("Cannot delete user: related records exist.");
        } else {
          throw new Error(`Database error: ${error.message}`);
        }
      }

      console.log("✅ User successfully deactivated:", data.email);
      return data;
    } catch (error) {
      console.error("❌ Error deleting user:", error);
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
      [this.ROLES.EMPLOYEE]: 1,
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
}

// Default export for compatibility
export default UserManagementService;
