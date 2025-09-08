import React from "react";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Settings,
  X,
  UserCheck,
  Truck,
} from "lucide-react";

const navigationItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "manager", "cashier"],
  },
  {
    name: "Point of Sale",
    href: "/pos",
    icon: ShoppingCart,
    roles: ["admin", "manager", "cashier"],
  },
  {
    name: "Inventory",
    href: "/inventory",
    icon: Package,
    roles: ["admin", "manager"],
  },
  {
    name: "Management",
    href: "/management",
    icon: Users,
    roles: ["admin"],
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    roles: ["admin", "manager"],
  },
  // Phase 4 Advanced Management Features
  {
    name: "User Management",
    href: "/user-management",
    icon: UserCheck,
    roles: ["super_admin", "admin"],
  },
  {
    name: "Supplier Management",
    href: "/supplier-management",
    icon: Truck,
    roles: ["super_admin", "admin", "manager"],
  },
];

export function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const { user, role } = useAuth();

  // Filter navigation items based on user role
  const filteredNavigation = navigationItems.filter((item) =>
    item.roles.includes(role || "cashier")
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:z-30
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <div className="flex flex-col h-full">
          {/* Logo section for desktop */}
          <div className="hidden lg:flex items-center gap-3 p-6 border-b border-gray-200">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-semibold text-xl text-gray-900">
              MedCure Pro
            </span>
          </div>

          {/* Mobile close button */}
          <div className="flex items-center justify-between p-4 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span className="font-semibold text-xl text-gray-900">
                MedCure Pro
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 lg:px-6 lg:py-6">
            <div className="space-y-2">
              {filteredNavigation.map((item) => {
                const isActive = location.pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={onClose}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                      ${
                        isActive
                          ? "bg-blue-600 text-white shadow-lg transform scale-105"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      }
                    `}
                  >
                    <Icon
                      className={`h-5 w-5 ${
                        isActive ? "text-white" : "text-gray-500"
                      }`}
                    />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Bottom section */}
            <div className="mt-auto pt-6">
              <div className="border-t border-gray-200 pt-6">
                <Link
                  to="/settings"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200"
                >
                  <Settings className="h-5 w-5 text-gray-500" />
                  <span className="font-medium">Settings</span>
                </Link>
              </div>

              {/* User info */}
              <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                    <span className="text-sm font-bold text-white">
                      {user?.email?.[0]?.toUpperCase() || "U"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {user?.email || "User"}
                    </p>
                    <p className="text-xs text-gray-500 capitalize font-medium">
                      {role || "cashier"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}
