/**
 * Dashboard Page Object Model
 * Represents the main dashboard page
 */

import { By } from "selenium-webdriver";
import { config } from "../config/test.config.js";
import {
  waitForElement,
  waitAndClick,
  isElementVisible,
  clickButtonByText,
  findButtonByText,
} from "../helpers/utils.js";

export class DashboardPage {
  constructor(driver) {
    this.driver = driver;
    this.url = `${config.baseUrl}/dashboard`;

    // Locators - Based on actual application HTML
    this.locators = {
      // Navigation links (found in sidebar)
      dashboardLink: By.css('a[href="/dashboard"]'),
      posLink: By.css('a[href="/pos"]'),
      inventoryLink: By.css('a[href="/inventory"]'),
      batchManagementLink: By.css('a[href="/batch-management"]'),
      staffManagementLink: By.css('a[href="/user-management"]'),
      systemSettingsLink: By.css('a[href="/system-settings"]'),

      // Buttons found on dashboard
      alertsButton: By.xpath('//button[contains(text(), "Alerts")]'),
      refreshButton: By.xpath('//button[contains(text(), "Refresh")]'),

      // Time period filters
      last7DaysButton: By.xpath('//button[contains(text(), "Last 7 Days")]'),
      last30DaysButton: By.xpath('//button[contains(text(), "Last 30 Days")]'),
      last3MonthsButton: By.xpath(
        '//button[contains(text(), "Last 3 Months")]'
      ),
      lastYearButton: By.xpath('//button[contains(text(), "Last Year")]'),

      // Main content area
      dashboardContainer: By.css(
        'main, [class*="dashboard"], div[class*="container"]'
      ),
    };
  }

  /**
   * Navigate to dashboard
   */
  async open() {
    await this.driver.get(this.url);
    // Wait for dashboard to load by checking for any dashboard element
    // The dashboard might have already loaded, so just give it time
    await this.driver.sleep(3000);
  }

  /**
   * Navigate to POS page
   */
  async goToPOS() {
    await waitAndClick(this.driver, this.locators.posLink);
  }

  /**
   * Navigate to Inventory page
   */
  async goToInventory() {
    await waitAndClick(this.driver, this.locators.inventoryLink);
  }

  /**
   * Navigate to Batch Management page
   */
  async goToBatchManagement() {
    await waitAndClick(this.driver, this.locators.batchManagementLink);
  }

  /**
   * Navigate to Staff Management page
   */
  async goToStaffManagement() {
    await waitAndClick(this.driver, this.locators.staffManagementLink);
  }

  /**
   * Navigate to System Settings page
   */
  async goToSystemSettings() {
    await waitAndClick(this.driver, this.locators.systemSettingsLink);
  }

  /**
   * Click the alerts button
   */
  async clickAlerts() {
    await clickButtonByText(this.driver, "Alerts");
  }

  /**
   * Click the refresh button to reload dashboard data
   */
  async clickRefresh() {
    await clickButtonByText(this.driver, "Refresh");
  }

  /**
   * Select time period filter
   * @param {string} period - '7days', '30days', '3months', or 'year'
   */
  async selectTimePeriod(period) {
    const textMap = {
      "7days": "Last 7 Days",
      "30days": "Last 30 Days",
      "3months": "Last 3 Months",
      year: "Last Year",
    };

    const text = textMap[period];
    if (!text) {
      throw new Error(
        `Invalid period: ${period}. Use '7days', '30days', '3months', or 'year'`
      );
    }

    await clickButtonByText(this.driver, text);
  }

  /**
   * Check if alerts button is visible
   * @returns {Promise<boolean>}
   */
  async hasAlertsButton() {
    try {
      await findButtonByText(this.driver, "Alerts");
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if dashboard loaded successfully
   * @returns {Promise<boolean>}
   */
  async isDashboardLoaded() {
    try {
      await findButtonByText(this.driver, "Refresh");
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get alert count from alerts button text
   * @returns {Promise<string>}
   */
  async getAlertCount() {
    try {
      const alertButton = await findButtonByText(this.driver, "Alerts");
      const text = await alertButton.getText();
      // Extract number from text like "3 Alerts"
      const match = text.match(/(\d+)/);
      return match ? match[1] : "0";
    } catch {
      return "0";
    }
  }
}

export default DashboardPage;
