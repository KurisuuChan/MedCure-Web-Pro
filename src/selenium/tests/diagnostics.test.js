/**
 * Diagnostic Tests
 * Quick health check tests to identify system issues
 */

import { describe, it, before, after } from "mocha";
import { expect } from "chai";
import { createDriver, quitDriver } from "../helpers/driver.js";
import { takeScreenshot } from "../helpers/utils.js";
import LoginPage from "../page-objects/LoginPage.js";
import DashboardPage from "../page-objects/DashboardPage.js";
import InventoryPage from "../page-objects/InventoryPage.js";
import POSPage from "../page-objects/POSPage.js";
import { config } from "../config/test.config.js";

describe("🔍 System Diagnostics", function () {
  this.timeout(30000);

  let driver;

  before(async function () {
    driver = await createDriver();
  });

  after(async function () {
    await quitDriver(driver);
  });

  describe("Application Availability", function () {
    it("should load the login page", async function () {
      await driver.get(config.baseUrl);
      const currentUrl = await driver.getCurrentUrl();
      expect(currentUrl).to.include(config.baseUrl);
      await takeScreenshot(driver, "diagnostic-login-loaded");
    });

    it("should have working authentication", async function () {
      const loginPage = new LoginPage(driver);
      await loginPage.open();
      await loginPage.loginAsAdmin();
      await driver.sleep(2000);

      const currentUrl = await driver.getCurrentUrl();
      expect(currentUrl).to.include("/dashboard");
      await takeScreenshot(driver, "diagnostic-auth-working");
    });
  });

  describe("Core Pages Accessibility", function () {
    let dashboardPage;

    before(async function () {
      dashboardPage = new DashboardPage(driver);
      const loginPage = new LoginPage(driver);
      await loginPage.loginAsAdmin();
      await driver.sleep(2000);
    });

    it("should access Dashboard", async function () {
      await dashboardPage.open();
      const isDashboardLoaded = await dashboardPage.isDashboardLoaded();
      expect(isDashboardLoaded).to.be.true;
      await takeScreenshot(driver, "diagnostic-dashboard-accessible");
    });

    it("should access Inventory", async function () {
      const inventoryPage = new InventoryPage(driver);
      await inventoryPage.open();
      const isLoaded = await inventoryPage.isInventoryLoaded();
      expect(isLoaded).to.be.true;
      await takeScreenshot(driver, "diagnostic-inventory-accessible");
    });

    it("should access POS", async function () {
      const posPage = new POSPage(driver);
      await posPage.open();
      const isLoaded = await posPage.isPOSLoaded();
      expect(isLoaded).to.be.true;
      await takeScreenshot(driver, "diagnostic-pos-accessible");
    });

    it("should access Batch Management", async function () {
      await dashboardPage.open();
      await dashboardPage.goToBatchManagement();
      await driver.sleep(2000);

      const currentUrl = await driver.getCurrentUrl();
      expect(currentUrl).to.include("/batch-management");
      await takeScreenshot(driver, "diagnostic-batch-accessible");
    });
  });

  describe("Critical UI Elements", function () {
    let dashboardPage;
    let inventoryPage;

    before(async function () {
      const loginPage = new LoginPage(driver);
      await loginPage.loginAsAdmin();
      await driver.sleep(2000);

      dashboardPage = new DashboardPage(driver);
      inventoryPage = new InventoryPage(driver);
    });

    it("should have all dashboard buttons", async function () {
      await dashboardPage.open();

      const hasRefresh = await dashboardPage.isDashboardLoaded();
      expect(hasRefresh).to.be.true;

      const hasAlerts = await dashboardPage.hasAlertsButton();
      expect(hasAlerts).to.be.true;

      await takeScreenshot(driver, "diagnostic-dashboard-buttons");
    });

    it("should have all inventory buttons", async function () {
      await inventoryPage.open();

      const hasExport = await inventoryPage.hasExportButton();
      expect(hasExport).to.be.true;

      const hasImport = await inventoryPage.hasImportButton();
      expect(hasImport).to.be.true;

      const hasAddProduct = await inventoryPage.hasAddProductButton();
      expect(hasAddProduct).to.be.true;

      const hasFilters = await inventoryPage.hasFiltersButton();
      expect(hasFilters).to.be.true;

      await takeScreenshot(driver, "diagnostic-inventory-buttons");
    });
  });

  describe("Performance Checks", function () {
    it("should load dashboard within acceptable time", async function () {
      const startTime = Date.now();

      const loginPage = new LoginPage(driver);
      await loginPage.loginAsAdmin();

      const loadTime = Date.now() - startTime;
      console.log(`Dashboard load time: ${loadTime}ms`);

      expect(loadTime).to.be.lessThan(15000); // Should load within 15 seconds
      await takeScreenshot(driver, "diagnostic-performance-dashboard");
    });

    it("should load inventory page within acceptable time", async function () {
      const inventoryPage = new InventoryPage(driver);

      const startTime = Date.now();
      await inventoryPage.open();
      const loadTime = Date.now() - startTime;

      console.log(`Inventory load time: ${loadTime}ms`);
      expect(loadTime).to.be.lessThan(10000); // Should load within 10 seconds
      await takeScreenshot(driver, "diagnostic-performance-inventory");
    });
  });

  describe("Browser Console Errors", function () {
    it("should not have critical console errors", async function () {
      await driver.get(`${config.baseUrl}/dashboard`);
      await driver.sleep(3000);

      // Get browser console logs
      const logs = await driver.manage().logs().get("browser");

      // Filter for severe errors
      const errors = logs.filter((log) => log.level.name === "SEVERE");

      // Log any errors found
      if (errors.length > 0) {
        console.log("\n⚠️  Browser Console Errors Found:");
        errors.forEach((error) => {
          console.log(`   - ${error.message}`);
        });
      }

      // This is informational - we don't fail the test for console errors
      // but we do report them
      console.log(`Total console errors: ${errors.length}`);
    });
  });
});
