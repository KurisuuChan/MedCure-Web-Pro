import { AuthService } from "./domains/auth/authService";
import { LoginTrackingService } from "./domains/auth/loginTrackingService";

export const authService = {
  // Sign in with email and password
  signIn: async (email, password) => {
    try {
      const result = await AuthService.signIn(email, password);

      // If login successful, update last login timestamp
      if (result && result.user) {
        console.log(
          "🔍 [AuthService] Login successful, updating last login for user:",
          result.user
        );

        // Use the user ID from our custom users table, not auth.users
        const userId = result.user.id || result.user.user_id;
        if (userId) {
          const trackingResult = await LoginTrackingService.updateLastLogin(
            userId
          );
          console.log(
            "📊 [AuthService] Login tracking result:",
            trackingResult
          );
        } else {
          console.warn("⚠️ [AuthService] No user ID found for login tracking");
        }
      }

      return result;
    } catch (error) {
      console.error("❌ [AuthService] Sign in failed:", error);
      // 🎯 FIX: Don't return error object, throw it so the UI can catch and display it
      throw error;
    }
  }, // Sign out
  signOut: async () => {
    try {
      // Get current user before signing out to track logout
      const currentUser = localStorage.getItem("medcure-current-user");
      if (currentUser) {
        const user = JSON.parse(currentUser);
        await LoginTrackingService.trackLogout(user.id);
      }

      localStorage.removeItem("medcure-current-user");
      return await AuthService.signOut();
    } catch (error) {
      console.error("❌ [AuthService] Sign out failed:", error);
      localStorage.removeItem("medcure-current-user"); // Still remove local storage
      return { success: false, error: error.message };
    }
  },

  // Get current user
  getCurrentUser: async () => {
    return await AuthService.getCurrentUser();
  },

  // Get current session
  getSession: async () => {
    return await AuthService.getSession();
  },

  // Get user profile with role
  getUserProfile: async (userId) => {
    return await AuthService.getUserProfile(userId);
  },

  // Refresh session
  refreshSession: async () => {
    return await AuthService.refreshSession();
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const user = localStorage.getItem("medcure-current-user");
    return !!user;
  },

  // Get user permissions
  getUserPermissions: (user) => {
    return user?.permissions || [];
  },

  // Check specific permission
  hasPermission: (user, permission) => {
    return user?.permissions?.includes(permission) || false;
  },
};
