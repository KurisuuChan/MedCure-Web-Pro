import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "../../ui/Card";
import { Input } from "../../ui/Input";
import { Button } from "../../ui/Button";
import { Select } from "../../ui/Select";
import { Badge } from "../../ui/Badge";
import { Alert } from "../../ui/Alert";
import { Modal } from "../../ui/Modal";
import UserManagementService from "../../../services/userManagementService";
import SessionManagementService from "../../../services/domains/auth/sessionManagementService";
import UserActivityService from "../../../services/domains/auth/userActivityService";
import PasswordPolicyService from "../../../services/domains/auth/passwordPolicyService";
import { useAuth } from "../../../hooks/useAuth";

const EnhancedUserManagement = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [userActivities, setUserActivities] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [passwordValidation, setPasswordValidation] = useState(null);

  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    role: "CASHIER",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersData, alertsData, sessionsData] = await Promise.all([
        UserManagementService.getAllUsers(),
        UserActivityService.getSecurityAlerts({ limit: 10 }),
        SessionManagementService.getActiveSessions(),
      ]);

      setUsers(usersData);
      setSecurityAlerts(alertsData);
      setActiveSessions(sessionsData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      // Validate password
      const validation = PasswordPolicyService.validatePassword(
        newUser.password,
        {
          username: newUser.username,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
        }
      );

      if (!validation.isValid) {
        setPasswordValidation(validation);
        return;
      }

      if (newUser.password !== newUser.confirmPassword) {
        alert("Passwords do not match");
        return;
      }

      const userData = {
        username: newUser.username,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        password: newUser.password,
      };

      const createdUser = await UserManagementService.createUser(userData);

      if (createdUser) {
        // Log activity
        await UserActivityService.logActivity({
          userId: user.id,
          activityType: UserActivityService.ACTIVITY_TYPES.ADMIN_ACTION,
          description: `Created new user: ${newUser.username}`,
          riskLevel: UserActivityService.RISK_LEVELS.MEDIUM,
          metadata: {
            targetUserId: createdUser.id,
            targetUserRole: newUser.role,
          },
        });

        setUsers([...users, createdUser]);
        setShowCreateModal(false);
        setNewUser({
          username: "",
          email: "",
          firstName: "",
          lastName: "",
          role: "CASHIER",
          password: "",
          confirmPassword: "",
        });
        setPasswordValidation(null);
      }
    } catch (error) {
      console.error("Error creating user:", error);
      alert("Failed to create user");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const success = await UserManagementService.deleteUser(userId);

      if (success) {
        // Log activity
        await UserActivityService.logActivity({
          userId: user.id,
          activityType: UserActivityService.ACTIVITY_TYPES.ADMIN_ACTION,
          description: `Deleted user: ${userId}`,
          riskLevel: UserActivityService.RISK_LEVELS.HIGH,
          metadata: { targetUserId: userId },
        });

        setUsers(users.filter((u) => u.id !== userId));
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user");
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      const success = await UserManagementService.updateUserRole(
        userId,
        newRole
      );

      if (success) {
        // Log activity
        await UserActivityService.logActivity({
          userId: user.id,
          activityType: UserActivityService.ACTIVITY_TYPES.ROLE_CHANGE,
          description: `Changed user role to: ${newRole}`,
          riskLevel: UserActivityService.RISK_LEVELS.HIGH,
          metadata: { targetUserId: userId, newRole },
        });

        setUsers(
          users.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
      }
    } catch (error) {
      console.error("Error updating user role:", error);
      alert("Failed to update user role");
    }
  };

  const handleTerminateSession = async (sessionId) => {
    try {
      await SessionManagementService.terminateSession(sessionId);
      setActiveSessions(activeSessions.filter((s) => s.id !== sessionId));

      // Log activity
      await UserActivityService.logActivity({
        userId: user.id,
        activityType: UserActivityService.ACTIVITY_TYPES.ADMIN_ACTION,
        description: `Terminated user session: ${sessionId}`,
        riskLevel: UserActivityService.RISK_LEVELS.MEDIUM,
        metadata: { sessionId },
      });
    } catch (error) {
      console.error("Error terminating session:", error);
      alert("Failed to terminate session");
    }
  };

  const handleViewUserActivity = async (userId) => {
    try {
      const activities = await UserActivityService.getUserActivities(userId, {
        limit: 50,
      });
      setUserActivities(activities);
      setSelectedUser(users.find((u) => u.id === userId));
      setShowActivityModal(true);
    } catch (error) {
      console.error("Error fetching user activities:", error);
    }
  };

  const handlePasswordValidation = (password) => {
    const validation = PasswordPolicyService.validatePassword(password, {
      username: newUser.username,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
    });
    setPasswordValidation(validation);
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.firstName} ${user.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRiskLevelColor = (level) => {
    const colors = {
      low: "green",
      medium: "yellow",
      high: "orange",
      critical: "red",
    };
    return colors[level] || "gray";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading user management...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Enhanced User Management</h1>
        <Button onClick={() => setShowCreateModal(true)}>Create User</Button>
      </div>

      {/* Security Alerts */}
      {securityAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Security Alerts</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {securityAlerts.slice(0, 3).map((alert) => (
                <Alert key={alert.id} variant="warning">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">{alert.description}</span>
                      <div className="text-sm text-gray-600">
                        User: {alert.user?.username} |{" "}
                        {new Date(alert.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <Badge color={getRiskLevelColor(alert.risk_level)}>
                      {alert.risk_level.toUpperCase()}
                    </Badge>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <Input
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-48"
        >
          <option value="">All Roles</option>
          <option value="SUPER_ADMIN">Super Admin</option>
          <option value="ADMIN">Admin</option>
          <option value="MANAGER">Manager</option>
          <option value="PHARMACIST">Pharmacist</option>
          <option value="CASHIER">Cashier</option>
          <option value="STAFF">Staff</option>
        </Select>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">
            Users ({filteredUsers.length})
          </h2>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">User</th>
                  <th className="text-left p-2">Role</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Last Login</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{user.username}</div>
                        <div className="text-sm text-gray-600">
                          {user.email}
                        </div>
                        <div className="text-sm text-gray-600">
                          {user.firstName} {user.lastName}
                        </div>
                      </div>
                    </td>
                    <td className="p-2">
                      <Select
                        value={user.role}
                        onChange={(e) =>
                          handleUpdateUserRole(user.id, e.target.value)
                        }
                        className="w-32"
                      >
                        <option value="SUPER_ADMIN">Super Admin</option>
                        <option value="ADMIN">Admin</option>
                        <option value="MANAGER">Manager</option>
                        <option value="PHARMACIST">Pharmacist</option>
                        <option value="CASHIER">Cashier</option>
                        <option value="STAFF">Staff</option>
                      </Select>
                    </td>
                    <td className="p-2">
                      <Badge color={user.isActive ? "green" : "red"}>
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <div className="text-sm">
                        {user.lastLogin
                          ? new Date(user.lastLogin).toLocaleString()
                          : "Never"}
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewUserActivity(user.id)}
                        >
                          Activity
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">
            Active Sessions ({activeSessions.length})
          </h2>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">User</th>
                  <th className="text-left p-2">IP Address</th>
                  <th className="text-left p-2">Started</th>
                  <th className="text-left p-2">Last Activity</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeSessions.map((session) => (
                  <tr key={session.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{session.username}</td>
                    <td className="p-2">{session.ipAddress}</td>
                    <td className="p-2">
                      {new Date(session.startTime).toLocaleString()}
                    </td>
                    <td className="p-2">
                      {new Date(session.lastActivity).toLocaleString()}
                    </td>
                    <td className="p-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleTerminateSession(session.id)}
                      >
                        Terminate
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create User Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)}>
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Create New User</h2>

          <div className="space-y-4">
            <Input
              placeholder="Username"
              value={newUser.username}
              onChange={(e) =>
                setNewUser({ ...newUser, username: e.target.value })
              }
            />

            <Input
              placeholder="Email"
              type="email"
              value={newUser.email}
              onChange={(e) =>
                setNewUser({ ...newUser, email: e.target.value })
              }
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="First Name"
                value={newUser.firstName}
                onChange={(e) =>
                  setNewUser({ ...newUser, firstName: e.target.value })
                }
              />
              <Input
                placeholder="Last Name"
                value={newUser.lastName}
                onChange={(e) =>
                  setNewUser({ ...newUser, lastName: e.target.value })
                }
              />
            </div>

            <Select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            >
              <option value="CASHIER">Cashier</option>
              <option value="STAFF">Staff</option>
              <option value="PHARMACIST">Pharmacist</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </Select>

            <Input
              placeholder="Password"
              type="password"
              value={newUser.password}
              onChange={(e) => {
                setNewUser({ ...newUser, password: e.target.value });
                handlePasswordValidation(e.target.value);
              }}
            />

            <Input
              placeholder="Confirm Password"
              type="password"
              value={newUser.confirmPassword}
              onChange={(e) =>
                setNewUser({ ...newUser, confirmPassword: e.target.value })
              }
            />

            {/* Password Validation */}
            {passwordValidation && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span>Password Strength:</span>
                  <Badge
                    color={
                      passwordValidation.strength === "very_strong"
                        ? "green"
                        : passwordValidation.strength === "strong"
                        ? "blue"
                        : passwordValidation.strength === "moderate"
                        ? "yellow"
                        : "red"
                    }
                  >
                    {passwordValidation.strength
                      .replace("_", " ")
                      .toUpperCase()}
                  </Badge>
                  <span>({passwordValidation.score}/100)</span>
                </div>

                {passwordValidation.errors.length > 0 && (
                  <div className="text-red-600 text-sm">
                    <div className="font-medium">Errors:</div>
                    <ul className="list-disc list-inside">
                      {passwordValidation.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {passwordValidation.suggestions.length > 0 && (
                  <div className="text-blue-600 text-sm">
                    <div className="font-medium">Suggestions:</div>
                    <ul className="list-disc list-inside">
                      {passwordValidation.suggestions
                        .slice(0, 3)
                        .map((suggestion, index) => (
                          <li key={index}>{suggestion}</li>
                        ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-6">
            <Button onClick={handleCreateUser}>Create User</Button>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* User Activity Modal */}
      <Modal
        isOpen={showActivityModal}
        onClose={() => setShowActivityModal(false)}
      >
        <div className="p-6 max-w-4xl">
          <h2 className="text-xl font-bold mb-4">
            User Activity - {selectedUser?.username}
          </h2>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {userActivities.map((activity) => (
              <div key={activity.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{activity.description}</div>
                    <div className="text-sm text-gray-600">
                      Type: {activity.activity_type} | IP: {activity.ip_address}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(activity.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <Badge color={getRiskLevelColor(activity.risk_level)}>
                    {activity.risk_level.toUpperCase()}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => setShowActivityModal(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EnhancedUserManagement;
