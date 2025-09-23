// Debug Script for Notification System Testing
// Run this in the browser console to test notifications

console.log('🔧 Notification System Debug Script Loaded');

// Test functions
window.debugNotifications = {
  // Test the new notification system directly
  testNewSystem: () => {
    console.log('🧪 Testing new NotificationSystem...');
    if (window.notificationSystem) {
      window.notificationSystem.addTestNotification();
      console.log('✅ New system test triggered');
    } else {
      console.error('❌ NotificationSystem not found on window');
    }
  },

  // Test legacy NotificationManager wrapper
  testLegacyManager: () => {
    console.log('🧪 Testing legacy NotificationManager wrapper...');
    if (window.NotificationManager) {
      window.NotificationManager.testNotification();
      console.log('✅ Legacy manager test triggered');
    } else {
      console.error('❌ NotificationManager wrapper not found');
    }
  },

  // Test SimpleNotificationService wrapper  
  testSimpleService: () => {
    console.log('🧪 Testing SimpleNotificationService wrapper...');
    if (window.SimpleNotificationService) {
      window.SimpleNotificationService.showSystemAlert('Test notification from SimpleNotificationService wrapper');
      console.log('✅ SimpleNotificationService test triggered');
    } else {
      console.error('❌ SimpleNotificationService wrapper not found');
    }
  },

  // Test low stock check
  testLowStockCheck: async () => {
    console.log('🧪 Testing low stock check...');
    if (window.SimpleNotificationService) {
      const result = await window.SimpleNotificationService.checkAndNotifyLowStock();
      console.log('✅ Low stock check result:', result);
    } else {
      console.error('❌ SimpleNotificationService wrapper not found');
    }
  },

  // Test expiry check
  testExpiryCheck: async () => {
    console.log('🧪 Testing expiry check...');
    if (window.SimpleNotificationService) {
      const result = await window.SimpleNotificationService.checkAndNotifyExpiring();
      console.log('✅ Expiry check result:', result);
    } else {
      console.error('❌ SimpleNotificationService wrapper not found');
    }
  },

  // Run all tests
  runAllTests: async () => {
    console.log('🚀 Running all notification tests...');
    window.debugNotifications.testNewSystem();
    await new Promise(resolve => setTimeout(resolve, 500));
    window.debugNotifications.testLegacyManager();
    await new Promise(resolve => setTimeout(resolve, 500));
    window.debugNotifications.testSimpleService();
    await new Promise(resolve => setTimeout(resolve, 500));
    await window.debugNotifications.testLowStockCheck();
    await new Promise(resolve => setTimeout(resolve, 500));
    await window.debugNotifications.testExpiryCheck();
    console.log('✅ All tests completed');
  },

  // Check system status
  checkStatus: () => {
    console.log('📊 Notification System Status:');
    console.log('- NotificationSystem:', !!window.notificationSystem);
    console.log('- NotificationManager wrapper:', !!window.NotificationManager);
    console.log('- SimpleNotificationService wrapper:', !!window.SimpleNotificationService);
    console.log('- Legacy migration function:', !!window.addTransactionNotification);
    
    if (window.notificationSystem) {
      const notifications = window.notificationSystem.getNotifications();
      console.log('- Current notifications:', notifications.length);
      console.log('- Unread count:', window.notificationSystem.getUnreadCount());
    }
  }
};

// Auto-run status check
window.debugNotifications.checkStatus();

console.log('💡 Usage:');
console.log('- debugNotifications.runAllTests() - Run all tests');
console.log('- debugNotifications.testLowStockCheck() - Test low stock detection');
console.log('- debugNotifications.checkStatus() - Check system status');