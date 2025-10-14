# 🧪 Selenium Test Automation

Automated end-to-end testing for MedCure Pharmacy using Selenium WebDriver.

## 📁 Directory Structure

```
selenium/
├── config/              # Test configuration files
├── helpers/             # Reusable utilities and WebDriver setup
├── page-objects/        # Page Object Model (POM) classes
├── tests/               # Test files
├── screenshots/         # Auto-generated screenshots
├── reports/             # Test reports
├── .env.example         # Environment variables template
├── SELENIUM_TESTING_GUIDE.md    # Complete testing guide
└── QUICK_START.md       # Quick reference
```

## 🚀 Quick Start

1. **Start the application:**
   ```bash
   npm run dev
   ```

2. **Run all tests:**
   ```bash
   npm test
   ```

3. **Run in headless mode:**
   ```bash
   npm run test:headless
   ```

## 📚 Documentation

- **[QUICK_START.md](./QUICK_START.md)** - Get started in 2 minutes
- **[SELENIUM_TESTING_GUIDE.md](./SELENIUM_TESTING_GUIDE.md)** - Complete guide

## 🧪 Available Tests

- `npm run test:login` - Login functionality
- `npm run test:dashboard` - Dashboard features
- `npm run test:inventory` - Inventory management

## 📸 Screenshots

All screenshots are saved in `selenium/screenshots/` with timestamps.

## 🔧 Configuration

Edit `config/test.config.js` to customize:
- Base URL
- Test credentials
- Timeouts
- Browser settings

---

**For detailed information, see [SELENIUM_TESTING_GUIDE.md](./SELENIUM_TESTING_GUIDE.md)**
