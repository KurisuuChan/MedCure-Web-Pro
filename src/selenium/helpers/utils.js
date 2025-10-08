/**
 * Test Utilities and Helper Functions
 * Common utilities for Selenium tests
 */

/* eslint-env node */

import { By, until } from "selenium-webdriver";
import { config } from "../config/test.config.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Waits for an element to be visible and returns it
 * @param {WebDriver} driver
 * @param {By} locator
 * @param {number} timeout
 * @returns {Promise<WebElement>}
 */
export async function waitForElement(
  driver,
  locator,
  timeout = config.timeouts.explicit
) {
  return await driver.wait(until.elementLocated(locator), timeout);
}

/**
 * Waits for an element to be clickable and clicks it
 * @param {WebDriver} driver
 * @param {By} locator
 */
export async function waitAndClick(
  driver,
  locator,
  timeout = config.timeouts.explicit
) {
  const element = await driver.wait(until.elementLocated(locator), timeout);
  await driver.wait(until.elementIsVisible(element), timeout);
  await driver.wait(until.elementIsEnabled(element), timeout);
  await element.click();
}

/**
 * Types text into an input field
 * @param {WebDriver} driver
 * @param {By} locator
 * @param {string} text
 */
export async function typeText(driver, locator, text) {
  const element = await waitForElement(driver, locator);
  await element.clear();
  await element.sendKeys(text);
}

/**
 * Gets text from an element
 * @param {WebDriver} driver
 * @param {By} locator
 * @returns {Promise<string>}
 */
export async function getText(driver, locator) {
  const element = await waitForElement(driver, locator);
  return await element.getText();
}

/**
 * Checks if an element is visible on the page (waits up to 5 seconds)
 * @param {WebDriver} driver
 * @param {By} locator
 * @returns {Promise<boolean>}
 */
export async function isElementVisible(driver, locator) {
  try {
    const element = await driver.wait(
      async () => {
        const elements = await driver.findElements(locator);
        return elements.length > 0 ? elements[0] : null;
      },
      5000,
      undefined,
      100
    );
    if (!element) return false;
    return await element.isDisplayed();
  } catch {
    return false;
  }
}

/**
 * Waits for a URL to contain a specific string
 * @param {WebDriver} driver
 * @param {string} urlPart
 * @param {number} timeout
 */
export async function waitForUrl(
  driver,
  urlPart,
  timeout = config.timeouts.explicit
) {
  await driver.wait(until.urlContains(urlPart), timeout);
}

/**
 * Takes a screenshot and saves it
 * @param {WebDriver} driver
 * @param {string} filename
 */
export async function takeScreenshot(driver, filename) {
  if (!config.screenshots.enabled) return;

  // Resolve screenshot directory to absolute path from project root
  const projectRoot = path.resolve(__dirname, "../../..");
  const screenshotDir = path.join(projectRoot, config.screenshots.directory);

  // Create directory if it doesn't exist
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
    console.log(`📁 Created screenshot directory: ${screenshotDir}`);
  }

  try {
    const screenshot = await driver.takeScreenshot();
    const filepath = path.join(screenshotDir, `${filename}_${Date.now()}.png`);
    fs.writeFileSync(filepath, screenshot, "base64");

    console.log(`📸 Screenshot saved: ${filepath}`);
    return filepath;
  } catch (err) {
    console.error(`❌ Failed to save screenshot: ${err.message}`);
    throw err;
  }
}

/**
 * Scrolls to an element
 * @param {WebDriver} driver
 * @param {By} locator
 */
export async function scrollToElement(driver, locator) {
  const element = await waitForElement(driver, locator);
  await driver.executeScript(
    'arguments[0].scrollIntoView({behavior: "smooth", block: "center"});',
    element
  );
  await driver.sleep(500); // Wait for scroll animation
}

/**
 * Waits for page to be fully loaded
 * @param {WebDriver} driver
 */
export async function waitForPageLoad(driver) {
  await driver.wait(async () => {
    const readyState = await driver.executeScript("return document.readyState");
    return readyState === "complete";
  }, config.timeouts.pageLoad);
}

/**
 * Gets current URL
 * @param {WebDriver} driver
 * @returns {Promise<string>}
 */
export async function getCurrentUrl(driver) {
  return await driver.getCurrentUrl();
}

/**
 * Refreshes the current page
 * @param {WebDriver} driver
 */
export async function refreshPage(driver) {
  await driver.navigate().refresh();
  await waitForPageLoad(driver);
}

/**
 * Waits for an element to disappear
 * @param {WebDriver} driver
 * @param {By} locator
 * @param {number} timeout
 */
export async function waitForElementToDisappear(
  driver,
  locator,
  timeout = config.timeouts.explicit
) {
  await driver.wait(async () => {
    try {
      const element = await driver.findElement(locator);
      return !(await element.isDisplayed());
    } catch {
      return true; // Element not found means it disappeared
    }
  }, timeout);
}

/**
 * Selects an option from a dropdown by visible text
 * @param {WebDriver} driver
 * @param {By} locator
 * @param {string} optionText
 */
export async function selectDropdownByText(driver, locator, optionText) {
  const dropdown = await waitForElement(driver, locator);
  await dropdown.click();
  const option = await driver.findElement(
    By.xpath(`//option[text()="${optionText}"]`)
  );
  await option.click();
}

/**
 * Waits for alert and accepts it
 * @param {WebDriver} driver
 */
export async function acceptAlert(driver) {
  await driver.wait(until.alertIsPresent(), config.timeouts.explicit);
  const alert = await driver.switchTo().alert();
  await alert.accept();
}

/**
 * Generates random test data
 */
export const testData = {
  randomEmail: () => `test_${Date.now()}@medcure.test`,
  randomPhone: () =>
    `09${Math.floor(Math.random() * 1000000000)
      .toString()
      .padStart(9, "0")}`,
  randomName: () => `Test User ${Date.now()}`,
  randomNumber: (min = 1, max = 100) =>
    Math.floor(Math.random() * (max - min + 1)) + min,
};

/**
 * Finds a button by its text content (handles text in child elements)
 * @param {WebDriver} driver
 * @param {string} text - The text to search for
 * @returns {Promise<WebElement>}
 */
export async function findButtonByText(driver, text) {
  // Try multiple XPath strategies
  const xpaths = [
    // Direct text
    `//button[contains(text(), "${text}")]`,
    // Text in child elements (e.g., button > span)
    `//button[.//*[contains(text(), "${text}")]]`,
    // Normalized space (handles extra whitespace)
    `//button[contains(normalize-space(.), "${text}")]`,
  ];

  for (const xpath of xpaths) {
    try {
      const elements = await driver.findElements(By.xpath(xpath));
      if (elements.length > 0) {
        // Return the first visible element
        for (const element of elements) {
          if (await element.isDisplayed()) {
            return element;
          }
        }
      }
    } catch {
      // Continue to next strategy
      continue;
    }
  }

  throw new Error(`Button with text "${text}" not found or not visible`);
}

/**
 * Clicks a button by its text (handles text in child elements)
 * @param {WebDriver} driver
 * @param {string} text - The button text
 * @param {number} timeout - Timeout in milliseconds
 */
export async function clickButtonByText(driver, text, timeout = 5000) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const button = await findButtonByText(driver, text);
      await driver.wait(until.elementIsEnabled(button), 1000);
      await button.click();
      return; // Success
    } catch {
      await driver.sleep(100); // Wait before retry
    }
  }

  throw new Error(
    `Failed to click button "${text}" within ${timeout}ms timeout`
  );
}

export default {
  waitForElement,
  waitAndClick,
  typeText,
  getText,
  isElementVisible,
  waitForUrl,
  takeScreenshot,
  scrollToElement,
  waitForPageLoad,
  getCurrentUrl,
  refreshPage,
  waitForElementToDisappear,
  selectDropdownByText,
  acceptAlert,
  testData,
  findButtonByText,
  clickButtonByText,
};
