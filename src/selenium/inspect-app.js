/**
 * DOM Inspector Script
 * This script logs in and extracts actual CSS selectors from the application
 * Run with: node src/selenium/inspect-app.js
 */

/* eslint-env node */

import { createDriver, quitDriver } from "./helpers/driver.js";
import { config } from "./config/test.config.js";
import { By } from "selenium-webdriver";

async function inspectApp() {
  let driver;

  try {
    console.log("🔍 Starting DOM inspection...\n");
    driver = await createDriver();

    // Login first
    console.log("📝 Logging in...");
    await driver.get(`${config.baseUrl}/login`);
    await driver.sleep(2000);

    // Find and fill login form
    const emailInput = await driver.findElement(By.css('input[type="email"]'));
    const passwordInput = await driver.findElement(
      By.css('input[type="password"]')
    );
    const loginButton = await driver.findElement(
      By.css('button[type="submit"]')
    );

    await emailInput.sendKeys(config.testUsers.admin.email);
    await passwordInput.sendKeys(config.testUsers.admin.password);
    await loginButton.click();

    await driver.sleep(3000);
    console.log("✅ Login successful\n");

    // ===================
    // INSPECT DASHBOARD
    // ===================
    console.log("🏠 INSPECTING DASHBOARD PAGE");
    console.log("=".repeat(50));

    await driver.get(`${config.baseUrl}/dashboard`);
    await driver.sleep(2000);

    // Try to find metric cards
    const dashboardHTML = await driver.executeScript(`
      const metrics = [];
      
      // Look for common card patterns
      const cardSelectors = [
        '[class*="metric"]',
        '[class*="card"]',
        '[class*="stat"]',
        '[class*="sales"]',
        '[class*="revenue"]',
        '[class*="dashboard"]'
      ];
      
      for (const selector of cardSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          elements.forEach(el => {
            metrics.push({
              selector: selector,
              className: el.className,
              id: el.id,
              text: el.textContent.substring(0, 50),
              tag: el.tagName
            });
          });
        }
      }
      
      // Also get navigation links
      const navLinks = Array.from(document.querySelectorAll('a, button')).map(el => ({
        text: el.textContent.trim(),
        href: el.getAttribute('href'),
        className: el.className,
        id: el.id,
        tag: el.tagName
      })).filter(link => link.text.length > 0 && link.text.length < 30);
      
      return { metrics, navLinks };
    `);

    console.log("\n📊 Metric Cards Found:");
    dashboardHTML.metrics.slice(0, 10).forEach((metric, i) => {
      console.log(
        `  ${i + 1}. Tag: ${metric.tag}, Class: "${metric.className}"`
      );
      console.log(`     Text preview: "${metric.text.trim()}"`);
    });

    console.log("\n🔗 Navigation Links Found:");
    dashboardHTML.navLinks.slice(0, 15).forEach((link, i) => {
      console.log(`  ${i + 1}. "${link.text}" - ${link.tag}`);
      if (link.href) console.log(`     href: ${link.href}`);
      if (link.className) console.log(`     class: "${link.className}"`);
    });

    // ===================
    // INSPECT INVENTORY
    // ===================
    console.log("\n\n📦 INSPECTING INVENTORY PAGE");
    console.log("=".repeat(50));

    await driver.get(`${config.baseUrl}/inventory`);
    await driver.sleep(2000);

    const inventoryHTML = await driver.executeScript(`
      const result = {};
      
      // Find table or list structure
      result.tables = Array.from(document.querySelectorAll('table')).map(table => ({
        className: table.className,
        id: table.id,
        rowCount: table.querySelectorAll('tr').length
      }));
      
      // Find search input
      result.searchInputs = Array.from(document.querySelectorAll('input[type="search"], input[placeholder*="search" i], input[placeholder*="Search" i]')).map(input => ({
        type: input.type,
        placeholder: input.placeholder,
        className: input.className,
        id: input.id
      }));
      
      // Find buttons
      result.buttons = Array.from(document.querySelectorAll('button')).map(btn => ({
        text: btn.textContent.trim(),
        className: btn.className,
        id: btn.id
      })).filter(btn => btn.text.length > 0 && btn.text.length < 30);
      
      // Find any modals
      result.modals = Array.from(document.querySelectorAll('[class*="modal"], [role="dialog"]')).map(modal => ({
        className: modal.className,
        id: modal.id,
        display: window.getComputedStyle(modal).display
      }));
      
      return result;
    `);

    console.log("\n📋 Tables Found:");
    inventoryHTML.tables.forEach((table, i) => {
      console.log(
        `  ${i + 1}. Class: "${table.className}", Rows: ${table.rowCount}`
      );
    });

    console.log("\n🔍 Search Inputs Found:");
    inventoryHTML.searchInputs.forEach((input, i) => {
      console.log(`  ${i + 1}. Placeholder: "${input.placeholder}"`);
      console.log(`     Class: "${input.className}"`);
    });

    console.log("\n🔘 Buttons Found:");
    inventoryHTML.buttons.slice(0, 10).forEach((btn, i) => {
      console.log(`  ${i + 1}. "${btn.text}" - Class: "${btn.className}"`);
    });

    console.log("\n💬 Modals Found:");
    if (inventoryHTML.modals.length === 0) {
      console.log("  No modals found (normal if not triggered)");
    } else {
      inventoryHTML.modals.forEach((modal, i) => {
        console.log(
          `  ${i + 1}. Class: "${modal.className}", Display: ${modal.display}`
        );
      });
    }

    // ===================
    // INSPECT LOGIN PAGE
    // ===================
    console.log("\n\n🔐 INSPECTING LOGIN PAGE");
    console.log("=".repeat(50));

    // Logout first
    await driver.executeScript("localStorage.clear()");
    await driver.get(`${config.baseUrl}/login`);
    await driver.sleep(2000);

    // Try invalid login to see error
    const emailInput2 = await driver.findElement(By.css('input[type="email"]'));
    const passwordInput2 = await driver.findElement(
      By.css('input[type="password"]')
    );
    const loginButton2 = await driver.findElement(
      By.css('button[type="submit"]')
    );

    await emailInput2.sendKeys("invalid@test.com");
    await passwordInput2.sendKeys("wrongpassword");
    await loginButton2.click();

    await driver.sleep(2000);

    const loginHTML = await driver.executeScript(`
      const result = {};
      
      // Find error messages
      result.errors = Array.from(document.querySelectorAll('[class*="error"], [class*="alert"], [role="alert"]')).map(el => ({
        text: el.textContent.trim(),
        className: el.className,
        id: el.id,
        tag: el.tagName
      }));
      
      // Find form elements
      result.inputs = Array.from(document.querySelectorAll('input')).map(input => ({
        type: input.type,
        name: input.name,
        placeholder: input.placeholder,
        className: input.className,
        id: input.id
      }));
      
      result.buttons = Array.from(document.querySelectorAll('button')).map(btn => ({
        text: btn.textContent.trim(),
        type: btn.type,
        className: btn.className,
        id: btn.id
      }));
      
      return result;
    `);

    console.log("\n❌ Error Messages Found:");
    if (loginHTML.errors.length === 0) {
      console.log("  No error messages found - may need different selector");
    } else {
      loginHTML.errors.forEach((error, i) => {
        console.log(`  ${i + 1}. Text: "${error.text}"`);
        console.log(`     Class: "${error.className}", Tag: ${error.tag}`);
      });
    }

    console.log("\n📝 Form Inputs:");
    loginHTML.inputs.forEach((input, i) => {
      console.log(
        `  ${i + 1}. Type: ${input.type}, Placeholder: "${input.placeholder}"`
      );
      console.log(`     Class: "${input.className}"`);
    });

    console.log("\n🔘 Form Buttons:");
    loginHTML.buttons.forEach((btn, i) => {
      console.log(`  ${i + 1}. "${btn.text}" - Type: ${btn.type}`);
      console.log(`     Class: "${btn.className}"`);
    });

    console.log("\n\n✅ Inspection complete!");
    console.log(
      "\nUse the classes and IDs above to update your page objects and tests.\n"
    );
  } catch (error) {
    console.error("❌ Error during inspection:", error.message);
    throw error;
  } finally {
    if (driver) {
      await quitDriver(driver);
    }
  }
}

// Run the inspection
inspectApp().catch(console.error);
