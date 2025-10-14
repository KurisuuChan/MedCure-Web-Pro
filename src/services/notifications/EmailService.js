/**
 * ============================================================================
 * EmailService - Email Provider Abstraction Layer
 * ============================================================================
 *
 * A flexible email service that supports multiple providers:
 * - SendGrid (recommended for production)
 * - Resend (modern alternative)
 * - SMTP (fallback option)
 *
 * Features:
 * - Automatic provider selection based on environment variables
 * - Configuration validation
 * - Error handling with detailed logging
 * - Graceful degradation when email is unavailable
 *
 * @version 1.0.0
 * @date 2025-10-05
 */

/**
 * Supported email providers
 */
const EMAIL_PROVIDER = {
  FORMSUBMIT: "formsubmit", // Primary: No signup required, no CORS issues
  RESEND: "resend", // Alternative: Production-grade service
  SENDGRID: "sendgrid", // Alternative: Enterprise option
  NONE: "none",
};

class EmailService {
  constructor() {
    this.provider = null;
    this.apiKey = null;
    this.fromEmail = null;
    this.fromName = "MedCure Pharmacy";
    this.isConfigured = false;

    // Initialize provider
    this.initializeProvider();
  }

  /**
   * Initialize email provider based on environment variables
   */
  initializeProvider() {
    try {
      // Check for FormSubmit (Primary - No signup required, no CORS)
      if (import.meta.env.VITE_FORMSUBMIT_EMAIL) {
        this.provider = EMAIL_PROVIDER.FORMSUBMIT;
        this.fromEmail = import.meta.env.VITE_FORMSUBMIT_EMAIL;
        this.fromName =
          import.meta.env.VITE_FORMSUBMIT_FROM_NAME || this.fromName;
        this.isConfigured = true;
        console.log("✅ EmailService configured with FormSubmit");
        return;
      }

      // Check for Resend (Production ready)
      if (import.meta.env.VITE_RESEND_API_KEY) {
        this.provider = EMAIL_PROVIDER.RESEND;
        this.apiKey = import.meta.env.VITE_RESEND_API_KEY;
        this.fromEmail =
          import.meta.env.VITE_RESEND_FROM_EMAIL || "onboarding@resend.dev";
        this.fromName = import.meta.env.VITE_RESEND_FROM_NAME || this.fromName;
        this.isConfigured = true;
        console.log("✅ EmailService configured with Resend");
        return;
      }

      // Check for SendGrid
      if (import.meta.env.VITE_SENDGRID_API_KEY) {
        this.provider = EMAIL_PROVIDER.SENDGRID;
        this.apiKey = import.meta.env.VITE_SENDGRID_API_KEY;
        this.fromEmail =
          import.meta.env.VITE_SENDGRID_FROM_EMAIL || "no-reply@medcure.com";
        this.fromName =
          import.meta.env.VITE_SENDGRID_FROM_NAME || this.fromName;
        this.isConfigured = true;
        console.log("✅ EmailService configured with SendGrid");
        return;
      }

      // No provider configured
      this.provider = EMAIL_PROVIDER.NONE;
      this.isConfigured = false;
      console.warn(
        "⚠️ No email provider configured. Set VITE_FORMSUBMIT_EMAIL to enable notifications."
      );
    } catch (error) {
      console.error("❌ Failed to initialize EmailService:", error);
      this.provider = EMAIL_PROVIDER.NONE;
      this.isConfigured = false;
    }
  }

  /**
   * Check if email service is configured
   *
   * @returns {boolean} True if configured
   */
  isReady() {
    return this.isConfigured && this.provider !== EMAIL_PROVIDER.NONE;
  }

  /**
   * Get current provider name
   *
   * @returns {string} Provider name
   */
  getProvider() {
    return this.provider;
  }

  /**
   * Send email using configured provider
   *
   * @param {Object} params - Email parameters
   * @param {string} params.to - Recipient email address
   * @param {string} params.subject - Email subject
   * @param {string} params.html - HTML email content
   * @param {string} [params.text] - Plain text alternative
   * @returns {Promise<Object>} Result object with success flag
   */
  async send({ to, subject, html, text }) {
    try {
      // Validate inputs
      if (!to || !subject || !html) {
        throw new Error("Missing required email parameters: to, subject, html");
      }

      if (!this.isEmailValid(to)) {
        throw new Error(`Invalid email address: ${to}`);
      }

      // Check if configured
      if (!this.isReady()) {
        console.warn("⚠️ Email service not configured, email not sent");
        return {
          success: false,
          reason: "not_configured",
          message: "Email service is not configured",
        };
      }

      // Send using appropriate provider
      switch (this.provider) {
        case EMAIL_PROVIDER.FORMSUBMIT:
          return await this.sendViaFormSubmit({ to, subject, html, text });

        case EMAIL_PROVIDER.SENDGRID:
          return await this.sendViaSendGrid({ to, subject, html, text });

        case EMAIL_PROVIDER.RESEND:
          return await this.sendViaResend({ to, subject, html, text });

        default:
          return {
            success: false,
            reason: "no_provider",
            message: "No email provider configured",
          };
      }
    } catch (error) {
      console.error("❌ Failed to send email:", error);
      return {
        success: false,
        reason: "error",
        error: error.message,
      };
    }
  }

  /**
   * Send email via FormSubmit (no signup required, no CORS issues)
   * @private
   */
  async sendViaFormSubmit({ to, subject, html, text }) {
    try {
      const formData = new FormData();
      formData.append("email", to);
      formData.append("subject", `[MedCure] ${subject}`);
      formData.append(
        "message",
        text || html.replace(/<[^>]*>/g, "").replace(/&[^;]+;/g, " ")
      );
      formData.append("_next", "https://formsubmit.co/thankyou");
      formData.append("_captcha", "false");
      formData.append("_template", "table");

      const response = await fetch(`https://formsubmit.co/${this.fromEmail}`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        return {
          success: true,
          provider: "formsubmit",
          messageId: "formsubmit-" + Date.now(),
        };
      } else {
        throw new Error(
          `FormSubmit error: ${response.status} ${response.statusText}`
        );
      }
    } catch (error) {
      return {
        success: false,
        reason: "formsubmit_error",
        error: error.message,
      };
    }
  }

  /**
   * Send email via SendGrid
   * @private
   */
  async sendViaSendGrid({ to, subject, html, text }) {
    try {
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: to }],
            },
          ],
          from: {
            email: this.fromEmail,
            name: this.fromName,
          },
          subject,
          content: [
            {
              type: "text/html",
              value: html,
            },
            ...(text
              ? [
                  {
                    type: "text/plain",
                    value: text,
                  },
                ]
              : []),
          ],
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        let errorDetails;

        try {
          errorDetails = JSON.parse(errorBody);
        } catch {
          errorDetails = { message: errorBody };
        }

        throw new Error(
          `SendGrid error (${response.status}): ${
            errorDetails?.errors?.[0]?.message ||
            errorDetails.message ||
            "Unknown error"
          }`
        );
      }

      console.log("✅ Email sent successfully via SendGrid to:", to);
      return {
        success: true,
        provider: "sendgrid",
      };
    } catch (error) {
      // CORS errors are expected when calling SendGrid from browser - this is normal
      // Email sending MUST be implemented server-side (Supabase Edge Functions, etc.)
      // Silently fail to avoid console noise during development
      return {
        success: false,
        reason:
          error.message.includes("NetworkError") ||
          error.message.includes("CORS")
            ? "cors_expected"
            : "sendgrid_error",
        error: error.message,
      };
    }
  }

  /**
   * Send email via Resend (using Supabase Edge Function)
   * @private
   */
  async sendViaResend({ to, subject, html, text }) {
    try {
      // Use Supabase Edge Function to avoid CORS issues
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/send-notification-email`;

      const response = await fetch(edgeFunctionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          to,
          subject,
          html,
          ...(text ? { text } : {}),
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        let errorDetails;

        try {
          errorDetails = JSON.parse(errorBody);
        } catch {
          errorDetails = { message: errorBody };
        }

        throw new Error(
          `Email function error (${response.status}): ${
            errorDetails?.error || errorDetails?.message || "Unknown error"
          }`
        );
      }

      const data = await response.json();
      console.log(
        "✅ Email sent successfully via Supabase Edge Function to:",
        to,
        "(ID:",
        data.emailId || "unknown",
        ")"
      );

      return {
        success: true,
        provider: "resend-edge-function",
        emailId: data.emailId,
      };
    } catch (error) {
      console.error("❌ Edge function email send failed:", error);

      // Fallback: Try direct API call (will likely fail due to CORS but worth trying)
      console.log("📧 Attempting direct API fallback...");
      return await this.sendViaResendDirect({ to, subject, html, text });
    }
  }

  /**
   * Fallback: Direct Resend API call (will likely fail due to CORS)
   * @private
   */
  async sendViaResendDirect({ to, subject, html, text }) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          from: `${this.fromName} <${this.fromEmail}>`,
          to: [to],
          subject,
          html,
          ...(text ? { text } : {}),
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        let errorDetails;

        try {
          errorDetails = JSON.parse(errorBody);
        } catch {
          errorDetails = { message: errorBody };
        }

        throw new Error(
          `Resend error (${response.status}): ${
            errorDetails?.message || "Unknown error"
          }`
        );
      }

      const data = await response.json();
      console.log(
        "✅ Email sent successfully via direct Resend API to:",
        to,
        "(ID:",
        data.id,
        ")"
      );

      return {
        success: true,
        provider: "resend-direct",
        emailId: data.id,
      };
    } catch (error) {
      console.error(
        "❌ Direct Resend API failed (expected due to CORS):",
        error
      );
      return {
        success: false,
        reason:
          error.message.includes("NetworkError") ||
          error.message.includes("CORS")
            ? "cors_expected"
            : "resend_error",
        error: error.message,
      };
    }
  }

  /**
   * Validate email address format
   * @private
   */
  isEmailValid(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Test email configuration by sending a test email
   *
   * @param {string} testEmail - Email address to send test to
   * @returns {Promise<Object>} Test result
   */
  async testConfiguration(testEmail) {
    if (!testEmail) {
      throw new Error("Test email address is required");
    }

    if (!this.isReady()) {
      throw new Error("Email service is not configured or ready");
    }

    try {
      console.log(`📧 Testing email configuration - sending to ${testEmail}`);

      const result = await this.send({
        to: testEmail,
        subject: "MedCure Email Test - Configuration Verification",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Email Test</title>
          </head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 24px; text-align: center; border-radius: 8px;">
              <h1 style="margin: 0; font-size: 24px;">🏥 MedCure Pharmacy</h1>
              <p style="margin: 8px 0 0; opacity: 0.9;">Email Configuration Test</p>
            </div>
            
            <div style="padding: 24px; background: #f8fafc; margin: 16px 0; border-radius: 8px;">
              <h2 style="color: #059669; margin-top: 0;">✅ Email Test Successful!</h2>
              <p>Your MedCure email system is configured correctly and working properly.</p>
              
              <div style="background: white; padding: 16px; border-radius: 6px; margin: 16px 0;">
                <strong>Configuration Details:</strong><br>
                📧 Provider: ${this.provider}<br>
                📨 From Email: ${this.fromEmail}<br>
                👤 From Name: ${this.fromName}<br>
                🕒 Test Time: ${new Date().toLocaleString()}
              </div>
              
              <p><strong>✅ Ready to receive:</strong></p>
              <ul style="color: #374151;">
                <li>🚨 Low stock alerts</li>
                <li>❌ Out of stock warnings</li>
                <li>📅 Product expiry notifications</li>
                <li>🔄 System health updates</li>
              </ul>
            </div>
            
            <div style="text-align: center; padding: 16px; color: #6b7280; font-size: 14px;">
              © ${new Date().getFullYear()} MedCure Pharmacy Management System
            </div>
          </body>
          </html>
        `,
        text: `MedCure Email Test - SUCCESS! Your email system is working correctly. Provider: ${
          this.provider
        }, Time: ${new Date().toLocaleString()}`,
      });

      if (result.success) {
        console.log("✅ Email test successful:", result);
        return {
          success: true,
          message: `Test email sent successfully to ${testEmail}`,
          provider: this.provider,
          timestamp: new Date().toISOString(),
          details: result,
        };
      } else {
        console.error("❌ Email test failed:", result);
        return {
          success: false,
          message: `Test email failed: ${result.error}`,
          provider: this.provider,
          timestamp: new Date().toISOString(),
          error: result.error,
        };
      }
    } catch (error) {
      console.error("❌ Email test error:", error);
      return {
        success: false,
        message: `Test email error: ${error.message}`,
        provider: this.provider,
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  /**
   * Get current configuration status
   *
   * @returns {Object} Configuration details
   */
  getStatus() {
    return {
      isConfigured: this.isConfigured,
      provider: this.provider,
      fromEmail: this.fromEmail,
      fromName: this.fromName,
      ready: this.isReady(),
    };
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const emailService = new EmailService();
export { EMAIL_PROVIDER };
export default emailService;
