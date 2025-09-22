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
  TrendingUp,
} from "lucide-react";

const navigationItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "manager", "cashier", "staff", "viewer"],
    category: "main",
  },
  {
    name: "Point of Sale",
    href: "/pos",
    icon: ShoppingCart,
    roles: ["admin", "manager", "cashier"],
    category: "main",
  },
  {
    name: "Drug Inventory",
    href: "/inventory",
    icon: Package,
    roles: ["admin", "manager", "staff"],
    category: "main",
  },
  {
    name: "Pharmacy Analytics",
    href: "/analytics",
    icon: BarChart3,
    roles: ["admin", "manager"],
    category: "insights",
  },
  {
    name: "Pharmacy Management",
    href: "/management",
    icon: Users,
    roles: ["admin"],
    category: "admin",
  },
  {
    name: "Staff Management",
    href: "/user-management",
    icon: UserCheck,
    roles: ["super_admin", "admin"],
    category: "admin",
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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
          onKeyDown={(e) => e.key === "Escape" && onClose()}
          role="button"
          tabIndex={0}
          aria-label="Close sidebar"
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

            {/* Main Functions */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-2">
                Main
              </h3>
              <div className="space-y-2">
                {filteredNavigation
                  .filter((item) => item.category === "main")
                  .map((item) => {
                    const isActive = location.pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={onClose}
                        className={`
                          flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group
                          ${
                            isActive
                              ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25"
                              : "text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-gray-900"
                          }
                        `}
                      >
                        <Icon className={`h-5 w-5 transition-colors ${isActive ? "text-white" : "text-gray-500 group-hover:text-blue-600"}`} />
                        <span className="font-medium">{item.name}</span>
                        {isActive && (
                          <div className="ml-auto w-2 h-2 bg-white rounded-full opacity-75"></div>
                        )}
                      </Link>
                    );
                  })}
              </div>
            </div>

            {/* Analytics & Reports */}
            {filteredNavigation.some(
              (item) => item.category === "insights"
            ) && (
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-2">
                  Analytics & Reports
                </h3>
                <div className="space-y-2">
                  {filteredNavigation
                    .filter((item) => item.category === "insights")
                    .map((item) => {
                      const isActive = location.pathname === item.href;
                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          onClick={onClose}
                          className={`
                            flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group
                            ${
                              isActive
                                ? "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg shadow-green-500/25"
                                : "text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-gray-900"
                            }
                          `}
                        >
                          <Icon
                            className={`h-5 w-5 transition-colors ${
                              isActive ? "text-white" : "text-gray-500 group-hover:text-green-600"
                            }`}
                          />
                          <span className="font-medium">{item.name}</span>
                          {isActive && (
                            <div className="ml-auto w-2 h-2 bg-white rounded-full opacity-75"></div>
                          )}
                        </Link>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Administration */}
            {filteredNavigation.some((item) => item.category === "admin") && (
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-2">
                  Administration
                </h3>
                <div className="space-y-2">
                  {filteredNavigation
                    .filter((item) => item.category === "admin")
                    .map((item) => {
                      const isActive = location.pathname === item.href;
                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          onClick={onClose}
                          className={`
                            flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group
                            ${
                              isActive
                                ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/25"
                                : "text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-gray-900"
                            }
                          `}
                        >
                          <Icon
                            className={`h-5 w-5 transition-colors ${
                              isActive ? "text-white" : "text-gray-500 group-hover:text-purple-600"
                            }`}
                          />
                          <span className="font-medium">{item.name}</span>
                          {isActive && (
                            <div className="ml-auto w-2 h-2 bg-white rounded-full opacity-75"></div>
                          )}
                        </Link>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Bottom section */}
            <div className="mt-auto pt-6">
              <div className="border-t border-gray-200 pt-6">
                <Link
                  to="/settings"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-gray-900 transition-all duration-200 group"
                >
                  <Settings className="h-5 w-5 text-gray-500 group-hover:text-gray-700 transition-colors" />
                  <span className="font-medium">Settings</span>
                </Link>
              </div>

              {/* User info */}
              <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl border border-blue-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white">
                    <span className="text-sm font-bold text-white">
                      {user?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {user?.first_name 
                        ? `${user.first_name} ${user.last_name || ''}`.trim()
                        : user?.email || "User"
                      }
                    </p>
                    <p className="text-xs text-blue-600 capitalize font-medium bg-blue-100 px-2 py-0.5 rounded-full inline-block">
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
