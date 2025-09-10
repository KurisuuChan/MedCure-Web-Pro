import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { Bell, Search, User, LogOut, Menu } from "lucide-react";
import { SimpleNotificationService } from "../../services/domains/notifications/simpleNotificationService";

export function Header({ onToggleSidebar }) {
  const { user, signOut } = useAuth();
  const [showSearch, setShowSearch] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState("default");

  useEffect(() => {
    setNotificationStatus(SimpleNotificationService.getPermissionStatus());
  }, []);

  const handleNotificationClick = async () => {
    if (notificationStatus === "default") {
      try {
        const permission = await SimpleNotificationService.requestPermission();
        setNotificationStatus(permission);

        if (permission === "granted") {
          // Initialize the enhanced notification system
          await SimpleNotificationService.initialize();
        }
      } catch (error) {
        console.error("Error requesting notification permission:", error);
      }
    } else if (notificationStatus === "granted") {
      // Run daily checks when clicking the bell
      await SimpleNotificationService.runDailyChecks();
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo and Mobile menu */}
          <div className="flex items-center">
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex-shrink-0 flex items-center ml-4 lg:ml-0">
              <h1 className="text-2xl font-bold text-blue-600">MedCure Pro</h1>
            </div>
          </div>

          {/* Center - Search (on larger screens) */}
          <div className="hidden md:block flex-1 max-w-lg mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products, sales, or anything..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Right side - Notifications and User menu */}
          <div className="flex items-center space-x-4">
            {/* Mobile search toggle */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 md:hidden"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Smart Notifications */}
            <button
              onClick={handleNotificationClick}
              className={`relative p-2 rounded-md transition-all duration-200 ${
                notificationStatus === "granted"
                  ? "text-green-600 hover:bg-green-50"
                  : notificationStatus === "denied"
                  ? "text-red-600 hover:bg-red-50"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
              title={
                notificationStatus === "granted"
                  ? "Notifications enabled - Click to run checks"
                  : notificationStatus === "denied"
                  ? "Notifications blocked - Check browser settings"
                  : "Click to enable notifications"
              }
            >
              <Bell className="h-5 w-5" />
              {notificationStatus === "granted" && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"></div>
              )}
            </button>

            {/* User menu */}
            <div className="relative">
              <div className="flex items-center space-x-3">
                <div className="hidden md:block text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {user?.user_metadata?.first_name ||
                      user?.email?.split("@")[0] ||
                      "User"}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">
                    {user?.user_metadata?.role || "Cashier"}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {(user?.user_metadata?.first_name ||
                        user?.email ||
                        "U")[0].toUpperCase()}
                    </span>
                  </div>

                  <button
                    onClick={handleSignOut}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                    title="Sign out"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile search */}
        {showSearch && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products, sales, or anything..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
