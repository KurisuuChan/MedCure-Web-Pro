import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotificationService } from "../services/notificationService.js";

// Mock Supabase
const mockSupabase = {
  from: vi.fn(() => ({
    insert: vi.fn(() => ({ data: null, error: null })),
    select: vi.fn(() => ({
      eq: vi.fn(() => ({ data: [], error: null })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({ data: null, error: null })),
    })),
  })),
};

// Mock Notification API
globalThis.Notification = vi.fn(() => ({
  close: vi.fn(),
}));

globalThis.Notification.permission = "granted";
globalThis.Notification.requestPermission = vi
  .fn()
  .mockResolvedValue("granted");

describe("NotificationService", () => {
  let notificationService;

  beforeEach(() => {
    notificationService = new NotificationService(mockSupabase);
    vi.clearAllMocks();
  });

  describe("Basic Notifications", () => {
    it("should send a basic notification", async () => {
      const result = await notificationService.sendNotification({
        title: "Test Notification",
        message: "This is a test message",
        type: "info",
        userId: "test-user",
      });

      expect(result.success).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith("notifications");
    });

    it("should handle different notification types", async () => {
      const types = ["info", "warning", "error", "success"];

      for (const type of types) {
        const result = await notificationService.sendNotification({
          title: `${type} notification`,
          message: `This is a ${type} message`,
          type,
          userId: "test-user",
        });

        expect(result.success).toBe(true);
      }
    });

    it("should send browser notifications when permission granted", async () => {
      await notificationService.sendBrowserNotification({
        title: "Browser Test",
        message: "Browser notification test",
        icon: "/icon.png",
      });

      expect(globalThis.Notification).toHaveBeenCalledWith("Browser Test", {
        body: "Browser notification test",
        icon: "/icon.png",
      });
    });
  });

  describe("ML-Powered Notifications", () => {
    it("should send inventory prediction alerts", async () => {
      const prediction = {
        productId: 1,
        productName: "Test Product",
        currentStock: 10,
        predictedDemand: 50,
        daysUntilStockout: 3,
        confidence: 0.85,
      };

      const result = await notificationService.sendInventoryAlert(prediction);

      expect(result.success).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith("notifications");
    });

    it("should send demand surge notifications", async () => {
      const surgeData = {
        productId: 1,
        productName: "Popular Product",
        normalDemand: 10,
        predictedDemand: 40,
        surgePercentage: 300,
        confidence: 0.9,
      };

      const result = await notificationService.sendDemandSurgeAlert(surgeData);

      expect(result.success).toBe(true);
      expect(result.notification.priority).toBe("high");
    });

    it("should send price optimization alerts", async () => {
      const priceData = {
        productId: 1,
        productName: "Test Product",
        currentPrice: 10.99,
        recommendedPrice: 12.5,
        potentialIncrease: 13.7,
        confidence: 0.75,
      };

      const result = await notificationService.sendPriceOptimizationAlert(
        priceData
      );

      expect(result.success).toBe(true);
      expect(result.notification.type).toBe("recommendation");
    });

    it("should send anomaly detection alerts", async () => {
      const anomaly = {
        type: "sales_spike",
        productId: 1,
        productName: "Unusual Product",
        expectedValue: 100,
        actualValue: 500,
        severity: "high",
        timestamp: new Date().toISOString(),
      };

      const result = await notificationService.sendAnomalyAlert(anomaly);

      expect(result.success).toBe(true);
      expect(result.notification.priority).toBe("high");
    });
  });

  describe("Notification Preferences", () => {
    it("should respect user notification preferences", async () => {
      const mockPreferences = {
        email: true,
        browser: false,
        mobile: true,
        sms: false,
        inventory_alerts: true,
        price_alerts: false,
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [mockPreferences],
            error: null,
          }),
        }),
      });

      const canSend = await notificationService.checkUserPreferences(
        "test-user",
        "inventory_alert"
      );
      expect(canSend).toBe(true);

      const cannotSend = await notificationService.checkUserPreferences(
        "test-user",
        "price_alert"
      );
      expect(cannotSend).toBe(false);
    });

    it("should handle quiet hours", async () => {
      const mockPreferences = {
        quiet_hours_enabled: true,
        quiet_hours_start: "22:00",
        quiet_hours_end: "08:00",
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [mockPreferences],
            error: null,
          }),
        }),
      });

      // Mock current time to be during quiet hours (23:00)
      const mockDate = new Date();
      mockDate.setHours(23, 0, 0, 0);
      vi.setSystemTime(mockDate);

      const canSend = await notificationService.checkQuietHours("test-user");
      expect(canSend).toBe(false);

      vi.useRealTimers();
    });

    it("should batch notifications to prevent spam", async () => {
      const notifications = [
        { title: "Alert 1", message: "Message 1", type: "info" },
        { title: "Alert 2", message: "Message 2", type: "warning" },
        { title: "Alert 3", message: "Message 3", type: "error" },
      ];

      const result = await notificationService.batchNotifications(
        "test-user",
        notifications
      );

      expect(result.success).toBe(true);
      expect(result.batched).toBe(true);
      expect(result.count).toBe(3);
    });
  });

  describe("Notification Analytics", () => {
    it("should track notification delivery", async () => {
      const notification = {
        title: "Test",
        message: "Test message",
        type: "info",
        userId: "test-user",
      };

      await notificationService.sendNotification(notification);

      expect(mockSupabase.from).toHaveBeenCalledWith("notification_analytics");
    });

    it("should track notification engagement", async () => {
      const engagementData = {
        notificationId: "test-notification-id",
        action: "clicked",
        timestamp: new Date().toISOString(),
      };

      const result = await notificationService.trackEngagement(engagementData);

      expect(result.success).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith("notification_analytics");
    });

    it("should generate delivery reports", async () => {
      const mockAnalytics = [
        { channel: "email", delivered: 100, opened: 80, clicked: 30 },
        { channel: "browser", delivered: 150, opened: 120, clicked: 45 },
        { channel: "mobile", delivered: 200, opened: 180, clicked: 90 },
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: mockAnalytics,
          error: null,
        }),
      });

      const report = await notificationService.generateDeliveryReport(
        "2024-01-01",
        "2024-01-31"
      );

      expect(report).toBeDefined();
      expect(report.totalDelivered).toBe(450);
      expect(report.totalOpened).toBe(380);
      expect(report.totalClicked).toBe(165);
      expect(report.overallOpenRate).toBeCloseTo(0.844, 2);
      expect(report.overallClickRate).toBeCloseTo(0.367, 2);
    });
  });

  describe("Error Handling", () => {
    it("should handle database errors gracefully", async () => {
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Database error" },
        }),
      });

      const result = await notificationService.sendNotification({
        title: "Test",
        message: "Test message",
        type: "info",
        userId: "test-user",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should handle browser notification permission denial", async () => {
      globalThis.Notification.permission = "denied";

      const result = await notificationService.sendBrowserNotification({
        title: "Test",
        message: "Test message",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("permission");
    });

    it("should validate notification data", async () => {
      const invalidNotification = {
        // Missing required fields
        message: "Test message",
      };

      const result = await notificationService.sendNotification(
        invalidNotification
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("validation");
    });
  });
});
