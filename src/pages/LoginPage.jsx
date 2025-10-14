import React from "react";
import { useAuth } from "../hooks/useAuth";
import { Navigate, useLocation, Link } from "react-router-dom";
import LoginForm from "../features/auth/components/LoginForm";
import { useAuthForm } from "../features/auth/hooks/useAuthForm";
import {
  Activity,
  Shield,
  Clock,
  Users,
  TrendingUp,
  Package,
  ArrowLeft,
} from "lucide-react";

export default function LoginPage() {
  const { user } = useAuth();
  const location = useLocation();
  const { isLoading, error, handleLogin, clearError } = useAuthForm();

  const from = location.state?.from?.pathname || "/dashboard";

  // Redirect if already logged in
  if (user) {
    return <Navigate to={from} replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex">
      {/* Left Panel - Branding & Features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600 p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl"></div>

        {/* Header */}
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.172V5L8 4z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">MedCure Pro</h1>
              <p className="text-blue-100 text-sm">Professional Pharmacy Management</p>
            </div>
          </div>

          <h2 className="text-4xl font-bold text-white leading-tight mb-6">
            Transform Your
            <br />
            Pharmacy Operations
          </h2>
          <p className="text-blue-100 text-lg leading-relaxed">
            Streamline inventory, sales, and customer management with our
            comprehensive pharmacy solution.
          </p>
        </div>

        {/* Features Grid */}
        <div className="relative z-10 grid grid-cols-2 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <Package className="w-8 h-8 text-white mb-2" />
            <h3 className="text-white font-semibold mb-1">Inventory</h3>
            <p className="text-blue-100 text-sm">Real-time stock tracking</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <Activity className="w-8 h-8 text-white mb-2" />
            <h3 className="text-white font-semibold mb-1">Analytics</h3>
            <p className="text-blue-100 text-sm">Sales insights & reports</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <Shield className="w-8 h-8 text-white mb-2" />
            <h3 className="text-white font-semibold mb-1">Secure</h3>
            <p className="text-blue-100 text-sm">Enterprise-grade security</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <Clock className="w-8 h-8 text-white mb-2" />
            <h3 className="text-white font-semibold mb-1">24/7 Access</h3>
            <p className="text-blue-100 text-sm">Always available</p>
          </div>
        </div>

        {/* Footer Stats */}
        <div className="relative z-10 flex items-center justify-between text-white/80 text-sm">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Trusted by pharmacies nationwide</span>
          </div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span>99.9% Uptime</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.172V5L8 4z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">MedCure Pro</h1>
            </div>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome Back
              </h2>
              <p className="text-gray-600">
                Sign in to access your pharmacy dashboard
              </p>
            </div>

            <LoginForm
              onSubmit={handleLogin}
              isLoading={isLoading}
              error={error}
              onClearError={clearError}
            />

            {/* Additional Info */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-center text-sm text-gray-500">
                Protected by enterprise-grade security
              </p>
            </div>
          </div>

          {/* Footer Links */}
          <div className="mt-6 space-y-3">
            {/* Back to Homepage */}
            <div className="text-center">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors duration-300 group"
              >
                <ArrowLeft 
                  size={16} 
                  className="group-hover:-translate-x-0.5 transition-transform duration-300" 
                />
                <span>Back to Homepage</span>
              </Link>
            </div>
            
            {/* Support Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Need help?{" "}
                <a
                  href="#"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Contact Support
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
