import React, { useState } from "react";
import { Eye, EyeOff, LogIn, Loader2, Mail, Lock } from "lucide-react";

export default function LoginForm({
  onSubmit,
  isLoading = false,
  error = null,
  onClearError = null,
}) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const validateForm = () => {
    const errors = {};

    // 🎯 ENHANCED EMAIL VALIDATION
    if (!formData.email) {
      errors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email =
        "Please enter a valid email address (e.g., user@example.com)";
    } else if (formData.email.length > 255) {
      errors.email = "Email address is too long";
    }

    // 🎯 ENHANCED PASSWORD VALIDATION
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters long";
    } else if (formData.password.length > 100) {
      errors.password = "Password is too long";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (field) => (e) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));

    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }

    // 🎯 Clear main login error when user starts typing again
    if (error && onClearError) {
      onClearError();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Simple Error Message */}
      {error && (
        <div className="text-red-600 text-sm text-center font-medium">
          {error}
        </div>
      )}

      {/* Email Field */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-semibold text-gray-700 mb-2"
        >
          Email Address
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail
              className={`h-5 w-5 ${
                validationErrors.email || error
                  ? "text-red-400"
                  : "text-gray-400"
              }`}
            />
          </div>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange("email")}
            disabled={isLoading}
            className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
              validationErrors.email || error
                ? "border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50/50"
                : "border-gray-300 hover:border-gray-400"
            } ${isLoading ? "bg-gray-50 cursor-not-allowed" : "bg-white"}`}
            placeholder="your.email@example.com"
            autoComplete="email"
          />
        </div>
        {validationErrors.email && (
          <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
            <span className="inline-block w-1 h-1 bg-red-600 rounded-full"></span>
            <span>{validationErrors.email}</span>
          </p>
        )}
      </div>

      {/* Password Field */}
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-semibold text-gray-700 mb-2"
        >
          Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock
              className={`h-5 w-5 ${
                validationErrors.password || error
                  ? "text-red-400"
                  : "text-gray-400"
              }`}
            />
          </div>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={handleInputChange("password")}
            disabled={isLoading}
            className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
              validationErrors.password || error
                ? "border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50/50"
                : "border-gray-300 hover:border-gray-400"
            } ${isLoading ? "bg-gray-50 cursor-not-allowed" : "bg-white"}`}
            placeholder="Enter your password"
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors disabled:cursor-not-allowed focus:outline-none"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
        {validationErrors.password && (
          <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
            <span className="inline-block w-1 h-1 bg-red-600 rounded-full"></span>
            <span>{validationErrors.password}</span>
          </p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3.5 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 focus:ring-4 focus:ring-blue-500/50 transition-all disabled:from-blue-400 disabled:to-cyan-400 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transform hover:-translate-y-0.5"
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin h-5 w-5 mr-2" />
            Signing In...
          </>
        ) : (
          <>
            <LogIn className="h-5 w-5 mr-2" />
            Sign In to Dashboard
          </>
        )}
      </button>

      {/* Security Badge */}
      <div className="flex items-center justify-center space-x-2 text-xs text-gray-500 pt-2">
        <svg
          className="w-4 h-4 text-green-500"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        <span>Secured with 256-bit SSL encryption</span>
      </div>
    </form>
  );
}
