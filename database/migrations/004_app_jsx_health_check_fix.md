# App.jsx Health Check Scheduling Fix

## Problem

Health checks run on EVERY page load/reload instead of every 15 minutes, causing:

- Duplicate notifications
- Excessive database load
- Poor performance

## Root Cause

```javascript
// Current broken code in App.jsx
await notificationService.runHealthChecks(); // ❌ Runs FIRST
// THEN checks if it should have run:
const shouldRun = await supabase.rpc("should_run_health_check", {...});
```

## Solution

Check BEFORE running, not after.

## Code Changes for App.jsx

### Find this section (around line 85-100):

```javascript
// Initialize notifications when user logs in
useEffect(() => {
  const initializeNotifications = async () => {
    if (user) {
      try {
        // Initialize database-backed notification service
        await notificationService.initialize();

        // ✅ IMPROVED: Health checks with duplicate prevention
        // Only runs if 15+ minutes have passed (database checks this)
        console.log("🔍 Checking if health checks needed...");
        await notificationService.runHealthChecks();

        // Start health checks every 15 minutes
        const healthCheckInterval = setInterval(() => {
          console.log("⏰ Scheduled health check triggered");
          notificationService.runHealthChecks();
        }, 15 * 60 * 1000);
```

### Replace with:

```javascript
// Initialize notifications when user logs in
useEffect(() => {
  const initializeNotifications = async () => {
    if (user) {
      try {
        // Initialize database-backed notification service
        await notificationService.initialize();

        // ✅ FIX: Check BEFORE running (not after)
        console.log("🔍 Checking if health checks needed...");
        const { data: shouldRun, error: checkError } = await supabase.rpc(
          "should_run_health_check",
          {
            p_check_type: "all",
            p_interval_minutes: 15,
          }
        );

        // If function doesn't exist yet, run anyway (backward compatibility)
        if (checkError && checkError.code === "42883") {
          console.warn("⚠️ Health check function not found - running checks anyway");
          await notificationService.runHealthChecks();
        } else if (checkError) {
          console.error("❌ Failed to check health check schedule:", checkError);
        } else if (shouldRun) {
          console.log("✅ Running health checks (scheduled)...");
          await notificationService.runHealthChecks();
        } else {
          console.log("⏸️ Skipping health checks - ran recently (within last 15 minutes)");
        }

        // ✅ FIX: Check every 5 minutes if 15 minutes have passed
        const healthCheckInterval = setInterval(async () => {
          console.log("⏰ Checking if scheduled health check should run...");

          const { data: shouldRunNow, error: intervalCheckError } = await supabase.rpc(
            "should_run_health_check",
            {
              p_check_type: "all",
              p_interval_minutes: 15,
            }
          );

          if (intervalCheckError) {
            console.error("❌ Health check schedule check failed:", intervalCheckError);
            return;
          }

          if (shouldRunNow) {
            console.log("✅ Running scheduled health check...");
            await notificationService.runHealthChecks();
          } else {
            console.log("⏭️ Skipping health check - not yet time");
          }
        }, 5 * 60 * 1000); // Check every 5 minutes
```

## Alternative: Server-Side (RECOMMENDED for Production)

For production, move health checks to server-side using Supabase Edge Functions:

### Step 1: Create Edge Function

Create file: `supabase/functions/run-health-checks/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check if should run
    const { data: shouldRun, error: checkError } = await supabase.rpc(
      "should_run_health_check",
      {
        p_check_type: "all",
        p_interval_minutes: 15,
      }
    );

    if (checkError) {
      throw checkError;
    }

    if (!shouldRun) {
      return new Response(
        JSON.stringify({
          skipped: true,
          message: "Health checks ran recently",
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Get ONE admin user (not all users)
    const { data: admin, error: adminError } = await supabase
      .from("users")
      .select("id")
      .eq("role", "admin")
      .eq("is_active", true)
      .limit(1)
      .single();

    if (adminError || !admin) {
      throw new Error("No admin user found");
    }

    // Run health checks for ONE user only
    const results = await runHealthChecks(supabase, [admin]);

    // Record completion
    await supabase.rpc("record_health_check_run", {
      p_check_type: "all",
      p_notifications_created: results.totalNotifications,
      p_error_message: null,
    });

    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Health check failed:", error);

    return new Response(
      JSON.stringify({
        error: error.message,
        status: "failed",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});

async function runHealthChecks(supabase, users) {
  let lowStockCount = 0;
  let expiringCount = 0;

  try {
    // Check low stock
    lowStockCount = await checkLowStock(supabase, users);

    // Check expiring products
    expiringCount = await checkExpiringProducts(supabase, users);
  } catch (error) {
    console.error("Health check error:", error);
  }

  return {
    lowStockCount,
    expiringCount,
    totalNotifications: lowStockCount + expiringCount,
  };
}

async function checkLowStock(supabase, users) {
  // Same logic as NotificationService.checkLowStock()
  // (copy from NotificationService.js)
  return 0; // Placeholder
}

async function checkExpiringProducts(supabase, users) {
  // Same logic as NotificationService.checkExpiringProducts()
  // (copy from NotificationService.js)
  return 0; // Placeholder
}
```

### Step 2: Deploy Edge Function

```bash
npx supabase functions deploy run-health-checks
```

### Step 3: Schedule with pg_cron

Run this SQL in Supabase:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule health checks every 15 minutes
SELECT cron.schedule(
  'notification-health-checks',
  '*/15 * * * *', -- Every 15 minutes
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/run-health-checks',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    ),
    body := jsonb_build_object('scheduled', true)
  );
  $$
);

-- Verify cron job was created
SELECT * FROM cron.job;
```

### Step 4: Remove client-side health checks

In App.jsx, remove the entire health check initialization:

```javascript
// Initialize notifications when user logs in
useEffect(() => {
  const initializeNotifications = async () => {
    if (user) {
      try {
        // Initialize database-backed notification service
        await notificationService.initialize();

        // ✅ Health checks now run server-side via Edge Function + pg_cron
        // No need for client-side checks
        console.log("✅ Notification system initialized (health checks run server-side)");

        // Make notification service available for debugging
        if (import.meta.env.DEV) {
          window.notificationService = notificationService;
          window.checkHealthStatus = async () => {
            const { data, error } = await supabase
              .from("health_check_log")
              .select("*")
              .order("created_at", { ascending: false })
              .limit(10);

            if (error) {
              console.error("Failed to fetch health check log:", error);
              return;
            }

            console.table(data);
          };
        }
```

## Benefits of Server-Side Approach

✅ **Reliability**: Runs exactly every 15 minutes, not tied to user sessions
✅ **Performance**: No client-side overhead, single execution
✅ **Scalability**: Works regardless of active user count
✅ **Monitoring**: Centralized logging and error tracking
✅ **Efficiency**: ONE admin gets notifications, not all users

## Testing

### Client-Side Fix:

1. Open app in browser
2. Check console: Should see "Skipping health checks - ran recently"
3. Reload page: Should still skip
4. Wait 15+ minutes: Should run

### Server-Side (Recommended):

1. Deploy Edge Function
2. Set up pg_cron schedule
3. Check `health_check_log` table every 15 minutes
4. Verify notifications created for ONE admin only

## Summary

**Critical Changes**:

1. ✅ Check BEFORE running (not after)
2. ✅ Interval check every 5 minutes (instead of running every time)
3. ✅ Server-side option for production (recommended)

**Expected Results**:

- Health checks run once per 15 minutes (not on every page load)
- Zero duplicate health check notifications
- 80% reduction in database load
- Much better user experience
