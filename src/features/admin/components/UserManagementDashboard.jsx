import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  UserPlus,
  Shield,
  Clock,
  AlertTriangle,
  Search,
  Edit,
  Trash2,
  RefreshCw,
  Download,
  UserCheck,
  Key,
} from "lucide-react";
import { UserManagementService } from "../../../services/domains/auth/userManagementService";
import {
  CreateUserModal,
  EditUserModal,
  DeleteConfirmationModal,
  ActivationConfirmationModal,
  ResetPasswordModal,
  SuccessModal,
} from "../../../components/modals/UserModals";
import { useToast } from "../../../components/ui/Toast";
import { UnifiedSpinner } from "../../../components/ui/loading/UnifiedSpinner";
import { TableSkeleton } from "../../../components/ui/loading/SkeletonLoader";

const UserManagementDashboard = () => {
  const { success: showSuccess, error: showError } = useToast();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalData, setSuccessModalData] = useState(null);
  const [successModalType, setSuccessModalType] = useState("create"); // 'create' or 'update'
  const [selectedUser, setSelectedUser] = useState(null);
  const [userStats, setUserStats] = useState({});

  // Filter users function
  const filterUsers = useCallback(() => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterRole !== "all") {
      filtered = filtered.filter(
        (user) => user.user_roles?.role === filterRole
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((user) => user.status === filterStatus);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, filterRole, filterStatus]);

  useEffect(() => {
    loadUsers();
    loadUserStats();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [filterUsers]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await UserManagementService.getAllUsers();
      setUsers(data);
    } catch (error) {
      setError("Failed to load users");
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      const stats = await UserManagementService.getUserStatistics();
      setUserStats(stats);
    } catch (error) {
      console.error("Error loading user stats:", error);
    }
  };

  const handleCreateUser = async (userData) => {
    try {
      console.log("📝 [UserManagementDashboard] Creating user:", {
        ...userData,
        password: "***",
      });

      await UserManagementService.createUser(userData);

      console.log("✅ [UserManagementDashboard] User created successfully");
      setShowCreateModal(false);
      setError(null); // Clear any previous errors

      // Reload data
      await loadUsers();
      await loadUserStats();

      // Show success modal with user details
      setSuccessModalType("create");
      setSuccessModalData({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phone: userData.phone,
        role: userData.role,
      });
      setShowSuccessModal(true);
    } catch (error) {
      console.error("❌ [UserManagementDashboard] Error creating user:", error);

      // Show user-friendly error message
      let errorMessage = "Failed to create user";

      if (error.message?.includes("already exists")) {
        errorMessage = "A user with this email already exists";
      } else if (error.message?.includes("Invalid role")) {
        errorMessage = error.message;
      } else if (error.message?.includes("violates check constraint")) {
        errorMessage =
          "Invalid role selected. Please run the database migration script.";
      } else if (error.message) {
        errorMessage = `Failed to create user: ${error.message}`;
      }

      setError(errorMessage);
    }
  };

  const handleUpdateUser = async (userId, userData) => {
    try {
      console.log(
        "🔧 [UserManagementDashboard] Updating user:",
        userId,
        userData
      );

      await UserManagementService.updateUser(userId, userData);

      console.log("✅ [UserManagementDashboard] User updated successfully");
      setShowEditModal(false);
      setError(null); // Clear any previous errors

      // Reload data
      await loadUsers();

      // Show success modal with updated user details
      setSuccessModalType("update");
      setSuccessModalData({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phone: userData.phone,
        role: userData.role,
      });
      setShowSuccessModal(true);
      setSelectedUser(null);
    } catch (error) {
      console.error("❌ [UserManagementDashboard] Error updating user:", error);

      // Show user-friendly error message
      let errorMessage = "Failed to update user";

      if (error.message?.includes("Invalid role")) {
        errorMessage = error.message;
      } else if (error.message?.includes("violates check constraint")) {
        errorMessage =
          "Invalid role selected. Please run the database migration script.";
      } else if (error.message) {
        errorMessage = `Failed to update user: ${error.message}`;
      }

      setError(errorMessage);
    }
  };

  const handleDeleteUser = async (userId) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      // Check if user is already inactive
      if (!user.is_active) {
        showError("This user is already deactivated", {
          duration: 3000,
        });
        return;
      }
      setSelectedUser(user);
      setShowDeleteModal(true);
    }
  };

  const handleHardDeleteUser = async (userId) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      // First, check what records are associated with this user
      try {
        console.log("🔍 Checking associated records before deletion...");
        const associations =
          await UserManagementService.getUserAssociatedRecords(userId);
        console.log("📊 Association check result:", associations);

        if (!associations.canDelete && associations.blockingTables.length > 0) {
          showError(
            `Cannot delete user: Has ${associations.blockingTables.join(
              ", "
            )}. ` + `These records must be deleted or reassigned first.`,
            {
              duration: 8000,
            }
          );
          return;
        }

        // Proceed with deletion modal
        setSelectedUser(user);
        setShowDeleteModal(true);
      } catch (error) {
        console.error("Error checking associations:", error);
        showError(
          "Could not verify if user can be safely deleted. Please check console.",
          {
            duration: 5000,
          }
        );
      }
    }
  };

  const confirmDeleteUser = async () => {
    if (!selectedUser) {
      console.warn("⚠️ No user selected for deletion");
      return;
    }

    try {
      console.log("🗑️ [UserManagementDashboard] Starting deletion process");
      console.log("📋 Selected user:", {
        id: selectedUser.id,
        email: selectedUser.email,
        name: `${selectedUser.first_name} ${selectedUser.last_name}`,
        role: selectedUser.role,
        is_active: selectedUser.is_active,
      });

      // Determine if this is a hard delete (for inactive users) or soft delete (for active users)
      const isHardDelete = !selectedUser.is_active;

      if (isHardDelete) {
        console.log(
          "⚠️ Performing HARD DELETE (permanent) with cascade cleanup..."
        );
        await UserManagementService.hardDeleteUser(selectedUser.id, {
          cascade: true, // Always cascade delete logs and movements
        });
        console.log("✅ [UserManagementDashboard] User permanently deleted");
      } else {
        console.log(
          "🔄 Calling UserManagementService.deleteUser (soft delete)..."
        );
        await UserManagementService.deleteUser(selectedUser.id);
        console.log(
          "✅ [UserManagementDashboard] User deactivated successfully"
        );
      }

      setShowDeleteModal(false);
      setSelectedUser(null);
      setError(null);

      console.log("🔄 Reloading users and stats...");
      await loadUsers();
      await loadUserStats();

      // ✅ Show success toast notification
      if (isHardDelete) {
        showSuccess(
          `User ${selectedUser.first_name} ${selectedUser.last_name} has been permanently deleted`,
          {
            duration: 4000,
          }
        );
      } else {
        showSuccess(
          `User ${selectedUser.first_name} ${selectedUser.last_name} has been successfully deactivated`,
          {
            duration: 4000,
          }
        );
      }
    } catch (error) {
      console.error("❌ [UserManagementDashboard] Error deleting user:", error);
      console.error("❌ Error name:", error.name);
      console.error("❌ Error message:", error.message);
      console.error("❌ Error stack:", error.stack);
      console.error("❌ Full error object:", JSON.stringify(error, null, 2));

      // ✅ Show error toast notification
      showError(
        error.message || "Failed to delete user. Check console for details.",
        {
          duration: 5000,
        }
      );

      setShowDeleteModal(false);
    }
  };

  // Handle reactivate user
  const handleActivateUser = async (user) => {
    console.log("✅ [UserManagementDashboard] Initiating user reactivation");
    console.log("📋 User to reactivate:", {
      id: user.id,
      email: user.email,
      name: `${user.first_name} ${user.last_name}`,
      role: user.role,
      is_active: user.is_active,
    });

    // Check if user is already active
    if (user.is_active) {
      console.warn("⚠️ User is already active");
      showError("This user is already active", { duration: 3000 });
      return;
    }

    setSelectedUser(user);
    setShowActivateModal(true);
  };

  // Confirm reactivate user
  const confirmActivateUser = async () => {
    if (!selectedUser) {
      console.warn("⚠️ No user selected for reactivation");
      return;
    }

    try {
      console.log("✅ [UserManagementDashboard] Starting reactivation process");
      console.log("📋 Selected user:", {
        id: selectedUser.id,
        email: selectedUser.email,
        name: `${selectedUser.first_name} ${selectedUser.last_name}`,
        role: selectedUser.role,
        is_active: selectedUser.is_active,
      });

      await UserManagementService.activateUser(selectedUser.id);
      console.log("✅ [UserManagementDashboard] User reactivated successfully");

      setShowActivateModal(false);
      setSelectedUser(null);
      setError(null);

      console.log("🔄 Reloading users and stats...");
      await loadUsers();
      await loadUserStats();

      // ✅ Show success toast notification
      showSuccess(
        `User ${selectedUser.first_name} ${selectedUser.last_name} has been successfully reactivated`,
        {
          duration: 4000,
        }
      );
    } catch (error) {
      console.error(
        "❌ [UserManagementDashboard] Error reactivating user:",
        error
      );
      console.error("❌ Error name:", error.name);
      console.error("❌ Error message:", error.message);
      console.error("❌ Error stack:", error.stack);

      // ✅ Show error toast notification
      showError(
        error.message ||
          "Failed to reactivate user. Check console for details.",
        {
          duration: 5000,
        }
      );

      setShowActivateModal(false);
    }
  };

  const handleResetPassword = async (email) => {
    const user = users.find((u) => u.email === email);
    if (user) {
      setSelectedUser(user);
      setShowResetPasswordModal(true);
    }
  };

  const confirmResetPassword = async () => {
    if (!selectedUser) return;

    try {
      console.log(
        "🔑 [UserManagementDashboard] Resetting password for:",
        selectedUser.email
      );
      await UserManagementService.resetPassword(selectedUser.email);
      console.log("✅ [UserManagementDashboard] Password reset email sent");

      setShowResetPasswordModal(false);
      setSelectedUser(null);

      alert(`Password reset email has been sent to ${selectedUser.email}`);
    } catch (error) {
      console.error(
        "❌ [UserManagementDashboard] Error resetting password:",
        error
      );
      setShowResetPasswordModal(false);
      alert(`Failed to send password reset email: ${error.message}`);
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      // Current roles (3-tier system)
      admin: "bg-red-100 text-red-800", // Super admin - full access
      pharmacist: "bg-green-100 text-green-800", // Inventory & sales management
      employee: "bg-blue-100 text-blue-800", // Basic sales access

      // Legacy roles (for backward compatibility - will be migrated)
      super_admin: "bg-red-100 text-red-800", // → admin
      manager: "bg-green-100 text-green-800", // → pharmacist
      cashier: "bg-blue-100 text-blue-800", // → employee
      staff: "bg-blue-100 text-blue-800", // → employee
    };
    return colors[role] || "bg-gray-100 text-gray-800";
  };

  const getOnlineStatus = (user) => {
    if (!user.is_active) {
      return { status: "INACTIVE", color: "bg-red-100 text-red-800" };
    }

    if (!user.last_login) {
      return { status: "OFFLINE", color: "bg-gray-100 text-gray-800" };
    }

    const lastLogin = new Date(user.last_login);
    const now = new Date();
    const minutesAgo = (now - lastLogin) / (1000 * 60);

    // Online: active within last 5 minutes
    if (minutesAgo < 5) {
      return { status: "ONLINE", color: "bg-green-100 text-green-800" };
    }

    // Recently Active: active within last 24 hours
    if (minutesAgo < 24 * 60) {
      return {
        status: "RECENTLY ACTIVE",
        color: "bg-yellow-100 text-yellow-800",
      };
    }

    // Offline: no activity in 24+ hours
    return { status: "OFFLINE", color: "bg-gray-100 text-gray-800" };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              User Management
            </h2>
            <p className="text-gray-600">Loading team members...</p>
          </div>
        </div>
        <TableSkeleton rows={8} columns={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600">
            Manage system users, roles, and permissions
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 hover:scale-105 hover:shadow-lg transition-all duration-200"
        >
          <UserPlus className="h-5 w-5" />
          <span>Add User</span>
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2" />
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {userStats.totalUsers || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Online Now</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter((u) => getOnlineStatus(u).status === "ONLINE")
                  .length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Roles</p>
              <p className="text-2xl font-bold text-gray-900">
                {userStats.roles?.length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Recently Active
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter((u) => u.last_login).length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              {Object.values(UserManagementService.ROLES).map((role) => (
                <option key={role} value={role}>
                  {role.replace("_", " ").toUpperCase()}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={loadUsers}
              className="p-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Download className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className={`hover:bg-gray-50 ${
                    !user.is_active ? "bg-gray-50 opacity-60" : ""
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div
                        className={`h-10 w-10 rounded-full ${
                          user.is_active ? "bg-blue-100" : "bg-gray-200"
                        } flex items-center justify-center`}
                      >
                        <span
                          className={`text-sm font-medium ${
                            user.is_active ? "text-blue-600" : "text-gray-400"
                          }`}
                        >
                          {user.first_name?.[0]}
                          {user.last_name?.[0]}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`text-sm font-medium ${
                              user.is_active ? "text-gray-900" : "text-gray-500"
                            }`}
                          >
                            {user.first_name} {user.last_name}
                          </div>
                          {!user.is_active && (
                            <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                              Deactivated
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(
                        user.user_roles?.role
                      )}`}
                    >
                      {user.user_roles?.role?.replace("_", " ").toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.department || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        getOnlineStatus(user).color
                      }`}
                    >
                      {getOnlineStatus(user).status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.last_login
                      ? new Date(user.last_login).toLocaleString()
                      : "Never"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowEditModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 hover:scale-110 transition-all duration-200"
                        title="Edit user"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleResetPassword(user.email)}
                        className="text-yellow-600 hover:text-yellow-900 hover:scale-110 transition-all duration-200"
                        title="Reset password"
                      >
                        <Key className="h-4 w-4" />
                      </button>
                      {user.is_active ? (
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-900 hover:scale-110 transition-all duration-200 cursor-pointer"
                          title="Deactivate user"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleActivateUser(user)}
                            className="text-green-600 hover:text-green-900 hover:scale-110 transition-all duration-200 cursor-pointer"
                            title="Reactivate user"
                          >
                            <UserCheck className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleHardDeleteUser(user.id)}
                            className="text-red-800 hover:text-red-950 hover:scale-110 transition-all duration-200 cursor-pointer"
                            title="Permanently delete user"
                          >
                            <Trash2 className="h-4 w-4 fill-current" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateUser}
        />
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onSubmit={(data) => handleUpdateUser(selectedUser.id, data)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <DeleteConfirmationModal
          user={selectedUser}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedUser(null);
          }}
          onConfirm={confirmDeleteUser}
        />
      )}

      {/* Activation Confirmation Modal */}
      {showActivateModal && selectedUser && (
        <ActivationConfirmationModal
          user={selectedUser}
          onClose={() => {
            setShowActivateModal(false);
            setSelectedUser(null);
          }}
          onConfirm={confirmActivateUser}
        />
      )}

      {/* Reset Password Modal */}
      {showResetPasswordModal && selectedUser && (
        <ResetPasswordModal
          user={selectedUser}
          onClose={() => {
            setShowResetPasswordModal(false);
            setSelectedUser(null);
          }}
          onConfirm={confirmResetPassword}
        />
      )}

      {/* Success Modal */}
      {showSuccessModal && successModalData && (
        <SuccessModal
          isOpen={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false);
            setSuccessModalData(null);
            setSuccessModalType("create");
          }}
          title={
            successModalType === "create"
              ? "User Created Successfully!"
              : "User Updated Successfully!"
          }
          message={
            successModalType === "create"
              ? "The new user account has been created and is ready to use."
              : "The user account has been updated with the new information."
          }
          user={successModalData}
        />
      )}
    </div>
  );
};

export default UserManagementDashboard;
