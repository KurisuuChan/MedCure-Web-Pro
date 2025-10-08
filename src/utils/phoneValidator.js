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
  
  // Globe/Smart/Sun prefixes for validation
  static validPrefixes = [
    '0905', '0906', '0915', '0916', '0917', '0926', '0927', '0935', '0936', '0937', '0938', '0939', // Globe
    '0907', '0908', '0909', '0910', '0912', '0918', '0919', '0920', '0921', '0928', '0929', '0939', // Smart
    '0922', '0923', '0924', '0925', '0931', '0932', '0933', '0934', '0940', '0941', '0942', '0943', // Sun
    '0813', '0817', '0904', '0994', '0992', '0998' // Other networks
  ];

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
   * Check if phone number has valid network prefix
   */
  static hasValidPrefix(phone) {
    if (!phone) return false;
    
    const normalized = this.normalizePhone(phone);
    if (normalized.length !== 11) return false;
    
    const prefix = normalized.substring(0, 4);
    return this.validPrefixes.includes(prefix);
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

    // Check network prefix (optional - for better UX)
    if (!this.hasValidPrefix(phone)) {
      return {
        isValid: true, // Still valid format, just unknown network
        message: 'Valid format but unknown network provider',
        type: 'warning'
      };
    }

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
   * Get network provider name
   */
  static getNetworkProvider(phone) {
    if (!phone) return 'Unknown';
    
    const normalized = this.normalizePhone(phone);
    if (normalized.length !== 11) return 'Unknown';
    
    const prefix = normalized.substring(0, 4);
    
    const globePrefixes = ['0905', '0906', '0915', '0916', '0917', '0926', '0927', '0935', '0936', '0937', '0938', '0939'];
    const smartPrefixes = ['0907', '0908', '0909', '0910', '0912', '0918', '0919', '0920', '0921', '0928', '0929'];
    const sunPrefixes = ['0922', '0923', '0924', '0925', '0931', '0932', '0933', '0934', '0940', '0941', '0942', '0943'];
    
    if (globePrefixes.includes(prefix)) return 'Globe';
    if (smartPrefixes.includes(prefix)) return 'Smart';
    if (sunPrefixes.includes(prefix)) return 'Sun';
    
    return 'Other';
  }
}

// Export default for convenience
export default PhoneValidator;