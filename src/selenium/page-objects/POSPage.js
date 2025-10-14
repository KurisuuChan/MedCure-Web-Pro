/**
 * POS (Point of Sale) Page Object Model
 * Represents the Point of Sale page and its interactions
 */

import { By } from "selenium-webdriver";
import { config } from "../config/test.config.js";
import { waitForElement, isElementVisible } from "../helpers/utils.js";

export class POSPage {
  constructor(driver) {
    this.driver = driver;
    this.url = `${config.baseUrl}/pos`;

    // Locators - Will need to be adjusted based on actual POS page structure
    this.locators = {
      // Search and product selection
      productSearchInput: By.css(
        'input[placeholder*="Search"], input[type="search"]'
      ),
      productList: By.css('[class*="product"], [class*="item-list"]'),
      addToCartButton: By.xpath('//button[contains(text(), "Add")]'),

      // Cart area
      cartContainer: By.css('[class*="cart"], [class*="order"]'),
      cartItems: By.css('[class*="cart-item"]'),
      clearCartButton: By.xpath('//button[contains(text(), "Clear")]'),

      // Customer section
      customerSearchInput: By.css(
        'input[placeholder*="customer"], input[placeholder*="Customer"]'
      ),
      addCustomerButton: By.xpath('//button[contains(text(), "Add Customer")]'),

      // Payment section
      paymentButton: By.xpath(
        '//button[contains(text(), "Pay")], //button[contains(text(), "Checkout")]'
      ),
      cashPaymentOption: By.xpath('//button[contains(text(), "Cash")]'),
      cardPaymentOption: By.xpath('//button[contains(text(), "Card")]'),
      totalAmountDisplay: By.css('[class*="total"], [class*="amount"]'),

      // Transaction
      completeButton: By.xpath(
        '//button[contains(text(), "Complete")], //button[contains(text(), "Confirm")]'
      ),
      printReceiptButton: By.xpath('//button[contains(text(), "Print")]'),
      newTransactionButton: By.xpath(
        '//button[contains(text(), "New")], //button[contains(text(), "Start")]'
      ),
    };
  }

  /**
   * Navigate to POS page
   */
  async open() {
    await this.driver.get(this.url);
    await this.driver.sleep(2000);
  }

  /**
   * Search for a product
   * @param {string} productName
   */
  async searchProduct(productName) {
    try {
      const searchInput = await waitForElement(
        this.driver,
        this.locators.productSearchInput
      );
      await searchInput.clear();
      await searchInput.sendKeys(productName);
      await this.driver.sleep(1000); // Wait for search results
    } catch (error) {
      console.log(
        "Product search input not found or different selector needed"
      );
      throw error;
    }
  }

  /**
   * Add first product from search results to cart
   */
  async addFirstProductToCart() {
    try {
      const addButton = await waitForElement(
        this.driver,
        this.locators.addToCartButton
      );
      await addButton.click();
      await this.driver.sleep(500);
    } catch (error) {
      console.log("Add to cart button not found");
      throw error;
    }
  }

  /**
   * Check if cart has items
   * @returns {Promise<boolean>}
   */
  async hasCartItems() {
    try {
      const cartItems = await this.driver.findElements(this.locators.cartItems);
      return cartItems.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Get number of items in cart
   * @returns {Promise<number>}
   */
  async getCartItemCount() {
    try {
      const cartItems = await this.driver.findElements(this.locators.cartItems);
      return cartItems.length;
    } catch {
      return 0;
    }
  }

  /**
   * Clear all items from cart
   */
  async clearCart() {
    try {
      const clearButton = await this.driver.findElement(
        this.locators.clearCartButton
      );
      if (await clearButton.isDisplayed()) {
        await clearButton.click();
        await this.driver.sleep(500);
      }
    } catch {
      console.log("Clear cart button not found or not displayed");
    }
  }

  /**
   * Search for customer
   * @param {string} customerName
   */
  async searchCustomer(customerName) {
    try {
      const searchInput = await waitForElement(
        this.driver,
        this.locators.customerSearchInput
      );
      await searchInput.clear();
      await searchInput.sendKeys(customerName);
      await this.driver.sleep(1000);
    } catch {
      console.log("Customer search not available or different selector");
    }
  }

  /**
   * Proceed to payment
   */
  async proceedToPayment() {
    try {
      const paymentButton = await waitForElement(
        this.driver,
        this.locators.paymentButton
      );
      await paymentButton.click();
      await this.driver.sleep(1000);
    } catch (error) {
      console.log("Payment button not found");
      throw error;
    }
  }

  /**
   * Select cash payment method
   */
  async selectCashPayment() {
    try {
      const cashButton = await waitForElement(
        this.driver,
        this.locators.cashPaymentOption
      );
      await cashButton.click();
      await this.driver.sleep(500);
    } catch {
      console.log("Cash payment option not found");
    }
  }

  /**
   * Select card payment method
   */
  async selectCardPayment() {
    try {
      const cardButton = await waitForElement(
        this.driver,
        this.locators.cardPaymentOption
      );
      await cardButton.click();
      await this.driver.sleep(500);
    } catch {
      console.log("Card payment option not found");
    }
  }

  /**
   * Complete the transaction
   */
  async completeTransaction() {
    try {
      const completeButton = await waitForElement(
        this.driver,
        this.locators.completeButton
      );
      await completeButton.click();
      await this.driver.sleep(2000); // Wait for transaction to process
    } catch (error) {
      console.log("Complete button not found");
      throw error;
    }
  }

  /**
   * Check if payment button is visible
   * @returns {Promise<boolean>}
   */
  async isPaymentButtonVisible() {
    return await isElementVisible(this.driver, this.locators.paymentButton);
  }

  /**
   * Check if POS page loaded successfully
   * @returns {Promise<boolean>}
   */
  async isPOSPageLoaded() {
    const hasSearch = await isElementVisible(
      this.driver,
      this.locators.productSearchInput
    );
    const hasCart = await isElementVisible(
      this.driver,
      this.locators.cartContainer
    );
    return hasSearch || hasCart;
  }
}

export default POSPage;
