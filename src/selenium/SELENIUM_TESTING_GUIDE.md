# 🧪 Selenium Testing Guide for MedCure Pharmacy

## 📋 Table of Contents
1. [Overview](#overview)
2. [Setup](#setup)
3. [Running Tests](#running-tests)
4. [Writing Tests](#writing-tests)
5. [Project Structure](#project-structure)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

This project uses **Selenium WebDriver** for end-to-end (E2E) automated testing of the MedCure Pharmacy web application. Tests are written using:

- **Selenium WebDriver 4** - Browser automation
- **Mocha** - Test framework
- **Chai** - Assertion library
- **ChromeDriver** - Chrome browser driver

### What Gets Tested
✅ User authentication (Login/Logout)  
✅ Dashboard functionality  
✅ Inventory management  
✅ POS (Point of Sale) operations  
✅ Sales reporting  
✅ User navigation flows

---

## 🔧 Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or pnpm
- Google Chrome browser installed
- Application running on `http://localhost:5173` (or configure in test.config.js)

### Installation

All dependencies are already installed! If you need to reinstall:

```bash
npm install --save-dev selenium-webdriver mocha chai chromedriver
```

### Environment Variables (Optional)

Create a `.env` file in the project root for custom configurations:

```env
# Application URL
TEST_BASE_URL=http://localhost:5173

# Browser settings
BROWSER=chrome
HEADLESS=false

# Test user credentials
TEST_ADMIN_EMAIL=admin@medcure.com
TEST_ADMIN_PASSWORD=admin123

TEST_STAFF_EMAIL=staff@medcure.com
TEST_STAFF_PASSWORD=staff123

TEST_CASHIER_EMAIL=cashier@medcure.com
TEST_CASHIER_PASSWORD=cashier123
```

---

## 🚀 Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Headless Mode (No Browser Window)
```bash
npm run test:headless
```

### Run Specific Test Suites
```bash
# Login tests only
npm run test:login

# Dashboard tests only
npm run test:dashboard

# Inventory tests only
npm run test:inventory
```

### Run Single Test File
```bash
npx mocha selenium/tests/login.test.js --timeout 30000
```

### Watch Mode (Re-run on file changes)
```bash
npx mocha selenium/tests/**/*.test.js --watch --timeout 30000
```

---

## ✍️ Writing Tests

### Basic Test Structure

```javascript
import { describe, it, before, after } from 'mocha';
import { expect } from 'chai';
import { createDriver, quitDriver } from '../helpers/driver.js';
import { takeScreenshot } from '../helpers/utils.js';
import LoginPage from '../page-objects/LoginPage.js';

describe('My Feature Tests', function() {
  this.timeout(30000); // Set timeout for all tests
  
  let driver;
  let loginPage;

  before(async function() {
    driver = await createDriver();
    loginPage = new LoginPage(driver);
  });

  after(async function() {
    await quitDriver(driver);
  });

  it('should do something', async function() {
    await loginPage.open();
    // Your test code here
    await takeScreenshot(driver, 'test-screenshot');
  });
});
```

### Using Page Object Model

Create a new page object in `selenium/page-objects/`:

```javascript
// MyPage.js
import { By } from 'selenium-webdriver';
import { config } from '../config/test.config.js';
import { waitForElement, waitAndClick } from '../helpers/utils.js';

export class MyPage {
  constructor(driver) {
    this.driver = driver;
    this.url = `${config.baseUrl}/mypage`;
    
    this.locators = {
      myButton: By.css('button.my-button'),
      myInput: By.id('my-input')
    };
  }

  async open() {
    await this.driver.get(this.url);
  }

  async clickButton() {
    await waitAndClick(this.driver, this.locators.myButton);
  }
}
```

### Common Test Patterns

#### 1. Testing Form Submission
```javascript
it('should submit form successfully', async function() {
  await typeText(driver, By.id('name'), 'John Doe');
  await typeText(driver, By.id('email'), 'john@example.com');
  await waitAndClick(driver, By.css('button[type="submit"]'));
  await waitForUrl(driver, '/success');
});
```

#### 2. Testing Element Visibility
```javascript
it('should display success message', async function() {
  const isVisible = await isElementVisible(driver, By.css('.success-message'));
  expect(isVisible).to.be.true;
});
```

#### 3. Testing Navigation
```javascript
it('should navigate to dashboard', async function() {
  await waitAndClick(driver, By.css('a[href="/dashboard"]'));
  await waitForUrl(driver, '/dashboard');
  const url = await getCurrentUrl(driver);
  expect(url).to.include('/dashboard');
});
```

#### 4. Testing with Screenshots
```javascript
it('should display product list', async function() {
  await driver.get(`${config.baseUrl}/inventory`);
  await driver.sleep(2000); // Wait for data to load
  await takeScreenshot(driver, 'product-list');
  
  const hasProducts = await isElementVisible(driver, By.css('.product-item'));
  expect(hasProducts).to.be.true;
});
```

---

## 📁 Project Structure

```
selenium/
├── config/
│   └── test.config.js          # Test configuration (URLs, timeouts, etc.)
├── helpers/
│   ├── driver.js               # WebDriver creation and management
│   └── utils.js                # Reusable test utilities
├── page-objects/
│   ├── LoginPage.js            # Login page object model
│   └── DashboardPage.js        # Dashboard page object model
├── tests/
│   ├── login.test.js           # Login functionality tests
│   ├── dashboard.test.js       # Dashboard tests
│   └── inventory.test.js       # Inventory management tests
├── screenshots/                # Test screenshots (auto-generated)
└── reports/                    # Test reports (auto-generated)
```

### File Descriptions

#### `config/test.config.js`
- Central configuration for all tests
- Base URL, timeouts, browser settings
- Test user credentials
- Screenshot and report settings

#### `helpers/driver.js`
- Creates and configures WebDriver instances
- Handles browser options (headless, window size)
- Sets default timeouts

#### `helpers/utils.js`
- Reusable utility functions
- `waitForElement()` - Wait for element to appear
- `waitAndClick()` - Wait and click element
- `typeText()` - Type into input field
- `takeScreenshot()` - Capture screenshot
- `isElementVisible()` - Check visibility
- And many more...

#### `page-objects/`
- Page Object Model (POM) classes
- Encapsulate page-specific logic
- Define page elements (locators)
- Provide methods for page interactions

#### `tests/`
- Actual test files
- Use Mocha's `describe()` and `it()` functions
- Follow naming convention: `*.test.js`

---

## 🎯 Best Practices

### 1. **Use Page Object Model (POM)**
✅ Good:
```javascript
await loginPage.login(email, password);
```

❌ Bad:
```javascript
await driver.findElement(By.id('email')).sendKeys(email);
await driver.findElement(By.id('password')).sendKeys(password);
await driver.findElement(By.css('button')).click();
```

### 2. **Use Explicit Waits**
✅ Good:
```javascript
await waitForElement(driver, By.css('.product-list'));
```

❌ Bad:
```javascript
await driver.sleep(5000); // Arbitrary sleep
```

### 3. **Take Screenshots on Failures**
```javascript
it('should do something', async function() {
  try {
    // Test code
  } catch (error) {
    await takeScreenshot(driver, 'test-failure');
    throw error;
  }
});
```

### 4. **Use Descriptive Test Names**
✅ Good:
```javascript
it('should display error message when login fails with invalid credentials', ...)
```

❌ Bad:
```javascript
it('test1', ...)
```

### 5. **Clean Up After Tests**
```javascript
after(async function() {
  await quitDriver(driver); // Always quit driver
});
```

### 6. **Use Environment Variables for Sensitive Data**
Never hardcode credentials in test files!

---

## 🐛 Troubleshooting

### Common Issues

#### 1. **ChromeDriver Version Mismatch**
**Error:** `This version of ChromeDriver only supports Chrome version X`

**Solution:**
```bash
npm install --save-dev chromedriver@latest
```

Or manually install the correct version matching your Chrome browser.

#### 2. **Element Not Found**
**Error:** `NoSuchElementError: Unable to locate element`

**Solutions:**
- Add explicit wait: `await waitForElement(driver, locator)`
- Check if element selector is correct
- Verify page has fully loaded
- Check if element is in an iframe

#### 3. **Tests Timeout**
**Error:** `Error: Timeout of 30000ms exceeded`

**Solutions:**
- Increase timeout: `this.timeout(60000)`
- Check if application is running
- Ensure network is stable
- Use headless mode for faster execution

#### 4. **Application Not Running**
**Error:** `ECONNREFUSED`

**Solution:**
```bash
# Start your Vite dev server first
npm run dev
```

Then in another terminal:
```bash
npm test
```

#### 5. **Screenshots Not Saving**
**Solution:**
Create screenshots directory:
```bash
mkdir -p selenium/screenshots
```

### Debug Mode

Add console logs to your tests:
```javascript
it('should debug something', async function() {
  console.log('Current URL:', await driver.getCurrentUrl());
  console.log('Page title:', await driver.getTitle());
  
  const element = await driver.findElement(By.css('.my-element'));
  console.log('Element text:', await element.getText());
});
```

### Running Tests with More Verbose Output
```bash
npx mocha selenium/tests/**/*.test.js --timeout 30000 --reporter spec
```

---

## 📊 Test Reports

### View Test Results

After running tests, check the console output:
```
  Login Functionality
    ✓ should load login page successfully (1234ms)
    ✓ should show error with invalid credentials (2345ms)
    ✓ should login successfully with admin credentials (3456ms)

  3 passing (7.2s)
```

### Screenshots

All screenshots are saved in `selenium/screenshots/` with timestamps:
- `login-page-loaded_1696780800000.png`
- `dashboard-success_1696780810000.png`

---

## 🔄 Continuous Integration (CI)

### GitHub Actions Example

Create `.github/workflows/selenium-tests.yml`:

```yaml
name: Selenium Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Start application
        run: npm run dev &
        
      - name: Wait for app to be ready
        run: npx wait-on http://localhost:5173
      
      - name: Run Selenium tests
        run: npm run test:headless
      
      - name: Upload screenshots
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: test-screenshots
          path: selenium/screenshots/
```

---

## 🎓 Learn More

### Selenium Documentation
- [Selenium WebDriver Docs](https://www.selenium.dev/documentation/webdriver/)
- [Mocha Test Framework](https://mochajs.org/)
- [Chai Assertions](https://www.chaijs.com/)

### MedCure Testing
- Update test credentials in `config/test.config.js`
- Add new page objects for new pages
- Follow existing test patterns
- Keep tests independent and isolated

---

## 🆘 Need Help?

If you encounter issues:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review existing test files for examples
3. Check browser console for JavaScript errors
4. Verify application is running correctly
5. Take screenshots during test execution

---

**Happy Testing! 🚀**
