// Temporary placeholder to resolve import error
// This file can be safely removed once the cache is cleared

import React from 'react';

const NotificationDebugger = () => {
  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Notification Debug (Deprecated)</h2>
      <p className="text-gray-600">
        This component has been replaced by the professional notification system.
        Please use the browser console and run:
      </p>
      <pre className="bg-gray-100 p-2 mt-2 text-sm">
        debugNotifications.runAllTests()
      </pre>
    </div>
  );
};

export default NotificationDebugger;