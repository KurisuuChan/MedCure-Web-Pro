/**
 * Login Tests
 * Tests for login functionality
 */

import { describe, it, before, after } from "mocha";
import { expect } from "chai";
import { createDriver, quitDriver } from "../helpers/driver.js";
import { takeScreenshot } from "../helpers/utils.js";
import LoginPage from "../page-objects/LoginPage.js";
import { config } from "../config/test.config.js";

describe("Login Functionality", function () {
  this.timeout(30000); // Set test timeout

  let driver;
  let loginPage;

  before(async function () {
    driver = await createDriver();
    loginPage = new LoginPage(driver);
  });

  after(async function () {
    await quitDriver(driver);
  });

  it("should load login page successfully", async function () {
    await loginPage.open();
    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).to.include("/login");
    await takeScreenshot(driver, "login-page-loaded");
  });

  it("should show error message with invalid credentials", async function () {
    await loginPage.open();
    await loginPage.login("invalid@email.com", "wrongpassword");

    // Wait a bit for error message to appear
    await driver.sleep(2000);

    const hasError = await loginPage.hasErrorMessage();
    expect(hasError).to.be.true;
    await takeScreenshot(driver, "login-invalid-credentials");
  });

  it("should successfully login with admin credentials", async function () {
    await loginPage.open();
    await loginPage.login(
      config.testUsers.admin.email,
      config.testUsers.admin.password
    );

    // Wait for redirect
    await driver.sleep(3000);

    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).to.include("/dashboard");
    await takeScreenshot(driver, "login-admin-success");
  });
});
