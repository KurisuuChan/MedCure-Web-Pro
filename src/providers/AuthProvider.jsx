import React, { useEffect, useState, useMemo } from "react";
import PropTypes from "prop-types";
import { AuthContext } from "../contexts/AuthContext";
import { authService } from "../services/authService";
import { LoginTrackingService } from "../services/domains/auth/loginTrackingService";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  // 🔄 Activity heartbeat - Update last_login every 2 minutes to show online status
  useEffect(() => {
    if (!user) return;

    const updateActivity = async () => {
      try {
        await LoginTrackingService.updateLastLogin(user.id);
        console.log("🔄 [AuthProvider] Activity heartbeat updated");
      } catch (error) {
        console.error("⚠️ [AuthProvider] Activity heartbeat failed:", error);
      }
    };

    // Update immediately
    updateActivity();

    // Then update every 2 minutes (120000ms)
    const intervalId = setInterval(updateActivity, 2 * 60 * 1000);

    // Cleanup on unmount or user change
    return () => clearInterval(intervalId);
  }, [user]);

  const initializeAuth = async () => {
    try {
      // Check if user is already authenticated
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setRole(currentUser.role);
        setSession({ user: currentUser, access_token: "mock-token" });
      }
    } catch (error) {
      console.error("Error initializing auth:", error);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const signIn = async (email, password) => {
    try {
      const result = await authService.signIn(email, password);

      if (result.user) {
        setUser(result.user);
        setRole(result.user.role);
        setSession(
          result.session || { user: result.user, access_token: "mock-token" }
        );

        // Store user in localStorage for persistence
        localStorage.setItem(
          "medcure-current-user",
          JSON.stringify(result.user)
        );

        // 🔧 Track login activity and update last_login timestamp
        try {
          await LoginTrackingService.updateLastLogin(result.user.id);
          console.log(
            "✅ [AuthProvider] Login tracked successfully for user:",
            result.user.email
          );
        } catch (trackingError) {
          console.error(
            "⚠️ [AuthProvider] Failed to track login (non-fatal):",
            trackingError
          );
          // Don't fail login if tracking fails - this is a non-critical error
        }
      }

      return { data: result, error: null };
    } catch (error) {
      // 🎯 FIX: Don't swallow the error, let useAuthForm handle it properly
      console.error("❌ [AuthProvider] Sign in failed:", error);
      throw error; // Re-throw the error so useAuthForm can catch and display it
    }
  };

  const signOut = async () => {
    try {
      await authService.signOut();

      // No need to manually clear notification data -
      // sessionStorage is automatically cleared on logout/browser close

      setSession(null);
      setUser(null);
      setRole(null);
      return { error: null };
    } catch (error) {
      return { error: { message: error.message } };
    }
  };

  const value = useMemo(
    () => ({
      session,
      user,
      role,
      isLoadingAuth,
      signIn,
      signOut,
    }),
    [session, user, role, isLoadingAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
