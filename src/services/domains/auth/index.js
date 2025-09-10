// 🔐 **AUTH DOMAIN SERVICES**
// All authentication and user management services

export { AuthService } from "./authService";
export { UserService } from "./userService";
export { UserManagementService } from "./userManagementService";
export { LoginTrackingService } from "./loginTrackingService";

// Import for default export
import { AuthService } from "./authService";
import { UserService } from "./userService";
import { UserManagementService } from "./userManagementService";
import { LoginTrackingService } from "./loginTrackingService";

export default {
  AuthService,
  UserService,
  UserManagementService,
  LoginTrackingService,
};
