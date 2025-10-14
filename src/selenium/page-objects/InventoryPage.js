/**
 * Inventory Page Object Model
 * Represents the inventory management page
 */

import { By } from "selenium-webdriver";
import { config } from "../config/test.config.js";
import {
  waitAndClick,
  isElementVisible,
  clickButtonByText,
  findButtonByText,
  typeText,
} from "../helpers/utils.js";

export class InventoryPage {
  constructor(driver) {
    this.driver = driver;
    this.url = `${config.baseUrl}/inventory`;

    // Locators
    this.locators = {
      // Search
      searchInput: By.css('input[type="text"][placeholder*="Search"]'),

      // Tabs
      productsTab: By.xpath('//button[@role="tab"][contains(., "Products")]'),
      analyticsTab: By.xpath('//button[@role="tab"][contains(., "Analytics")]'),

      // Main content
      inventoryContainer: By.css('main, div[class*="inventory"]'),
    };
  }

  /**
   * Navigate to inventory page
   */
  async open() {
    await this.driver.get(this.url);
    await this.driver.sleep(3000); // Wait for page to load
  }

  /**
   * Check if page loaded successfully
   * @returns {Promise<boolean>}
   */
  async isInventoryLoaded() {
    return await isElementVisible(this.driver, this.locators.searchInput);
  }

  /**
   * Search for a product
   * @param {string} searchTerm
   */
  async searchProduct(searchTerm) {
    await typeText(this.driver, this.locators.searchInput, searchTerm);
    await this.driver.sleep(1000); // Wait for search results
  }

  /**
   * Click the export button
   */
  async clickExport() {
    await clickButtonByText(this.driver, "Export");
  }

  /**
   * Click the import button
   */
  async clickImport() {
    await clickButtonByText(this.driver, "Import");
  }

  /**
   * Click the add product button
   */
  async clickAddProduct() {
    await clickButtonByText(this.driver, "Add Product");
  }

  /**
   * Click the filters button
   */
  async clickFilters() {
    await clickButtonByText(this.driver, "Filters");
  }

  /**
   * Click the refresh button
   */
  async clickRefresh() {
    await clickButtonByText(this.driver, "Refresh");
  }

  /**
   * Switch to Products tab
   */
  async goToProductsTab() {
    await waitAndClick(this.driver, this.locators.productsTab);
    await this.driver.sleep(1000);
  }

  /**
   * Switch to Analytics & Reports tab
   */
  async goToAnalyticsTab() {
    await waitAndClick(this.driver, this.locators.analyticsTab);
    await this.driver.sleep(1000);
  }

  /**
   * Check if export button is visible
   * @returns {Promise<boolean>}
   */
  async hasExportButton() {
    try {
      await findButtonByText(this.driver, "Export");
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if import button is visible
   * @returns {Promise<boolean>}
   */
  async hasImportButton() {
    try {
      await findButtonByText(this.driver, "Import");
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if add product button is visible
   * @returns {Promise<boolean>}
   */
  async hasAddProductButton() {
    try {
      await findButtonByText(this.driver, "Add Product");
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if filters button is visible
   * @returns {Promise<boolean>}
   */
  async hasFiltersButton() {
    try {
      await findButtonByText(this.driver, "Filters");
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if Analytics & Reports tab is visible
   * @returns {Promise<boolean>}
   */
  async hasAnalyticsTab() {
    return await isElementVisible(this.driver, this.locators.analyticsTab);
  }
}

export default InventoryPage;
