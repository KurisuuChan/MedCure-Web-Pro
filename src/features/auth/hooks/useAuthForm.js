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

      // Use the AuthProvider's signIn method which uses the data service
      const result = await signIn(credentials.email, credentials.password);

      if (result.error) {
        throw new Error(result.error.message);
      }

      console.log("✅ useAuthForm: Login successful");
    } catch (err) {
      console.error("❌ useAuthForm: Login failed", err);
      setError(err.message || "Invalid email or password");
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
