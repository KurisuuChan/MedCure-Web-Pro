// =============================================================================
// PHONE NUMBER VALIDATION UTILITY
// =============================================================================
// Purpose: Standardized phone number validation for Philippine mobile numbers
// Date: October 8, 2025
// Author: System Developer
// =============================================================================

/**
 * Philippine mobile number patterns:
 * - 09XXXXXXXXX (standard format)
 * - +639XXXXXXXXX (international format)
 * - 639XXXXXXXXX (international without +)
 * - 9XXXXXXXXX (without country code/leading zero)
 */

export class PhoneValidator {
  // Philippine mobile number regex
  static phoneRegex = /^(\+63|63|0)?[9]\d{9}$/;
  
  // Network prefixes removed - validation simplified

  /**
   * Clean phone number by removing spaces, dashes, parentheses, dots
   */
  static cleanPhone(phone) {
    if (!phone) return '';
    return phone.replace(/[\s\-\(\)\.]/g, '');
  }

  /**
   * Normalize phone number to standard format (09XXXXXXXXX)
   */
  static normalizePhone(phone) {
    if (!phone) return '';
    
    const cleaned = this.cleanPhone(phone);
    
    // If starts with +63, replace with 0
    if (cleaned.startsWith('+63')) {
      return '0' + cleaned.substring(3);
    }
    
    // If starts with 63, replace with 0
    if (cleaned.startsWith('63') && cleaned.length === 12) {
      return '0' + cleaned.substring(2);
    }
    
    // If starts with 9 and is 10 digits, add 0
    if (cleaned.startsWith('9') && cleaned.length === 10) {
      return '0' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Validate Philippine mobile number
   */
  static isValidPhone(phone) {
    if (!phone) return false;
    
    const cleaned = this.cleanPhone(phone);
    return this.phoneRegex.test(cleaned);
  }

  /**
   * Check if phone number has valid network prefix (disabled)
   */
  static hasValidPrefix(phone) {
    // Network prefix validation disabled - always return true for valid format
    return this.isValidPhone(phone);
  }

  /**
   * Get validation result with message
   */
  static validatePhone(phone) {
    if (!phone) {
      return {
        isValid: false,
        message: '',
        type: 'neutral'
      };
    }

    const cleaned = this.cleanPhone(phone);
    const normalized = this.normalizePhone(phone);
    
    // Check basic format
    if (!this.isValidPhone(phone)) {
      return {
        isValid: false,
        message: 'Please enter a valid Philippine mobile number (e.g., 09123456789)',
        type: 'error'
      };
    }

    // Network provider validation removed - accept any valid format
    return {
      isValid: true,
      message: 'Valid Philippine mobile number',
      type: 'success'
    };
  }

  /**
   * Format phone number for display
   */
  static formatPhone(phone) {
    if (!phone) return '';
    
    const normalized = this.normalizePhone(phone);
    if (normalized.length !== 11) return phone;
    
    // Format as 0912 345 6789
    return `${normalized.substring(0, 4)} ${normalized.substring(4, 7)} ${normalized.substring(7)}`;
  }

  /**
   * Get network provider name (disabled - returns neutral response)
   */
  static getNetworkProvider(phone) {
    // Network provider detection disabled
    return '';
  }
}

// Export default for convenience
export default PhoneValidator;