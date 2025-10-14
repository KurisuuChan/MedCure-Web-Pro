/**
 * Inventory Tests
 * Tests for inventory management functionality
 */

import { describe, it, before, after } from "mocha";
import { expect } from "chai";
import { By } from "selenium-webdriver";
import { createDriver, quitDriver } from "../helpers/driver.js";
import {
  takeScreenshot,
  waitForPageLoad,
  isElementVisible,
} from "../helpers/utils.js";
import LoginPage from "../page-objects/LoginPage.js";
import InventoryPage from "../page-objects/InventoryPage.js";

describe("Inventory Management", function () {
  this.timeout(30000);

  let driver;
  let loginPage;
  let inventoryPage;

  before(async function () {
    driver = await createDriver();
    loginPage = new LoginPage(driver);
    inventoryPage = new InventoryPage(driver);

    // Login as admin
    await loginPage.loginAsAdmin();
    await waitForPageLoad(driver);
  });

  after(async function () {
    await quitDriver(driver);
  });

  it("should load inventory page", async function () {
    await inventoryPage.open();

    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).to.include("/inventory");

    // Verify page loaded by checking for page heading "Inventory Management"
    const pageHeading = await isElementVisible(
      driver,
      By.xpath('//h1[text()="Inventory Management"]')
    );
    expect(pageHeading).to.be.true;
    await takeScreenshot(driver, "inventory-page-loaded");
  });

  it("should have inventory search functionality", async function () {
    await inventoryPage.open();

    const isLoaded = await inventoryPage.isInventoryLoaded();
    expect(isLoaded).to.be.true;

    await inventoryPage.searchProduct("paracetamol");
    await takeScreenshot(driver, "inventory-search-results");
  });

  it("should display export and import buttons", async function () {
    await inventoryPage.open();

    const hasExport = await inventoryPage.hasExportButton();
    expect(hasExport).to.be.true;

    const hasImport = await inventoryPage.hasImportButton();
    expect(hasImport).to.be.true;

    await takeScreenshot(driver, "inventory-export-import-buttons");
  });

  it("should display add product button", async function () {
    await inventoryPage.open();

    const hasAddProduct = await inventoryPage.hasAddProductButton();
    expect(hasAddProduct).to.be.true;

    await takeScreenshot(driver, "inventory-add-product-button");
  });

  it("should have filters button", async function () {
    await inventoryPage.open();

    const hasFilters = await inventoryPage.hasFiltersButton();
    expect(hasFilters).to.be.true;

    await takeScreenshot(driver, "inventory-filters-button");
  });

  it("should have Analytics & Reports tab", async function () {
    await inventoryPage.open();

    const hasAnalytics = await inventoryPage.hasAnalyticsTab();
    expect(hasAnalytics).to.be.true;

    await takeScreenshot(driver, "inventory-analytics-tab");
  });
});
