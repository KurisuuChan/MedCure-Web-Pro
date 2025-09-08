import { describe, it, expect, vi, beforeEach } from "vitest";
import { MLService } from "../services/mlService.js";

// Mock Supabase
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        gte: vi.fn(() => ({
          data: [],
          error: null,
        })),
      })),
    })),
  })),
};

describe("MLService", () => {
  let mlService;

  beforeEach(() => {
    mlService = new MLService(mockSupabase);
    vi.clearAllMocks();
  });

  describe("Demand Forecasting", () => {
    it("should generate demand forecast for a product", async () => {
      const mockSalesData = [
        { sale_date: "2024-01-01", quantity: 10 },
        { sale_date: "2024-01-02", quantity: 15 },
        { sale_date: "2024-01-03", quantity: 12 },
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockResolvedValue({
              data: mockSalesData,
              error: null,
            }),
          }),
        }),
      });

      const forecast = await mlService.generateDemandForecast(1, 7);

      expect(forecast).toBeDefined();
      expect(forecast.productId).toBe(1);
      expect(forecast.predictions).toHaveLength(7);
      expect(forecast.confidence).toBeGreaterThan(0);
      expect(forecast.confidence).toBeLessThanOrEqual(1);
    });

    it("should handle products with no sales history", async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });

      const forecast = await mlService.generateDemandForecast(999, 7);

      expect(forecast).toBeDefined();
      expect(forecast.productId).toBe(999);
      expect(forecast.predictions).toHaveLength(7);
      // Should use baseline prediction for products with no history
      expect(forecast.predictions.every((p) => p.demand >= 0)).toBe(true);
    });

    it("should generate seasonal forecasts", async () => {
      const mockSeasonalData = Array.from({ length: 365 }, (_, i) => ({
        sale_date: new Date(2024, 0, i + 1).toISOString().split("T")[0],
        quantity: Math.sin((i * 2 * Math.PI) / 365) * 5 + 10, // Seasonal pattern
      }));

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockResolvedValue({
              data: mockSeasonalData,
              error: null,
            }),
          }),
        }),
      });

      const forecast = await mlService.generateSeasonalForecast(1, 30);

      expect(forecast).toBeDefined();
      expect(forecast.seasonalPattern).toBeDefined();
      expect(forecast.predictions).toHaveLength(30);
    });
  });

  describe("Price Optimization", () => {
    it("should generate optimal pricing recommendations", async () => {
      const mockData = {
        sales: [
          { price: 10, quantity: 100, profit_margin: 0.3 },
          { price: 12, quantity: 80, profit_margin: 0.35 },
          { price: 15, quantity: 60, profit_margin: 0.4 },
        ],
        competitors: [
          { price: 11, market_share: 0.3 },
          { price: 13, market_share: 0.25 },
        ],
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockData.sales,
            error: null,
          }),
        }),
      });

      const pricing = await mlService.optimizePrice(1, mockData.competitors);

      expect(pricing).toBeDefined();
      expect(pricing.recommendedPrice).toBeGreaterThan(0);
      expect(pricing.priceElasticity).toBeDefined();
      expect(pricing.confidence).toBeGreaterThan(0);
      expect(pricing.reasoning).toBeDefined();
    });

    it("should handle competitive pricing analysis", async () => {
      const competitors = [
        { price: 10, market_share: 0.4 },
        { price: 12, market_share: 0.3 },
        { price: 15, market_share: 0.2 },
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      const pricing = await mlService.optimizePrice(1, competitors);

      expect(pricing.competitiveAnalysis).toBeDefined();
      expect(pricing.marketPosition).toBeDefined();
    });
  });

  describe("Inventory Optimization", () => {
    it("should generate reorder recommendations", async () => {
      const mockInventory = {
        current_stock: 50,
        reorder_point: 20,
        max_stock: 200,
        lead_time_days: 7,
      };

      const mockSales = Array.from({ length: 30 }, (_, i) => ({
        sale_date: new Date(Date.now() - i * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        quantity: Math.floor(Math.random() * 10) + 5,
      }));

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockInventory,
              error: null,
            }),
            gte: vi.fn().mockResolvedValue({
              data: mockSales,
              error: null,
            }),
          }),
        }),
      });

      const recommendation = await mlService.optimizeInventory(1);

      expect(recommendation).toBeDefined();
      expect(recommendation.currentStock).toBe(50);
      expect(recommendation.recommendedOrder).toBeGreaterThanOrEqual(0);
      expect(recommendation.urgency).toBeDefined();
    });

    it("should identify overstocked items", async () => {
      const mockInventory = {
        current_stock: 1000,
        reorder_point: 20,
        max_stock: 200,
        lead_time_days: 7,
      };

      const mockSales = []; // No recent sales

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockInventory,
              error: null,
            }),
            gte: vi.fn().mockResolvedValue({
              data: mockSales,
              error: null,
            }),
          }),
        }),
      });

      const recommendation = await mlService.optimizeInventory(1);

      expect(recommendation.urgency).toBe("overstock");
      expect(recommendation.recommendedOrder).toBe(0);
    });
  });

  describe("Customer Segmentation", () => {
    it("should segment customers based on purchase behavior", async () => {
      const mockCustomers = [
        {
          customer_id: 1,
          total_spent: 1000,
          visit_frequency: 10,
          avg_basket: 100,
        },
        {
          customer_id: 2,
          total_spent: 100,
          visit_frequency: 2,
          avg_basket: 50,
        },
        {
          customer_id: 3,
          total_spent: 5000,
          visit_frequency: 20,
          avg_basket: 250,
        },
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: mockCustomers,
          error: null,
        }),
      });

      const segmentation = await mlService.segmentCustomers();

      expect(segmentation).toBeDefined();
      expect(segmentation.segments).toBeDefined();
      expect(segmentation.insights).toBeDefined();
      expect(Array.isArray(segmentation.segments)).toBe(true);
    });

    it("should generate personalized recommendations", async () => {
      const customerId = 1;
      const mockPurchaseHistory = [
        { product_id: 1, category: "medication", quantity: 2 },
        { product_id: 5, category: "supplements", quantity: 1 },
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockPurchaseHistory,
            error: null,
          }),
        }),
      });

      const recommendations =
        await mlService.generatePersonalizedRecommendations(customerId);

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0]).toHaveProperty("productId");
      expect(recommendations[0]).toHaveProperty("score");
      expect(recommendations[0]).toHaveProperty("reasoning");
    });
  });

  describe("Predictive Analytics", () => {
    it("should predict sales performance", async () => {
      const mockData = {
        historicalSales: Array.from({ length: 90 }, (_, i) => ({
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          revenue: Math.random() * 1000 + 500,
        })),
        marketFactors: {
          seasonality: 1.2,
          economic_index: 0.95,
          competition_level: 0.8,
        },
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: mockData.historicalSales,
          error: null,
        }),
      });

      const prediction = await mlService.predictSalesPerformance(
        30,
        mockData.marketFactors
      );

      expect(prediction).toBeDefined();
      expect(prediction.predictions).toHaveLength(30);
      expect(prediction.trendAnalysis).toBeDefined();
      expect(prediction.confidence).toBeGreaterThan(0);
    });

    it("should detect anomalies in sales patterns", async () => {
      const mockSalesData = [
        ...Array.from({ length: 30 }, (_, i) => ({
          date: `2024-01-${i + 1}`,
          revenue: 1000,
        })),
        { date: "2024-01-31", revenue: 5000 }, // Anomaly
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: mockSalesData,
          error: null,
        }),
      });

      const anomalies = await mlService.detectAnomalies(mockSalesData);

      expect(anomalies).toBeDefined();
      expect(Array.isArray(anomalies)).toBe(true);
      expect(anomalies.length).toBeGreaterThan(0);
      expect(anomalies[0]).toHaveProperty("date");
      expect(anomalies[0]).toHaveProperty("severity");
    });
  });
});
