/**
 * Notification System Test Functions
 * Use these in browser console to test notifications
 */

import { NotificationService } from "../services/domains/notifications/notificationService";

// Make functions globally available for testing
window.notificationTest = {
  /**
   * Test low stock alert generation
   */
  async testLowStockAlerts() {
    console.log("🔔 Testing Low Stock Alerts...");
    try {
      const alerts = await NotificationService.generateLowStockAlerts();
      console.log("✅ Low stock alerts generated:", alerts);

      if (alerts && alerts.length > 0) {
        console.log(`📦 Found ${alerts.length} products with low stock:`);
        alerts.forEach((product) => {
          console.log(`  - ${product.name}: ${product.stock_in_pieces} pieces`);
        });
      } else {
        console.log("📦 No low stock products found");
      }

      return alerts;
    } catch (error) {
      console.error("❌ Error testing low stock alerts:", error);
      throw error;
    }
  },

  /**
   * Test expiry warnings generation
   */
  async testExpiryWarnings() {
    console.log("⏰ Testing Expiry Warnings...");
    try {
      const warnings = await NotificationService.generateExpiryWarnings();
      console.log("✅ Expiry warnings generated:", warnings);

      if (warnings && warnings.length > 0) {
        console.log(`📅 Found ${warnings.length} products expiring soon:`);
        warnings.forEach((product) => {
          const daysToExpiry = Math.ceil(
            (new Date(product.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)
          );
          console.log(`  - ${product.name}: expires in ${daysToExpiry} days`);
        });
      } else {
        console.log("📅 No products expiring soon");
      }

      return warnings;
    } catch (error) {
      console.error("❌ Error testing expiry warnings:", error);
      throw error;
    }
  },

  /**
   * Get current user's notifications
   */
  async getMyNotifications(userId) {
    console.log("📬 Getting current notifications...");
    try {
      const notifications = await NotificationService.getActiveNotifications(
        userId
      );
      console.log("✅ Current notifications:", notifications);

      if (notifications && notifications.length > 0) {
        console.log(
          `📬 You have ${notifications.length} active notifications:`
        );
        notifications.forEach((notif, index) => {
          console.log(
            `  ${index + 1}. [${notif.priority.toUpperCase()}] ${
              notif.title
            }: ${notif.message}`
          );
        });
      } else {
        console.log("📬 No active notifications");
      }

      return notifications;
    } catch (error) {
      console.error("❌ Error getting notifications:", error);
      throw error;
    }
  },

  /**
   * Comprehensive notification test
   */
  async runFullTest(userId) {
    console.log("🧪 Running Full Notification Test...");
    console.log("=" * 50);

    try {
      // Test low stock alerts
      await this.testLowStockAlerts();
      console.log(""); // spacing

      // Test expiry warnings
      await this.testExpiryWarnings();
      console.log(""); // spacing

      // Get current notifications
      const notifications = await this.getMyNotifications(userId);
      console.log(""); // spacing

      console.log("🎉 Full notification test completed!");
      console.log("=" * 50);

      return {
        success: true,
        notificationCount: notifications ? notifications.length : 0,
      };
    } catch (error) {
      console.error("❌ Full test failed:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Create a test low stock scenario
   */
  async createTestScenario() {
    console.log("🧪 Creating test low stock scenario...");
    console.log(
      "This will help you test notifications by simulating low stock"
    );
    console.log("Instructions:");
    console.log("1. Go to POS page");
    console.log("2. Buy products until their stock goes below 10 pieces");
    console.log("3. Complete the sale");
    console.log("4. Check your notifications (bell icon in header)");
    console.log(
      "5. Run: await notificationTest.getMyNotifications('your-user-id')"
    );
  },
};

console.log("🔔 Notification Test Functions Loaded!");
console.log("Available functions:");
console.log("- notificationTest.testLowStockAlerts()");
console.log("- notificationTest.testExpiryWarnings()");
console.log("- notificationTest.getMyNotifications(userId)");
console.log("- notificationTest.runFullTest(userId)");
console.log("- notificationTest.createTestScenario()");
console.log("");
console.log("Example usage:");
console.log(
  "await notificationTest.runFullTest('b9b31a83-66fd-46e5-b4be-3386c4988f48')"
);
