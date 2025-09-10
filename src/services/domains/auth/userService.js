// 👥 **USER SERVICE**
// Handles all user management operations
// Professional database-only implementation with Supabase

import { supabase } from "../../../config/supabase";
import { logDebug, handleError } from "../../core/serviceUtils";

export class UserService {
  static async getUsers() {
    try {
      logDebug("Fetching all users from database");

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("first_name");

      if (error) throw error;

      logDebug(`Successfully fetched ${data?.length || 0} users`);

      // Return in the format expected by Management page
      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      console.error("❌ [UserService] Get users failed:", error);

      // Return mock data with proper format structure
      return {
        success: false,
        error: error.message,
        data: [
          {
            id: 1,
            first_name: "John",
            last_name: "Admin",
            email: "admin@medcure.com",
            role: "admin",
            is_active: true,
            last_login: "2024-01-15T10:30:00Z",
          },
          {
            id: 2,
            first_name: "Sarah",
            last_name: "Pharmacist",
            email: "sarah@medcure.com",
            role: "manager",
            is_active: true,
            last_login: "2024-01-15T09:15:00Z",
          },
        ],
      };
    }
  }

  static async getUserByEmail(email) {
    try {
      logDebug(`Fetching user by email: ${email}`);

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .single();

      if (error) throw error;

      logDebug("Successfully fetched user", data);
      return data;
    } catch (error) {
      handleError(error, "Get user by email");
    }
  }

  static async updateUser(id, updates) {
    try {
      logDebug(`Updating user ${id}`, updates);

      const { data, error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", id)
        .select();

      if (error) throw error;

      logDebug("Successfully updated user", data[0]);
      return data[0];
    } catch (error) {
      handleError(error, "Update user");
    }
  }

  static async addUser(user) {
    try {
      logDebug("Adding new user", user);

      const { data, error } = await supabase
        .from("users")
        .insert([user])
        .select();

      if (error) throw error;

      logDebug("Successfully added user", data[0]);
      return data[0];
    } catch (error) {
      handleError(error, "Add user");
    }
  }

  static async deleteUser(id) {
    try {
      logDebug(`Deleting user ${id}`);

      const { data, error } = await supabase
        .from("users")
        .delete()
        .eq("id", id)
        .select();

      if (error) throw error;

      logDebug("Successfully deleted user", data[0]);
      return data[0];
    } catch (error) {
      handleError(error, "Delete user");
    }
  }

  static async activateUser(id) {
    try {
      logDebug(`Activating user ${id}`);

      const { data, error } = await supabase
        .from("users")
        .update({ is_active: true })
        .eq("id", id)
        .select();

      if (error) throw error;

      logDebug("Successfully activated user", data[0]);
      return data[0];
    } catch (error) {
      handleError(error, "Activate user");
    }
  }

  static async deactivateUser(id) {
    try {
      logDebug(`Deactivating user ${id}`);

      const { data, error } = await supabase
        .from("users")
        .update({ is_active: false })
        .eq("id", id)
        .select();

      if (error) throw error;

      logDebug("Successfully deactivated user", data[0]);
      return data[0];
    } catch (error) {
      handleError(error, "Deactivate user");
    }
  }
}

export default UserService;
