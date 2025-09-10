import React, { useState } from "react";
import { LoginTrackingService } from "../../services/domains/auth/loginTrackingService";
import { UserService } from "../../services";

export default function LoginTrackingTest() {
  const [testResults, setTestResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (test, result) => {
    setTestResults((prev) => [
      ...prev,
      { test, result, timestamp: new Date().toISOString() },
    ]);
  };

  const runTests = async () => {
    setIsLoading(true);
    setTestResults([]);

    // Test 1: Check current user
    try {
      const currentUser = localStorage.getItem("medcure-current-user");
      if (currentUser) {
        const user = JSON.parse(currentUser);
        addResult("Current User Check", { success: true, user });

        // Test 2: Update last login for current user
        const updateResult = await LoginTrackingService.updateLastLogin(
          user.id
        );
        addResult("Update Last Login", updateResult);

        // Test 3: Check if user was updated in database
        const userResult = await UserService.getUsers();
        addResult("Get Updated Users", userResult);
      } else {
        addResult("Current User Check", {
          success: false,
          error: "No user logged in",
        });
      }
    } catch (error) {
      addResult("Test Error", { success: false, error: error.message });
    }

    // Test 4: Check database connection
    try {
      const usersResult = await UserService.getUsers();
      addResult("Database Connection", usersResult);
    } catch (error) {
      addResult("Database Connection", {
        success: false,
        error: error.message,
      });
    }

    setIsLoading(false);
  };

  const manuallyUpdateLastLogin = async () => {
    try {
      const currentUser = localStorage.getItem("medcure-current-user");
      if (currentUser) {
        const user = JSON.parse(currentUser);
        const loginTime = new Date().toISOString();

        // Update localStorage
        user.last_login = loginTime;
        localStorage.setItem("medcure-current-user", JSON.stringify(user));

        addResult("Manual LocalStorage Update", {
          success: true,
          message: "Updated localStorage last_login",
          timestamp: loginTime,
        });

        // Refresh the page to see changes
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (error) {
      addResult("Manual Update Error", {
        success: false,
        error: error.message,
      });
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Login Tracking Test
      </h3>

      <div className="space-y-4">
        <div className="flex space-x-3">
          <button
            onClick={runTests}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isLoading ? "Running Tests..." : "Run Login Tracking Tests"}
          </button>

          <button
            onClick={manuallyUpdateLastLogin}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Manually Update Last Login (LocalStorage)
          </button>
        </div>

        {testResults.length > 0 && (
          <div className="mt-6">
            <h4 className="font-medium text-gray-900 mb-3">Test Results:</h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    result.result.success
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-gray-900">
                      {result.test}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <pre className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">
                    {JSON.stringify(result.result, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">
            Debug Instructions:
          </h4>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Run the login tracking tests to see what's happening</li>
            <li>Check the browser console for detailed error messages</li>
            <li>
              Use "Manually Update Last Login" to force update for testing
            </li>
            <li>Refresh the Management page to see if changes appear</li>
            <li>Check if the database tables exist in Supabase</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
