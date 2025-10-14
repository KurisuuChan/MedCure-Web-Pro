/**
 * Diagnostic Script to Find Missing Elements
 * This script will help us understand why certain elements aren't being detected
 */

import { Builder, Browser, By } from "selenium-webdriver";
import edge from "selenium-webdriver/edge.js";

const BASE_URL = "http://localhost:5173";

async function diagnoseElements() {
  const options = new edge.Options();
  // Run in visible mode to see what's happening
  options.addArguments("--disable-gpu");
  options.addArguments("--no-sandbox");

  const driver = await new Builder()
    .forBrowser(Browser.EDGE)
    .setEdgeOptions(options)
    .build();

  try {
    console.log("\n🔍 DIAGNOSTIC TEST FOR MISSING ELEMENTS\n");
    console.log("=".repeat(60));

    // Login first
    console.log("\n1️⃣ Logging in...");
    await driver.get(`${BASE_URL}/login`);
    await driver.sleep(3000);

    const emailInput = await driver.findElement(By.css('input[type="email"]'));
    const passwordInput = await driver.findElement(
      By.css('input[type="password"]')
    );
    const loginButton = await driver.findElement(
      By.css('button[type="submit"]')
    );

    await emailInput.sendKeys("admin@medcure.com");
    await passwordInput.sendKeys("123456");
    await loginButton.click();
    await driver.sleep(4000);
    console.log("✅ Login successful");

    // ============ DASHBOARD DIAGNOSTICS ============
    console.log("\n" + "=".repeat(60));
    console.log("📊 DASHBOARD PAGE DIAGNOSTICS");
    console.log("=".repeat(60));

    await driver.get(`${BASE_URL}/dashboard`);
    await driver.sleep(5000); // Wait longer for everything to load

    const currentUrl = await driver.getCurrentUrl();
    console.log(`\n📍 Current URL: ${currentUrl}`);

    // Get page title
    const title = await driver.getTitle();
    console.log(`📄 Page Title: ${title}`);

    // Check viewport size
    const windowSize = await driver.manage().window().getSize();
    console.log(`🖥️  Window Size: ${windowSize.width}x${windowSize.height}`);

    // Get all text content on the page
    const bodyText = await driver.findElement(By.css("body")).getText();
    console.log(`\n📝 Page contains ${bodyText.length} characters of text`);

    // Search for specific button texts
    console.log("\n🔍 Searching for button texts in page content:");
    const searchTerms = [
      "Refresh",
      "Alert",
      "Last 7 Days",
      "Last 30 Days",
      "Filter",
    ];
    for (const term of searchTerms) {
      const found = bodyText.includes(term);
      console.log(
        `  ${found ? "✅" : "❌"} "${term}" ${
          found ? "FOUND" : "NOT FOUND"
        } in page text`
      );
    }

    // Try to find all buttons and their text
    console.log("\n🔘 ALL BUTTONS ON DASHBOARD:");
    const allButtons = await driver.findElements(By.css("button"));
    console.log(`  Found ${allButtons.length} button elements total`);

    for (let i = 0; i < Math.min(allButtons.length, 20); i++) {
      try {
        const text = await allButtons[i].getText();
        const isDisplayed = await allButtons[i].isDisplayed();
        const classes = await allButtons[i].getAttribute("class");
        const id = await allButtons[i].getAttribute("id");

        if (text || id) {
          console.log(`\n  Button ${i + 1}:`);
          console.log(`    Text: "${text}"`);
          console.log(`    Visible: ${isDisplayed}`);
          console.log(`    ID: "${id}"`);
          console.log(`    Classes: ${classes.substring(0, 60)}...`);
        }
      } catch {
        // Skip stale elements
      }
    }

    // Try different selectors for Refresh button
    console.log("\n🔎 TESTING DIFFERENT SELECTORS FOR REFRESH BUTTON:");
    const refreshSelectors = [
      {
        name: "XPath contains text",
        selector: By.xpath('//button[contains(text(), "Refresh")]'),
      },
      {
        name: "XPath exact text",
        selector: By.xpath('//button[text()="Refresh"]'),
      },
      {
        name: "XPath case-insensitive",
        selector: By.xpath(
          '//button[contains(translate(text(), "REFRESH", "refresh"), "refresh")]'
        ),
      },
      { name: "CSS with text via span", selector: By.css("button span") },
    ];

    for (const test of refreshSelectors) {
      try {
        const elements = await driver.findElements(test.selector);
        console.log(
          `  ${elements.length > 0 ? "✅" : "❌"} ${test.name}: Found ${
            elements.length
          } element(s)`
        );

        if (elements.length > 0 && test.name.includes("span")) {
          for (let i = 0; i < Math.min(elements.length, 5); i++) {
            const spanText = await elements[i].getText();
            if (spanText && spanText.includes("Refresh")) {
              console.log(`      → Found "Refresh" in span: "${spanText}"`);
            }
          }
        }
      } catch (e) {
        console.log(`  ❌ ${test.name}: Error - ${e.message.substring(0, 50)}`);
      }
    }

    // Scroll down to see if elements become visible
    console.log("\n📜 SCROLLING DOWN TO CHECK FOR HIDDEN ELEMENTS:");
    await driver.executeScript(
      "window.scrollTo(0, document.body.scrollHeight / 2);"
    );
    await driver.sleep(1000);

    const refreshAfterScroll = await driver.findElements(
      By.xpath('//button[contains(text(), "Refresh")]')
    );
    console.log(
      `  After scroll: Found ${refreshAfterScroll.length} Refresh button(s)`
    );

    // ============ INVENTORY DIAGNOSTICS ============
    console.log("\n" + "=".repeat(60));
    console.log("📦 INVENTORY PAGE DIAGNOSTICS");
    console.log("=".repeat(60));

    await driver.get(`${BASE_URL}/inventory`);
    await driver.sleep(5000);

    const invUrl = await driver.getCurrentUrl();
    console.log(`\n📍 Current URL: ${invUrl}`);

    const invBodyText = await driver.findElement(By.css("body")).getText();
    console.log(`\n🔍 Searching for button texts in inventory page:`);
    const invSearchTerms = [
      "Filter",
      "Filters",
      "Analytics",
      "Reports",
      "Products",
      "Export",
      "Import",
    ];
    for (const term of invSearchTerms) {
      const found = invBodyText.includes(term);
      console.log(
        `  ${found ? "✅" : "❌"} "${term}" ${found ? "FOUND" : "NOT FOUND"}`
      );
    }

    // Check for tabs
    console.log("\n📑 CHECKING FOR TABS:");
    const tabs = await driver.findElements(
      By.css('button[role="tab"], [role="tablist"] button')
    );
    console.log(`  Found ${tabs.length} tab elements`);
    for (let i = 0; i < tabs.length; i++) {
      try {
        const text = await tabs[i].getText();
        const isSelected = await tabs[i].getAttribute("aria-selected");
        console.log(`  Tab ${i + 1}: "${text}" (selected: ${isSelected})`);
      } catch {
        // Skip
      }
    }

    // Try clicking the first tab if exists
    if (tabs.length > 0) {
      console.log("\n🖱️  Clicking first tab and waiting...");
      await tabs[0].click();
      await driver.sleep(2000);

      // Check again for Filters button
      const filtersAfterTab = await driver.findElements(
        By.xpath('//button[contains(text(), "Filters")]')
      );
      console.log(
        `  After clicking tab: Found ${filtersAfterTab.length} Filters button(s)`
      );
    }

    // Check all buttons on inventory
    console.log("\n🔘 ALL VISIBLE BUTTONS ON INVENTORY:");
    const invButtons = await driver.findElements(By.css("button"));
    console.log(`  Found ${invButtons.length} button elements total`);

    let visibleCount = 0;
    for (let i = 0; i < invButtons.length; i++) {
      try {
        const isDisplayed = await invButtons[i].isDisplayed();
        if (isDisplayed) {
          visibleCount++;
          const text = await invButtons[i].getText();
          if (text && text.length > 0 && visibleCount <= 15) {
            console.log(`  ${visibleCount}. "${text}"`);
          }
        }
      } catch {
        // Skip
      }
    }
    console.log(`  Total visible buttons: ${visibleCount}`);

    // Test scrolling on inventory
    console.log("\n📜 TESTING SCROLL ON INVENTORY:");
    await driver.executeScript("window.scrollTo(0, 500);");
    await driver.sleep(1000);

    const filtersAfterScroll = await driver.findElements(
      By.xpath('//button[contains(text(), "Filters")]')
    );
    const analyticsAfterScroll = await driver.findElements(
      By.xpath('//button[contains(text(), "Analytics")]')
    );
    console.log(
      `  After scroll - Filters: ${filtersAfterScroll.length}, Analytics: ${analyticsAfterScroll.length}`
    );

    console.log("\n" + "=".repeat(60));
    console.log("✅ DIAGNOSTIC COMPLETE");
    console.log("=".repeat(60));
    console.log(
      "\nℹ️  Check the output above to identify why elements are not found."
    );
    console.log("   Common issues:");
    console.log("   - Elements loaded via AJAX after page load");
    console.log("   - Elements inside tabs that need to be clicked first");
    console.log("   - Elements requiring scroll to become visible");
    console.log("   - Elements hidden by CSS until certain conditions");
    console.log("   - Elements with dynamic IDs/classes");
  } catch (error) {
    console.error("\n❌ Error during diagnosis:", error.message);
    console.error(error.stack);
  } finally {
    console.log(
      "\n⏸️  Browser will stay open for 10 seconds for manual inspection..."
    );
    await driver.sleep(10000);
    await driver.quit();
  }
}

diagnoseElements();
