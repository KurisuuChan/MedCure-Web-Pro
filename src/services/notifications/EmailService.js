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
  SENDGRID: "sendgrid",
  RESEND: "resend",
  SMTP: "smtp",
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

      // Check for Resend
      if (import.meta.env.VITE_RESEND_API_KEY) {
        this.provider = EMAIL_PROVIDER.RESEND;
        this.apiKey = import.meta.env.VITE_RESEND_API_KEY;
        this.fromEmail =
          import.meta.env.VITE_RESEND_FROM_EMAIL || "no-reply@medcure.com";
        this.fromName = import.meta.env.VITE_RESEND_FROM_NAME || this.fromName;
        this.isConfigured = true;
        console.log("✅ EmailService configured with Resend");
        return;
      }

      // No provider configured
      this.provider = EMAIL_PROVIDER.NONE;
      this.isConfigured = false;
      console.warn(
        "⚠️ EmailService: No email provider configured. Emails will not be sent."
      );
      console.warn("⚠️ To enable emails, set one of:");
      console.warn("   - VITE_SENDGRID_API_KEY & VITE_SENDGRID_FROM_EMAIL");
      console.warn("   - VITE_RESEND_API_KEY & VITE_RESEND_FROM_EMAIL");
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
   * Send email via Resend
   * @private
   */
  async sendViaResend({ to, subject, html, text }) {
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
        "✅ Email sent successfully via Resend to:",
        to,
        "(ID:",
        data.id,
        ")"
      );

      return {
        success: true,
        provider: "resend",
        emailId: data.id,
      };
    } catch (error) {
      console.error("❌ Resend send failed:", error);
      return {
        success: false,
        reason: "resend_error",
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
   * Test email configuration
   * Sends a test email to verify setup
   *
   * @param {string} testEmail - Email address to send test to
   * @returns {Promise<Object>} Result object
   */
  async testConfiguration(testEmail) {
    if (!this.isReady()) {
      return {
        success: false,
        message:
          "Email service is not configured. Check your environment variables.",
      };
    }

    const testResult = await this.send({
      to: testEmail,
      subject: "[MedCure] Email Configuration Test",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Configuration Test</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f3f4f6; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 32px 24px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
            .content { padding: 32px 24px; }
            .success-icon { font-size: 48px; text-align: center; margin-bottom: 24px; }
            .message { font-size: 16px; text-align: center; color: #4b5563; }
            .details { background: #f9fafb; padding: 16px; border-radius: 8px; margin-top: 24px; font-size: 14px; color: #6b7280; }
            .footer { text-align: center; padding: 24px; background: #f9fafb; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏥 MedCure Pharmacy</h1>
            </div>
            
            <div class="content">
              <div class="success-icon">✅</div>
              <p class="message">
                <strong>Success!</strong><br>
                Your email configuration is working correctly.
              </p>
              
              <div class="details">
                <strong>Provider:</strong> ${this.provider}<br>
                <strong>From:</strong> ${this.fromName} &lt;${
        this.fromEmail
      }&gt;<br>
                <strong>Time:</strong> ${new Date().toLocaleString()}
              </div>
            </div>
            
            <div class="footer">
              <p>This is a test email from MedCure Pharmacy Notification System.</p>
              <p>© ${new Date().getFullYear()} MedCure Pharmacy. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Email Configuration Test\n\nSuccess! Your email configuration is working correctly.\n\nProvider: ${
        this.provider
      }\nFrom: ${this.fromName} <${
        this.fromEmail
      }>\nTime: ${new Date().toLocaleString()}`,
    });

    if (testResult.success) {
      return {
        success: true,
        message: `Test email sent successfully via ${this.provider} to ${testEmail}`,
      };
    } else {
      return {
        success: false,
        message: `Failed to send test email: ${
          testResult.error || testResult.reason
        }`,
      };
    }
  }

  /**
   * Get configuration status
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
