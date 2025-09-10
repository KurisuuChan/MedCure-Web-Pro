import { supabase } from "\.\.\/\.\.\/\.\.\/config\/supabase";

/**
 * Login Tracking Service
 * Handles user login monitoring, session tracking, and activity logging
 */
export class LoginTrackingService {
  /**
   * Update user's last login timestamp
   */
  static async updateLastLogin(userId) {
    try {
      const loginTime = new Date().toISOString();

      console.log(
        `🔍 [LoginTracking] Attempting to update last login for user ID: ${userId}`
      );

      // Update last_login in users table
      const { data, error } = await supabase
        .from("users")
        .update({
          last_login: loginTime,
          updated_at: loginTime,
        })
        .eq("id", userId)
        .select(); // Return the updated data

      if (error) {
        console.error("❌ [LoginTracking] Supabase error:", error);
        // If database update fails, update localStorage as fallback
        this.updateLocalStorageLastLogin(userId, loginTime);
        throw error;
      }

      console.log(`✅ [LoginTracking] Successfully updated last login:`, data);

      // Log login activity
      await this.logLoginActivity(userId, "login", {
        timestamp: loginTime,
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent,
      });

      // Also update localStorage for immediate UI update
      this.updateLocalStorageLastLogin(userId, loginTime);

      return { success: true, timestamp: loginTime, data };
    } catch (error) {
      console.error("❌ [LoginTracking] Failed to update last login:", error);

      // Fallback: update localStorage for immediate UI feedback
      const loginTime = new Date().toISOString();
      this.updateLocalStorageLastLogin(userId, loginTime);

      return { success: false, error: error.message, timestamp: loginTime };
    }
  }

  /**
   * Update last login in localStorage as fallback
   */
  static updateLocalStorageLastLogin(userId, loginTime) {
    try {
      const currentUser = localStorage.getItem("medcure-current-user");
      if (currentUser) {
        const user = JSON.parse(currentUser);
        if (user.id === userId || user.user_id === userId) {
          user.last_login = loginTime;
          localStorage.setItem("medcure-current-user", JSON.stringify(user));
          console.log(
            `✅ [LoginTracking] Updated localStorage last login for user ${userId}`
          );
        }
      }
    } catch (error) {
      console.error("❌ [LoginTracking] Failed to update localStorage:", error);
    }
  }

  /**
   * Log login activity to audit trail
   */
  static async logLoginActivity(userId, action, metadata = {}) {
    try {
      const { error } = await supabase.from("user_activity_logs").insert({
        user_id: userId,
        action_type: action,
        metadata: metadata,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("❌ [LoginTracking] Failed to log activity:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user's login history
   */
  static async getLoginHistory(userId, limit = 10) {
    try {
      const { data, error } = await supabase
        .from("user_activity_logs")
        .select("*")
        .eq("user_id", userId)
        .in("action_type", ["login", "logout"])
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      console.error("❌ [LoginTracking] Failed to get login history:", error);
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }

  /**
   * Get all active sessions
   */
  static async getActiveSessions() {
    try {
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

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      console.error("❌ [LoginTracking] Failed to get active sessions:", error);
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }

  /**
   * Get login statistics
   */
  static async getLoginStats(timeframe = "week") {
    try {
      let startDate;
      const now = new Date();

      switch (timeframe) {
        case "day":
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      const { data, error } = await supabase
        .from("user_activity_logs")
        .select("user_id, created_at, metadata")
        .eq("action_type", "login")
        .gte("created_at", startDate.toISOString());

      if (error) throw error;

      // Calculate statistics
      const totalLogins = data?.length || 0;
      const uniqueUsers = new Set(data?.map((log) => log.user_id)).size;
      const avgLoginsPerDay =
        totalLogins / Math.ceil((now - startDate) / (24 * 60 * 60 * 1000));

      return {
        success: true,
        data: {
          totalLogins,
          uniqueUsers,
          avgLoginsPerDay: Math.round(avgLoginsPerDay * 100) / 100,
          timeframe,
          startDate: startDate.toISOString(),
          endDate: now.toISOString(),
        },
      };
    } catch (error) {
      console.error("❌ [LoginTracking] Failed to get login stats:", error);
      return {
        success: false,
        error: error.message,
        data: {
          totalLogins: 0,
          uniqueUsers: 0,
          avgLoginsPerDay: 0,
          timeframe,
        },
      };
    }
  }

  /**
   * Get currently online users (active in last 15 minutes)
   */
  static async getOnlineUsers() {
    try {
      const cutoffTime = new Date(Date.now() - 15 * 60 * 1000).toISOString(); // 15 minutes ago

      const { data, error } = await supabase
        .from("users")
        .select(
          `
          id,
          first_name,
          last_name,
          email,
          role,
          last_login
        `
        )
        .gte("last_login", cutoffTime)
        .eq("is_active", true)
        .order("last_login", { ascending: false });

      if (error) throw error;

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      console.error("❌ [LoginTracking] Failed to get online users:", error);
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }

  /**
   * Track user logout
   */
  static async trackLogout(userId) {
    try {
      await this.logLoginActivity(userId, "logout", {
        timestamp: new Date().toISOString(),
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent,
      });

      console.log(`✅ [LoginTracking] Logged logout for user ${userId}`);
      return { success: true };
    } catch (error) {
      console.error("❌ [LoginTracking] Failed to track logout:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get client IP address (for tracking purposes)
   */
  static async getClientIP() {
    try {
      // This would typically be handled by your backend
      // For client-side, we can use a service or just return a placeholder
      return "client-side"; // Replace with actual IP detection if needed
    } catch (error) {
      return "unknown";
    }
  }

  /**
   * Format last login time for display
   */
  static formatLastLogin(lastLogin) {
    if (!lastLogin) return "Never";

    const loginTime = new Date(lastLogin);
    const now = new Date();
    const diffInMinutes = Math.floor((now - loginTime) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;

    return loginTime.toLocaleDateString();
  }

  /**
   * Check if user is currently online
   */
  static isUserOnline(lastLogin) {
    if (!lastLogin) return false;

    const loginTime = new Date(lastLogin);
    const now = new Date();
    const diffInMinutes = (now - loginTime) / (1000 * 60);

    return diffInMinutes <= 15; // Consider online if active within 15 minutes
  }
}
