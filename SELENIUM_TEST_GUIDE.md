# 📚 Selenium Test Development Guide

A comprehensive guide for adding new tests to the MedCure Pro Selenium test suite.

---

## 🚀 Quick Start

### Running Tests

```bash
# Start the application first
npm run dev

# In another terminal, run tests
npm test

# Run specific test file
npx mocha src/selenium/tests/dashboard.test.js --timeout 30000

# Run diagnostic tests
npx mocha src/selenium/tests/diagnostics.test.js --timeout 30000
```

---

## 📝 Writing a New Test

### 1. Create Test File Structure

```javascript
/**
 * [Feature Name] Tests
 * Tests for [feature description]
 */

import { describe, it, before, after } from "mocha";
import { expect } from "chai";
import { createDriver, quitDriver } from "../helpers/driver.js";
import { takeScreenshot, waitForPageLoad } from "../helpers/utils.js";
import LoginPage from "../page-objects/LoginPage.js";
// Import other page objects as needed

describe("[Feature Name]", function () {
  this.timeout(30000); // 30-second timeout

  let driver;
  let loginPage;
  // Declare other page objects

  before(async function () {
    driver = await createDriver();
    loginPage = new LoginPage(driver);

    // Login before running tests (if needed)
    await loginPage.loginAsAdmin();
    await waitForPageLoad(driver);
  });

  after(async function () {
    await quitDriver(driver);
  });

  it("should [test description]", async function () {
    // Test code here
    await takeScreenshot(driver, "test-name");
  });
});
```

### 2. Page Object Model Pattern

Create a page object in `src/selenium/page-objects/`:

```javascript
/**
 * [Page Name] Page Object Model
 * Represents the [page description] page
 */

import { By } from "selenium-webdriver";
import { config } from "../config/test.config.js";
import {
  waitAndClick,
  isElementVisible,
  clickButtonByText,
  findButtonByText,
  typeText,
} from "../helpers/utils.js";

export class YourPage {
  constructor(driver) {
    this.driver = driver;
    this.url = `${config.baseUrl}/your-page`;

    this.locators = {
      // Define locators here
      yourElement: By.css("selector"),
    };
  }

  async open() {
    await this.driver.get(this.url);
    await this.driver.sleep(3000); // Wait for page load
  }

  async clickButton() {
    // For buttons with text in child elements
    await clickButtonByText(this.driver, "Button Text");
  }

  async hasButton() {
    try {
      await findButtonByText(this.driver, "Button Text");
      return true;
    } catch {
      return false;
    }
  }

  async fillForm(data) {
    await typeText(this.driver, this.locators.yourElement, data);
  }
}

export default YourPage;
```

---

## 🛠️ Common Patterns

### Finding Elements

#### Buttons with Text

```javascript
// ✅ RECOMMENDED: Handles text in child elements
await clickButtonByText(driver, "Button Text");

// Check if button exists
const hasButton = try {
  await findButtonByText(driver, "Button Text");
  return true;
} catch {
  return false;
};
```

#### Input Fields

```javascript
// By CSS selector
const input = By.css('input[placeholder="Search"]');

// By name attribute
const input = By.css('input[name="username"]');

// Type text
await typeText(driver, input, "search text");
```

#### Links

```javascript
// By href
const link = By.css('a[href="/dashboard"]');

// Click link
await waitAndClick(driver, link);
```

#### Tabs

```javascript
// By role and text
const tab = By.xpath('//button[@role="tab"][contains(., "Tab Name")]');
await waitAndClick(driver, tab);
```

### Waiting for Elements

```javascript
// Wait for element to be visible
const element = await waitForElement(driver, locator);

// Check if element is visible (non-blocking)
const isVisible = await isElementVisible(driver, locator);

// Wait for URL change
await waitForUrl(driver, "/expected-path");

// Wait for page load
await waitForPageLoad(driver);
```

### Assertions

```javascript
// URL assertions
const currentUrl = await driver.getCurrentUrl();
expect(currentUrl).to.include("/dashboard");

// Boolean assertions
expect(isVisible).to.be.true;
expect(hasButton).to.be.false;

// Text assertions
const text = await element.getText();
expect(text).to.equal("Expected Text");
expect(text).to.include("Partial Text");

// Element existence
expect(element).to.exist;
```

### Taking Screenshots

```javascript
// Always take screenshots for visual verification
await takeScreenshot(driver, "descriptive-name");

// Screenshots are saved to: selenium/screenshots/
```

---

## 🎯 Best Practices

### 1. **Use Page Object Model**

- Don't put selectors directly in tests
- Create reusable page objects
- Keep tests readable and maintainable

```javascript
// ❌ BAD
await driver.findElement(By.css("button.submit")).click();

// ✅ GOOD
await loginPage.clickSubmit();
```

### 2. **Use Descriptive Names**

```javascript
// ❌ BAD
it("should work", async function () { ... });

// ✅ GOOD
it("should display error message when login with invalid credentials", async function () { ... });
```

### 3. **Handle Waits Properly**

```javascript
// ❌ BAD - Fixed delays
await driver.sleep(5000);

// ✅ GOOD - Dynamic waits
await waitForElement(driver, locator);
```

### 4. **Clean Up Resources**

```javascript
after(async function () {
  await quitDriver(driver); // Always quit driver
});
```

### 5. **Use clickButtonByText for Buttons**

```javascript
// ❌ BAD - Doesn't handle child elements
await waitAndClick(driver, By.xpath('//button[contains(text(), "Save")]'));

// ✅ GOOD - Handles nested text
await clickButtonByText(driver, "Save");
```

---

## 🔍 Debugging Tips

### 1. Run Diagnostic Script

```bash
node src/selenium/diagnose-elements.js
```

This script:

- Logs in automatically
- Lists all buttons on Dashboard and Inventory
- Tests multiple selector strategies
- Keeps browser open for 10 seconds for manual inspection

### 2. Increase Timeouts

```javascript
describe("My Tests", function () {
  this.timeout(60000); // Increase to 60 seconds
  // ...
});
```

### 3. Add Console Logs

```javascript
console.log("Current URL:", await driver.getCurrentUrl());
console.log("Button text:", await button.getText());
console.log("Element visible:", await element.isDisplayed());
```

### 4. Keep Browser Open

```javascript
// Comment out quitDriver temporarily
// await quitDriver(driver);
await driver.sleep(30000); // Keep open for 30 seconds
```

### 5. Check Screenshots

All tests save screenshots to `selenium/screenshots/`. Check them to see what the browser actually sees.

---

## 📋 Checklist for New Tests

- [ ] Created page object (if new page)
- [ ] Used descriptive test names
- [ ] Added proper waits (no arbitrary sleep)
- [ ] Used `clickButtonByText` for buttons
- [ ] Added assertions
- [ ] Captured screenshots
- [ ] Handled cleanup (quitDriver)
- [ ] Tested locally
- [ ] All tests passing

---

## 🐛 Common Issues & Solutions

### Issue: "Element not found"

**Solution:**

1. Run diagnostic script to verify element exists
2. Check if text is in child element - use `clickButtonByText`
3. Add proper wait time
4. Verify element is visible: `isDisplayed()`

### Issue: "Element not clickable"

**Solution:**

1. Scroll to element: `await scrollToElement(driver, locator)`
2. Wait for element to be enabled
3. Check if element is covered by another element

### Issue: "Timeout errors"

**Solution:**

1. Increase test timeout: `this.timeout(60000)`
2. Check if application is running
3. Verify page loaded completely
4. Add explicit waits

### Issue: "Tests passing locally but failing in CI"

**Solution:**

1. Check if CI has Edge browser installed
2. Ensure application is running before tests
3. Increase timeouts for slower CI environment
4. Use headless mode in CI

---

## 📊 Test Organization

```
src/selenium/
├── config/
│   └── test.config.js          # Central configuration
├── helpers/
│   ├── driver.js               # WebDriver setup
│   └── utils.js                # Reusable utilities
├── page-objects/
│   ├── LoginPage.js            # Login page interactions
│   ├── DashboardPage.js        # Dashboard interactions
│   ├── InventoryPage.js        # Inventory interactions
│   └── POSPage.js              # POS interactions
├── tests/
│   ├── login.test.js           # Login tests
│   ├── dashboard.test.js       # Dashboard tests
│   ├── inventory.test.js       # Inventory tests
│   ├── pos.test.js             # POS tests
│   └── diagnostics.test.js     # Health check tests
└── screenshots/                # Test screenshots
```

---

## 🎓 Example: Complete Test

Here's a complete example of a well-structured test:

```javascript
/**
 * Staff Management Tests
 * Tests for staff/user management functionality
 */

import { describe, it, before, after } from "mocha";
import { expect } from "chai";
import { createDriver, quitDriver } from "../helpers/driver.js";
import { takeScreenshot, waitForPageLoad } from "../helpers/utils.js";
import LoginPage from "../page-objects/LoginPage.js";
import StaffPage from "../page-objects/StaffPage.js";

describe("Staff Management", function () {
  this.timeout(30000);

  let driver;
  let loginPage;
  let staffPage;

  before(async function () {
    driver = await createDriver();
    loginPage = new LoginPage(driver);
    staffPage = new StaffPage(driver);

    await loginPage.loginAsAdmin();
    await waitForPageLoad(driver);
  });

  after(async function () {
    await quitDriver(driver);
  });

  it("should load staff management page", async function () {
    await staffPage.open();

    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).to.include("/user-management");

    const isLoaded = await staffPage.isStaffPageLoaded();
    expect(isLoaded).to.be.true;

    await takeScreenshot(driver, "staff-page-loaded");
  });

  it("should display add staff button", async function () {
    await staffPage.open();

    const hasAddButton = await staffPage.hasAddStaffButton();
    expect(hasAddButton).to.be.true;

    await takeScreenshot(driver, "staff-add-button");
  });

  it("should open add staff modal", async function () {
    await staffPage.open();
    await staffPage.clickAddStaff();
    await driver.sleep(1000);

    const isModalOpen = await staffPage.isAddStaffModalOpen();
    expect(isModalOpen).to.be.true;

    await takeScreenshot(driver, "staff-add-modal");
  });
});
```

---

## 🔗 Resources

- **Selenium Documentation:** https://www.selenium.dev/documentation/
- **Mocha Documentation:** https://mochajs.org/
- **Chai Assertions:** https://www.chaijs.com/
- **WebDriver API:** https://www.selenium.dev/selenium/docs/api/javascript/

---

## 💡 Tips for Success

1. **Start Simple:** Write basic tests first, then add complexity
2. **One Thing Per Test:** Each test should verify one specific thing
3. **Use Descriptive Names:** Test names should explain what they verify
4. **Keep Tests Independent:** Don't rely on test execution order
5. **Handle Edge Cases:** Test error states, empty states, etc.
6. **Regular Maintenance:** Update tests when UI changes
7. **Run Tests Often:** Catch issues early

---

**Happy Testing! 🎉**

For questions or issues, refer to:

- `SELENIUM_TEST_FINAL_REPORT.md` - Complete test results
- `diagnose-elements.js` - Debugging script
- `utils.js` - Available utility functions
