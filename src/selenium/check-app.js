/**
 * Pre-Test Check Script
 * Verifies that the application is running before executing tests
 * Run with: node src/selenium/check-app.js
 */

/* eslint-env node */

import http from "http";

const APP_URL = process.env.TEST_BASE_URL || "http://localhost:5173";
const HOST = new URL(APP_URL).hostname;
const PORT = new URL(APP_URL).port || 80;

console.log("🔍 Checking if application is running...");
console.log(`   URL: ${APP_URL}\n`);

const options = {
  host: HOST,
  port: PORT,
  path: "/",
  method: "GET",
  timeout: 5000,
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200 || res.statusCode === 304) {
    console.log("✅ Application is running!");
    console.log(`   Status: ${res.statusCode}`);
    console.log("\n🚀 You can now run tests with: npm test\n");
    process.exit(0);
  } else {
    console.log(`⚠️  Application responded with status: ${res.statusCode}`);
    console.log("   Tests might fail if the app is not properly loaded.\n");
    process.exit(0);
  }
});

req.on("error", (error) => {
  console.error("❌ Application is NOT running!");
  console.error(`   Error: ${error.message}\n`);
  console.error("🔧 To fix this:");
  console.error("   1. Open a NEW terminal");
  console.error("   2. Run: npm run dev");
  console.error('   3. Wait for "Local: http://localhost:5173"');
  console.error("   4. Then run tests in THIS terminal: npm test\n");
  process.exit(1);
});

req.on("timeout", () => {
  console.error("❌ Connection timeout!");
  console.error("   Application might not be running.\n");
  req.destroy();
  process.exit(1);
});

req.end();
