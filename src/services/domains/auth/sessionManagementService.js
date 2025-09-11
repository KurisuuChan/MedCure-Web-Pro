/**
 * Enhanced Session Management Service
 * Handles user sessions, authentication, security monitoring, and session controls
 */

import { supabase, isProductionSupabase } from "../../../config/supabase";

export class SessionManagementService {
  static SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
  static ACTIVITY_CHECK_INTERVAL = 60 * 1000; // Check every minute
  static MAX_LOGIN_ATTEMPTS = 5;
  static LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes lockout

  // Session storage keys
  static STORAGE_KEYS = {
    SESSION_TOKEN: "medcure_session_token",
    LAST_ACTIVITY: "medcure_last_activity",
    SESSION_DATA: "medcure_session_data",
    LOGIN_ATTEMPTS: "medcure_login_attempts",
    LOCKOUT_TIME: "medcure_lockout_time",
  };

  // Session management state
  static sessionData = null;
  static activityTimer = null;
  static sessionWarningTimer = null;
  static callbacks = {
    onSessionExpired: null,
    onSessionWarning: null,
    onActivityDetected: null,
  };

  /**
   * Initialize session management
   */
  static initialize() {
    console.log("🔐 [SessionManager] Initializing session management...");

    // Check for existing session
    this.loadStoredSession();

    // Set up activity monitoring
    this.startActivityMonitoring();

    // Set up automatic session validation
    this.startSessionValidation();

    console.log("✅ [SessionManager] Session management initialized");
  }

  /**
   * Create new user session
   */
  static async createSession(user, loginData = {}) {
    try {
      console.log(
        "🔐 [SessionManager] Creating new session for user:",
        user.email
      );

      const sessionId = this.generateSessionId();
      const currentTime = new Date().toISOString();

      const sessionData = {
        sessionId,
        userId: user.id,
        userEmail: user.email,
        userRole: user.role || "cashier",
        firstName: user.first_name,
        lastName: user.last_name,
        permissions: user.permissions || [],
        loginTime: currentTime,
        lastActivity: currentTime,
        ipAddress: await this.getClientIP(),
        userAgent: navigator.userAgent,
        loginMethod: loginData.method || "password",
        isActive: true,
      };

      // Store session data
      this.sessionData = sessionData;
      this.storeSession(sessionData);

      // Log session creation
      await this.logSessionActivity("session_created", {
        sessionId,
        userId: user.id,
        ipAddress: sessionData.ipAddress,
        userAgent: sessionData.userAgent,
      });

      // Update user's last login
      await this.updateUserLastLogin(user.id);

      // Clear any previous login attempts
      this.clearLoginAttempts();

      // Start session monitoring
      this.startSessionTimer();

      console.log(
        "✅ [SessionManager] Session created successfully:",
        sessionId
      );
      return sessionData;
    } catch (error) {
      console.error("❌ [SessionManager] Error creating session:", error);
      throw error;
    }
  }

  /**
   * Validate current session
   */
  static async validateSession() {
    try {
      if (!this.sessionData) {
        throw new Error("No active session found");
      }

      const currentTime = Date.now();
      const lastActivity = new Date(this.sessionData.lastActivity).getTime();
      const timeSinceActivity = currentTime - lastActivity;

      // Check if session has expired
      if (timeSinceActivity > this.SESSION_TIMEOUT) {
        await this.expireSession("timeout");
        return false;
      }

      // Validate with backend if needed
      if (isProductionSupabase) {
        const { data: user, error } = await supabase.auth.getUser();
        if (error || !user) {
          await this.expireSession("invalid_token");
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error("❌ [SessionManager] Session validation failed:", error);
      await this.expireSession("validation_error");
      return false;
    }
  }

  /**
   * Update session activity
   */
  static async updateActivity() {
    if (!this.sessionData) return;

    const currentTime = new Date().toISOString();
    this.sessionData.lastActivity = currentTime;

    // Update stored session
    this.storeSession(this.sessionData);

    // Reset session timer
    this.startSessionTimer();

    // Trigger activity callback
    if (this.callbacks.onActivityDetected) {
      this.callbacks.onActivityDetected(currentTime);
    }
  }

  /**
   * End current session
   */
  static async endSession(reason = "user_logout") {
    try {
      if (!this.sessionData) return;

      console.log("🔐 [SessionManager] Ending session:", reason);

      // Log session end
      await this.logSessionActivity("session_ended", {
        sessionId: this.sessionData.sessionId,
        userId: this.sessionData.userId,
        reason,
        duration: Date.now() - new Date(this.sessionData.loginTime).getTime(),
      });

      // Clear session data
      this.clearSession();

      // Sign out from Supabase
      if (isProductionSupabase) {
        await supabase.auth.signOut();
      }

      console.log("✅ [SessionManager] Session ended successfully");
    } catch (error) {
      console.error("❌ [SessionManager] Error ending session:", error);
      // Force clear session even if logging fails
      this.clearSession();
    }
  }

  /**
   * Handle session expiration
   */
  static async expireSession(reason = "timeout") {
    console.log("⏰ [SessionManager] Session expired:", reason);

    await this.logSessionActivity("session_expired", {
      sessionId: this.sessionData?.sessionId,
      userId: this.sessionData?.userId,
      reason,
    });

    this.clearSession();

    // Trigger expiration callback
    if (this.callbacks.onSessionExpired) {
      this.callbacks.onSessionExpired(reason);
    }
  }

  /**
   * Get current session data
   */
  static getCurrentSession() {
    return this.sessionData;
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated() {
    return this.sessionData && this.sessionData.isActive;
  }

  /**
   * Get user permissions from session
   */
  static getUserPermissions() {
    return this.sessionData?.permissions || [];
  }

  /**
   * Check if user has specific permission
   */
  static hasPermission(permission) {
    const permissions = this.getUserPermissions();
    return permissions.includes(permission);
  }

  /**
   * Get user role from session
   */
  static getUserRole() {
    return this.sessionData?.userRole || "guest";
  }

  /**
   * Handle login attempts and lockouts
   */
  static handleLoginAttempt(email, success) {
    const attemptKey = `${this.STORAGE_KEYS.LOGIN_ATTEMPTS}_${email}`;
    const lockoutKey = `${this.STORAGE_KEYS.LOCKOUT_TIME}_${email}`;

    if (success) {
      // Clear attempts on successful login
      localStorage.removeItem(attemptKey);
      localStorage.removeItem(lockoutKey);
      return { allowed: true };
    }

    // Check if user is currently locked out
    const lockoutTime = localStorage.getItem(lockoutKey);
    if (lockoutTime && Date.now() < parseInt(lockoutTime)) {
      const remainingTime = Math.ceil(
        (parseInt(lockoutTime) - Date.now()) / 1000 / 60
      );
      return {
        allowed: false,
        reason: "locked_out",
        remainingMinutes: remainingTime,
      };
    }

    // Increment failed attempts
    const attempts = parseInt(localStorage.getItem(attemptKey) || "0") + 1;
    localStorage.setItem(attemptKey, attempts.toString());

    if (attempts >= this.MAX_LOGIN_ATTEMPTS) {
      // Lock out user
      const lockoutUntil = Date.now() + this.LOCKOUT_DURATION;
      localStorage.setItem(lockoutKey, lockoutUntil.toString());

      return {
        allowed: false,
        reason: "too_many_attempts",
        attemptsRemaining: 0,
        lockoutMinutes: Math.ceil(this.LOCKOUT_DURATION / 1000 / 60),
      };
    }

    return {
      allowed: true,
      attemptsRemaining: this.MAX_LOGIN_ATTEMPTS - attempts,
    };
  }

  /**
   * Get all active sessions (admin function)
   */
  static async getActiveSessions() {
    try {
      // In development mode, return mock data
      if (!isProductionSupabase) {
        return this.getMockActiveSessions();
      }

      // In production, this would query a sessions table
      // For now, return current session if active
      if (this.sessionData) {
        return [this.sessionData];
      }

      return [];
    } catch (error) {
      console.error(
        "❌ [SessionManager] Error fetching active sessions:",
        error
      );
      return [];
    }
  }

  /**
   * Force end user session (admin function)
   */
  static async forceEndSession(sessionId, adminUserId) {
    try {
      console.log(
        "🔐 [SessionManager] Admin forcing end of session:",
        sessionId
      );

      // Log admin action
      await this.logSessionActivity("session_force_ended", {
        sessionId,
        adminUserId,
        timestamp: new Date().toISOString(),
      });

      // If it's the current session, end it
      if (this.sessionData?.sessionId === sessionId) {
        await this.endSession("admin_terminated");
        return true;
      }

      // In production, this would terminate the session in the sessions table
      return true;
    } catch (error) {
      console.error("❌ [SessionManager] Error force ending session:", error);
      throw error;
    }
  }

  /**
   * Set session callbacks
   */
  static setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  // Private helper methods

  static generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static async getClientIP() {
    // In a real application, you'd get this from the server
    return "127.0.0.1"; // Mock IP for development
  }

  static storeSession(sessionData) {
    try {
      localStorage.setItem(
        this.STORAGE_KEYS.SESSION_DATA,
        JSON.stringify(sessionData)
      );
      localStorage.setItem(
        this.STORAGE_KEYS.LAST_ACTIVITY,
        sessionData.lastActivity
      );
    } catch (error) {
      console.error("❌ [SessionManager] Error storing session:", error);
    }
  }

  static loadStoredSession() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.SESSION_DATA);
      if (stored) {
        this.sessionData = JSON.parse(stored);
        console.log("🔐 [SessionManager] Loaded stored session");
      }
    } catch (error) {
      console.error("❌ [SessionManager] Error loading stored session:", error);
      this.clearSession();
    }
  }

  static clearSession() {
    this.sessionData = null;
    this.stopSessionTimer();

    // Clear stored data
    Object.values(this.STORAGE_KEYS).forEach((key) => {
      if (key.includes("login_attempts") || key.includes("lockout_time"))
        return;
      localStorage.removeItem(key);
    });
  }

  static clearLoginAttempts() {
    // Clear all login attempt related storage
    Object.keys(localStorage).forEach((key) => {
      if (key.includes("login_attempts") || key.includes("lockout_time")) {
        localStorage.removeItem(key);
      }
    });
  }

  static startSessionTimer() {
    this.stopSessionTimer();

    // Set warning timer (5 minutes before expiration)
    const warningTime = this.SESSION_TIMEOUT - 5 * 60 * 1000;
    this.sessionWarningTimer = setTimeout(() => {
      if (this.callbacks.onSessionWarning) {
        this.callbacks.onSessionWarning(5); // 5 minutes remaining
      }
    }, warningTime);

    // Set expiration timer
    this.activityTimer = setTimeout(() => {
      this.expireSession("timeout");
    }, this.SESSION_TIMEOUT);
  }

  static stopSessionTimer() {
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
      this.activityTimer = null;
    }
    if (this.sessionWarningTimer) {
      clearTimeout(this.sessionWarningTimer);
      this.sessionWarningTimer = null;
    }
  }

  static startActivityMonitoring() {
    // Monitor user activity
    [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ].forEach((event) => {
      document.addEventListener(
        event,
        () => {
          if (this.isAuthenticated()) {
            this.updateActivity();
          }
        },
        { passive: true }
      );
    });
  }

  static startSessionValidation() {
    // Validate session every 5 minutes
    setInterval(async () => {
      if (this.sessionData) {
        await this.validateSession();
      }
    }, 5 * 60 * 1000);
  }

  static async updateUserLastLogin(userId) {
    try {
      if (isProductionSupabase) {
        await supabase
          .from("users")
          .update({ last_login: new Date().toISOString() })
          .eq("id", userId);
      }
    } catch (error) {
      console.error("❌ [SessionManager] Error updating last login:", error);
    }
  }

  static async logSessionActivity(event, data) {
    try {
      console.log(`🔐 [SessionManager] ${event}:`, data);

      // In production, this would log to an audit table
      if (isProductionSupabase) {
        // await supabase.from('session_logs').insert({
        //   event,
        //   data,
        //   timestamp: new Date().toISOString()
        // });
      }
    } catch (error) {
      console.error(
        "❌ [SessionManager] Error logging session activity:",
        error
      );
    }
  }

  static getMockActiveSessions() {
    const mockSessions = [
      {
        sessionId: "session_1",
        userId: "1",
        userEmail: "admin@medcure.com",
        userRole: "admin",
        firstName: "Admin",
        lastName: "User",
        loginTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        lastActivity: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        ipAddress: "192.168.1.100",
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        isActive: true,
      },
      {
        sessionId: "session_2",
        userId: "2",
        userEmail: "cashier@medcure.com",
        userRole: "cashier",
        firstName: "Cashier",
        lastName: "User",
        loginTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        lastActivity: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        ipAddress: "192.168.1.101",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0",
        isActive: true,
      },
    ];

    // Add current session if active
    if (this.sessionData) {
      mockSessions.unshift(this.sessionData);
    }

    return mockSessions;
  }
}

export default SessionManagementService;
