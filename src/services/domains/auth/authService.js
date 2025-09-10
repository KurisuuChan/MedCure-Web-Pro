// 🔐 **AUTH SERVICE**
// Handles authentication operations
// Professional database-only implementation with Supabase

import { supabase } from "../../../config/supabase";
import { logDebug, handleError } from "../../core/serviceUtils";
import UserService from "./userService";

export class AuthService {
  static async signIn(email, password) {
    try {
      logDebug(`Attempting sign in for email: ${email}`);

      // Supabase authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Get user profile data
      const userProfile = await UserService.getUserByEmail(email);

      const authData = {
        ...data,
        user: userProfile,
      };

      logDebug("Successfully signed in user", authData);
      return authData;
    } catch (error) {
      handleError(error, "Sign in");
    }
  }

  static async signOut() {
    try {
      logDebug("Attempting sign out");

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      logDebug("Successfully signed out");
      return { success: true };
    } catch (error) {
      handleError(error, "Sign out");
    }
  }

  static async getCurrentUser() {
    try {
      logDebug("Fetching current user");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const userProfile = await UserService.getUserByEmail(user.email);
        logDebug("Successfully fetched current user", userProfile);
        return userProfile;
      }

      logDebug("No current user found");
      return null;
    } catch (error) {
      handleError(error, "Get current user");
    }
  }

  static async signUp(email, password, userData) {
    try {
      logDebug(`Attempting sign up for email: ${email}`);

      // Supabase authentication signup
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      // Create user profile if signup successful
      if (data.user) {
        const userProfile = await UserService.addUser({
          email,
          ...userData,
          auth_user_id: data.user.id,
        });

        logDebug("Successfully signed up user", userProfile);
        return { ...data, user: userProfile };
      }

      return data;
    } catch (error) {
      handleError(error, "Sign up");
    }
  }

  static async resetPassword(email) {
    try {
      logDebug(`Attempting password reset for email: ${email}`);

      const { data, error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) throw error;

      logDebug("Successfully sent password reset email");
      return data;
    } catch (error) {
      handleError(error, "Reset password");
    }
  }

  static async updatePassword(newPassword) {
    try {
      logDebug("Attempting password update");

      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      logDebug("Successfully updated password");
      return data;
    } catch (error) {
      handleError(error, "Update password");
    }
  }
}

export default AuthService;
