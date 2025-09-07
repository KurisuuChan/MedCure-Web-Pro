// Form validation utilities

/**
 * Validate email format
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate Philippine phone number
 */
export function isValidPhoneNumber(phone) {
  // Supports various Filipino phone number formats
  const phoneRegex = /^(\+63|0)?[9]\d{9}$/;
  return phoneRegex.test(phone.replace(/[\s-()]/g, ""));
}

/**
 * Validate required field
 */
export function isRequired(value) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

/**
 * Validate minimum length
 */
export function hasMinLength(value, minLength) {
  return String(value || "").length >= minLength;
}

/**
 * Validate maximum length
 */
export function hasMaxLength(value, maxLength) {
  return String(value || "").length <= maxLength;
}

/**
 * Validate number range
 */
export function isInRange(value, min, max) {
  const num = parseFloat(value);
  return !isNaN(num) && num >= min && num <= max;
}

/**
 * Validate barcode format (common formats)
 */
export function isValidBarcode(barcode) {
  if (!barcode) return false;

  // Common barcode lengths: UPC-A (12), EAN-13 (13), Code-128 (variable)
  const cleanBarcode = barcode.replace(/\s/g, "");
  return /^\d{8,14}$/.test(cleanBarcode);
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const errors = [];

  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }

  if (!hasUpperCase) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!hasLowerCase) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!hasNumbers) {
    errors.push("Password must contain at least one number");
  }

  if (!hasSpecialChar) {
    errors.push("Password must contain at least one special character");
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength: calculatePasswordStrength(password),
  };
}

/**
 * Calculate password strength score
 */
function calculatePasswordStrength(password) {
  let score = 0;

  // Length
  if (password.length >= 8) score += 25;
  if (password.length >= 12) score += 25;

  // Character types
  if (/[A-Z]/.test(password)) score += 15;
  if (/[a-z]/.test(password)) score += 15;
  if (/\d/.test(password)) score += 10;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 10;

  return Math.min(score, 100);
}

/**
 * Validate form with rules
 */
export function validateForm(data, rules) {
  const errors = {};

  Object.keys(rules).forEach((field) => {
    const value = data[field];
    const fieldRules = rules[field];
    const fieldErrors = [];

    // Required validation
    if (fieldRules.required && !isRequired(value)) {
      fieldErrors.push(`${fieldRules.label || field} is required`);
    }

    // Only validate other rules if field has value
    if (isRequired(value)) {
      // Email validation
      if (fieldRules.email && !isValidEmail(value)) {
        fieldErrors.push(`${fieldRules.label || field} must be a valid email`);
      }

      // Phone validation
      if (fieldRules.phone && !isValidPhoneNumber(value)) {
        fieldErrors.push(
          `${fieldRules.label || field} must be a valid phone number`
        );
      }

      // Minimum length
      if (fieldRules.minLength && !hasMinLength(value, fieldRules.minLength)) {
        fieldErrors.push(
          `${fieldRules.label || field} must be at least ${
            fieldRules.minLength
          } characters`
        );
      }

      // Maximum length
      if (fieldRules.maxLength && !hasMaxLength(value, fieldRules.maxLength)) {
        fieldErrors.push(
          `${fieldRules.label || field} must be at most ${
            fieldRules.maxLength
          } characters`
        );
      }

      // Number range
      if (fieldRules.min !== undefined || fieldRules.max !== undefined) {
        const min = fieldRules.min ?? -Infinity;
        const max = fieldRules.max ?? Infinity;
        if (!isInRange(value, min, max)) {
          fieldErrors.push(
            `${fieldRules.label || field} must be between ${min} and ${max}`
          );
        }
      }

      // Custom validation
      if (fieldRules.validate && typeof fieldRules.validate === "function") {
        const customResult = fieldRules.validate(value, data);
        if (customResult !== true) {
          fieldErrors.push(
            customResult || `${fieldRules.label || field} is invalid`
          );
        }
      }
    }

    if (fieldErrors.length > 0) {
      errors[field] = fieldErrors;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Get first error message for a field
 */
export function getFieldError(errors, field) {
  return errors[field]?.[0] || "";
}

/**
 * Check if field has error
 */
export function hasFieldError(errors, field) {
  return Boolean(errors[field]?.length);
}
