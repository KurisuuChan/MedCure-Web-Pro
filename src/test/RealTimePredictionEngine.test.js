import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RealTimePredictionEngine } from "../services/realTimePredictionEngine.js";

// Mock MLService
vi.mock("../services/mlService.js", () => ({
  MLService: vi.fn(() => ({
    generateDemandForecast: vi.fn().mockResolvedValue({
      productId: 1,
      predictions: [
        { date: "2024-01-01", demand: 10, confidence: 0.8 },
        { date: "2024-01-02", demand: 12, confidence: 0.85 },
      ],
      confidence: 0.8,
    }),
    optimizeInventory: vi.fn().mockResolvedValue({
      productId: 1,
      currentStock: 50,
      recommendedOrder: 100,
      urgency: "medium",
    }),
    detectAnomalies: vi
      .fn()
      .mockResolvedValue([
        { date: "2024-01-01", value: 1000, severity: "high" },
      ]),
  })),
}));

// Mock NotificationService
vi.mock("../services/notificationService.js", () => ({
  NotificationService: vi.fn(() => ({
    sendInventoryAlert: vi.fn().mockResolvedValue({ success: true }),
    sendDemandSurgeAlert: vi.fn().mockResolvedValue({ success: true }),
    sendAnomalyAlert: vi.fn().mockResolvedValue({ success: true }),
  })),
}));

// Mock Supabase
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      data: [
        { id: 1, name: "Product 1", current_stock: 50 },
        { id: 2, name: "Product 2", current_stock: 20 },
      ],
      error: null,
    })),
  })),
};

describe("RealTimePredictionEngine", () => {
  let engine;
  let mockCallback;

  beforeEach(() => {
    engine = new RealTimePredictionEngine(mockSupabase);
    mockCallback = vi.fn();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    engine.stop();
    vi.useRealTimers();
  });

  describe("Engine Lifecycle", () => {
    it("should start the prediction engine", async () => {
      await engine.start();

      expect(engine.isRunning()).toBe(true);
      expect(engine.getStatus().isRunning).toBe(true);
    });

    it("should stop the prediction engine", async () => {
      await engine.start();
      engine.stop();

      expect(engine.isRunning()).toBe(false);
      expect(engine.getStatus().isRunning).toBe(false);
    });

    it("should handle multiple start calls gracefully", async () => {
      await engine.start();
      await engine.start(); // Should not throw error

      expect(engine.isRunning()).toBe(true);
    });

    it("should handle stop calls when not running", () => {
      engine.stop(); // Should not throw error

      expect(engine.isRunning()).toBe(false);
    });
  });

  describe("Subscription Management", () => {
    it("should add subscribers", () => {
      const subscriptionId = engine.subscribe(mockCallback);

      expect(subscriptionId).toBeDefined();
      expect(typeof subscriptionId).toBe("string");
    });

    it("should remove subscribers", () => {
      const subscriptionId = engine.subscribe(mockCallback);
      engine.unsubscribe(subscriptionId);

      // Callback should not be called after unsubscribing
      engine.notifySubscribers({ type: "test", data: {} });
      expect(mockCallback).not.toHaveBeenCalled();
    });

    it("should notify all subscribers", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      engine.subscribe(callback1);
      engine.subscribe(callback2);

      const predictionData = {
        type: "inventory_alert",
        data: { productId: 1 },
      };
      engine.notifySubscribers(predictionData);

      expect(callback1).toHaveBeenCalledWith(predictionData);
      expect(callback2).toHaveBeenCalledWith(predictionData);
    });

    it("should handle subscriber callback errors gracefully", () => {
      const errorCallback = vi.fn().mockImplementation(() => {
        throw new Error("Callback error");
      });
      const normalCallback = vi.fn();

      engine.subscribe(errorCallback);
      engine.subscribe(normalCallback);

      const predictionData = { type: "test", data: {} };

      // Should not throw error and should still call other callbacks
      expect(() => engine.notifySubscribers(predictionData)).not.toThrow();
      expect(normalCallback).toHaveBeenCalledWith(predictionData);
    });
  });

  describe("Prediction Processing", () => {
    it("should run predictions on update cycle", async () => {
      await engine.start();

      // Fast forward time to trigger update
      vi.advanceTimersByTime(5 * 60 * 1000); // 5 minutes

      expect(engine.getStatus().lastUpdate).toBeDefined();
      expect(engine.getStatus().updateCount).toBeGreaterThan(0);
    });

    it("should process inventory predictions", async () => {
      const callback = vi.fn();
      engine.subscribe(callback);

      await engine.runPredictions();

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "inventory_prediction",
          data: expect.objectContaining({
            productId: expect.any(Number),
            currentStock: expect.any(Number),
            recommendedOrder: expect.any(Number),
          }),
        })
      );
    });

    it("should process demand forecasts", async () => {
      const callback = vi.fn();
      engine.subscribe(callback);

      await engine.runPredictions();

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "demand_forecast",
          data: expect.objectContaining({
            productId: expect.any(Number),
            predictions: expect.any(Array),
          }),
        })
      );
    });

    it("should detect and report anomalies", async () => {
      const callback = vi.fn();
      engine.subscribe(callback);

      await engine.runPredictions();

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "anomaly_detected",
          data: expect.objectContaining({
            date: expect.any(String),
            severity: expect.any(String),
          }),
        })
      );
    });
  });

  describe("Performance Monitoring", () => {
    it("should track prediction performance", async () => {
      await engine.start();
      await engine.runPredictions();

      const stats = engine.getPerformanceStats();

      expect(stats).toBeDefined();
      expect(stats.totalPredictions).toBeGreaterThan(0);
      expect(stats.averageProcessingTime).toBeGreaterThan(0);
      expect(stats.successRate).toBeGreaterThan(0);
    });

    it("should reset performance stats", async () => {
      await engine.runPredictions();
      engine.resetPerformanceStats();

      const stats = engine.getPerformanceStats();

      expect(stats.totalPredictions).toBe(0);
      expect(stats.averageProcessingTime).toBe(0);
      expect(stats.successRate).toBe(0);
    });

    it("should track error rates", async () => {
      // Mock ML service to throw error
      const mockMLService = engine.mlService;
      mockMLService.generateDemandForecast.mockRejectedValueOnce(
        new Error("ML Error")
      );

      await engine.runPredictions();

      const stats = engine.getPerformanceStats();
      expect(stats.errorRate).toBeGreaterThan(0);
    });
  });

  describe("Configuration", () => {
    it("should update prediction interval", () => {
      const newInterval = 10 * 60 * 1000; // 10 minutes
      engine.updateConfig({ updateInterval: newInterval });

      const config = engine.getConfig();
      expect(config.updateInterval).toBe(newInterval);
    });

    it("should toggle notification triggers", () => {
      engine.updateConfig({ enableNotifications: false });

      const config = engine.getConfig();
      expect(config.enableNotifications).toBe(false);
    });

    it("should validate configuration values", () => {
      expect(() => {
        engine.updateConfig({ updateInterval: -1000 });
      }).toThrow("Invalid update interval");

      expect(() => {
        engine.updateConfig({ maxRetries: -1 });
      }).toThrow("Invalid max retries");
    });
  });

  describe("Error Handling", () => {
    it("should handle ML service errors gracefully", async () => {
      const mockMLService = engine.mlService;
      mockMLService.generateDemandForecast.mockRejectedValue(
        new Error("ML Error")
      );

      await expect(engine.runPredictions()).resolves.not.toThrow();

      const status = engine.getStatus();
      expect(status.lastError).toBeDefined();
    });

    it("should retry failed predictions", async () => {
      const mockMLService = engine.mlService;
      mockMLService.generateDemandForecast
        .mockRejectedValueOnce(new Error("Temporary error"))
        .mockResolvedValueOnce({
          productId: 1,
          predictions: [],
          confidence: 0.5,
        });

      await engine.runPredictions();

      // Should have retried the failed prediction
      expect(mockMLService.generateDemandForecast).toHaveBeenCalledTimes(2);
    });

    it("should stop retrying after max attempts", async () => {
      engine.updateConfig({ maxRetries: 2 });

      const mockMLService = engine.mlService;
      mockMLService.generateDemandForecast.mockRejectedValue(
        new Error("Persistent error")
      );

      await engine.runPredictions();

      // Should have tried original + 2 retries = 3 total
      expect(mockMLService.generateDemandForecast).toHaveBeenCalledTimes(3);
    });
  });

  describe("Data Caching", () => {
    it("should cache prediction results", async () => {
      await engine.runPredictions();

      const cachedData = engine.getCachedPredictions(1);
      expect(cachedData).toBeDefined();
      expect(cachedData.productId).toBe(1);
    });

    it("should invalidate expired cache entries", async () => {
      await engine.runPredictions();

      // Fast forward time beyond cache expiry
      vi.advanceTimersByTime(2 * 60 * 60 * 1000); // 2 hours

      const cachedData = engine.getCachedPredictions(1);
      expect(cachedData).toBeNull();
    });

    it("should clear cache on demand", async () => {
      await engine.runPredictions();
      engine.clearCache();

      const cachedData = engine.getCachedPredictions(1);
      expect(cachedData).toBeNull();
    });
  });

  describe("Integration", () => {
    it("should integrate with notification system", async () => {
      const callback = vi.fn();
      engine.subscribe(callback);

      await engine.runPredictions();

      // Should have triggered notifications for urgent inventory
      expect(engine.notificationService.sendInventoryAlert).toHaveBeenCalled();
    });

    it("should provide prediction data to dashboard", async () => {
      await engine.runPredictions();

      const dashboardData = engine.getDashboardData();

      expect(dashboardData).toBeDefined();
      expect(dashboardData.recentPredictions).toBeDefined();
      expect(dashboardData.performanceMetrics).toBeDefined();
      expect(dashboardData.systemStatus).toBeDefined();
    });

    it("should export prediction history", async () => {
      await engine.runPredictions();

      const exportData = engine.exportPredictionHistory(
        "2024-01-01",
        "2024-01-31"
      );

      expect(exportData).toBeDefined();
      expect(exportData.predictions).toBeDefined();
      expect(exportData.metadata).toBeDefined();
    });
  });
});
