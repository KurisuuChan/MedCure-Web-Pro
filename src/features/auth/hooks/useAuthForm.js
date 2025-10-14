import { useState } from "react";
import { useAuth } from "../../../hooks/useAuth";

export function useAuthForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { signIn, signOut } = useAuth();

  const handleLogin = async (credentials) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("🔐 useAuthForm: Attempting login with", credentials.email);

      // Use the AuthProvider's signIn method which now throws errors properly
      await signIn(credentials.email, credentials.password);

      console.log("✅ useAuthForm: Login successful");
    } catch (err) {
      console.error("❌ useAuthForm: Login failed", err);
      
      // 🎯 ENHANCED ERROR MESSAGES - Better error detection
      let errorMessage = "Login failed. Please try again.";
      
      // Get error message from various sources
      const originalError = err.message || err.error_description || err.msg || "";
      const errorCode = err.code || "";
      const combinedError = (originalError + " " + errorCode).toLowerCase();
      
      console.log("🔍 Error analysis:", { originalError, errorCode, combinedError });
      
      if (combinedError.includes("invalid login credentials") || 
          combinedError.includes("invalid_credentials") ||
          combinedError.includes("invalid email or password") ||
          combinedError.includes("wrong password") ||
          combinedError.includes("incorrect password")) {
        errorMessage = "Invalid email or password. Please check your credentials and try again.";
      } else if (combinedError.includes("email") && combinedError.includes("invalid")) {
        errorMessage = "Please enter a valid email address.";
      } else if (combinedError.includes("user not found") || combinedError.includes("user_not_found")) {
        errorMessage = "No account found with this email address. Please check your email or create an account.";
      } else if (combinedError.includes("too many requests") || combinedError.includes("rate limit")) {
        errorMessage = "Too many login attempts. Please wait a few minutes before trying again.";
      } else if (combinedError.includes("network") || combinedError.includes("connection")) {
        errorMessage = "Network error. Please check your internet connection and try again.";
      } else if (combinedError.includes("disabled") || combinedError.includes("suspended")) {
        errorMessage = "Your account has been disabled. Please contact support for assistance.";
      } else if (combinedError.includes("email_not_confirmed") || combinedError.includes("unverified")) {
        errorMessage = "Please verify your email address before signing in.";
      } else if (originalError && originalError.trim().length > 0) {
        // Use the original error message if it's informative
        errorMessage = originalError;
      }
      
      console.log("🎯 Final error message:", errorMessage);
      console.log("🎯 Setting error state with:", errorMessage);
      setError(errorMessage);
      console.log("🎯 Error state should now be set!");
      return; // Make sure we don't continue after error
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await signOut();
    } catch (err) {
      setError(err.message || "Logout failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    isLoading,
    error,
    handleLogin,
    handleLogout,
    clearError,
  };
}
