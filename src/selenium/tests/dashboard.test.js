/**
 * Dashboard Tests
 * Tests for dashboard functionality
 */

import { describe, it, before, after } from "mocha";
import { expect } from "chai";
import { createDriver, quitDriver } from "../helpers/driver.js";
import { takeScreenshot, waitForPageLoad } from "../helpers/utils.js";
import LoginPage from "../page-objects/LoginPage.js";
import DashboardPage from "../page-objects/DashboardPage.js";

describe("Dashboard Functionality", function () {
  this.timeout(30000);

  let driver;
  let loginPage;
  let dashboardPage;

  before(async function () {
    driver = await createDriver();
    loginPage = new LoginPage(driver);
    dashboardPage = new DashboardPage(driver);

    // Login before running dashboard tests
    await loginPage.loginAsAdmin();
    await waitForPageLoad(driver);
  });

  after(async function () {
    await quitDriver(driver);
  });

  it("should display dashboard after successful login", async function () {
    await dashboardPage.open();
    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).to.include("/dashboard");

    // Verify dashboard loaded
    const isDashboardLoaded = await dashboardPage.isDashboardLoaded();
    expect(isDashboardLoaded).to.be.true;
    await takeScreenshot(driver, "dashboard-loaded");
  });

  it("should display alerts button on dashboard", async function () {
    await dashboardPage.open();
    await driver.sleep(2000); // Wait for dashboard to fully load

    const hasAlerts = await dashboardPage.hasAlertsButton();
    expect(hasAlerts).to.be.true;

    // Get alert count
    const alertCount = await dashboardPage.getAlertCount();
    console.log(`Alert count: ${alertCount}`);

    await takeScreenshot(driver, "dashboard-alerts");
  });

  it("should navigate to inventory page", async function () {
    await dashboardPage.open();
    await dashboardPage.goToInventory();
    await driver.sleep(2000);

    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).to.include("/inventory");
    await takeScreenshot(driver, "dashboard-navigate-inventory");
  });

  it("should navigate to POS page", async function () {
    await dashboardPage.open();
    await dashboardPage.goToPOS();
    await driver.sleep(2000);

    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).to.include("/pos");
    await takeScreenshot(driver, "dashboard-navigate-pos");
  });

  it("should navigate to batch management page", async function () {
    await dashboardPage.open();
    await dashboardPage.goToBatchManagement();
    await driver.sleep(2000);

    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).to.include("/batch-management");
    await takeScreenshot(driver, "dashboard-navigate-batch");
  });

  it("should be able to click refresh button", async function () {
    await dashboardPage.open();
    await driver.sleep(1000);

    await dashboardPage.clickRefresh();
    await driver.sleep(1000);

    // Verify still on dashboard
    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).to.include("/dashboard");
    await takeScreenshot(driver, "dashboard-refresh");
  });

  it("should be able to change time period filter", async function () {
    await dashboardPage.open();
    await driver.sleep(1000);

    // Try changing to 30 days
    await dashboardPage.selectTimePeriod("30days");
    await driver.sleep(1000);

    // Verify still on dashboard
    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).to.include("/dashboard");
    await takeScreenshot(driver, "dashboard-time-filter");
  });
});
