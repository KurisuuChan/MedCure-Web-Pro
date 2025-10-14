/**
 * Selenium Test Configuration
 * Central configuration for all Selenium WebDriver tests
 */

/* eslint-env node */

export const config = {
  // Base URL for the application
  baseUrl: process.env.TEST_BASE_URL || "http://localhost:5173",

  // Browser settings
  browser: {
    name: process.env.BROWSER || "edge",
    headless: process.env.HEADLESS === "true",
    windowSize: {
      width: 1920,
      height: 1080,
    },
  },

  // Timeout settings (in milliseconds)
  timeouts: {
    implicit: 10000, // Default wait for element
    explicit: 20000, // Explicit wait timeout
    pageLoad: 30000, // Page load timeout
    script: 15000, // Script execution timeout
  },

  // Test user credentials (use environment variables in production)
  testUsers: {
    admin: {
      email: process.env.TEST_ADMIN_EMAIL || "admin@medcure.com",
      password: process.env.TEST_ADMIN_PASSWORD || "123456",
    },
    staff: {
      email: process.env.TEST_STAFF_EMAIL || "staff@medcure.com",
      password: process.env.TEST_STAFF_PASSWORD || "123456",
    },
    cashier: {
      email: process.env.TEST_CASHIER_EMAIL || "cashier@medcure.com",
      password: process.env.TEST_CASHIER_PASSWORD || "123456",
    },
  },

  // Screenshot settings
  screenshots: {
    enabled: true,
    onFailure: true,
    directory: "./selenium/screenshots",
  },

  // Reporting
  reports: {
    directory: "./selenium/reports",
    format: "html",
  },

  // Chrome-specific options (also work for Edge since it's Chromium-based)
  chromeOptions: [
    "--disable-gpu",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--disable-blink-features=AutomationControlled",
    "--window-size=1920,1080",
  ],

  // Retry configuration
  retry: {
    maxRetries: 2,
    retryDelay: 1000,
  },
};

export default config;
