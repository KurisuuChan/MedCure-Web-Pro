# 🚀 Quick Setup - Microsoft Edge Testing

## ✅ Setup Complete!

Your Selenium tests are now configured to use **Microsoft Edge** browser.

---

## 📋 Before Running Tests

### 1. **Start Your Application** (Required!)

Open a **NEW terminal** and run:

```bash
npm run dev
```

Wait until you see:

```
➜  Local:   http://localhost:5173/
```

**Keep this terminal running!**

---

## 🧪 Running Tests

Open **ANOTHER terminal** (keep the dev server running) and run:

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
npm run test:login      # Login tests only
npm run test:dashboard  # Dashboard tests only
npm run test:inventory  # Inventory tests only
```

### Verify Setup (Test if Edge works)

```bash
npm run test:verify
```

### Check if App is Running

```bash
npm run test:check
```

---

## 📝 What Changed for Edge

✅ Installed `edgedriver` package  
✅ Updated `driver.js` to use Edge instead of Chrome  
✅ Updated config to use `edge` as default browser  
✅ All Chrome options work with Edge (it's Chromium-based)

---

## 🎯 Test Workflow

```
Terminal 1                     Terminal 2
─────────────                  ─────────────
npm run dev                    (wait for server)

(app running at :5173)         npm test

(keep running...)              (tests execute)

                               ✅ 15 tests pass!
```

---

## 🐛 If Tests Fail

1. **Check if app is running:**

   ```bash
   npm run test:check
   ```

2. **Verify Edge setup:**

   ```bash
   npm run test:verify
   ```

3. **Make sure Edge is installed:**

   - Check: `edge://version/`

4. **Update test credentials** in:
   - `src/selenium/config/test.config.js`

---

## 📸 Screenshots

Test screenshots are saved in:

```
src/selenium/screenshots/
```

---

## 🎓 Documentation

- Full Guide: `src/selenium/SELENIUM_TESTING_GUIDE.md`
- Quick Start: `src/selenium/QUICK_START.md`
- Setup Summary: `SELENIUM_SETUP_SUMMARY.md`

---

## 🎉 Ready to Test!

1. **Terminal 1:** `npm run dev` (keep running)
2. **Terminal 2:** `npm test`

**Happy Testing with Edge! 🚀**
