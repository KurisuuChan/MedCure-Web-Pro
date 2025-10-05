# 🔔 Notification System - Comprehensive Professional Analysis

**Analysis Date:** October 5, 2025  
**System:** MedCure Pharmacy Management System  
**Analyst Role:** Senior Software Architect  
**Cognitive Framework:** Claude Sonnet 4.5 Advanced Analysis

---

## 📊 Executive Summary

### Current State Assessment: ⚠️ **CRITICAL - ARCHITECTURE FRAGMENTATION**

The notification system exhibits **severe architectural fragmentation** with multiple overlapping implementations, creating maintenance complexity, performance issues, and a high risk of notification failures or duplications.

### Severity Levels Identified:

- 🔴 **CRITICAL**: Architecture fragmentation, multiple service implementations
- 🟠 **HIGH**: Database schema underutilization, inconsistent state management
- 🟡 **MEDIUM**: Missing error recovery, incomplete analytics implementation
- 🟢 **LOW**: UI/UX improvements, minor optimization opportunities

---

## 🏗️ Architecture Analysis

### 1. **System Fragmentation Problem** 🔴 CRITICAL

#### Identified Implementations:

```
src/services/
├── NotificationSystem.js                          [PRIMARY - In-Memory System]
├── NotificationMigration.js                       [MIGRATION LAYER]
└── domains/notifications/
    ├── simpleNotificationService.js              [DESKTOP NOTIFICATIONS]
    ├── notificationService.js                    [LEGACY/UNUSED?]
    ├── notificationRulesEngine.js                [INCOMPLETE ENGINE]
    ├── notificationAnalytics.js                  [ANALYTICS]
    └── enhancedNotificationTypes.js              [TYPE DEFINITIONS]
```

#### ⚠️ **Critical Issues:**

1. **Multiple Sources of Truth**

   - `NotificationSystem.js` manages in-memory notifications with localStorage
   - `simpleNotificationService.js` handles desktop browser notifications
   - Database tables exist but are **NOT actively used**
   - No clear data flow or synchronization between systems

2. **Inconsistent Lifecycle Management**

   ```javascript
   // NotificationSystem.js - Session-based
   notifications = new Map(); // In-memory only

   // Database Schema - Persistent
   CREATE TABLE notifications (user_id, title, message, read, created_at)
   CREATE TABLE user_notifications (with expiry, metadata)
   CREATE TABLE notification_rules (rules engine definitions)
   ```

3. **No Integration Between Services**
   - Desktop notifications (SimpleNotificationService) ≠ In-app notifications (NotificationSystem)
   - Rules engine exists but is NOT connected to notification creation
   - Analytics service exists but is NOT actively collecting data

---

## 🗄️ Database Schema Analysis

### Available Tables (Currently Underutilized):

#### 1. **`notifications` Table** 📋

```sql
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info',
  read boolean DEFAULT false,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
```

**Status:** ❌ **NOT ACTIVELY USED**  
**Purpose:** General notification storage  
**Issues:**

- No connection to current NotificationSystem.js
- Missing priority, category, action_url fields
- No expiration mechanism
- Simple type enum (info/warning/error/success)

#### 2. **`user_notifications` Table** 📋

```sql
CREATE TABLE public.user_notifications (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES user_profiles(id),
  title varchar NOT NULL,
  message text,
  type varchar DEFAULT 'info',
  is_read boolean DEFAULT false,
  action_url text,
  metadata jsonb,
  created_at timestamp DEFAULT now(),
  read_at timestamp,
  expires_at timestamp
);
```

**Status:** ❌ **NOT ACTIVELY USED**  
**Purpose:** Advanced user-specific notifications  
**Strengths:**

- ✅ Expiration support (`expires_at`)
- ✅ Action URLs for navigation
- ✅ Metadata JSONB for extensibility
- ✅ Read tracking with timestamp

**Issues:**

- Duplicate of `notifications` table
- No clear use case differentiation
- Not integrated with application

#### 3. **`notification_rules` Table** 📋

```sql
CREATE TABLE public.notification_rules (
  id uuid PRIMARY KEY,
  name varchar UNIQUE,
  description text,
  rule_type varchar CHECK (rule_type IN (
    'low_stock_threshold',
    'expiry_days_warning',
    'sales_target_achievement',
    'system_health_check',
    'daily_report_schedule'
  )),
  conditions jsonb NOT NULL,
  notification_template_id uuid,
  target_roles text[] DEFAULT ARRAY['admin'],
  active boolean DEFAULT true,
  last_triggered_at timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
```

**Status:** ❌ **DEFINED BUT NOT IMPLEMENTED**  
**Purpose:** Dynamic rule-based notification triggers  
**Potential:**

- 🎯 Powerful rule engine for automated notifications
- 🎯 Role-based targeting
- 🎯 Condition-based triggers with JSONB flexibility

**Issues:**

- No implementation code
- No connection to NotificationSystem
- Rules engine in code is incomplete
- No template system exists

#### 4. **`email_queue` Table** 📋

```sql
CREATE TABLE public.email_queue (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  notification_id uuid,
  recipient_email varchar NOT NULL,
  subject varchar NOT NULL,
  body text NOT NULL,
  status varchar DEFAULT 'pending',
  attempts integer DEFAULT 0,
  last_attempt_at timestamp,
  sent_at timestamp,
  error_message text
);
```

**Status:** ❌ **NOT IMPLEMENTED**  
**Purpose:** Email notification queuing and retry system  
**Potential:**

- 🎯 Async email delivery
- 🎯 Retry mechanism with failure tracking
- 🎯 Links notifications to emails

---

## 🔍 Code Implementation Analysis

### Current Architecture Flow:

```
┌─────────────────────────────────────────────────────────────┐
│                     USER INTERFACE LAYER                     │
├─────────────────────────────────────────────────────────────┤
│  NotificationDropdown.jsx / NotificationDropdownV2.jsx      │
│  (UI Components - Display notifications)                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│               FRAGMENTED SERVICE LAYER                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────┐    ┌──────────────────────┐      │
│  │ NotificationSystem.js │    │ SimpleNotification   │      │
│  │ - In-memory storage  │    │ Service.js           │      │
│  │ - localStorage       │    │ - Desktop browser    │      │
│  │ - Health checks      │    │ - Permission mgmt    │      │
│  │ - Deduplication      │    │ - Real-time Supabase │      │
│  └──────────────────────┘    └──────────────────────┘      │
│           ↓                            ↓                     │
│  ┌──────────────────────┐    ┌──────────────────────┐      │
│  │ In-Memory Map        │    │ Browser Notification │      │
│  │ localStorage         │    │ API                  │      │
│  └──────────────────────┘    └──────────────────────┘      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                   DATABASE LAYER (Unused)                    │
├─────────────────────────────────────────────────────────────┤
│  notifications          ← NOT USED                           │
│  user_notifications     ← NOT USED                           │
│  notification_rules     ← NOT USED                           │
│  email_queue           ← NOT USED                           │
└─────────────────────────────────────────────────────────────┘
```

### 🔴 Critical Code Issues:

#### **1. NotificationSystem.js - Session-Only Persistence**

**Problems:**

```javascript
// In-memory storage only
this.notifications = new Map();

// localStorage backup (but session-bound)
saveToStorage() {
  localStorage.setItem(
    NotificationSystem.STORAGE.NOTIFICATIONS,
    JSON.stringify(notifications)
  );
}
```

**Consequences:**

- ❌ No persistence across browser sessions
- ❌ No multi-device synchronization
- ❌ No historical notification data
- ❌ Cannot query past notifications
- ❌ No analytics or reporting capability

#### **2. Duplicate Component Implementations**

```
NotificationDropdown.jsx       [ACTIVE - Session-based]
NotificationDropdownV2.jsx     [ALTERNATIVE - Similar functionality]
```

**Issues:**

- Two nearly identical components with slight variations
- Unclear which is the "production" version
- Maintenance burden to keep both updated
- Different event handling approaches

#### **3. Incomplete Rules Engine**

```javascript
// notificationRulesEngine.js exists but:
export class NotificationRulesEngine {
  constructor() {
    this.rules = new Map();
    // ... incomplete implementation
  }
}
```

**Status:**

- ⚠️ Code exists but is NOT instantiated
- ⚠️ NOT connected to NotificationSystem
- ⚠️ Database rules table NOT queried
- ⚠️ No rule execution logic

#### **4. No Error Recovery or Retry Mechanism**

```javascript
// NotificationSystem.js
async checkLowStock() {
  try {
    const { data: products, error } = await supabase...
    if (error) throw error;
    // Process products...
  } catch (error) {
    console.error('❌ Low stock check failed:', error);
    // NO RETRY, NO FALLBACK, NO ALERTING
  }
}
```

**Consequences:**

- Single Supabase query failure = complete check failure
- No retry mechanism for transient failures
- No fallback notifications to administrators
- Silent failures in production

---

## 🎯 Strategic Recommendations

### Phase 1: **Immediate Critical Fixes** (Week 1-2) 🔴

#### Priority 1.1: Consolidate Architecture

```javascript
// UNIFIED NOTIFICATION SERVICE
class UnifiedNotificationService {
  constructor() {
    this.inMemoryCache = new Map(); // Fast access
    this.database = supabaseClient; // Persistence
    this.browserAPI = Notification; // Desktop alerts
  }

  async addNotification(notification) {
    // 1. Store in database FIRST (source of truth)
    const dbRecord = await this.database
      .from("user_notifications")
      .insert(notification)
      .select()
      .single();

    // 2. Cache in memory for fast UI updates
    this.inMemoryCache.set(dbRecord.id, dbRecord);

    // 3. Trigger desktop notification if needed
    if (notification.priority === "CRITICAL") {
      this.showDesktopNotification(dbRecord);
    }

    // 4. Notify subscribers
    this.emit("notification:added", dbRecord);

    return dbRecord;
  }
}
```

**Benefits:**

- ✅ Single source of truth (database)
- ✅ Fast UI updates (memory cache)
- ✅ Desktop notifications when needed
- ✅ Persistent across sessions
- ✅ Multi-device synchronization via Supabase real-time

#### Priority 1.2: Remove Duplicate Components

```bash
# Decision: Keep NotificationDropdown.jsx, remove V2
# Reasoning: More mature, actively used, better tested

DELETE: NotificationDropdownV2.jsx
UPDATE: All imports to use NotificationDropdown.jsx
```

#### Priority 1.3: Implement Error Recovery

```javascript
class NotificationHealthCheck {
  async checkWithRetry(checkFunction, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await checkFunction();
      } catch (error) {
        console.error(`Attempt ${attempt} failed:`, error);

        if (attempt === maxRetries) {
          // Final failure - alert administrators
          await this.sendAdminAlert({
            type: "HEALTH_CHECK_FAILURE",
            checkName: checkFunction.name,
            error: error.message,
            attempts: maxRetries,
          });
          throw error;
        }

        // Exponential backoff
        await this.sleep(Math.pow(2, attempt) * 1000);
      }
    }
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
```

---

### Phase 2: **Database Integration** (Week 3-4) 🟠

#### 2.1: Migrate to Database-First Architecture

**Implementation Plan:**

```sql
-- Enhanced schema for production use
ALTER TABLE user_notifications ADD COLUMN priority integer DEFAULT 3;
ALTER TABLE user_notifications ADD COLUMN category varchar;
ALTER TABLE user_notifications ADD COLUMN source varchar; -- 'system', 'user', 'rule_engine'
ALTER TABLE user_notifications ADD COLUMN persistent boolean DEFAULT false;
CREATE INDEX idx_user_notifications_user_unread
  ON user_notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_user_notifications_expires
  ON user_notifications(expires_at) WHERE expires_at IS NOT NULL;
```

**Migration Strategy:**

```javascript
class NotificationMigrationService {
  async migrateExistingNotifications() {
    // 1. Read from localStorage
    const localNotifications = JSON.parse(
      localStorage.getItem("notifications_v2") || "[]"
    );

    // 2. Batch insert to database
    const { data, error } = await supabase.from("user_notifications").insert(
      localNotifications.map((n) => ({
        user_id: currentUser.id,
        title: n.title,
        message: n.message,
        type: n.type,
        priority: n.priority,
        metadata: n.data,
        is_read: n.isRead,
        created_at: new Date(n.timestamp),
      }))
    );

    // 3. Clear localStorage after successful migration
    if (!error) {
      localStorage.removeItem("notifications_v2");
      console.log("✅ Migrated", localNotifications.length, "notifications");
    }
  }
}
```

#### 2.2: Implement Real-time Synchronization

```javascript
class RealtimeNotificationSync {
  constructor(userId) {
    this.subscription = supabase
      .channel(`user:${userId}:notifications`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          // New notification from database → update UI
          this.onNotificationAdded(payload.new);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "user_notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          // Notification updated → sync UI
          this.onNotificationUpdated(payload.new);
        }
      )
      .subscribe();
  }
}
```

---

### Phase 3: **Rules Engine Implementation** (Week 5-6) 🟡

#### 3.1: Connect Rules Engine to Database

```javascript
class ProductionRulesEngine {
  async loadRules() {
    const { data: rules, error } = await supabase
      .from("notification_rules")
      .select("*")
      .eq("active", true);

    if (error) throw error;

    this.activeRules = rules.map((rule) => ({
      id: rule.id,
      name: rule.name,
      type: rule.rule_type,
      conditions: rule.conditions, // JSONB parsed automatically
      targetRoles: rule.target_roles,
      lastTriggered: rule.last_triggered_at,
    }));
  }

  async evaluateRule(rule, context) {
    const conditions = rule.conditions;

    switch (rule.type) {
      case "low_stock_threshold":
        return context.stockLevel <= conditions.threshold;

      case "expiry_days_warning":
        const daysUntilExpiry = this.calculateDaysUntilExpiry(
          context.expiryDate
        );
        return daysUntilExpiry <= conditions.warning_days;

      case "sales_target_achievement":
        return context.salesTotal >= conditions.target_amount;

      case "system_health_check":
        return await this.checkSystemHealth(conditions);

      case "daily_report_schedule":
        return this.isScheduledTime(conditions.schedule);

      default:
        return false;
    }
  }

  async triggerNotification(rule, context) {
    // Create notification based on rule
    const notification = await supabase
      .from("user_notifications")
      .insert({
        title: this.generateTitle(rule, context),
        message: this.generateMessage(rule, context),
        type: rule.conditions.notification_type || "warning",
        priority: rule.conditions.priority || 2,
        metadata: {
          rule_id: rule.id,
          rule_name: rule.name,
          context: context,
        },
        // Send to specific roles
        user_id: null, // Trigger for role-based query
      })
      .select();

    // Update rule last_triggered_at
    await supabase
      .from("notification_rules")
      .update({ last_triggered_at: new Date() })
      .eq("id", rule.id);

    return notification;
  }
}
```

#### 3.2: Example Rule Configurations

```sql
-- Low stock rule for critical medicines
INSERT INTO notification_rules (
  name,
  description,
  rule_type,
  conditions,
  target_roles,
  active
) VALUES (
  'Critical Medicine Low Stock Alert',
  'Alert pharmacists when critical medicines drop below threshold',
  'low_stock_threshold',
  '{
    "threshold": 10,
    "critical_only": true,
    "notification_type": "warning",
    "priority": 1,
    "check_interval_minutes": 30
  }'::jsonb,
  ARRAY['pharmacist', 'manager', 'admin'],
  true
);

-- Expiry warning for high-value products
INSERT INTO notification_rules (
  name,
  description,
  rule_type,
  conditions,
  target_roles,
  active
) VALUES (
  '30-Day Expiry Warning',
  'Warn about products expiring in 30 days',
  'expiry_days_warning',
  '{
    "warning_days": 30,
    "min_product_value": 1000,
    "notification_type": "warning",
    "priority": 2,
    "check_interval_hours": 24
  }'::jsonb,
  ARRAY['pharmacist', 'manager'],
  true
);
```

---

### Phase 4: **Advanced Features** (Week 7-8+) 🟢

#### 4.1: Notification Analytics Dashboard

```javascript
class NotificationAnalyticsService {
  async getMetrics(timeRange = "7d") {
    const { data: metrics } = await supabase.rpc("get_notification_metrics", {
      start_date: this.getStartDate(timeRange),
      end_date: new Date(),
    });

    return {
      totalSent: metrics.total_count,
      readRate: (metrics.read_count / metrics.total_count) * 100,
      avgTimeToRead: metrics.avg_time_to_read_seconds,
      byType: metrics.by_type,
      byPriority: metrics.by_priority,
      dismissalRate: (metrics.dismissed_count / metrics.total_count) * 100,
    };
  }
}
```

**SQL Function:**

```sql
CREATE OR REPLACE FUNCTION get_notification_metrics(
  start_date timestamp,
  end_date timestamp
)
RETURNS TABLE (
  total_count bigint,
  read_count bigint,
  dismissed_count bigint,
  avg_time_to_read_seconds numeric,
  by_type jsonb,
  by_priority jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::bigint as total_count,
    COUNT(CASE WHEN is_read THEN 1 END)::bigint as read_count,
    COUNT(CASE WHEN metadata->>'dismissed' = 'true' THEN 1 END)::bigint as dismissed_count,
    AVG(EXTRACT(EPOCH FROM (read_at - created_at)))::numeric as avg_time_to_read_seconds,
    jsonb_object_agg(type, type_count) as by_type,
    jsonb_object_agg(priority, priority_count) as by_priority
  FROM (
    SELECT
      type,
      priority,
      COUNT(*) as type_count,
      COUNT(*) as priority_count,
      is_read,
      read_at,
      created_at,
      metadata
    FROM user_notifications
    WHERE created_at BETWEEN start_date AND end_date
    GROUP BY type, priority, is_read, read_at, created_at, metadata
  ) sub;
END;
$$ LANGUAGE plpgsql;
```

#### 4.2: Email Notification Integration

```javascript
class EmailNotificationProcessor {
  async processQueue() {
    // Fetch pending emails
    const { data: pending } = await supabase
      .from("email_queue")
      .select("*")
      .eq("status", "pending")
      .lt("attempts", 3)
      .order("created_at", { ascending: true })
      .limit(10);

    for (const email of pending) {
      try {
        await this.sendEmail(email);

        // Mark as sent
        await supabase
          .from("email_queue")
          .update({
            status: "sent",
            sent_at: new Date(),
          })
          .eq("id", email.id);
      } catch (error) {
        // Increment attempt and log error
        await supabase
          .from("email_queue")
          .update({
            attempts: email.attempts + 1,
            last_attempt_at: new Date(),
            error_message: error.message,
            status: email.attempts >= 2 ? "failed" : "pending",
          })
          .eq("id", email.id);
      }
    }
  }

  async sendEmail(email) {
    // Integration with email service (e.g., SendGrid, AWS SES)
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: email.recipient_email }],
          },
        ],
        from: { email: "notifications@medcure.com" },
        subject: email.subject,
        content: [
          {
            type: "text/html",
            value: email.body,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Email send failed: ${response.statusText}`);
    }
  }
}
```

#### 4.3: User Notification Preferences

```javascript
class NotificationPreferencesService {
  async getUserPreferences(userId) {
    const { data } = await supabase
      .from("user_preferences")
      .select("preference_value")
      .eq("user_id", userId)
      .eq("preference_key", "notifications")
      .single();

    return data?.preference_value || this.getDefaultPreferences();
  }

  getDefaultPreferences() {
    return {
      channels: {
        inApp: true,
        desktop: true,
        email: false,
        sms: false,
      },
      types: {
        low_stock: { enabled: true, priority: 2 },
        expiry_warning: { enabled: true, priority: 2 },
        sale_completed: { enabled: true, priority: 3 },
        system_alert: { enabled: true, priority: 1 },
      },
      quietHours: {
        enabled: false,
        start: "22:00",
        end: "07:00",
      },
      grouping: {
        enabled: true,
        intervalMinutes: 15,
      },
    };
  }

  async updatePreferences(userId, preferences) {
    await supabase.from("user_preferences").upsert({
      user_id: userId,
      preference_key: "notifications",
      preference_value: preferences,
      updated_at: new Date(),
    });
  }
}
```

---

## 📈 Performance Optimization Recommendations

### 1. **Database Query Optimization**

```sql
-- Create composite indexes for common queries
CREATE INDEX CONCURRENTLY idx_user_notif_user_status_created
  ON user_notifications(user_id, is_read, created_at DESC)
  WHERE expires_at IS NULL OR expires_at > NOW();

-- Materialized view for notification counts
CREATE MATERIALIZED VIEW user_notification_counts AS
SELECT
  user_id,
  COUNT(*) FILTER (WHERE NOT is_read) as unread_count,
  COUNT(*) FILTER (WHERE is_read) as read_count,
  COUNT(*) FILTER (WHERE type = 'warning') as warning_count,
  COUNT(*) FILTER (WHERE type = 'error') as error_count,
  MAX(created_at) as last_notification_at
FROM user_notifications
GROUP BY user_id;

-- Refresh periodically
CREATE OR REPLACE FUNCTION refresh_notification_counts()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_notification_counts;
END;
$$ LANGUAGE plpgsql;
```

### 2. **Frontend Performance**

```javascript
// Implement pagination for notification list
class PaginatedNotifications {
  constructor(pageSize = 20) {
    this.pageSize = pageSize;
    this.currentPage = 0;
  }

  async loadPage(page = 0) {
    const { data, count } = await supabase
      .from("user_notifications")
      .select("*", { count: "exact" })
      .eq("user_id", currentUser.id)
      .order("created_at", { ascending: false })
      .range(page * this.pageSize, (page + 1) * this.pageSize - 1);

    return {
      notifications: data,
      totalCount: count,
      currentPage: page,
      hasMore: count > (page + 1) * this.pageSize,
    };
  }

  // Infinite scroll support
  async loadMore() {
    this.currentPage++;
    return await this.loadPage(this.currentPage);
  }
}
```

### 3. **Memory Management**

```javascript
class NotificationMemoryManager {
  constructor(maxCacheSize = 100) {
    this.cache = new Map();
    this.maxCacheSize = maxCacheSize;
    this.accessOrder = [];
  }

  set(id, notification) {
    // LRU eviction
    if (this.cache.size >= this.maxCacheSize && !this.cache.has(id)) {
      const oldestId = this.accessOrder.shift();
      this.cache.delete(oldestId);
    }

    this.cache.set(id, notification);
    this.updateAccessOrder(id);
  }

  get(id) {
    const notification = this.cache.get(id);
    if (notification) {
      this.updateAccessOrder(id);
    }
    return notification;
  }

  updateAccessOrder(id) {
    const index = this.accessOrder.indexOf(id);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(id);
  }
}
```

---

## 🔒 Security Recommendations

### 1. **Row Level Security (RLS)**

```sql
-- Enable RLS on notification tables
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
  ON user_notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON user_notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Only authenticated users can see notifications
CREATE POLICY "Authenticated users only"
  ON user_notifications
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Admin override for notification management
CREATE POLICY "Admins can manage all notifications"
  ON user_notifications
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
      AND is_active = true
    )
  );
```

### 2. **Input Validation**

```javascript
class NotificationValidator {
  static validateNotification(notification) {
    const errors = [];

    // Required fields
    if (!notification.title || notification.title.trim().length === 0) {
      errors.push("Title is required");
    }
    if (!notification.message || notification.message.trim().length === 0) {
      errors.push("Message is required");
    }

    // Length limits
    if (notification.title.length > 200) {
      errors.push("Title must be 200 characters or less");
    }
    if (notification.message.length > 1000) {
      errors.push("Message must be 1000 characters or less");
    }

    // Type validation
    const validTypes = ["info", "warning", "error", "success"];
    if (notification.type && !validTypes.includes(notification.type)) {
      errors.push(`Type must be one of: ${validTypes.join(", ")}`);
    }

    // Priority validation
    if (
      notification.priority &&
      (notification.priority < 1 || notification.priority > 5)
    ) {
      errors.push("Priority must be between 1 and 5");
    }

    // XSS prevention
    if (
      this.containsScriptTags(notification.title) ||
      this.containsScriptTags(notification.message)
    ) {
      errors.push("Script tags are not allowed");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  static containsScriptTags(text) {
    return /<script[^>]*>.*?<\/script>/gi.test(text);
  }

  static sanitize(text) {
    return text
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;");
  }
}
```

---

## 🧪 Testing Strategy

### 1. **Unit Tests**

```javascript
// NotificationSystem.test.js
describe("NotificationSystem", () => {
  let notificationSystem;

  beforeEach(() => {
    notificationSystem = new UnifiedNotificationService();
  });

  test("should add notification to database and cache", async () => {
    const notification = {
      title: "Test Notification",
      message: "Test message",
      type: "info",
      priority: 3,
    };

    const result = await notificationSystem.addNotification(notification);

    expect(result).toHaveProperty("id");
    expect(result.title).toBe("Test Notification");

    // Check database
    const { data } = await supabase
      .from("user_notifications")
      .select()
      .eq("id", result.id)
      .single();
    expect(data).toBeTruthy();

    // Check cache
    const cached = notificationSystem.getFromCache(result.id);
    expect(cached).toBeTruthy();
  });

  test("should prevent duplicate notifications", async () => {
    const notification = {
      title: "Duplicate Test",
      message: "Test",
      type: "low_stock",
      metadata: { productId: "product-123" },
    };

    await notificationSystem.addNotification(notification);
    const duplicate = await notificationSystem.addNotification(notification);

    expect(duplicate).toBeNull();
  });

  test("should handle database failures gracefully", async () => {
    // Mock database failure
    jest.spyOn(supabase, "from").mockImplementation(() => {
      throw new Error("Database error");
    });

    const notification = { title: "Test", message: "Test" };

    await expect(
      notificationSystem.addNotification(notification)
    ).rejects.toThrow("Database error");
  });
});
```

### 2. **Integration Tests**

```javascript
// NotificationFlow.integration.test.js
describe("Notification Flow Integration", () => {
  test("should trigger notification when stock drops below threshold", async () => {
    // 1. Create product with low stock
    const { data: product } = await supabase
      .from("products")
      .insert({
        name: "Test Medicine",
        stock_in_pieces: 5,
        reorder_level: 10,
      })
      .select()
      .single();

    // 2. Run health check
    await notificationSystem.runHealthChecks();

    // 3. Verify notification was created
    const { data: notifications } = await supabase
      .from("user_notifications")
      .select()
      .eq("type", "low_stock")
      .contains("metadata", { productId: product.id });

    expect(notifications).toHaveLength(1);
    expect(notifications[0].title).toContain("Low Stock");
  });

  test("should respect user notification preferences", async () => {
    // Set user preference to disable low_stock notifications
    await notificationPreferencesService.updatePreferences(userId, {
      types: {
        low_stock: { enabled: false },
      },
    });

    // Trigger low stock condition
    await createLowStockProduct();
    await notificationSystem.runHealthChecks();

    // Verify no notification was sent to user
    const notifications = await notificationSystem.getNotifications({
      userId,
      type: "low_stock",
    });

    expect(notifications).toHaveLength(0);
  });
});
```

### 3. **Performance Tests**

```javascript
// NotificationPerformance.test.js
describe("Notification Performance", () => {
  test("should handle 1000 notifications efficiently", async () => {
    const startTime = Date.now();
    const promises = [];

    for (let i = 0; i < 1000; i++) {
      promises.push(
        notificationSystem.addNotification({
          title: `Notification ${i}`,
          message: `Test message ${i}`,
          type: "info",
          priority: 3,
        })
      );
    }

    await Promise.all(promises);
    const endTime = Date.now();
    const duration = endTime - startTime;

    // Should complete in under 10 seconds
    expect(duration).toBeLessThan(10000);

    // Average under 10ms per notification
    expect(duration / 1000).toBeLessThan(10);
  });

  test("should efficiently query paginated notifications", async () => {
    // Create 100 notifications
    await createTestNotifications(100);

    const startTime = Date.now();
    const page1 = await notificationSystem.getNotifications({
      page: 0,
      pageSize: 20,
    });
    const endTime = Date.now();

    expect(page1.notifications).toHaveLength(20);
    expect(endTime - startTime).toBeLessThan(500); // Under 500ms
  });
});
```

---

## 📊 Monitoring and Observability

### 1. **Metrics to Track**

```javascript
class NotificationMetrics {
  static metrics = {
    created: new Counter("notifications_created_total"),
    read: new Counter("notifications_read_total"),
    dismissed: new Counter("notifications_dismissed_total"),
    failed: new Counter("notifications_failed_total"),

    readLatency: new Histogram("notification_read_latency_seconds"),
    processingTime: new Histogram("notification_processing_time_seconds"),

    activeNotifications: new Gauge("notifications_active_count"),
    queueDepth: new Gauge("notification_queue_depth"),
  };

  static recordCreated(type, priority) {
    this.metrics.created.inc({ type, priority });
    this.metrics.activeNotifications.inc();
  }

  static recordRead(notificationId, timeToRead) {
    this.metrics.read.inc();
    this.metrics.readLatency.observe(timeToRead);
    this.metrics.activeNotifications.dec();
  }

  static recordProcessingTime(duration) {
    this.metrics.processingTime.observe(duration);
  }
}
```

### 2. **Health Check Endpoint**

```javascript
// API endpoint: /api/health/notifications
export async function notificationHealthCheck(req, res) {
  const checks = {
    database: await checkDatabaseConnection(),
    cache: await checkCacheStatus(),
    rulesEngine: await checkRulesEngine(),
    emailQueue: await checkEmailQueue(),
  };

  const allHealthy = Object.values(checks).every(
    (check) => check.status === "ok"
  );

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? "healthy" : "degraded",
    checks,
    timestamp: new Date().toISOString(),
  });
}

async function checkDatabaseConnection() {
  try {
    const { data, error } = await supabase
      .from("user_notifications")
      .select("count")
      .limit(1);

    return {
      status: error ? "error" : "ok",
      message: error?.message || "Database connection healthy",
    };
  } catch (error) {
    return {
      status: "error",
      message: error.message,
    };
  }
}
```

### 3. **Error Tracking**

```javascript
class NotificationErrorTracker {
  static async logError(error, context) {
    const errorLog = {
      timestamp: new Date(),
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      context: {
        userId: context.userId,
        notificationType: context.type,
        operation: context.operation,
        metadata: context.metadata,
      },
      severity: this.determineSeverity(error, context),
    };

    // Log to database
    await supabase.from("error_logs").insert(errorLog);

    // Send to error tracking service (e.g., Sentry)
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        tags: {
          component: "notifications",
          operation: context.operation,
        },
        extra: context,
      });
    }

    // Alert on critical errors
    if (errorLog.severity === "critical") {
      await this.sendAdminAlert(errorLog);
    }
  }

  static determineSeverity(error, context) {
    if (
      context.operation === "healthCheck" &&
      error.message.includes("database")
    ) {
      return "critical";
    }
    if (context.type === "EXPIRY_URGENT") {
      return "high";
    }
    return "medium";
  }
}
```

---

## 🎯 Implementation Roadmap

### **Immediate (Week 1-2):** 🔴 Critical Priority

- [ ] Consolidate to single NotificationSystem class
- [ ] Remove duplicate UI components (keep one)
- [ ] Implement retry mechanism for health checks
- [ ] Add basic error logging

### **Short-term (Week 3-4):** 🟠 High Priority

- [ ] Migrate to database-first architecture
- [ ] Implement real-time Supabase synchronization
- [ ] Add RLS policies for security
- [ ] Create database indexes for performance

### **Medium-term (Week 5-6):** 🟡 Medium Priority

- [ ] Activate rules engine with database integration
- [ ] Implement notification preferences
- [ ] Add email notification queue
- [ ] Build analytics dashboard

### **Long-term (Week 7-8+):** 🟢 Enhancement

- [ ] Advanced notification grouping
- [ ] ML-based notification optimization
- [ ] SMS notification integration
- [ ] Push notification for mobile PWA

---

## 📏 Success Metrics

### Key Performance Indicators (KPIs):

1. **Reliability**

   - Target: 99.9% notification delivery success rate
   - Current: Unknown (no tracking)

2. **Performance**

   - Target: < 200ms notification creation latency
   - Target: < 100ms UI update after notification

3. **User Engagement**

   - Target: > 80% notification read rate
   - Target: < 30% dismissal rate without reading

4. **System Health**

   - Target: 0 silent failures
   - Target: < 1 hour recovery time for failures

5. **Developer Experience**
   - Target: Single API for all notification types
   - Target: < 5 lines of code to send notification

---

## 🔬 Conclusion

### Current State: ⚠️ **FRAGMENTED AND RISKY**

The notification system has **multiple implementations without clear integration**, leading to:

- ❌ Inconsistent behavior across the application
- ❌ No persistence or historical tracking
- ❌ Wasted database schema (4 tables defined, 0 actively used)
- ❌ No error recovery or monitoring
- ❌ High maintenance burden with duplicate code

### Recommended State: ✅ **UNIFIED, DATABASE-DRIVEN, RESILIENT**

Proposed architecture provides:

- ✅ Single source of truth (database)
- ✅ Multi-device synchronization via Supabase real-time
- ✅ Rule-based automation with database-driven configuration
- ✅ Comprehensive error handling and retry mechanisms
- ✅ Analytics and monitoring for continuous improvement
- ✅ User preferences and customization
- ✅ Email/SMS integration capabilities

### Investment Required:

- **Development Time:** 6-8 weeks (phased approach)
- **Complexity:** Medium (leveraging existing database schema)
- **Risk:** Low (incremental migration, backward compatible)
- **ROI:** High (improved reliability, reduced maintenance, better UX)

### Next Steps:

1. **Approve architectural direction** (Phase 1-4 plan)
2. **Assign development team** (1 senior + 1 mid-level developer)
3. **Start with Phase 1** (consolidation and critical fixes)
4. **Iterative deployment** (weekly releases with feature flags)
5. **Monitor metrics** (establish baseline, track improvements)

---

**Document Version:** 1.0  
**Last Updated:** October 5, 2025  
**Prepared By:** Senior Software Architect (AI-Assisted Analysis)  
**Review Status:** Pending Technical Review  
**Classification:** Internal Technical Documentation

---
