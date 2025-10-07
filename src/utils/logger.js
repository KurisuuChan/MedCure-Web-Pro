/**
 * ============================================================================
 * Logger Utility - Environment-Aware Logging
 * ============================================================================
 *
 * A production-ready logging utility that:
 * - Only shows debug/info logs in development
 * - Always logs warnings and errors
 * - Integrates with error monitoring (Sentry, LogRocket, etc.)
 * - Reduces console noise in production
 * - Improves performance in production
 *
 * Usage:
 *   import { logger } from './utils/logger';
 *
 *   logger.debug('Debug message', data);
 *   logger.info('Info message', data);
 *   logger.warn('Warning message', data);
 *   logger.error('Error message', error);
 *
 * @version 1.0.0
 * @date 2025-10-07
 */

// Detect environment
const isDevelopment =
  import.meta.env?.DEV || import.meta.env?.MODE === "development";

const isProduction = !isDevelopment;

/**
 * Logger utility with environment-aware log levels
 */
export const logger = {
  /**
   * Debug logs (only in development)
   * Use for: Detailed debugging information, flow tracking
   */
  debug: (...args) => {
    if (isDevelopment) {
      console.log("🔍", ...args);
    }
  },

  /**
   * Info logs (only in development)
   * Use for: General information, state changes
   */
  info: (...args) => {
    if (isDevelopment) {
      console.info("ℹ️", ...args);
    }
  },

  /**
   * Warning logs (always logged)
   * Use for: Unexpected behavior that doesn't break functionality
   */
  warn: (...args) => {
    console.warn("⚠️", ...args);

    // Log to monitoring service in production
    if (isProduction && window.Sentry) {
      try {
        window.Sentry.captureMessage(args.join(" "), "warning");
      } catch {
        // Fail silently - don't break app if Sentry fails
      }
    }
  },

  /**
   * Error logs (always logged)
   * Use for: Errors, exceptions, failures
   */
  error: (...args) => {
    console.error("❌", ...args);

    // Log to monitoring service
    if (window.Sentry) {
      try {
        // If first arg is an Error object, capture it
        if (args[0] instanceof Error) {
          window.Sentry.captureException(args[0], {
            extra: {
              additionalContext: args.slice(1),
            },
          });
        } else {
          // Otherwise create a new Error with the message
          window.Sentry.captureException(new Error(args.join(" ")));
        }
      } catch {
        // Fail silently
      }
    }
  },

  /**
   * Success logs (only in development)
   * Use for: Successful operations, confirmations
   */
  success: (...args) => {
    if (isDevelopment) {
      console.log("✅", ...args);
    }
  },

  /**
   * Group start (only in development)
   * Use for: Grouping related logs together
   */
  group: (label) => {
    if (isDevelopment) {
      console.group(`📦 ${label}`);
    }
  },

  /**
   * Group end (only in development)
   */
  groupEnd: () => {
    if (isDevelopment) {
      console.groupEnd();
    }
  },

  /**
   * Table logging (only in development)
   * Use for: Displaying structured data
   */
  table: (data) => {
    if (isDevelopment) {
      console.table(data);
    }
  },

  /**
   * Performance timing (only in development)
   * Use for: Measuring operation duration
   */
  time: (label) => {
    if (isDevelopment) {
      console.time(`⏱️ ${label}`);
    }
  },

  /**
   * Performance timing end (only in development)
   */
  timeEnd: (label) => {
    if (isDevelopment) {
      console.timeEnd(`⏱️ ${label}`);
    }
  },

  /**
   * Check if in development mode
   */
  isDevelopment: () => isDevelopment,

  /**
   * Check if in production mode
   */
  isProduction: () => isProduction,
};

/**
 * Alias for backward compatibility
 */
export default logger;
