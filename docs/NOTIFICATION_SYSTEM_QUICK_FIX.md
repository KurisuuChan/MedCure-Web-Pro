# 🚀 Notification System - Quick Fix Guide

## ⚡ Immediate Actions Required

### 1️⃣ Run Database Migration (5 minutes)

**Copy and paste these SQL commands into Supabase SQL Editor:**

```sql
-- ============================================================================
-- STEP 1: Create health_check_runs tracking table
-- ============================================================================
CREATE TABLE IF NOT EXISTS health_check_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_type TEXT NOT NULL,
  run_at TIMESTAMP NOT NULL DEFAULT NOW(),
  notifications_created INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_health_check_runs_check_type_run_at
  ON health_check_runs(check_type, run_at DESC);

-- ============================================================================
-- STEP 2: Create should_send_notification function (prevents duplicates)
-- ============================================================================
CREATE OR REPLACE FUNCTION should_send_notification(
  p_user_id UUID,
  p_notification_key TEXT,
  p_cooldown_hours INTEGER DEFAULT 24
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_last_sent_at TIMESTAMP;
  v_cooldown_period INTERVAL;
BEGIN
  v_cooldown_period := (p_cooldown_hours || ' hours')::INTERVAL;

  SELECT MAX(created_at) INTO v_last_sent_at
  FROM user_notifications
  WHERE user_id = p_user_id
    AND metadata->>'notification_key' = p_notification_key
    AND dismissed_at IS NULL
    AND created_at > (NOW() - v_cooldown_period);

  RETURN v_last_sent_at IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION should_send_notification TO authenticated;

-- ============================================================================
-- STEP 3: Create should_run_health_check function (prevents spam)
-- ============================================================================
CREATE OR REPLACE FUNCTION should_run_health_check(
  p_check_type TEXT,
  p_interval_minutes INTEGER DEFAULT 15
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_last_run_at TIMESTAMP;
  v_interval INTERVAL;
BEGIN
  v_interval := (p_interval_minutes || ' minutes')::INTERVAL;

  SELECT MAX(run_at) INTO v_last_run_at
  FROM health_check_runs
  WHERE check_type = p_check_type
    AND run_at > (NOW() - v_interval);

  RETURN v_last_run_at IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION should_run_health_check TO authenticated;

-- ============================================================================
-- STEP 4: Create record_health_check_run function
-- ============================================================================
CREATE OR REPLACE FUNCTION record_health_check_run(
  p_check_type TEXT,
  p_notifications_created INTEGER,
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_run_id UUID;
BEGIN
  INSERT INTO health_check_runs (
    check_type,
    run_at,
    notifications_created,
    error_message
  )
  VALUES (
    p_check_type,
    NOW(),
    p_notifications_created,
    p_error_message
  )
  RETURNING id INTO v_run_id;

  RETURN v_run_id;
END;
$$;

GRANT EXECUTE ON FUNCTION record_health_check_run TO authenticated;

-- ============================================================================
-- STEP 5: Add performance indexes
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id_created_at
  ON user_notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id_is_read
  ON user_notifications(user_id, is_read)
  WHERE dismissed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_user_notifications_notification_key
  ON user_notifications(user_id, ((metadata->>'notification_key')), created_at DESC)
  WHERE dismissed_at IS NULL;

-- ============================================================================
-- VERIFY: Check that all functions were created
-- ============================================================================
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'should_send_notification',
    'should_run_health_check',
    'record_health_check_run',
    'cleanup_old_notifications'
  )
ORDER BY routine_name;

-- Expected: Should return 4 rows
```

---

### 2️⃣ Update NotificationService.js (10 minutes)

**File:** `src/services/notifications/NotificationService.js`

#### Change #1: Add Local Debounce for Health Checks

**Find this in the constructor:**

```javascript
constructor() {
  this.emailService = emailService;
  this.realtimeSubscription = null;
  this.isInitialized = false;
}
```

**Replace with:**

```javascript
constructor() {
  this.emailService = emailService;
  this.realtimeSubscription = null;
  this.isInitialized = false;
  this.lastHealthCheckRun = null; // ✅ ADD THIS
  this.healthCheckDebounceMs = 15 * 60 * 1000; // 15 minutes
}
```

#### Change #2: Add Debounce Check to runHealthChecks

**Find the start of `runHealthChecks()` method:**

```javascript
async runHealthChecks() {
  try {
    // ✅ FIX: Check if enough time has passed since last run
    const { data: shouldRunData, error: checkError } = await supabase.rpc(
```

**Replace with:**

```javascript
async runHealthChecks() {
  // ✅ LOCAL DEBOUNCE CHECK FIRST
  const now = Date.now();
  if (this.lastHealthCheckRun && (now - this.lastHealthCheckRun) < this.healthCheckDebounceMs) {
    logger.debug("⏸️ Health check debounced locally - too soon since last run");
    return;
  }

  try {
    // Database check
    const { data: shouldRunData, error: checkError } = await supabase.rpc(
```

#### Change #3: Update Local Timestamp After Successful Run

**Find this line near the end of `runHealthChecks()`:**

```javascript
logger.debug(
  `✅ Health checks completed: ${lowStockCount} low stock, ${expiringCount} expiring products (${totalNotifications} total notifications)`
);
```

**Add this line AFTER it:**

```javascript
logger.debug(
  `✅ Health checks completed: ${lowStockCount} low stock, ${expiringCount} expiring products (${totalNotifications} total notifications)`
);
this.lastHealthCheckRun = now; // ✅ ADD THIS LINE
```

#### Change #4: Notify Only ONE Admin (Not All Users)

**Find this code:**

```javascript
// Get all active users who should receive notifications
const { data: users, error: usersError } = await supabase
  .from("users")
  .select("id, email, role")
  .eq("is_active", true)
  .in("role", ["admin", "manager", "pharmacist"]);
```

**Replace with:**

```javascript
// Get ONE primary user to receive notifications (prevent spam)
const { data: users, error: usersError } = await supabase
  .from("users")
  .select("id, email, role")
  .eq("is_active", true)
  .in("role", ["admin", "manager", "pharmacist"])
  .order("role", { ascending: true }) // Admin first
  .limit(1); // ✅ ONLY ONE USER
```

**Find this code:**

```javascript
// ✅ FIX: Only notify ONE admin user (not all users to prevent spam)
const primaryUser = users.find((u) => u.role === "admin") || users[0];
logger.debug(`📧 Sending notifications to primary user: ${primaryUser.role}`);
```

**Replace with:**

```javascript
// Use the single user we got from query
const primaryUser = users[0];
logger.debug(
  `📧 Sending notifications to primary user: ${primaryUser.role} (${primaryUser.email})`
);
```

#### Change #5: Add notification_key to All Helper Methods

**Find `notifyLowStock` method:**

```javascript
metadata: {
  productId,
  productName,
  currentStock,
  reorderLevel,
  actionUrl: `/inventory?product=${productId}`,
},
```

**Replace with:**

```javascript
metadata: {
  productId,
  productName,
  currentStock,
  reorderLevel,
  actionUrl: `/inventory?product=${productId}`,
  notification_key: `low-stock:${productId}`, // ✅ ADD THIS
},
```

**Do the same for `notifyCriticalStock`:**

```javascript
metadata: {
  productId,
  productName,
  currentStock,
  actionUrl: `/inventory?product=${productId}`,
  notification_key: `critical-stock:${productId}`, // ✅ ADD THIS
},
```

**And for `notifyExpiringSoon`:**

```javascript
metadata: {
  productId,
  productName,
  expiryDate,
  daysRemaining,
  actionUrl: `/inventory?product=${productId}`,
  notification_key: `expiry:${productId}`, // ✅ ADD THIS
},
```

---

### 3️⃣ Test Your Changes (5 minutes)

#### Test 1: Verify Database Functions

Open Supabase SQL Editor and run:

```sql
-- Should return TRUE (no recent notification)
SELECT should_send_notification(
  'test-user-id'::uuid,
  'test-key',
  24
);

-- Should return TRUE (no recent health check)
SELECT should_run_health_check('all', 15);
```

#### Test 2: Verify POS Low-Stock Notification

1. Open your app and go to POS
2. Open browser console (F12)
3. Perform a sale that reduces stock below reorder level
4. Check console for:
   - `🔎 [LowStockCheck]` logs showing correct stock_in_pieces
   - `📢 Sending low stock notification` log
5. Check notification bell - should show notification with correct piece count

#### Test 3: Verify No Duplicate Notifications

1. Trigger same low-stock notification twice
2. Only ONE notification should appear (second is blocked by cooldown)

---

## 📋 Quick Verification Checklist

After making changes, verify:

- [ ] Database functions created successfully (run verification query)
- [ ] NotificationService.js changes saved
- [ ] No TypeScript/ESLint errors
- [ ] POS low-stock notifications show correct piece count
- [ ] No duplicate notifications appear
- [ ] Health checks don't spam admin users
- [ ] Console logs show expected debug info

---

## 🆘 Troubleshooting

### Issue: "Function does not exist" error

**Solution:** Re-run the database migration SQL above in Supabase

### Issue: Still seeing "0 pieces" in notifications

**Solution:**

1. Check that `stock_in_pieces` field exists in products table
2. Verify POS hook changes were saved (check `usePOS.js`)
3. Clear browser cache and reload

### Issue: Still receiving duplicate notifications

**Solution:**

1. Verify `notification_key` is being set in metadata
2. Check database function `should_send_notification` exists
3. Look for errors in console logs

### Issue: Health checks running too frequently

**Solution:**

1. Verify `lastHealthCheckRun` property is in constructor
2. Check debounce logic is at START of `runHealthChecks()`
3. Verify timestamp is being updated after successful run

---

## 📚 Full Documentation

For complete analysis, architecture details, and long-term improvements, see:
**`NOTIFICATION_SYSTEM_ANALYSIS.md`**

---

## ✅ Success Criteria

You'll know everything is working when:

1. ✅ Low-stock notifications show correct piece count (not "0")
2. ✅ No duplicate notifications for same product
3. ✅ Only ONE admin receives health check notifications
4. ✅ Health checks don't run more than once per 15 minutes
5. ✅ Console logs show detailed debug information
6. ✅ Notification bell updates in real-time
7. ✅ No database errors in console

---

**Estimated Time:** 20 minutes total  
**Difficulty:** ⭐⭐ Intermediate  
**Impact:** 🔥🔥🔥 High (fixes critical bugs)

**Need Help?** Check the full analysis document or review the code comments.
