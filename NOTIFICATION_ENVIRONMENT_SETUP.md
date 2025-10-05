# Notification System - Environment Configuration Guide

## Overview

This guide explains how to configure the MedCure Pharmacy notification system for production deployment. The system supports email notifications via **SendGrid** or **Resend** providers.

---

## 📋 Table of Contents

1. [Email Provider Setup](#email-provider-setup)
2. [Environment Variables](#environment-variables)
3. [Database Migration](#database-migration)
4. [Testing Configuration](#testing-configuration)
5. [Integration Guide](#integration-guide)
6. [Troubleshooting](#troubleshooting)

---

## 🔧 Email Provider Setup

### Option 1: SendGrid (Recommended)

**Why SendGrid?**

- Industry-leading email delivery service
- Free tier: 100 emails/day
- Excellent deliverability rates
- Comprehensive API and documentation

**Setup Steps:**

1. **Create SendGrid Account**

   - Visit: https://signup.sendgrid.com/
   - Sign up for a free account

2. **Verify Sender Identity**

   - Go to Settings → Sender Authentication
   - Verify your domain (recommended) or single sender email
   - Follow SendGrid's verification process

3. **Create API Key**

   - Go to Settings → API Keys
   - Click "Create API Key"
   - Name: `MedCure Notifications`
   - Permissions: Select "Full Access" or "Mail Send" only
   - Copy the API key (shown only once!)

4. **Add to Environment Variables**
   ```env
   VITE_SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   VITE_SENDGRID_FROM_EMAIL=no-reply@yourdomain.com
   VITE_SENDGRID_FROM_NAME=MedCure Pharmacy
   ```

---

### Option 2: Resend (Modern Alternative)

**Why Resend?**

- Modern, developer-friendly API
- Free tier: 100 emails/day, 3,000/month
- Simple setup process
- Growing popularity

**Setup Steps:**

1. **Create Resend Account**

   - Visit: https://resend.com/signup
   - Sign up with GitHub or email

2. **Verify Domain**

   - Go to Domains → Add Domain
   - Add your domain and verify DNS records
   - Or use Resend's test domain for development

3. **Create API Key**

   - Go to API Keys → Create API Key
   - Name: `MedCure Notifications`
   - Copy the API key

4. **Add to Environment Variables**
   ```env
   VITE_RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   VITE_RESEND_FROM_EMAIL=no-reply@yourdomain.com
   VITE_RESEND_FROM_NAME=MedCure Pharmacy
   ```

---

## 🌍 Environment Variables

### Development (.env.local)

Create a `.env.local` file in your project root:

```env
# ============================================================================
# MedCure Pharmacy - Notification System Configuration
# ============================================================================

# Supabase Configuration (required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Application URL (required for email links)
VITE_APP_URL=http://localhost:5173

# Email Provider: SendGrid (Option 1)
VITE_SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_SENDGRID_FROM_EMAIL=no-reply@medcure.com
VITE_SENDGRID_FROM_NAME=MedCure Pharmacy

# Email Provider: Resend (Option 2 - comment out SendGrid if using this)
# VITE_RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# VITE_RESEND_FROM_EMAIL=no-reply@medcure.com
# VITE_RESEND_FROM_NAME=MedCure Pharmacy

# ============================================================================
# Notes:
# - Only configure ONE email provider (SendGrid OR Resend)
# - The system will automatically detect which provider to use
# - If no provider is configured, emails will be disabled (in-app only)
# ============================================================================
```

### Production (.env.production)

For production deployment (Vercel, Netlify, etc.):

```env
# Supabase
VITE_SUPABASE_URL=https://your-production-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key

# Application URL
VITE_APP_URL=https://medcure.yourdomain.com

# Email Provider (choose one)
VITE_SENDGRID_API_KEY=SG.production-key-here
VITE_SENDGRID_FROM_EMAIL=notifications@medcure.com
VITE_SENDGRID_FROM_NAME=MedCure Pharmacy Notifications
```

---

## 🗄️ Database Migration

### Step 1: Run Migration SQL

Execute the migration file in your Supabase SQL Editor:

```bash
# File location:
database/migrations/notification_system_migration.sql
```

**What it does:**

- ✅ Adds new columns to `user_notifications` table (priority, category, dismissed_at, email_sent)
- ✅ Creates 5 performance indexes
- ✅ Sets up Row Level Security (RLS) policies
- ✅ Adds helper functions (`get_unread_notification_count`, `cleanup_old_notifications`)
- ✅ Creates statistics view
- ✅ Removes unused tables (notifications, notification_rules, email_queue)

### Step 2: Verify Migration

Run this query to verify:

```sql
-- Check if migration was successful
SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'user_notifications'
  AND column_name IN ('priority', 'category', 'dismissed_at', 'email_sent', 'email_sent_at');

-- Expected: 5 rows returned
```

### Step 3: Test Helper Functions

```sql
-- Test unread count function (should return 0 for new user)
SELECT get_unread_notification_count('user-id-here');

-- Test cleanup function (should return 0 if no old notifications)
SELECT cleanup_old_notifications(30);
```

---

## ✅ Testing Configuration

### Test 1: Check Email Service Status

```javascript
// In browser console or test file
import { emailService } from "./src/services/notifications/EmailService.js";

const status = emailService.getStatus();
console.log("Email Service Status:", status);

// Expected output:
// {
//   isConfigured: true,
//   provider: 'sendgrid' or 'resend',
//   fromEmail: 'no-reply@medcure.com',
//   fromName: 'MedCure Pharmacy',
//   ready: true
// }
```

### Test 2: Send Test Email

```javascript
// Send a test email to verify configuration
const result = await emailService.testConfiguration("your-email@example.com");
console.log("Test Result:", result);

// Expected output (success):
// {
//   success: true,
//   message: 'Test email sent successfully via sendgrid to your-email@example.com'
// }
```

### Test 3: Create Test Notification

```javascript
import { notificationService } from "./src/services/notifications/NotificationService.js";

// Initialize service
await notificationService.initialize();

// Create a test notification
const notification = await notificationService.create({
  userId: "your-user-id",
  title: "🧪 Test Notification",
  message: "This is a test notification to verify the system is working.",
  type: "info",
  priority: 3, // Medium priority (in-app only)
  category: "general",
});

console.log("Created notification:", notification);

// Check if it appears in the UI
```

### Test 4: Create Critical Notification (Sends Email)

```javascript
// Create a critical notification (priority 1 or 2 sends email)
const criticalNotif = await notificationService.notifyCriticalStock(
  "product-123",
  "Paracetamol 500mg",
  5, // Only 5 pieces left
  "your-user-id"
);

console.log("Critical notification created:", criticalNotif);
// Check your email inbox for the notification
```

---

## 🔌 Integration Guide

### Step 1: Add NotificationBell to Navigation

```jsx
// In your navigation/header component (e.g., src/components/layout/Header.jsx)
import NotificationBell from "../components/notifications/NotificationBell.jsx";
import { useAuth } from "../hooks/useAuth";

function Header() {
  const { user } = useAuth();

  return (
    <header>
      <nav>
        {/* Your navigation items */}

        {/* Add notification bell */}
        {user && <NotificationBell userId={user.id} />}
      </nav>
    </header>
  );
}
```

### Step 2: Initialize Notification Service on App Start

```jsx
// In your main App.jsx or index.jsx
import { useEffect } from "react";
import { notificationService } from "./services/notifications/NotificationService.js";
import { useAuth } from "./hooks/useAuth";

function App() {
  const { user } = useAuth();

  useEffect(() => {
    // Initialize notification service when app starts
    notificationService.initialize().catch((err) => {
      console.error("Failed to initialize notifications:", err);
    });
  }, []);

  useEffect(() => {
    if (!user) return;

    // Run health checks every 15 minutes
    const interval = setInterval(() => {
      notificationService.runHealthChecks();
    }, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);

  return <div className="App">{/* Your app content */}</div>;
}
```

### Step 3: Replace Old Notification Calls

**Before (old code):**

```javascript
import { SimpleNotificationService } from "../services/domains/notifications/simpleNotificationService";

SimpleNotificationService.showSaleComplete(amount, itemCount);
```

**After (new code):**

```javascript
import { notificationService } from "../services/notifications/NotificationService.js";
import { useAuth } from "../hooks/useAuth";

const { user } = useAuth();

await notificationService.notifySaleCompleted(
  saleId,
  amount,
  itemCount,
  user.id
);
```

### Step 4: Trigger Notifications in Your Code

**Example: Low Stock Alert**

```javascript
// After updating product inventory
if (product.stock_in_pieces <= product.reorder_level) {
  await notificationService.notifyLowStock(
    product.id,
    product.brand_name,
    product.stock_in_pieces,
    product.reorder_level,
    currentUser.id
  );
}
```

**Example: Sale Completed**

```javascript
// After successful payment
const notification = await notificationService.notifySaleCompleted(
  saleId,
  totalAmount,
  cartItems.length,
  currentUser.id
);
```

**Example: Product Expiring**

```javascript
// In automated health check or manual trigger
await notificationService.notifyExpiringSoon(
  product.id,
  product.brand_name,
  product.expiry_date,
  daysRemaining,
  currentUser.id
);
```

---

## 🔍 Troubleshooting

### Issue: "Email service not configured"

**Symptoms:**

- Console warning: `⚠️ EmailService: No email provider configured`
- Emails not being sent

**Solution:**

1. Check `.env.local` file exists in project root
2. Verify environment variable names are correct (must start with `VITE_`)
3. Restart dev server after adding environment variables
4. Verify API key is valid (test with email provider's dashboard)

---

### Issue: "Database connection failed"

**Symptoms:**

- Error: `Database connection failed: [error message]`
- Notifications not saving

**Solution:**

1. Check Supabase URL and anon key in `.env.local`
2. Verify database migration was executed successfully
3. Check Supabase dashboard for service status
4. Verify RLS policies allow authenticated users

---

### Issue: Emails not sending (no error)

**Symptoms:**

- Notification created successfully
- No email received
- No error in console

**Possible Causes:**

1. **Priority too low** - Only priority 1-2 send emails
   - Solution: Use `notifyCriticalStock()` or `notifyExpiringSoon()` helpers
2. **Email provider not verified**

   - Solution: Verify sender domain/email in SendGrid/Resend dashboard

3. **Email in spam folder**

   - Solution: Check spam/junk folder, configure SPF/DKIM records

4. **API key missing permissions**
   - Solution: Regenerate API key with "Mail Send" permission

---

### Issue: Duplicate notifications

**Symptoms:**

- Same notification appears multiple times
- Spam notifications for same product

**Solution:**

- The system has automatic deduplication (24-hour window)
- If still occurring, check that `productId` is being passed in metadata
- Verify database doesn't have duplicate entries

---

### Issue: Real-time updates not working

**Symptoms:**

- Bell icon count doesn't update automatically
- Need to refresh page to see new notifications

**Solution:**

1. Check Supabase real-time is enabled for project
2. Verify RLS policies allow SELECT for current user
3. Check browser console for Supabase subscription errors
4. Ensure `NotificationBell` component is receiving correct `userId` prop

---

## 📊 Monitoring & Maintenance

### Daily Cleanup Task

Run this once per day (via cron job or scheduled function):

```javascript
// Clean up notifications older than 30 days
await notificationService.cleanup(30);
```

### Database Statistics

Check notification statistics:

```sql
-- View notification statistics
SELECT * FROM notification_stats;

-- Expected output:
-- total_count | unread_count | read_count | dismissed_count | avg_priority
```

### Email Delivery Monitoring

- **SendGrid**: Check dashboard at https://app.sendgrid.com/stats
- **Resend**: Check dashboard at https://resend.com/emails

---

## 🎯 Next Steps

1. ✅ Configure email provider (SendGrid or Resend)
2. ✅ Run database migration
3. ✅ Test email configuration
4. ✅ Add NotificationBell to navigation
5. ✅ Replace old notification calls with new service
6. ✅ Test end-to-end notification flow
7. ✅ Set up monitoring and cleanup tasks
8. ✅ Deploy to production

---

## 📞 Support

If you encounter issues not covered in this guide:

1. Check browser console for error messages
2. Check Supabase logs for database errors
3. Check email provider dashboard for delivery issues
4. Review notification service logs (`console.log` statements)

---

## 📝 Summary Checklist

- [ ] Email provider account created (SendGrid or Resend)
- [ ] API key generated and added to `.env.local`
- [ ] From email verified with provider
- [ ] Database migration executed successfully
- [ ] Helper functions tested
- [ ] Test email sent successfully
- [ ] NotificationBell added to navigation
- [ ] Health checks running automatically
- [ ] Old notification code replaced
- [ ] Production environment variables configured
- [ ] Monitoring and cleanup tasks scheduled

---

**Configuration complete! 🎉**

Your notification system is now ready to send in-app and email alerts for critical events.
