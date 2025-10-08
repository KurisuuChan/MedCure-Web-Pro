# 🧪 NOTIFICATION SYSTEM - TESTING GUIDE

## Complete Testing Procedures - October 5, 2025

---

## 🎯 TESTING OVERVIEW

This document provides step-by-step testing procedures for all notification features. Use this checklist to verify that all fixes are working correctly.

---

## 📋 PRE-FLIGHT CHECKLIST

Before starting tests, verify:

- [ ] Supabase connection is working
- [ ] User is logged in
- [ ] `user_notifications` table exists in database
- [ ] Browser console is open (F12)
- [ ] Network tab is monitoring requests
- [ ] No console errors on page load

---

## 🧪 TEST SUITE 1: MARK ALL AS READ

### Test 1.1: Mark All with Multiple Unread

**Steps:**

1. Create 5+ unread notifications (use test script below)
2. Open notification panel (click bell icon)
3. Click "Mark all read" button
4. Observe the button text change to "Marking..."
5. Wait for completion

**Expected Results:**

- ✅ Button shows "Marking..." during processing
- ✅ Button is disabled (greyed out, cursor: wait)
- ✅ All notifications turn from blue background to white
- ✅ Console shows: `✅ Marked X notification(s) as read`
- ✅ Unread badge count decreases to 0
- ✅ Button returns to "Mark all read" after completion

**Error Cases:**

- If database fails, alert should show: "Failed to mark all as read: [error]"
- Button should return to enabled state even on error

---

### Test 1.2: Mark All with No Unread

**Steps:**

1. Mark all notifications as read (from Test 1.1)
2. Click "Mark all read" button again

**Expected Results:**

- ✅ Button still works (doesn't error)
- ✅ Console shows: `✅ Marked 0 notification(s) as read`
- ✅ No visual change (all already read)

---

### Test 1.3: Mark All with Only 1 Unread

**Steps:**

1. Dismiss all notifications
2. Create 1 new notification
3. Click "Mark all read"

**Expected Results:**

- ✅ Single notification marked as read
- ✅ Console shows: `✅ Marked 1 notification(s) as read`
- ✅ Badge disappears

---

## 🧪 TEST SUITE 2: CLEAR ALL (DISMISS ALL)

### Test 2.1: Clear All with Confirmation

**Steps:**

1. Create 5+ notifications
2. Click "Clear all" button
3. Observe confirmation dialog

**Expected Results:**

- ✅ Confirmation dialog appears: "Are you sure you want to clear all X notification(s)?"
- ✅ Dialog has "OK" and "Cancel" buttons

---

### Test 2.2: Clear All - User Confirms

**Steps:**

1. Click "Clear all"
2. Click "OK" in confirmation dialog

**Expected Results:**

- ✅ Button shows "Clearing..." during processing
- ✅ Button is disabled
- ✅ All notifications disappear
- ✅ Console shows: `✅ Cleared X notification(s)`
- ✅ Panel shows "No notifications" message
- ✅ Badge shows 0
- ✅ Page resets to 1

---

### Test 2.3: Clear All - User Cancels

**Steps:**

1. Create 5+ notifications
2. Click "Clear all"
3. Click "Cancel" in confirmation dialog

**Expected Results:**

- ✅ Nothing happens
- ✅ Notifications remain visible
- ✅ No API call made (check Network tab)

---

### Test 2.4: Clear All with Empty List

**Steps:**

1. Dismiss all notifications
2. Click "Clear all" (button should not be visible)

**Expected Results:**

- ✅ Button is hidden when notifications.length === 0

---

## 🧪 TEST SUITE 3: INDIVIDUAL MARK AS READ

### Test 3.1: Mark Single as Read

**Steps:**

1. Create 3+ unread notifications
2. Click the green checkmark on the 2nd notification
3. Observe the button state

**Expected Results:**

- ✅ Button opacity becomes 0.5 during processing
- ✅ Button cursor changes to "wait"
- ✅ Notification background changes from blue to white
- ✅ Green checkmark button disappears (since now read)
- ✅ Console shows: `✅ Notification marked as read: [id]`
- ✅ Badge count decreases by 1

---

### Test 3.2: Mark as Read - Double Click Prevention

**Steps:**

1. Create 1 unread notification
2. Click green checkmark button rapidly 3 times

**Expected Results:**

- ✅ Button processes only once (disabled after first click)
- ✅ No duplicate API calls (check Network tab)
- ✅ No console errors

---

## 🧪 TEST SUITE 4: INDIVIDUAL DISMISS

### Test 4.1: Dismiss on Page 1

**Steps:**

1. Create 5 notifications
2. Ensure you're on page 1
3. Click red trash icon on 3rd notification

**Expected Results:**

- ✅ Button opacity becomes 0.5 during processing
- ✅ Notification disappears from list
- ✅ Remaining notifications stay visible
- ✅ Console shows: `✅ Notification dismissed: [id]`

---

### Test 4.2: Dismiss Last Item on Page 2

**Steps:**

1. Create 15 notifications (to get 2 pages with 10 per page)
2. Navigate to page 2 (should show 5 items)
3. Dismiss all 5 items one by one

**Expected Results:**

- ✅ After dismissing 4th item, 1 remains
- ✅ After dismissing 5th item (last), automatically goes to page 1
- ✅ Page 1 shows remaining 10 notifications
- ✅ No empty page 2

---

### Test 4.3: Dismiss Last Item on Page 1

**Steps:**

1. Dismiss all notifications except 1
2. Ensure you're on page 1 with 1 notification
3. Dismiss that last notification

**Expected Results:**

- ✅ Panel shows "No notifications" message
- ✅ Page reloads to check for more (in case of race condition)
- ✅ Badge shows 0

---

### Test 4.4: Dismiss - Double Click Prevention

**Steps:**

1. Create 1 notification
2. Click red trash icon rapidly 3 times

**Expected Results:**

- ✅ Button processes only once
- ✅ No duplicate API calls
- ✅ No console errors

---

## 🧪 TEST SUITE 5: REAL-TIME UPDATES

### Test 5.1: New Notification Appears

**Steps:**

1. Open notification panel
2. In another browser tab, manually insert notification into database:

```sql
INSERT INTO user_notifications (user_id, title, message, type, category, priority)
VALUES ('[your-user-id]', 'Test', 'Real-time test', 'info', 'system', 3);
```

**Expected Results:**

- ✅ New notification appears in panel within 500ms
- ✅ Badge count increases
- ✅ No page flicker
- ✅ Scroll position maintained

---

### Test 5.2: Rapid Updates - Debouncing

**Steps:**

1. Open notification panel
2. Run this script in browser console:

```javascript
// Create 10 notifications rapidly
for (let i = 0; i < 10; i++) {
  notificationService.createNotification({
    userId: "your-user-id",
    title: `Test ${i}`,
    message: "Debounce test",
    type: "info",
    category: "system",
    priority: 3,
  });
}
```

**Expected Results:**

- ✅ Panel reloads only 2-3 times (debounced to 500ms)
- ✅ No rapid flickering
- ✅ All 10 notifications appear
- ✅ Console shows debounced updates

---

### Test 5.3: Update While Panel Closed

**Steps:**

1. Close notification panel
2. Create 5 new notifications (use test script)
3. Wait 2 seconds
4. Open notification panel

**Expected Results:**

- ✅ Badge updates in real-time (even when closed)
- ✅ All 5 notifications visible when opened
- ✅ No duplicate subscriptions

---

## 🧪 TEST SUITE 6: LOADING STATES

### Test 6.1: All Buttons Show Loading

**Steps:**

1. Create 5+ notifications
2. Click each action button and observe

**Expected Results:**

- ✅ "Mark all read" → Shows "Marking..."
- ✅ "Clear all" → Shows "Clearing..."
- ✅ Individual mark → Opacity 0.5, cursor wait
- ✅ Individual dismiss → Opacity 0.5, cursor wait
- ✅ All buttons disabled during processing

---

### Test 6.2: Loading Persists on Slow Network

**Steps:**

1. Open DevTools → Network tab
2. Set throttling to "Slow 3G"
3. Click "Mark all read"

**Expected Results:**

- ✅ Button stays in "Marking..." state for 2-3 seconds
- ✅ Button remains disabled entire time
- ✅ No double-clicks possible
- ✅ Eventually completes and returns to normal state

---

## 🧪 TEST SUITE 7: ERROR HANDLING

### Test 7.1: Network Failure

**Steps:**

1. Open DevTools → Network tab
2. Set "Offline" mode
3. Try to mark notification as read

**Expected Results:**

- ✅ Alert shows: "Failed to mark notification as read: [error]"
- ✅ Console logs error
- ✅ Button returns to enabled state
- ✅ Notification remains unread

---

### Test 7.2: Invalid User ID

**Steps:**

1. In browser console:

```javascript
notificationService.markAllAsRead("invalid-user-id");
```

**Expected Results:**

- ✅ Returns: `{ success: false, error: '...' }`
- ✅ Console shows error message
- ✅ No crash or undefined behavior

---

## 🧪 TEST SUITE 8: PAGINATION

### Test 8.1: Navigate Between Pages

**Steps:**

1. Create 25 notifications
2. Open panel (should show page 1 with 10 items)
3. Click "Next" button
4. Click "Next" again
5. Click "Previous" twice

**Expected Results:**

- ✅ Page 1: Shows items 1-10
- ✅ Page 2: Shows items 11-20
- ✅ Page 3: Shows items 21-25
- ✅ "Previous" on page 1 is disabled
- ✅ "Next" on page 3 is disabled
- ✅ Page transitions are smooth

---

## 📊 AUTOMATED TEST SCRIPT

Run this in your browser console to test all scenarios:

```javascript
// =============================================================================
// AUTOMATED NOTIFICATION TESTING SCRIPT
// =============================================================================

const testNotifications = async (userId) => {
  console.log("🧪 Starting automated notification tests...\n");

  let testsPassed = 0;
  let testsFailed = 0;

  // Helper function
  const assert = (condition, message) => {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      testsPassed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      testsFailed++;
    }
  };

  try {
    // Test 1: Create notifications
    console.log("\n📝 Test 1: Create Notifications");
    for (let i = 0; i < 5; i++) {
      const result = await notificationService.createNotification({
        userId,
        title: `Test ${i + 1}`,
        message: `Test message ${i + 1}`,
        type: "info",
        category: "system",
        priority: 3,
      });
      assert(result.success, `Created notification ${i + 1}`);
    }

    // Test 2: Get notifications
    console.log("\n📝 Test 2: Get Notifications");
    const getResult = await notificationService.getUserNotifications(userId);
    assert(
      getResult.notifications.length >= 5,
      "Retrieved at least 5 notifications"
    );
    assert(getResult.hasMore !== undefined, "hasMore flag is defined");

    // Test 3: Mark as read
    console.log("\n📝 Test 3: Mark Individual As Read");
    const firstNotif = getResult.notifications[0];
    const markResult = await notificationService.markAsRead(
      firstNotif.id,
      userId
    );
    assert(markResult.success, "Marked notification as read");
    assert(markResult.data !== undefined, "Returned notification data");

    // Test 4: Mark all as read
    console.log("\n📝 Test 4: Mark All As Read");
    const markAllResult = await notificationService.markAllAsRead(userId);
    assert(markAllResult.success, "Marked all as read");
    assert(markAllResult.count >= 0, "Returned count of marked notifications");
    console.log(`   Marked ${markAllResult.count} notifications`);

    // Test 5: Dismiss individual
    console.log("\n📝 Test 5: Dismiss Individual");
    const dismissResult = await notificationService.dismiss(
      firstNotif.id,
      userId
    );
    assert(dismissResult.success, "Dismissed notification");
    assert(
      dismissResult.data !== undefined,
      "Returned dismissed notification data"
    );

    // Test 6: Dismiss all
    console.log("\n📝 Test 6: Dismiss All");
    const dismissAllResult = await notificationService.dismissAll(userId);
    assert(dismissAllResult.success, "Dismissed all notifications");
    assert(
      dismissAllResult.count >= 0,
      "Returned count of dismissed notifications"
    );
    console.log(`   Dismissed ${dismissAllResult.count} notifications`);

    // Test 7: Verify empty
    console.log("\n📝 Test 7: Verify Empty After Dismiss All");
    const finalResult = await notificationService.getUserNotifications(userId);
    assert(
      finalResult.notifications.length === 0,
      "All notifications dismissed"
    );

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("🎯 TEST SUMMARY");
    console.log("=".repeat(60));
    console.log(`✅ Tests Passed: ${testsPassed}`);
    console.log(`❌ Tests Failed: ${testsFailed}`);
    console.log(
      `📊 Success Rate: ${(
        (testsPassed / (testsPassed + testsFailed)) *
        100
      ).toFixed(1)}%`
    );
    console.log("=".repeat(60));

    if (testsFailed === 0) {
      console.log("🎉 ALL TESTS PASSED! System is working correctly.");
    } else {
      console.warn("⚠️ Some tests failed. Please review the errors above.");
    }
  } catch (error) {
    console.error("❌ Test suite failed with error:", error);
    testsFailed++;
  }

  return { passed: testsPassed, failed: testsFailed };
};

// Run tests (replace with your user ID)
// testNotifications('your-user-id-here');

console.log("✅ Test script loaded!");
console.log('To run tests, call: testNotifications("your-user-id")');
```

---

## 🎯 MANUAL TESTING CHECKLIST

Use this checklist to verify all features work:

### Basic Features

- [ ] Notification panel opens/closes
- [ ] Unread badge shows correct count
- [ ] Notifications display with correct icons
- [ ] Timestamps show "X minutes ago"
- [ ] Priority indicator (colored bar) displays

### Mark As Read

- [ ] Individual mark as read works
- [ ] Mark all as read works
- [ ] Badge updates after marking
- [ ] Background color changes (blue → white)
- [ ] Green checkmark disappears after marking

### Dismiss/Clear

- [ ] Individual dismiss works
- [ ] Clear all shows confirmation
- [ ] Clear all works after confirmation
- [ ] Clear all cancels properly
- [ ] Dismissed notifications don't reappear

### Loading States

- [ ] "Mark all read" shows "Marking..."
- [ ] "Clear all" shows "Clearing..."
- [ ] Individual buttons show opacity 0.5
- [ ] Buttons disabled during processing
- [ ] Cursor changes to "wait"

### Error Handling

- [ ] Network errors show alert
- [ ] Invalid operations show error message
- [ ] Console logs errors properly
- [ ] UI doesn't crash on errors

### Pagination

- [ ] Page 1 shows first 10 notifications
- [ ] Next button works
- [ ] Previous button works
- [ ] Buttons disabled at boundaries
- [ ] Dismissing last item navigates properly

### Real-Time Updates

- [ ] New notifications appear automatically
- [ ] Badge updates in real-time
- [ ] Updates are debounced (no flicker)
- [ ] Multiple rapid updates handled gracefully

### Performance

- [ ] Panel opens quickly (< 500ms)
- [ ] Smooth scrolling
- [ ] No lag when marking/dismissing
- [ ] No memory leaks (test with 100+ notifications)

---

## 🐛 COMMON ISSUES & SOLUTIONS

### Issue: "Mark all as read" doesn't work

**Solution:** Check browser console for errors. Verify database query has `.select()` clause.

### Issue: Notifications flicker constantly

**Solution:** Verify debouncing is working (500ms delay). Check for infinite loops in subscription.

### Issue: Empty page after dismissing last item

**Solution:** Verify pagination reload logic in `handleDismiss()`. Should navigate to previous page.

### Issue: Badge count wrong

**Solution:** Check `getUnreadCount()` query. Ensure it filters `is_read = false AND dismissed_at IS NULL`.

### Issue: Loading states don't show

**Solution:** Verify state variables are defined and buttons use them in `disabled` and `style` props.

---

## 📞 SUPPORT

If you encounter issues not covered here:

1. Check browser console for errors
2. Check Network tab for failed API calls
3. Verify Supabase connection
4. Check database for correct schema
5. Review implementation docs

**All fixes are documented in:**

- `NOTIFICATION_FIXES_IMPLEMENTED.md` - Complete implementation report
- `NOTIFICATION_COMPREHENSIVE_ANALYSIS.md` - Original issue analysis
- `NOTIFICATION_FIX_SUMMARY.md` - Fix summary

---

**Testing Guide by: Claude 4.5 Sonnet**  
**Date: October 5, 2025**  
**Version: 1.0.0**
