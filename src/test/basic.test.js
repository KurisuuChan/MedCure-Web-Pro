import { describe, it, expect } from "vitest";

describe("Basic Testing Framework", () => {
  it("should run basic tests", () => {
    expect(1 + 1).toBe(2);
    expect("hello").toBe("hello");
    expect(true).toBe(true);
  });

  it("should test arrays and objects", () => {
    const arr = [1, 2, 3];
    expect(arr).toHaveLength(3);
    expect(arr).toContain(2);

    const obj = { name: "Test", value: 42 };
    expect(obj).toHaveProperty("name");
    expect(obj.name).toBe("Test");
  });

  it("should test async operations", async () => {
    const asyncFunction = () => Promise.resolve("success");
    const result = await asyncFunction();
    expect(result).toBe("success");
  });

  it("should test error handling", () => {
    const errorFunction = () => {
      throw new Error("Test error");
    };

    expect(errorFunction).toThrow("Test error");
  });

  it("should test with mock data", () => {
    const mockData = globalThis.test_helpers.mockProduct;

    expect(mockData).toBeDefined();
    expect(mockData.name).toBe("Test Product");
    expect(mockData.price).toBe(10.99);
    expect(mockData.quantity).toBe(100);
  });
});
