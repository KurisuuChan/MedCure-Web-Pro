/**
 * Quick test to verify Selenium WebDriver setup
 * Run with: node src/selenium/verify-setup.js
 */

import { Builder, Browser } from "selenium-webdriver";
import edge from "selenium-webdriver/edge.js";

async function verifySetup() {
  console.log("🔍 Verifying Selenium WebDriver setup for Microsoft Edge...\n");

  let driver;
  try {
    console.log("1️⃣  Testing Edge browser detection...");
    const options = new edge.Options();
    options.addArguments("--headless=new");
    options.addArguments("--disable-gpu");
    options.addArguments("--no-sandbox");

    console.log("2️⃣  Creating WebDriver instance...");
    driver = await new Builder()
      .forBrowser(Browser.EDGE)
      .setEdgeOptions(options)
      .build();

    console.log("✅ WebDriver created successfully!");

    console.log("3️⃣  Testing navigation...");
    await driver.get("https://www.google.com");

    console.log("4️⃣  Getting page title...");
    const title = await driver.getTitle();
    console.log(`   Page title: ${title}`);

    console.log("\n✅ SUCCESS! Selenium WebDriver is working correctly!");
    console.log("   You can now run your tests with: npm test\n");
  } catch (error) {
    console.error("\n❌ ERROR: Selenium WebDriver setup failed!");
    console.error("\nError details:", error.message);
    console.error("\n🔧 Troubleshooting steps:");
    console.error("   1. Make sure Microsoft Edge is installed");
    console.error("   2. Run: npm install --save-dev edgedriver@latest");
    console.error("   3. Check Edge version: edge://version/");
    console.error(
      "   4. Try running in headless mode: npm run test:headless\n"
    );

    process.exit(1);
  } finally {
    if (driver) {
      await driver.quit();
      console.log("🔚 WebDriver closed\n");
    }
  }
}

verifySetup();
