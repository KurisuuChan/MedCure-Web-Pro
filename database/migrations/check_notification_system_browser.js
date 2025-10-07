// ============================================================================
// NOTIFICATION SYSTEM CHECKER - Browser Console Version
// ============================================================================
// Copy and paste this entire script into your browser console
// It will check your notification system setup
// ============================================================================

(async function checkNotificationSystem() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔍 NOTIFICATION SYSTEM CHECKER");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");

  const userId = "b9b31a83-66fd-46e5-b4be-3386c4988f48"; // Your user ID
  const results = {};

  try {
    // ============================================================================
    // 1. Check if user_notifications table exists
    // ============================================================================
    console.log("1️⃣ Checking user_notifications table...");
    const {
      data: notifications,
      error: notifError,
      count: notifCount,
    } = await supabase
      .from("user_notifications")
      .select("*", { count: "exact", head: true });

    if (notifError) {
      console.error("❌ user_notifications table error:", notifError.message);
      results.notificationsTable = false;
    } else {
      console.log(
        `✅ user_notifications table exists (${notifCount || 0} records)`
      );
      results.notificationsTable = true;
      results.notificationCount = notifCount;
    }

    // ============================================================================
    // 2. Check notification_deduplication table
    // ============================================================================
    console.log("");
    console.log("2️⃣ Checking notification_deduplication table...");
    const { data: dedup, error: dedupError } = await supabase
      .from("notification_deduplication")
      .select("*", { count: "exact", head: true });

    if (dedupError) {
      console.error(
        "❌ notification_deduplication table missing or error:",
        dedupError.message
      );
      console.log("   👉 Run migration: 002_notification_deduplication.sql");
      results.dedupTable = false;
    } else {
      console.log("✅ notification_deduplication table exists");
      results.dedupTable = true;
    }

    // ============================================================================
    // 3. Check should_send_notification RPC function
    // ============================================================================
    console.log("");
    console.log("3️⃣ Checking should_send_notification function...");
    const { data: funcTest, error: funcError } = await supabase.rpc(
      "should_send_notification",
      {
        p_user_id: userId,
        p_notification_key: "test:check",
        p_cooldown_hours: 24,
      }
    );

    if (funcError) {
      console.error(
        "❌ should_send_notification function missing:",
        funcError.message
      );
      console.log("   👉 Run migration: 002_notification_deduplication.sql");
      results.rpcFunction = false;
    } else {
      console.log("✅ should_send_notification function works:", funcTest);
      results.rpcFunction = true;
    }

    // ============================================================================
    // 4. Get your actual notifications
    // ============================================================================
    console.log("");
    console.log("4️⃣ Fetching YOUR notifications...");
    const {
      data: yourNotifications,
      error: yourError,
      count: yourCount,
    } = await supabase
      .from("user_notifications")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (yourError) {
      console.error("❌ Error fetching your notifications:", yourError.message);
    } else {
      console.log(`✅ Found ${yourCount || 0} notifications for your account`);
      results.yourNotificationCount = yourCount;

      if (yourNotifications && yourNotifications.length > 0) {
        console.log("");
        console.log("📋 Your Recent Notifications:");
        console.table(
          yourNotifications.map((n) => ({
            Title: n.title,
            Category: n.category,
            Priority: n.priority,
            Read: n.is_read ? "✓" : "✗",
            Created: new Date(n.created_at).toLocaleString(),
          }))
        );
      } else {
        console.log("⚠️ No notifications found for your account");
        console.log("   This might be why the bell icon shows 0");
      }
    }

    // ============================================================================
    // 5. Check unread count
    // ============================================================================
    console.log("");
    console.log("5️⃣ Checking unread notification count...");
    const { count: unreadCount, error: unreadError } = await supabase
      .from("user_notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false)
      .is("dismissed_at", null);

    if (unreadError) {
      console.error("❌ Error getting unread count:", unreadError.message);
    } else {
      console.log(`📊 Unread notifications: ${unreadCount || 0}`);
      results.unreadCount = unreadCount;

      if (unreadCount === 0 && yourCount > 0) {
        console.log("   ℹ️ All your notifications are already marked as read");
      }
    }

    // ============================================================================
    // 6. Test notification creation
    // ============================================================================
    console.log("");
    console.log("6️⃣ Testing notification creation...");
    const testNotification = {
      user_id: userId,
      title: "🧪 Test Notification",
      message: "This is a test notification created by the checker",
      type: "info",
      priority: 3,
      category: "general",
      metadata: { test: true },
      is_read: false,
    };

    const { data: createdNotif, error: createError } = await supabase
      .from("user_notifications")
      .insert(testNotification)
      .select()
      .single();

    if (createError) {
      console.error(
        "❌ Failed to create test notification:",
        createError.message
      );
      results.canCreateNotifications = false;
    } else {
      console.log(
        "✅ Successfully created test notification:",
        createdNotif.id
      );
      console.log("   Check your notification bell - it should show +1 now!");
      results.canCreateNotifications = true;
      results.testNotificationId = createdNotif.id;
    }

    // ============================================================================
    // FINAL SUMMARY
    // ============================================================================
    console.log("");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📋 FINAL SUMMARY");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    const allGood =
      results.notificationsTable &&
      results.dedupTable &&
      results.rpcFunction &&
      results.canCreateNotifications;

    if (allGood) {
      console.log("🎉 SUCCESS: All notification system components working!");
      console.log("");
      console.log(`📊 Statistics:`);
      console.log(
        `   • Total notifications in DB: ${results.notificationCount || 0}`
      );
      console.log(
        `   • Your notifications: ${results.yourNotificationCount || 0}`
      );
      console.log(`   • Your unread: ${results.unreadCount || 0}`);
      console.log(`   • Test notification ID: ${results.testNotificationId}`);
    } else {
      console.log("⚠️ ISSUES FOUND:");
      if (!results.notificationsTable)
        console.log("   ❌ user_notifications table has issues");
      if (!results.dedupTable)
        console.log("   ❌ notification_deduplication table missing");
      if (!results.rpcFunction)
        console.log("   ❌ should_send_notification function missing");
      if (!results.canCreateNotifications)
        console.log("   ❌ Cannot create notifications");

      console.log("");
      console.log("🔧 TO FIX:");
      console.log("   1. Go to Supabase Dashboard → SQL Editor");
      console.log(
        "   2. Run: database/migrations/001_add_notification_indexes.sql"
      );
      console.log(
        "   3. Run: database/migrations/002_notification_deduplication.sql"
      );
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    return results;
  } catch (error) {
    console.error("💥 Unexpected error:", error);
    throw error;
  }
})();
