# 🚀 Notification System - Quick Reference Guide

## ✅ **System Status: FULLY OPERATIONAL**

---

## 🎯 **How Your Notification System Works Now**

### **1. Real-Time Alerts (POS Transactions)**

When a product sells out during checkout:

- ⚡ **Instant out-of-stock alert** (< 1 second)
- 📧 Email sent (if enabled)
- 🔔 Appears in notification dropdown
- 🛡️ Database prevents duplicates automatically

### **2. Scheduled Health Checks (Every 15 Minutes)**

Background system monitors inventory:

- 🚨 **Out-of-Stock:** Always checked (critical safety)
- ⚠️ **Low Stock:** Respects your interval (15min-24hr)
- 📅 **Expiring Products:** Respects your interval (1hr-24hr)
- 🧠 Smart deduplication prevents spam

### **3. User Configuration (Settings → Notifications)**

You control the monitoring frequency:

- ⏱️ Low Stock Check: 15min to 24hr intervals
- ⏱️ Expiring Check: 1hr to 24hr intervals
- 📧 Email Alerts: On/Off toggle
- 📨 Manual Check: Send report anytime

---

## 📋 **Quick Actions**

### **Test Immediate Out-of-Stock Alert**

```javascript
// 1. Open POS page
// 2. Find product with low stock (e.g., 2 pieces)
// 3. Sell all remaining pieces
// 4. Watch for notification (appears immediately)
```

### **Run Manual Health Check**

```javascript
// Open browser console (F12)
window.notificationService.runHealthChecks();

// See detailed logs showing:
// - Which checks ran vs skipped
// - How many notifications created
// - How many blocked by deduplication
```

### **Debug Product Stock Levels**

```javascript
// Open browser console (F12)
window.notificationService.debugProductStockLevels();

// See analysis of:
// - Total products
// - Out of stock count
// - Low stock count
// - Products without reorder level
```

### **Check Your Settings**

```javascript
// Open browser console (F12)
const settings = localStorage.getItem("medcure-notification-settings");
console.log(JSON.parse(settings));

// Shows your configured intervals
```

---

## 🔍 **Understanding the Logs**

### **Health Check Start**

```
🔍 Starting comprehensive health check...
⏱️ User Settings: Low Stock=60min, Expiring=360min
📊 Last Checks: Low Stock=45min ago, Expiring=120min ago
🎯 Running Checks: Low Stock=⏭️ SKIP, Expiring=⏭️ SKIP, Out-of-Stock=✅ ALWAYS
```

**Meaning:** Shows your settings and which checks will run

### **Out-of-Stock Detection**

```
🔍 [Health Check] Starting out of stock check...
📦 Found 3 out of stock products
🚨 Creating IMMEDIATE out of stock alert for: Aspirin 500mg
```

**Meaning:** Found products with stock = 0, creating alerts

### **Deduplication**

```
✅ Out of stock check completed. Created 2 new notifications,
   1 blocked by database deduplication, 0 failures
```

**Meaning:** 2 new alerts sent, 1 was already sent recently (spam prevented)

### **Final Summary**

```
✅ Health check completed: 2 total notifications
   (0 low stock, 0 expiring, 2 out-of-stock)
```

**Meaning:** Total new notifications created this run

---

## ⚙️ **Configuration Guide**

### **For High-Volume Pharmacy**

```
Low Stock Check: 15-30 minutes
Expiring Check: 2-6 hours
Email Alerts: ON
```

**Why:** Frequent checks catch issues fast in busy environment

### **For Medium-Volume Pharmacy (Recommended)**

```
Low Stock Check: 1 hour
Expiring Check: 6 hours
Email Alerts: ON
```

**Why:** Balanced monitoring without excessive notifications

### **For Low-Volume Pharmacy**

```
Low Stock Check: 6-12 hours
Expiring Check: 12-24 hours
Email Alerts: ON
```

**Why:** Less frequent checks reduce noise for slower inventory turnover

### **For Overnight/Weekend Mode**

```
Low Stock Check: 12-24 hours
Expiring Check: 24 hours
Email Alerts: OFF (or ON for manager)
```

**Why:** Minimal monitoring when pharmacy is closed

---

## 🐛 **Troubleshooting**

### **"Not getting out-of-stock alerts"**

✅ Check browser console for logs  
✅ Verify product `is_active = true` in database  
✅ Verify product `stock_in_pieces = 0`  
✅ Run: `window.notificationService.runHealthChecks()`  
✅ Check if deduplication blocked (alert sent < 24hr ago)

### **"Too many duplicate notifications"**

✅ Database deduplication should prevent this  
✅ Check console logs for "blocked by database deduplication"  
✅ Verify `should_send_notification` RPC function exists in Supabase  
✅ Default cooldown is 24 hours per product

### **"Low stock checks not running"**

✅ Check your configured interval in Settings  
✅ Verify enough time passed since last check  
✅ Console shows: "Low Stock=⏭️ SKIP" with reason  
✅ Wait for interval to elapse, then check runs

### **"Settings not saving"**

✅ Check browser localStorage (F12 → Application → Local Storage)  
✅ Look for key: `medcure-notification-settings`  
✅ Value should be JSON object with intervals  
✅ Try clearing cache and re-saving

---

## 📊 **Performance Metrics**

### **What's Normal**

- Health checks complete in 1-3 seconds
- 0-10 notifications per check (depends on inventory)
- Most notifications blocked by deduplication (good!)
- Out-of-stock alerts < 1 second in POS

### **What's Concerning**

- ❌ Health checks taking > 10 seconds (database slow)
- ❌ > 50 notifications per check (inventory crisis!)
- ❌ No deduplication happening (RPC function broken)
- ❌ Out-of-stock alerts delayed (check POS integration)

---

## 🎓 **Best Practices**

### **DO:**

✅ Configure intervals based on your pharmacy size  
✅ Monitor console logs periodically  
✅ Keep email alerts ON for critical notifications  
✅ Test after any inventory system changes  
✅ Use manual check before closing for the day

### **DON'T:**

❌ Set intervals too low (< 15 min) - causes unnecessary load  
❌ Disable out-of-stock alerts - critical safety feature  
❌ Ignore database deduplication - prevents spam  
❌ Clear notifications without reviewing - might miss issues  
❌ Modify notification code without testing

---

## 📚 **Related Documentation**

- **NOTIFICATION_SYSTEM_ANALYSIS.md** - Detailed technical analysis
- **FIXES_APPLIED.md** - Implementation guide and testing
- **NotificationService.js** - Source code with comments
- **NotificationManagement.jsx** - Settings UI component

---

## 🆘 **Emergency Commands**

### **Force Health Check Now**

```javascript
window.notificationService.runHealthChecks();
```

### **See All Unread Notifications**

```javascript
window.notificationService.getUnreadCount("YOUR_USER_ID");
```

### **Debug Stock Levels**

```javascript
window.notificationService.debugProductStockLevels();
```

### **Check Notification Service Status**

```javascript
console.log(window.notificationService.isInitialized); // should be true
```

### **Reset Settings to Default**

```javascript
localStorage.removeItem("medcure-notification-settings");
// Then refresh page
```

---

## 📞 **Support Checklist**

Before asking for help, check:

- [ ] Browser console logs (F12)
- [ ] Settings saved correctly (localStorage)
- [ ] Database connection working (Supabase)
- [ ] Health checks running (every 15 min)
- [ ] Notification service initialized (`isInitialized = true`)
- [ ] Products are `is_active = true` in database

---

**Last Updated:** October 14, 2025  
**System Version:** v1.0 (Production Ready)  
**Status:** ✅ All Systems Operational
