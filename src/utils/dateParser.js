/**
 * Flexible date parsing utility for import functionality
 * Supports multiple date formats: YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, MM/DD/YYYY
 */

/**
 * Parse a date string in various formats and return a standardized Date object
 * @param {string} dateString - The date string to parse
 * @returns {Object} - { isValid: boolean, date: Date|null, isoString: string|null }
 */
export function parseFlexibleDate(dateString) {
  if (!dateString || dateString.trim() === "") {
    return { isValid: true, date: null, isoString: null }; // Empty dates are allowed
  }

  const cleanDate = dateString.trim();
  let parsedDate = null;

  // Try different date formats
  const formats = [
    // ISO format: YYYY-MM-DD (preferred)
    {
      regex: /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
      parser: (match) => new Date(match[1], match[2] - 1, match[3]),
    },
    // European format: DD/MM/YYYY
    {
      regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
      parser: (match) => new Date(match[3], match[2] - 1, match[1]),
    },
    // European format with dashes: DD-MM-YYYY
    {
      regex: /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
      parser: (match) => new Date(match[3], match[2] - 1, match[1]),
    },
    // US format: MM/DD/YYYY
    {
      regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
      parser: (match) => new Date(match[3], match[1] - 1, match[2]),
    },
    // Dot format: DD.MM.YYYY
    {
      regex: /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/,
      parser: (match) => new Date(match[3], match[2] - 1, match[1]),
    },
  ];

  // Try each format
  for (const format of formats) {
    const match = cleanDate.match(format.regex);
    if (match) {
      try {
        parsedDate = format.parser(match);

        // Validate the date is actually valid (not NaN)
        if (!isNaN(parsedDate.getTime())) {
          // Additional validation: check if the parsed date components match input
          const year = parseInt(match[3] || match[1]);
          const month = parseInt(match[2]);
          const day = parseInt(match[1] || match[3]);

          // Basic range validation
          if (
            year >= 1900 &&
            year <= 2100 &&
            month >= 1 &&
            month <= 12 &&
            day >= 1 &&
            day <= 31
          ) {
            break;
          }
        }
        parsedDate = null;
      } catch {
        parsedDate = null;
      }
    }
  }

  // If no format worked, try native Date parsing as fallback
  if (!parsedDate) {
    try {
      parsedDate = new Date(cleanDate);
      if (isNaN(parsedDate.getTime())) {
        parsedDate = null;
      }
    } catch {
      parsedDate = null;
    }
  }

  const isValid = parsedDate !== null;
  const isoString = isValid ? parsedDate.toISOString().split("T")[0] : null;

  return {
    isValid,
    date: parsedDate,
    isoString,
  };
}

/**
 * Validate if a date is not in the past (for expiry date validation)
 * @param {Date} date - The date to validate
 * @returns {boolean} - True if date is today or in the future
 */
export function isDateNotInPast(date) {
  if (!date) return true; // Null dates are allowed

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to start of day for comparison

  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  return checkDate >= today;
}

/**
 * Get user-friendly error message for date validation
 * @param {string} dateString - The original date string
 * @returns {string} - Error message with format suggestions
 */
export function getDateFormatErrorMessage(dateString) {
  return `Invalid date format "${dateString}". Supported formats: YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, or MM/DD/YYYY`;
}

/**
 * Get suggested date formats for user guidance
 * @returns {Array} - Array of example date formats
 */
export function getSupportedDateFormats() {
  return [
    {
      format: "YYYY-MM-DD",
      example: "2025-12-31",
      description: "ISO format (recommended)",
    },
    {
      format: "DD/MM/YYYY",
      example: "31/12/2025",
      description: "European format",
    },
    {
      format: "DD-MM-YYYY",
      example: "31-12-2025",
      description: "European with dashes",
    },
    { format: "MM/DD/YYYY", example: "12/31/2025", description: "US format" },
    {
      format: "DD.MM.YYYY",
      example: "31.12.2025",
      description: "Dot notation",
    },
  ];
}
