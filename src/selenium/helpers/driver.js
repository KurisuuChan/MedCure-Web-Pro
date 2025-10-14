/**
 * WebDriver Helper
 * Manages WebDriver instance creation and configuration
 */

import { Builder, Browser } from "selenium-webdriver";
import edge from "selenium-webdriver/edge.js";
import { config } from "../config/test.config.js";

/**
 * Creates and configures a WebDriver instance
 * @returns {Promise<WebDriver>}
 */
export async function createDriver() {
  console.log("🚀 Creating WebDriver for Microsoft Edge...");

  try {
    const options = new edge.Options();

    // Add Edge options (compatible with Chrome options)
    console.log("⚙️  Adding Edge options...");
    config.chromeOptions.forEach((option) => {
      options.addArguments(option);
    });

    // Set headless mode if configured
    if (config.browser.headless) {
      console.log("👻 Running in headless mode");
      options.addArguments("--headless=new");
    }

    // Build the driver
    console.log("🔧 Building Edge driver...");
    const driver = await new Builder()
      .forBrowser(Browser.EDGE)
      .setEdgeOptions(options)
      .build();

    console.log("✅ WebDriver created successfully!");

    // Set timeouts
    console.log("⏱️  Setting timeouts...");
    await driver.manage().setTimeouts({
      implicit: config.timeouts.implicit,
      pageLoad: config.timeouts.pageLoad,
      script: config.timeouts.script,
    });

    // Maximize window
    console.log("📏 Setting window size...");
    await driver.manage().window().setRect({
      width: config.browser.windowSize.width,
      height: config.browser.windowSize.height,
    });

    console.log("✅ WebDriver fully configured!");
    return driver;
  } catch (error) {
    console.error("❌ Error creating WebDriver:", error.message);
    console.error("💡 Make sure Microsoft Edge browser is installed");
    console.error("💡 Try running: npm install --save-dev edgedriver@latest");
    throw error;
  }
}

/**
 * Quits the WebDriver instance
 * @param {WebDriver} driver
 */
export async function quitDriver(driver) {
  if (driver) {
    await driver.quit();
  }
}

export default { createDriver, quitDriver };
