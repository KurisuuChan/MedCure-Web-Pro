/**
 * Login Page Object Model
 * Represents the login page and its interactions
 */

import { By } from "selenium-webdriver";
import { config } from "../config/test.config.js";
import { waitForElement, waitAndClick, waitForUrl } from "../helpers/utils.js";

export class LoginPage {
  constructor(driver) {
    this.driver = driver;
    this.url = `${config.baseUrl}/login`;

    // Locators - Based on actual application HTML
    this.locators = {
      emailInput: By.css('input[type="email"]'),
      passwordInput: By.css('input[type="password"]'),
      loginButton: By.css('button[type="submit"]'),
      rememberMeCheckbox: By.css('input[type="checkbox"]'),

      // Error indicators - The app shows errors by adding border-red-300 class to inputs
      emailInputWithError: By.css('input[type="email"].border-red-300'),
      passwordInputWithError: By.css('input[type="password"].border-red-300'),

      // Background styling on error
      errorStateInput: By.css(
        'input.bg-red-50\\/50, input[class*="border-red"]'
      ),
    };
  }

  /**
   * Navigate to login page
   */
  async open() {
    await this.driver.get(this.url);
    await waitForElement(this.driver, this.locators.emailInput);
  }

  /**
   * Login with credentials
   * @param {string} email
   * @param {string} password
   */
  async login(email, password) {
    try {
      const emailInput = await waitForElement(
        this.driver,
        this.locators.emailInput,
        5000
      );
      const passwordInput = await waitForElement(
        this.driver,
        this.locators.passwordInput,
        5000
      );

      if (email) {
        await emailInput.clear();
        await emailInput.sendKeys(email);
      }
      if (password) {
        await passwordInput.clear();
        await passwordInput.sendKeys(password);
      }

      await waitAndClick(this.driver, this.locators.loginButton);
    } catch (error) {
      console.error("Error during login:", error.message);
      throw error;
    }
  }

  /**
   * Login as admin user
   */
  async loginAsAdmin() {
    await this.open();
    await this.login(
      config.testUsers.admin.email,
      config.testUsers.admin.password
    );
    await waitForUrl(this.driver, "/dashboard", 15000);
  }

  /**
   * Login as staff user
   */
  async loginAsStaff() {
    await this.open();
    await this.login(
      config.testUsers.staff.email,
      config.testUsers.staff.password
    );
    await waitForUrl(this.driver, "/dashboard", 15000);
  }

  /**
   * Login as cashier user
   */
  async loginAsCashier() {
    await this.open();
    await this.login(
      config.testUsers.cashier.email,
      config.testUsers.cashier.password
    );
    await waitForUrl(this.driver, "/pos", 15000);
  }

  /**
   * Check if error message is displayed by checking for red border on inputs
   * @returns {Promise<boolean>}
   */
  async hasErrorMessage() {
    try {
      // Check if either email or password input has error styling
      const emailElements = await this.driver.findElements(
        this.locators.emailInputWithError
      );
      const passwordElements = await this.driver.findElements(
        this.locators.passwordInputWithError
      );
      return emailElements.length > 0 || passwordElements.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Check if email input has error styling
   * @returns {Promise<boolean>}
   */
  async hasEmailError() {
    try {
      const element = await this.driver.findElement(this.locators.emailInput);
      const className = await element.getAttribute("class");
      return (
        className.includes("border-red-300") || className.includes("bg-red-50")
      );
    } catch {
      return false;
    }
  }

  /**
   * Check if password input has error styling
   * @returns {Promise<boolean>}
   */
  async hasPasswordError() {
    try {
      const element = await this.driver.findElement(
        this.locators.passwordInput
      );
      const className = await element.getAttribute("class");
      return (
        className.includes("border-red-300") || className.includes("bg-red-50")
      );
    } catch {
      return false;
    }
  }

  /**
   * Get error message text (if available in the DOM)
   * Note: The inspection didn't find error text elements, so this may need adjustment
   * @returns {Promise<string>}
   */
  async getErrorMessage() {
    try {
      // Try to find any error text near the form
      const errorElements = await this.driver.findElements(
        By.css('[class*="error"], [class*="text-red"], span.text-red-500')
      );
      if (errorElements.length > 0) {
        return await errorElements[0].getText();
      }
      return "Input has error styling";
    } catch {
      return "No error message found";
    }
  }
}

export default LoginPage;
