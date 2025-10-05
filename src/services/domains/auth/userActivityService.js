import supabase from "../../../config/supabase.js";
import { notificationService } from "../../notificationService.js";

/**
 * User Activity Service
 * Tracks and manages user activities, login patterns, and security events
 */
export class UserActivityService {
  static ACTIVITY_TYPES = {
    LOGIN: "login",
    LOGOUT: "logout",
    LOGIN_FAILED: "login_failed",
    SESSION_TIMEOUT: "session_timeout",
    PASSWORD_CHANGE: "password_change",
    ROLE_CHANGE: "role_change",
    PERMISSIONS_MODIFIED: "permissions_modified",
    PROFILE_UPDATE: "profile_update",
    SECURITY_ALERT: "security_alert",
    ADMIN_ACTION: "admin_action",
    DATA_ACCESS: "data_access",
    TRANSACTION_CREATE: "transaction_create",
    TRANSACTION_MODIFY: "transaction_modify",
    INVENTORY_ACCESS: "inventory_access",
    REPORT_GENERATE: "report_generate",
  };

  static RISK_LEVELS = {
    LOW: "low",
    MEDIUM: "medium",
    HIGH: "high",
    CRITICAL: "critical",
  };

  /**
   * Log user activity
   */
  static async logActivity({
    userId,
    activityType,
    description,
    riskLevel = this.RISK_LEVELS.LOW,
    metadata = {},
    ipAddress = null,
    userAgent = null,
  }) {
    try {
      const activity = {
        user_id: userId,
        activity_type: activityType,
        description,
        risk_level: riskLevel,
        metadata: JSON.stringify(metadata),
        ip_address: ipAddress || (await this.getClientIP()),
        user_agent: userAgent || this.getUserAgent(),
        timestamp: new Date().toISOString(),
      };

      // Store in database
      const { data, error } = await supabase
        .from("user_activities")
        .insert([activity])
        .select()
        .single();

      if (error) {
        console.error("Error logging activity:", error);
        // Store locally as fallback
        this.storeActivityLocally(activity);
        return null;
      }

      // Check for security alerts
      await this.checkSecurityAlerts(userId, activityType, riskLevel);

      return data;
    } catch (error) {
      console.error("Error in logActivity:", error);
      return null;
    }
  }

  /**
   * Get user activity history
   */
  static async getUserActivities(userId, options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        activityTypes = [],
        riskLevels = [],
        startDate = null,
        endDate = null,
      } = options;

      let query = supabase
        .from("user_activities")
        .select("*")
        .eq("user_id", userId)
        .order("timestamp", { ascending: false });

      if (activityTypes.length > 0) {
        query = query.in("activity_type", activityTypes);
      }

      if (riskLevels.length > 0) {
        query = query.in("risk_level", riskLevels);
      }

      if (startDate) {
        query = query.gte("timestamp", startDate);
      }

      if (endDate) {
        query = query.lte("timestamp", endDate);
      }

      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching user activities:", error);
        return this.getMockUserActivities(userId);
      }

      return data || [];
    } catch (error) {
      console.error("Error in getUserActivities:", error);
      return this.getMockUserActivities(userId);
    }
  }

  /**
   * Get activity statistics for a user
   */
  static async getUserActivityStats(userId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from("user_activities")
        .select("activity_type, risk_level, timestamp")
        .eq("user_id", userId)
        .gte("timestamp", startDate.toISOString());

      if (error) {
        console.error("Error fetching activity stats:", error);
        return this.getMockActivityStats();
      }

      return this.calculateActivityStats(data || []);
    } catch (error) {
      console.error("Error in getUserActivityStats:", error);
      return this.getMockActivityStats();
    }
  }

  /**
   * Get security alerts for admin dashboard
   */
  static async getSecurityAlerts(options = {}) {
    try {
      const {
        limit = 20,
        riskLevels = [this.RISK_LEVELS.HIGH, this.RISK_LEVELS.CRITICAL],
        resolved = false,
      } = options;

      const { data, error } = await supabase
        .from("security_alerts")
        .select(
          `
          *,
          user:users(id, username, email, role)
        `
        )
        .in("risk_level", riskLevels)
        .eq("resolved", resolved)
        .order("timestamp", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching security alerts:", error);
        return this.getMockSecurityAlerts();
      }

      return data || [];
    } catch (error) {
      console.error("Error in getSecurityAlerts:", error);
      return this.getMockSecurityAlerts();
    }
  }

  /**
   * Check for suspicious activities and create alerts
   */
  static async checkSecurityAlerts(userId, activityType, riskLevel) {
    try {
      // Check for multiple failed login attempts
      if (activityType === this.ACTIVITY_TYPES.LOGIN_FAILED) {
        await this.checkFailedLoginAlerts(userId);
      }

      // Check for unusual access patterns
      if (
        riskLevel === this.RISK_LEVELS.HIGH ||
        riskLevel === this.RISK_LEVELS.CRITICAL
      ) {
        await this.createSecurityAlert(userId, activityType, riskLevel);
      }

      // Check for off-hours access
      await this.checkOffHoursAccess(userId, activityType);
    } catch (error) {
      console.error("Error checking security alerts:", error);
    }
  }

  /**
   * Create a security alert
   */
  static async createSecurityAlert(
    userId,
    activityType,
    riskLevel,
    description = ""
  ) {
    try {
      const alert = {
        user_id: userId,
        alert_type: activityType,
        risk_level: riskLevel,
        description: description || `${activityType} activity detected`,
        timestamp: new Date().toISOString(),
        resolved: false,
        metadata: JSON.stringify({
          activity_type: activityType,
          detected_at: new Date().toISOString(),
        }),
      };

      const { data, error } = await supabase
        .from("security_alerts")
        .insert([alert])
        .select()
        .single();

      if (error) {
        console.error("Error creating security alert:", error);
        return null;
      }

      // Notify administrators
      if (riskLevel === this.RISK_LEVELS.CRITICAL) {
        await this.notifyAdministrators(alert);
      }

      return data;
    } catch (error) {
      console.error("Error in createSecurityAlert:", error);
      return null;
    }
  }

  /**
   * Check for failed login alerts
   */
  static async checkFailedLoginAlerts(userId) {
    try {
      const thirtyMinutesAgo = new Date();
      thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30);

      const { data, error } = await supabase
        .from("user_activities")
        .select("id")
        .eq("user_id", userId)
        .eq("activity_type", this.ACTIVITY_TYPES.LOGIN_FAILED)
        .gte("timestamp", thirtyMinutesAgo.toISOString());

      if (error) {
        console.error("Error checking failed login alerts:", error);
        return;
      }

      const failedAttempts = data?.length || 0;

      if (failedAttempts >= 3) {
        await this.createSecurityAlert(
          userId,
          "multiple_failed_logins",
          this.RISK_LEVELS.HIGH,
          `${failedAttempts} failed login attempts in the last 30 minutes`
        );
      }
    } catch (error) {
      console.error("Error in checkFailedLoginAlerts:", error);
    }
  }

  /**
   * Check for off-hours access
   */
  static async checkOffHoursAccess(userId, activityType) {
    try {
      const now = new Date();
      const hour = now.getHours();

      // Define business hours (8 AM to 8 PM)
      const isOffHours = hour < 8 || hour > 20;

      if (isOffHours && activityType === this.ACTIVITY_TYPES.LOGIN) {
        await this.createSecurityAlert(
          userId,
          "off_hours_access",
          this.RISK_LEVELS.MEDIUM,
          `Login attempt outside business hours at ${now.toLocaleTimeString()}`
        );
      }
    } catch (error) {
      console.error("Error in checkOffHoursAccess:", error);
    }
  }

  /**
   * Notify administrators of critical alerts
   */
  static async notifyAdministrators(alert) {
    try {
      // Get admin users
      const { data: admins } = await supabase
        .from("users")
        .select("id")
        .in("role", ["SUPER_ADMIN", "ADMIN"])
        .eq("is_active", true);

      if (!admins || admins.length === 0) {
        console.warn("⚠️ No admin users found to notify");
        return;
      }

      // Create notification for each admin
      for (const admin of admins) {
        await notificationService.create({
          userId: admin.id,
          title: "Critical Security Alert",
          message: alert.description,
          type: "error",
          priority: 1, // CRITICAL
          category: "system",
          metadata: {
            alertId: alert.id,
            userId: alert.user_id,
            riskLevel: alert.risk_level,
          },
        });
      }
    } catch (error) {
      console.error("Error notifying administrators:", error);
    }
  }

  /**
   * Store activity locally as fallback
   */
  static storeActivityLocally(activity) {
    try {
      const activities = JSON.parse(
        localStorage.getItem("offline_activities") || "[]"
      );
      activities.push(activity);

      // Keep only last 100 activities
      if (activities.length > 100) {
        activities.splice(0, activities.length - 100);
      }

      localStorage.setItem("offline_activities", JSON.stringify(activities));
    } catch (error) {
      console.error("Error storing activity locally:", error);
    }
  }

  /**
   * Calculate activity statistics
   */
  static calculateActivityStats(activities) {
    const stats = {
      totalActivities: activities.length,
      activityTypes: {},
      riskLevels: {},
      hourlyPattern: new Array(24).fill(0),
      dailyPattern: {},
    };

    activities.forEach((activity) => {
      // Count by activity type
      stats.activityTypes[activity.activity_type] =
        (stats.activityTypes[activity.activity_type] || 0) + 1;

      // Count by risk level
      stats.riskLevels[activity.risk_level] =
        (stats.riskLevels[activity.risk_level] || 0) + 1;

      // Hourly pattern
      const hour = new Date(activity.timestamp).getHours();
      stats.hourlyPattern[hour]++;

      // Daily pattern
      const date = new Date(activity.timestamp).toDateString();
      stats.dailyPattern[date] = (stats.dailyPattern[date] || 0) + 1;
    });

    return stats;
  }

  /**
   * Get client IP address
   */
  static async getClientIP() {
    return "127.0.0.1"; // Mock IP for development
  }

  /**
   * Get user agent
   */
  static getUserAgent() {
    return navigator.userAgent || "Unknown";
  }

  /**
   * Mock data for development
   */
  static getMockUserActivities(userId) {
    return [
      {
        id: 1,
        user_id: userId,
        activity_type: "login",
        description: "User logged in successfully",
        risk_level: "low",
        timestamp: new Date().toISOString(),
        ip_address: "127.0.0.1",
        user_agent: "Mozilla/5.0...",
      },
      {
        id: 2,
        user_id: userId,
        activity_type: "transaction_create",
        description: "Created new transaction #12345",
        risk_level: "low",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        ip_address: "127.0.0.1",
        user_agent: "Mozilla/5.0...",
      },
    ];
  }

  static getMockActivityStats() {
    return {
      totalActivities: 25,
      activityTypes: {
        login: 8,
        logout: 7,
        transaction_create: 5,
        inventory_access: 3,
        report_generate: 2,
      },
      riskLevels: {
        low: 20,
        medium: 3,
        high: 2,
        critical: 0,
      },
      hourlyPattern: new Array(24)
        .fill(0)
        .map((_, i) => (i >= 8 && i <= 18 ? Math.floor(Math.random() * 5) : 0)),
      dailyPattern: {},
    };
  }

  static getMockSecurityAlerts() {
    return [
      {
        id: 1,
        user_id: "user1",
        alert_type: "multiple_failed_logins",
        risk_level: "high",
        description: "5 failed login attempts in the last 30 minutes",
        timestamp: new Date().toISOString(),
        resolved: false,
        user: {
          id: "user1",
          username: "john_doe",
          email: "john@example.com",
          role: "PHARMACIST",
        },
      },
    ];
  }
}

export default UserActivityService;
