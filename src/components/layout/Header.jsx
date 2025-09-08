import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { Bell, Search, Settings, User, LogOut, Menu } from "lucide-react";
import NotificationCenter from "../../features/notifications/components/NotificationCenter";
import NotificationPreferences from "../../features/notifications/components/NotificationPreferences";

export function Header({ onToggleSidebar }) {
  const { user, signOut } = useAuth();
  const [showSearch, setShowSearch] = useState(false);
  const [showNotificationPreferences, setShowNotificationPreferences] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleSearchClick = () => {
    setShowSearch(!showSearch);
  };

  return (
    <header className="bg-white shadow-lg border-b border-gray-200 h-16 flex items-center justify-between px-4 lg:px-6 relative">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-white via-blue-50/30 to-white"></div>

      <div className="relative z-10 w-full flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 shadow-sm"
          >
            <Menu className="h-5 w-5 text-gray-600" />
          </button>

          {/* Logo - Enhanced for mobile only since desktop has sidebar logo */}
          <div className="flex items-center gap-3 lg:hidden">
            <div className="w-9 h-9 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-bold text-xl text-gray-900 hidden sm:block">
              MedCure Pro
            </span>
          </div>
        </div>

        {/* Center - Enhanced Search */}
        <div className="hidden md:flex flex-1 max-w-2xl mx-8">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products, sales, or anything..."
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50 transition-all duration-200 text-sm font-medium placeholder-gray-500"
            />
          </div>
        </div>

        {/* Right side - Enhanced */}
        <div className="flex items-center gap-2">
          {/* Search button for mobile */}
          <button
            onClick={handleSearchClick}
            className="md:hidden p-2.5 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 shadow-sm"
          >
            <Search className="h-5 w-5 text-gray-600" />
          </button>

          {/* Notifications - Enhanced with NotificationCenter */}
          <NotificationCenter />

          {/* Settings - Enhanced */}
          <button 
            onClick={() => setShowNotificationPreferences(true)}
            className="p-2.5 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 shadow-sm"
          >
            <Settings className="h-5 w-5 text-gray-600" />
          </button>

          {/* User menu - Enhanced */}
          <div className="relative group">
            <button className="flex items-center gap-3 p-2 pl-3 pr-4 rounded-xl hover:bg-blue-50 transition-all duration-200 shadow-sm">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-xs">
                  {user?.email?.[0]?.toUpperCase() || "U"}
                </span>
              </div>
              <span className="hidden sm:block text-sm font-semibold text-gray-700">
                {user?.email?.split("@")[0] || "User"}
              </span>
            </button>

            {/* Enhanced Dropdown menu */}
            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="p-3">
                <div className="px-3 py-3 text-sm text-gray-500 border-b border-gray-100 bg-gray-50/50 rounded-lg mb-2">
                  <div className="text-xs text-gray-400 uppercase tracking-wide font-semibold">
                    Signed in as
                  </div>
                  <div className="font-semibold text-gray-900 mt-1">
                    {user?.email}
                  </div>
                </div>

                <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg mt-2 transition-all duration-200">
                  <User className="h-4 w-4" />
                  <span className="font-medium">Profile</span>
                </button>

                <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-all duration-200">
                  <Settings className="h-4 w-4" />
                  <span className="font-medium">Settings</span>
                </button>

                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg mt-2 transition-all duration-200 font-medium"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Preferences Modal */}
      <NotificationPreferences 
        isOpen={showNotificationPreferences}
        onClose={() => setShowNotificationPreferences(false)}
      />
    </header>
  );
}
