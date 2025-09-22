/**
 * Professional Notification System Testing Suite
 * Run these tests to validate all notification functionality
 */

import { SimpleNotificationService } from '../services/domains/notifications/simpleNotificationService';
import { useToast } from '../components/ui/Toast';

class NotificationTester {
  constructor() {
    this.testResults = [];
    this.startTime = null;
  }

  // Main test runner
  async runAllTests() {
    console.log('🧪 Starting Comprehensive Notification Tests...');
    console.log('=' .repeat(60));
    
    this.startTime = Date.now();
    this.testResults = [];

    try {
      // Test 1: Desktop Notification System
      await this.testDesktopNotifications();
      
      // Test 2: Toast Notification System  
      await this.testToastNotifications();
      
      // Test 3: Permission Management
      await this.testPermissionHandling();
      
      // Test 4: Real-time Stock Monitoring
      await this.testStockMonitoring();
      
      // Test 5: Anti-spam Mechanism
      await this.testAntiSpamMechanism();
      
      // Test 6: Notification Settings
      await this.testNotificationSettings();
      
      // Test 7: Error Scenarios
      await this.testErrorScenarios();
      
      // Generate report
      this.generateTestReport();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      this.testResults.push({
        test: 'Test Suite Execution',
        status: 'FAILED',
        error: error.message
      });
    }
  }

  // Test 1: Desktop Notification System
  async testDesktopNotifications() {
    console.log('\n📱 Testing Desktop Notifications...');
    
    try {
      // Check browser support
      const isSupported = SimpleNotificationService.isSupported();
      this.logResult('Browser Support Check', isSupported ? 'PASSED' : 'FAILED');
      
      if (!isSupported) {
        console.log('⚠️ Desktop notifications not supported in this browser');
        return;
      }

      // Check permission status
      const permission = SimpleNotificationService.getPermissionStatus();
      this.logResult('Permission Status Check', permission !== 'denied' ? 'PASSED' : 'FAILED');
      console.log(`   Current permission: ${permission}`);

      if (permission === 'granted') {
        // Test low stock alert
        const lowStockNotification = SimpleNotificationService.showLowStockAlert('Test Medicine', 5);
        this.logResult('Low Stock Alert', lowStockNotification ? 'PASSED' : 'FAILED');
        
        // Test expiry warning
        const expiryNotification = SimpleNotificationService.showExpiryWarning('Test Medicine', '2024-10-01');
        this.logResult('Expiry Warning', expiryNotification ? 'PASSED' : 'FAILED');
        
        // Test sale completion
        const saleNotification = SimpleNotificationService.showSaleComplete(150.50, 3);
        this.logResult('Sale Completion', saleNotification ? 'PASSED' : 'FAILED');
        
        // Test system alert
        const systemNotification = SimpleNotificationService.showSystemAlert('Test system message');
        this.logResult('System Alert', systemNotification ? 'PASSED' : 'FAILED');
      } else {
        console.log('   ℹ️ Notifications not granted - some tests skipped');
      }

    } catch (error) {
      this.logResult('Desktop Notification Test', 'FAILED', error.message);
    }
  }

  // Test 2: Toast Notification System
  async testToastNotifications() {
    console.log('\n🍞 Testing Toast Notifications...');
    
    try {
      // We'll simulate toast testing since we can't directly test React hooks here
      // In a real app, you'd test this in the browser console
      
      const toastTests = [
        { type: 'success', message: 'Operation completed successfully!' },
        { type: 'error', message: 'Something went wrong!' },
        { type: 'warning', message: 'Please check your input!' },
        { type: 'info', message: 'Here is some information for you!' }
      ];

      console.log('   📝 Toast test scenarios prepared:');
      toastTests.forEach((test, index) => {
        console.log(`   ${index + 1}. ${test.type.toUpperCase()}: ${test.message}`);
      });

      this.logResult('Toast Test Scenarios', 'PREPARED');
      console.log('   ℹ️ Run browser console tests to verify toast functionality');

    } catch (error) {
      this.logResult('Toast Notification Test', 'FAILED', error.message);
    }
  }

  // Test 3: Permission Management
  async testPermissionHandling() {
    console.log('\n🔐 Testing Permission Management...');
    
    try {
      const currentStatus = SimpleNotificationService.getPermissionStatus();
      console.log(`   Current permission status: ${currentStatus}`);
      
      if (currentStatus === 'default') {
        console.log('   💡 You can test permission request by calling:');
        console.log('   SimpleNotificationService.requestPermission()');
      }
      
      // Test permission status detection
      const validStatuses = ['default', 'granted', 'denied'];
      const isValidStatus = validStatuses.includes(currentStatus);
      this.logResult('Permission Status Detection', isValidStatus ? 'PASSED' : 'FAILED');
      
    } catch (error) {
      this.logResult('Permission Management Test', 'FAILED', error.message);
    }
  }

  // Test 4: Real-time Stock Monitoring
  async testStockMonitoring() {
    console.log('\n📦 Testing Stock Monitoring...');
    
    try {
      // Test low stock detection
      const lowStockCount = await SimpleNotificationService.checkAndNotifyLowStock();
      console.log(`   Found ${lowStockCount} low stock products`);
      this.logResult('Low Stock Detection', typeof lowStockCount === 'number' ? 'PASSED' : 'FAILED');
      
      // Test expiry detection
      const expiringCount = await SimpleNotificationService.checkAndNotifyExpiring();
      console.log(`   Found ${expiringCount} expiring products`);
      this.logResult('Expiry Detection', typeof expiringCount === 'number' ? 'PASSED' : 'FAILED');
      
    } catch (error) {
      this.logResult('Stock Monitoring Test', 'FAILED', error.message);
      console.log('   ⚠️ This might be due to database connection issues');
    }
  }

  // Test 5: Anti-spam Mechanism
  async testAntiSpamMechanism() {
    console.log('\n🚫 Testing Anti-spam Mechanism...');
    
    try {
      if (SimpleNotificationService.getPermissionStatus() === 'granted') {
        // Test multiple identical notifications
        const notification1 = SimpleNotificationService.showLowStockAlert('Spam Test Medicine', 2);
        const notification2 = SimpleNotificationService.showLowStockAlert('Spam Test Medicine', 2);
        const notification3 = SimpleNotificationService.showLowStockAlert('Spam Test Medicine', 2);
        
        // Only first notification should succeed, others should be null (blocked)
        const spamBlocked = notification1 && !notification2 && !notification3;
        this.logResult('Anti-spam Mechanism', spamBlocked ? 'PASSED' : 'FAILED');
        
        if (spamBlocked) {
          console.log('   ✅ Duplicate notifications properly blocked');
        } else {
          console.log('   ❌ Anti-spam mechanism not working correctly');
        }
      } else {
        console.log('   ℹ️ Skipping anti-spam test - notifications not granted');
        this.logResult('Anti-spam Test', 'SKIPPED');
      }
      
    } catch (error) {
      this.logResult('Anti-spam Test', 'FAILED', error.message);
    }
  }

  // Test 6: Notification Settings
  async testNotificationSettings() {
    console.log('\n⚙️ Testing Notification Settings...');
    
    try {
      // Test initialization
      await SimpleNotificationService.initialize();
      this.logResult('Service Initialization', 'PASSED');
      
      // Test daily checks
      await SimpleNotificationService.runDailyChecks();
      this.logResult('Daily Checks', 'PASSED');
      
      console.log('   ✅ Core notification service functions working');
      
    } catch (error) {
      this.logResult('Notification Settings Test', 'FAILED', error.message);
    }
  }

  // Test 7: Error Scenarios
  async testErrorScenarios() {
    console.log('\n🔥 Testing Error Scenarios...');
    
    try {
      // Test with invalid data
      try {
        SimpleNotificationService.showLowStockAlert(null, -1);
        this.logResult('Invalid Data Handling', 'FAILED', 'Should have thrown error');
      } catch (expectedError) {
        this.logResult('Invalid Data Handling', 'PASSED');
      }
      
      // Test notification without permission
      if (SimpleNotificationService.getPermissionStatus() !== 'granted') {
        const result = SimpleNotificationService.showSystemAlert('Test without permission');
        this.logResult('No Permission Handling', !result ? 'PASSED' : 'FAILED');
      }
      
    } catch (error) {
      this.logResult('Error Scenarios Test', 'FAILED', error.message);
    }
  }

  // Helper method to log test results
  logResult(testName, status, error = null) {
    const result = { test: testName, status, timestamp: new Date().toISOString() };
    if (error) result.error = error;
    
    this.testResults.push(result);
    
    const statusEmoji = status === 'PASSED' ? '✅' : status === 'FAILED' ? '❌' : '⚠️';
    const message = error ? ` (${error})` : '';
    console.log(`   ${statusEmoji} ${testName}: ${status}${message}`);
  }

  // Generate comprehensive test report
  generateTestReport() {
    const endTime = Date.now();
    const duration = endTime - this.startTime;
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST REPORT SUMMARY');
    console.log('='.repeat(60));
    
    const passed = this.testResults.filter(r => r.status === 'PASSED').length;
    const failed = this.testResults.filter(r => r.status === 'FAILED').length;
    const skipped = this.testResults.filter(r => r.status === 'SKIPPED').length;
    const total = this.testResults.length;
    
    console.log(`📈 Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed} (${Math.round(passed/total*100)}%)`);
    console.log(`❌ Failed: ${failed} (${Math.round(failed/total*100)}%)`);
    console.log(`⚠️ Skipped: ${skipped} (${Math.round(skipped/total*100)}%)`);
    console.log(`⏱️ Duration: ${duration}ms`);
    
    if (failed > 0) {
      console.log('\n🔍 FAILED TESTS:');
      this.testResults
        .filter(r => r.status === 'FAILED')
        .forEach(r => {
          console.log(`   ❌ ${r.test}: ${r.error || 'Unknown error'}`);
        });
    }
    
    console.log('\n💡 RECOMMENDATIONS:');
    if (failed === 0) {
      console.log('   🎉 All tests passed! Your notification system is working well.');
    } else {
      console.log('   🔧 Review failed tests and fix underlying issues.');
      if (this.testResults.some(r => r.test.includes('Permission'))) {
        console.log('   🔐 Consider enabling desktop notifications for full functionality.');
      }
    }
    
    return {
      summary: { total, passed, failed, skipped, duration },
      results: this.testResults
    };
  }
}

// Export for global access
window.NotificationTester = NotificationTester;

// Quick test runner
window.testNotifications = async () => {
  const tester = new NotificationTester();
  return await tester.runAllTests();
};

console.log('🧪 Notification Testing Suite Loaded!');
console.log('Run: await testNotifications()');

export default NotificationTester;