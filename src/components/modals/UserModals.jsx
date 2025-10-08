import React, { useState } from "react";
import {
  X,
  UserPlus,
  Edit,
  AlertTriangle,
  Key,
  Eye,
  EyeOff,
  Mail,
  Phone,
  Shield,
  Building,
  User,
  CheckCircle,
  Trash2,
} from "lucide-react";
import { UserManagementService } from "../../services/domains/auth/userManagementService";

// Create User Modal Component
export const CreateUserModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    role: "employee",
    department: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const validateForm = () => {
    const errors = {};

    if (!formData.firstName.trim()) {
      errors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      errors.lastName = "Last name is required";
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters long";
    }

    if (formData.phone && !/^\+?[\d\s-()]+$/.test(formData.phone)) {
      errors.phone = "Please enter a valid phone number";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors({ ...validationErrors, [field]: null });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <UserPlus className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Create New User
              </h3>
              <p className="text-sm text-gray-600">
                Add a new team member to the system
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="group p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
          >
            <X className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Personal Information Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                <User className="h-4 w-4" />
                <span>Personal Information</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      validationErrors.firstName
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    } focus:ring-2 focus:outline-none transition-all duration-200`}
                    placeholder="John"
                  />
                  {validationErrors.firstName && (
                    <p className="mt-1 text-xs text-red-600 flex items-center">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {validationErrors.firstName}
                    </p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      validationErrors.lastName
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    } focus:ring-2 focus:outline-none transition-all duration-200`}
                    placeholder="Doe"
                  />
                  {validationErrors.lastName && (
                    <p className="mt-1 text-xs text-red-600 flex items-center">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {validationErrors.lastName}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Information Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                <Mail className="h-4 w-4" />
                <span>Contact Information</span>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    validationErrors.email
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  } focus:ring-2 focus:outline-none transition-all duration-200`}
                  placeholder="john.doe@medcure.com"
                />
                {validationErrors.email && (
                  <p className="mt-1 text-xs text-red-600 flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {validationErrors.email}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${
                      validationErrors.phone
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    } focus:ring-2 focus:outline-none transition-all duration-200`}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                {validationErrors.phone && (
                  <p className="mt-1 text-xs text-red-600 flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {validationErrors.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Security Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                <Key className="h-4 w-4" />
                <span>Security</span>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      validationErrors.password
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    } focus:ring-2 focus:outline-none transition-all duration-200`}
                    placeholder="Minimum 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {validationErrors.password && (
                  <p className="mt-1 text-xs text-red-600 flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {validationErrors.password}
                  </p>
                )}
              </div>
            </div>

            {/* Role & Department Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                <Shield className="h-4 w-4" />
                <span>Role & Department</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleInputChange("role", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200"
                  >
                    {Object.values(UserManagementService.ROLES).map((role) => (
                      <option key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) =>
                        handleInputChange("department", e.target.value)
                      }
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200"
                      placeholder="e.g., Pharmacy, IT"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <p className="text-sm text-gray-500">
            <span className="text-red-500">*</span> Required fields
          </p>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-all duration-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span>Create User</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Edit User Modal Component
export const EditUserModal = ({ user, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    firstName: user.first_name || "",
    lastName: user.last_name || "",
    phone: user.phone || "",
    role: user.user_roles?.role || "employee",
    department: user.department || "",
    status: user.status || "active",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const validateForm = () => {
    const errors = {};

    if (!formData.firstName.trim()) {
      errors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      errors.lastName = "Last name is required";
    }

    if (formData.phone && !/^\+?[\d\s-()]+$/.test(formData.phone)) {
      errors.phone = "Please enter a valid phone number";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (validationErrors[field]) {
      setValidationErrors({ ...validationErrors, [field]: null });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-xl">
              <Edit className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Edit User</h3>
              <p className="text-sm text-gray-600">
                Update user information and permissions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="group p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
          >
            <X className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" />
          </button>
        </div>

        {/* User Info Badge */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
              {user.first_name?.[0]}
              {user.last_name?.[0]}
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {user.first_name} {user.last_name}
              </p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                <User className="h-4 w-4" />
                <span>Personal Information</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      validationErrors.firstName
                        ? "border-red-300"
                        : "border-gray-300"
                    } focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-all duration-200`}
                  />
                  {validationErrors.firstName && (
                    <p className="mt-1 text-xs text-red-600">
                      {validationErrors.firstName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      validationErrors.lastName
                        ? "border-red-300"
                        : "border-gray-300"
                    } focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-all duration-200`}
                  />
                  {validationErrors.lastName && (
                    <p className="mt-1 text-xs text-red-600">
                      {validationErrors.lastName}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                <Phone className="h-4 w-4" />
                <span>Contact Information</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${
                      validationErrors.phone
                        ? "border-red-300"
                        : "border-gray-300"
                    } focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-all duration-200`}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                {validationErrors.phone && (
                  <p className="mt-1 text-xs text-red-600">
                    {validationErrors.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Role & Department */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                <Shield className="h-4 w-4" />
                <span>Role & Department</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleInputChange("role", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-all duration-200"
                  >
                    {Object.values(UserManagementService.ROLES).map((role) => (
                      <option key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) =>
                        handleInputChange("department", e.target.value)
                      }
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-all duration-200"
                      placeholder="e.g., Pharmacy, IT"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                <CheckCircle className="h-4 w-4" />
                <span>Account Status</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange("status", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-all duration-200"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-all duration-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Delete Confirmation Modal
export const DeleteConfirmationModal = ({ user, onClose, onConfirm }) => {
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error("Error deleting user:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const isConfirmValid =
    confirmText.toLowerCase() ===
    `${user.first_name} ${user.last_name}`.toLowerCase();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-100">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-red-100 rounded-xl">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900">Delete User</h3>
              <p className="text-sm text-gray-600 mt-1">
                This action cannot be undone
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* User Info */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-semibold text-lg">
                {user.first_name?.[0]}
                {user.last_name?.[0]}
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-sm text-gray-500">{user.email}</p>
                <p className="text-xs text-gray-400 capitalize">
                  {user.user_roles?.role || "employee"}
                </p>
              </div>
            </div>
          </div>

          {/* Warning Message */}
          <div className="space-y-2">
            <p className="text-sm text-gray-700">
              You are about to permanently delete this user account. This will:
            </p>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                <span>Remove all user data and history</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                <span>Revoke all access and permissions</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                <span>Delete activity logs and audit trails</span>
              </li>
            </ul>
          </div>

          {/* Confirmation Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type the user's full name to confirm:
              <span className="block text-xs font-normal text-gray-500 mt-1">
                {user.first_name} {user.last_name}
              </span>
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Enter full name"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none transition-all duration-200"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 bg-gray-50 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-all duration-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!isConfirmValid || isDeleting}
            className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                <span>Delete User</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Reset Password Confirmation Modal
export const ResetPasswordModal = ({ user, onClose, onConfirm }) => {
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error("Error resetting password:", error);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-yellow-50 to-amber-50 border-b border-yellow-100">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-yellow-100 rounded-xl">
              <Key className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900">
                Reset Password
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Send password reset email
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* User Info */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center text-white font-semibold text-lg">
                {user.first_name?.[0]}
                {user.last_name?.[0]}
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-sm text-gray-500 flex items-center">
                  <Mail className="h-3 w-3 mr-1" />
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">What happens next:</p>
                <ul className="space-y-1 text-blue-700">
                  <li>• Password reset email will be sent to {user.email}</li>
                  <li>• User will receive a secure reset link</li>
                  <li>• Link expires after 1 hour</li>
                  <li>• Current password remains active until reset</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 bg-gray-50 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={isResetting}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-all duration-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={isResetting}
            className="px-5 py-2.5 text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
          >
            {isResetting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Mail className="h-4 w-4" />
                <span>Send Reset Email</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Success Confirmation Modal Component
export const SuccessModal = ({
  isOpen,
  onClose,
  title = "Success!",
  message = "Operation completed successfully.",
  user = null,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-green-100">
          <div className="flex items-center justify-center">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 text-center mt-4">
            {title}
          </h2>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-center text-gray-700 text-base leading-relaxed">
            {message}
          </p>

          {/* User Details Card */}
          {user && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-green-900 mb-3 flex items-center">
                <User className="h-4 w-4 mr-2" />
                User Details
              </h3>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <span className="text-gray-600 w-20 font-medium">Name:</span>
                  <span className="text-gray-900 font-semibold">
                    {user.firstName} {user.lastName}
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <Mail className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-gray-600 w-16 font-medium">Email:</span>
                  <span className="text-gray-900">{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center text-sm">
                    <Phone className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-gray-600 w-16 font-medium">
                      Phone:
                    </span>
                    <span className="text-gray-900">{user.phone}</span>
                  </div>
                )}
                <div className="flex items-center text-sm">
                  <Shield className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-gray-600 w-16 font-medium">Role:</span>
                  <span className="text-gray-900 capitalize">{user.role}</span>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-800">
                <p className="font-medium mb-1">What's Next:</p>
                <ul className="space-y-1 text-green-700">
                  <li>• User account is now active</li>
                  <li>• Credentials have been created successfully</li>
                  <li>• User can log in immediately</li>
                  <li>• User will appear in the user list</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-center p-6 bg-gray-50 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-8 py-3 text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};
