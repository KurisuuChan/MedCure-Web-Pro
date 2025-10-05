# 🚀 Notification System - Quick Start Guide

**Get your notification system running in 10 minutes!**

---

## ⚡ Super Fast Setup (10 minutes)

### Step 1: Database (2 minutes)

1. Open Supabase SQL Editor
2. Copy and paste this file: `database/migrations/notification_system_migration.sql`
3. Click "Run" ▶️
4. Wait for "Success" message

**Verify:**

```sql
SELECT COUNT(*) FROM user_notifications;
-- Should run without errors
```

---

### Step 2: Email Provider (5 minutes)

**Choose ONE option:**

#### Option A: SendGrid (Recommended)

1. Go to: https://signup.sendgrid.com/
2. Create free account (100 emails/day)
3. Settings → Sender Authentication → Verify email
4. Settings → API Keys → Create API Key
5. Copy the key (shown only once!)

#### Option B: Resend (Modern Alternative)

1. Go to: https://resend.com/signup
2. Create free account (3,000 emails/month)
3. Domains → Add Domain → Verify
4. API Keys → Create API Key
5. Copy the key

---

### Step 3: Environment Variables (1 minute)

Create `.env.local` in project root:

**For SendGrid:**

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_URL=http://localhost:5173

VITE_SENDGRID_API_KEY=SG.your-key-here
VITE_SENDGRID_FROM_EMAIL=no-reply@yourdomain.com
VITE_SENDGRID_FROM_NAME=MedCure Pharmacy
```

**For Resend:**

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_URL=http://localhost:5173

VITE_RESEND_API_KEY=re_your-key-here
VITE_RESEND_FROM_EMAIL=no-reply@yourdomain.com
VITE_RESEND_FROM_NAME=MedCure Pharmacy
```

---

### Step 4: Restart Dev Server (30 seconds)

```bash
# Stop current server (Ctrl+C)
# Start again
npm run dev
```

---

### Step 5: Test (1 minute)

Open browser console and run:

```javascript
// Test email service
import { emailService } from "./src/services/notifications/EmailService.js";
console.log(emailService.getStatus());
// Should show: { isConfigured: true, provider: 'sendgrid', ready: true }

// Send test email
await emailService.testConfiguration("your-email@example.com");
// Check your inbox!
```

---

## 🎯 Integration (5 minutes)

### Add to Navigation

**File: Your header/navigation component**

```javascript
import NotificationBell from "../components/notifications/NotificationBell.jsx";
import { useAuth } from "../hooks/useAuth";

function Navigation() {
  const { user } = useAuth();

  return (
    <nav>
      {/* Your nav items */}
      {user && <NotificationBell userId={user.id} />}
    </nav>
  );
}
```

### Initialize Service

**File: App.jsx (or main component)**

```javascript
import { useEffect } from "react";
import { notificationService } from "./services/notifications/NotificationService.js";
import { useAuth } from "./hooks/useAuth";

function App() {
  const { user } = useAuth();

  // Initialize on app start
  useEffect(() => {
    notificationService.initialize();
  }, []);

  // Health checks every 15 minutes
  useEffect(() => {
    if (!user) return;

    notificationService.runHealthChecks();
    const interval = setInterval(() => {
      notificationService.runHealthChecks();
    }, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);

  return <div className="App">{/* Your app */}</div>;
}
```

### Use in Your Code

**Example: After completing a sale**

```javascript
import { notificationService } from "../services/notifications/NotificationService.js";
import { useAuth } from "../hooks/useAuth";

const { user } = useAuth();

// After successful payment
await notificationService.notifySaleCompleted(
  saleId,
  totalAmount,
  itemCount,
  user.id
);
```

---

## ✅ Verification

### 1. Check Email Service

```javascript
// Browser console
import { emailService } from "./src/services/notifications/EmailService.js";
emailService.getStatus();
// Expected: { isConfigured: true, provider: 'sendgrid' or 'resend', ready: true }
```

### 2. Create Test Notification

```javascript
// Browser console
import { notificationService } from "./src/services/notifications/NotificationService.js";

await notificationService.initialize();

await notificationService.create({
  userId: "your-user-id",
  title: "Test Notification",
  message: "If you see this, it works!",
  type: "info",
  priority: 3,
  category: "general",
});
// Should appear in bell dropdown immediately
```

### 3. Test Email Delivery

```javascript
// Browser console (sends email for critical notification)
await notificationService.notifyCriticalStock(
  "test-product-123",
  "Test Product",
  5,
  "your-user-id"
);
// Check your email inbox
```

### 4. Check UI

- ✅ Bell icon appears in navigation
- ✅ Click bell → panel opens
- ✅ Notification appears in list
- ✅ Click mark as read → notification updates
- ✅ Click dismiss → notification disappears

---

## 🎉 Done!

Your notification system is now **live and functional**!

**What You Have:**

- ✅ In-app notifications with real-time updates
- ✅ Email notifications for critical alerts
- ✅ Automated health checks (low stock, expiring products)
- ✅ Beautiful UI with bell icon and dropdown panel
- ✅ Production-ready error handling

---

## 📚 Next Steps

### For More Details:

- **Full Setup Guide:** `NOTIFICATION_ENVIRONMENT_SETUP.md`
- **Migration Guide:** `NOTIFICATION_MIGRATION_GUIDE.md`
- **Implementation Summary:** `NOTIFICATION_IMPLEMENTATION_SUMMARY.md`

### Immediate Actions:

1. Test notification creation in your app
2. Verify emails are being sent for critical alerts
3. Check bell icon shows unread count
4. Test on multiple devices (real-time sync)

### Integration:

- Replace old notification calls with new service
- See `NOTIFICATION_MIGRATION_GUIDE.md` for examples

---

## 🐛 Troubleshooting

### "Email service not configured"

- Check `.env.local` exists in project root
- Verify environment variable names start with `VITE_`
- Restart dev server after adding variables

### "Database connection failed"

- Verify Supabase URL and anon key are correct
- Check database migration was executed successfully
- Verify RLS policies allow authenticated users

### Emails not sending

- Check provider dashboard (SendGrid/Resend)
- Verify sender email is verified
- Ensure notification priority is 1 or 2 (only these send emails)
- Check spam folder

### Bell icon not appearing

- Verify user is logged in
- Check NotificationBell is receiving userId prop
- Look for console errors

---

## 🆘 Quick Help

**Check Service Status:**

```javascript
import { emailService } from "./src/services/notifications/EmailService.js";
import { notificationService } from "./src/services/notifications/NotificationService.js";

console.log("Email:", emailService.getStatus());
console.log("Initialized:", notificationService.isInitialized);
```

**Test Everything:**

```javascript
// 1. Initialize
await notificationService.initialize();

// 2. Create notification
const notif = await notificationService.create({
  userId: "your-user-id",
  title: "Test",
  message: "Testing",
  type: "info",
  priority: 3,
  category: "general",
});

console.log("Created:", notif);

// 3. Get unread count
const count = await notificationService.getUnreadCount("your-user-id");
console.log("Unread:", count);

// 4. Send test email
await emailService.testConfiguration("your-email@example.com");
console.log("Check your inbox!");
```

---

## ⏱️ Time Estimate

- **Setup:** 10 minutes
- **Integration:** 5 minutes
- **Testing:** 5 minutes
- **Total:** 20 minutes from start to finish

---

**You're all set! 🚀**

The notification system is ready to keep your users informed about critical events in real-time.
