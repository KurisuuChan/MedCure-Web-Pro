import React, { useState, useEffect } from 'react';
import { SimpleNotificationService } from '../services/domains/notifications/simpleNotificationService';
import { Bell, TestTube, AlertTriangle, CheckCircle, Package, Calendar } from 'lucide-react';

/**
 * Notification Debugger Component
 * This component helps debug notification issues by testing various notification functions
 */
export function NotificationDebugger() {
  const [permissionStatus, setPermissionStatus] = useState('default');
  const [isSupported, setIsSupported] = useState(false);
  const [testResults, setTestResults] = useState([]);

  useEffect(() => {
    // Check browser support and permission status
    setIsSupported(SimpleNotificationService.isSupported());
    setPermissionStatus(SimpleNotificationService.getPermissionStatus());
  }, []);

  const addTestResult = (test, status, message = '') => {
    const result = {
      id: Date.now(),
      test,
      status,
      message,
      timestamp: new Date().toLocaleTimeString()
    };
    setTestResults(prev => [result, ...prev.slice(0, 9)]); // Keep only last 10 results
  };

  const testBrowserSupport = () => {
    const supported = SimpleNotificationService.isSupported();
    addTestResult('Browser Support', supported ? 'PASS' : 'FAIL', 
      supported ? 'Browser supports notifications' : 'Browser does not support notifications');
  };

  const testPermissionRequest = async () => {
    try {
      const permission = await SimpleNotificationService.requestPermission();
      setPermissionStatus(permission);
      addTestResult('Permission Request', permission === 'granted' ? 'PASS' : 'WARN', 
        `Permission status: ${permission}`);
    } catch (error) {
      addTestResult('Permission Request', 'FAIL', error.message);
    }
  };

  const testDesktopNotification = () => {
    try {
      const notification = SimpleNotificationService.showSystemAlert('Test desktop notification from debugger');
      addTestResult('Desktop Notification', notification ? 'PASS' : 'FAIL', 
        notification ? 'Desktop notification created' : 'Failed to create desktop notification');
    } catch (error) {
      addTestResult('Desktop Notification', 'FAIL', error.message);
    }
  };

  const testLowStockAlert = () => {
    try {
      const notification = SimpleNotificationService.showLowStockAlert('Test Medicine', 5);
      addTestResult('Low Stock Alert', notification ? 'PASS' : 'FAIL', 
        notification ? 'Low stock alert created' : 'Failed to create low stock alert');
    } catch (error) {
      addTestResult('Low Stock Alert', 'FAIL', error.message);
    }
  };

  const testExpiryWarning = () => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const expiryDate = tomorrow.toISOString().split('T')[0];
      
      const notification = SimpleNotificationService.showExpiryWarning('Test Product', expiryDate);
      addTestResult('Expiry Warning', notification ? 'PASS' : 'FAIL', 
        notification ? 'Expiry warning created' : 'Failed to create expiry warning');
    } catch (error) {
      addTestResult('Expiry Warning', 'FAIL', error.message);
    }
  };

  const testSaleComplete = () => {
    try {
      const notification = SimpleNotificationService.showSaleComplete(125.50, 3);
      addTestResult('Sale Complete', notification ? 'PASS' : 'FAIL', 
        notification ? 'Sale complete notification created' : 'Failed to create sale complete notification');
    } catch (error) {
      addTestResult('Sale Complete', 'FAIL', error.message);
    }
  };

  const testDailyChecks = async () => {
    try {
      addTestResult('Daily Checks', 'PENDING', 'Running daily checks...');
      await SimpleNotificationService.runDailyChecks();
      addTestResult('Daily Checks', 'PASS', 'Daily checks completed');
    } catch (error) {
      addTestResult('Daily Checks', 'FAIL', error.message);
    }
  };

  const testLowStockCheck = async () => {
    try {
      addTestResult('Force Notification Check', 'PENDING', 'Force checking all notifications...');
      const result = await SimpleNotificationService.forceCheckNotifications();
      
      if (result.error) {
        addTestResult('Force Notification Check', 'FAIL', result.error);
      } else {
        const total = result.lowStockCount + result.expiringCount;
        addTestResult('Force Notification Check', total > 0 ? 'PASS' : 'WARN', 
          `Found ${result.lowStockCount} low stock, ${result.expiringCount} expiring products`);
      }
    } catch (error) {
      addTestResult('Force Notification Check', 'FAIL', error.message);
    }
  };

  const testRealtimeMonitoring = async () => {
    try {
      addTestResult('Realtime Setup', 'PENDING', 'Testing real-time monitoring setup...');
      await SimpleNotificationService.startRealtimeMonitoring();
      addTestResult('Realtime Setup', 'PASS', 'Real-time monitoring initialized');
    } catch (error) {
      addTestResult('Realtime Setup', 'FAIL', error.message);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'granted': return 'text-green-600 bg-green-50';
      case 'denied': return 'text-red-600 bg-red-50';
      case 'default': return 'text-yellow-600 bg-yellow-50';
      case 'unsupported': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getResultColor = (status) => {
    switch (status) {
      case 'PASS': return 'text-green-600';
      case 'FAIL': return 'text-red-600';
      case 'WARN': return 'text-yellow-600';
      case 'PENDING': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <TestTube className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Notification System Debugger</h2>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Browser Support</h3>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${isSupported ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
              {isSupported ? '✅ Supported' : '❌ Not Supported'}
            </div>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Permission Status</h3>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${getStatusColor(permissionStatus)}`}>
              {permissionStatus === 'granted' && '✅ Granted'}
              {permissionStatus === 'denied' && '❌ Denied'}
              {permissionStatus === 'default' && '⏳ Not Requested'}
              {permissionStatus === 'unsupported' && '❌ Unsupported'}
            </div>
          </div>
        </div>

        {/* Test Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <button
            onClick={testBrowserSupport}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Bell className="h-4 w-4" />
            Browser Test
          </button>

          <button
            onClick={testPermissionRequest}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            <CheckCircle className="h-4 w-4" />
            Request Permission
          </button>

          <button
            onClick={testDesktopNotification}
            disabled={permissionStatus !== 'granted'}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
          >
            <Bell className="h-4 w-4" />
            Desktop Test
          </button>

          <button
            onClick={testLowStockAlert}
            disabled={permissionStatus !== 'granted'}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
          >
            <Package className="h-4 w-4" />
            Low Stock
          </button>

          <button
            onClick={testExpiryWarning}
            disabled={permissionStatus !== 'granted'}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
          >
            <Calendar className="h-4 w-4" />
            Expiry Test
          </button>

          <button
            onClick={testSaleComplete}
            disabled={permissionStatus !== 'granted'}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
          >
            <CheckCircle className="h-4 w-4" />
            Sale Test
          </button>

          <button
            onClick={testDailyChecks}
            disabled={permissionStatus !== 'granted'}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
          >
            <AlertTriangle className="h-4 w-4" />
            Daily Checks
          </button>

          <button
            onClick={testLowStockCheck}
            disabled={permissionStatus !== 'granted'}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
          >
            <Package className="h-4 w-4" />
            Force Check All
          </button>

          <button
            onClick={testRealtimeMonitoring}
            disabled={permissionStatus !== 'granted'}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
          >
            <Bell className="h-4 w-4" />
            Test Realtime
          </button>

          <button
            onClick={clearResults}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
          >
            Clear Results
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-blue-900 mb-2">How to Use:</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>First click "Browser Test" to check if your browser supports notifications</li>
            <li>Click "Request Permission" to enable desktop notifications</li>
            <li>Try "Desktop Test" to see if notifications appear</li>
            <li><strong>Use "Force Check All" to manually scan for low stock items</strong></li>
            <li>Use "Daily Checks" to test the automated system</li>
          </ol>
          
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-xs text-yellow-800">
              💡 <strong>Tip:</strong> If automatic notifications aren't appearing when you change stock, 
              use "Force Check All" to manually trigger the notification system.
            </p>
          </div>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Test Results</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {testResults.map((result) => (
                <div key={result.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className={`font-medium ${getResultColor(result.status)}`}>
                      {result.status}
                    </span>
                    <span className="text-gray-900">{result.test}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">{result.timestamp}</div>
                    {result.message && (
                      <div className="text-sm text-gray-600 mt-1">{result.message}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default NotificationDebugger;