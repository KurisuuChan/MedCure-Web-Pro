# 🎯 Notification System - Pragmatic Implementation Strategy

**Strategic Review Date:** October 5, 2025  
**System:** MedCure Pharmacy Management System  
**Approach:** Pragmatic, Maintainable, Production-Ready  
**Philosophy:** "Simple solutions that work > Complex solutions that break"

---

## 🧠 Senior Developer Analysis: What You Actually Need

### The Reality Check

After analyzing your system and requirements, here's the **honest truth** about notifications in a pharmacy management system:

**You DON'T need:**

- ❌ Desktop browser notifications (users already in the app)
- ❌ SMS notifications (expensive, overkill for internal pharmacy staff)
- ❌ Complex rules engine with 50+ configurations
- ❌ ML-based notification optimization
- ❌ Multiple notification services fighting each other

**You DO need:**

- ✅ **In-app notifications** that staff see when logged in
- ✅ **Email alerts** for critical issues when staff are away
- ✅ **Database persistence** for notification history/audit
- ✅ **Simple, reliable system** that "just works"
- ✅ **Easy to maintain** by your future developers

---

## 🎯 Recommended Architecture: "The 80/20 Solution"

### Core Principle: **One Service, Three Channels, Zero Complexity**

```
┌─────────────────────────────────────────────────────────────┐
│                   UNIFIED NOTIFICATION SERVICE               │
│              (Single source of truth - Database)             │
└─────────────────┬───────────────────────────────────────────┘
                  │
         ┌────────┴────────┐
         │                 │
    ┌────▼─────┐    ┌─────▼──────┐
    │ In-App   │    │   Email    │
    │ Display  │    │   Queue    │
    │ (React)  │    │ (Critical) │
    └──────────┘    └────────────┘
```

### Why This Works:

1. **In-App Notifications** = Primary channel for active users
2. **Email Alerts** = Backup channel for critical issues + offline users
3. **Database** = Single source of truth, enables reporting/audit

---

## 🏗️ Simplified Architecture

### File Structure (Clean & Simple):

```
src/services/notifications/
├── NotificationService.js           [CORE - All logic here]
├── EmailService.js                  [EMAIL - Integration layer]
└── constants.js                     [TYPES & CONFIGS]

src/components/notifications/
├── NotificationBell.jsx             [UI - Bell icon with count]
├── NotificationPanel.jsx            [UI - Dropdown panel]
└── NotificationItem.jsx             [UI - Single notification]

database/migrations/
└── notification_system.sql          [DB - Schema only]
```

**That's it.** No 7 different services, no rules engine, no analytics dashboard.

---

## 📦 Implementation Plan: 3 Phases, 2 Weeks

### **Phase 1: Clean House** (2 days) 🧹

#### 1.1: Delete Unnecessary Code

```bash
# Remove these files completely
DELETE: src/services/NotificationMigration.js
DELETE: src/services/domains/notifications/notificationRulesEngine.js
DELETE: src/services/domains/notifications/notificationAnalytics.js
DELETE: src/services/domains/notifications/simpleNotificationService.js
DELETE: src/services/domains/notifications/enhancedNotificationTypes.js
DELETE: src/components/layout/NotificationDropdownV2.jsx

KEEP: src/services/NotificationSystem.js (we'll refactor this)
KEEP: src/components/layout/NotificationDropdown.jsx (we'll simplify this)
```

#### 1.2: Database Schema - Use What You Have

```sql
-- We only need ONE table: user_notifications
-- Drop the others, they're redundant

-- Keep and enhance user_notifications
ALTER TABLE user_notifications ADD COLUMN IF NOT EXISTS priority integer DEFAULT 3;
ALTER TABLE user_notifications ADD COLUMN IF NOT EXISTS category varchar(50);
ALTER TABLE user_notifications ADD COLUMN IF NOT EXISTS dismissed_at timestamp;
ALTER TABLE user_notifications ADD COLUMN IF NOT EXISTS email_sent boolean DEFAULT false;
ALTER TABLE user_notifications ADD COLUMN IF NOT EXISTS email_sent_at timestamp;

-- Create essential indexes
CREATE INDEX IF NOT EXISTS idx_user_notif_active
  ON user_notifications(user_id, is_read, created_at DESC)
  WHERE dismissed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_user_notif_unread_count
  ON user_notifications(user_id)
  WHERE is_read = false AND dismissed_at IS NULL;

-- RLS Policies (Security first)
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own notifications" ON user_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications" ON user_notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON user_notifications
  FOR INSERT WITH CHECK (true);

-- Drop unused tables (clean slate)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS notification_rules CASCADE;
DROP TABLE IF EXISTS email_queue CASCADE;
```

---

### **Phase 2: Build The Right Thing** (5 days) 🛠️

#### 2.1: Core Notification Service (Single File)

```javascript
// src/services/notifications/NotificationService.js
import { supabase } from "../../config/supabase";
import { EmailService } from "./EmailService";

/**
 * Unified Notification Service
 * - Stores in database (persistence)
 * - Shows in-app (UI updates via Supabase realtime)
 * - Sends email for critical alerts
 */
class NotificationService {
  constructor() {
    this.emailService = new EmailService();
    this.realtimeSubscription = null;
  }

  // ========================================
  // CORE: Create Notification
  // ========================================

  async create({
    userId,
    title,
    message,
    type = "info",
    priority = 3,
    category = "general",
    metadata = {},
  }) {
    try {
      // 1. Validate
      if (!userId || !title || !message) {
        throw new Error("Missing required fields: userId, title, message");
      }

      // 2. Insert to database
      const { data: notification, error } = await supabase
        .from("user_notifications")
        .insert({
          user_id: userId,
          title,
          message,
          type,
          priority,
          category,
          metadata,
          is_read: false,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // 3. Send email if critical (priority 1 or 2)
      if (priority <= 2) {
        await this.sendEmailNotification(notification);
      }

      // 4. Supabase realtime will automatically notify UI subscribers
      return notification;
    } catch (error) {
      console.error("❌ Failed to create notification:", error);
      throw error;
    }
  }

  // ========================================
  // HELPERS: Specific Notification Types
  // ========================================

  async notifyLowStock(
    productId,
    productName,
    currentStock,
    reorderLevel,
    userId
  ) {
    return await this.create({
      userId,
      title: "⚠️ Low Stock Alert",
      message: `${productName} is running low: ${currentStock} pieces (reorder at ${reorderLevel})`,
      type: "warning",
      priority: 2,
      category: "inventory",
      metadata: {
        productId,
        productName,
        currentStock,
        reorderLevel,
        actionUrl: `/inventory?product=${productId}`,
      },
    });
  }

  async notifyExpiringSoon(
    productId,
    productName,
    expiryDate,
    daysRemaining,
    userId
  ) {
    const priority = daysRemaining <= 7 ? 1 : 2; // Urgent if 7 days or less

    return await this.create({
      userId,
      title:
        daysRemaining <= 7
          ? "🚨 Urgent: Product Expiring Soon"
          : "📅 Product Expiry Warning",
      message: `${productName} expires in ${daysRemaining} days (${expiryDate})`,
      type: daysRemaining <= 7 ? "error" : "warning",
      priority,
      category: "expiry",
      metadata: {
        productId,
        productName,
        expiryDate,
        daysRemaining,
        actionUrl: `/inventory?product=${productId}`,
      },
    });
  }

  async notifySaleCompleted(saleId, totalAmount, itemCount, userId) {
    return await this.create({
      userId,
      title: "✅ Sale Completed",
      message: `Successfully processed sale of ${itemCount} items for ₱${totalAmount.toFixed(
        2
      )}`,
      type: "success",
      priority: 4, // Low priority, just FYI
      category: "sales",
      metadata: {
        saleId,
        totalAmount,
        itemCount,
        actionUrl: `/sales/history/${saleId}`,
      },
    });
  }

  async notifySystemError(errorMessage, errorCode, userId) {
    return await this.create({
      userId,
      title: "❌ System Error",
      message: `An error occurred: ${errorMessage}`,
      type: "error",
      priority: 1, // Critical - send email
      category: "system",
      metadata: { errorMessage, errorCode },
    });
  }

  // ========================================
  // EMAIL: Send Critical Notifications
  // ========================================

  async sendEmailNotification(notification) {
    try {
      // Get user email
      const { data: user } = await supabase
        .from("users")
        .select("email, first_name")
        .eq("id", notification.user_id)
        .single();

      if (!user?.email) {
        console.warn("⚠️ No email found for user:", notification.user_id);
        return;
      }

      // Send email
      await this.emailService.send({
        to: user.email,
        subject: `[MedCure] ${notification.title}`,
        html: this.generateEmailTemplate(notification, user.first_name),
      });

      // Mark as sent
      await supabase
        .from("user_notifications")
        .update({
          email_sent: true,
          email_sent_at: new Date().toISOString(),
        })
        .eq("id", notification.id);

      console.log("✅ Email sent for notification:", notification.id);
    } catch (error) {
      console.error("❌ Failed to send email notification:", error);
      // Don't throw - email failure shouldn't break notification creation
    }
  }

  generateEmailTemplate(notification, userName) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .notification { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb; }
          .priority-high { border-left-color: #dc2626; }
          .priority-medium { border-left-color: #f59e0b; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🏥 MedCure Pharmacy</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <div class="notification ${
              notification.priority <= 2 ? "priority-high" : "priority-medium"
            }">
              <h2 style="margin-top: 0;">${notification.title}</h2>
              <p>${notification.message}</p>
              ${
                notification.metadata?.actionUrl
                  ? `
                <a href="${process.env.VITE_APP_URL}${notification.metadata.actionUrl}" class="button">
                  View Details
                </a>
              `
                  : ""
              }
            </div>
            <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
              This is an automated notification from MedCure Pharmacy Management System.
              <br>Time: ${new Date(notification.created_at).toLocaleString()}
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} MedCure Pharmacy. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // ========================================
  // READ: Get User Notifications
  // ========================================

  async getUserNotifications(
    userId,
    { limit = 50, offset = 0, unreadOnly = false } = {}
  ) {
    try {
      let query = supabase
        .from("user_notifications")
        .select("*", { count: "exact" })
        .eq("user_id", userId)
        .is("dismissed_at", null)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (unreadOnly) {
        query = query.eq("is_read", false);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        notifications: data || [],
        totalCount: count || 0,
        hasMore: count > offset + limit,
      };
    } catch (error) {
      console.error("❌ Failed to get notifications:", error);
      return { notifications: [], totalCount: 0, hasMore: false };
    }
  }

  async getUnreadCount(userId) {
    try {
      const { count, error } = await supabase
        .from("user_notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_read", false)
        .is("dismissed_at", null);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error("❌ Failed to get unread count:", error);
      return 0;
    }
  }

  // ========================================
  // UPDATE: Mark as Read/Dismissed
  // ========================================

  async markAsRead(notificationId, userId) {
    try {
      const { error } = await supabase
        .from("user_notifications")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq("id", notificationId)
        .eq("user_id", userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("❌ Failed to mark as read:", error);
      return false;
    }
  }

  async markAllAsRead(userId) {
    try {
      const { error } = await supabase
        .from("user_notifications")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("is_read", false)
        .is("dismissed_at", null);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("❌ Failed to mark all as read:", error);
      return false;
    }
  }

  async dismiss(notificationId, userId) {
    try {
      const { error } = await supabase
        .from("user_notifications")
        .update({ dismissed_at: new Date().toISOString() })
        .eq("id", notificationId)
        .eq("user_id", userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("❌ Failed to dismiss notification:", error);
      return false;
    }
  }

  async dismissAll(userId) {
    try {
      const { error } = await supabase
        .from("user_notifications")
        .update({ dismissed_at: new Date().toISOString() })
        .eq("user_id", userId)
        .is("dismissed_at", null);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("❌ Failed to dismiss all:", error);
      return false;
    }
  }

  // ========================================
  // REALTIME: Subscribe to Updates
  // ========================================

  subscribeToNotifications(userId, onNotificationUpdate) {
    if (this.realtimeSubscription) {
      this.unsubscribe();
    }

    this.realtimeSubscription = supabase
      .channel(`user-notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("📬 Real-time notification update:", payload);
          onNotificationUpdate(payload);
        }
      )
      .subscribe();

    return () => this.unsubscribe();
  }

  unsubscribe() {
    if (this.realtimeSubscription) {
      this.realtimeSubscription.unsubscribe();
      this.realtimeSubscription = null;
    }
  }

  // ========================================
  // AUTOMATED: Health Checks
  // ========================================

  async runHealthChecks() {
    try {
      console.log("🔍 Running notification health checks...");

      // Get all active users (admin, manager, pharmacist)
      const { data: users } = await supabase
        .from("users")
        .select("id, email, role")
        .eq("is_active", true)
        .in("role", ["admin", "manager", "pharmacist"]);

      if (!users) return;

      // Check low stock for all products
      await this.checkLowStock(users);

      // Check expiring products
      await this.checkExpiringProducts(users);

      console.log("✅ Health checks completed");
    } catch (error) {
      console.error("❌ Health check failed:", error);
    }
  }

  async checkLowStock(users) {
    try {
      const { data: products } = await supabase
        .from("products")
        .select("id, brand_name, generic_name, stock_in_pieces, reorder_level")
        .lte("stock_in_pieces", supabase.raw("reorder_level"))
        .gt("stock_in_pieces", 0)
        .eq("is_active", true);

      if (!products || products.length === 0) return;

      // Notify relevant users
      for (const user of users) {
        for (const product of products) {
          // Check if we already notified about this recently (avoid spam)
          const { data: existing } = await supabase
            .from("user_notifications")
            .select("id")
            .eq("user_id", user.id)
            .eq("category", "inventory")
            .contains("metadata", { productId: product.id })
            .gte(
              "created_at",
              new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
            ) // Last 24 hours
            .single();

          if (!existing) {
            await this.notifyLowStock(
              product.id,
              product.brand_name || product.generic_name,
              product.stock_in_pieces,
              product.reorder_level,
              user.id
            );
          }
        }
      }
    } catch (error) {
      console.error("❌ Low stock check failed:", error);
    }
  }

  async checkExpiringProducts(users) {
    try {
      const today = new Date();
      const thirtyDaysFromNow = new Date(today);
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      const { data: products } = await supabase
        .from("products")
        .select("id, brand_name, generic_name, expiry_date")
        .not("expiry_date", "is", null)
        .gte("expiry_date", today.toISOString().split("T")[0])
        .lte("expiry_date", thirtyDaysFromNow.toISOString().split("T")[0])
        .eq("is_active", true);

      if (!products || products.length === 0) return;

      for (const user of users) {
        for (const product of products) {
          const expiryDate = new Date(product.expiry_date);
          const daysRemaining = Math.ceil(
            (expiryDate - today) / (1000 * 60 * 60 * 24)
          );

          // Check if we already notified about this recently
          const { data: existing } = await supabase
            .from("user_notifications")
            .select("id")
            .eq("user_id", user.id)
            .eq("category", "expiry")
            .contains("metadata", { productId: product.id })
            .gte(
              "created_at",
              new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
            )
            .single();

          if (!existing) {
            await this.notifyExpiringSoon(
              product.id,
              product.brand_name || product.generic_name,
              product.expiry_date,
              daysRemaining,
              user.id
            );
          }
        }
      }
    } catch (error) {
      console.error("❌ Expiry check failed:", error);
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;
```

#### 2.2: Email Service (Integration Layer)

```javascript
// src/services/notifications/EmailService.js

/**
 * Email Service
 * Simple wrapper for email sending - easy to swap providers
 */
export class EmailService {
  constructor() {
    this.provider = process.env.VITE_EMAIL_PROVIDER || "smtp"; // 'smtp', 'sendgrid', 'resend'
    this.configured = this.checkConfiguration();
  }

  checkConfiguration() {
    // Check if email is properly configured
    const hasConfig = !!(
      process.env.VITE_SMTP_HOST ||
      process.env.VITE_SENDGRID_API_KEY ||
      process.env.VITE_RESEND_API_KEY
    );

    if (!hasConfig) {
      console.warn(
        "⚠️ Email not configured. Notifications will be in-app only."
      );
    }

    return hasConfig;
  }

  async send({ to, subject, html }) {
    if (!this.configured) {
      console.log("📧 Email skipped (not configured):", { to, subject });
      return { success: false, reason: "not_configured" };
    }

    try {
      switch (this.provider) {
        case "sendgrid":
          return await this.sendViaSendGrid({ to, subject, html });

        case "resend":
          return await this.sendViaResend({ to, subject, html });

        case "smtp":
        default:
          return await this.sendViaSMTP({ to, subject, html });
      }
    } catch (error) {
      console.error("❌ Email send failed:", error);
      return { success: false, error: error.message };
    }
  }

  async sendViaSendGrid({ to, subject, html }) {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.VITE_SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: {
          email: process.env.VITE_EMAIL_FROM || "notifications@medcure.com",
          name: "MedCure Pharmacy",
        },
        subject,
        content: [{ type: "text/html", value: html }],
      }),
    });

    if (!response.ok) {
      throw new Error(`SendGrid API error: ${response.statusText}`);
    }

    return { success: true };
  }

  async sendViaResend({ to, subject, html }) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.VITE_RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.VITE_EMAIL_FROM || "notifications@medcure.com",
        to,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      throw new Error(`Resend API error: ${response.statusText}`);
    }

    return { success: true };
  }

  async sendViaSMTP({ to, subject, html }) {
    // For SMTP, you'll need a backend endpoint
    // This is just a placeholder
    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, html }),
    });

    if (!response.ok) {
      throw new Error(`SMTP send failed: ${response.statusText}`);
    }

    return { success: true };
  }
}
```

---

### **Phase 3: Simple, Beautiful UI** (3 days) 🎨

#### 3.1: Notification Bell Component

```jsx
// src/components/notifications/NotificationBell.jsx
import React, { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { notificationService } from "../../services/notifications/NotificationService";
import { useAuth } from "../../hooks/useAuth";
import NotificationPanel from "./NotificationPanel";

export function NotificationBell() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    // Load initial count
    loadUnreadCount();

    // Subscribe to real-time updates
    const unsubscribe = notificationService.subscribeToNotifications(
      user.id,
      (payload) => {
        // Reload count when notifications change
        loadUnreadCount();
      }
    );

    return unsubscribe;
  }, [user?.id]);

  const loadUnreadCount = async () => {
    if (!user?.id) return;
    const count = await notificationService.getUnreadCount(user.id);
    setUnreadCount(count);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationPanel
          onClose={() => setIsOpen(false)}
          onCountChange={loadUnreadCount}
        />
      )}
    </div>
  );
}
```

#### 3.2: Notification Panel Component

```jsx
// src/components/notifications/NotificationPanel.jsx
import React, { useState, useEffect } from "react";
import {
  X,
  Check,
  Trash2,
  AlertTriangle,
  Package,
  Calendar,
  CheckCircle,
  Info,
} from "lucide-react";
import { notificationService } from "../../services/notifications/NotificationService";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";

const ICON_MAP = {
  warning: AlertTriangle,
  error: AlertTriangle,
  success: CheckCircle,
  info: Info,
};

const COLOR_MAP = {
  error: "bg-red-50 border-red-200 text-red-800",
  warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
  success: "bg-green-50 border-green-200 text-green-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
};

export default function NotificationPanel({ onClose, onCountChange }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, [user?.id]);

  const loadNotifications = async () => {
    if (!user?.id) return;

    setLoading(true);
    const { notifications: data } =
      await notificationService.getUserNotifications(user.id, {
        limit: 20,
      });
    setNotifications(data);
    setLoading(false);
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read
    await notificationService.markAsRead(notification.id, user.id);

    // Update local state
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
    );

    // Update count
    onCountChange?.();

    // Navigate if action URL exists
    if (notification.metadata?.actionUrl) {
      navigate(notification.metadata.actionUrl);
      onClose();
    }
  };

  const handleDismiss = async (notificationId, event) => {
    event.stopPropagation();

    await notificationService.dismiss(notificationId, user.id);
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    onCountChange?.();
  };

  const handleMarkAllAsRead = async () => {
    await notificationService.markAllAsRead(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    onCountChange?.();
  };

  const handleDismissAll = async () => {
    await notificationService.dismissAll(user.id);
    setNotifications([]);
    onCountChange?.();
  };

  const getRelativeTime = (timestamp) => {
    const now = Date.now();
    const diff = now - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close notifications"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Actions */}
        {notifications.length > 0 && (
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
            <button
              onClick={handleMarkAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Mark all as read
            </button>
            <button
              onClick={handleDismissAll}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-600 font-medium">All caught up!</p>
              <p className="text-sm text-gray-500 mt-1">No new notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => {
                const Icon = ICON_MAP[notification.type] || Info;
                const colorClass =
                  COLOR_MAP[notification.type] || COLOR_MAP.info;

                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`
                      p-4 cursor-pointer transition-colors hover:bg-gray-50
                      ${!notification.is_read ? "bg-blue-50" : ""}
                    `}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Icon */}
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${colorClass}`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <p
                            className={`text-sm font-medium ${
                              notification.is_read
                                ? "text-gray-700"
                                : "text-gray-900"
                            }`}
                          >
                            {notification.title}
                          </p>
                          {!notification.is_read && (
                            <span className="ml-2 w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></span>
                          )}
                        </div>
                        <p
                          className={`text-sm mt-1 ${
                            notification.is_read
                              ? "text-gray-500"
                              : "text-gray-600"
                          }`}
                        >
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-500">
                            {getRelativeTime(notification.created_at)}
                          </p>
                          <button
                            onClick={(e) => handleDismiss(notification.id, e)}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                            aria-label="Dismiss notification"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
```

---

## 🎮 Usage Examples

### In Your Code:

```javascript
// Example 1: Manual notification
import { notificationService } from "./services/notifications/NotificationService";

// After a sale
await notificationService.notifySaleCompleted(
  saleId,
  totalAmount,
  itemCount,
  currentUser.id
);

// Example 2: Low stock detection (in inventory update)
if (newStock <= product.reorder_level) {
  await notificationService.notifyLowStock(
    product.id,
    product.name,
    newStock,
    product.reorder_level,
    currentUser.id
  );
}

// Example 3: Run automated checks (call this on app startup or scheduled)
await notificationService.runHealthChecks();

// Example 4: In your Header/Navbar component
import { NotificationBell } from "./components/notifications/NotificationBell";

function Header() {
  return (
    <header>
      {/* ... other header content ... */}
      <NotificationBell />
    </header>
  );
}
```

---

## 🔧 Environment Configuration

```bash
# .env file

# Email Provider (choose one: 'smtp', 'sendgrid', 'resend')
VITE_EMAIL_PROVIDER=sendgrid

# SendGrid (if using SendGrid)
VITE_SENDGRID_API_KEY=your_sendgrid_api_key_here

# Resend (if using Resend - recommended, easier)
VITE_RESEND_API_KEY=your_resend_api_key_here

# Email From Address
VITE_EMAIL_FROM=notifications@medcure.com

# App URL (for email links)
VITE_APP_URL=http://localhost:5173
```

---

## 📊 Why This Approach Works

### 1. **Simplicity = Reliability**

- One service, one purpose, easy to debug
- No complex state management between multiple services
- Future developers can understand it in 30 minutes

### 2. **Database-First = Truth**

- All notifications stored permanently
- Easy to query, report, audit
- Multi-device sync via Supabase realtime (free feature!)

### 3. **Smart Email Usage**

- Only critical notifications (priority 1-2) trigger emails
- Prevents email spam
- Users stay informed even when away

### 4. **Performance**

- Database queries are fast with proper indexes
- UI updates in real-time via Supabase channels
- No polling, no waste

### 5. **Maintainable**

- One file to understand (NotificationService.js)
- Clear functions for each notification type
- Easy to add new notification types

---

## 🚀 Deployment Checklist

### Week 1: Foundation

- [ ] Run database migration (add columns, indexes, RLS)
- [ ] Delete old unused files
- [ ] Implement NotificationService.js
- [ ] Implement EmailService.js
- [ ] Configure email provider (Resend recommended)

### Week 2: UI & Testing

- [ ] Build NotificationBell.jsx component
- [ ] Build NotificationPanel.jsx component
- [ ] Add NotificationBell to Header/Navbar
- [ ] Test notification creation
- [ ] Test email delivery
- [ ] Test real-time updates

### Week 3: Integration

- [ ] Add notifications to inventory updates
- [ ] Add notifications to sales completion
- [ ] Set up automated health checks (cron job or scheduled function)
- [ ] Test end-to-end flow
- [ ] Monitor for issues

---

## 🎯 Success Metrics (Realistic)

### Week 1 (Post-Launch):

- ✅ Notification system is live and working
- ✅ No critical bugs reported
- ✅ Users see notifications in-app

### Month 1:

- ✅ > 90% notification delivery success rate
- ✅ Email alerts working for critical issues
- ✅ Zero database performance issues
- ✅ System is stable and requires no daily maintenance

### Month 3:

- ✅ Users rely on notifications for daily operations
- ✅ Historical notification data available for audit
- ✅ Easy to add new notification types as needed

---

## 💡 Future Enhancements (When You Actually Need Them)

### Phase 4 (Optional - Later):

1. **User Preferences** - Let users customize which notifications they receive
2. **Notification Categories** - Filter by inventory, sales, system, etc.
3. **Sound Alerts** - Optional sound for critical in-app notifications
4. **Analytics Dashboard** - Simple stats on notification delivery and read rates
5. **Batch Notifications** - Group similar notifications to reduce noise

**But don't build these now.** Launch first, get feedback, then add what users actually ask for.

---

## 🎓 Senior Developer Wisdom

### What I Learned in 20 Years:

1. **Start Simple** - You can always add complexity later, but you can never remove it easily
2. **Use the Database** - It's your friend, not your enemy. Let it do what it's good at.
3. **Real-time is Easy** - Supabase gives you this for free, use it
4. **Email is Hard** - Use a service (Resend, SendGrid), don't build your own
5. **Delete > Add** - Remove unused code aggressively
6. **One Source of Truth** - Database, not localStorage, not memory
7. **Test the Happy Path First** - Make sure it works before optimizing
8. **Monitor, Don't Assume** - Add console.logs, check errors, stay informed

### The 80/20 Rule:

- 80% of notification value comes from 20% of features
- That 20% is: **in-app display + critical email alerts**
- Everything else is nice-to-have

### Remember:

> "Perfection is achieved, not when there is nothing more to add, but when there is nothing left to take away." - Antoine de Saint-Exupéry

---

## 📝 Summary: What We're Building

### In-App Notifications:

✅ Bell icon in header with unread count  
✅ Dropdown panel with notification list  
✅ Click to mark as read  
✅ Click to navigate to related page  
✅ Real-time updates (no refresh needed)  
✅ Clean, simple UI

### Email Notifications:

✅ Only for critical alerts (low stock, urgent expiry, errors)  
✅ Beautiful HTML email template  
✅ Links back to the app  
✅ Sent automatically when priority <= 2

### Database:

✅ All notifications stored permanently  
✅ Easy to query and report  
✅ Proper indexes for performance  
✅ RLS for security

### Code Quality:

✅ One service file (NotificationService.js)  
✅ Easy to understand and maintain  
✅ Well-commented  
✅ Follows best practices

---

**That's it. Simple, effective, maintainable.**

Ready to implement? Let's build something that actually works. 🚀

---

**Document Version:** 2.0 - Pragmatic Edition  
**Date:** October 5, 2025  
**Philosophy:** KISS (Keep It Simple, Stupid)  
**Target:** Production-ready in 2 weeks
