# 🔄 Notification System Migration Guide

This guide helps you migrate from the old fragmented notification system to the new unified, database-first notification system.

---

## 📋 Table of Contents

1. [Overview of Changes](#overview-of-changes)
2. [Step-by-Step Migration](#step-by-step-migration)
3. [Code Migration Examples](#code-migration-examples)
4. [Testing Migration](#testing-migration)
5. [Rollback Plan](#rollback-plan)

---

## 🔍 Overview of Changes

### What's Being Replaced

**OLD System:**

- ❌ Multiple fragmented services (NotificationSystem.js, simpleNotificationService.js, notificationRulesEngine.js)
- ❌ localStorage-only persistence (no cross-device sync)
- ❌ No email integration
- ❌ Unused database tables
- ❌ Duplicate UI components (NotificationDropdown.jsx, NotificationDropdownV2.jsx)

**NEW System:**

- ✅ Single unified NotificationService.js
- ✅ Database-first (Supabase user_notifications table)
- ✅ Email integration (SendGrid/Resend)
- ✅ Real-time updates via Supabase subscriptions
- ✅ Automated health checks
- ✅ Smart deduplication
- ✅ Modern React components (NotificationBell, NotificationPanel)

---

## 🚀 Step-by-Step Migration

### Phase 1: Database Setup (5 minutes)

1. **Run Database Migration**

   ```bash
   # In Supabase SQL Editor, execute:
   database/migrations/notification_system_migration.sql
   ```

2. **Verify Migration**

   ```sql
   -- Check new columns exist
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'user_notifications';

   -- Should include: priority, category, dismissed_at, email_sent, email_sent_at
   ```

3. **Test Helper Functions**
   ```sql
   -- Should return 0 for new user
   SELECT get_unread_notification_count('test-user-id');
   ```

---

### Phase 2: Environment Configuration (10 minutes)

1. **Create .env.local**

   ```bash
   # Copy template
   cp .env.example .env.local
   ```

2. **Configure Email Provider**

   Choose ONE option:

   **Option A: SendGrid**

   ```env
   VITE_SENDGRID_API_KEY=SG.your-key-here
   VITE_SENDGRID_FROM_EMAIL=no-reply@medcure.com
   VITE_SENDGRID_FROM_NAME=MedCure Pharmacy
   ```

   **Option B: Resend**

   ```env
   VITE_RESEND_API_KEY=re_your-key-here
   VITE_RESEND_FROM_EMAIL=no-reply@medcure.com
   VITE_RESEND_FROM_NAME=MedCure Pharmacy
   ```

3. **Set Application URL**

   ```env
   VITE_APP_URL=http://localhost:5173  # or your production URL
   ```

4. **Restart Dev Server**
   ```bash
   npm run dev
   ```

---

### Phase 3: Code Migration (30 minutes)

#### Step 1: Update Imports

**File: `src/pages/POSPage.jsx`**

**BEFORE:**

```javascript
import { SimpleNotificationService } from "../services/domains/notifications/simpleNotificationService";
```

**AFTER:**

```javascript
import { notificationService } from "../services/notifications/NotificationService.js";
```

#### Step 2: Update Notification Calls

**BEFORE (old code):**

```javascript
// In POSPage.jsx around line 214
SimpleNotificationService.showSaleComplete(
  result.subtotal_amount,
  result.items.length
);

// Around line 221-222
await SimpleNotificationService.checkAndNotifyLowStock();
await SimpleNotificationService.checkAndNotifyExpiring();
```

**AFTER (new code):**

```javascript
// After successful sale
await notificationService.notifySaleCompleted(
  result.sale_id, // Sale ID from transaction
  result.subtotal_amount, // Total amount
  result.items.length, // Number of items
  user.id // Current user ID
);

// Health checks (run periodically, not after every sale)
// These should be called once every 15 minutes, not after each transaction
// Remove these lines from POS and add to App.jsx instead
```

#### Step 3: Add Health Checks to App.jsx

**File: `src/App.jsx` (or your main app component)**

**ADD:**

```javascript
import { useEffect } from 'react';
import { notificationService } from './services/notifications/NotificationService.js';
import { useAuth } from './hooks/useAuth';

function App() {
  const { user } = useAuth();

  // Initialize notification service
  useEffect(() => {
    notificationService.initialize().catch(err => {
      console.error('Failed to initialize notifications:', err);
    });
  }, []);

  // Run health checks every 15 minutes
  useEffect(() => {
    if (!user) return;

    // Run immediately on mount
    notificationService.runHealthChecks();

    // Then every 15 minutes
    const interval = setInterval(() => {
      notificationService.runHealthChecks();
    }, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);

  return (
    // Your app content
  );
}
```

#### Step 4: Add NotificationBell to Navigation

**File: Your navigation/header component**

**ADD:**

```javascript
import NotificationBell from "../components/notifications/NotificationBell.jsx";
import { useAuth } from "../hooks/useAuth";

function Navigation() {
  const { user } = useAuth();

  return (
    <nav>
      {/* Your existing nav items */}

      {/* Add notification bell */}
      {user && <NotificationBell userId={user.id} />}
    </nav>
  );
}
```

---

### Phase 4: Remove Old Files (5 minutes)

**⚠️ IMPORTANT: Only delete after verifying new system works!**

Delete these files:

```bash
# Deprecated service files
rm src/services/NotificationMigration.js
rm src/services/domains/notifications/notificationRulesEngine.js
rm src/services/domains/notifications/notificationAnalytics.js
rm src/services/domains/notifications/simpleNotificationService.js
rm src/services/domains/notifications/enhancedNotificationTypes.js

# Deprecated component
rm src/components/layout/NotificationDropdownV2.jsx
```

**Update index.js exports:**

**File: `src/services/domains/notifications/index.js`**

**BEFORE:**

```javascript
export { SimpleNotificationService } from "./simpleNotificationService";
```

**AFTER:**

```javascript
// Remove old exports
// New notification system is imported directly:
// import { notificationService } from '../../services/notifications/NotificationService.js';
```

---

## 📝 Code Migration Examples

### Example 1: POSPage.jsx (Complete Migration)

**BEFORE:**

```javascript
import { SimpleNotificationService } from "../services/domains/notifications/simpleNotificationService";

// In handlePaymentSuccess function
const handlePaymentSuccess = async (result) => {
  SimpleNotificationService.showSaleComplete(
    result.subtotal_amount,
    result.items.length
  );

  await SimpleNotificationService.checkAndNotifyLowStock();
  await SimpleNotificationService.checkAndNotifyExpiring();

  // ... rest of code
};
```

**AFTER:**

```javascript
import { notificationService } from "../services/notifications/NotificationService.js";
import { useAuth } from "../hooks/useAuth";

export default function POSPage() {
  const { user } = useAuth();

  // In handlePaymentSuccess function
  const handlePaymentSuccess = async (result) => {
    // Create sale notification
    await notificationService.notifySaleCompleted(
      result.sale_id,
      result.subtotal_amount,
      result.items.length,
      user.id
    );

    // Remove health check calls from here - they run automatically every 15 minutes
    // ... rest of code
  };
}
```

### Example 2: Inventory Page (Low Stock Alerts)

**BEFORE:**

```javascript
// Manual check after inventory update
if (product.stock_in_pieces <= product.reorder_level) {
  alert(`Low stock: ${product.name}`);
}
```

**AFTER:**

```javascript
import { notificationService } from "../services/notifications/NotificationService.js";
import { useAuth } from "../hooks/useAuth";

// After inventory update
const { user } = useAuth();

if (product.stock_in_pieces <= product.reorder_level) {
  const isCritical =
    product.stock_in_pieces <= Math.floor(product.reorder_level * 0.3);

  if (isCritical) {
    // Critical stock (30% or less of reorder level) - sends email
    await notificationService.notifyCriticalStock(
      product.id,
      product.brand_name,
      product.stock_in_pieces,
      user.id
    );
  } else {
    // Low stock - in-app only
    await notificationService.notifyLowStock(
      product.id,
      product.brand_name,
      product.stock_in_pieces,
      product.reorder_level,
      user.id
    );
  }
}
```

### Example 3: Product Expiry Alerts

**BEFORE:**

```javascript
// Manual check
const daysUntilExpiry = Math.ceil(
  (new Date(product.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)
);
if (daysUntilExpiry <= 30) {
  console.log(`Product expiring: ${product.name}`);
}
```

**AFTER:**

```javascript
import { notificationService } from "../services/notifications/NotificationService.js";
import { useAuth } from "../hooks/useAuth";

const { user } = useAuth();

// Automated via health checks, but can also trigger manually
const daysUntilExpiry = Math.ceil(
  (new Date(product.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)
);

if (daysUntilExpiry <= 30) {
  await notificationService.notifyExpiringSoon(
    product.id,
    product.brand_name,
    product.expiry_date,
    daysUntilExpiry,
    user.id
  );
}
```

### Example 4: System Error Notifications

**BEFORE:**

```javascript
try {
  await someRiskyOperation();
} catch (error) {
  console.error("Operation failed:", error);
  alert("An error occurred");
}
```

**AFTER:**

```javascript
import { notificationService } from "../services/notifications/NotificationService.js";
import { useAuth } from "../hooks/useAuth";

const { user } = useAuth();

try {
  await someRiskyOperation();
} catch (error) {
  console.error("Operation failed:", error);

  // Send critical error notification (includes email)
  await notificationService.notifySystemError(
    error.message,
    error.code || "UNKNOWN_ERROR",
    user.id
  );
}
```

---

## ✅ Testing Migration

### Test Checklist

#### 1. Database Tests

- [ ] Migration executed successfully
- [ ] New columns exist in user_notifications table
- [ ] Indexes created (check with `\d user_notifications` in psql)
- [ ] RLS policies active (try querying as different user)
- [ ] Helper functions work

#### 2. Email Configuration Tests

```javascript
// In browser console or test file
import { emailService } from "./src/services/notifications/EmailService.js";

// Check status
console.log(emailService.getStatus());
// Expected: { isConfigured: true, provider: 'sendgrid', ready: true }

// Send test email
await emailService.testConfiguration("your-email@example.com");
// Check your inbox
```

#### 3. Notification Creation Tests

```javascript
import { notificationService } from "./src/services/notifications/NotificationService.js";

// Initialize
await notificationService.initialize();

// Create test notification
const notif = await notificationService.create({
  userId: "your-user-id",
  title: "Test Notification",
  message: "Testing the new notification system",
  type: "info",
  priority: 3,
  category: "general",
});

console.log("Created:", notif);
// Should see in UI immediately
```

#### 4. Real-time Update Tests

- [ ] Open app in two browser windows (same user)
- [ ] Create notification in window 1
- [ ] Verify it appears in window 2 without refresh
- [ ] Check bell icon count updates automatically

#### 5. Email Delivery Tests

```javascript
// Create critical notification (sends email)
await notificationService.notifyCriticalStock(
  "test-product-123",
  "Test Product",
  5,
  "your-user-id"
);

// Check:
// 1. Notification appears in UI
// 2. Email received in inbox
// 3. Email has correct formatting
// 4. Links in email work
```

#### 6. UI Component Tests

- [ ] Bell icon appears in navigation
- [ ] Unread count shows correctly
- [ ] Panel opens when clicking bell
- [ ] Notifications list renders properly
- [ ] Mark as read works
- [ ] Dismiss works
- [ ] Mark all as read works
- [ ] Dismiss all works
- [ ] Pagination works (if > 10 notifications)
- [ ] Navigation to linked pages works
- [ ] Panel closes when clicking outside

#### 7. Health Check Tests

```javascript
// Manually trigger health checks
await notificationService.runHealthChecks();

// Check console for:
// "🔍 Running notification health checks..."
// "👥 Found X users to check"
// "📦 Found X low stock products"
// "📅 Found X expiring products"
// "✅ Health checks completed: X low stock, X expiring products"
```

#### 8. Performance Tests

- [ ] Page loads quickly with notifications
- [ ] Real-time updates don't cause lag
- [ ] Large notification lists (50+) render smoothly
- [ ] No memory leaks (check browser dev tools)

---

## 🔙 Rollback Plan

If you need to revert to the old system:

### Step 1: Restore Old Files

```bash
# If you have git history
git checkout HEAD~1 -- src/services/NotificationMigration.js
git checkout HEAD~1 -- src/services/domains/notifications/
git checkout HEAD~1 -- src/components/layout/NotificationDropdownV2.jsx
```

### Step 2: Revert Code Changes

```bash
# Revert import statements
# Change back to:
import { SimpleNotificationService } from "../services/domains/notifications/simpleNotificationService";
```

### Step 3: Database Rollback (Optional)

```sql
-- Only if you want to remove new columns (NOT recommended)
ALTER TABLE user_notifications DROP COLUMN IF EXISTS priority;
ALTER TABLE user_notifications DROP COLUMN IF EXISTS category;
ALTER TABLE user_notifications DROP COLUMN IF EXISTS dismissed_at;
ALTER TABLE user_notifications DROP COLUMN IF EXISTS email_sent;
ALTER TABLE user_notifications DROP COLUMN IF EXISTS email_sent_at;

-- Drop indexes
DROP INDEX IF EXISTS idx_user_notif_active;
DROP INDEX IF EXISTS idx_user_notif_unread_count;
DROP INDEX IF EXISTS idx_user_notif_category;
DROP INDEX IF EXISTS idx_user_notif_priority;
DROP INDEX IF EXISTS idx_user_notif_metadata;

-- Drop functions
DROP FUNCTION IF EXISTS get_unread_notification_count(uuid);
DROP FUNCTION IF EXISTS cleanup_old_notifications(integer);
```

**⚠️ WARNING:** Rollback will lose all notifications created with the new system!

---

## 📊 Migration Progress Tracking

Use this checklist to track your progress:

### Pre-Migration

- [ ] Read migration guide completely
- [ ] Backup database
- [ ] Create git branch for migration
- [ ] Review current notification usage

### Phase 1: Database

- [ ] Execute migration SQL
- [ ] Verify new columns
- [ ] Test helper functions
- [ ] Check RLS policies

### Phase 2: Configuration

- [ ] Create .env.local
- [ ] Configure email provider
- [ ] Verify API key
- [ ] Test email sending

### Phase 3: Code

- [ ] Update imports in all files
- [ ] Replace notification calls
- [ ] Add NotificationBell to navigation
- [ ] Add health checks to App.jsx
- [ ] Remove old notification service calls

### Phase 4: Testing

- [ ] Test notification creation
- [ ] Test email delivery
- [ ] Test real-time updates
- [ ] Test UI components
- [ ] Test health checks
- [ ] Performance testing

### Phase 5: Cleanup

- [ ] Delete old service files
- [ ] Delete old component files
- [ ] Update exports in index.js
- [ ] Clean up unused imports
- [ ] Remove old localStorage keys

### Post-Migration

- [ ] Monitor logs for errors
- [ ] Check email delivery rates
- [ ] Verify user feedback
- [ ] Document any issues
- [ ] Update team on new system

---

## 🎯 Migration Complete!

Once all checkboxes are ticked, your migration is complete. The new notification system is:

✅ Unified (single service)  
✅ Database-backed (persistent)  
✅ Real-time (Supabase subscriptions)  
✅ Email-integrated (SendGrid/Resend)  
✅ Automated (health checks)  
✅ Production-ready (error handling, deduplication)

**Next Steps:**

1. Monitor notifications for 24 hours
2. Gather user feedback
3. Adjust health check frequency if needed
4. Configure email templates (optional)
5. Set up monitoring dashboards (optional)

---

## 📞 Support

If you encounter issues during migration:

1. Check browser console for errors
2. Check Supabase logs
3. Check email provider dashboard
4. Review this migration guide
5. Check NOTIFICATION_ENVIRONMENT_SETUP.md

**Common issues and solutions documented in troubleshooting section of NOTIFICATION_ENVIRONMENT_SETUP.md**
