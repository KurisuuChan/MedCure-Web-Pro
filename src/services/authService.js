import { AuthService } from "./dataService";

export const authService = {
  // Sign in with email and password
  signIn: async (email, password) => {
    return await AuthService.signIn(email, password);
  },

  // Sign out
  signOut: async () => {
    localStorage.removeItem("medcure-current-user");
    return await AuthService.signOut();
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
