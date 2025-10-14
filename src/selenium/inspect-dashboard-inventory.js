import { Builder, Browser, By } from "selenium-webdriver";
import edge from "selenium-webdriver/edge.js";

const BASE_URL = "http://localhost:5173";

async function inspectDashboardAndInventory() {
  const options = new edge.Options();
  // options.addArguments('--headless=new'); // Disable headless to see what's happening
  options.addArguments("--disable-gpu");
  options.addArguments("--no-sandbox");

  const driver = await new Builder()
    .forBrowser(Browser.EDGE)
    .setEdgeOptions(options)
    .build();

  try {
    console.log("\n🔍 Inspecting Dashboard and Inventory pages...\n");

    // Login first
    await driver.get(`${BASE_URL}/login`);
    await driver.sleep(5000); // Wait longer for page load

    // Try to find the login form
    const emailInput = await driver.wait(
      async () => {
        const elements = await driver.findElements(
          By.css('input[type="email"], input[placeholder*="email"]')
        );
        return elements.length > 0 ? elements[0] : null;
      },
      10000,
      "Email input not found"
    );

    const passwordInput = await driver.wait(
      async () => {
        const elements = await driver.findElements(
          By.css('input[type="password"], input[placeholder*="password"]')
        );
        return elements.length > 0 ? elements[0] : null;
      },
      10000,
      "Password input not found"
    );

    const loginButton = await driver.findElement(
      By.xpath(
        '//button[contains(text(), "Login") or contains(text(), "Sign")]'
      )
    );

    await emailInput.sendKeys("admin@medcure.com");
    await passwordInput.sendKeys("123456");
    await loginButton.click();
    await driver.sleep(3000);

    // ============ DASHBOARD PAGE ============
    console.log("📊 DASHBOARD PAGE ELEMENTS:\n");

    // Get all buttons
    const dashboardButtons = await driver.findElements(By.css("button"));
    console.log(`Found ${dashboardButtons.length} buttons on dashboard:`);
    for (let i = 0; i < Math.min(dashboardButtons.length, 15); i++) {
      const text = await dashboardButtons[i].getText().catch(() => "");
      const classes = await dashboardButtons[i]
        .getAttribute("class")
        .catch(() => "");
      if (text || classes) {
        console.log(
          `  Button ${i + 1}: "${text}" [class: ${classes.substring(0, 50)}...]`
        );
      }
    }

    // Check for refresh button specifically
    console.log("\n🔄 Looking for Refresh button:");
    try {
      const refreshButtons = await driver.findElements(
        By.xpath('//*[contains(text(), "Refresh")]')
      );
      console.log(
        `  Found ${refreshButtons.length} elements containing "Refresh"`
      );
      for (const btn of refreshButtons) {
        const tagName = await btn.getTagName();
        const text = await btn.getText();
        const classes = await btn.getAttribute("class").catch(() => "");
        console.log(`    ${tagName}: "${text}" [${classes.substring(0, 40)}]`);
      }
    } catch {
      console.log("  ❌ No Refresh button found");
    }

    // Look for any SVG icons (refresh might be an icon)
    const svgElements = await driver.findElements(By.css("svg"));
    console.log(`\n🎨 Found ${svgElements.length} SVG icons on dashboard`);

    // Check for time period filters/dropdowns
    console.log("\n📅 Looking for time period filters:");
    const selects = await driver.findElements(By.css("select"));
    console.log(`  Found ${selects.length} select elements`);
    for (const select of selects) {
      const classes = await select.getAttribute("class").catch(() => "");
      const id = await select.getAttribute("id").catch(() => "");
      console.log(`    Select: id="${id}" class="${classes.substring(0, 40)}"`);
    }

    // Check for alerts/notifications button
    console.log("\n🔔 Looking for Alerts button:");
    try {
      const alertsButtons = await driver.findElements(
        By.xpath('//*[contains(text(), "Alert")]')
      );
      console.log(
        `  Found ${alertsButtons.length} elements containing "Alert"`
      );
      for (const btn of alertsButtons) {
        const tagName = await btn.getTagName();
        const text = await btn.getText();
        console.log(`    ${tagName}: "${text}"`);
      }
    } catch {
      console.log("  ❌ No Alerts button found");
    }

    // ============ INVENTORY PAGE ============
    console.log("\n\n📦 INVENTORY PAGE ELEMENTS:\n");

    // Navigate to inventory
    const inventoryLink = await driver.findElement(
      By.css('a[href="/inventory"]')
    );
    await inventoryLink.click();
    await driver.sleep(3000);

    // Get page title/heading
    const headings = await driver.findElements(By.css("h1, h2, h3"));
    console.log(`Found ${headings.length} headings on inventory page:`);
    for (const heading of headings) {
      const text = await heading.getText();
      const tagName = await heading.getTagName();
      if (text) {
        console.log(`  ${tagName}: "${text}"`);
      }
    }

    // Check for filters button
    console.log("\n🔍 Looking for Filters button:");
    try {
      const filtersButtons = await driver.findElements(
        By.xpath('//*[contains(text(), "Filter")]')
      );
      console.log(
        `  Found ${filtersButtons.length} elements containing "Filter"`
      );
      for (const btn of filtersButtons) {
        const tagName = await btn.getTagName();
        const text = await btn.getText();
        const classes = await btn.getAttribute("class").catch(() => "");
        console.log(`    ${tagName}: "${text}" [${classes.substring(0, 40)}]`);
      }
    } catch {
      console.log("  ❌ No Filters button found");
    }

    // Check for Analytics & Reports tab
    console.log("\n📈 Looking for Analytics & Reports tab:");
    try {
      const analyticsElements = await driver.findElements(
        By.xpath(
          '//*[contains(text(), "Analytics") or contains(text(), "Reports")]'
        )
      );
      console.log(
        `  Found ${analyticsElements.length} elements containing "Analytics" or "Reports"`
      );
      for (const elem of analyticsElements) {
        const tagName = await elem.getTagName();
        const text = await elem.getText();
        const classes = await elem.getAttribute("class").catch(() => "");
        console.log(`    ${tagName}: "${text}" [${classes.substring(0, 40)}]`);
      }
    } catch {
      console.log("  ❌ No Analytics & Reports tab found");
    }

    // Get all buttons on inventory page
    const inventoryButtons = await driver.findElements(By.css("button"));
    console.log(
      `\n🔘 Found ${inventoryButtons.length} buttons on inventory page:`
    );
    for (let i = 0; i < Math.min(inventoryButtons.length, 15); i++) {
      const text = await inventoryButtons[i].getText().catch(() => "");
      const classes = await inventoryButtons[i]
        .getAttribute("class")
        .catch(() => "");
      if (text || classes) {
        console.log(
          `  Button ${i + 1}: "${text}" [class: ${classes.substring(0, 50)}...]`
        );
      }
    }

    // ============ LOGIN PAGE INPUTS ============
    console.log("\n\n🔐 LOGIN PAGE INPUT DETAILS:\n");

    await driver.get(`${BASE_URL}/login`);
    await driver.sleep(2000);

    const emailField = await driver.findElement(
      By.css('input[type="email"], input[placeholder*="email"]')
    );
    const passwordField = await driver.findElement(
      By.css('input[type="password"], input[placeholder*="password"]')
    );

    console.log("Email input attributes:");
    const emailType = await emailField.getAttribute("type");
    const emailName = await emailField.getAttribute("name");
    const emailId = await emailField.getAttribute("id");
    const emailClass = await emailField.getAttribute("class");
    console.log(`  type="${emailType}", name="${emailName}", id="${emailId}"`);
    console.log(`  class="${emailClass}"`);

    console.log("\nPassword input attributes:");
    const passwordType = await passwordField.getAttribute("type");
    const passwordName = await passwordField.getAttribute("name");
    const passwordId = await passwordField.getAttribute("id");
    const passwordClass = await passwordField.getAttribute("class");
    console.log(
      `  type="${passwordType}", name="${passwordName}", id="${passwordId}"`
    );
    console.log(`  class="${passwordClass}"`);

    console.log("\n✅ Inspection complete!\n");
  } catch (error) {
    console.error("Error during inspection:", error.message);
  } finally {
    await driver.quit();
  }
}

inspectDashboardAndInventory();
