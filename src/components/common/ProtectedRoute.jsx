import React from "react";
import PropTypes from "prop-types";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { MainLayout } from "../layout/MainLayout";

export function ProtectedRoute({ children, requiredRole = null }) {
  const { user, role, isLoadingAuth } = useAuth();
  const location = useLocation();

  // Wait for auth to load
  if (isLoadingAuth) {
    return null; // The GlobalSpinner is handled at App level
  }

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If specific role is required and user doesn't have it
  if (requiredRole) {
    const allowedRoles = Array.isArray(requiredRole)
      ? requiredRole
      : [requiredRole];
    const hasRequiredRole =
      allowedRoles.includes(role) || role === "admin" || role === "super_admin";

    if (!hasRequiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <MainLayout>{children}</MainLayout>;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  requiredRole: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]),
};
