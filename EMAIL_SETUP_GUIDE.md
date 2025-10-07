# 📧 Email Notification Setup Guide - 3 Easy Solutions

## Current Problem 🔴

Your `EmailService.js` tries to send emails from the **browser** using SendGrid/Resend API directly, but browsers **block this due to CORS (Cross-Origin Resource Sharing) security**.

**Error you're seeing:**

```
NetworkError: CORS policy blocked
```

**Why it fails:**

- Browsers don't allow direct API calls to email services (security risk)
- Email API keys would be exposed in browser (anyone can steal them)
- Need server-side email sending

---

## ✅ Solution 1: Supabase Edge Functions (EASIEST & RECOMMENDED)

**Pros:**

- ✅ **FREE** (Supabase free tier includes Edge Functions)
- ✅ No separate server needed
- ✅ Already using Supabase
- ✅ Simple setup (10 minutes)
- ✅ Secure (API keys on server-side)
- ✅ Auto-scales

**How it works:**

```
Browser → Supabase Edge Function → SendGrid/Resend → Email Sent
```

### Step 1: Install Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF
```

### Step 2: Create Edge Function

Create folder structure:

```
supabase/
  functions/
    send-notification-email/
      index.ts
```

**File: `supabase/functions/send-notification-email/index.ts`**

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "no-reply@medcure.com";
const FROM_NAME = Deno.env.get("FROM_NAME") || "MedCure Pharmacy";

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Parse request
    const { to, subject, html, text }: EmailRequest = await req.json();

    // Validate
    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, html" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!SENDGRID_API_KEY) {
      return new Response(
        JSON.stringify({ error: "SendGrid not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Send email via SendGrid
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: FROM_EMAIL, name: FROM_NAME },
        subject,
        content: [
          { type: "text/html", value: html },
          ...(text ? [{ type: "text/plain", value: text }] : []),
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("SendGrid error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: error }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Success
    return new Response(
      JSON.stringify({
        success: true,
        message: "Email sent successfully",
        to,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

### Step 3: Deploy Edge Function

```bash
# Deploy function
supabase functions deploy send-notification-email

# Set environment variables (API keys)
supabase secrets set SENDGRID_API_KEY=your_sendgrid_api_key_here
supabase secrets set FROM_EMAIL=notifications@yourdomain.com
supabase secrets set FROM_NAME="MedCure Pharmacy"
```

### Step 4: Update Your EmailService.js

Replace your `EmailService.js` with this simpler version:

```javascript
/**
 * EmailService - Server-Side Email via Supabase Edge Functions
 */
import { supabase } from "../../config/supabase.js";
import { logger } from "../../utils/logger.js";

class EmailService {
  constructor() {
    // Get Edge Function URL from your Supabase project
    const projectUrl = import.meta.env.VITE_SUPABASE_URL;
    this.edgeFunctionUrl = `${projectUrl}/functions/v1/send-notification-email`;
    this.isConfigured = !!projectUrl;
  }

  /**
   * Send email via Supabase Edge Function
   */
  async send({ to, subject, html, text }) {
    try {
      if (!this.isConfigured) {
        logger.warn("Email service not configured");
        return { success: false, reason: "not_configured" };
      }

      // Get current session token for authentication
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        logger.warn("No active session for email sending");
        return { success: false, reason: "no_session" };
      }

      // Call Edge Function
      const response = await fetch(this.edgeFunctionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ to, subject, html, text }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to send email");
      }

      logger.success(`✅ Email sent to: ${to}`);
      return { success: true, provider: "supabase-edge-function" };
    } catch (error) {
      logger.error("❌ Email send failed:", error);
      return { success: false, error: error.message };
    }
  }

  isReady() {
    return this.isConfigured;
  }

  getProvider() {
    return "supabase-edge-function";
  }

  getStatus() {
    return {
      isConfigured: this.isConfigured,
      provider: "supabase-edge-function",
      ready: this.isReady(),
    };
  }
}

export const emailService = new EmailService();
export default emailService;
```

### Step 5: Test It!

```javascript
// In browser console or your app:
const result = await emailService.send({
  to: "your-email@example.com",
  subject: "Test Email from MedCure",
  html: "<h1>It works!</h1><p>Email is now working via Supabase Edge Functions.</p>",
});

console.log(result); // Should show success: true
```

---

## ✅ Solution 2: Supabase Database Triggers + Webhooks (NO CODE!)

**Pros:**

- ✅ **ZERO CODE** in your app
- ✅ Fully automated
- ✅ Database-driven
- ✅ Use services like Zapier/Make.com

**How it works:**

```
Database → Webhook → Zapier/Make → Email Service → Email Sent
```

### Step 1: Create Webhook in Supabase

1. Go to Supabase Dashboard → Database → Webhooks
2. Click "Create a new hook"
3. Configure:
   - **Table**: `user_notifications`
   - **Events**: `INSERT`
   - **Type**: `HTTP Request`
   - **Method**: `POST`
   - **URL**: Your webhook URL (from Zapier/Make)

### Step 2: Setup Zapier (Free Tier Works!)

1. Go to [Zapier.com](https://zapier.com) → Create Zap
2. **Trigger**: Webhooks by Zapier → Catch Hook
3. Copy the webhook URL to Supabase (step 1 above)
4. **Action**: Gmail / Outlook / SendGrid → Send Email
5. Map fields:
   - To: `{{data.user_email}}` (from webhook)
   - Subject: `{{data.title}}`
   - Body: `{{data.message}}`
6. Test & Turn on Zap!

**Cost:** FREE for 100 tasks/month on Zapier free tier

---

## ✅ Solution 3: Simple Node.js Backend (For Scalability)

**Pros:**

- ✅ Full control
- ✅ Can add complex logic
- ✅ Easy to test locally

**Cons:**

- ❌ Need to deploy separate server
- ❌ More setup

### Quick Setup with Express.js

**File: `backend/server.js`**

```javascript
import express from "express";
import cors from "cors";
import sgMail from "@sendgrid/mail";

const app = express();
const PORT = process.env.PORT || 3001;

// Setup SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Send email endpoint
app.post("/api/send-email", async (req, res) => {
  try {
    const { to, subject, html, text } = req.body;

    // Validate
    if (!to || !subject || !html) {
      return res.status(400).json({
        error: "Missing required fields: to, subject, html",
      });
    }

    // Send email
    await sgMail.send({
      to,
      from: process.env.FROM_EMAIL || "no-reply@medcure.com",
      subject,
      html,
      text,
    });

    res.json({ success: true, message: "Email sent successfully" });
  } catch (error) {
    console.error("Email send error:", error);
    res.status(500).json({
      error: "Failed to send email",
      details: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Email server running on port ${PORT}`);
});
```

**Deploy to:**

- Railway.app (FREE)
- Render.com (FREE)
- Vercel Serverless Functions (FREE)
- Netlify Functions (FREE)

---

## 📊 Comparison Table

| Solution                    | Setup Time | Cost       | Difficulty | Best For     |
| --------------------------- | ---------- | ---------- | ---------- | ------------ |
| **Supabase Edge Functions** | 10 min     | FREE       | Easy       | ⭐ Most apps |
| **Webhooks + Zapier**       | 5 min      | FREE\*     | Very Easy  | Quick MVP    |
| **Node.js Backend**         | 30 min     | FREE-$7/mo | Medium     | Large scale  |

\*100 emails/month free on Zapier

---

## 🎯 My Recommendation for You

### Use **Supabase Edge Functions** because:

1. ✅ You're already using Supabase
2. ✅ Completely FREE
3. ✅ No separate server to manage
4. ✅ Secure (API keys hidden)
5. ✅ Easy to debug
6. ✅ Auto-scales

---

## 🚀 Quick Start: Get Email Working in 10 Minutes

### Step-by-Step Checklist:

- [ ] Get SendGrid free account → [sendgrid.com](https://sendgrid.com) (100 emails/day FREE)
- [ ] Get your API key from SendGrid dashboard
- [ ] Install Supabase CLI: `npm install -g supabase`
- [ ] Login: `supabase login`
- [ ] Create Edge Function folder (see Solution 1)
- [ ] Copy the Edge Function code above
- [ ] Deploy: `supabase functions deploy send-notification-email`
- [ ] Set secrets: `supabase secrets set SENDGRID_API_KEY=your_key`
- [ ] Update your `EmailService.js` (code above)
- [ ] Test it!

---

## 📧 Email Templates for Your Notifications

### Low Stock Email Template

```javascript
// In NotificationService.js - update sendEmailNotification method
generateLowStockEmail(notification, userName) {
  const { productName, currentStock, reorderLevel } = notification.metadata;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
        .alert-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
        .stock-info { background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .action-btn { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚠️ Low Stock Alert</h1>
          <p>MedCure Pharmacy Notification System</p>
        </div>

        <div class="content">
          <p>Hi ${userName},</p>

          <div class="alert-box">
            <strong>Action Required:</strong> The following product is running low on stock.
          </div>

          <div class="stock-info">
            <h2 style="margin: 0 0 10px 0; color: #111827;">📦 ${productName}</h2>
            <p style="margin: 5px 0;"><strong>Current Stock:</strong> ${currentStock} pieces</p>
            <p style="margin: 5px 0;"><strong>Reorder Level:</strong> ${reorderLevel} pieces</p>
            <p style="margin: 5px 0; color: #dc2626;">
              <strong>Status:</strong> ${currentStock <= reorderLevel * 0.3 ? '🚨 CRITICAL' : '⚠️ Low'}
            </p>
          </div>

          <p><strong>Recommended Action:</strong> Please reorder this product as soon as possible to avoid stockouts.</p>

          <a href="${import.meta.env.VITE_APP_URL}/inventory?product=${notification.metadata.productId}"
             class="action-btn">
            View in Inventory →
          </a>

          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            This is an automated notification from MedCure Pharmacy Management System.
            If you need assistance, please contact your system administrator.
          </p>
        </div>

        <div class="footer">
          <p>© ${new Date().getFullYear()} MedCure Pharmacy. All rights reserved.</p>
          <p>You received this email because you're an admin/manager at MedCure Pharmacy.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
```

### Expiring Soon Email Template

```javascript
generateExpiringProductEmail(notification, userName) {
  const { productName, expiryDate, daysRemaining } = notification.metadata;
  const isCritical = daysRemaining <= 7;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        /* Same styles as above */
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header" style="background: ${isCritical ? '#dc2626' : '#f59e0b'};">
          <h1>${isCritical ? '🚨' : '📅'} Product Expiration Alert</h1>
          <p>MedCure Pharmacy Notification System</p>
        </div>

        <div class="content">
          <p>Hi ${userName},</p>

          <div class="alert-box" style="background: ${isCritical ? '#fee2e2' : '#fef3c7'};
                                        border-color: ${isCritical ? '#dc2626' : '#f59e0b'};">
            <strong>${isCritical ? 'URGENT:' : 'Notice:'}</strong>
            A product is expiring ${isCritical ? 'very soon' : 'soon'}.
          </div>

          <div class="stock-info">
            <h2 style="margin: 0 0 10px 0; color: #111827;">💊 ${productName}</h2>
            <p style="margin: 5px 0;"><strong>Expiry Date:</strong> ${expiryDate}</p>
            <p style="margin: 5px 0; color: ${isCritical ? '#dc2626' : '#f59e0b'};">
              <strong>Days Remaining:</strong> ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}
            </p>
          </div>

          <p><strong>Recommended Actions:</strong></p>
          <ul>
            <li>Prioritize selling this product</li>
            <li>Move to front of shelf (FEFO - First Expiry, First Out)</li>
            <li>Consider promotional pricing if needed</li>
            ${isCritical ? '<li><strong>Urgent:</strong> Plan removal if unsold before expiry</li>' : ''}
          </ul>

          <a href="${import.meta.env.VITE_APP_URL}/inventory?product=${notification.metadata.productId}"
             class="action-btn">
            View Product Details →
          </a>

          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            This is an automated notification to help you manage product expiration dates effectively.
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
```

---

## 🧪 Testing Your Email Setup

```javascript
// Add this to your app for testing
window.testEmail = async () => {
  const result = await emailService.send({
    to: "your-email@example.com", // Change this!
    subject: "🧪 Test Email from MedCure",
    html: `
      <h1>Success! 🎉</h1>
      <p>Your email system is working correctly.</p>
      <p>Time: ${new Date().toLocaleString()}</p>
    `,
  });

  console.log("Email test result:", result);
  return result;
};

// Then in browser console:
// testEmail()
```

---

## 💰 Cost Breakdown

### SendGrid (Recommended):

- **FREE Tier**: 100 emails/day (3,000/month)
- **Essentials**: $19.95/mo for 50,000 emails
- Perfect for pharmacy needs!

### Alternatives:

- **Resend**: 3,000 emails/month FREE, then $20/mo
- **Mailgun**: 5,000 emails/month FREE
- **AWS SES**: $0.10 per 1,000 emails (cheapest for high volume)

---

## ✅ Final Checklist

Once email is working, your notifications will:

- [x] Show in-app (already working)
- [x] Store in database (already working)
- [x] Send real-time updates (already working)
- [ ] **Send email for critical alerts** ← What we're adding
- [ ] Send email for low stock
- [ ] Send email for expiring products
- [ ] Send email for system errors

---

## 🆘 Troubleshooting

### "Email not sending"

- ✅ Check Supabase Edge Function logs: `supabase functions logs send-notification-email`
- ✅ Verify SendGrid API key is correct
- ✅ Check SendGrid dashboard for errors

### "CORS error"

- ✅ Make sure you're using Edge Function, NOT direct SendGrid API
- ✅ Check Edge Function has CORS headers

### "403 Forbidden from SendGrid"

- ✅ Verify your SendGrid account (need to verify domain/single sender)
- ✅ Check API key permissions (needs "Mail Send" permission)

---

## 🎓 Want Me to Set It Up?

I can help you implement Solution 1 (Supabase Edge Functions) right now! Just let me know and I'll:

1. Create the Edge Function files
2. Update your EmailService.js
3. Give you the exact deployment commands
4. Help you test it

Ready to make emails work? Let's do it! 🚀
