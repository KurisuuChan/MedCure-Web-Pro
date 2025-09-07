import React, { useEffect, useState, useMemo } from "react";
import PropTypes from "prop-types";
import { AuthContext } from "../contexts/AuthContext";
import { authService } from "../services/authService";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

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
      }

      return { data: result, error: null };
    } catch (error) {
      return { data: null, error: { message: error.message } };
    }
  };

  const signOut = async () => {
    try {
      await authService.signOut();
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
